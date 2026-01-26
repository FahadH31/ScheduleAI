function GoogleCalendarIFrame() {
    const email_address = sessionStorage.getItem("email");
    const user_timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

    // Listener to reload iframe 
    window.addEventListener("message",
        function (e) {
            if (e.origin !== window.location.origin) {
                return;
            }

            if (e.data === "reload") {
                document.getElementById("calendarIFrame").src += '';
            }
        }

    )

    return (
        <div className="relative overflow-hidden w-full h-[full] border border-gray-200 rounded-lg">
            <iframe
                title="Calendar"
                src={`https://calendar.google.com/calendar/embed?src=${email_address}&showPrint=0&showCalendars=0&showTabs=0&ctz=${user_timezone}`}
                className="w-full h-full border-none"
                id="calendarIFrame"
            ></iframe>
            <div 
                className="absolute bottom-0 left-0 w-[200px] h-[26px] bg-[#F0F4F9] z-10"
                aria-hidden="true"
            ></div>

            <div
                className="absolute top-0 right-0 w-[40px] h-[40px] bg-[#F0F4F9] z-10"
                aria-hidden="true"
            ></div>
        </div>
    );
}

export default GoogleCalendarIFrame;