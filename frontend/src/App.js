import React, { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import { getOpenAIResponse } from "./openaiService";

function App() {
  const [modal, setModal] = useState(false);
  const [inputText, setInputText] = useState("");
  const [responses, setResponses] = useState([]);
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
      console.log("Updated responses:", responses);

      const newResponse = {
        user: inputText,
        ai: aiResponse.choices[0].text,
      };
      setResponses((prev) => [...prev, newResponse]);
      console.log("Updated responses:", [...responses, newResponse]);
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

  return (
    <div className="w-screen h-screen bg-slate-700 flex relative overflow-hidden">
      <div
        className={`fixed top-0 left-0 h-full bg-gray-800 text-white transition-transform transform p-5 ${
          modal ? "translate-x-0" : "-translate-x-full"
        } w-1/2 z-10 flex flex-col`}
      >
        <div className="flex-grow">
          <h2 className="text-2xl font-bold mb-4 text-center">Account stuff</h2>
          <p>Account Content.</p>
        </div>
        <button
          className="bg-red-500 text-white py-2 px-4 w-full mt-auto rounded-2xl"
          onClick={() => setModal(false)}
        >
          Back to Current
        </button>
      </div>

      <div className="w-1/2 bg-gray-500 h-full p-5 flex justify-center">
        <div className="flex flex-col w-full">
          <h1 className="text-center text-2xl font-bold text-white">
            View Your Schedule!
          </h1>
          <div className="bg-white flex-grow rounded-xl mt-2 flex justify-center items-center p-5 shadow-lg">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin]}
              initialView="dayGridMonth"
              events={[
                { title: "Event 1", date: "2025-01-13" },
                { title: "Event 3", date: "2025-01-13" },
                { title: "Event 2", date: "2025-01-15" },
              ]}
              height="auto"
            />
          </div>
          <div className="flex gap-4">
            <button
              className="bg-white p-2 rounded-2xl w-full mt-3 hover:bg-gray-300"
              onClick={() => setModal(true)}
            >
              Account Management
            </button>
          </div>
        </div>
      </div>
      <div className="w-1/2 bg-slate-800 h-full p-5 flex justify-center">
        <div className="flex flex-col w-full">
          <div className="text-white text-2xl text-center font-bold mb-3">
            AI Helper
          </div>
          <div className="bg-gray-600 flex-grow rounded-xl mt-2 p-5 text-white border-2 border-black shadow-lg">
            <strong className="text-lg">Conversations:</strong>
            <div className="mt-2 p-3 bg-slate-500 text-black rounded-lg overflow-y-auto border-2 border-black h-96">
              {responses.length > 0 ? (
                responses.map((response, index) => {
                  console.log(`Rendering response ${index}:`, response);
                  return (
                    <div key={index} className="mb-4">
                      <p className="text-blue-500 font-bold">You:</p>
                      <p className="mb-2">{response.user}</p>
                      <p className="text-green-500 font-bold">AI:</p>
                      <p>{response.ai}</p>
                      <hr className="my-2 border-gray-400" />
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-300">
                  Start a conversation to see responses!
                </p>
              )}
            </div>
          </div>
          <form onSubmit={handleSubmit}>
            <textarea
              className="bg-white p-2 rounded-2xl w-full mt-3 h-32 text-lg resize-none overflow-y-auto custom-scrollbar font-serif"
              placeholder="Talk to your helper here!"
              value={inputText}
              onChange={handleInputChange}
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
    </div>
  );
}

export default App;
