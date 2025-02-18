const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}/api/openai`;

export const getOpenAIResponse = async (prompt, onStreamData) => {
  try {
    const accessToken = sessionStorage.getItem("accessToken");

    if (!accessToken) {
      throw new Error("No access token found. Please log in.");
    }

    console.log("Sending prompt to backend:", prompt);

    const response = await fetch(BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.body) throw new Error("No response body");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    let fullResponse = "";
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });

      // Append chunk properly
      fullResponse += chunk;
      
      // Pass only the new chunk, avoiding duplication
      onStreamData(chunk);
    }

    return fullResponse;
  } catch (error) {
    console.error("Error calling OpenAI API:", error.response?.data || error.message);
    throw error;
  }
};

