import db from '../../db';

interface Book {
  id: number;
  isbn: string;
  title: string;
  author: string;
  description: string;
  categories: string;
  total_copies: number;
  available_copies: number;
}

interface SearchResult extends Book {
  score: number;
}

class SearchAgent {
  /**
   * Search books by query (simple LIKE search over title/author/description)
   * Returns results with naive relevance score
   */
  search(query: string, limit: number = 10): SearchResult[] {
    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 0);
    
    if (terms.length === 0) {
      return [];
    }

    // Get all books and score them
    const books = db.prepare('SELECT * FROM books').all() as Book[];
    
    const scored: SearchResult[] = books.map(book => {
      let score = 0;
      const titleLower = book.title.toLowerCase();
      const authorLower = book.author.toLowerCase();
      const descLower = (book.description || '').toLowerCase();
      const categoriesLower = (book.categories || '').toLowerCase();

      for (const term of terms) {
        // Title matches are weighted highest
        if (titleLower.includes(term)) {
          score += 10;
          // Exact word match bonus
          if (titleLower.split(/\s+/).includes(term)) {
            score += 5;
          }
        }
        // Author matches
        if (authorLower.includes(term)) {
          score += 7;
        }
        // Category matches
        if (categoriesLower.includes(term)) {
          score += 5;
        }
        // Description matches
        if (descLower.includes(term)) {
          score += 2;
        }
      }

      return { ...book, score };
    });

    // Filter non-zero scores, sort by score descending, limit results
    return scored
      .filter(b => b.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Auto-suggest book titles based on prefix
   */
  suggest(prefix: string, limit: number = 5): string[] {
    const prefixLower = prefix.toLowerCase();
    
    const books = db.prepare(`
      SELECT DISTINCT title FROM books 
      WHERE LOWER(title) LIKE ?
      ORDER BY title
      LIMIT ?
    `).all(`${prefixLower}%`, limit) as { title: string }[];

    return books.map(b => b.title);
  }
}

export const searchAgent = new SearchAgent();
