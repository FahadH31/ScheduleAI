const express = require('express');
const ratelimit = require('express-rate-limit')
const axios = require('axios');
const date = require('date-and-time');
const { openaiClient, oAuthInitializer, getAuthorizedClient } = require('./authentication');
const { callFunction, getCalendarEvents, getEventsList } = require('./calendar_functions');
const { saveRefreshToken, getRefreshToken, deleteUserData } = require('./db');
const { CONVERSATION_HISTORY_LENGTH, TOOLS } = require('./constants');

const router = express.Router();

// Rate limit config
const limiter = ratelimit({
  // 50 messages every 15 mins (per IP address)
  windowMs: 15 * 60 * 1000,
  limit: 50,
  message: {
    success: false,
    error: "You're sending messages too fast. Please wait a few minutes before trying again."
  },
  standardHeaders: true,
  legacyHeaders: false,
  ipv6Subnet: 56,
})

// Clear chat route
router.post("/clear-chat-history", (req, res) => {
  req.session.conversationHistory = [];
  console.log("Conversation history cleared.")
  res.json({ success: true });
})


// Authentication Check Route
router.get("/api/check-auth", (req, res) => {
  if (req.session && req.session.tokens && req.session.email) {
    console.log("User authenticated.")
    res.status(200).json({ authenticated: true, email: req.session.email });
  } else {
    res.status(401).json({ authenticated: false });
  }
});

// Logout Route
router.post("/api/logout", (req, res) => {
  req.session.destroy();
  res.clearCookie('connect.sid');
  console.log("User successfully logged out.")
  res.status(200).json({ success: true });
});

// Data Deletion Route
router.post("/api/delete-data", async (req, res) => {

  if (req.session && req.session.tokens) {
    const token = req.session.tokens.refresh_token || req.session.tokens.access_token

    try {
      await axios.post(`https://oauth2.googleapis.com/revoke?token=${token}`, null,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded', } }
      );
      console.log("Google token successfully revoked.")
    }
    catch (error) {
      console.error("Google token revocation failed: ", error.message);
    }
  }

  if (req.session && req.session.email) {
    try {
      await deleteUserData(req.session.email);
    } catch (dbError) {
      console.error("Failed to delete user refresh token from DB:", dbError.message);
    }
  }

  req.session.destroy()
  res.clearCookie('connect.sid')
  console.log("Data destroyed and cookies cleared.")
  res.status(200).json({ success: true });

});

// Google Authentication Route
router.post("/api/google-auth", async (req, res) => {
  const auth = oAuthInitializer();
  const { tokens } = await auth.getToken(req.body.tokenResponse); // Exchange auth code for tokens  
  auth.setCredentials(tokens);

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
  req.session.email = email;

  // Store or load the refresh token via DB
  if (tokens.refresh_token) {
    await saveRefreshToken(email, tokens.refresh_token);
  } else {
    const storedRefreshToken = await getRefreshToken(email);
    if (storedRefreshToken) {
      tokens.refresh_token = storedRefreshToken;
    }
  }

  req.session.tokens = tokens; // store token object in server-side session

  res.status(200).json({ success: true, email: email });
});

