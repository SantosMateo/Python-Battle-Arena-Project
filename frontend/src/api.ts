const BASE_URL = 'https://battle-arena-lue9.onrender.com/api';

export const api = {
  register: (body: object) => fetch(`${BASE_URL}/auth/register`, {
    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)
  }).then(res => res.json()),

  login: (body: object) => fetch(`${BASE_URL}/auth/login`, {
    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)
  }).then(res => res.json()),

  joinOrCreateGame: (userId: number) => fetch(`${BASE_URL}/game/join`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId })
  }).then(res => res.json()),

  sendAction: (gameId: number, userId: number, action: string) => fetch(`${BASE_URL}/game/action`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ gameId, userId, action })
  }).then(res => res.json()),

  getGameStatus: (gameId: number) => fetch(`${BASE_URL}/game/${gameId}`).then(res => res.json()),

  getLeaderboard: () => fetch(`${BASE_URL}/game/leaderboard`).then(res => res.json())
};