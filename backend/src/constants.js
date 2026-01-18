// Conversation length stored and passed in OpenAI calls (including system and tool messages)
CONVERSATION_HISTORY_LENGTH = 20

// Number of existing upcoming events the AI can see (for update/delete functionality) 
VISIBLE_UPCOMING_EVENTS = 30

// Schemas for OpenAI tools
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "createEvent",
            "description": "A function to create the structured data for a Google Calendar event.",
            "parameters": {
                "type": "object",
                "properties": {
                    "summary": {
                        "type": "string",
                        "description": "Title of the event"
                    },
                    "location": {
                        "type": "string",
                        "description": "Geographic location of the event as free-form text."
                    },
                    "description": {
                        "type": "string",
                        "description": "A brief description of the event"
                    },
                    "start": {
                        "type": "object",
                        "description": "The (inclusive) start time of the event. For a recurring event, this is the start time of the first instance.",
                        "properties": {
                            "dateTime": {
                                "type": "string",
                                "description": "Event's start time in ISO 8601 format"
                            },
                            "timeZone": {
                                "type": "string",
                                "description": "Formatted as an IANA Time Zone Database name, e.g. Europe/Zurich."
                            }
                        },
                        "required": [
                            "dateTime",
                            "timeZone"
                        ]
                    },
                    "end": {
                        "type": "object",
                        "description": "The (exclusive) end time of the event. For a recurring event, this is the end time of the first instance.",
                        "properties": {
                            "dateTime": {
                                "type": "string",
                                "description": "Event's end time in ISO 8601 format"
                            },
                            "timeZone": {
                                "type": "string",
                                "description": "Formatted as an IANA Time Zone Database name, e.g. Europe/Zurich."
                            }
                        },
                        "required": [
                            "dateTime",
                            "timeZone"
                        ]
                    },
                    "colorId": {
                        "type": "string",
                        "description": "The ID of the color to assign to the event. 1 = Baby Blue. 2 = Lime Green. 3 = Purple.  4 = Salmon.  5 = Yellow. 6 = Orange  7 = Blue  8 = Gray  9 = Navy Blue. 10 = Dark Green. 11 = Red ",
                        "enum": [
                            "1",
                            "2",
                            "3",
                            "4",
                            "5",
                            "6",
                            "7",
                            "8",
                            "9",
                            "10",
                            "11"
                        ]
                    },
                    "recurrence": {
                        "type": "array",
                        "items": {
                            "type": "string"
                        },
                        "description": "List of RRULE, EXRULE, RDATE and EXDATE lines for a recurring event, as specified in RFC5545. Note that DTSTART and DTEND lines are not allowed in this field; event start and end times are specified in the start and end fields. This field is omitted for single events or instances of recurring events."
                    },
                    "reminders": {
                        "type": "object",
                        "properties": {
                            "useDefault": {
                                "type": "boolean",
                                "description": "Whether the default reminders of the calendar apply to the event."
                            },
                            "overrides": {
                                "type": "array",
                                "description": "If the event doesn't use the default reminders, this lists the reminders specific to the event, or, if not set, indicates that no reminders are set for this event. The maximum number of override reminders is 5.",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "method": {
                                            "type": "string",
                                            "description": "The method used by this reminder. Possible values are: email - Reminders are sent via email. popup - Reminders are sent via a UI popup. Required when adding a reminder."
                                        },
                                        "minutes": {
                                            "type": "number",
                                            "description": "Number of minutes before the start of the event when the reminder should trigger. Valid values are between 0 and 40320 (4 weeks in minutes). Required when adding a reminder."
                                        }
                                    }
                                }
                            }
                        },
                        "required": [
                            "useDefault",
                            "overrides"
                        ]
                    }
                },
                "required": [
                    "summary",
                    "description",
                    "start",
                    "end"
                ]
            }
        },
    },
    {
        "type": "function",
        "function": {
            "name": "updateEvent",
            "description": "A function to provide the structured data for updated fields of an existing Google Calendar event.",
            "parameters": {
                "type": "object",
                "properties": {
                    "eventId": {
                        "type": "string",
                        "description": "ID associated with the event to update"
                    },
                    "updatedEventData": {
                        "type": "object",
                        "description": "Fields/data that can be updated to fulfill the user request.",
                        "properties": {
                            "summary": {
                                "type": "string",
                                "description": "Title of the event"
                            },
                            "location": {
                                "type": "string",
                                "description": "Geographic location of the event as free-form text."
                            },
                            "description": {
                                "type": "string",
                                "description": "A brief description of the event"
                            },
                            "start": {
                                "type": "object",
                                "description": "The (inclusive) start time of the event. For a recurring event, this is the start time of the first instance.",
                                "properties": {
                                    "dateTime": {
                                        "type": "string",
                                        "description": "Event's start time in ISO 8601 format"
                                    },
                                    "timeZone": {
                                        "type": "string",
                                        "description": "Formatted as an IANA Time Zone Database name, e.g. Europe/Zurich."
                                    }
                                },
                            },
                            "end": {
                                "type": "object",
                                "description": "The (exclusive) end time of the event. For a recurring event, this is the end time of the first instance.",
                                "properties": {
                                    "dateTime": {
                                        "type": "string",
                                        "description": "Event's end time in ISO 8601 format"
                                    },
                                    "timeZone": {
                                        "type": "string",
                                        "description": "Formatted as an IANA Time Zone Database name, e.g. Europe/Zurich."
                                    }
                                },
                            },
                            "colorId": {
                                "type": "string",
                                "description": "The ID of the color to assign to the event. 1 = Baby Blue. 2 = Lime Green. 3 = Purple.  4 = Salmon.  5 = Yellow. 6 = Orange  7 = Blue  8 = Gray  9 = Navy Blue. 10 = Dark Green. 11 = Red ",
                                "enum": [
                                    "1",
                                    "2",
                                    "3",
                                    "4",
                                    "5",
                                    "6",
                                    "7",
                                    "8",
                                    "9",
                                    "10",
                                    "11"
                                ]
                            },
                            "recurrence": {
                                "type": "array",
                                "items": {
                                    "type": "string"
                                },
                                "description": "List of RRULE, EXRULE, RDATE and EXDATE lines for a recurring event, as specified in RFC5545. Note that DTSTART and DTEND lines are not allowed in this field; event start and end times are specified in the start and end fields. This field is omitted for single events or instances of recurring events."
                            },
                            "reminders": {
                                "type": "object",
                                "properties": {
                                    "useDefault": {
                                        "type": "boolean",
                                        "description": "Whether the default reminders of the calendar apply to the event."
                                    },
                                    "overrides": {
                                        "type": "array",
                                        "description": "If the event doesn't use the default reminders, this lists the reminders specific to the event, or, if not set, indicates that no reminders are set for this event. The maximum number of override reminders is 5.",
                                        "items": {
                                            "type": "object",
                                            "properties": {
                                                "method": {
                                                    "type": "string",
                                                    "description": "The method used by this reminder. Possible values are: email - Reminders are sent via email. popup - Reminders are sent via a UI popup. Required when adding a reminder."
                                                },
                                                "minutes": {
                                                    "type": "number",
                                                    "description": "Number of minutes before the start of the event when the reminder should trigger. Valid values are between 0 and 40320 (4 weeks in minutes). Required when adding a reminder."
                                                }
                                            }
                                        }
                                    }
                                },
                            }
                        }
                    },
                },
                "required": ["eventId", "updatedEventData"]
            }
        },
    },
    {
        "type": "function",
        "function": {
            "name": "deleteEvent",
            "description": "A function to return the ID corresponding to a Google Calendar event to delete.",
            "parameters": {
                "type": "object",
                "properties": {
                    "eventId": {
                        "type": "string",
                        "description": "ID associated with the event to be deleted."
                    },
                },
                "required": ["eventId"]
            }
        }
    },
    {
        "type": "function",
        "function":{
            "name": "undoPrompt",
            "description": "Reverses the ENTIRE previous user turn (all commands in the previous turn). Only call this tool once to undo the most recent user message."
        }
    }
]

module.exports = {
    CONVERSATION_HISTORY_LENGTH,
    TOOLS,
}