import React, { useState, useEffect } from 'react';
import { api } from '../api';

interface ArenaProps {
  userId: number;
  gameId: number;
  onBack: () => void; 
}

const Arena: React.FC<ArenaProps> = ({ userId, gameId, onBack }) => {
  const [gameState, setGameState] = useState<any>(null);
  const [gameInfo, setGameInfo] = useState<any>(null);
  const [message, setMessage] = useState("Initializing...");

  const refreshStatus = async () => {
    try {
      const data = await api.getGameStatus(gameId);
      setGameState(data.state);
      setGameInfo(data.game);

      if (data.game.status === 'finished') {
        setMessage(data.game.winner_id === userId ? "🏆 YOU WON!!!" : "💀 YOU LOSE...");
      } else {
        const isP1 = data.game.player1_id === userId;
        const myAct = isP1 ? data.state.player1_action : data.state.player2_action;
        
        // Handle round draw message from API
        if (data.message === "REMIS" || data.state.message === "REMIS") {
          setMessage("💥 ROUND DRAW 💥");
        } else {
          setMessage(myAct ? "Wait for enemy action..." : "Your Turn!");
        }
      }
    } catch (err) { 
      console.error(err); 
    }
  };

  useEffect(() => {
    refreshStatus();
    const inv = setInterval(refreshStatus, 2000);
    return () => clearInterval(inv);
  }, [gameId]);

  const handleMove = async (move: 'attack' | 'rev_up') => {
    try {
      const res = await api.sendAction(gameId, userId, move);
      // Immediate feedback if round resulted in a draw
      if (res.message === "REMIS") setMessage("💥 ROUND DRAW 💥");
      else setMessage(res.message);
      refreshStatus();
    } catch (err) { 
      console.error(err); 
    }
  };

  if (!gameState || !gameInfo) {
    return <div style={{ color: '#94a3b8', marginTop: '50px' }}>Loading Battle...</div>;
  }

  const isP1 = gameInfo.player1_id === userId;
  const myAcc = isP1 ? parseFloat(gameState.player1_accuracy) : parseFloat(gameState.player2_accuracy);

  return (
    <div className="arena-card" style={{ 
      padding: '30px', 
      borderRadius: '20px', 
      minWidth: '500px', 
      width: 'fit-content',
      maxWidth: '95vw',
      margin: '20px auto', 
      textAlign: 'center', 
      background: '#1e293b', 
      boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
      border: '1px solid #334155'
    }}>
      {/* Header Section */}
      <h2 style={{ 
        color: message.includes("WON") ? "#4caf50" : "#38bdf8", 
        fontSize: '1.8rem',
        margin: '0 0 10px 0',
        textTransform: 'uppercase',
        letterSpacing: '2px'
      }}>
        {message === "💥 ROUND DRAW 💥" ? message : `MATCH #${gameId}`}
      </h2>
      
      <div style={{ fontSize: '3rem', fontWeight: '900', color: '#fff', marginBottom: '10px' }}>
        {gameInfo.player1_score} : {gameInfo.player2_score}
      </div>
      
      <p style={{ 
        fontWeight: 'bold', 
        color: message.includes("Turn") ? "#fbbf24" : "#94a3b8", 
        fontSize: '1.1rem',
        minHeight: '1.5em'
      }}>
        {message}
      </p>
      
      {/* Fighters Section */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'flex-start',
        gap: '50px', 
        marginTop: '30px',
        width: '100%'
      }}>
        {[1, 2].map(p => {
          const isMe = gameInfo[`player${p}_id`] === userId;
          const hp = gameState[`player${p}_hp`];
          const acc = (parseFloat(gameState[`player${p}_accuracy`]) * 100).toFixed(0);
          
          return (
            <div key={p} style={{ 
              width: '220px', 
              display: 'flex',
              flexDirection: 'column',
              alignItems: p === 1 ? 'flex-start' : 'flex-end'
            }}>
              {/* Username with overflow protection */}
              <p style={{ 
                margin: '0 0 10px 0', 
                color: isMe ? '#38bdf8' : '#fff', 
                fontWeight: 'bold',
                fontSize: '1.1rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                width: '100%',
                textAlign: p === 1 ? 'left' : 'right'
              }}>
                {p === 1 ? gameInfo.p1_name : gameInfo.p2_name} {isMe && <span style={{fontSize: '0.8rem'}}>(You)</span>}
              </p>
              
              {/* Health Bar Container */}
              <div style={{ 
                width: '100%', 
                height: '18px', 
                background: '#0f172a', 
                borderRadius: '6px', 
                overflow: 'hidden',
                border: '1px solid #334155',
                position: 'relative',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
              }}>
                <div style={{ 
                  width: `${hp}%`, 
                  height: '100%', 
                  background: hp > 30 ? '#4caf50' : '#ef4444', 
                  transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                  float: p === 1 ? 'left' : 'right',
                  boxShadow: hp > 0 ? `0 0 15px ${hp > 30 ? 'rgba(76, 175, 80, 0.4)' : 'rgba(239, 68, 68, 0.4)'}` : 'none'
                }} />
              </div>
              
              {/* Stats Labels */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                width: '100%',
                fontSize: '0.85rem', 
                marginTop: '8px', 
                color: '#94a3b8',
                fontFamily: 'monospace'
              }}>
                <span>HP: {hp}</span>
                <span>ACC: {acc}%</span>
              </div>
            </div>
          );
        })}
      </div>

      <hr style={{ margin: '35px 0', border: '0', borderTop: '1px solid #334155' }} />
      
      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
        {gameInfo.status === 'active' ? (
          <>
            <button 
              onClick={() => handleMove('attack')} 
              disabled={message.includes("Wait") || message.includes("WON") || message.includes("LOSE")}
              style={{ 
                ...btnStyle, 
                background: message.includes("Wait") ? '#334155' : 'linear-gradient(135deg, #38bdf8, #2563eb)'
              }}
            >
              ATTACK
            </button>
            <button 
              onClick={() => handleMove('rev_up')} 
              disabled={myAcc >= 0.8 || message.includes("Wait") || message.includes("WON") || message.includes("LOSE")} 
              style={{ 
                ...btnStyle, 
                background: (myAcc >= 0.8 || message.includes("Wait")) ? '#334155' : 'linear-gradient(135deg, #818cf8, #4f46e5)' 
              }}
            >
              REV UP (+10%)
            </button>
          </>
        ) : (
          <button 
            onClick={onBack} 
            style={{ 
              ...btnStyle, 
              background: 'linear-gradient(135deg, #10b981, #059669)', 
              minWidth: '200px' 
            }}
          >
            RETURN TO MENU
          </button>
        )}
      </div>
    </div>
  );
};

const btnStyle = { 
  padding: '14px 28px', 
  cursor: 'pointer', 
  fontWeight: 'bold' as const, 
  border: 'none', 
  borderRadius: '12px', 
  color: 'white', 
  fontSize: '1rem',
  textTransform: 'uppercase' as const,
  transition: 'all 0.2s ease',
  boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
  letterSpacing: '1px'
};

export default Arena;