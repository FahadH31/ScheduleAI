const { google } = require('googleapis');

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

module.exports = {
  getUpcomingEvents
};