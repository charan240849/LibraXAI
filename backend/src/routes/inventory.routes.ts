import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { staffOnly } from '../middleware/rbac';
import { inventoryAgent } from '../services/agents/inventory.agent';

const router = Router();

// GET /inventory/low-stock - Get books with low stock
router.get('/low-stock', authenticateToken, staffOnly, (req: Request, res: Response) => {
  try {
    const threshold = parseInt(req.query.threshold as string, 10) || 2;

    const lowStockBooks = inventoryAgent.getLowStock(threshold);
    res.json({ 
      threshold,
      count: lowStockBooks.length,
      books: lowStockBooks 
    });
  } catch (error) {
    console.error('Error getting low stock:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
