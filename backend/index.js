const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const { OAuth2Client, auth } = require('google-auth-library');
const { google } = require('googleapis');
const { calendar } = require("googleapis/build/src/apis/calendar");
require('dotenv').config();

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

// Function to insert an event into Google Calendar
async function insertEvent(accessToken, eventData) {
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
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== "string") {
    return res
      .status(400)
      .json({ success: false, error: "Invalid or missing 'prompt' field" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const access_token = authHeader.split(" ")[1];

  const calendarOperation = await openaiClient.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: `You are an assistant that schedules events using Google Calendar. You will ONLY
          respond to each and every user message in a structured format, exactly like the following example: 
          ${createEventFormat}. The only mandatory fields are the start and end time (in (ISO 8601 format), fill the others as you deem 
          suitable. Don't set notifications or an email address unless explicitly told to do so. Assume the timezone is EST.` },
      { role: "user", content: prompt },
    ],
  });

  const userResponse = await openaiClient.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: `You are an AI assistant that helps schedule events using Google Calendar. 
        Please provide a short, concise, and friendly response to the user input, 
        confirming that request is being performed immediately/as you speak. Ask them if they
        have any more requests. In the case that they ask questions related to their schedule,
        the user's schedule information is attached.`},
      { role: "user", content: prompt },
    ]
  })

  console.log(calendarOperation.choices[0].message.content)
  const aiCalendarDataResponse = JSON.parse(calendarOperation.choices[0].message.content);
  const aiUserResponse = userResponse.choices[0].message.content;
  insertEvent(access_token, aiCalendarDataResponse);

  res.json({ data: aiUserResponse });
});

// Start Server
app.listen(port, () => {
  console.log(`Backend running at http://localhost:${port}`);
});
