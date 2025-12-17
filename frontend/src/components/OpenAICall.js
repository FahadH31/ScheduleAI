const BACKEND_URL = `${process.env.REACT_APP_BACKEND_URL}/api/openai`;

export const getOpenAIResponse = async (prompt, onStreamData) => {
  try {
    console.log("Sending prompt to backend:", prompt);

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

    const response = await fetch(BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-TimeZone": timeZone,
      },
      credentials: 'include',
      body: JSON.stringify({ prompt }),
    });

    const action = response.headers.get("Calendar-Action");

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

    // Trigger iframe reload (only if calendar action is taken)
    if(action !== "OTHER"){
      window.postMessage('reload', window.location.origin)
    }

    return fullResponse;
  } catch (error) {
    console.error("Error calling OpenAI API:", error.response?.data || error.message);
    throw error;
  }
};

