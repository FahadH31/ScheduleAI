import { useState, useRef, useEffect } from 'react';
import { Link } from "react-router-dom";
import BackIcon from "../assets/icons/back.svg";
import AboutIcon from "../assets//icons/help-circle-grey.svg"
import DeleteDataButton from "../components/DeleteDataButton";

const Settings = (props) => {
    const onBackClick = props.onBackClick;
    const viewMode = props.viewMode;
    const timeZone = props.timeZone;
    const setViewMode = props.setViewMode;
    const setTimeZone = props.setTimeZone;

    const timezones = Intl.supportedValuesOf('timeZone');

    // Dropdown and Search states
    const [isTZOpen, setIsTZOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Ref for outside click detection
    const tzDropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (tzDropdownRef.current && !tzDropdownRef.current.contains(event.target)) {
                setIsTZOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const updateTimeZone = (value) => {
        localStorage.setItem("timeZone", value);
        setTimeZone(value);
    }

    // Filter timezones based on search term
    const filteredTimezones = timezones.filter((tz) =>
        tz.toLowerCase().replace('_', ' ').includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col p-3 sm:w-[42%] md:w-[40%] lg:w-[37%] xl:w-[35%] sm:p-6 animate-fadeIn z-20">
            {/* About Page Link */}
            <Link
                to="/about"
                state = {{from: '/dashboard', openTab: 'settings'}}
                className="fixed top-6 right-6 z-50 transition-opacity hover:opacity-50"
                title="About ScheduleAI"
            >
                <img src={AboutIcon} alt="About page button icon"></img>
            </Link>

            {/* Back Button */}
            <button
                className="ml-0 mr-auto transition-opacity hover:opacity-50"
                onClick={onBackClick}
                title="Back"
            >
                <img src={BackIcon} className="size-5" alt="Back icon"></img>
            </button>
            
            <div className="flex flex-col justify-center items-center mt-4 h-full">
                <h1 className="hidden sm:flow-root sm:text-3xl font-semibold ml-1"> Settings </h1>
                <div className="mt-6 flex flex-col ml-2 mr-2 w-full h-full">
                    
                    {/* Timezone Settings Dropdown */}
                    <div className="flex flex-col w-full">
                        <label className="mb-1.5 text-sm font-medium text-gray-300">Time Zone</label>
                        <div className="relative w-full" ref={tzDropdownRef}>
                            <button
                                className="flex items-center justify-between w-full bg-white border border-[#dadce0] hover:bg-gray-50 text-[#3c4043] px-4 py-2.5 text-sm font-medium rounded-full transition-all cursor-pointer active:scale-[0.99] shadow-sm"
                                onClick={() => {
                                    setIsTZOpen(!isTZOpen);
                                    setSearchTerm("");
                                }}
                                aria-haspopup="listbox"
                                aria-expanded={isTZOpen}
                            >
                                <span className="truncate">{timeZone.replace('_', ' ')}</span>
                                <svg 
                                    className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-150 ${isTZOpen ? 'rotate-180' : ''}`} 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="2.5" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                >
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>

                            {isTZOpen && (
                                <div
                                    className="absolute left-0 right-0 mt-1.5 bg-white border border-[#dadce0] rounded-2xl shadow-xl z-30 animate-fadeIn overflow-hidden text-[#3c4043] flex flex-col"
                                    role="listbox"
                                >
                                    {/* Search Input Bar */}
                                    <div className="p-2 border-b border-[#dadce0] sticky top-0 bg-white z-10">
                                        <input
                                            type="text"
                                            className="w-full px-3 py-1.5 text-xs text-[#3c4043] bg-gray-50 border border-[#dadce0] rounded-full focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
                                            placeholder="Search timezone..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            onClick={(e) => e.stopPropagation()} // prevent dropdown from closing
                                        />
                                    </div>

                                    {/* List items */}
                                    <div className="overflow-y-auto max-h-[200px] custom-scrollbar divide-y divide-gray-100 bg-white">
                                        {filteredTimezones.length > 0 ? (
                                            filteredTimezones.map((tz) => (
                                                <div
                                                    key={tz}
                                                    className={`flex items-center justify-between px-4 py-2 text-xs transition-colors cursor-pointer hover:bg-gray-100 ${
                                                        timeZone === tz ? 'text-[#1a73e8] bg-blue-50/50 font-bold' : 'text-[#3c4043]'
                                                    }`}
                                                    role="option"
                                                    aria-selected={timeZone === tz}
                                                    onClick={() => {
                                                        updateTimeZone(tz);
                                                        setIsTZOpen(false);
                                                        setSearchTerm("");
                                                    }}
                                                >
                                                    <span className="truncate">{tz.replace('_', ' ')}</span>
                                                    {timeZone === tz && <span className="text-[#1a73e8] font-semibold">✓</span>}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-4 py-3 text-xs text-gray-400 text-center bg-white select-none">
                                                No matching timezones
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <DeleteDataButton />
                </div>
            </div>
        </div>
    )
}

export default Settings;