import { Link } from "react-router-dom";
import GoogleLoginButton from "../components/GoogleLoginButton";
import { GoogleOAuthProvider } from "@react-oauth/google";
import LoginGraphic from "../assets/login_graphic.png"
import Logo from "../assets/logo.png"
import AboutIcon from "../assets//icons/help-circle.svg"

function Login() {
    const GoogleClientID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

    return (
        <GoogleOAuthProvider clientId={GoogleClientID}>
            {/* About Page Link */}
            <Link
                to="/about"
                className="fixed top-6 left-6 z-50 transition-opacity hover:opacity-100 opacity-30"
                title="About ScheduleAI"
            >
                <img src={AboutIcon} alt="About page button icon"></img>
            </Link>

            <div className='flex h-[100vh] flex-col sm:flex-row text-center animate-fadeIn'>
                <div id='left-side' className='flex flex-col text-center w-[50vw] bg-white justify-items-center max-sm:w-[100vw] 
            max-sm:mb-10 max-sm:p-2 max-sm:h-[50vh] max-sm:p-5'>
                    <p className='mt-32 text-4xl font-bold max-sm:text-3xl max-sm:mt-12'>Connect your Calendar</p>
                    <p className='mt-3 text-xl font-light max-sm:text-lg'>Get started by signing in with your Google account!</p>
                    <GoogleLoginButton />
                    <div id='branding' className='flex justify-self-start mb-3 ml-3 mt-auto max-sm:hidden'>
                        <img src={Logo} alt="ScheduleAI Logo" className='w-[3vw] 2xl:w-[1.5vw]'></img>
                        <p className='ml-2 my-auto font-semibold'>ScheduleAI</p>
                    </div>
                </div>
                <div id='right-side' className='flex flex-col flex-direction-col w-[50vw] bg-[#065AD8] 
            justify-center items-center max-sm:w-[100vw] max-sm:h-[75vh] max-sm:p-2'>
                    <img src={LoginGraphic} alt="Login Screen Graphic" className="w-[32vw] h-[32vw] 2xl:w-[25vw] 2xl:h-[25vw]
                max-sm:w-[75vw] max-sm:h-[75vw] max-lg:w-[40vw] max-lg:h-[40vw]"></img>
                    <p className='text-2xl font-bold text-white max-sm:text-xl max-lg:text-3xl'>Enhance your productivity with AI.</p>
                    <p className='text-base mt-2 font-[300] text-white max-sm:text-lg max-lg:text-lg'>Allow an assistant to handle all your scheduling needs.</p>
                </div>
            </div>
        </GoogleOAuthProvider>
    )
}

export default Login;