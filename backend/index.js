const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const { OAuth2Client } = require('google-auth-library');
const { google } = require('googleapis');
require('dotenv').config();

// Initialize OpenAI Client
const client = new OpenAI({
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

// Google Authentication Route
app.post("/api/google-auth", async(req, res) => {
  const { tokens } = await oAuth2Client.getToken(req.body.tokenResponse); // Exchange code for tokens  
  oAuth2Client.setCredentials(tokens);
  res.json(tokens);
});

// OpenAI Chat Route
app.post("/api/openai", async (req, res) => {
  console.log("Received payload:", req.body);

  const { prompt } = req.body;

  if (!prompt || typeof prompt !== "string") {
    return res
      .status(400)
      .json({ success: false, error: "Invalid or missing 'prompt' field" });
  }

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt },
      ],
    });

    const responseMessage = completion.choices[0].message.content;

    res.json({ success: true, data: responseMessage });
  } catch (error) {
    console.error(
      "Error with OpenAI API:",
      error.response?.data || error.message
    );
    res.status(500).json({
      success: false,
      error: "Failed to fetch response from OpenAI API",
      details: error.response?.data || error.message,
    });
  }
});

// Fetch Calendar Events
app.get("/calendar/fetch-events", async (req, res) => {
  try {
    const accessToken = req.headers.authorization?.split("Bearer ")[1];
    if (!accessToken) return res.status(401).json({ error: "Unauthorized" });

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: "v3", auth });
    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: "startTime",
    });

    res.json(response.data.items);
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// Start Server
app.listen(port, () => {
  console.log(`Backend running at http://localhost:${port}`);
});
