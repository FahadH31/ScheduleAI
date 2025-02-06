import React from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';

const GoogleLoginButton = () => {
  const navigate = useNavigate();

  const handleSuccess = (credentialResponse) => {
    console.log('Login Successful:', credentialResponse);

    localStorage.setItem("isAuthenticated", "true"); 

    navigate('/dashboard');
  };

  const handleError = () => {
    console.log('Login Failed');
  };

  return (
    <GoogleOAuthProvider clientId = "679265817947-kbqpfqnln5e28k3ni070iclurq1hggb7.apps.googleusercontent.com">
      <div class = 'self-center mt-5'>
        <GoogleLogin onSuccess={handleSuccess} onError={handleError} />
      </div>
    </GoogleOAuthProvider>
  );
};

export default GoogleLoginButton;
