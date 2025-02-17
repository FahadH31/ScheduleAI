import axios from "axios";

const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}/api/openai`;

export const getOpenAIResponse = async (prompt) => {
  try {
    const accessToken = sessionStorage.getItem("accessToken"); // Get token from sessionStorage

    if (!accessToken) {
      throw new Error("No access token found. Please log in.");
    }

    console.log("Sending prompt to backend:", prompt);
    
    const response = await axios.post(
      BACKEND_URL,
      { prompt },
      {
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`, // Send token in headers
        },
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
