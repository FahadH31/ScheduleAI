import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const GoogleLoginButton = () => {
  const navigate = useNavigate();

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {

      const tokens = await axios.post(`
        ${process.env.REACT_APP_BACKEND_URL}/api/google-auth`, 
        {tokenResponse},
        {withCredentials: true}
      );
      console.log("Login Successful");

      // get email from backend
      const email = tokens.data.email;
      sessionStorage.setItem("email", email); // Store the email address (used for getting iframe)

      navigate('/dashboard');
    },
    flow: "auth-code",
    scope: "https://www.googleapis.com/auth/calendar",
    onError: () => {
      console.log("Login Failed");
    },
  });

  return (
    <div className="self-center mt-5">
      <button
        onClick={() => login()}
        className="flex items-center justify-center w-full p-2 space-x-2 border 
        border-gray-300 rounded-md shadow-sm hover:bg-gray-100 
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-200 ease-in-out"
      >
        <img
          src="https://www.google.com/favicon.ico"
          alt="Google logo"
          className="w-5 h-5"
        />
        <span className="text-sm font-medium text-gray-600">Sign in with Google</span>
      </button>

    </div>
  );
};

export default GoogleLoginButton;
