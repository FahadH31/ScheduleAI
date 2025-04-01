const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const { OAuth2Client } = require('google-auth-library');
const { google } = require('googleapis');
const date = require('date-and-time');
require('dotenv').config();

// Colour IDs
const colourIDs = `  
3 - purple  
4 - light pinkish  
5 - yellow 
6 - orange  
7 - blue  
8 - gray  
9 - navy blue  
10 - dark green
11 - red  
`

// Structured format to be used in OpenAI action calls 
const createEventFormat = `{
  "summary": "Google I/O 2015",
  "location": "800 Howard St., San Francisco, CA 94103",
  "description": "A chance to hear more about Google\'s developer products.",
  "colorId": (A number from the following list: ${colourIDs}), 
  "start": {
    "dateTime": "2015-05-28T09:00:00-07:00",
    "timeZone": "America/Los_Angeles"
  },
  "end": {
    "dateTime": "2015-05-28T17:00:00-07:00",
    "timeZone": "America/Los_Angeles"
  },
  "recurrence": [
    "RRULE:FREQ=DAILY;COUNT=2"
  ],
  "attendees": [
    {"email": "lpage@example.com"},
    {"email": "sbrin@example.com"}
  ],
  "reminders": {
    "useDefault": false,
    "overrides": [
      {"method": "email", "minutes": 1440},
      {"method": "popup", "minutes": 10}
    ]
  }
}`

const conversationHistory = [];
const deletedEventsCache = [];
const MAX_DELETED_CACHE = 10; // Number of recently deleted events to remember

// Initialize OpenAI Client
const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Initalize Google Authentication Client
const oAuth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'postmessage',
);

const app = express();
const port = process.env.PORT || 8070;
app.use(cors());
app.use(express.json());

// Function to determine which operation the user would like to perform (create, update, delete, etc.)
const selectAction = async (prompt, upcomingEvents) => {
  const classifyAction = await openaiClient.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.25,
    messages: [
      {
        role: "system",
        content: `
        Classify the user's intent into one of the following categories (don't make up any other categories!): 
        - "CREATE_EVENT": If the user wants to create or schedule a single event (including cases where 1 event is recurring). Or, if they describe an upcoming event that doesn't already exist. 
        - "CREATE_MULTIPLE_EVENTS": If the user wants to create or schedule multiple events at once.
        - "DELETE_EVENT": If the user wants to delete any event(s).
        - "UPDATE_EVENT": If the user wants to update a single existing event.
        - "UPDATE_MULTIPLE_EVENTS": If the user wants to update multiple existing events at once.
        - "UNDO_DELETE": If the user wants to undo or restore any recently deleted event(s). Ensure they are asking for an UNDO, not just a deletion.
        - "OTHER": For all other requests.
        ONLY return the classifier, nothing else, regardless of the user input. 
        Here is the user's schedule information as context to help you in the classification: ${upcomingEvents}. 
        You will now be provided with the user's latest few messages. Act on the newest one, using prior ones as context.
        `,
      },
      ...conversationHistory,
      { role: "user", content: prompt },
    ]
  });


  const action = classifyAction.choices[0].message.content;
  console.log("Action Classification:", action);
  return action;
}

// Function to get the user's upcoming events
async function getUpcomingEvents(accessToken) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const calendar = google.calendar({ version: 'v3', auth });

  try {
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 20,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items;

    if (!events.length) {
      console.log('No upcoming events found.');
      return [];
    }

    // Store event information
    const eventSummaries = events.map(event => ({
      id: event.id,
      summary: event.summary,
      startTime: event.start,
      endTime: event.end,
      location: event.location,
      colorID: event.colorId,
      description: event.description,
    }));

    return eventSummaries;
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}

