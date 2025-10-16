const express = require('express');
const date = require('date-and-time');
const { oAuth2Client } = require('./authentication');
const { openaiClient } = require('./authentication');
const { getUpcomingEvents, conversationHistory } = require('./functions/calendar_functions');
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

// Google Authentication Route
router.post("/api/google-auth", async (req, res) => {
  const { tokens } = await oAuth2Client.getToken(req.body.tokenResponse); // Exchange code for tokens  
  oAuth2Client.setCredentials(tokens);
  res.json(tokens);
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

  conversationHistory.push({ role: "user", content: prompt }); // Add the user input to the conversation history

  // Limit length of the conversation history
  if (conversationHistory.length > 8) {
    conversationHistory.shift(); // remove the oldest message
  }

  // Get the current date/time.
  var currentDate = new Date();
  currentDate = date.format(currentDate, 'hh:mm A ddd, MMM DD YYYY');

  // Access token from frontend for interaction w/ Google Calendar
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }
  const access_token = authHeader.split(" ")[1];

  // Store upcoming events to provide in OpenAI call.
  var upcomingEvents = await getUpcomingEvents(access_token);
  upcomingEvents = JSON.stringify(upcomingEvents);

  // Determine which action the user wishes to perform
  const calendarAction = await selectAction(prompt, upcomingEvents);

  // Action result to track operation success
  let actionResult = null;

  try {
    // Perform the requested calendar action
    if (calendarAction === "CREATE_EVENT") {
      actionResult = await createEvent(access_token, prompt, currentDate);
    }
    else if (calendarAction === "CREATE_MULTIPLE_EVENTS") {
      actionResult = await createMultipleEvents(access_token, prompt, currentDate);
    }
    else if (calendarAction === "DELETE_EVENT") {
      actionResult = await deleteEvents(access_token, prompt, currentDate, upcomingEvents);
    }
    else if (calendarAction === "UPDATE_EVENT") {
      actionResult = await updateEvent(access_token, prompt, currentDate, upcomingEvents);
    }
    else if (calendarAction === "UPDATE_MULTIPLE_EVENTS") {
      actionResult = await updateMultipleEvents(access_token, prompt, currentDate, upcomingEvents);
    }
    else if (calendarAction === "UNDO_DELETE") {
      actionResult = await undoDelete(access_token, prompt);
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
        ...conversationHistory,
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