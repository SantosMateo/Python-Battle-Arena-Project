import { Request, Response } from 'express';
import pool from '../database/db.js';

// --- 1. POBIERANIE RANKINGU ---
export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT username, elo FROM users ORDER BY elo DESC LIMIT 30"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Błąd podczas pobierania rankingu" });
  }
};

// --- 2. DOŁĄCZANIE LUB TWORZENIE GRY ---
export const joinOrCreateGame = async (req: Request, res: Response) => {
  const { userId } = req.body;
  try {
    const activeGame = await pool.query(
      "SELECT id FROM games WHERE (player1_id = $1 OR player2_id = $1) AND status != 'finished'",
      [userId]
    );

    if (activeGame.rows.length > 0) {
      return res.status(200).json({ message: "Powrót do aktywnej gry", gameId: activeGame.rows[0].id });
    }

    const waitingGame = await pool.query(
      "SELECT id FROM games WHERE status = 'waiting' AND player1_id != $1 LIMIT 1",
      [userId]
    );

    if (waitingGame.rows.length > 0) {
      const gameId = waitingGame.rows[0].id;
      await pool.query("UPDATE games SET player2_id = $1, status = 'active' WHERE id = $2", [userId, gameId]);
      await pool.query(
        "INSERT INTO game_state (game_id, player1_hp, player2_hp, player1_accuracy, player2_accuracy) VALUES ($1, 100, 100, 0.20, 0.20)",
        [gameId]
      );
      return res.status(200).json({ message: "Przeciwnik znaleziony!", gameId });
    } else {
      const newGame = await pool.query("INSERT INTO games (player1_id, status) VALUES ($1, 'waiting') RETURNING id", [userId]);
      return res.status(201).json({ message: "Oczekiwanie na gracza...", gameId: newGame.rows[0].id });
    }
  } catch (err) {
    res.status(500).json({ error: "Błąd serwera przy dołączaniu" });
  }
};

// --- 3. POBIERANIE STANU MECZU ---
export const getGameStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const gameResult = await pool.query(`
      SELECT g.*, u1.username as p1_name, u2.username as p2_name 
      FROM games g
      LEFT JOIN users u1 ON g.player1_id = u1.id
      LEFT JOIN users u2 ON g.player2_id = u2.id
      WHERE g.id = $1`, [id]);
    
    const stateResult = await pool.query("SELECT * FROM game_state WHERE game_id = $1", [id]);
    
    res.json({ game: gameResult.rows[0], state: stateResult.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Błąd pobierania stanu gry" });
  }
};

// --- 4. WYKONYWANIE RUCHU ---
export const submitAction = async (req: Request, res: Response) => {
  const { gameId, userId, action } = req.body;
  try {
    const game = await pool.query("SELECT * FROM games WHERE id = $1", [gameId]);
    const state = await pool.query("SELECT * FROM game_state WHERE game_id = $1", [gameId]);
    
    if (state.rows.length === 0) return res.status(404).json({ error: "Gra nie istnieje" });

    const s = state.rows[0];
    const isP1 = game.rows[0].player1_id === userId;
    const actionColumn = isP1 ? 'player1_action' : 'player2_action';
    
    if (s[actionColumn]) return res.status(400).json({ error: "Czekaj na drugiego gracza" });

    await pool.query(`UPDATE game_state SET ${actionColumn} = $1 WHERE game_id = $2`, [action, gameId]);

    const updatedState = await pool.query("SELECT * FROM game_state WHERE game_id = $1", [gameId]);
    const us = updatedState.rows[0];

    if (us.player1_action && us.player2_action) {
      return resolveTurn(gameId, us, game.rows[0], res);
    }
    
    res.json({ message: "Ruch zapisany" });
  } catch (err) {
    res.status(500).json({ error: "Błąd bazy danych" });
  }
};

