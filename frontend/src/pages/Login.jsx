import React, { useEffect, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLoginSuccess = (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const userData = {
        name: decoded.name,
        email: decoded.email,
        picture: decoded.picture,
        id: decoded.sub,
      };
      login(userData);
      navigate('/');
    } catch (error) {
      console.error("Error decoding Google JWT:", error);
      setAuthError('Failed to decode Google credentials. Check console for details.');
    }
  };

  const handleLoginError = (error) => {
    console.error('Google Sign In Failed', error);
    setAuthError(
      error?.error || error?.details || JSON.stringify(error) || 'Login failed, please try again.'
    );
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Welcome to Codeverse</h1>
        <p>Login with your Google account to join or create collaborative coding rooms.</p>
        {authError && (
          <div className="auth-error">
            <strong>Authentication error:</strong> {authError}
          </div>
        )}
        <div className="google-btn-container">
          <GoogleLogin
            onSuccess={handleLoginSuccess}
            onError={handleLoginError}
            shape="rectangular"
            theme="filled_blue"
            size="large"
            text="signin_with"
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
