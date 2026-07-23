import { useState, useEffect } from 'react';
import CustomCalendar from "../components/CustomCalendar";
import Chat from "../components/Chat";
import Settings from "../components/Settings"
import { useLocation, useNavigate } from 'react-router-dom';

const Main = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(location.state?.openTab || 'chat');

  useEffect(() => {
    // If loaded with an openTab state, replace the current history entry without the state so that page refreshes default back to 'chat'.
    if (location.state?.openTab) {
       navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  // Calendar variables
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
      <CustomCalendar viewMode={viewMode} timeZone={timeZone} setViewMode={setViewMode} />
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