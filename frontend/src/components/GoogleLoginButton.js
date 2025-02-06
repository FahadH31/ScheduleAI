import React from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';

const GoogleLoginButton = () => {
  const GoogleClientID = process.env.REACT_APP_GOOGLE_CLIENT_ID; 
  const navigate = useNavigate();

  const handleSuccess = (credentialResponse) => {
    console.log('Login Successful:', credentialResponse);

    sessionStorage.setItem("isAuthenticated", "true"); 

    navigate('/dashboard');
  };

  const handleError = () => {
    console.log('Login Failed');
  };

  return (
    <GoogleOAuthProvider clientId = {GoogleClientID}>
      <div class = 'self-center mt-5'>
        <GoogleLogin onSuccess={handleSuccess} onError={handleError} />
      </div>
    </GoogleOAuthProvider>
  );
};

export default GoogleLoginButton;
