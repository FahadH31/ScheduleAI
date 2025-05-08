const { OAuth2Client } = require('google-auth-library');
const OpenAI = require('openai');
require('dotenv').config();

// Initialize OpenAI Client
const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Initialize Google Auth Client
const oAuth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'postmessage',
);

module.exports = {
  openaiClient,
  oAuth2Client,
};