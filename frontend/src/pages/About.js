import { Link } from "react-router-dom";
import Logo from "../assets/logo.png";
import DashboardScreenshot from "../assets/sample_screenshot.png";

const About = () => {
    return (
        <>
            <div className="flex h-[100vh] flex-col sm:flex-row text-center animate-fadeIn">
                <div id='left-side' className='flex flex-col text-left w-[45vw] bg-white justify-items-center max-sm:w-[100vw] 
            max-sm:mb-10 max-sm:p-2 max-sm:h-[50vh] max-sm:p-5'>
                    <div className="flex flex-col text-center w-[100vw] bg-white justify-items-center p-10 max-sm:w-[100vw]">
                        <div className="flex items-center mb-4 justify-center sm:justify-start">
                            <img src={Logo} alt="Logo" className="w-10 h-10 mr-3" />
                            <h1 className="text-3xl font-bold text-gray-900">About ScheduleAI</h1>
                        </div>
                        <div className="text-left max-w-[40vw] mx-auto sm:mx-0">
                            <p className="mb-4">
                                ScheduleAI is your intelligent companion for calendar management, designed to bridge the gap between natural conversation and organized scheduling.
                                By connecting your Google Calendar, our AI assistant gains the ability to interpret your intents. Whether you're typing or using voice commands, you can manage your time efficiently and curate your calendar professionally with ease.
                            </p>
                            <Link to="/" className="text-blue-600 font-semibold hover:underline">
                                &larr; Back to Login
                            </Link>
                        </div>
                    </div>
                </div>
                <div id='right-side' className='flex flex-col flex-direction-col w-[55vw] bg-[#065AD8]'>
                    <img src={DashboardScreenshot} alt="dashboard screenshot" className="flex mt-auto mb-auto pl-10 pr-10"></img>
                </div>

            </div>
        </>
    );
};

export default About;