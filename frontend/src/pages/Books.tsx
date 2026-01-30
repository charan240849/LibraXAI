import { useState, useEffect } from 'react';
import { booksApi, loansApi, reservationsApi } from '../api';
import { Book } from '../types';
import { useAuth } from '../context/AuthContext';
import { BookCard } from '../components/BookCard';
import './Books.css';

export function BooksPage() {
  const { user, isStaff } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal states for staff
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBook, setNewBook] = useState({
    isbn: '',
    title: '',
    author: '',
    description: '',
    categories: '',
    total_copies: 1,
  });

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async (query?: string) => {
    try {
      setLoading(true);
      const data = await booksApi.getAll(query);
      setBooks(data.books);
    } catch (error) {
      console.error('Error loading books:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadBooks(searchQuery);
  };

  const handleIssue = async (bookId: number) => {
    if (!user) return;
    try {
      await loansApi.issue(user.id, bookId);
      setMessage({ type: 'success', text: 'Book issued successfully!' });
      loadBooks(searchQuery);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to issue book' });
    }
  };

  const handleReserve = async (bookId: number) => {
    if (!user) return;
    try {
      await reservationsApi.create(user.id, bookId);
      setMessage({ type: 'success', text: 'Reservation created successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create reservation' });
    }
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await booksApi.create(newBook);
      setMessage({ type: 'success', text: 'Book added successfully!' });
      setShowAddModal(false);
      setNewBook({ isbn: '', title: '', author: '', description: '', categories: '', total_copies: 1 });
      loadBooks();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to add book' });
    }
  };

  return (
    <div className="books-page">
      <header className="page-header">
        <h1>📚 Books</h1>
        {isStaff() && (
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            + Add Book
          </button>
        )}
      </header>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
          <button onClick={() => setMessage(null)}>×</button>
        </div>
      )}

      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search books by title, author..."
          className="search-input"
        />
        <button type="submit" className="btn btn-primary">Search</button>
        {searchQuery && (
          <button type="button" onClick={() => { setSearchQuery(''); loadBooks(); }} className="btn btn-secondary">
            Clear
          </button>
        )}
      </form>

      {loading ? (
        <div className="loading">Loading books...</div>
      ) : (
        <div className="books-grid">
          {books.map(book => (
            <BookCard
              key={book.id}
              book={book}
              onIssue={handleIssue}
              onReserve={handleReserve}
            />
          ))}
        </div>
      )}

      {!loading && books.length === 0 && (
        <div className="empty-state">No books found</div>
      )}

      {/* Add Book Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add New Book</h2>
            <form onSubmit={handleAddBook}>
              <div className="form-group">
                <label>ISBN</label>
                <input
                  type="text"
                  value={newBook.isbn}
                  onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={newBook.title}
                  onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Author *</label>
                <input
                  type="text"
                  value={newBook.author}
                  onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newBook.description}
                  onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Categories (comma-separated)</label>
                <input
                  type="text"
                  value={newBook.categories}
                  onChange={(e) => setNewBook({ ...newBook, categories: e.target.value })}
                  placeholder="Programming, Web Development"
                />
              </div>
              <div className="form-group">
                <label>Total Copies</label>
                <input
                  type="number"
                  min="1"
                  value={newBook.total_copies}
                  onChange={(e) => setNewBook({ ...newBook, total_copies: parseInt(e.target.value) })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Add Book</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
