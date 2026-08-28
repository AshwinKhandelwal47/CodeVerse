import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="app-header">
      <div className="logo-container" onClick={() => navigate('/')}>
        <h2>{'{ Codeverse }'}</h2>
      </div>
      
      <div className="auth-container">
        {user ? (
          <div className="user-profile">
            <img src={user.picture} alt={user.name} className="user-avatar" referrerPolicy="no-referrer" />
            <span className="user-name">{user.name}</span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        ) : (
          <button onClick={() => navigate('/login')} className="login-btn">Login / Signup</button>
        )}
      </div>
    </header>
  );
};

export default Header;
