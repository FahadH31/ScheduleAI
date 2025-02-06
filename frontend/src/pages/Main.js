import React, { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import { getOpenAIResponse } from "../components/OpenAIService";

function Main() {
  const [inputText, setInputText] = useState("");
  const [responses, setResponses] = useState([]); // Store chat history
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => setInputText(e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setLoading(true);

    try {
      console.log("Sending prompt to OpenAI:", inputText);
      const aiResponse = await getOpenAIResponse(inputText);
      console.log("OpenAI Response:", aiResponse);

      const newResponse = {
        user: inputText,
        ai: aiResponse.data,
      };

      setResponses((prev) => [...prev, newResponse]);
      setInputText("");
    } catch (error) {
      console.error("Error fetching OpenAI response:", error);
      const errorResponse = {
        user: inputText,
        ai:
          error.response?.status === 429
            ? "Rate limit exceeded. Please try again later."
            : "Failed to fetch response. Please try again.",
      };
      setResponses((prev) => [...prev, errorResponse]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex w-full h-screen bg-slate-700">
      <div className="flex flex-col w-1/2 bg-gray-500 p-5 overflow-hidden">
        <h1 className="text-center text-2xl font-bold text-white">
          View Your Schedule!
        </h1>
        <div className="flex-grow bg-white rounded-xl mt-4 shadow-lg flex items-center justify-center">
          <div className="w-full h-full p-5 custom-scrollbar">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin]}
              initialView="dayGridMonth"
              height="100%"
              width="100%"
              className="custom-scrollbar"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col w-1/2 bg-slate-800 p-5 overflow-hidden">
        <div className="text-white text-2xl text-center font-bold mb-3">
          AI Helper
        </div>
        <div className="flex-grow bg-gray-600 rounded-xl p-5 border-2 border-black shadow-lg flex flex-col overflow-y-auto">
          <strong className="text-lg">Conversations:</strong>
          <div className="flex-grow mt-4 p-3 bg-slate-500 text-black rounded-lg overflow-y-auto border-2 border-black custom-scrollbar">
            {responses.length > 0 ? (
              responses.map((response, index) => (
                <div key={index} className="mb-4">
                  <p className="text-blue-500 font-bold">You:</p>
                  <p className="mb-2">{response.user}</p>
                  <p className="text-green-500 font-bold">AI:</p>
                  <p>{response.ai}</p>
                  <hr className="my-2 border-gray-400" />
                </div>
              ))
            ) : (
              <p className="text-gray-300">
                Start a conversation to see responses!
              </p>
            )}
          </div>
        </div>
        <form onSubmit={handleSubmit} className="mt-3">
          <textarea
            className="bg-white p-2 rounded-2xl w-full h-32 text-lg resize-none overflow-y-auto font-serif"
            placeholder="Talk to your helper here!"
            value={inputText}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
          ></textarea>
          <button
            type="submit"
            className="bg-black text-white py-2 px-4 rounded-xl mt-3 w-full"
            disabled={loading}
          >
            {loading ? "Fetching..." : "Get Response"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Main;
