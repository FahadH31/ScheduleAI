import logo from "./logo.svg";
import "./App.css";

function App() {
  return (
    <div className="w-screen h-screen bg-slate-700 flex">
      <div className="w-1/2 bg-gray-500 h-full p-5 flex justify-center">
        <div className="flex flex-col w-full">
          <h1 className="text-center text-2xl font-bold text-white">
            Create a new Schedule!
          </h1>
          <div className="bg-white flex-grow rounded-xl mt-2 flex justify-center items-center">
            Schedule addition options
          </div>
          <div className="flex gap-4 ">
            <button className="bg-white p-2 rounded-2xl w-full mt-3">
              Submit
            </button>
          </div>
        </div>
      </div>
      <div className="w-1/2 bg-slate-800 h-full p-5 flex justify-center ">
        <div className="flex flex-col w-full">
          <div className="text-white text-2xl text-center font-bold ">
            Open AI Logo and Title
          </div>
          <div className="bg-gray-600 flex-grow rounded-xl mt-2 flex justify-center items-center">
            Text for Chatbot
          </div>
          <div>
            <form>
              <textarea
                className="bg-white p-2 rounded-2xl w-full mt-3 h-24 text-sm resize-none overflow-y-auto custom-scrollbar"
                name="chati"
                placeholder="Talk to your helper here!"
                rows="3"
              ></textarea>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
