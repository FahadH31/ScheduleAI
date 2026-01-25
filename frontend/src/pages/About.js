import { Link } from "react-router-dom";
import Logo from "../assets/logo.png";
import DashboardScreenshot from "../assets/sample_screenshot.png";

const About = () => {
    return (
        <div className="flex h-full min-h-screen flex-col sm:flex-row text-center animate-fadeIn bg-white">
            <div id='left-side' className='flex flex-col text-left w-full sm:w-[45vw] p-10 overflow-y-auto'>
                <div className="flex items-center mb-3 justify-center sm:justify-start">
                    <img src={Logo} alt="Logo" className="w-10 h-10 mr-3" />
                    <h1 className="text-3xl font-bold text-gray-900">About ScheduleAI</h1>
                </div>
                
                <div className="text-left max-w-full">
                    <p className="mb-6 text-gray-700">
                        ScheduleAI is an intelligent companion for calendar management, designed to bridge the gap between natural conversation and organized scheduling. 
                        By connecting your Google Calendar, our AI assistant interprets your intents to help you manage your time efficiently.
                    </p>

                    <h2 className="text-xl font-bold mb-2 text-gray-800">Privacy Policy</h2>
                    <p className="mb-6 text-gray-700">
                        We access your Google email and Calendar data solely to perform scheduling tasks as requested. 
                        Your data is processed via OpenAI to interpret commands and is stored temporarily in secure sessions. 
                        We adhere to the Google API Services User Data Policy, including Limited Use requirements.
                    </p>

                    <h2 className="text-xl font-bold mb-2 text-gray-800">Terms of Service</h2>
                    <p className="mb-6 text-gray-700">
                        This is a student project provided "as-is." While we strive for accuracy, please verify important events manually. 
                        By using ScheduleAI, you agree to these terms and take responsibility for your calendar modifications.
                    </p>

                    <Link to="/" className="text-blue-600 font-semibold hover:underline">
                        &larr; Back to Login
                    </Link>
                </div>
            </div>

            <div id='right-side' className='hidden sm:flex flex-col w-[55vw] bg-[#065AD8] justify-center items-center p-10'>
                <img src={DashboardScreenshot} alt="dashboard screenshot" className="max-w-full h-auto rounded-lg shadow-2xl" />
            </div>
        </div>
    );
};

export default About;