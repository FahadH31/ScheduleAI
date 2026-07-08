import { useState } from 'react';
import GoogleCalendarIFrame from "../components/GoogleCalendarIFrame";
import Chat from "../components/Chat";
import Settings from "../components/Settings"

function Main() {
  const [activeTab, setActiveTab] = useState('chat')
  // Calendar iframe variables
  const [viewMode, setViewMode] = useState(() => localStorage.getItem("viewMode") || "MONTH")
  const [timeZone, setTimeZone] = useState(() => localStorage.getItem("timeZone") || Intl.DateTimeFormat().resolvedOptions().timeZone)

  const changeTab = () => {
    if (activeTab === 'chat') {
      setActiveTab('settings');
    } else {
      setActiveTab('chat')
    }
  }

  return (
    <div className="flex w-full h-screen bg-gray-900 text-white flex-col sm:flex-row">
      <GoogleCalendarIFrame viewMode={viewMode} timeZone={timeZone} />
      {activeTab === 'chat' ? (
        <Chat onSettingsClick={changeTab} />
      ) : (
        <Settings 
          onBackClick={changeTab} 
          viewMode={viewMode} 
          timeZone={timeZone}
          setViewMode={setViewMode} 
          setTimeZone={setTimeZone} 
        />
      )}
    </div>
  );
}

export default Main;