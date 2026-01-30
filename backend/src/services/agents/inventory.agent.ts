import db from '../../db';

interface Book {
  id: number;
  isbn: string;
  title: string;
  author: string;
  total_copies: number;
  available_copies: number;
}

interface LowStockBook extends Book {
  active_loans: number;
  active_reservations: number;
}

class InventoryAgent {
  /**
   * Get books with available_copies <= threshold
   */
  getLowStock(threshold: number = 2): LowStockBook[] {
    const books = db.prepare(`
      SELECT 
        b.*,
        (SELECT COUNT(*) FROM loans l WHERE l.book_id = b.id AND l.status = 'ISSUED') as active_loans,
        (SELECT COUNT(*) FROM reservations r WHERE r.book_id = b.id AND r.status = 'ACTIVE') as active_reservations
      FROM books b
      WHERE b.available_copies <= ?
      ORDER BY b.available_copies ASC, b.title ASC
    `).all(threshold) as LowStockBook[];

    return books;
  }

  /**
   * Get inventory summary statistics
   */
  getSummary(): {
    totalBooks: number;
    totalCopies: number;
    availableCopies: number;
    lowStockCount: number;
  } {
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as totalBooks,
        SUM(total_copies) as totalCopies,
        SUM(available_copies) as availableCopies,
        SUM(CASE WHEN available_copies <= 2 THEN 1 ELSE 0 END) as lowStockCount
      FROM books
    `).get() as {
      totalBooks: number;
      totalCopies: number;
      availableCopies: number;
      lowStockCount: number;
    };

    return stats;
  }
}

export const inventoryAgent = new InventoryAgent();
