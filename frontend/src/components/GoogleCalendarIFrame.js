function GoogleCalendarIFrame() {

    const email_address = sessionStorage.getItem("email");
    const user_timezone = Intl.DateTimeFormat().resolvedOptions().timeZone


    // Listener to reload iframe 
    window.addEventListener("message",
        function(e) {
            if(e.origin !== window.location.origin){
                return;
            }

            if(e.data === "reload"){
                document.getElementById("calendarIFrame").src += '';            
            }
        }

    )

    return (
        <iframe 
            title= "Calendar"
            src= {`https://calendar.google.com/calendar/embed?src=${email_address}&mode=WEEK&showPrint=0&showCalendars=0&ctz=${user_timezone}`}
            className="sm:w-[90%] h-full"
            id = "calendarIFrame"
        >
        </iframe>
    );
}

export default GoogleCalendarIFrame;