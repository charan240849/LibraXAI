import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { searchAgent } from '../services/agents/search.agent';

const router = Router();

// POST /search/semantic - Semantic-like search
router.post('/semantic', authenticateToken, (req: Request, res: Response) => {
  try {
    const { query, limit } = req.body;

    if (!query || typeof query !== 'string') {
      res.status(400).json({ error: 'Query string is required' });
      return;
    }

    const results = searchAgent.search(query, limit || 10);
    res.json({ results });
  } catch (error) {
    console.error('Error in semantic search:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /search/suggest - Auto-suggest titles
router.get('/suggest', authenticateToken, (req: Request, res: Response) => {
  try {
    const { prefix } = req.query;

    if (!prefix || typeof prefix !== 'string') {
      res.status(400).json({ error: 'Prefix query parameter is required' });
      return;
    }

    const suggestions = searchAgent.suggest(prefix, 5);
    res.json({ suggestions });
  } catch (error) {
    console.error('Error in suggest:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
