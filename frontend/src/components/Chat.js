import { useState, useEffect, useRef } from "react";
import { getOpenAIResponse } from "./OpenAICall";
import { Link } from "react-router-dom";
import Logo from "../assets/logo.png"
import MicIcon from "../assets/icons/mic.svg"
import SendIcon from "../assets/icons/send.svg"
import StopIcon from "../assets/icons/stop-square.png"
import SettingsIcon from "../assets/icons/settings.svg"
import LogoutIcon from "../assets/icons/log-out.svg"
import ReactMarkdown from "react-markdown";
import useSpeechToText from "../hooks/useSpeechToText";

const Chat = () => {
    const [inputText, setInputText] = useState("");
    const [responses, setResponses] = useState(() => {
        const savedHistory = sessionStorage.getItem("chatHistory");
        return savedHistory ? JSON.parse(savedHistory) : [];
    });
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const messagesEndRef = useRef(null);
    const { isListening, transcript, startListening, stopListening } = useSpeechToText({ continuous: true });

    useEffect(() => {
        sessionStorage.setItem("chatHistory", JSON.stringify(responses));
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [responses]);

    const handleInputChange = (e) => setInputText(e.target.value);

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
                { user: message, ai: error.message },
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

    const handleClearChat = async () => {
        setResponses([]);
        sessionStorage.removeItem("chatHistory");
        try {
            await fetch(`${process.env.REACT_APP_BACKEND_URL}/clear-chat-history`, {
                method: 'POST',
                credentials: 'include'
            });
        }
        catch (error) {
            console.error("Clear chat error:", error);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/logout`, {
                method: 'POST',
                credentials: 'include'
            });

            sessionStorage.clear();
            window.location.href = '/';
        } catch (error) {
            console.error("Logout error:", error);
        }
    }

    const toggleListening = () => {
        if (isListening) {
            stopVoiceInput();
        } else {
            startListening();
        }
    };

    const stopVoiceInput = () => {
        const finalText = inputText + (transcript.length ? (inputText.length ? ' ' : '') + transcript : '');
        setInputText(finalText);
        stopListening();
    };

    return (
        <div className="flex flex-col p-3 sm:w-1/2 sm:p-6 animate-fadeIn">
            {/* Help Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 transition-opacity animate-fadeIn">
                    <div className="bg-gray-900 border border-gray-700/50 rounded-2xl shadow-2xl max-w-lg w-full p-8 text-white relative max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="relative z-10">
                            <div className="space-y-6">
                                <div className="bg-gray-700/30 rounded-xl p-5 border border-gray-600/30 ">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-lg font-semibold">Usage</h3>
                                    </div>
                                    <p className="text-sm text-gray-300 mb-3">
                                        I can manage your Google Calendar using natural language. I can handle event details such as color, location, recurrence, reminders, and more. Try commands like:
                                    </p>
                                    <ul className="space-y-2">
                                        <li className="flex items-start gap-2 text-sm text-gray-400">
                                            <svg className="w-4 h-4 mt-0.5 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            <span>"Schedule a flight from NYC to London next Tuesday and set it to red"</span>
                                        </li>
                                        <li className="flex items-start gap-2 text-sm text-gray-400">
                                            <svg className="w-4 h-4 mt-0.5 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            <span>"Move my 2 PM meeting to 4 PM and delete my 'Gym' event"</span>
                                        </li>
                                        <li className="flex items-start gap-2 text-sm text-gray-400">
                                            <svg className="w-4 h-4 mt-0.5 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            <span>"Undo that" (Reverses all actions from your last message)</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="bg-gray-700/30 backdrop-blur-sm rounded-xl p-5 border border-gray-600/30">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="text-lg font-semibold">Technical Limitations</h3>
                                    </div>
                                    <ul className="space-y-3">
                                        <li className="text-sm text-gray-300">
                                            <span className="font-medium text-white">Event Visibility:</span>
                                            <span className="text-gray-400 block mt-1">I can see up to 30 of your closest upcoming events to assist with updates and deletions. I am unable to view, modify, or delete events that occurred more than a week ago.</span>
                                        </li>
                                        <li className="text-sm text-gray-300">
                                            <span className="font-medium text-white">Context Memory:</span>
                                            <span className="text-gray-400 block mt-1">I remember about 10 of your prompts in our conversation history before I start pruning older messages.</span>
                                        </li>
                                        <li className="text-sm text-gray-300">
                                            <span className="font-medium text-white">Primary Calendar:</span>
                                            <span className="text-gray-400 block mt-1">I currently only support the primary calendar associated with your Google account.</span>
                                        </li>
                                        <li className="text-sm text-gray-300">
                                            <span className="font-medium text-white">Tasks:</span>
                                            <span className="text-gray-400 block mt-1">I currently only support Google Calendar's 'Events' feature, not 'Tasks'.</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="mt-6 w-full bg-[#065AD8] text-white font-semibold py-3 px-4 rounded-xl transition-all hover:bg-blue-700"
                            >
                                Got it!
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-row">
                {/* Settings Button */}
                <Link
                    to="/settings"
                    className="ml-0 mr-auto transition-opacity hover:opacity-50"
                    title="Settings"
                >
                    <img src={SettingsIcon} className="size-5" alt="Settings icon"></img>
                </Link>


                {/* Logout Button */}
                <button
                    type="button"
                    onClick={handleLogout}
                    className="mr-0 ml-auto transition-all hover:opacity-50"
                >
                    <img src={LogoutIcon} alt="Logout Icon" className="size-5" title="Log-out"></img>
                </button>
            </div>

            <div className="flex justify-center items-center mt-4">
                <img src={Logo} alt="ScheduleAI Logo" className='w-[2.75vw] 2xl:w-[1.5vw] mr-1'></img>
                <h1 className="hidden sm:flow-root sm:text-3xl font-semibold ml-1">
                    ScheduleAI
                </h1>
            </div>

            {/* Clear Chat Button */}
            <button
                type="button"
                onClick={handleClearChat}
                className="ml-0 mr-auto text-gray-400 text-xs hover:opacity-50 transition-all mb-1 mt-4"
                title="Clear chat"
            >
                Clear Chat
            </button>

            <div className="h-64 sm:h-auto mb-4 flex-grow bg-gray-800 p-5 rounded-lg shadow-lg border border-gray-700 overflow-y-auto custom-scrollbar relative">
                <div className="space-y-3">
                    {/* Welcome Bubble with Help Link */}
                    <div className="self-start max-w-md bg-gray-700 p-3 rounded-lg shadow-md">
                        <p className="text-sm font-semibold text-green-400">Calendar Assistant</p>
                        <div className="prose prose-invert prose-sm max-w-none">
                            <ReactMarkdown>
                                Welcome to ScheduleAI! I'm your intelligent Google Calendar assistant. I can **create**, **reschedule**, and **delete** events using natural language. I can handle **multiple different actions at once**. If you make a mistake, just say **"undo"** and I'll revert any actions I took based on your last prompt.
                            </ReactMarkdown>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm font-semibold transition-colors group"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="underline group-hover:no-underline">More details</span>
                            </button>
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
                        <p></p>
                    )}
                </div>
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="flex mt-1 mb-5">
                <textarea
                    className="w-[90%] p-3 rounded-lg bg-gray-700 text-white text-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Type your message here..."
                    value={isListening ? inputText + (transcript.length ? (inputText.length ? ' ' : '') + transcript : '') : inputText}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    rows={3}
                ></textarea>
                <div className="flex-col space-y-2 ml-3 w-[10%]">
                    <button
                        type="button"
                        className={`size-11 rounded-full ${isListening ? "bg-red-600 hover:bg-red-500" : "bg-white hover:bg-gray-400"} text-white font-semibold text-md transition-all disabled:opacity-50`}
                        disabled={loading}
                        onClick={() => { toggleListening(); }}
                    >
                        <img src={isListening ? StopIcon : MicIcon} className={`ml-auto mr-auto ${isListening ? "size-3" : "size-5"}`} alt="voice-input-button-icons"></img>
                    </button>
                    <button
                        type="submit"
                        className="size-11 rounded-full bg-[#065AD8] hover:bg-blue-700 text-white font-semibold text-md transition-all disabled:opacity-50"
                        disabled={loading}
                    >
                        <img src={SendIcon} alt="Send Icon" className="ml-auto mr-auto size-5 Hublot opacity-[85%] invert"></img>
                    </button>
                </div>
            </form>
        </div>
    );
}

export default Chat;