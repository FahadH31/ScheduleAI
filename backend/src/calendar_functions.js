const { google } = require('googleapis');

// Function router
async function callFunction(accessToken, name, args) {
  if (name == "createEvent") {
    return await createEvent(accessToken, args)
  }
  if (name == "updateEvent") {
    return await updateEvent(accessToken, args)
  }
  if (name == "deleteEvent") {
    return await deleteEvent(accessToken, args.eventId)
  }
}

// Function to get the user's upcoming events
async function getUpcomingEvents(accessToken) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const calendar = google.calendar({ version: 'v3', auth });

  try {
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 20,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items;

    if (!events.length) {
      console.log('No upcoming events found.');
      return [];
    }

    // Store event information
    const eventSummaries = events.map(event => ({
      id: event.id,
      summary: event.summary,
      startTime: event.start,
      endTime: event.end,
      location: event.location,
      colorID: event.colorId,
      description: event.description,
    }));

    return eventSummaries;
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}

// Function to create an event for the user's Google Calendar
async function createEvent(accessToken, eventData) {
  console.log(eventData);

  // Insert the data 
  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: "v3", auth });
    const response = await calendar.events.insert({
      auth: auth,
      calendarId: "primary",
      resource: eventData,
    });

    console.log("Event created successfully");
    return { success: true, link: response.data.htmlLink };

  } catch (error) {
    console.error("Error creating event:", error);
    throw new Error("Failed to create Google Calendar event");
  }
}

// Function to update an event on the user's Google Calendar
async function updateEvent(accessToken, eventData) {

  const eventId = eventData.eventId
  const updatedEvent = eventData.updatedEventData

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const calendar = google.calendar({ version: 'v3', auth });

  try {
    const response = await calendar.events.patch({
      calendarId: 'primary',
      eventId: eventId,
      resource: updatedEvent,
    });

    console.log(`Event with ID: ${eventId} updated successfully.`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error updating event:', error);
    return { success: false, error: error.message };
  }
}

// Function to delete an event from the user's Google Calendar
async function deleteEvent(accessToken, eventId) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const calendar = google.calendar({ version: 'v3', auth });

  const results = [];

  try {
    // Get the full event details before deletion
    const event = await calendar.events.get({
      calendarId: 'primary',
      eventId: eventId,
    });

    // Delete the event
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
    });

    console.log(`Event with ID ${eventId} deleted successfully.`);
    results.push({
      eventId: eventId,
      success: true
    });
  } catch (error) {
    console.error(`Error deleting event ${eventId}:`, error);
    results.push({
      eventId: eventId,
      success: false,
      error: error.message
    });
  }

  return {
    success: results.every(r => r.success),
    results: results
  };
}

module.exports = {
  callFunction,
  getUpcomingEvents
};