import React from "react";
import GoogleCalendarIFrame from "../components/GoogleCalendarIFrame";
import Chat from "../components/Chat";

function Main() {
  return (
    <div className="flex w-full h-screen bg-gray-900 text-white flex-col sm:flex-row">
      <GoogleCalendarIFrame />
      <Chat />
    </div>
  );
}

export default Main;