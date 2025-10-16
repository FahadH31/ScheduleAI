function GoogleCalendarIFrame() {

    const email_address = sessionStorage.getItem("email");


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
            src= {`https://calendar.google.com/calendar/embed?src=${email_address}&mode=AGENDA&showPrint=0&showCalendars=0&showTz=0`}
            className="sm:w-[90%] h-full"
            id = "calendarIFrame"
        >
        </iframe>
    );
}

export default GoogleCalendarIFrame;