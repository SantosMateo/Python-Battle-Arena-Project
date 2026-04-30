⚔️ Battle Arena: Project Roadmap & Implementation Plan
This document outlines the end-to-end development phases for the Battle Arena platform. This project features a React-based combat interface powered by a high-performance Python (FastAPI) backend.

🛠️ Phase 1: Infrastructure & Environment Setup
Establish the foundation for the new repository.

[ ] Python Workspace: Initialize a virtual environment and set up FastAPI with Uvicorn for the web server.

[ ] Database Connectivity: Configure SQLAlchemy or SQLModel to interface with the PostgreSQL database hosted on Supabase.  

[ ] Infrastructure Configuration:

Prepare the Vercel deployment pipeline for the React client.  

Prepare the Render deployment pipeline for the Python server.  

[ ] Environment Variables: Define secrets for DATABASE_URL, JWT_SECRET, and CORS_ORIGINS.

🗄️ Phase 2: Data Modeling (PostgreSQL)
Define the core tables to manage the arena's ecosystem.

[ ] User Table: Implement the users model to store player profiles, hashed credentials, and global ELO rankings (starting at 1000).  

[ ] Match Metadata: Implement the games model to track "Best of 3" scoring and match statuses (waiting, active, finished).  

[ ] Combat State: Implement the game_state model to store high-frequency data, including player HP, current accuracy, and pending actions.  

🔐 Phase 3: Identity & Access Management (/api/auth)
Secure the arena with robust authentication.

[ ] Registration: Create a POST /register endpoint to ingest usernames and store secure password_hash strings.  

[ ] Authentication: Create a POST /login endpoint that validates credentials and returns a signed JWT token.  

[ ] Authorization: Implement a dependency to protect game routes, ensuring only authenticated players can submit actions.

🧠 Phase 4: Matchmaking & Combat Engine
Build the core "brain" of the game.

[ ] Matchmaking Logic: Develop the POST /join service. It must prioritize filling waiting games before initializing new ones.  

[ ] The Combat Resolver: Implement the turn-based logic that triggers once both players have submitted actions:  

Attack: Calculate hits based on the player’s current accuracy.  

Rev Up: Skip the current turn to permanently increase accuracy for the remainder of the round.  

Turn Transition: Deduct HP, update the turn counter, and clear actions for the next round.  

[ ] Win Conditions: Implement logic to handle HP reaching 0 and updating the "Best of 3" scores in the games table.  

🌐 Phase 5: API Layer & Endpoints (/api/game)
Expose the game engine to the frontend.

[ ] Leaderboard: Create GET /leaderboard to fetch the top 50 players sorted by ELO.  

[ ] Status Polling: Create GET /status/:gameId to provide the React frontend with real-time updates from the game_state table.  

[ ] Action Submission: Create POST /action for players to commit to an attack or rev_up.  

🎨 Phase 6: React Frontend Implementation
Build the user interface using React.js and TypeScript.

[ ] API Communication: Configure Axios to communicate with the Python backend.  

[ ] Matchmaking UI: Build the "Find Match" interface and waiting room.

[ ] Combat Arena: Develop the visual representation of HP bars, accuracy stats, and action buttons.

[ ] Global Leaderboard: Build a high-score table component to display top-ranked users.

🚀 Phase 7: Final Deployment & Testing
[ ] Cross-Origin Resource Sharing (CORS): Ensure the Python server allows requests from the React frontend.

[ ] Integration Testing: Verify the complete game loop from login to match conclusion and ELO adjustment.

[ ] Production Launch: Deploy the backend to Render and the frontend to Vercel.