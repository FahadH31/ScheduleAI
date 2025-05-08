// Google Calendar Colour IDs (to provide as context in OpenAI calls)
COLOUR_IDS = `
  1 - baby blue
  2 - lime green
  3 - purple  
  4 - salmon  
  5 - yellow 
  6 - orange  
  7 - blue  
  8 - gray  
  9 - navy blue  
  10 - dark green
  11 - red  
`
// Structured Format necessary to Create Events w/ Google Calendar API (used as context in OpenAI action calls) 
CREATE_EVENT_FORMAT = `{
  "summary": "Google I/O 2015",
  "location": "800 Howard St., San Francisco, CA 94103",
  "description": "A chance to hear more about Google\'s developer products.",
  "colorId": *An integer between 1 and 11 inclusive*, 
  "start": {
    "dateTime": "2015-05-28T09:00:00-07:00",
    "timeZone": "America/Los_Angeles"
  },
  "end": {
    "dateTime": "2015-05-28T17:00:00-07:00",
    "timeZone": "America/Los_Angeles"
  },
  "recurrence": [
    "RRULE:FREQ=DAILY;COUNT=2"
  ],
  "attendees": [
    {"email": "lpage@example.com"},
    {"email": "sbrin@example.com"}
  ],
  "reminders": {
    "useDefault": false,
    "overrides": [
      {"method": "email", "minutes": 1440},
      {"method": "popup", "minutes": 10}
    ]
  }
}`
// Number of recently deleted events to remember (used in undoing deletions)
MAX_DELETED_CACHE = 10

module.exports = {
  COLOUR_IDS,
  CREATE_EVENT_FORMAT,
  MAX_DELETED_CACHE
}