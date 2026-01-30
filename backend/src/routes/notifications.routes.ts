import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { staffOnly } from '../middleware/rbac';
import { notificationAgent } from '../services/agents/notification.agent';

const router = Router();

// POST /notifications/send-due-reminders - Trigger due/overdue notifications
router.post('/send-due-reminders', authenticateToken, staffOnly, async (req: Request, res: Response) => {
  try {
    const result = await notificationAgent.sendDueReminders();
    res.json({
      message: 'Due reminders processed',
      ...result,
    });
  } catch (error) {
    console.error('Error sending due reminders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