// --- 5. LOGIKA ROZSTRZYGANIA TURY ---
async function resolveTurn(gameId: number, s: any, gameInfo: any, res: Response) {
  let p1_hp = s.player1_hp;
  let p2_hp = s.player2_hp;
  let p1_acc = parseFloat(s.player1_accuracy);
  let p2_acc = parseFloat(s.player2_accuracy);

  // Funkcja zadająca obrażenia zgodnie z nowymi wytycznymi
  const calculateDmg = (acc: number) => {
    if (Math.random() > acc) return 0;
    // Celność <= 40% (0.4) -> dmg 15-35 | Celność > 40% -> dmg 10-25
    return acc <= 0.40 
      ? Math.floor(Math.random() * (35 - 15 + 1)) + 15 
      : Math.floor(Math.random() * (25 - 10 + 1)) + 10;
  };

  // Akcja P1 (Rev up teraz daje +10%)
  if (s.player1_action === 'rev_up') p1_acc = Math.min(0.80, p1_acc + 0.10);
  else p2_hp -= calculateDmg(p1_acc);

  // Akcja P2
  if (s.player2_action === 'rev_up') p2_acc = Math.min(0.80, p2_acc + 0.10);
  else p1_hp -= calculateDmg(p2_acc);

  const finalP1 = Math.max(0, p1_hp);
  const finalP2 = Math.max(0, p2_hp);

  // Sprawdzenie końca rundy / meczu
  if (finalP1 === 0 || finalP2 === 0) {
    if (finalP1 === 0 && finalP2 === 0) {
      await pool.query("UPDATE game_state SET player1_hp=100, player2_hp=100, player1_accuracy=0.2, player2_accuracy=0.2, player1_action=NULL, player2_action=NULL WHERE game_id=$1", [gameId]);
      return res.json({ message: "REMIS", p1_hp: 0, p2_hp: 0 });
    }

    const p1Won = finalP1 > 0;
    const scoreCol = p1Won ? 'player1_score' : 'player2_score';
    const updatedGame = await pool.query(`UPDATE games SET ${scoreCol} = ${scoreCol} + 1 WHERE id = $1 RETURNING *`, [gameId]);
    const g = updatedGame.rows[0];

    if (g.player1_score >= 2 || g.player2_score >= 2) {
      // MECZ ZAKOŃCZONY - Obliczamy ELO
      const winnerId = g.player1_score >= 2 ? g.player1_id : g.player2_id;
      const loserId = g.player1_score >= 2 ? g.player2_id : g.player1_id;

      const p1Res = await pool.query("SELECT elo FROM users WHERE id = $1", [g.player1_id]);
      const p2Res = await pool.query("SELECT elo FROM users WHERE id = $1", [g.player2_id]);
      const diff = p1Won ? (p2Res.rows[0].elo - p1Res.rows[0].elo) : (p1Res.rows[0].elo - p2Res.rows[0].elo);
      let change = Math.max(10, Math.min(100, Math.round(25 + (diff * 0.1))));

      await pool.query("UPDATE users SET elo = GREATEST(100, LEAST(4000, elo + $1)) WHERE id = $2", [change, winnerId]);
      await pool.query("UPDATE users SET elo = GREATEST(100, LEAST(4000, elo - $1)) WHERE id = $2", [change, loserId]);
      await pool.query("UPDATE games SET status = 'finished', winner_id = $1 WHERE id = $2", [winnerId, gameId]);
      await pool.query("UPDATE game_state SET player1_hp = $1, player2_hp = $2 WHERE game_id = $3", [finalP1, finalP2, gameId]);
      
      return res.json({ message: "MECZ ZAKOŃCZONY!", winnerId, p1_hp: finalP1, p2_hp: finalP2 });
    } else {
      // Tylko runda się skończyła - reset HP do 100
      await pool.query("UPDATE game_state SET player1_hp=100, player2_hp=100, player1_accuracy=0.2, player2_accuracy=0.2, player1_action=NULL, player2_action=NULL WHERE game_id=$1", [gameId]);
      return res.json({ message: "Koniec rundy!", p1_hp: finalP1, p2_hp: finalP2 });
    }
  }

  // Zwykła tura - zapisujemy stan
  await pool.query(
    "UPDATE game_state SET player1_hp=$1, player2_hp=$2, player1_accuracy=$3, player2_accuracy=$4, player1_action=NULL, player2_action=NULL WHERE game_id=$5",
    [finalP1, finalP2, p1_acc, p2_acc, gameId]
  );
  res.json({ message: "Tura zakończona", p1_hp: finalP1, p2_hp: finalP2 });
}