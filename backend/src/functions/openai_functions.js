const { google } = require('googleapis');
const { MAX_DELETED_CACHE } = require('../constants');

async function callFunction(accessToken, name, args, deletedEventsCache) {
  if (name == "createEvent") {
    return await createEvent(accessToken, args)
  }
  if (name == "updateEvent") {
    return await updateEvent(accessToken, args)
  }
  if (name == "deleteEvent") {
    return await deleteEvent(accessToken, args.eventId, deletedEventsCache)
  }
  if (name == "undoDelete") {
    return await undoDelete(accessToken, args.eventIndices, deletedEventsCache)
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
async function deleteEvent(accessToken, eventId, deletedEventsCache) {
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

    // Store the deleted event in our cache
    deletedEventsCache.unshift({
      eventId: eventId,
      fullEvent: event.data,
      deletedAt: new Date().toISOString()
    });

    // Keep cache size limited
    if (deletedEventsCache.length > MAX_DELETED_CACHE) {
      deletedEventsCache.pop();
    }

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

// Function to undo event deletions
async function undoDelete(accessToken, eventIndices, deletedEventsCache) {
  // If there are no deleted events in the cache
  if (deletedEventsCache.length === 0) {
    return {
      success: false,
      error: "No recently deleted events to restore"
    };
  }

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const calendar = google.calendar({ version: 'v3', auth });

  const results = [];

  for (const i of eventIndices) {
    if (i < 0 || i >= deletedEventsCache.length) continue;

    const deletedEvent = deletedEventsCache[i];

    try {
      // Create a clean version of the event for reinsertion
      // This removes fields that might cause conflicts
      const eventToRestore = { ...deletedEvent.fullEvent };
      delete eventToRestore.id; // Remove ID to prevent conflicts
      delete eventToRestore.etag;
      delete eventToRestore.htmlLink;
      delete eventToRestore.iCalUID;
      delete eventToRestore.sequence;
      delete eventToRestore.created;
      delete eventToRestore.updated;

      // Insert the event as a new event
      const response = await calendar.events.insert({
        calendarId: 'primary',
        resource: eventToRestore,
      });

      // Remove the restored event from cache
      deletedEventsCache.splice(i, 1);

      results.push({
        summary: eventToRestore.summary || "Unknown event",
        success: true,
        newEventId: response.data.id
      });

      console.log(`Event "${eventToRestore.summary}" restored successfully with new ID: ${response.data.id}`);
    } catch (error) {
      console.error(`Error restoring event:`, error);
      results.push({
        summary: deletedEvent.fullEvent.summary || "Unknown event",
        success: false,
        error: error.message
      });
    }
  }

  return {
    success: results.length > 0 && results.every(r => r.success),
    results: results
  };
}



module.exports = { callFunction };