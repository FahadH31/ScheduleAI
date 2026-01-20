const { google } = require('googleapis');
const { VISIBLE_UPCOMING_EVENTS } = require('./constants');

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
async function getCalendarEvents(accessToken) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const calendar = google.calendar({ version: 'v3', auth });

  // Get the date one week ago, time set to midnight 
  // (this is so the AI can view all events from the past week and onwards)
  const date = new Date()
  date.setHours(0)
  date.setMinutes(0)
  date.setSeconds(0)
  date.setMilliseconds(0)

  const currentDate = date.getDate()
  date.setDate(currentDate-7) // set date to last week

  try {
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: date.toISOString(),
      maxResults: VISIBLE_UPCOMING_EVENTS,
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

    const resultMessage = `Event "${response.data.summary}" created successfully.`
    console.log(resultMessage);

    return { success: true, link: response.data.htmlLink, undoAction: undoAction, resultMessage: resultMessage };

  } catch (error) {
    console.error("Error creating event:", error);
    return { success: false, error: error.message };
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

    const resultMessage = `Event "${cleanedData.summary}" updated successfully.`
    console.log(resultMessage);

    return { success: true, data: response.data, undoAction: undoAction, resultMessage: resultMessage };
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
    const eventName = cleanedData.summary

    // Delete the event
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
    });

    const undoAction = { name: "createEvent", data: cleanedData }

    const resultMessage = `Event "${eventName}" deleted successfully.`
    console.log(resultMessage);

    return { eventId: eventId, success: true, undoAction: undoAction, resultMessage: resultMessage }
  } catch (error) {
    console.error(`Error deleting event: `, error);
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
  getCalendarEvents
};