// Function to create an event for the user's Google Calendar
async function createEvent(accessToken, prompt, currentDate) {
  // Generate the structured event data from user input, via an OpenAI call. 
  const createEventCompletion = await openaiClient.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.25,
    messages: [
      {
        role: "system",
        content: `
        You are an assistant that creates events using Google Calendar.
        - The current date/time is ${currentDate}.
        - When asked to create an event, you will ONLY respond in a structured format, exactly like this JSON example:
        ${createEventFormat}
        - The only mandatory fields are the start and end time (in ISO 8601 format).
        - Fill the other fields as you deem suitable. Don't set notifications, email addresses, or recurring events unless explicitly told to do so.
        - Don't set a location unless you can determine an appropriate one from the user's input (no made-up locations).
        - Assume the timezone is GMT-4 (Eastern Daylight Saving Time). Ensure the dates exist in the calendar (e.g., no February 29th in non-leap years).`
      },
      { role: "user", content: prompt },
    ],
  });

  eventData = JSON.parse(createEventCompletion.choices[0].message.content);
  console.log(eventData);

  // Insert the data 
  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: "v3", auth });
    const response = await calendar.events.insert({
      auth: auth,
      calendarId: "primary",
      resource: eventData,
    });

    console.log("Event created successfully");
    return { success: true, link: response.data.htmlLink };

  } catch (error) {
    console.error("Error creating event:", error);
    throw new Error("Failed to create Google Calendar event");
  }
}

// Function to create multiple events at once
async function createMultipleEvents(accessToken, prompt, currentDate) {
  const createMultipleEventsCompletion = await openaiClient.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.25,
    messages: [
      {
        role: "system",
        content: `
        You are an assistant that creates multiple events using Google Calendar.
        - The current date/time is ${currentDate}.
        - When asked to create multiple events, your response MUST be a valid JSON array of event objects.
        - Each event should follow this format:
        ${createEventFormat}
        - Even if there's only one event to create, wrap it in an array like: [{ event details }]
        - The only mandatory fields for each event are the summary, start and end time (in ISO 8601 format).
        - Fill the other fields as you deem suitable. 
        - DON'T set notifications, email addresses, or recurrence unless EXPLICITLY told to do so.
        - DON'T set a location unless you can determine an appropriate one from the user's input (no made-up locations).
        - DON'T respond with any markdown, including for code blocks, bolding, italics, etc. No text formatting.
        - Assume the timezone is GMT-4 (Eastern Daylight Saving Time). Ensure the dates exist in the calendar (e.g., no February 29th in non-leap years).`
      },
      { role: "user", content: prompt },
    ],
  });

  // Parse response
  let parsedResponse;
  try {
    parsedResponse = JSON.parse(createMultipleEventsCompletion.choices[0].message.content);
  } catch (error) {
    console.error("Error parsing JSON response:", error);
    throw new Error("Failed to parse event data from AI response");
  }

  // Convert to array in case a single object was returned
  const eventsArray = Array.isArray(parsedResponse) ? parsedResponse : [parsedResponse];
  console.log("Events to create:", eventsArray);

  const results = [];
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const calendar = google.calendar({ version: "v3", auth });

  // Loop through and insert all events into calendar
  for (const eventData of eventsArray) {
    try {
      const response = await calendar.events.insert({
        auth: auth,
        calendarId: "primary",
        resource: eventData,
      });

      results.push({
        summary: eventData.summary,
        success: true,
        link: response.data.htmlLink
      });

      console.log(`Event "${eventData.summary}" created successfully`);
    } catch (error) {
      console.error(`Error creating event "${eventData.summary}":`, error);
      results.push({
        summary: eventData.summary || "Unknown event",
        success: false,
        error: error.message
      });
    }
  }

  return {
    success: results.every(r => r.success),
    results: results
  };
}

// Function to delete an event from the user's Google Calendar
async function deleteEvents(accessToken, prompt, currentDate, upcomingEvents) {
  const deleteEventCompletion = await openaiClient.chat.completions.create({
    model: "gpt-3.5-turbo",
    temperature: 0.25,
    messages: [
      {
        role: "system",
        content: `You are an assistant that deletes events using Google Calendar. 
            The current date/time is ${currentDate}. 
            When asked to delete any number of events, you will identify the correct events to delete 
            and respond with ONLY the event ids in a comma seperated list, regardless of user input. 
            Following are the user's upcoming events with their IDs: ${upcomingEvents}`
      },
      { role: "user", content: prompt },
    ],
  });

  eventIds = deleteEventCompletion.choices[0].message.content;
  var eventIdArray = eventIds.split(',').map(id => id.trim());

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const calendar = google.calendar({ version: 'v3', auth });

  const results = [];
  
  // First, get full event details before deleting
  for (let i = 0; i < eventIdArray.length; i++) {
    try {
      // Get the full event details before deletion
      const event = await calendar.events.get({
        calendarId: 'primary',
        eventId: eventIdArray[i],
      });
      
      // Delete the event
      await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventIdArray[i],
      });

      // Store the deleted event in our cache
      deletedEventsCache.unshift({
        eventId: eventIdArray[i],
        fullEvent: event.data,
        deletedAt: new Date().toISOString()
      });
      
      // Keep cache size limited
      if (deletedEventsCache.length > MAX_DELETED_CACHE) {
        deletedEventsCache.pop();
      }

      console.log(`Event with ID ${eventIdArray[i]} deleted successfully.`);
      results.push({
        eventId: eventIdArray[i],
        success: true
      });
    } catch (error) {
      console.error(`Error deleting event ${eventIdArray[i]}:`, error);
      results.push({
        eventId: eventIdArray[i],
        success: false,
        error: error.message
      });
    }
  }

  return {
    success: results.every(r => r.success),
    results: results
  };
}

