import React, { useState, useEffect, useRef } from 'react';
import moment from 'moment-timezone';
import ScheduleAILogo from '../assets/logo.png';

// Maps Google Calendar event color IDs (1-11) to Hex color values for light mode (matching original)
const getGoogleEventColors = (colorId) => {
  const colors = {
    '1': { bg: '#e8f0fe', border: '#1a73e8', text: '#1a73e8', name: 'Lavender' },
    '2': { bg: '#e6f4ea', border: '#137333', text: '#137333', name: 'Sage' },
    '3': { bg: '#f3e8fd', border: '#8ab4f8', text: '#b06000', name: 'Grape' },
    '4': { bg: '#fce8e6', border: '#c5221f', text: '#c5221f', name: 'Flamingo' },
    '5': { bg: '#fef7e0', border: '#b06000', text: '#b06000', name: 'Banana' },
    '6': { bg: '#feefe3', border: '#e06000', text: '#e06000', name: 'Tangerine' },
    '7': { bg: '#e4f7fb', border: '#007b83', text: '#007b83', name: 'Peacock' },
    '8': { bg: '#f1f3f4', border: '#5f6368', text: '#3c4043', name: 'Graphite' },
    '9': { bg: '#e8f0fe', border: '#1a73e8', text: '#1a73e8', name: 'Blueberry' },
    '10': { bg: '#e6f4ea', border: '#137333', text: '#137333', name: 'Basil' },
    '11': { bg: '#fce8e6', border: '#c5221f', text: '#c5221f', name: 'Tomato' }
  };

  return colors[colorId] || { bg: '#e8f0fe', border: '#1a73e8', text: '#1a73e8', name: 'Default Blue' };
};

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
  <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const BellIcon = () => (
  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
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

// Helper to format event date/time displays using moment-timezone
const formatEventTime = (startStr, endStr, allDay, timeZone) => {
  if (!startStr) return '';
  
  const start = moment.tz(startStr, timeZone);
  const end = endStr ? moment.tz(endStr, timeZone) : null;
  
  const dateOptions = 'dddd, MMMM D, YYYY';
  
  if (allDay) {
    if (end) {
      // Google Calendar all-day end dates are exclusive, so we subtract 1 day to show it inclusively
      const adjustedEnd = end.clone().subtract(1, 'day');
      if (start.isSame(adjustedEnd, 'day')) {
        return `${start.format(dateOptions)} (All day)`;
      } else {
        return `${start.format(dateOptions)} – ${adjustedEnd.format(dateOptions)} (All day)`;
      }
    }
    return `${start.format(dateOptions)} (All day)`;
  }
  
  const startTime = start.format('h:mm A');
  const tzName = start.format('z'); // short timezone name like EST, PST
  
  if (end) {
    const endTime = end.format('h:mm A');
    if (start.isSame(end, 'day')) {
      return `${start.format(dateOptions)} • ${startTime} – ${endTime} (${tzName})`;
    } else {
      return `${start.format('MMMM D, YYYY, h:mm A')} – ${end.format('MMMM D, YYYY, h:mm A')} (${tzName})`;
    }
  }
  
  return `${start.format(dateOptions)} • ${startTime} (${tzName})`;
};

// Check if an event falls on a specific day in the given timezone
const isEventOnDay = (event, day, timeZone) => {
  const dayStart = day.clone().startOf('day');
  const dayEnd = day.clone().endOf('day');
  
  let eventStart, eventEnd;
  if (event.allDay) {
    eventStart = moment.tz(event.start, 'YYYY-MM-DD', timeZone).startOf('day');
    eventEnd = moment.tz(event.end, 'YYYY-MM-DD', timeZone).startOf('day');
    return eventStart.isBefore(dayEnd) && eventEnd.isAfter(dayStart);
  } else {
    eventStart = moment.tz(event.start, timeZone);
    eventEnd = moment.tz(event.end, timeZone);
    return eventStart.isBefore(dayEnd) && eventEnd.isAfter(dayStart);
  }
};

// Layout positioning math for Week/Day views with event overlap support
const getEventPositions = (dayEvents, day, timeZone) => {
  const dayStart = day.clone().startOf('day');
  const dayEnd = day.clone().endOf('day');

  // Map events to start hour and duration in the timezone
  const eventsWithTimes = dayEvents.map(e => {
    const startVal = moment.tz(e.start, timeZone);
    const endVal = moment.tz(e.end, timeZone);
    
    const clampStart = moment.max(startVal, dayStart);
    const clampEnd = moment.min(endVal, dayEnd);
    
    const startHour = clampStart.hours() + clampStart.minutes() / 60;
    const endHour = clampEnd.hours() + clampEnd.minutes() / 60;
    const duration = Math.max(0.5, endHour - startHour); // Minimum 30 mins visual height
    
    return {
      event: e,
      startHour,
      endHour,
      duration
    };
  });

  // Sort by start hour, then duration (longest first)
  eventsWithTimes.sort((a, b) => {
    if (a.startHour !== b.startHour) {
      return a.startHour - b.startHour;
    }
    return b.duration - a.duration;
  });

  // Distribute events into columns to resolve overlapping
  const columns = [];
  eventsWithTimes.forEach(item => {
    let placed = false;
    for (let i = 0; i < columns.length; i++) {
      const hasOverlap = columns[i].some(placedItem => {
        return item.startHour < placedItem.endHour && item.endHour > placedItem.startHour;
      });
      
      if (!hasOverlap) {
        columns[i].push(item);
        placed = true;
        break;
      }
    }
    if (!placed) {
      columns.push([item]);
    }
  });

  // Calculate final absolute styles
  const positions = {};
  columns.forEach((col, colIdx) => {
    col.forEach(item => {
      positions[item.event.id] = {
        top: item.startHour * 60,
        height: item.duration * 60,
        colIdx,
        totalCols: columns.length
      };
    });
  });

  return positions;
};

// Generates 42 days representing the 6-week grid of a month view
const getDaysInMonthGrid = (date, tz) => {
  const startOfMonth = moment.tz(date, tz).startOf('month');
  const startOfGrid = startOfMonth.clone().startOf('week');
  
  const days = [];
  let curr = startOfGrid.clone();
  for (let i = 0; i < 42; i++) {
    days.push(curr.clone());
    curr.add(1, 'day');
  }
  return days;
};

const CustomCalendar = (props) => {
  const { viewMode, timeZone } = props;
  const dropdownRef = useRef(null);
  const scrollContainerRef = useRef(null);
  
  const [currentDate, setCurrentDate] = useState(() => moment().tz(timeZone));
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Sync currentDate when timezone updates
  useEffect(() => {
    setCurrentDate(prev => prev.clone().tz(timeZone));
  }, [timeZone]);

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

  // Calculate loaded range when currentDate, viewMode, or timeZone changes
  useEffect(() => {
    let start, end;
    if (viewMode === 'MONTH') {
      const daysInGrid = getDaysInMonthGrid(currentDate, timeZone);
      start = daysInGrid[0].clone().startOf('day').toISOString();
      end = daysInGrid[daysInGrid.length - 1].clone().endOf('day').toISOString();
    } else if (viewMode === 'WEEK') {
      const startOfWeek = moment.tz(currentDate, timeZone).startOf('week');
      const endOfWeek = moment.tz(currentDate, timeZone).endOf('week');
      start = startOfWeek.startOf('day').toISOString();
      end = endOfWeek.endOf('day').toISOString();
    } else {
      // AGENDA (Day view)
      const startOfDay = moment.tz(currentDate, timeZone).startOf('day');
      const endOfDay = moment.tz(currentDate, timeZone).endOf('day');
      start = startOfDay.toISOString();
      end = endOfDay.toISOString();
    }
    setDateRange({ start, end });
  }, [currentDate, viewMode, timeZone]);

  // Fetch events based on current dateRange
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
              rawEnd: event.end,
              reminders: event.reminders
            }
          }));
        console.log("API calendar-events loaded. Count:", data.events?.length, "Mapped:", mapped.length);
        setEvents(prevEvents => {
          const newEvents = [...prevEvents];
          mapped.forEach(incomingEvent => {
            const index = newEvents.findIndex(e => e.id === incomingEvent.id);
            if (index > -1) {
              newEvents[index] = incomingEvent; // Update if changed
            } else {
              newEvents.push(incomingEvent);
            }
          });
          return newEvents;
        });
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

  // Reload events on dateRange/timezone updates
  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      loadEvents(dateRange.start, dateRange.end);
    }
  }, [dateRange, timeZone]);

  // Listen for chatbot updates
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

  // Scroll to starting work hours (e.g. 7 AM) when switching views
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 7 * 60; // 7 AM * 60px height
    }
  }, [viewMode]);

  const handleToday = () => {
    setCurrentDate(moment().tz(timeZone));
  };

  const handlePrev = () => {
    setCurrentDate(prev => {
      const nextDate = prev.clone();
      if (viewMode === 'MONTH') return nextDate.subtract(1, 'month');
      if (viewMode === 'WEEK') return nextDate.subtract(1, 'week');
      return nextDate.subtract(1, 'day');
    });
  };

  const handleNext = () => {
    setCurrentDate(prev => {
      const nextDate = prev.clone();
      if (viewMode === 'MONTH') return nextDate.add(1, 'month');
      if (viewMode === 'WEEK') return nextDate.add(1, 'week');
      return nextDate.add(1, 'day');
    });
  };

  const handleEventClick = (e) => {
    setSelectedEvent({
      id: e.id,
      title: e.title,
      start: e.start,
      end: e.end,
      allDay: e.allDay,
      colorId: e.extendedProps?.colorId,
      description: e.extendedProps?.description,
      location: e.extendedProps?.location,
      rawStart: e.extendedProps?.rawStart,
      rawEnd: e.extendedProps?.rawEnd,
      reminders: e.extendedProps?.reminders
    });
    setIsModalOpen(true);
  };

  const getHeaderTitle = () => {
    const m = moment.tz(currentDate, timeZone);
    if (viewMode === 'MONTH') {
      return m.format('MMMM YYYY');
    } else if (viewMode === 'WEEK') {
      const start = m.clone().startOf('week');
      const end = m.clone().endOf('week');
      if (start.month() === end.month()) {
        return start.format('MMMM YYYY');
      } else if (start.year() === end.year()) {
        return `${start.format('MMM')} – ${end.format('MMM YYYY')}`;
      } else {
        return `${start.format('MMM YYYY')} – ${end.format('MMM YYYY')}`;
      }
    } else {
      return m.format('MMMM D, YYYY');
    }
  };

  const formatHour = (h) => {
    if (h === 0) return '12 AM';
    if (h === 12) return '12 PM';
    if (h < 12) return `${h} AM`;
    return `${h - 12} PM`;
  };

  // Month View Renderer
  const renderMonthView = () => {
    const daysInGrid = getDaysInMonthGrid(currentDate, timeZone);
    const weeks = [];
    for (let i = 0; i < daysInGrid.length; i += 7) {
      weeks.push(daysInGrid.slice(i, i + 7));
    }

    return (
      <div className="flex-1 flex flex-col min-h-0 bg-white">
        {/* Grid Header */}
        <div className="grid grid-cols-7 bg-white py-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="text-center text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Weeks rows */}
        <div className="flex-1 flex flex-col min-h-0 divide-y divide-[#dadce0]/50">
          {weeks.map((weekDays, weekIdx) => (
            <div key={weekIdx} className="flex-1 min-h-0 grid grid-cols-7 divide-x divide-[#dadce0]/50">
              {weekDays.map((day, dayIdx) => {
                const isToday = day.isSame(moment(), 'day');
                const isCurrentMonth = day.month() === currentDate.month();
                const dayEvents = events.filter(e => isEventOnDay(e, day, timeZone));

                // Sort events: all-day first, then by start time
                dayEvents.sort((a, b) => {
                  if (a.allDay && !b.allDay) return -1;
                  if (!a.allDay && b.allDay) return 1;
                  return moment(a.start).valueOf() - moment(b.start).valueOf();
                });

                const displayLimit = 3;
                const visibleEvents = dayEvents.slice(0, displayLimit);
                const extraCount = dayEvents.length - displayLimit;

                return (
                  <div 
                    key={dayIdx} 
                    className="flex flex-col p-1 sm:p-1.5 min-h-0 overflow-hidden relative group bg-white"
                  >
                    <div className="flex justify-between items-center mb-0.5 sm:mb-1">
                      <button 
                        onClick={() => {
                          setCurrentDate(day);
                          handleViewChange('AGENDA');
                        }}
                        className={`text-[10px] sm:text-xs w-6 h-6 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                          isToday 
                            ? 'bg-[#1a73e8] text-white font-semibold shadow-sm' 
                            : isCurrentMonth 
                              ? 'text-[#3c4043] font-medium' 
                              : 'text-gray-400'
                        }`}
                      >
                        {day.format('D')}
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
                      {visibleEvents.map(e => {
                        const colors = getGoogleEventColors(e.extendedProps?.colorId || e.colorId);
                        return (
                          <div
                            key={e.id}
                            onClick={() => handleEventClick(e)}
                            className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] truncate select-none border-l-2 font-medium cursor-pointer transition-all hover:brightness-95"
                            style={{
                              backgroundColor: colors.bg,
                              color: colors.text,
                              borderColor: colors.border
                            }}
                            title={e.title}
                          >
                            {!e.allDay && (
                              <span className="opacity-80 mr-1 font-normal">
                                {moment.tz(e.start, timeZone).format('h:mm A')}
                              </span>
                            )}
                            {e.title}
                          </div>
                        );
                      })}
                      {extraCount > 0 && (
                        <button
                          onClick={() => {
                            setCurrentDate(day);
                            handleViewChange('AGENDA');
                          }}
                          className="text-[9px] text-[#1a73e8] hover:text-blue-700 font-semibold px-1 py-0.5 text-left block w-full hover:bg-blue-50/50 rounded"
                        >
                          + {extraCount} more
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Week View Renderer
  const renderWeekView = () => {
    const startOfWeek = moment.tz(currentDate, timeZone).startOf('week');
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(startOfWeek.clone().add(i, 'days'));
    }

    const hasAnyAllDay = events.some(e => e.allDay && days.some(day => isEventOnDay(e, day, timeZone)));

    return (
      <div className="flex-1 flex flex-col min-h-0 bg-white">
        {/* Days Header */}
        <div className="flex bg-white">
          <div className="w-14 border-r border-[#dadce0]/50 flex-shrink-0" />
          <div className="flex-1 grid grid-cols-7 divide-x divide-[#dadce0]/50">
            {days.map((day, idx) => {
              const isToday = day.isSame(moment(), 'day');
              return (
                <div key={idx} className="py-2 flex flex-col items-center justify-center">
                  <span className={`text-[10px] font-semibold tracking-wider uppercase ${isToday ? 'text-[#1a73e8] font-bold' : 'text-gray-500'}`}>
                    {day.format('ddd')}
                  </span>
                  <span className={`text-xs sm:text-sm font-medium mt-0.5 flex items-center justify-center w-7 h-7 rounded-full ${isToday ? 'bg-[#1a73e8] text-white shadow-sm font-semibold' : 'text-[#3c4043]'}`}>
                    {day.format('D')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* All-Day Events row */}
        {hasAnyAllDay && (
          <div className="flex border-b border-[#dadce0]/50 bg-white border-t border-[#dadce0]/50">
            <div className="w-14 border-r border-[#dadce0]/50 flex-shrink-0 flex items-center justify-center text-[10px] text-gray-500 uppercase font-semibold">all-day</div>
            <div className="flex-1 grid grid-cols-7 divide-x divide-[#dadce0]/50 min-h-[32px] py-1">
              {days.map((day, idx) => {
                const dayAllDayEvents = events.filter(e => e.allDay && isEventOnDay(e, day, timeZone));
                return (
                  <div key={idx} className="px-1 space-y-1">
                    {dayAllDayEvents.map(e => {
                      const colors = getGoogleEventColors(e.extendedProps?.colorId || e.colorId);
                      return (
                        <div 
                          key={e.id}
                          onClick={() => handleEventClick(e)}
                          className="px-1.5 py-0.5 rounded text-[9px] truncate cursor-pointer font-medium hover:brightness-95 border-l-2"
                          style={{ backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }}
                        >
                          {e.title}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Scrollable Hourly Area */}
        <div ref={scrollContainerRef} className={`flex-1 overflow-y-auto relative custom-scrollbar bg-white ${hasAnyAllDay ? '' : 'border-t border-[#dadce0]/50'}`}>
          <div className="flex h-[1440px] relative">
            {/* Time markers */}
            <div className="w-14 border-r border-[#dadce0]/50 bg-white flex-shrink-0 relative select-none">
              {Array.from({ length: 24 }).map((_, hour) => (
                <div key={hour} className="absolute left-0 right-0 text-right pr-2 text-[10px] text-gray-400 font-medium" style={{ top: `${hour * 60 - 6}px` }}>
                  {hour === 0 ? '' : formatHour(hour)}
                </div>
              ))}
            </div>

            {/* Grid & Events */}
            <div className="flex-1 relative">
              {/* Hour Grid Lines */}
              {Array.from({ length: 24 }).map((_, hour) => (
                <div key={hour} className="absolute left-0 right-0 border-t border-[#dadce0]/25" style={{ top: `${hour * 60}px`, height: '1px' }} />
              ))}

              {/* Day Columns */}
              <div className="absolute inset-0 grid grid-cols-7 divide-x divide-[#dadce0]/50">
                {days.map((day, idx) => {
                  const dayTimedEvents = events.filter(e => !e.allDay && isEventOnDay(e, day, timeZone));
                  const positions = getEventPositions(dayTimedEvents, day, timeZone);
                  const isToday = day.isSame(moment(), 'day');

                  return (
                    <div key={idx} className="h-full relative bg-white">
                      {/* Render Events */}
                      {dayTimedEvents.map(e => {
                        const pos = positions[e.id];
                        if (!pos) return null;
                        const colors = getGoogleEventColors(e.extendedProps?.colorId || e.colorId);
                        return (
                          <div 
                            key={e.id}
                            onClick={() => handleEventClick(e)}
                            className="absolute rounded p-1 text-[9px] sm:text-[10px] overflow-hidden select-none cursor-pointer border-l-[3px] border-t border-b border-r font-medium flex flex-col justify-start transition-all hover:brightness-95 shadow-sm"
                            style={{
                              top: `${pos.top}px`,
                              height: `${pos.height}px`,
                              left: `${pos.colIdx * (100 / pos.totalCols)}%`,
                              width: `${(100 / pos.totalCols) - 1.5}%`,
                              backgroundColor: colors.bg,
                              color: colors.text,
                              borderColor: colors.border,
                              borderTopColor: `${colors.border}15`,
                              borderRightColor: `${colors.border}15`,
                              borderBottomColor: `${colors.border}15`
                            }}
                          >
                            <div className="font-semibold truncate leading-tight">{e.title}</div>
                            {pos.height >= 35 && (
                              <div className="opacity-80 mt-0.5 text-[8px] font-normal">
                                {moment.tz(e.start, timeZone).format('h:mm A')}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Today Timeline Line */}
                      {isToday && (() => {
                        const now = moment().tz(timeZone);
                        const nowHour = now.hours() + now.minutes() / 60;
                        const topPos = nowHour * 60;
                        return (
                          <div className="absolute left-0 right-0 border-t-2 border-red-500 z-10 pointer-events-none" style={{ top: `${topPos}px` }}>
                            <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-red-500 shadow-sm" />
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Day View (Agenda) Renderer
  const renderDayView = () => {
    const dayAllDayEvents = events.filter(e => e.allDay && isEventOnDay(e, currentDate, timeZone));
    const dayTimedEvents = events.filter(e => !e.allDay && isEventOnDay(e, currentDate, timeZone));
    const positions = getEventPositions(dayTimedEvents, currentDate, timeZone);
    const isToday = currentDate.isSame(moment(), 'day');

    return (
      <div className="flex-1 flex flex-col min-h-0 bg-white">
        {/* Header (No border-b as requested) */}
        <div className="flex bg-white">
          <div className="w-14 border-r border-[#dadce0]/50 flex-shrink-0" />
          <div className="flex-1 py-2 flex flex-col items-center justify-center">
            <span className={`text-[10px] font-semibold tracking-wider uppercase ${isToday ? 'text-[#1a73e8] font-bold' : 'text-gray-500'}`}>
              {currentDate.format('dddd')}
            </span>
            <span className={`text-xs sm:text-sm font-medium mt-0.5 flex items-center justify-center w-7 h-7 rounded-full ${isToday ? 'bg-[#1a73e8] text-white shadow-sm font-semibold' : 'text-[#3c4043]'}`}>
              {currentDate.format('D')}
            </span>
          </div>
        </div>

        {/* All-Day Events row (Pure white background) */}
        {dayAllDayEvents.length > 0 && (
          <div className="flex border-b border-[#dadce0]/50 bg-white border-t border-[#dadce0]/50">
            <div className="w-14 border-r border-[#dadce0]/50 flex-shrink-0 flex items-center justify-center text-[10px] text-gray-500 uppercase font-semibold">all-day</div>
            <div className="flex-1 min-h-[32px] py-1 px-1.5 space-y-1">
              {dayAllDayEvents.map(e => {
                const colors = getGoogleEventColors(e.extendedProps?.colorId || e.colorId);
                return (
                  <div 
                    key={e.id}
                    onClick={() => handleEventClick(e)}
                    className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] truncate cursor-pointer font-medium hover:brightness-95 border-l-2"
                    style={{ backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }}
                  >
                    {e.title}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Scrollable hourly slots */}
        <div ref={scrollContainerRef} className={`flex-1 overflow-y-auto relative custom-scrollbar bg-white ${dayAllDayEvents.length > 0 ? '' : 'border-t border-[#dadce0]/50'}`}>
          <div className="flex h-[1440px] relative">
            {/* Time labels */}
            <div className="w-14 border-r border-[#dadce0]/50 bg-white flex-shrink-0 relative select-none">
              {Array.from({ length: 24 }).map((_, hour) => (
                <div key={hour} className="absolute left-0 right-0 text-right pr-2 text-[10px] text-gray-400 font-medium" style={{ top: `${hour * 60 - 6}px` }}>
                  {hour === 0 ? '' : formatHour(hour)}
                </div>
              ))}
            </div>

            {/* Grid & Events */}
            <div className="flex-1 relative">
              {/* Hour Lines */}
              {Array.from({ length: 24 }).map((_, hour) => (
                <div key={hour} className="absolute left-0 right-0 border-t border-[#dadce0]/25" style={{ top: `${hour * 60}px`, height: '1px' }} />
              ))}

              {/* Single Column */}
              <div className="absolute inset-0 bg-white">
                {dayTimedEvents.map(e => {
                  const pos = positions[e.id];
                  if (!pos) return null;
                  const colors = getGoogleEventColors(e.extendedProps?.colorId || e.colorId);
                  return (
                    <div 
                      key={e.id}
                      onClick={() => handleEventClick(e)}
                      className="absolute rounded p-1.5 text-[10px] sm:text-xs overflow-hidden select-none cursor-pointer border-l-[3px] border-t border-r border-b font-medium flex flex-col justify-start transition-all hover:brightness-95 shadow-sm"
                      style={{
                        top: `${pos.top}px`,
                        height: `${pos.height}px`,
                        left: `${pos.colIdx * (100 / pos.totalCols)}%`,
                        width: `${(100 / pos.totalCols) - 1.5}%`,
                        backgroundColor: colors.bg,
                        color: colors.text,
                        borderColor: colors.border,
                        borderTopColor: `${colors.border}15`,
                        borderRightColor: `${colors.border}15`,
                        borderBottomColor: `${colors.border}15`
                      }}
                    >
                      <div className="font-semibold truncate leading-tight text-xs sm:text-sm">{e.title}</div>
                      {pos.height >= 40 && (
                        <div className="opacity-80 mt-0.5 text-[9px] sm:text-[10px] font-normal">
                          {moment.tz(e.start, timeZone).format('h:mm A')}
                        </div>
                      )}
                      {pos.height >= 55 && e.extendedProps?.location && (
                        <div className="opacity-70 mt-1 text-[9px] sm:text-[10px] truncate flex items-center gap-0.5 font-normal">
                          <span>📍</span> {e.extendedProps.location}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Today Timeline Line */}
                {isToday && (() => {
                  const now = moment().tz(timeZone);
                  const nowHour = now.hours() + now.minutes() / 60;
                  const topPos = nowHour * 60;
                  return (
                    <div className="absolute left-0 right-0 border-t-2 border-red-500 z-10 pointer-events-none" style={{ top: `${topPos}px` }}>
                      <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-red-500 shadow-sm" />
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };


  return (
    <div className="w-full sm:w-[58%] md:w-[60%] lg:w-[63%] xl:w-[65%] h-1/2 sm:h-full flex flex-col bg-white border border-[#dadce0] rounded-2xl shadow-lg overflow-hidden select-none relative text-[#3c4043] font-sans">
      
      {/* Header Toolbar  */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 bg-[#ffffff] z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <img src={ScheduleAILogo} className="h-7 sm:h-8 object-contain" alt="ScheduleAI Logo" />
          </div>
          
          <div className="flex items-center ml-2 sm:ml-5 gap-2">
            <button 
              className="bg-white border border-[#dadce0] hover:bg-gray-50 text-[#3c4043] px-4 sm:px-6 py-1.5 sm:py-2 text-sm font-medium rounded-full transition-all cursor-pointer active:scale-95"
              onClick={handleToday}
            >
              Today
            </button>
            <button 
              className="w-8 sm:w-9 h-8 sm:h-9 rounded-full border border-transparent bg-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-200 flex items-center justify-center transition-all cursor-pointer active:scale-95" 
              onClick={handlePrev} 
              title="Previous"
            >
              <ChevronLeftIcon />
            </button>
            <button 
              className="w-8 sm:w-9 h-8 sm:h-9 rounded-full border border-transparent bg-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-200 flex items-center justify-center transition-all cursor-pointer active:scale-95" 
              onClick={handleNext} 
              title="Next"
            >
              <ChevronRightIcon />
            </button>
            <span className="text-base sm:text-xl font-medium text-[#3c4043] ml-3 select-none tracking-wide truncate max-w-[120px] sm:max-w-none">
              {getHeaderTitle()}
            </span>
          </div>
        </div>

        {/* View Switcher Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            className="flex items-center gap-1.5 bg-white border border-[#dadce0] hover:bg-gray-50 text-[#3c4043] px-4 sm:px-6 py-1.5 sm:py-2 text-sm font-medium rounded-full transition-all cursor-pointer" 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-haspopup="listbox"
            aria-expanded={isDropdownOpen}
          >
            <span>{viewMode === 'MONTH' ? 'Month' : viewMode === 'WEEK' ? 'Week' : 'Day'}</span>
            <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          
          {isDropdownOpen && (
            <div className="absolute right-0 mt-1.5 bg-white border border-[#dadce0] rounded-xl shadow-xl py-1 min-w-[130px] z-30 animate-fadeIn overflow-hidden text-[#3c4043]">
              <div 
                className={`flex items-center justify-between px-4 py-2.5 text-sm transition-colors cursor-pointer hover:bg-gray-100 ${viewMode === 'MONTH' ? 'text-[#1a73e8] bg-blue-50/50 font-bold' : 'text-[#3c4043]'}`}
                onClick={() => {
                  handleViewChange('MONTH');
                  setIsDropdownOpen(false);
                }}
              >
                <span>Month</span>
                <span className="text-xs text-gray-400 font-normal">M</span>
              </div>
              <div 
                className={`flex items-center justify-between px-4 py-2.5 text-sm transition-colors cursor-pointer hover:bg-gray-100 ${viewMode === 'WEEK' ? 'text-[#1a73e8] bg-blue-50/50 font-bold' : 'text-[#3c4043]'}`}
                onClick={() => {
                  handleViewChange('WEEK');
                  setIsDropdownOpen(false);
                }}
              >
                <span>Week</span>
                <span className="text-xs text-gray-400 font-normal">W</span>
              </div>
              <div 
                className={`flex items-center justify-between px-4 py-2.5 text-sm transition-colors cursor-pointer hover:bg-gray-100 ${viewMode === 'AGENDA' ? 'text-[#1a73e8] bg-blue-50/50 font-bold' : 'text-[#3c4043]'}`}
                onClick={() => {
                  handleViewChange('AGENDA');
                  setIsDropdownOpen(false);
                }}
              >
                <span>Day</span>
                <span className="text-xs text-gray-400 font-normal">D</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Loading Indicator */}
      <div className={`h-[3px] w-full bg-blue-50/50 z-20 transition-opacity duration-300 ${loading ? 'opacity-100' : 'opacity-0'} overflow-hidden relative flex-shrink-0`}>
        <div className="absolute top-0 bottom-0 bg-[#1a73e8] rounded-full w-1/3" style={{ animation: 'indeterminate-progress 1.5s infinite ease-in-out' }}></div>
        <style>{`
          @keyframes indeterminate-progress {
            0% { left: -40%; }
            100% { left: 100%; }
          }
        `}</style>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-2.5 text-xs border-b border-red-200 flex items-center justify-between z-20 font-medium">
          <span>Error loading events: {error}. Please refresh or try signing in again.</span>
          <button className="font-bold ml-2 text-red-500 hover:text-red-700 text-lg leading-none" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Main View Area */}
      <div className="flex-1 min-h-0 flex flex-col">
        {viewMode === 'MONTH' ? renderMonthView() : viewMode === 'WEEK' ? renderWeekView() : renderDayView()}
      </div>

      {/* Event Details Modal */}
      {isModalOpen && selectedEvent && (() => {
        const colors = getGoogleEventColors(selectedEvent.colorId);
        return (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50 animate-fadeIn" onClick={() => setIsModalOpen(false)}>
            <div className="bg-white rounded-[24px] shadow-2xl max-w-md w-full overflow-hidden select-text text-[#3c4043] relative transition-all" onClick={(e) => e.stopPropagation()}>

              {/* Close Button */}
              <button 
                className="absolute top-5 right-5 p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-all cursor-pointer z-10" 
                onClick={() => setIsModalOpen(false)}
              >
                <XIcon />
              </button>

              <div className="px-6 pt-5 pb-7 space-y-6">
                {/* Title and Dot */}
                <div className="flex items-start gap-3.5 pr-8">
                  <span 
                    className="w-3.5 h-3.5 rounded-full mt-1.5 flex-shrink-0" 
                    style={{ backgroundColor: colors.border, boxShadow: `0 0 0 4px ${colors.bg}` }}
                    title={`Color ID: ${selectedEvent.colorId || 'Default'}`}
                  />
                  <h2 className="text-[22px] font-semibold text-gray-900 leading-tight tracking-tight">{selectedEvent.title}</h2>
                </div>

                <div className="space-y-4 pt-1">
                  {/* Time */}
                  <div className="flex items-start gap-4 text-[15px] text-gray-700">
                    <div className="mt-0.5 text-gray-400">
                      <ClockIcon />
                    </div>
                    <div className="font-medium">
                      {formatEventTime(selectedEvent.start, selectedEvent.end, selectedEvent.allDay, timeZone)}
                    </div>
                  </div>

                  {/* Location */}
                  {selectedEvent.location && (
                    <div className="flex items-start gap-4 text-[15px] text-gray-700">
                      <div className="mt-0.5 text-gray-400">
                        <MapPinIcon />
                      </div>
                      <div className="break-words max-w-[320px] font-medium">{selectedEvent.location}</div>
                    </div>
                  )}

                  {/* Description */}
                  {selectedEvent.description && (
                    <div className="flex items-start gap-4 text-[15px] text-gray-600">
                      <div className="mt-0.5 text-gray-400 flex-shrink-0">
                        <AlignLeftIcon />
                      </div>
                      <div className="prose prose-sm break-words max-w-[320px] whitespace-pre-line leading-relaxed max-h-40 overflow-y-auto scrollbar-thumb-gray-400 pr-2">
                        {selectedEvent.description}
                      </div>
                    </div>
                  )}

                  {/* Notifications */}
                  {selectedEvent.reminders && (selectedEvent.reminders.useDefault || (selectedEvent.reminders.overrides && selectedEvent.reminders.overrides.length > 0)) && (
                    <div className="flex items-start gap-4 text-[15px] text-gray-600">
                      <div className="mt-0.5 text-gray-400">
                        <BellIcon />
                      </div>
                      <div>
                        {selectedEvent.reminders.useDefault ? (
                          <div>Default notifications</div>
                        ) : (
                          selectedEvent.reminders.overrides.map((reminder, idx) => {
                            const time = reminder.minutes >= 1440 
                              ? `${reminder.minutes / 1440} day(s)` 
                              : reminder.minutes >= 60 
                                ? `${reminder.minutes / 60} hour(s)` 
                                : `${reminder.minutes} minute(s)`;
                            const method = reminder.method === 'email' ? 'Email' : 'Notification';
                            return (
                              <div key={idx}>
                                {method} • {time} before
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-3 bg-blue-50/60 border border-blue-100/60 p-4 rounded-2xl text-[13px] text-blue-700/90 mt-2">
                  <div className="mt-0.5">
                    <InfoIcon />
                  </div>
                  <span className="leading-relaxed font-medium">To edit or delete this event, ask the AI Assistant in the chat!</span>
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
