import axios from "axios";

const API_KEY =
  "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";

const openai = axios.create({
  baseURL: "https://api.openai.com/v1",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${API_KEY}`,
  },
});

export const getOpenAIResponse = async (prompt) => {
  try {
    const response = await openai.post("/chat/completions", {
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt },
      ],
      max_tokens: 100,
    });

    return response.data;
  } catch (error) {
    console.error("Error calling OpenAI API:", error.response || error.message);

    if (error.response) {
      console.log("API Key being used:", API_KEY);

      throw new Error(
        `API Error: ${error.response.status} - ${
          error.response.data.error?.message || "Unknown error"
        }`
      );
    } else if (error.request) {
      throw new Error("Network error: Unable to reach OpenAI API.");
    } else {
      throw new Error("Unexpected error occurred.");
    }
  }
};
