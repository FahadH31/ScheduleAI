function GoogleCalendarIFrame() {
    
    const email_address = sessionStorage.getItem("email");

    return (
        <iframe 
            title= "Calendar"
            src= {`https://calendar.google.com/calendar/embed?src=${email_address}`}
            className="w-3/4 h-full"
        >
        </iframe>
    );
}


export default GoogleCalendarIFrame;