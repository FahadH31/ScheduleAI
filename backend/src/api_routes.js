const express = require('express');
const ratelimit = require('express-rate-limit')
const axios = require('axios');
const date = require('date-and-time');
const { oAuth2Client } = require('./authentication');
const { openaiClient } = require('./authentication');
const { getUpcomingEvents } = require('./functions/calendar_functions');
const { tools } = require('./functions/function_schema');
const { callFunction } = require('./functions/openai_functions');
const { CONVERSATION_HISTORY_LENGTH } = require('./constants');

const router = express.Router();

// Rate limit config
const limiter = ratelimit({
  windowMs: 15 * 60 * 1000,
  limit: 25,
  message: {
    success: false,
    error: "You're sending messages too fast. Please wait a few minutes before trying again."
  },
  standardHeaders: true,
  legacyHeaders: false,
  ipv6Subnet: 56,
})

// Authentication Check Route
router.get("/api/check-auth", (req, res) => {
  if (req.session && req.session.tokens) {
    res.status(200).json({ authenticated: true });
  } else {
    res.status(401).json({ authenticated: false });
  }
});


// Logout Route
router.post("/api/logout", (req, res) => {
  req.session.destroy();
  res.clearCookie('connect.sid');
  res.json({ success: true });
});


// Google Authentication Route
router.post("/api/google-auth", async (req, res) => {
  const { tokens } = await oAuth2Client.getToken(req.body.tokenResponse); // Exchange auth code for tokens  
  oAuth2Client.setCredentials(tokens);
  req.session.tokens = tokens; // stores token object in server-side session

  // get user email
  const userInfoResponse = await axios.get(
    'https://www.googleapis.com/oauth2/v3/userinfo',
    {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`
      }
    }
  );
  const email = userInfoResponse.data.email;

  res.status(200).json({ success: true, email: email });
});


// OpenAI Chat Route
router.post("/api/openai", limiter, async (req, res) => {
  // Initialize variables
  if (!req.session.conversationHistory) {
    req.session.conversationHistory = [];
  }
  if (!req.session.deletedEventsCache) {
    req.session.deletedEventsCache = [];
  }
  if (!req.session.tokens) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  var calendarAction = "OTHER"
  const access_token = req.session.tokens.access_token;


  // Retrieve and validate user prompt
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== "string") {
    return res
      .status(400)
      .json({ success: false, error: "Invalid or missing 'prompt' field" });
  }
  if (prompt.length > 500) {
    return res
      .status(400)
      .json({ success: false, error: "Prompt too long. Please ensure your entered message is less than 500 characters." });
  }
  req.session.conversationHistory.push({ role: "user", content: prompt }); // Add the user input to the conversation history

  // Limit length of the conversation history
  if (req.session.conversationHistory.length > CONVERSATION_HISTORY_LENGTH) {
    req.session.conversationHistory.shift(); // remove the oldest message
  }

  // Get the current date/time/timezone.
  var currentDate = new Date();
  currentDate = date.format(currentDate, 'hh:mm A ddd, MMM DD YYYY');
  var timeZone = req.header("User-TimeZone");

  // Store upcoming events to provide in OpenAI call.
  var upcomingEvents = await getUpcomingEvents(access_token);
  upcomingEvents = JSON.stringify(upcomingEvents);

  try {
    // AI call to select the tool to use.
    const toolSelectionCompletion = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
          You are a logic engine used to help a user interact with their Google Calendar. 
          Your only goal is to use the provided tools to fulfill the user's request/message. 
          If no tool is needed or further details are needed, respond with text that states this.
          - The current date/time is ${currentDate}.
          - The user's timezone is ${timeZone}
          - Information on the user's upcoming schedule: ${upcomingEvents}. 
          `
        },
        ...req.session.conversationHistory
      ],
      tools: tools,
      max_completion_tokens: 500,
    });

    const toolSelectionResult = toolSelectionCompletion.choices[0].message
    console.log(`Tool Selection Result: ${JSON.stringify(toolSelectionResult)}`)
    req.session.conversationHistory.push(toolSelectionResult); // add the assistant message that requested tool call into convo history

    // If tools returned by the API call, collect them and call the appropriate function
    if (toolSelectionResult.tool_calls) {
      for (const toolCall of toolSelectionCompletion.choices[0].message.tool_calls) { // loop through and call the function associated w each tool
        const name = toolCall.function.name;
        calendarAction = name; // update calendarAction
        const args = JSON.parse(toolCall.function.arguments);
        const result = await callFunction(access_token, name, args)
        console.log(`Called function: ${name} with result: ${JSON.stringify(result)}`)
        req.session.conversationHistory.push({ // add results of this tool call into convo history
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result)
        })
      }
    }

    // AI call for in-chat response after function called + completed  
    const userResponseCompletion = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: ` 
          You are an assistant that handles the in-chat conversation with the user using this service to interact with their Google Calendar. 
          - The current date/time is ${currentDate}.
          - The user's timezone is ${timeZone}
          - Please provide a concise, friendly response that matches with the result of the function(s) called. Respond as if you just executed the function(s) yourself.
          - If no function was called, respond accordingly.   
          - Don't ask for another prompt from the user if the action has been performed successfully.
          - You can schedule multiple overlapping events without issue.
          - Information on the user's upcoming schedule: ${upcomingEvents}. 
            - Only refer to this information if needed per the user's request.
            - Never provide the user with their upcoming schedule data or event URLs directly in the chat.`
        },
        ...req.session.conversationHistory
      ],
      stream: true,
      max_completion_tokens: 500,
      temperature: 0.5
    });

    res.setHeader("Calendar-Action", calendarAction); // send calendar action as http header
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    for await (const chunk of userResponseCompletion) {
      if (chunk.choices[0]?.delta?.content) {
        const text = chunk.choices[0].delta.content;
        res.write(text); // Send response to frontend
      }
    }

    res.write("\n\n");
    res.end();
  }
  catch (error) {
    console.error("Operation Error:", error);
    res.status(500).json({ error: "Error processing request", details: error.message });
  }
});

module.exports = router;