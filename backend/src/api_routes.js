const express = require('express');
const axios = require('axios');
const date = require('date-and-time');
const { oAuth2Client } = require('./authentication');
const { openaiClient } = require('./authentication');
const { getUpcomingEvents } = require('./functions/calendar_functions');
const {
  selectAction,
  createEvent,
  createMultipleEvents,
  deleteEvents,
  updateEvent,
  updateMultipleEvents,
  undoDelete
} = require('./functions/openai_functions');

const router = express.Router();

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
router.post("/api/openai", async (req, res) => {
  // User prompt
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== "string") {
    return res
      .status(400)
      .json({ success: false, error: "Invalid or missing 'prompt' field" });
  }
  if(prompt.length > 500){
    return res
      .status(400)
      .json({ success: false, error: "Prompt too long. Please ensure your entered message is less than 500 characters." });
  }

  if(!req.session.conversationHistory){
    req.session.conversationHistory = [];
  }

  if(!req.session.deletedEventsCache){
    req.session.deletedEventsCache = [];
  }

  req.session.conversationHistory.push({ role: "user", content: prompt }); // Add the user input to the conversation history

  // Limit length of the conversation history
  if (req.session.conversationHistory.length > 8) {
    req.session.conversationHistory.shift(); // remove the oldest message
  }

  // Get the current date/time.
  var currentDate = new Date();
  currentDate = date.format(currentDate, 'hh:mm A ddd, MMM DD YYYY');

  // Get the user timezone.
  var timeZone = req.header("User-TimeZone");

  if (!req.session.tokens) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const access_token = req.session.tokens.access_token;

  // Store upcoming events to provide in OpenAI call.
  var upcomingEvents = await getUpcomingEvents(access_token);
  upcomingEvents = JSON.stringify(upcomingEvents);

  // Determine which action the user wishes to perform
  const calendarAction = await selectAction(prompt, upcomingEvents, req.session.conversationHistory);

  // Action result to track operation success
  let actionResult = null;

  try {
    // Perform the requested calendar action
    if (calendarAction === "CREATE_EVENT") {
      actionResult = await createEvent(access_token, prompt, currentDate, timeZone);
    }
    else if (calendarAction === "CREATE_MULTIPLE_EVENTS") {
      actionResult = await createMultipleEvents(access_token, prompt, currentDate, timeZone);
    }
    else if (calendarAction === "DELETE_EVENT") {
      actionResult = await deleteEvents(access_token, prompt, req.session.deletedEventsCache, currentDate, timeZone, upcomingEvents);
    }
    else if (calendarAction === "UPDATE_EVENT") {
      actionResult = await updateEvent(access_token, prompt, currentDate,  timeZone, upcomingEvents);
    }
    else if (calendarAction === "UPDATE_MULTIPLE_EVENTS") {
      actionResult = await updateMultipleEvents(access_token, prompt, currentDate, timeZone, upcomingEvents);
    }
    else if (calendarAction === "UNDO_DELETE") {
      actionResult = await undoDelete(access_token, prompt, req.session.deletedEventsCache);
    }

    // OpenAI call to provide the user a response in the chat.
    const userResponseCompletion = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
          You are an assistant that helps a user interact with their Google Calendar. 
        - You can schedule multiple overlapping events without issue.
        - The current date/time is ${currentDate}.
        - Please provide a concise, friendly response that matches with the calendar action performed. (Don't ask for another prompt from the user if the action has been performed successfully)
        - Calendar action is: ${calendarAction}.
        - Action result: ${JSON.stringify(actionResult || {})}
        - Information on the user's upcoming schedule: ${upcomingEvents}. 
          - Only refer to this information if needed per the user's request.
        - Never provide the user with their upcoming schedule data or event URLs directly in the chat. 
        You will now be provided with the user's latest few messages. Respond to the newest one.`},
        ...req.session.conversationHistory,
        { role: "user", content: prompt },
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
        res.write(text);  // Send response to frontend
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