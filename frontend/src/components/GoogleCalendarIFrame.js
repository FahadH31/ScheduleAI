import { useEffect } from 'react';

function GoogleCalendarIFrame(props) {
    const email_address = sessionStorage.getItem("email");
    const view_mode = props.viewMode;
    const user_timezone = props.timeZone;

    // Listener to reload iframe 
    useEffect(() => {
        const handleMessage = (e) => {
            if (e.origin !== window.location.origin) {
                return;
            }

            if (e.data === "reload") {
                const iframe = document.getElementById("calendarIFrame");
                if (iframe) {
                    iframe.src += '';
                }
            }
        };

        window.addEventListener("message", handleMessage);
        
        return () => {
            window.removeEventListener("message", handleMessage);
        };
    }, []);

    return (
        <div className="relative overflow-hidden w-full h-[full] border border-gray-200 rounded-lg z-10">
            <iframe
                title="Calendar"
                src={`https://calendar.google.com/calendar/embed?src=${email_address}&showPrint=0&showCalendars=0&showTabs=0&ctz=${user_timezone}&mode=${view_mode}`}
                className="w-full h-full border-none"
                id="calendarIFrame"
            ></iframe>
            <div 
                className="absolute bottom-0 left-0 w-[200px] h-[26px] bg-[#F0F4F9]"
                aria-hidden="true"
            ></div>

            <div
                className="absolute top-0 right-0 w-[50px] h-[50px] bg-[#F0F4F9]"
                aria-hidden="true"
            ></div>
        </div>
    );
}

export default GoogleCalendarIFrame;