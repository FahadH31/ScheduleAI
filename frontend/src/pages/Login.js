import React from "react";
import GoogleLoginButton from "../components/GoogleLoginButton";
import LoginGraphic from "../assets/login_graphic.png"
import Logo from "../assets/logo.png"

function Login() {
    return (
        <div class='flex h-[100vh] max-sm:flex-col max-sm:text-center'>
            <div id='left-side' class='flex flex-col text-center w-[50vw] bg-white justify-items-center max-sm:w-[100vw] 
            max-sm:mb-10 max-sm:p-2 max-sm:h-[50vh]'>
                <p class='mt-32 text-4xl font-bold max-sm:text-3xl max-sm:mt-12'>Connect your Calendar</p>
                <p class='mt-3 text-xl font-light max-sm:text-lg'>Get started by signing in with your Google account!</p>
                <GoogleLoginButton />
                <div id = 'branding' class = 'flex justify-self-start mb-3 ml-3 mt-auto max-sm:hidden'>
                    <img src = {Logo} alt = "ScheduleAI Logo" class = 'w-[3vw] 2xl:w-[1.5vw]'></img>
                    <p class = 'ml-2 my-auto font-semibold'>ScheduleAI</p>
                </div>
            </div>
            <div id='right-side' class='flex flex-col flex-direction-col w-[50vw] bg-[#065AD8] 
            justify-center items-center max-sm:w-[100vw] max-sm:h-[75vh] max-sm:p-2'>
                <img src={LoginGraphic} alt="" class="w-[40vw] h-[40vw] 2xl:w-[25vw] 2xl:h-[25vw]
                max-sm:w-[75vw] max-sm:h-[75vw]"></img>
                <p class='text-3xl font-bold text-white max-sm:text-xl'>Enhance your productivity with AI.</p>
                <p class='text-lg mt-2 font-[300] text-white max-sm:text-lg'>Allow an assistant to handle all your scheduling needs.</p>
            </div>
        </div>
    )
}

export default Login;