async function undoDelete(accessToken, prompt) {
  // If there are no deleted events in the cache
  if (deletedEventsCache.length === 0) {
    return { 
      success: false, 
      error: "No recently deleted events to restore" 
    };
  }

  const undoCompletion = await openaiClient.chat.completions.create({
    model: "gpt-3.5-turbo",
    temperature: 0.25,
    messages: [
      {
        role: "system",
        content: `You are an assistant that helps users restore recently deleted Google Calendar events.
        The user wants to undo a deletion. Based on their prompt and the list of recently deleted events,
        determine which events they want to restore. If they don't specify or just say "undo delete", 
        assume they want to restore the most recently deleted event.
        RESPOND ONLY with the indices (starting from 0) of the deletedEventsCache array to restore, 
        comma-separated if multiple. For example: "0" or "0,2,3".
        Here are the recently deleted events:
        ${JSON.stringify(deletedEventsCache.map((item, index) => {
          const event = item.fullEvent;
          return {
            index,
            summary: event.summary,
            start: event.start,
            end: event.end,
            deletedAt: item.deletedAt
          };
        }))}`
      },
      { role: "user", content: prompt },
    ],
  });

  const indicesStr = undoCompletion.choices[0].message.content;
  const indicesToRestore = indicesStr.split(',').map(idx => parseInt(idx.trim()));
  
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const calendar = google.calendar({ version: 'v3', auth });

  const results = [];
  
  for (const idx of indicesToRestore) {
    if (idx < 0 || idx >= deletedEventsCache.length) continue;
    
    const deletedEvent = deletedEventsCache[idx];
    
    try {
      // Create a clean version of the event for reinsertion
      // This removes fields that might cause conflicts
      const eventToRestore = { ...deletedEvent.fullEvent };
      delete eventToRestore.id; // Remove ID to prevent conflicts
      delete eventToRestore.etag;
      delete eventToRestore.htmlLink;
      delete eventToRestore.iCalUID;
      delete eventToRestore.sequence;
      delete eventToRestore.created;
      delete eventToRestore.updated;
      
      // Insert the event as a new event
      const response = await calendar.events.insert({
        calendarId: 'primary',
        resource: eventToRestore,
      });
      
      // Remove the restored event from our cache
      deletedEventsCache.splice(idx, 1);
      
      results.push({
        summary: eventToRestore.summary || "Unknown event",
        success: true,
        newEventId: response.data.id
      });
      
      console.log(`Event "${eventToRestore.summary}" restored successfully with new ID: ${response.data.id}`);
    } catch (error) {
      console.error(`Error restoring event:`, error);
      results.push({
        summary: deletedEvent.fullEvent.summary || "Unknown event",
        success: false,
        error: error.message
      });
    }
  }
  
  return {
    success: results.length > 0 && results.every(r => r.success),
    results: results
  };
}

