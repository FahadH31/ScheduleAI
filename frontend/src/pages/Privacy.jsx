import { Link } from "react-router-dom";

const Privacy = () => {
    return (
        <div className="min-h-screen bg-white p-10 sm:p-20 animate-fadeIn">
            <div className="max-w-4xl mx-auto text-left">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
                <p className="text-sm text-gray-500 mb-6 font-medium">Last Updated: January 25, 2026</p>
                
                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-3 text-gray-800">1. Information We Collect</h2>
                    <p className="text-gray-700 leading-relaxed">
                        ScheduleAI collects your Google email address and authentication tokens to provide our service. We also access your Google Calendar data, specifically your upcoming events, to allow our AI to manage them on your behalf.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-3 text-gray-800">2. How We Use Your Data</h2>
                    <p className="text-gray-700 leading-relaxed">
                        Your Google data is used exclusively to facilitate calendar management (creating, updating, and deleting events) based on your natural language prompts. We do not sell your personal information to third parties.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-3 text-gray-800">3. Third-Party Data Sharing</h2>
                    <p className="text-gray-700 leading-relaxed">
                        To interpret your scheduling requests, text-based prompts and relevant event summaries are shared with OpenAI. This data is used solely for generating tool-call parameters and is not retained for other purposes.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-3 text-gray-800">4. Google Limited Use Disclosure</h2>
                    <p className="text-gray-700 leading-relaxed">
                        ScheduleAI's use and transfer of information received from Google APIs to any other app will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy#limited-use" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Google API Services User Data Policy</a>, including the Limited Use requirements.
                    </p>
                </section>

                <Link to="/about" className="text-blue-600 font-semibold hover:underline inline-block mt-4">
                    &larr; Back to About
                </Link>
            </div>
        </div>
    );
};

export default Privacy;