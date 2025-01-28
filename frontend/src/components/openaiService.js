import axios from "axios";

const BASE_URL = "http://localhost:8080/api/openai";

export const getOpenAIResponse = async (prompt) => {
  try {
    console.log("Sending prompt to backend:", prompt);
    const response = await axios.post(
      BASE_URL,
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
