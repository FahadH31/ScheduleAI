import BackIcon from "../assets/icons/back.svg"
import DeleteDataButton from "../components/DeleteDataButton"

const Settings = (props) => {
    const onBackClick = props.onBackClick;
    const viewMode = props.viewMode;
    const timeZone = props.timeZone;
    const setViewMode = props.setViewMode;
    const setTimeZone = props.setTimeZone;

    const timezones = Intl.supportedValuesOf('timeZone');

    const updateView = (value) => {
        localStorage.setItem("viewMode", value);
        setViewMode(value);
    }

    const updateTimeZone = (value) => {
        localStorage.setItem("timeZone", value);
        setTimeZone(value);
    }

    return (
        <div className="flex flex-col p-3 sm:w-1/2 sm:p-6 animate-fadeIn z-20">
            {/* Back Button */}
            <button
                className="ml-0 mr-auto transition-opacity hover:opacity-50"
                onClick={onBackClick}
                title="Back"
            >
                <img src={BackIcon} className="size-5" alt="Back icon"></img>
            </button>
            <div className="flex flex-col justify-center items-center mt-4">
                <h1 className="hidden sm:flow-root sm:text-3xl font-semibold ml-1"> Settings </h1>
                {/* Input groups */}
                <div className="mt-6 flex flex-col ml-2 mr-2 w-full">
                    <div className="flex flex-col mb-5">
                        <label className="mb-1">View</label>
                        <select
                            className="w-28 h-10 rounded-md border-red-400 text-black outline-none border-0 pl-1"
                            value={viewMode}
                            onChange={(e) => updateView(e.target.value)}
                        >
                            <option value="MONTH">Month</option>
                            <option value="AGENDA">Day</option>
                            <option value="WEEK">Week</option>
                        </select>
                    </div>
                    <div className="flex flex-col mb-5">
                        <label className="mb-1">Time Zone</label>
                        <select
                            className="w-60 h-10 rounded-md border-red-400 text-black outline-none border-0 pl-1"
                            value={timeZone}
                            onChange={(e) => updateTimeZone(e.target.value)}
                        >
                            {/* Get all TZs */}
                            {timezones.map
                                ((tz) => (
                                    <option key={tz} value={tz}>
                                        {tz.replace('_', ' ')}
                                    </option>
                                ))}
                        </select>
                    </div>
                    <DeleteDataButton />
                </div>

            </div>
        </div>
    )
}

export default Settings;