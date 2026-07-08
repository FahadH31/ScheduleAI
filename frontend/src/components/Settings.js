import BackIcon from "../assets/icons/back.svg"

const Settings = (props) => {
    const onSettingsClick = props.onSettingsClick;
    
    return (
        <div className="flex flex-col p-3 sm:w-1/2 sm:p-6 animate-fadeIn z-20">
            <p>Settings</p>

            {/* Back Button */}
            <button
                className="ml-0 mr-auto transition-opacity hover:opacity-50"
                onClick={onSettingsClick}
                title="Back"
            >
                <img src={BackIcon} className="size-5" alt="Back icon"></img>
            </button>
        </div>
    )
}

export default Settings;