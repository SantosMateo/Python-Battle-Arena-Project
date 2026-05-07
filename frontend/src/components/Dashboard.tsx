import React, { useState } from 'react';
import Arena from './Arena';
import { api } from '../api';
import '../App.css';
interface DashboardProps {
  userId: number;
  username: string;
}

const Dashboard: React.FC<DashboardProps> = ({ userId, username }) => {
  const [view, setView] = useState<'menu' | 'arena' | 'ranking'>('menu');
  const [gameId, setGameId] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const startMatchmaking = async () => {
    setLoading(true);
    try {
      const result = await api.joinOrCreateGame(userId);
      if (result.gameId) {
        setGameId(result.gameId);
        setView('arena');
      } else {
        alert("Couldn't find game");
      }
    } catch (err) {
      alert("Error connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRanking = async () => {
    try {
      const data = await api.getLeaderboard();
      setLeaderboard(data);
      setView('ranking');
    } catch (err) {
      alert("Błąd pobierania rankingu.");
    }
  };

  // Jeśli jesteśmy w trakcie gry
  if (view === 'arena' && gameId) {
    return <Arena userId={userId} gameId={gameId} onBack={() => setView('menu')} />;
  }

  return (
    <div>
      {view === 'menu' ? (
        <div>
          <h2>Hi, {username}!</h2>
          <p>Your ID: {userId}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
            <button 
              onClick={startMatchmaking} 
              disabled={loading}
              style={{ padding: '15px 30px', fontSize: '1.2rem', cursor: 'pointer', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', width: '250px' }}
            >
              {loading ? 'Searching...' : 'FIND OPPONENT'}
            </button>

            <button 
              onClick={fetchRanking} 
              style={{ padding: '15px 30px', fontSize: '1.2rem', cursor: 'pointer', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px', width: '250px' }}
            >
              RANKING (TABELA)
            </button>
          </div>
        </div>
      ) : (
        // --- WIDOK RANKINGU ---
        <div>
          <h2>LEADERBOARD</h2>
          <table style={{ margin: '20px auto', borderCollapse: 'collapse', width: '300px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #333' }}>
                <th>PLAYER</th>
                <th>ELO</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((player, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '8px' }}>{player.username}</td>
                  <td>{player.elo}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="logout-btn" onClick={() => setView('menu')} style={{ padding: '10px 20px', cursor: 'pointer' }}>MENU</button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;