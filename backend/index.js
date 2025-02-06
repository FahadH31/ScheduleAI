const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
require("dotenv").config();
const OpenAI = require("openai"); 
dotenv.config();

if (!process.env.OPENAI_API_KEY) {
  console.error("Error: Missing OpenAI API key in environment variables.");
  process.exit(1);
}

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// OpenAI API route
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

// Start the server
app.listen(port, () => {
  console.log(`Backend running at http://localhost:${port}`);
});
