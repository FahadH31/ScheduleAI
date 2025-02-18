const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const { OAuth2Client, auth } = require('google-auth-library');
const { google } = require('googleapis');
const date = require('date-and-time');
require('dotenv').config();

// Structured formats to be used in OpenAI action calls 
const createEventFormat = `
  "summary": "Google I/O 2015",
  "location": "800 Howard St., San Francisco, CA 94103",
  "description": "A chance to hear more about Google\'s developer products.",
  "start": {
    "dateTime": "2015-05-28T09:00:00-07:00",
    "timeZone": "America/Los_Angeles",
  },
  "end": {
    "dateTime": "2015-05-28T17:00:00-07:00",
    "timeZone": "America/Los_Angeles",
  },
  "recurrence": [
    "RRULE:FREQ=DAILY;COUNT=2"
  ],
  "attendees": [
    {"email": "lpage@example.com"},
    {"email": "sbrin@example.com"},
  ],
  "reminders": {
    "useDefault": false,
    "overrides": [
      {"method": "email", "minutes": 24 * 60},
      {"method": "popup", "minutes": 10},
    ],
  },`

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
const port = process.env.PORT || 8080;
app.use(cors());
app.use(express.json());

// Function to determine which operation the user would like to perform (create, update, delete, etc.)
const selectAction = async (prompt) => {
  const classifyAction = await openaiClient.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: `
        Classify the user's intent into one of the following categories: 
        - "CREATE_EVENT": If the user wants to create or schedule an event.
        - "DELETE_EVENT": If the user wants to delete an event.
        - "UPDATE_EVENT": If the user wants to update an event.
        - "OTHER": For all other requests."
        ONLY return the classifier, nothing else, regardless of the user input.
        `,
      },
      { role: "user", content: prompt },
    ]
  })

  const action = classifyAction.choices[0].message.content; 
  console.log(action);
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
      maxResults: 5,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items;

    if (!events.length) {
      console.log('No upcoming events found.');
      return [];
    }

    // Store only event ID, summary, start/endtime
    const eventSummaries = events.map(event => ({
      id: event.id,
      summary: event.summary,
      startTime: event.start,
      endTime: event.start,
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
  const createEventData = await openaiClient.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: `You are an assistant that creates events using Google Calendar. 
            The current date/time is ${currentDate}. 
            When asked to create an event, you will ONLY respond in a structured format, exactly like the following example: 
            ${createEventFormat}. The only mandatory fields are the start and end time (in (ISO 8601 format), use 30 minutes as the default length.
            Fill the other fields as you deem suitable. Don't set notifications or an email address unless explicitly told to do so. Assume the timezone is EST.` },
      { role: "user", content: prompt },
    ],
  });

  eventData = JSON.parse(createEventData.choices[0].message.content);

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

    console.log("Event created:", response.data.htmlLink);
    return { success: true, link: response.data.htmlLink };
  } catch (error) {
    console.error("Error creating event:", error);
    throw new Error("Failed to create Google Calendar event");
  }
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

  // Get the current date/time.
  var currentDate = new Date();
  currentDate = date.format(currentDate, 'hh:mm A ddd, MMM DD YYYY');

  // Access token from frontend for interaction w/ Google Calendar
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }
  const access_token = authHeader.split(" ")[1];

  // Determine which action the user wishes to perform
  const calendarAction = await selectAction(prompt);

  if (calendarAction == "CREATE_EVENT") {
    createEvent(access_token, prompt, currentDate);
  }

  // Store upcoming events to provide in OpenAI call.
  var upcomingEvents = await getUpcomingEvents(access_token);
  upcomingEvents = JSON.stringify(upcomingEvents);

  // OpenAI call to provide the user a response in the chat. 
  const userResponse = await openaiClient.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: `You are an AI assistant that helps schedule events using Google Calendar.
        The current date/time is ${currentDate}.  Please provide a short, concise, and friendly response to the user input,
        confirming that their intended action is now completed. 
        Information on the user's upcoming schedule is attached: ${upcomingEvents}. Only refer to it if the users
        specifically asks something about their schedule (ex. upcoming events, how to optimize, etc.)`},
      { role: "user", content: prompt },
    ]
  })

  const aiUserResponse = userResponse.choices[0].message.content;

  res.json({ data: aiUserResponse });
});

// Start Server
app.listen(port, () => {
  console.log(`Backend running at http://localhost:${port}`);
});
