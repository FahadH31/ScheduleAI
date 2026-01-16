const { google } = require('googleapis');

// Function router
async function callFunction(accessToken, name, args, undoStack) {
  if (name == "createEvent") {
    return await createEvent(accessToken, args)
  }
  if (name == "updateEvent") {
    return await updateEvent(accessToken, args)
  }
  if (name == "deleteEvent") {
    return await deleteEvent(accessToken, args.eventId)
  }
  if (name == "undoPrompt") {
    return await undoPrompt(accessToken, undoStack)
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

    const undoAction = { name: "deleteEvent", data: { eventId: response.data.id } }

    console.log("Event created successfully");
    return { success: true, link: response.data.htmlLink, undoAction: undoAction };

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
    const originalEvent = await calendar.events.get({ // get original event data for undo functionality
      auth: auth,
      calendarId: "primary",
      eventId: eventId
    });

    // Clean potentially conflicting fields (upon undo)
    const { etag, updated, created, iCalUID, sequence, ...cleanedData } = originalEvent.data;

    const response = await calendar.events.patch({
      calendarId: 'primary',
      eventId: eventId,
      resource: updatedEvent,
    });

    const undoAction = { name: "updateEvent", data: { eventId: eventId, updatedEventData: cleanedData } }

    console.log(`Event with ID: ${eventId} updated successfully.`);
    return { success: true, data: response.data, undoAction: undoAction };
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

  try {
    // Get event details before deletion for undo functionality
    const originalEvent = await calendar.events.get({
      auth: auth,
      calendarId: "primary",
      eventId: eventId
    });

    // Filter out potentially conflicting fields (upon undo)
    const { id, etag, updated, created, iCalUID, sequence, ...cleanedData } = originalEvent.data;

    // Delete the event
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
    });

    const undoAction = { name: "createEvent", data: cleanedData }

    console.log(`Event with ID ${eventId} deleted successfully.`);
    return { eventId: eventId, success: true, undoAction: undoAction }
  } catch (error) {
    console.error(`Error deleting event ${eventId}:`, error);
    return { eventId: eventId, success: false, error: error.message }
  }
}

// Function to undo a user prompt
async function undoPrompt(accessToken, undoStack) {
  try {
    const lastPrompt = undoStack.pop()

    if (!lastPrompt) {
      return { success: false, error: "Nothing to undo" }
    }

    const results = [];
    // Loop through commands in the last prompt and call respective function w/data to undo each action
    for (let i = lastPrompt.length - 1; i >= 0; i--) { // in reverse order to ensure commands follow original sequence 
      const result = await callFunction(accessToken, lastPrompt[i].name, lastPrompt[i].data)
      results.push(result.success)
    }
    return { success: results.every(res => res === true) };
  } catch (error) {
    return { success: false, error: error.message }
  }
}

module.exports = {
  callFunction,
  getUpcomingEvents
};