// Function to update an event on the user's Google Calendar
async function updateEvent(accessToken, prompt, currentDate, upcomingEvents) {
  const updateEventCompletion = await openaiClient.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.25,
    messages: [
      {
        role: "system",
        content: `You are an assistant that updates events using Google Calendar.
            The current date/time is ${currentDate}. 
            When asked to update an event, you will:
            1. Identify the correct event to update based on user input and the upcoming events list.
            2. Respond ONLY with a JSON object in this format:
                  {
                    "eventId": "EVENT_ID_HERE",
                    "updatedEvent": {
                      ${createEventFormat}
                    }
                  }
            Update the details as you deem appropriate based on the user input. 
            If a field is unchanged, provide the original value.
            DON'T update the location, time, recurrence, or color unless EXPLICITLY told to do so.
            Ensure the dates exist in the calendar (e.g no February 29th in non-leap years).
            Following are the user's upcoming events with their IDs: ${upcomingEvents}`
      },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" }
  });

  console.log(updateEventCompletion.choices[0].message.content);
  const { eventId, updatedEvent } = JSON.parse(updateEventCompletion.choices[0].message.content);

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const calendar = google.calendar({ version: 'v3', auth });

  try {
    const response = await calendar.events.patch({
      calendarId: 'primary',
      eventId: eventId,
      resource: updatedEvent,
    });

    console.log(`Event with ID ${eventId} updated successfully.`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error updating event:', error);
    return { success: false, error: error.message };
  }
}

// Function to update multiple events at once
async function updateMultipleEvents(accessToken, prompt, currentDate, upcomingEvents) {
  const updateMultipleEventsCompletion = await openaiClient.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.25,
    messages: [
      {
        role: "system",
        content: `You are an assistant that updates multiple events using Google Calendar.
            The current date/time is ${currentDate}. 
            When asked to update multiple events, you will:
            1. Identify the correct events to update based on user input and the upcoming events list.
            2. Respond with a JSON array of event objects to update. Format:
           [
            {
              "eventId": "EVENT_ID_HERE",
              "updatedEvent": {
                "summary": "Updated title if needed",
                "description": "Updated description if needed",
                "start": {
                  "dateTime": "2023-05-28T09:00:00-07:00",
                  "timeZone": "America/New_York"
                },
                "end": {
                  "dateTime": "2023-05-28T17:00:00-07:00",
                  "timeZone": "America/New_York"
                }
                // other fields as needed
              }
            }
          ]
            Include ONLY the fields that need to be updated in the updatedEvent object.
            Ensure the response is a properly formatted JSON array, not an object containing an array.
            Don't respond with any markdown, including for code blocks, bolding, italics, etc. No text formatting.
            Following are the user's upcoming events with their IDs: ${upcomingEvents}`
      },
      { role: "user", content: prompt },
    ],
  });

  let updatesArray;
  try {
    const parsedResponse = JSON.parse(updateMultipleEventsCompletion.choices[0].message.content);
    
    // Check if the response is the expected array or if it's wrapped in an object (openai response format can be unreliable)
    if (Array.isArray(parsedResponse)) {
      updatesArray = parsedResponse;
    } else if (parsedResponse.events && Array.isArray(parsedResponse.events)) {
      updatesArray = parsedResponse.events;
    } else {
      // Handle single object case
      updatesArray = [parsedResponse];
    }
    
    console.log("Events to update:", updatesArray);
  } catch (error) {
    console.error("Error parsing JSON response:", error);
    throw new Error("Failed to parse event update data from AI response");
  }

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const calendar = google.calendar({ version: 'v3', auth });

  const results = [];
  for (const update of updatesArray) {
    try {
      // Verify the update object has the required structure
      if (!update.eventId || !update.updatedEvent) {
        throw new Error("Invalid update format: missing eventId or updatedEvent");
      }

      const response = await calendar.events.patch({
        calendarId: 'primary',
        eventId: update.eventId,
        resource: update.updatedEvent,
      });

      console.log(`Event with ID ${update.eventId} updated successfully.`);
      results.push({
        eventId: update.eventId,
        success: true,
        data: {
          summary: response.data.summary,
          start: response.data.start,
          end: response.data.end
        }
      });
    } catch (error) {
      console.error(`Error updating event ${update.eventId || 'unknown'}:`, error);
      results.push({
        eventId: update.eventId || 'unknown',
        success: false,
        error: error.message
      });
    }
  }

  return {
    success: results.length > 0 && results.every(r => r.success),
    results: results
  };
}

// Google Authentication Route
app.post("/api/google-auth", async (req, res) => {
  const { tokens } = await oAuth2Client.getToken(req.body.tokenResponse); // Exchange code for tokens  
  oAuth2Client.setCredentials(tokens);
  res.json(tokens);
});

// OpenAI Chat Route
app.post("/api/openai", async (req, res) => {
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

// Start Server
app.listen(port, () => {
  console.log(`Backend running at http://localhost:${port}`);
});