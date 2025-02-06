import axios from "axios";

const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}/api/openai`;

export const getOpenAIResponse = async (prompt) => {
  try {
    console.log("Sending prompt to backend:", prompt);
    const response = await axios.post(
      BACKEND_URL,
      { prompt },
      {
        headers: { "Content-Type": "application/json" },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error calling OpenAI API:",
      error.response?.data || error.message
    );
    throw error;
  }
};
