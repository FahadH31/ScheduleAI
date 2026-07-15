import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import momentTimezonePlugin from '@fullcalendar/moment-timezone';
import ScheduleAILogo from '../assets/logo.png';
import './CustomCalendar.css';

// Hex color codes mapping standard Google Calendar event color IDs (1-11)
const getGoogleEventColors = (colorId) => {
  const colors = {
    '1': { bg: '#e8f0fe', border: '#1a73e8', text: '#1a73e8', name: 'Lavender' }, // Baby Blue
    '2': { bg: '#e6f4ea', border: '#137333', text: '#137333', name: 'Sage' }, // Lime Green
    '3': { bg: '#f3e8fd', border: '#8ab4f8', text: '#b06000', name: 'Grape' }, // Purple (Mapped to grape hex)
    '4': { bg: '#fce8e6', border: '#c5221f', text: '#c5221f', name: 'Flamingo' }, // Salmon
    '5': { bg: '#fef7e0', border: '#b06000', text: '#b06000', name: 'Banana' }, // Yellow
    '6': { bg: '#feefe3', border: '#e06000', text: '#e06000', name: 'Tangerine' }, // Orange
    '7': { bg: '#e4f7fb', border: '#007b83', text: '#007b83', name: 'Peacock' }, // Blue
    '8': { bg: '#f1f3f4', border: '#5f6368', text: '#3c4043', name: 'Graphite' }, // Gray
    '9': { bg: '#e8f0fe', border: '#1a73e8', text: '#1a73e8', name: 'Blueberry' }, // Navy Blue
    '10': { bg: '#e6f4ea', border: '#137333', text: '#137333', name: 'Basil' }, // Dark Green
    '11': { bg: '#fce8e6', border: '#c5221f', text: '#c5221f', name: 'Tomato' }  // Red
  };

  // Google Calendar default event color (Peacock blue accent)
  return colors[colorId] || { bg: '#e8f0fe', border: '#1a73e8', text: '#1a73e8', name: 'Default Blue' };
};

// Inline SVGs for Google Calendar icons
const CalendarLogo = () => (
  <div className="calendar-logo-icon">
    <span>{new Date().getDate()}</span>
  </div>
);

const ClockIcon = () => (
  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const MapPinIcon = () => (
  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const AlignLeftIcon = () => (
  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h12M4 18h8" />
  </svg>
);

const InfoIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

// Date formatting helper that mimics Google Calendar display formats
const formatEventTime = (startStr, endStr, allDay, timeZone) => {
  if (!startStr) return '';
  
  const start = new Date(startStr);
  const end = endStr ? new Date(endStr) : null;
  
  const dateOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    timeZone: timeZone 
  };
  
  const timeOptions = { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true,
    timeZone: timeZone
  };

  const getTZName = (dateObj) => {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timeZone,
        timeZoneName: 'short'
      });
      const parts = formatter.formatToParts(dateObj);
      const tzPart = parts.find(part => part.type === 'timeZoneName');
      return tzPart ? tzPart.value : '';
    } catch (e) {
      return '';
    }
  };

  const startDay = start.toLocaleDateString('en-US', dateOptions);
  const tzName = getTZName(start);

  if (allDay) {
    if (end) {
      const adjustedEnd = new Date(end);
      adjustedEnd.setDate(adjustedEnd.getDate() - 1); // Google Calendar all-day end-dates are exclusive
      const endDay = adjustedEnd.toLocaleDateString('en-US', dateOptions);
      
      if (startDay === endDay) {
        return `${startDay} (All day)`;
      } else {
        return `${startDay} – ${endDay} (All day)`;
      }
    }
    return `${startDay} (All day)`;
  }

  const startTime = start.toLocaleTimeString('en-US', timeOptions);
  
  if (end) {
    const endDay = end.toLocaleDateString('en-US', dateOptions);
    const endTime = end.toLocaleTimeString('en-US', timeOptions);
    
    if (startDay === endDay) {
      return `${startDay} • ${startTime} – ${endTime} (${tzName})`;
    } else {
      return `${startDay}, ${startTime} – ${endDay}, ${endTime} (${tzName})`;
    }
  }
  
  return `${startDay} • ${startTime} (${tzName})`;
};

