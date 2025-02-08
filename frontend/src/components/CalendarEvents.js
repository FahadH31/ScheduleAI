import React, { useState } from "react";
import axios from "axios";

const CalendarEvents = () => {
  const [events, setEvents] = useState([]);

  const fetchEvents = async () => {
    const accessToken = sessionStorage.getItem("accessToken");
    if (!accessToken) return alert("No access token found. Please log in.");

    try {
      const { data } = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/calendar/fetch-events`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setEvents(data);
    } catch (err) {
      console.error("Error fetching events:", err);
      alert("Failed to fetch events.");
    }
  };

  return (
    <div>
      <button onClick={fetchEvents}>Fetch Events</button>
      {events.map((event) => (
        <p key={event.id}>{event.summary}</p>
      ))}
    </div>
  );
};

export default CalendarEvents;
