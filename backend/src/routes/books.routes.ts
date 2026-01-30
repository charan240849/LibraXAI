import { Router, Response } from 'express';
import db from '../db';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { staffOnly } from '../middleware/rbac';

const router = Router();

interface Book {
  id: number;
  isbn: string;
  title: string;
  author: string;
  description: string;
  categories: string;
  total_copies: number;
  available_copies: number;
  created_at: string;
  updated_at: string;
}

// GET /books - List all books (with optional search)
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { q } = req.query;
    
    let books: Book[];
    if (q && typeof q === 'string') {
      const searchTerm = `%${q}%`;
      books = db.prepare(`
        SELECT * FROM books 
        WHERE title LIKE ? OR author LIKE ? OR description LIKE ?
        ORDER BY title
      `).all(searchTerm, searchTerm, searchTerm) as Book[];
    } else {
      books = db.prepare('SELECT * FROM books ORDER BY title').all() as Book[];
    }

    res.json({ books });
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /books/:id - Get single book
router.get('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(id) as Book | undefined;

    if (!book) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }

    res.json({ book });
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /books - Create new book (ADMIN, LIBRARIAN)
router.post('/', authenticateToken, staffOnly, (req: AuthRequest, res: Response) => {
  try {
    const { isbn, title, author, description, categories, total_copies } = req.body;

    if (!title || !author) {
      res.status(400).json({ error: 'Title and author are required' });
      return;
    }

    const copies = total_copies || 1;
    const result = db.prepare(`
      INSERT INTO books (isbn, title, author, description, categories, total_copies, available_copies)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(isbn || null, title, author, description || null, categories || null, copies, copies);

    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(result.lastInsertRowid) as Book;

    res.status(201).json({ 
      message: 'Book created successfully',
      book 
    });
  } catch (error) {
    console.error('Error creating book:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /books/:id - Update book (ADMIN, LIBRARIAN)
router.patch('/:id', authenticateToken, staffOnly, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isbn, title, author, description, categories, total_copies } = req.body;

    // Check if book exists
    const existing = db.prepare('SELECT * FROM books WHERE id = ?').get(id) as Book | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: unknown[] = [];

    if (isbn !== undefined) { updates.push('isbn = ?'); values.push(isbn); }
    if (title !== undefined) { updates.push('title = ?'); values.push(title); }
    if (author !== undefined) { updates.push('author = ?'); values.push(author); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (categories !== undefined) { updates.push('categories = ?'); values.push(categories); }
    if (total_copies !== undefined) {
      // Adjust available copies based on total copies change
      const diff = total_copies - existing.total_copies;
      updates.push('total_copies = ?');
      updates.push('available_copies = available_copies + ?');
      values.push(total_copies, diff);
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    db.prepare(`UPDATE books SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(id) as Book;
    res.json({ 
      message: 'Book updated successfully',
      book 
    });
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /books/:id - Delete book (ADMIN, LIBRARIAN)
router.delete('/:id', authenticateToken, staffOnly, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = db.prepare('SELECT id FROM books WHERE id = ?').get(id);
    if (!existing) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }

    // Check for active loans
    const activeLoans = db.prepare(`
      SELECT COUNT(*) as count FROM loans WHERE book_id = ? AND status = 'ISSUED'
    `).get(id) as { count: number };

    if (activeLoans.count > 0) {
      res.status(400).json({ error: 'Cannot delete book with active loans' });
      return;
    }

    db.prepare('DELETE FROM books WHERE id = ?').run(id);

    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
