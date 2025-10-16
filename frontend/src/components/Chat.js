import React, { useState, useEffect, useRef } from "react";
import { getOpenAIResponse } from "./OpenAICall";
import ClearChatIcon from "../assets/icons/trash.svg"
import MicIcon from "../assets/icons/mic.svg"
import SendIcon from "../assets/icons/send.svg"
import StopIcon from "../assets/icons/stop-square.png"
import ReactMarkdown from "react-markdown";
import useSpeechToText from "../hooks/useSpeechToText";

const Chat = () => {
    const [inputText, setInputText] = useState("");
    const [responses, setResponses] = useState(() => {
        const savedHistory = sessionStorage.getItem("chatHistory");
        return savedHistory ? JSON.parse(savedHistory) : [];
    });
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const { isListening, transcript, startListening, stopListening } = useSpeechToText({ continuous: true });


    // Save to session storage & keep chat scrolled at bottom whenever responses change
    useEffect(() => {
        sessionStorage.setItem("chatHistory", JSON.stringify(responses));
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [responses]);

    const handleInputChange = (e) => setInputText(e.target.value);

    // Upon submit call OpenAI response with the entered user message
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const message = inputText;
        setInputText("");
        
        setLoading(true);

        const newResponse = { user: message, ai: "" };
        setResponses((prev) => [...prev, newResponse]);

        try {
            await getOpenAIResponse(message, (chunk) => {
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
                { user: message, ai: "Failed to fetch response. Please try again." },
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

    const toggleListening = () => {
        if (isListening) {
            stopVoiceInput();
        } else {
            startListening();
        }
    };

    // Ensure stoppage of voice input is handled completely 
    const stopVoiceInput = () => {
        const finalText = inputText + (transcript.length ? (inputText.length ? ' ' : '') + transcript : '');
        setInputText(finalText); // Update input text with the final transcript
        stopListening();
    };

    return (
        <div className="flex flex-col p-3 sm:w-1/2 sm:p-6">
            <div className="flex items-center">
                <h1 className="hidden sm:flow-root sm:text-2xl font-semibold text-center flex-grow">Google Calendar AI Assistant</h1>
            </div>
            {/* Clear Chat Button */}
            <button
                type="button"
                onClick={handleClearChat}
                className="mr-0 ml-auto text-gray-400 hover:text-red-500 transition-all mb-2"
                title="Clear Chat History"
            >
                <img src={ClearChatIcon} alt="Clear Chat Icon" className="size-5"></img>
            </button>
            <div className="h-64 sm:h-auto mb-4 flex-grow bg-gray-800 p-5 rounded-lg shadow-lg border border-gray-700 overflow-y-auto custom-scrollbar relative">
                <div className="space-y-3">
                    <div className="self-start max-w-md bg-gray-700 p-3 rounded-lg shadow-md">
                        <p className="text-sm font-semibold text-green-400">Calendar Assistant</p>
                        <div className="prose prose-invert prose-sm max-w-none">
                            <ReactMarkdown>
                                Welcome to the Google Calendar AI Assistant!
                                Effortlessly create, update, and delete events on your Google Calendar with simple prompts.
                                Need advice on optimizing or improving your schedule? Feel free to ask!
                            </ReactMarkdown>
                        </div>
                    </div>
                    {responses.length > 0 ? (
                        responses.map((response, index) => (
                            <div key={index} className="flex flex-col space-y-2">
                                <div className="self-end max-w-md bg-blue-500 text-white p-3 rounded-lg shadow-md mb-1">
                                    <p>{response.user}</p>
                                </div>
                                <div className="self-start max-w-md bg-gray-700 p-3 rounded-lg shadow-md">
                                    <p className="text-sm font-semibold text-green-400">Calendar Assistant</p>
                                    <div className="prose prose-invert prose-sm max-w-none">
                                        <ReactMarkdown>
                                            {response.ai}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-400">Start a conversation to manage your schedule!</p>
                    )}
                </div>
                <div ref={messagesEndRef} /> {/* An invisible div to set viewpoint at the bottom of the chat when new messages come in */}
            </div>
            <form onSubmit={handleSubmit} className="flex">
                <textarea
                    className="w-[90%] p-3 rounded-lg bg-gray-700 text-white text-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Type your message here..."
                    value={isListening ? inputText + (transcript.length ? (inputText.length ? ' ' : '') + transcript : '') : inputText }
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    rows={3}
                ></textarea>
                {/*Voice Input & Send Buttons*/}
                <div className="flex-col space-y-2 ml-3 w-[10%]">
                    <button
                        type = "button"
                        className={`size-11 rounded-full ${isListening ? "bg-red-600 hover:bg-red-500" : "bg-white hover:bg-gray-400"} text-white font-semibold text-md transition-all disabled:opacity-50`}
                        disabled={loading}
                        onClick={() =>{toggleListening();}}
                    >
                        <img src={isListening ? StopIcon : MicIcon } className={`ml-auto mr-auto ${isListening ? "size-3" : "size-5" }`}></img>
                    </button>
                    <button
                        type="submit"
                        className="size-11 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-md transition-all disabled:opacity-50"
                        disabled={loading}
                    >
                        <img src={SendIcon} alt="Send Icon" className="ml-auto mr-auto size-5 opacity-[85%] invert"></img>
                    </button>
                </div>
            </form>
        </div>
    );
}

export default Chat;