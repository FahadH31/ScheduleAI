import React, { useState, useEffect, useRef } from "react";
import { getOpenAIResponse } from "./OpenAICall";

const Chat = () => {
    const [inputText, setInputText] = useState("");
    const [responses, setResponses] = useState(() => {
        const savedHistory = sessionStorage.getItem("chatHistory");
        return savedHistory ? JSON.parse(savedHistory) : [];
    });
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);


    // Save to session storage & keep chat scrolled at bottom whenever responses change
    useEffect(() => {
        sessionStorage.setItem("chatHistory", JSON.stringify(responses));
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [responses]);

    const handleInputChange = (e) => setInputText(e.target.value);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        setLoading(true);

        const newResponse = { user: inputText, ai: "" };
        setResponses((prev) => [...prev, newResponse]);

        try {
            await getOpenAIResponse(inputText, (chunk) => {
                setResponses((prev) => {
                    const updatedResponses = [...prev];
                    updatedResponses[updatedResponses.length - 1] = {
                        ...updatedResponses[updatedResponses.length - 1],
                        ai: updatedResponses[updatedResponses.length - 1].ai + chunk,
                    };
                    return updatedResponses;
                });
            });

            setInputText("");
        } catch (error) {
            console.error("Error fetching OpenAI response:", error);
            setResponses((prev) => [
                ...prev.slice(0, -1),
                { user: inputText, ai: "Failed to fetch response. Please try again." },
            ]);
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

    const handleClearChat = () => {
        setResponses([]); // Clear chat history from state
        sessionStorage.removeItem("chatHistory"); // Clear chat history from session storage
    };

    return (
        <div className="flex flex-col w-1/2 p-6">
            <div className="flex items-center">
                <h1 className="text-2xl font-semibold text-center flex-grow">Google Calendar AI Assistant</h1>
            </div>
            {/* Clear Chat Button */}
            <button
                type="button"
                onClick={handleClearChat}
                className="mr-0 ml-auto text-gray-400 hover:text-red-500 transition-all mb-2"
                title="Clear Chat"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                </svg>
            </button>
            <div className="mb-4 flex-grow bg-gray-800 p-5 rounded-lg shadow-lg border border-gray-700 overflow-y-auto custom-scrollbar relative">
                <div className="space-y-3">
                    <div className="self-start max-w-xs bg-gray-700 p-3 rounded-lg shadow-md">
                        <p className="text-sm font-semibold text-green-400">Calendar Assistant</p>
                        <p>Welcome to the Google Calendar AI Assistant!
                            Effortlessly create, update, and delete events on your Google Calendar with simple prompts.
                            Need advice on optimizing or improving your schedule? Feel free to ask!
                        </p>
                    </div>
                    {responses.length > 0 ? (
                        responses.map((response, index) => (
                            <div key={index} className="flex flex-col space-y-2">
                                <div className="self-end max-w-xs bg-blue-500 text-white p-3 rounded-lg shadow-md mb-1">
                                    <p>{response.user}</p>
                                </div>
                                <div className="self-start max-w-xs bg-gray-700 p-3 rounded-lg shadow-md">
                                    <p className="text-sm font-semibold text-green-400">Calendar Assistant</p>
                                    <p>{response.ai}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-400">Start a conversation to manage your schedule!</p>
                    )}
                </div>
                <div ref={messagesEndRef} /> {/* An invisible div to set viewpoint at the bottom of the chat when new messages come in */}
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                    className="w-full p-3 rounded-lg bg-gray-700 text-white text-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Type your message here..."
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                ></textarea>
                <div className="flex space-x-4">
                    <button
                        type="submit"
                        className="w-full py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold text-md transition-all disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading ? "Sending..." : "Send"}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default Chat;