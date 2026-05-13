# ⚔️ Battle Arena

[![Reflex](https://img.shields.io/badge/Frontend-Reflex-blueviolet?style=for-the-badge&logo=python)](https://reflex.dev/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-05998b?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776ab?style=for-the-badge&logo=python)](https://www.python.org/)

A high-performance, real-time competitive combat platform. This project features a unified Python-based stack, utilizing a reactive UI and a dedicated game logic engine designed for low-latency turn-based combat.

---

## 📡 Network Architecture

To resolve communication overhead and avoid "Websocket Errors," the environment is partitioned into two distinct services. This prevents conflict between the Reflex event loop and the custom Game API.

| Service | Port | Protocol | Responsibility |
| :--- | :--- | :--- | :--- |
| **Reflex Event Server** | `8000` | WS / HTTP | UI State Sync & Event Handling |
| **Game API Backend** | `8080` | JSON / HTTP | Core Logic, Combat Resolution & DB Orchestration |

---

## 🗺️ Project Roadmap

### 🏗️ Phase 1: Infrastructure & Setup
- [x] **Python Workspace:** Initialized venv with FastAPI, Uvicorn, and Reflex.
- [x] **Port Separation:** Moved custom API to `8080` to prevent socket collisions on `8000`.
- [x] **Environment:** Configured `$env:PYTHONPATH` for global module discovery.
- [ ] **Database:** Setup `SQLModel` with Supabase PostgreSQL.

### 🔐 Phase 2: Identity & Matchmaking
- [x] **Auth System:** `POST /api/auth/register` and JWT-based login logic.
- [x] **LocalStorage:** Persistent user tokens and `userId` via `rx.LocalStorage`.
- [x] **Matchmaking:** `POST /api/game/join` handles queueing and game initialization.
- [x] **State Security:** Fixed `RecursionError` by isolating internal Reflex name getters from custom user variables.

### 🧠 Phase 3: Combat Engine & State
- [ ] **Combat Resolver:** Turn-based logic for Attacks and "Rev Up" buffs.
- [x] **State Normalization:** Backend-side calculation of accuracy and HP to prevent frontend `TypeError` (ObjectItemOperation).
- [x] **Polling Loop:** Integrated `async` polling to refresh the Arena state every second without blocking the UI.

### 🎨 Phase 4: UI/UX Implementation
- [x] **Reactive Components:** Custom `stat_box` with dynamic HP progress bars.
- [x] **Conditional Rendering:** `rx.cond` logic for turn-based button visibility and "Waiting for opponent" states.
- [x] **Dashboard:** High-score leaderboard fetched via `fetch_leaderboard`.

---

## 🛠️ Installation & Usage

### 1. Clone the repository
```bash
git clone [https://github.com/youruser/battle-arena.git](https://github.com/youruser/battle-arena.git)
cd battle-arena
