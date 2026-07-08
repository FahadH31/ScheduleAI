import { useState } from 'react';
import GoogleCalendarIFrame from "../components/GoogleCalendarIFrame";
import Chat from "../components/Chat";
import Settings from "../components/Settings"

function Main() {
  const [activeTab, setActiveTab] = useState('chat')

  const setView = () => {
    if (activeTab === 'chat') {
      setActiveTab('settings');
    } else {
      setActiveTab('chat')
    }
  }

  return (
    <div className="flex w-full h-screen bg-gray-900 text-white flex-col sm:flex-row">
      <GoogleCalendarIFrame />
      {activeTab == 'chat' ? <Chat onSettingsClick={setView} /> : <Settings onBackClick={setView} />}
    </div>
  );
}

export default Main;