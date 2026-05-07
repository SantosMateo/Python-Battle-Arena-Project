import { Router } from 'express';
import { 
  joinOrCreateGame, 
  submitAction, 
  getGameStatus, 
  getLeaderboard 
} from '../controllers/gameController.js';

const router = Router();

// KLUCZOWE: Ranking musi być przed /:id
router.get('/leaderboard', getLeaderboard);
router.post('/join', joinOrCreateGame);
router.post('/action', submitAction);
router.get('/:id', getGameStatus);

export default router;