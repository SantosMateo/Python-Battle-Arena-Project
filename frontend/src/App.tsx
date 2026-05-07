import React, { useState } from 'react';
import { api } from './api';
import Dashboard from './components/Dashboard';
import Docs from './components/Docs';
import './App.css'; // <--- DODAJ IMPORT

const App: React.FC = () => {
  const [user, setUser] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showDocs, setShowDocs] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = isRegister ? await api.register(formData) : await api.login(formData);
      if (result.error) {
        alert(`Błąd: ${result.error}`);
        return;
      }
      if (isRegister) {
        alert("Account created! Now you can sign in.");
        setIsRegister(false);
        return;
      }
      if (result.token && result.userId) {
        localStorage.setItem('token', result.token);
        setUserId(result.userId);
        setUser(formData.username);
      }
    } catch (err) {
      alert("Connection error.");
    }
  };

  return (
    <div className="app-container"> {/* <--- ZMIANA KLASY */}
      {!user ? (
        <div>
          <h1>BATTLE ARENA</h1>
          <h2>{isRegister ? 'Sign up' : 'Sign in'}</h2>
          <form onSubmit={handleAuth}>
            <input 
              type="text" 
              placeholder="Username" 
              onChange={e => setFormData({...formData, username: e.target.value})} 
            />
            <input 
              type="password" 
              placeholder="Password" 
              onChange={e => setFormData({...formData, password: e.target.value})} 
            />
            <button type="submit">
              {isRegister ? 'Create Account' : 'Enter Arena'}
            </button>
          </form>
          <button 
            className="switch-auth-btn" 
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister ? 'Already got an account? Log in' : "Don't have an account? Sign up here"}
          </button>
        </div>
      ) : (
        <Dashboard userId={userId!} username={user} />
      )}

      <hr />
      <button className="docs-toggle-btn" onClick={() => setShowDocs(!showDocs)}>
        {showDocs ? 'Hide' : 'Show'} Documentation
      </button>
      {showDocs && <Docs />}
      
      {user && (
        <button 
          className="logout-btn"
          onClick={() => { setUser(null); setUserId(null); localStorage.removeItem('token'); }} 
        >
          Logout
        </button>
      )}
    </div>
  );
};

export default App;