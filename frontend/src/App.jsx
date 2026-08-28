import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Login from './pages/Login';
import RoomManager from './pages/RoomManager';
import "./App.css";

function App() {
  const envClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const fallbackClientId = '534662031219-ortgjoi9qtd37d7u7h0dk82bk20estqc.apps.googleusercontent.com';
  const clientId = envClientId || fallbackClientId;
  const origin = typeof window !== 'undefined' ? window.location.origin : 'unknown';
  const hasClientId = Boolean(clientId && clientId !== 'YOUR_GOOGLE_CLIENT_ID');
  const usingEnvClientId = Boolean(envClientId && envClientId !== 'YOUR_GOOGLE_CLIENT_ID');

  useEffect(() => {
    console.log('Google OAuth client ID:', clientId);
    console.log('App origin:', origin);
    if (!envClientId) {
      console.warn('VITE_GOOGLE_CLIENT_ID is not set in frontend/.env, using hardcoded fallback client ID.');
    }
  }, [clientId, origin, envClientId]);

  return (
    <GoogleOAuthProvider clientId={hasClientId ? clientId : 'YOUR_GOOGLE_CLIENT_ID'}>
      <AuthProvider>
        <BrowserRouter>
          <div className="app-container">
            <Header />
            <main className="main-content">
              <div className="app-debug-info">
                {/* <p><strong>OAuth client ID:</strong> {clientId || 'not configured'}</p>
                <p><strong>App origin:</strong> {origin}</p> */}
                {!usingEnvClientId && (
                  <p className="auth-warning">
                    VITE_GOOGLE_CLIENT_ID is not loaded from <code>frontend/.env</code>. Using fallback client ID.
                  </p>
                )}
              </div>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<RoomManager />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
