import { Router, Response } from 'express';
import db from '../db';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { config } from '../config';

const router = Router();

interface Loan {
  id: number;
  user_id: number;
  book_id: number;
  issued_at: string;
  due_at: string;
  returned_at: string | null;
  status: 'ISSUED' | 'RETURNED' | 'OVERDUE';
  renew_count: number;
}

interface Book {
  id: number;
  title: string;
  available_copies: number;
}

// GET /loans - List loans (optionally filter by user_id, status)
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { user_id, status } = req.query;
    
    let query = 'SELECT l.*, b.title as book_title, u.full_name as user_name FROM loans l JOIN books b ON l.book_id = b.id JOIN users u ON l.user_id = u.id';
    const conditions: string[] = [];
    const values: unknown[] = [];

    // Non-admin users can only see their own loans
    if (req.user?.role === 'MEMBER') {
      conditions.push('l.user_id = ?');
      values.push(req.user.userId);
    } else if (user_id) {
      conditions.push('l.user_id = ?');
      values.push(user_id);
    }

    if (status) {
      conditions.push('l.status = ?');
      values.push(status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY l.issued_at DESC';

    const loans = db.prepare(query).all(...values);
    res.json({ loans });
  } catch (error) {
    console.error('Error fetching loans:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /loans/issue - Issue a book to a user
router.post('/issue', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { user_id, book_id } = req.body;

    if (!user_id || !book_id) {
      res.status(400).json({ error: 'user_id and book_id are required' });
      return;
    }

    // Check if book exists and has available copies
    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(book_id) as Book | undefined;
    if (!book) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }

    if (book.available_copies < 1) {
      res.status(400).json({ error: 'No copies available for this book' });
      return;
    }

    // Check if user already has this book issued
    const existingLoan = db.prepare(`
      SELECT id FROM loans WHERE user_id = ? AND book_id = ? AND status = 'ISSUED'
    `).get(user_id, book_id);

    if (existingLoan) {
      res.status(400).json({ error: 'User already has this book issued' });
      return;
    }

    // Calculate due date
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + config.loanDurationDays);

    // Create loan and decrement available copies (transaction)
    const transaction = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO loans (user_id, book_id, due_at, status, renew_count)
        VALUES (?, ?, ?, 'ISSUED', 0)
      `).run(user_id, book_id, dueDate.toISOString());

      db.prepare(`
        UPDATE books SET available_copies = available_copies - 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(book_id);

      return result.lastInsertRowid;
    });

    const loanId = transaction();
    const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(loanId);

    res.status(201).json({
      message: 'Book issued successfully',
      loan,
    });
  } catch (error) {
    console.error('Error issuing book:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /loans/return - Return a book
router.post('/return', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { loan_id } = req.body;

    if (!loan_id) {
      res.status(400).json({ error: 'loan_id is required' });
      return;
    }

    // Get loan
    const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(loan_id) as Loan | undefined;
    if (!loan) {
      res.status(404).json({ error: 'Loan not found' });
      return;
    }

    if (loan.status === 'RETURNED') {
      res.status(400).json({ error: 'Book already returned' });
      return;
    }

    // Return book and increment available copies (transaction)
    const transaction = db.transaction(() => {
      db.prepare(`
        UPDATE loans SET returned_at = CURRENT_TIMESTAMP, status = 'RETURNED'
        WHERE id = ?
      `).run(loan_id);

      db.prepare(`
        UPDATE books SET available_copies = available_copies + 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(loan.book_id);

      // Check for reservations and fulfill the first one
      const reservation = db.prepare(`
        SELECT * FROM reservations 
        WHERE book_id = ? AND status = 'ACTIVE'
        ORDER BY created_at ASC
        LIMIT 1
      `).get(loan.book_id) as { id: number; user_id: number } | undefined;

      if (reservation) {
        db.prepare(`
          UPDATE reservations SET status = 'FULFILLED' WHERE id = ?
        `).run(reservation.id);
        return { reservation };
      }
      return { reservation: null };
    });

    const result = transaction();

    res.json({
      message: 'Book returned successfully',
      reservation_fulfilled: result.reservation ? true : false,
    });
  } catch (error) {
    console.error('Error returning book:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /loans/renew - Renew a loan
router.post('/renew', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { loan_id } = req.body;

    if (!loan_id) {
      res.status(400).json({ error: 'loan_id is required' });
      return;
    }

    // Get loan
    const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(loan_id) as Loan | undefined;
    if (!loan) {
      res.status(404).json({ error: 'Loan not found' });
      return;
    }

    if (loan.status !== 'ISSUED') {
      res.status(400).json({ error: 'Can only renew issued loans' });
      return;
    }

    if (loan.renew_count >= config.maxRenewals) {
      res.status(400).json({ error: `Maximum renewals (${config.maxRenewals}) reached` });
      return;
    }

    // Check for active reservations
    const reservation = db.prepare(`
      SELECT id FROM reservations WHERE book_id = ? AND status = 'ACTIVE'
    `).get(loan.book_id);

    if (reservation) {
      res.status(400).json({ error: 'Cannot renew - book has active reservations' });
      return;
    }

    // Calculate new due date from current due date
    const newDueDate = new Date(loan.due_at);
    newDueDate.setDate(newDueDate.getDate() + config.loanDurationDays);

    db.prepare(`
      UPDATE loans SET due_at = ?, renew_count = renew_count + 1
      WHERE id = ?
    `).run(newDueDate.toISOString(), loan_id);

    const updatedLoan = db.prepare('SELECT * FROM loans WHERE id = ?').get(loan_id);

    res.json({
      message: 'Loan renewed successfully',
      loan: updatedLoan,
    });
  } catch (error) {
    console.error('Error renewing loan:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
