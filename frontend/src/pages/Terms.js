import { Link } from "react-router-dom";

const Terms = () => {
    return (
        <div className="min-h-screen bg-white p-10 sm:p-20 animate-fadeIn">
            <div className="max-w-4xl mx-auto text-left">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
                <p className="text-sm text-gray-500 mb-6 font-medium">Last Updated: January 25, 2026</p>

                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-3 text-gray-800">1. Acceptance of Terms</h2>
                    <p className="text-gray-700 leading-relaxed">
                        By using ScheduleAI, you agree to these Terms of Service. This is a student-led project intended for personal calendar management and educational purposes.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-3 text-gray-800">2. User Responsibilities</h2>
                    <p className="text-gray-700 leading-relaxed">
                        You are responsible for all actions taken through your account. Because AI interpretations can occasionally be inaccurate, you should verify critical calendar modifications manually via the Google Calendar interface.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-3 text-gray-800">3. Disclaimer of Warranties</h2>
                    <p className="text-gray-700 leading-relaxed italic">
                        This service is provided "as-is" and "as available" without any warranties of any kind. We do not guarantee the permanent availability of the service or the absolute accuracy of the AI scheduling engine.
                    </p>
                </section>

                <Link to="/about" className="text-blue-600 font-semibold hover:underline inline-block mt-4">
                    &larr; Back to About
                </Link>
            </div>
        </div>
    );
};

export default Terms;