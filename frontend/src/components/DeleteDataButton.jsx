import { useState } from "react";
import { useNavigate } from 'react-router-dom';
const BACKEND_URL = `${import.meta.env.VITE_BACKEND_URL}`;

const DeleteDataButton = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    const handleDelete = async () => {
        try {
            await fetch(`${BACKEND_URL}/api/delete-data`, {
                method: 'POST',
                credentials: 'include'
            });
        }
        catch (error) {
            console.error("Delete data error:", error);
        }
        // Clear frontend storage
        localStorage.clear()
        sessionStorage.clear()
        navigate('/')
    };


    return (
        <>
            {isModalOpen && (
                // Darkened background
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 transition-opacity animate-fadeIn">
                    <div className="bg-gray-900 border border-gray-700/50 rounded-2xl shadow-2xl max-w-3xl w-full p-8 text-white relative max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <p>
                            Are you sure you want to continue? Proceeding will <b>permanently
                                delete all user-specific data </b> from ScheduleAI (conversation history, stored settings, etc.). Your calendar and events will not be impacted.
                        </p>
                        <div className="flex items-center">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="mt-6 w-26 bg-gray-400 text-white font-semibold py-3 px-4 rounded-xl transition-all hover:bg-gray-500 ml-auto mr-2"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="mt-6 w-26 bg-red-500 text-white font-semibold py-3 px-4 rounded-xl transition-all hover:bg-red-600 mr-auto ml-2"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <button
                className="rounded-md bg-red-500 mt-10 w-28 h-12 ml-auto mr-auto mt-auto mb-10 transition-all hover:bg-red-600"
                onClick={() => setIsModalOpen(true)}
            >
                Delete Data
            </button>
        </>
    )
}

export default DeleteDataButton;