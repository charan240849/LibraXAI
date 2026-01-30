import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { recommendationAgent } from '../services/agents/recommendation.agent';

const router = Router();

// GET /recommendations/user/:userId - Get recommendations for a user
router.get('/user/:userId', authenticateToken, (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const limit = parseInt(req.query.limit as string, 10) || 5;

    if (isNaN(userId)) {
      res.status(400).json({ error: 'Invalid userId' });
      return;
    }

    const recommendations = recommendationAgent.recommendForUser(userId, limit);
    res.json({ recommendations });
  } catch (error) {
    console.error('Error getting user recommendations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /recommendations/similar/:bookId - Get similar books
router.get('/similar/:bookId', authenticateToken, (req: Request, res: Response) => {
  try {
    const bookId = parseInt(req.params.bookId, 10);
    const limit = parseInt(req.query.limit as string, 10) || 5;

    if (isNaN(bookId)) {
      res.status(400).json({ error: 'Invalid bookId' });
      return;
    }

    const similar = recommendationAgent.findSimilar(bookId, limit);
    res.json({ similar });
  } catch (error) {
    console.error('Error getting similar books:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
