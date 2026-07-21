const { OAuth2Client } = require('google-auth-library');
const OpenAI = require('openai');

// Initialize OpenAI Client
const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Initialize Google Auth Client
const oAuthInitializer = () => {
  const oAuth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'postmessage',
  );

  return oAuth2Client;
}

// Helper function to create fully authorized client 
const getAuthorizedClient = (authTokens, onTokensRefreshed) => {
  const auth = oAuthInitializer();
  auth.setCredentials(authTokens);

  if (onTokensRefreshed) {
    auth.on('tokens', (newTokens) => {
      onTokensRefreshed(newTokens);
    });
  }
  return auth;
};


module.exports = {
  openaiClient,
  oAuthInitializer,
  getAuthorizedClient
};