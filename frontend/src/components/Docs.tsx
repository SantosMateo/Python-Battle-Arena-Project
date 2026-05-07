import React from 'react';

const Docs: React.FC = () => {
  const codeBlockStyle = {
    backgroundColor: '#1e1e1e',
    color: '#d4d4d4',
    padding: '15px',
    borderRadius: '8px',
    display: 'block',
    whiteSpace: 'pre-wrap' as const,
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: '0.85rem',
    margin: '10px 0',
    overflowX: 'auto' as const
  };

  const sectionStyle = {
    marginBottom: '30px',
    borderBottom: '1px solid #eee',
    paddingBottom: '20px'
  };

  return (
    <div style={{ textAlign: 'left', maxWidth: '900px', margin: '0 auto', padding: '40px', lineHeight: '1.7', color: '#2c3e50', backgroundColor: '#fff' }}>
      <h1 style={{ textAlign: 'center', color: '#2c3e50', fontSize: '2.5rem', marginBottom: '10px' }}>
        Battle Arena Documentation
      </h1>
      <p style={{ textAlign: 'center', color: '#7f8c8d', marginBottom: '40px' }}>Technical Specification & API Reference</p>

      <div style={sectionStyle}>
        <h2>1. Technology Stack</h2>
        <ul>
          <li><strong>Frontend:</strong> React.js with TypeScript, Axios for API communication.</li>
          <li><strong>Backend:</strong> Node.js, Express.js, TypeScript.</li>
          <li><strong>Database:</strong> PostgreSQL (hosted via Supabase).</li>
          <li><strong>Infrastructure:</strong> Vercel (Client hosting), Render (Server hosting).</li>
        </ul>
      </div>

      <div style={sectionStyle}>
        <h2>2. Database Schema (UML Architecture)</h2>
        <p>The system uses three primary tables to manage users, match history, and real-time combat states.</p>
        
        

        <h3>2.1 Table: <code>users</code></h3>
        <p>Stores player profiles, credentials, and global ranking (ELO).</p>
        <pre style={codeBlockStyle}>{`CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    elo INT DEFAULT 1000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`}</pre>

        <h3>2.2 Table: <code>games</code></h3>
        <p>Tracks overall match metadata and "Best of 3" scoring.</p>
        <pre style={codeBlockStyle}>{`CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    player1_id INT REFERENCES users(id),
    player2_id INT REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'waiting', -- 'waiting', 'active', 'finished'
    player1_score INT DEFAULT 0,
    player2_score INT DEFAULT 0,
    winner_id INT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`}</pre>

        <h3>2.3 Table: <code>game_state</code></h3>
        <p>Manages the high-frequency data for ongoing combat rounds.</p>
        <pre style={codeBlockStyle}>{`CREATE TABLE game_state (
    id SERIAL PRIMARY KEY,
    game_id INT REFERENCES games(id) ON DELETE CASCADE,
    player1_hp INT DEFAULT 100,
    player2_hp INT DEFAULT 100,
    player1_accuracy DECIMAL DEFAULT 0.20,
    player2_accuracy DECIMAL DEFAULT 0.20,
    player1_action VARCHAR(20), -- 'attack', 'rev_up' or NULL
    player2_action VARCHAR(20), -- 'attack', 'rev_up' or NULL
    current_turn INT DEFAULT 1,
    last_update TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`}</pre>
      </div>

      <div style={sectionStyle}>
        <h2>3. Game Mechanics</h2>
        <h3>Matchmaking</h3>
        <p>When a player searches for a game, the system looks for an entry in <code>games</code> with a <code>waiting</code> status. If found, the player joins as <code>player2</code> and the status changes to <code>active</code>. Otherwise, a new game is initialized.</p>
        
        <h3>Combat Logic</h3>
        <ul>
          <li><strong>Health Points (HP):</strong> Both players start with 100 HP. If HP reaches 0, the round ends.</li>
          <li><strong>Attack Action:</strong> A player attempts to hit the opponent. Success depends on the current <code>accuracy</code> value.</li>
          <li><strong>Rev Up Action:</strong> A strategic move that skips an attack in the current turn to permanently increase the player's <code>accuracy</code> for future turns.</li>
          <li><strong>Turn Resolution:</strong> The engine waits for both <code>player1_action</code> and <code>player2_action</code> to be non-null before calculating damage and updating the state.</li>
        </ul>
      </div>

      <div style={sectionStyle}>
        <h2>4. API Endpoints</h2>
        
        <h3>Auth API (<code>/api/auth</code>)</h3>
        <ul>
          <li><code>POST /register</code> - Creates a new user. Expects <code>username</code>, <code>password</code>.</li>
          <li><code>POST /login</code> - Authenticates user. Returns <code>token</code> and <code>userId</code>.</li>
        </ul>

        <h3>Game API (<code>/api/game</code>)</h3>
        <ul>
          <li><code>GET /leaderboard</code> - Fetches top 50 players sorted by ELO.</li>
          <li><code>POST /join</code> - Enters matchmaking queue.</li>
          <li><code>GET /status/:gameId</code> - Returns the current record from <code>game_state</code>.</li>
          <li><code>POST /action</code> - Submits a move (<code>attack</code> or <code>rev_up</code>).</li>
        </ul>
      </div>

      <div style={{ marginTop: '50px', borderTop: '1px solid #eee', paddingTop: '20px', textAlign: 'center', color: '#bdc3c7' }}>
        <p>Battle Arena Project Documentation &copy; 2026</p>
      </div>
    </div>
  );
};

export default Docs;