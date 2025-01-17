import React from "react";
import LoginGraphic from "../assets/login_graphic.png"

function Login() {
    return (
        <div class='flex h-[100vh] max-sm:flex-col max-sm:text-center'>
            <div id='left-side' class='w-[50vw] bg-white justify-items-center max-sm:w-[100vw] 
            max-sm:mb-10 max-sm:p-2'>
                <p class='mt-32 text-4xl font-bold max-sm:text-3xl'>Connect your Calendar</p>
                <p class='mt-3 text-xl font-light max-sm:text-lg'>Get started by signing in with your Google account!</p>
            </div>
            <div id='right-side' class='flex flex-col flex-direction-col w-[50vw] bg-[#065AD8] 
            justify-center items-center max-sm:w-[100vw] max-sm:h-[100vh] max-sm:p-2'>
                <img src={LoginGraphic} alt="" class="w-[40vw] h-[40vw] 2xl:w-[25vw] 2xl:h-[25vw]
                max-sm:w-[75vw] max-sm:h-[75vw]"></img>
                <p class='text-3xl font-bold text-white max-sm:text-xl'>Enhance your productivity with AI.</p>
                <p class='text-lg mt-2 font-[300] text-white max-sm:text-lg'>Allow an assistant to handle all your scheduling needs.</p>
            </div>
        </div>
    )
}

export default Login;