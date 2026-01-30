import { Router, Response } from 'express';
import db from '../db';
import { AuthRequest, authenticateToken } from '../middleware/auth';

const router = Router();

interface Reservation {
  id: number;
  user_id: number;
  book_id: number;
  created_at: string;
  status: 'ACTIVE' | 'FULFILLED' | 'CANCELLED';
}

// GET /reservations - List reservations
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { user_id, status } = req.query;
    
    let query = 'SELECT r.*, b.title as book_title, u.full_name as user_name FROM reservations r JOIN books b ON r.book_id = b.id JOIN users u ON r.user_id = u.id';
    const conditions: string[] = [];
    const values: unknown[] = [];

    // Non-admin users can only see their own reservations
    if (req.user?.role === 'MEMBER') {
      conditions.push('r.user_id = ?');
      values.push(req.user.userId);
    } else if (user_id) {
      conditions.push('r.user_id = ?');
      values.push(user_id);
    }

    if (status) {
      conditions.push('r.status = ?');
      values.push(status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY r.created_at DESC';

    const reservations = db.prepare(query).all(...values);
    res.json({ reservations });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /reservations - Create reservation
router.post('/', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { user_id, book_id } = req.body;

    // Allow members to only create reservations for themselves
    const targetUserId = req.user?.role === 'MEMBER' ? req.user.userId : user_id;

    if (!targetUserId || !book_id) {
      res.status(400).json({ error: 'user_id and book_id are required' });
      return;
    }

    // Check if book exists
    const book = db.prepare('SELECT id FROM books WHERE id = ?').get(book_id);
    if (!book) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }

    // Check if user already has active reservation for this book
    const existingReservation = db.prepare(`
      SELECT id FROM reservations WHERE user_id = ? AND book_id = ? AND status = 'ACTIVE'
    `).get(targetUserId, book_id);

    if (existingReservation) {
      res.status(400).json({ error: 'User already has an active reservation for this book' });
      return;
    }

    // Check if user already has this book issued
    const existingLoan = db.prepare(`
      SELECT id FROM loans WHERE user_id = ? AND book_id = ? AND status = 'ISSUED'
    `).get(targetUserId, book_id);

    if (existingLoan) {
      res.status(400).json({ error: 'User already has this book issued' });
      return;
    }

    const result = db.prepare(`
      INSERT INTO reservations (user_id, book_id, status)
      VALUES (?, ?, 'ACTIVE')
    `).run(targetUserId, book_id);

    const reservation = db.prepare('SELECT * FROM reservations WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      message: 'Reservation created successfully',
      reservation,
    });
  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /reservations/:id/cancel - Cancel reservation
router.post('/:id/cancel', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const reservation = db.prepare('SELECT * FROM reservations WHERE id = ?').get(id) as Reservation | undefined;
    if (!reservation) {
      res.status(404).json({ error: 'Reservation not found' });
      return;
    }

    // Members can only cancel their own reservations
    if (req.user?.role === 'MEMBER' && reservation.user_id !== req.user.userId) {
      res.status(403).json({ error: 'Cannot cancel another user\'s reservation' });
      return;
    }

    if (reservation.status !== 'ACTIVE') {
      res.status(400).json({ error: 'Can only cancel active reservations' });
      return;
    }

    db.prepare(`
      UPDATE reservations SET status = 'CANCELLED' WHERE id = ?
    `).run(id);

    res.json({ message: 'Reservation cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