const CustomCalendar = (props) => {
  const { viewMode, timeZone } = props;
  const calendarRef = useRef(null);
  const dropdownRef = useRef(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState('');
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleViewChange = (val) => {
    localStorage.setItem("viewMode", val);
    if (props.setViewMode) {
      props.setViewMode(val);
    }
  };

  // Sync settings view mode prop to FullCalendar view
  useEffect(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      let fcView = 'dayGridMonth';
      if (viewMode === 'WEEK') fcView = 'timeGridWeek';
      if (viewMode === 'AGENDA') fcView = 'timeGridDay';
      calendarApi.changeView(fcView);
    }
  }, [viewMode]);

  // Fetch events function
  const loadEvents = async (start, end) => {
    if (!start || !end) return;
    setLoading(true);
    setError(null);
    try {
      const url = `${process.env.REACT_APP_BACKEND_URL}/api/calendar-events?timeMin=${encodeURIComponent(start)}&timeMax=${encodeURIComponent(end)}&t=${Date.now()}`;
      const response = await fetch(url, {
        credentials: 'include'
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || `Server returned status ${response.status}`);
      }
      const data = await response.json();
      
      if (data.success) {
        const mapped = data.events
          .filter(event => event.status !== 'cancelled' && event.start)
          .map(event => ({
            id: event.id,
            title: event.summary || "(No Title)",
            start: event.start.dateTime || event.start.date,
            end: event.end ? (event.end.dateTime || event.end.date) : (event.start.dateTime || event.start.date),
            allDay: !event.start.dateTime,
            extendedProps: {
              colorId: event.colorId,
              description: event.description,
              location: event.location,
              rawStart: event.start,
              rawEnd: event.end
            }
          }));
        console.log("API calendar-events loaded. Count:", data.events?.length, "Mapped:", mapped.length);
        setEvents(mapped);
      } else {
        throw new Error(data.error || "Failed to load events");
      }
    } catch (err) {
      console.error("Error fetching events:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch events when the dates or timezone changes
  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      loadEvents(dateRange.start, dateRange.end);
    }
  }, [dateRange, timeZone]);

  // Listen for 'reload' window message (triggered after AI actions)
  useEffect(() => {
    const handleMessage = (e) => {
      if (e.origin !== window.location.origin) return;
      if (e.data === 'reload') {
        if (dateRange.start && dateRange.end) {
          loadEvents(dateRange.start, dateRange.end);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [dateRange]);

  // FullCalendar event callbacks
  const handleDatesSet = (dateInfo) => {
    setDateRange({ start: dateInfo.startStr, end: dateInfo.endStr });
    setTitle(dateInfo.view.title);
  };

  const handleEventClick = (clickInfo) => {
    const ev = clickInfo.event;
    setSelectedEvent({
      id: ev.id,
      title: ev.title,
      start: ev.start,
      end: ev.end,
      allDay: ev.allDay,
      colorId: ev.extendedProps.colorId,
      description: ev.extendedProps.description,
      location: ev.extendedProps.location,
      rawStart: ev.extendedProps.rawStart,
      rawEnd: ev.extendedProps.rawEnd
    });
    setIsModalOpen(true);
  };

  // Custom event rendering to style like Google Calendar
  const renderEventContent = (eventInfo) => {
    const colors = getGoogleEventColors(eventInfo.event.extendedProps.colorId);
    const title = eventInfo.event.title;
    const isAllDay = eventInfo.event.allDay;
    const viewType = eventInfo.view.type;

    if (viewType === 'dayGridMonth') {
      // Month view is horizontal pills
      return (
        <div 
          className="w-full px-1.5 py-0.5 rounded text-xs truncate select-none"
          style={{ 
            backgroundColor: colors.bg, 
            color: colors.text,
            borderLeft: `3px solid ${colors.border}`,
            fontWeight: 500,
            lineHeight: '14px'
          }}
          title={title}
        >
          {!isAllDay && <span className="mr-1 opacity-70">{eventInfo.timeText}</span>}
          <span>{title}</span>
        </div>
      );
    } else {
      // Week/Day view is vertical boxes
      return (
        <div 
          className="w-full h-full p-1.5 rounded text-xs select-none flex flex-col overflow-hidden box-border"
          style={{ 
            backgroundColor: colors.bg, 
            color: colors.text,
            borderLeft: `3px solid ${colors.border}`,
            borderRight: '1px solid rgba(26,115,232,0.1)',
            borderTop: '1px solid rgba(26,115,232,0.1)',
            borderBottom: '1px solid rgba(26,115,232,0.1)'
          }}
          title={title}
        >
          <div className="font-semibold truncate">{title}</div>
          {!isAllDay && <div className="opacity-75 mt-0.5">{eventInfo.timeText}</div>}
          {eventInfo.event.extendedProps.location && (
            <div className="opacity-60 text-[10px] truncate mt-0.5 flex items-center gap-0.5">
              <span className="scale-75">📍</span>
              {eventInfo.event.extendedProps.location}
            </div>
          )}
        </div>
      );
    }
  };

  // Custom cell header render for Month View to style active today circle
  const renderDayCellContent = (dayCellInfo) => {
    if (dayCellInfo.view.type !== 'dayGridMonth') return null;
    
    const isToday = dayCellInfo.isToday;
    const isOtherMonth = !dayCellInfo.isCurrent;
    return (
      <div className={`month-day-number ${isToday ? 'is-today' : ''} ${isOtherMonth ? 'other-month' : ''}`}>
        {dayCellInfo.dayNumberText}
      </div>
    );
  };

  // Custom header render for views
  const renderDayHeaderContent = (headerInfo) => {
    const isToday = headerInfo.isToday;
    const date = headerInfo.date;
    
    // Format weekday name and date number in the calendar's timezone to prevent offset shifting
    const dayName = date.toLocaleDateString('en-US', { 
      weekday: 'short',
      timeZone: timeZone 
    });
    
    if (headerInfo.view.type === 'dayGridMonth') {
      return (
        <span className={`weekday-name ${isToday ? 'is-today' : ''}`}>{dayName}</span>
      );
    }

    const dayNumber = date.toLocaleDateString('en-US', { 
      day: 'numeric',
      timeZone: timeZone 
    });

    return (
      <div className="weekday-header-custom">
        <span className={`weekday-name ${isToday ? 'is-today' : ''}`}>{dayName}</span>
        <span className={`weekday-number ${isToday ? 'is-today' : ''}`}>{dayNumber}</span>
      </div>
    );
  };

  // Navigation handlers driven by FullCalendar API
  const handleToday = () => {
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      api.today();
    }
  };

  const handlePrev = () => {
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      api.prev();
    }
  };

  const handleNext = () => {
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      api.next();
    }
  };


  return (
    <div className="w-full sm:w-[58%] md:w-[60%] lg:w-[63%] xl:w-[65%] h-1/2 sm:h-full flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden select-none relative">
      {/* Header Toolbar */}
      <header className="calendar-header">
        <div className="calendar-header-left">
          <div className="calendar-logo-container">
            <img src={ScheduleAILogo} className="h-8 object-contain" alt="ScheduleAI Logo" />
          </div>
          
          <div className="calendar-nav-controls">
            <button className="btn-today" onClick={handleToday}>Today</button>
            <button className="nav-arrow" onClick={handlePrev} title="Previous">
              <ChevronLeftIcon />
            </button>
            <button className="nav-arrow" onClick={handleNext} title="Next">
              <ChevronRightIcon />
            </button>
            <span className="current-date-text font-medium">{title}</span>
          </div>
        </div>

        {/* Custom View Mode Switcher Dropdown (Google Calendar Style) */}
        <div className="calendar-header-right" ref={dropdownRef}>
          <div className="custom-dropdown">
            <button 
              className="dropdown-trigger" 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-haspopup="listbox"
              aria-expanded={isDropdownOpen}
            >
              <span>{viewMode === 'MONTH' ? 'Month' : viewMode === 'WEEK' ? 'Week' : 'Day'}</span>
              <svg className={`dropdown-chevron ${isDropdownOpen ? 'open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            
            {isDropdownOpen && (
              <div className="dropdown-menu" role="listbox">
                <div 
                  className={`dropdown-item ${viewMode === 'MONTH' ? 'is-selected' : ''}`}
                  role="option"
                  aria-selected={viewMode === 'MONTH'}
                  onClick={() => {
                    handleViewChange('MONTH');
                    setIsDropdownOpen(false);
                  }}
                >
                  <span className="item-checkmark">{viewMode === 'MONTH' ? '✓' : ''}</span>
                  <span className="item-text">Month</span>
                  <span className="item-shortcut">M</span>
                </div>
                <div 
                  className={`dropdown-item ${viewMode === 'WEEK' ? 'is-selected' : ''}`}
                  role="option"
                  aria-selected={viewMode === 'WEEK'}
                  onClick={() => {
                    handleViewChange('WEEK');
                    setIsDropdownOpen(false);
                  }}
                >
                  <span className="item-checkmark">{viewMode === 'WEEK' ? '✓' : ''}</span>
                  <span className="item-text">Week</span>
                  <span className="item-shortcut">W</span>
                </div>
                <div 
                  className={`dropdown-item ${viewMode === 'AGENDA' ? 'is-selected' : ''}`}
                  role="option"
                  aria-selected={viewMode === 'AGENDA'}
                  onClick={() => {
                    handleViewChange('AGENDA');
                    setIsDropdownOpen(false);
                  }}
                >
                  <span className="item-checkmark">{viewMode === 'AGENDA' ? '✓' : ''}</span>
                  <span className="item-text">Day</span>
                  <span className="item-shortcut">D</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-2.5 text-xs border-b border-red-200 flex items-center justify-between z-20 font-medium">
          <span>Error loading events: {error}. Please refresh or try signing in again.</span>
          <button className="font-bold ml-2 text-red-500 hover:text-red-700 text-lg leading-none" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Google-like linear loading bar */}
      {loading && <div className="linear-progress-bar" />}

      {/* Calendar Area */}
      <div className="flex-1 min-h-0 flex flex-col p-4 custom-calendar-container">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, momentTimezonePlugin]}
          initialView={viewMode === 'WEEK' ? 'timeGridWeek' : viewMode === 'AGENDA' ? 'timeGridDay' : 'dayGridMonth'}
          headerToolbar={false} // We provide our own beautiful custom header
          events={events}
          timeZone={timeZone}
          nowIndicator={true}
          dayMaxEvents={true}
          height="100%"
          datesSet={handleDatesSet}
          eventClick={handleEventClick}
          eventContent={renderEventContent}
          dayCellContent={renderDayCellContent}
          dayHeaderContent={renderDayHeaderContent}
          allDaySlot={false}
          slotEventOverlap={true}
          scrollTime="07:00:00"
          firstDay={0} // Start week on Sunday
          eventTimeFormat={{
            hour: 'numeric',
            minute: '2-digit',
            meridiem: 'short',
            omitZeroMinute: true
          }}
          slotLabelFormat={{
            hour: 'numeric',
            minute: '2-digit',
            omitZeroMinute: true,
            meridiem: 'short'
          }}
          slotLabelContent={(arg) => {
            const formatted = arg.text.replace(/(\d+(?::\d+)?)\s*([ap]m)/i, '$1 $2').toUpperCase();
            return <span>{formatted}</span>;
          }}
        />
      </div>

      {/* Event Details Card Modal */}
      {isModalOpen && selectedEvent && (() => {
        const colors = getGoogleEventColors(selectedEvent.colorId);
        return (
          <div className="event-details-backdrop" onClick={() => setIsModalOpen(false)}>
            <div className="event-details-card" onClick={(e) => e.stopPropagation()}>
              <div className="event-details-content">
                <div className="event-details-top-bar">
                  <button className="btn-close-details" onClick={() => setIsModalOpen(false)}>
                    <XIcon />
                  </button>
                </div>

                <div className="event-details-row">
                  <div className="event-details-icon-col">
                    <span 
                      className="inline-block w-4 h-4 rounded-full" 
                      style={{ backgroundColor: colors.border }}
                      title={`Google Color ID: ${selectedEvent.colorId || 'Default'}`}
                    />
                  </div>
                  <div className="event-details-info-col">
                    <h2 className="event-details-title">{selectedEvent.title}</h2>
                  </div>
                </div>

                <div className="event-details-row">
                  <div className="event-details-icon-col">
                    <ClockIcon />
                  </div>
                  <div className="event-details-info-col">
                    <div className="event-details-time">
                      {formatEventTime(selectedEvent.start, selectedEvent.end, selectedEvent.allDay, timeZone)}
                    </div>
                  </div>
                </div>

                {selectedEvent.location && (
                  <div className="event-details-row">
                    <div className="event-details-icon-col">
                      <MapPinIcon />
                    </div>
                    <div className="event-details-info-col">
                      <div className="event-details-location">{selectedEvent.location}</div>
                    </div>
                  </div>
                )}

                {selectedEvent.description && (
                  <div className="event-details-row">
                    <div className="event-details-icon-col">
                      <AlignLeftIcon />
                    </div>
                    <div className="event-details-info-col">
                      <div className="event-details-description">{selectedEvent.description}</div>
                    </div>
                  </div>
                )}

                <div className="event-details-ai-hint">
                  <InfoIcon />
                  <span>To edit or delete this event, ask the AI Assistant in the chat!</span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default CustomCalendar;
