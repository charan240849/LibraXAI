import { Book } from '../types';
import './BookCard.css';

interface BookCardProps {
  book: Book;
  onIssue?: (bookId: number) => void;
  onReserve?: (bookId: number) => void;
  showActions?: boolean;
}

export function BookCard({ book, onIssue, onReserve, showActions = true }: BookCardProps) {
  const isAvailable = book.available_copies > 0;

  return (
    <div className="book-card">
      <div className="book-cover">
        <span className="book-icon">📖</span>
      </div>
      <div className="book-info">
        <h3 className="book-title">{book.title}</h3>
        <p className="book-author">by {book.author}</p>
        {book.categories && (
          <div className="book-categories">
            {book.categories.split(',').map((cat, i) => (
              <span key={i} className="category-tag">{cat.trim()}</span>
            ))}
          </div>
        )}
        {book.description && (
          <p className="book-description">{book.description}</p>
        )}
        <div className="book-availability">
          <span className={`availability-badge ${isAvailable ? 'available' : 'unavailable'}`}>
            {book.available_copies} / {book.total_copies} available
          </span>
        </div>
        {showActions && (
          <div className="book-actions">
            {isAvailable && onIssue && (
              <button onClick={() => onIssue(book.id)} className="btn btn-primary">
                Issue
              </button>
            )}
            {!isAvailable && onReserve && (
              <button onClick={() => onReserve(book.id)} className="btn btn-secondary">
                Reserve
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
