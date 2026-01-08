const { google } = require('googleapis');
const { openaiClient } = require('../authentication');
const { CREATE_EVENT_FORMAT, MAX_DELETED_CACHE, COLOUR_IDS } = require('../constants');

async function callFunction(accessToken, name, args){
  if(name == "createEvent"){
    return await createEvent(accessToken, args)
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

// Function to delete an event from the user's Google Calendar
async function deleteEvent(accessToken, prompt, deletedEventsCache, currentDate, timeZone, upcomingEvents) {
  const deleteEventCompletion = await openaiClient.chat.completions.create({
    model: "gpt-3.5-turbo",
    temperature: 0.25,
    messages: [
      {
        role: "system",
        content: `You are an assistant that deletes events using Google Calendar. 
            The current date/time is ${currentDate}. The user's timezone is ${timeZone}.
            When asked to delete any number of events, you will identify the correct events to delete 
            and respond with ONLY the event ids in a comma seperated list, regardless of user input. 
            Following are the user's upcoming events with their IDs: ${upcomingEvents}`
      },
      { role: "user", content: prompt },
    ],
  });

  eventIds = deleteEventCompletion.choices[0].message.content;
  var eventIdArray = eventIds.split(',').map(id => id.trim());

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const calendar = google.calendar({ version: 'v3', auth });

  const results = [];

  // First, get full event details before deleting
  for (let i = 0; i < eventIdArray.length; i++) {
    try {
      // Get the full event details before deletion
      const event = await calendar.events.get({
        calendarId: 'primary',
        eventId: eventIdArray[i],
      });

      // Delete the event
      await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventIdArray[i],
      });

      // Store the deleted event in our cache
      deletedEventsCache.unshift({
        eventId: eventIdArray[i],
        fullEvent: event.data,
        deletedAt: new Date().toISOString()
      });

      // Keep cache size limited
      if (deletedEventsCache.length > MAX_DELETED_CACHE) {
        deletedEventsCache.pop();
      }

      console.log(`Event with ID ${eventIdArray[i]} deleted successfully.`);
      results.push({
        eventId: eventIdArray[i],
        success: true
      });
    } catch (error) {
      console.error(`Error deleting event ${eventIdArray[i]}:`, error);
      results.push({
        eventId: eventIdArray[i],
        success: false,
        error: error.message
      });
    }
  }

  return {
    success: results.every(r => r.success),
    results: results
  };
}

// Function to undo event deletions
async function undoDelete(accessToken, prompt, deletedEventsCache) {
  // If there are no deleted events in the cache
  if (deletedEventsCache.length === 0) {
    return {
      success: false,
      error: "No recently deleted events to restore"
    };
  }

  const undoCompletion = await openaiClient.chat.completions.create({
    model: "gpt-3.5-turbo",
    temperature: 0.25,
    messages: [
      {
        role: "system",
        content: `You are an assistant that helps users restore recently deleted Google Calendar events.
        The user wants to undo a deletion. Based on their prompt and the list of recently deleted events,
        determine which events they want to restore. If they don't specify or just say "undo delete", 
        assume they want to restore the most recently deleted event.
        RESPOND ONLY with the indices (starting from 0) of the deletedEventsCache array to restore, 
        comma-separated if multiple. For example: "0" or "0,2,3".
        Here are the recently deleted events:
        ${JSON.stringify(deletedEventsCache.map((item, index) => {
          const event = item.fullEvent;
          return {
            index,
            summary: event.summary,
            start: event.start,
            end: event.end,
            deletedAt: item.deletedAt
          };
        }))}`
      },
      { role: "user", content: prompt },
    ],
  });

  const indicesStr = undoCompletion.choices[0].message.content;
  const indicesToRestore = indicesStr.split(',').map(idx => parseInt(idx.trim()));

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const calendar = google.calendar({ version: 'v3', auth });

  const results = [];

  for (const idx of indicesToRestore) {
    if (idx < 0 || idx >= deletedEventsCache.length) continue;

    const deletedEvent = deletedEventsCache[idx];

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

      // Remove the restored event from our cache
      deletedEventsCache.splice(idx, 1);

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

// Function to update an event on the user's Google Calendar
async function updateEvent(accessToken, prompt, currentDate, timeZone, upcomingEvents) {
  const updateEventCompletion = await openaiClient.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.25,
    messages: [
      {
        role: "system",
        content: `
            You are an assistant that updates events using Google Calendar.
            DO NOT change the location, time, recurrence, or color unless the user CLEARLY/DIRECTLY instructs you to do so.
            The current date/time is ${currentDate}. The user's timezone is ${timeZone}.
            When asked to update an event, you will:
            1. Identify the correct event to update based on user input and the upcoming events list.
            2. Respond ONLY with a JSON object in this format:
                  {
                    "eventId": "EVENT_ID_HERE",
                    "updatedEvent": {
                      ${CREATE_EVENT_FORMAT}
                    }
                  }
            
            Update ONLY the details you deem appropriate based on the user input.
            If applicable, colours must be chosen from the following list: ${COLOUR_IDS}  
            Ensure the dates exist in the calendar (e.g no February 29th in non-leap years).
            Following are the user's upcoming events with their IDs: ${upcomingEvents}`
      },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" }
  });

  console.log(updateEventCompletion.choices[0].message.content);
  const { eventId, updatedEvent } = JSON.parse(updateEventCompletion.choices[0].message.content);

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const calendar = google.calendar({ version: 'v3', auth });

  try {
    const response = await calendar.events.patch({
      calendarId: 'primary',
      eventId: eventId,
      resource: updatedEvent,
    });

    console.log(`Event with ID ${eventId} updated successfully.`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error updating event:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {callFunction};