import random
import math
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from .database import db

router = APIRouter(prefix="/api/game", tags=["game"])

class ActionRequest(BaseModel):
    gameId: int
    userId: int
    action: str

@router.get("/leaderboard")
async def get_leaderboard():
    rows = await db.fetch("SELECT username, elo FROM users ORDER BY elo DESC LIMIT 50")
    return [dict(r) for r in rows]

@router.post("/join")
async def join_game(payload: dict):
    user_id = payload.get("userId")
    active = await db.fetchrow("SELECT id FROM games WHERE (player1_id = $1 OR player2_id = $1) AND status != 'finished'", user_id)
    if active: return {"message": "Powrót do aktywnej gry", "gameId": active['id']}
    waiting = await db.fetchrow("SELECT id FROM games WHERE status = 'waiting' AND player1_id != $1 LIMIT 1", user_id)
    
    if waiting:
        game_id = waiting['id']
        await db.execute("UPDATE games SET player2_id = $1, status = 'active' WHERE id = $2", user_id, game_id)
        await db.execute("INSERT INTO game_state (game_id) VALUES ($1)", game_id)
        return {"message": "Przeciwnik znaleziony!", "gameId": game_id}
    else:
        new_game = await db.fetchrow("INSERT INTO games (player1_id, status) VALUES ($1, 'waiting') RETURNING id", user_id)
        return {"message": "Oczekiwanie...", "gameId": new_game['id']}

@router.get("/status/{game_id}")
async def get_status(game_id: int):
    game = await db.fetchrow("""
        SELECT g.*, u1.username as p1_name, u2.username as p2_name 
        FROM games g
        LEFT JOIN users u1 ON g.player1_id = u1.id
        LEFT JOIN users u2 ON g.player2_id = u2.id
        WHERE g.id = $1""", game_id)
    state = await db.fetchrow("SELECT * FROM game_state WHERE game_id = $1", game_id)
    return {"game": dict(game) if game else None, "state": dict(state) if state else None}

@router.post("/action")
async def submit_action(data: ActionRequest):
    game = await db.fetchrow("SELECT * FROM games WHERE id = $1", data.gameId)
    state = await db.fetchrow("SELECT * FROM game_state WHERE game_id = $1", data.gameId)
    
    if not state: raise HTTPException(status_code=404, detail="Gra nie istnieje")
    
    is_p1 = game['player1_id'] == data.userId
    col = 'player1_action' if is_p1 else 'player2_action'
    
    if state[col]: raise HTTPException(status_code=400, detail="Czekaj na drugiego gracza")
    
    await db.execute(f"UPDATE game_state SET {col} = $1 WHERE game_id = $2", data.action, data.gameId)
    s = await db.fetchrow("SELECT * FROM game_state WHERE game_id = $1", data.gameId)
    if s['player1_action'] and s['player2_action']:
        return await resolve_turn(data.gameId, s, game)
    
    return {"message": "Ruch zapisany"}

async def resolve_turn(game_id, s, g):
    p1_hp, p2_hp = s['player1_hp'], s['player2_hp']
    p1_acc, p2_acc = float(s['player1_accuracy']), float(s['player2_accuracy'])

    def calc_dmg(acc):
        if random.random() > acc: return 0
        return random.randint(15, 35) if acc <= 0.40 else random.randint(10, 25)

    if s['player1_action'] == 'rev_up': p1_acc = min(0.80, p1_acc + 0.10)
    else: p2_hp -= calc_dmg(p1_acc)

    if s['player2_action'] == 'rev_up': p2_acc = min(0.80, p2_acc + 0.10)
    else: p1_hp -= calc_dmg(p2_acc)

    f1, f2 = max(0, p1_hp), max(0, p2_hp)

    if f1 == 0 or f2 == 0:
        if f1 == 0 and f2 == 0:
            await reset_round(game_id)
            return {"message": "REMIS W RUNDZIE", "p1_hp": 0, "p2_hp": 0}

        p1_won_round = f1 > 0
        score_col = "player1_score" if p1_won_round else "player2_score"
        
        updated_game = await db.fetchrow(f"UPDATE games SET {score_col} = {score_col} + 1 WHERE id = $1 RETURNING *", game_id)
        
        if updated_game['player1_score'] >= 2 or updated_game['player2_score'] >= 2:
            return await finalize_match(game_id, updated_game, f1, f2)
        else:
            await reset_round(game_id)
            return {"message": "Koniec rundy!", "p1_hp": f1, "p2_hp": f2}

    await db.execute("""
        UPDATE game_state SET player1_hp=$1, player2_hp=$2, player1_accuracy=$3, player2_accuracy=$4, 
        player1_action=NULL, player2_action=NULL WHERE game_id=$5""", f1, f2, p1_acc, p2_acc, game_id)
    return {"message": "Tura zakończona", "p1_hp": f1, "p2_hp": f2}

async def reset_round(game_id):
    await db.execute("""
        UPDATE game_state SET player1_hp=100, player2_hp=100, player1_accuracy=0.2, player2_accuracy=0.2, 
        player1_action=NULL, player2_action=NULL WHERE game_id=$1""", game_id)

async def finalize_match(game_id, g, f1, f2):
    p1_won = g['player1_score'] >= 2
    winner_id = g['player1_id'] if p1_won else g['player2_id']
    loser_id = g['player2_id'] if p1_won else g['player1_id']

    p1_data = await db.fetchrow("SELECT elo FROM users WHERE id = $1", g['player1_id'])
    p2_data = await db.fetchrow("SELECT elo FROM users WHERE id = $1", g['player2_id'])
    
    diff = p2_data['elo'] - p1_data['elo'] if p1_won else p1_data['elo'] - p2_data['elo']
    change = max(10, min(100, round(25 + (diff * 0.1))))

    await db.execute("UPDATE users SET elo = GREATEST(100, LEAST(4000, elo + $1)) WHERE id = $2", change, winner_id)
    await db.execute("UPDATE users SET elo = GREATEST(100, LEAST(4000, elo - $1)) WHERE id = $2", change, loser_id)
    await db.execute("UPDATE games SET status = 'finished', winner_id = $1 WHERE id = $2", winner_id, game_id)
    await db.execute("UPDATE game_state SET player1_hp=$1, player2_hp=$2 WHERE game_id=$3", f1, f2, game_id)
    
    return {"message": "MECZ ZAKOŃCZONY!", "winnerId": winner_id, "p1_hp": f1, "p2_hp": f2}