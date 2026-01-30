import db from '../../db';

interface Book {
  id: number;
  title: string;
  author: string;
  categories: string;
  available_copies: number;
}

interface Loan {
  book_id: number;
  categories: string;
}

class RecommendationAgent {
  /**
   * Recommend books for a user based on their borrowing history
   * - If user has loans: recommend books sharing categories with recent loans
   * - Cold start: recommend most popular books (most loans in last 30 days)
   */
  recommendForUser(userId: number, limit: number = 5): Book[] {
    // Get user's recent loans with book categories
    const userLoans = db.prepare(`
      SELECT l.book_id, b.categories
      FROM loans l
      JOIN books b ON l.book_id = b.id
      WHERE l.user_id = ?
      ORDER BY l.issued_at DESC
      LIMIT 10
    `).all(userId) as Loan[];

    if (userLoans.length > 0) {
      // Extract categories from user's loans
      const userCategories = new Set<string>();
      const borrowedBookIds = new Set<number>();

      for (const loan of userLoans) {
        borrowedBookIds.add(loan.book_id);
        if (loan.categories) {
          loan.categories.split(',').map(c => c.trim().toLowerCase()).forEach(c => userCategories.add(c));
        }
      }

      if (userCategories.size > 0) {
        // Find books matching user's categories that they haven't borrowed
        const allBooks = db.prepare('SELECT * FROM books WHERE available_copies > 0').all() as Book[];
        
        const scored = allBooks
          .filter(book => !borrowedBookIds.has(book.id))
          .map(book => {
            let score = 0;
            const bookCategories = (book.categories || '').split(',').map(c => c.trim().toLowerCase());
            
            for (const cat of bookCategories) {
              if (userCategories.has(cat)) {
                score += 1;
              }
            }
            
            return { book, score };
          })
          .filter(item => item.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, limit)
          .map(item => item.book);

        if (scored.length > 0) {
          return scored;
        }
      }
    }

    // Cold start: return most popular books
    return this.getMostPopular(limit);
  }

  /**
   * Find books similar to a given book (same categories or author)
   */
  findSimilar(bookId: number, limit: number = 5): Book[] {
    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(bookId) as Book | undefined;
    
    if (!book) {
      return [];
    }

    const categories = (book.categories || '').split(',').map(c => c.trim().toLowerCase());
    const allBooks = db.prepare('SELECT * FROM books WHERE id != ? AND available_copies > 0').all(bookId) as Book[];

    const scored = allBooks.map(b => {
      let score = 0;
      
      // Same author
      if (b.author.toLowerCase() === book.author.toLowerCase()) {
        score += 5;
      }

      // Matching categories
      const bCategories = (b.categories || '').split(',').map(c => c.trim().toLowerCase());
      for (const cat of bCategories) {
        if (categories.includes(cat)) {
          score += 2;
        }
      }

      return { book: b, score };
    });

    return scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.book);
  }

  /**
   * Get most popular books (most loans in last 30 days)
   */
  private getMostPopular(limit: number): Book[] {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const popular = db.prepare(`
      SELECT b.*, COUNT(l.id) as loan_count
      FROM books b
      LEFT JOIN loans l ON b.id = l.book_id AND l.issued_at >= ?
      WHERE b.available_copies > 0
      GROUP BY b.id
      ORDER BY loan_count DESC, b.title ASC
      LIMIT ?
    `).all(thirtyDaysAgo.toISOString(), limit) as Book[];

    return popular;
  }
}

export const recommendationAgent = new RecommendationAgent();