// Route to get calendar events in a specific time range
router.get("/api/calendar-events", async (req, res) => {
  if (!req.session || !req.session.tokens) {
    return res.status(401).json({ success: false, error: "Not authenticated" });
  }

  let timeMin = req.query.timeMin;
  let timeMax = req.query.timeMax;

  const parsedTimeMin = new Date(timeMin);
  if (isNaN(parsedTimeMin.getTime())) {
    timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  } else {
    timeMin = parsedTimeMin.toISOString();
  }

  const parsedTimeMax = new Date(timeMax);
  if (isNaN(parsedTimeMax.getTime())) {
    timeMax = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
  } else {
    timeMax = parsedTimeMax.toISOString();
  }


  try {
    const auth = getAuthorizedClient(req.session.tokens, (newTokens) => {
      req.session.tokens = { ...req.session.tokens, ...newTokens };
      req.session.save((err) => {
        if (err) console.error("Session save error during token refresh:", err);
      });
    });
    const events = await getEventsList(auth, timeMin, timeMax);
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.json({ success: true, events });
  } catch (error) {
    console.error("Error in calendar-events route:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});



// OpenAI Chat Route
router.post("/api/openai", limiter, async (req, res) => {
  // Initialize variables
  if (!req.session.conversationHistory) {
    req.session.conversationHistory = [];
  }
  if (!req.session.undoStack) {
    req.session.undoStack = []
  }
  if (!req.session.tokens) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  var calendarAction = "OTHER"

  // Setup client and handle automatic token updates
  const auth = getAuthorizedClient(req.session.tokens, (newTokens) => {
    req.session.tokens = { ...req.session.tokens, ...newTokens };
    req.session.save((err) => {
      if (err) console.error("Session save error during chat token refresh:", err);
    });
  });


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
  const history = req.session.conversationHistory
  while (history.length > CONVERSATION_HISTORY_LENGTH) { // prune to maximum convo history length
    req.session.conversationHistory.shift()
  }
  while (history.length > 0 &&
    (history[0].role === 'tool' || (history[0].role === 'assistant' && history[0].tool_calls))) { // ensure no stray tool calls or assistant messages are left in the convo history
    history.shift();
  }

  // Get the current date/time/timezone.
  var currentDate = new Date();
  currentDate = date.format(currentDate, 'hh:mm A ddd, MMM DD YYYY');
  var timeZone = req.header("User-TimeZone");

  // Store upcoming events to provide in OpenAI call.
  const upcomingEvents = JSON.stringify(await getCalendarEvents(auth));

  let allPromptUndos = [];
  let hasToolCalls = true;
  let loopCount = 0;
  const maxLoops = 3; // Prevent infinite tool loops

  try {
    while (hasToolCalls && loopCount < maxLoops) {
      // AI call to select the tool to use.
      const toolSelectionCompletion = await openaiClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
            You are a logic engine used to help a user interact (create/update/delete events) with their Google Calendar. 
            Your only goal is to use the provided tools to fulfill the user's latest message. 
            For create requests, fill details intelligently as you deem suitable. DO NOT ask the user for missing details unless absolutely necessary; instead, make reasonable assumptions (e.g., default 1-hour duration, use their local timezone).
            For travel/flights, DO NOT attempt to calculate the exact flight duration or destination timezones. Instead, simply schedule a short event (e.g., 1 hour) marking the departure time in the user's local timezone.
            If no tool is needed, respond with text that states so. Following is data you can use to guide your tool calls: 
            - The current date/time is ${currentDate}.
            - The user's timezone is ${timeZone}
            - Information on the user's upcoming schedule: ${upcomingEvents}. ONLY use this data to obtain the event ID for 'updateEvent' or 'deleteEvent' tool calls. 
            Notes: 
            - Event IDs may change after an 'undo' action. Always use the most recent IDs provided in the 'upcomingEvents' list or the latest tool response for the current turn; never reuse IDs from earlier in the conversation history.
            - Never use 'updateEvent' for NEW scheduling requests. It should only be used when the user explicitly asks to modify an existing event.
            - Never call "undoPrompt" more than once per user prompt/turn.
            - You can only update or delete events that are present in the provided upcoming schedule list. 
            - If the user asks to modify/delete an event that occurred more than a week ago, politely inform them that it is over a week old and you do not have access to it. Do not reference internal mechanisms such as the 'upcoming events list'.
            `
          },
          ...req.session.conversationHistory
        ],
        tools: TOOLS,
        max_completion_tokens: 500,
      });

      const toolSelectionResult = toolSelectionCompletion.choices[0].message;

      // If tools returned by the API call, collect them and execute the appropriate function
      if (toolSelectionResult.tool_calls && toolSelectionResult.tool_calls.length > 0) {
        req.session.conversationHistory.push(toolSelectionResult); // add the assistant message that requested tool call into convo history
        for (const toolCall of toolSelectionResult.tool_calls) { // loop through and call the function associated w each tool
          const name = toolCall.function.name;
          console.log(`Tool Call: ${name}`);
          calendarAction = name; // update calendarAction
          const args = JSON.parse(toolCall.function.arguments);

          const result = await callFunction(auth, name, args, req.session.undoStack);

          if (name != "undoPrompt") { // if it's an action, store the undo data
            const undoAction = result.undoAction;
            allPromptUndos.push(undoAction);
          }

          req.session.conversationHistory.push({ // add results of this tool call into convo history
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify({ success: result.success, message: result.resultMessage, eventId: result.eventId || undefined })
          });
        }
        loopCount++;
      } else {
        hasToolCalls = false;
        // Temporarily store this for the userResponse model to use
        req.session.finalLogicMessage = toolSelectionResult;
      }
    }

    // Overwrite the undo stack to strictly enforce a limit of 1 undoable past state
    if (allPromptUndos.length > 0) {
      req.session.undoStack = [allPromptUndos];
    }

    const messagesForUserResponse = [
      {
        role: "system",
        content: ` 
          You are an assistant that handles the in-chat conversation with the user using this service to interact with their Google Calendar. 
          Please provide a concise, friendly response that matches with the result of the function(s) called. 
          Respond as if you just executed the function(s) yourself. Base your response on the most recent tool call(s) or the assistant's latest message. Ignore any errors from previous conversational turns. If an error occurred, respond accordingly.
          If an "undoPrompt" tool call fails because there is "Nothing to undo", politely explain to the user that there is nothing to undo - you can only undo the single most recent command, and you cannot go further back in history.
          Don't ask for another prompt from the user if the action has been performed successfully. You can schedule overlapping events without issue.
          - The current date/time is ${currentDate}.
          - The user's timezone is ${timeZone}
          - Information on the user's upcoming schedule: ${upcomingEvents}. 
          - Only refer to this information if needed per the user's request. Never provide the user with their upcoming schedule data or event URLs directly in the chat.`
      },
      ...req.session.conversationHistory
    ];

    // Only pass the logic engine's text if NO tools were called in the entire turn.
    // Otherwise, its text is just an internal "I'm done" signal that will confuse the response model.
    if (loopCount === 0 && req.session.finalLogicMessage && req.session.finalLogicMessage.content) {
      messagesForUserResponse.push(req.session.finalLogicMessage);
    }
    delete req.session.finalLogicMessage; // clear it

    // AI call for in-chat response after function called + completed  
    const userResponseCompletion = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messagesForUserResponse,
      stream: true,
      max_completion_tokens: 500,
      temperature: 0.5
    });

    res.setHeader("Calendar-Action", calendarAction); // send calendar action as http header
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let finalResponseText = "";
    for await (const chunk of userResponseCompletion) {
      if (chunk.choices[0]?.delta?.content) {
        const text = chunk.choices[0].delta.content;
        finalResponseText += text;
        res.write(text); // Send response to frontend
      }
    }

    req.session.conversationHistory.push({ role: "assistant", content: finalResponseText });

    res.write("\n\n");
    res.end();
  }
  catch(error) {
    console.error("Operation Error:", error);
    res.status(500).json({ error: "Error processing request", details: error.message });
  }
});

module.exports = router;