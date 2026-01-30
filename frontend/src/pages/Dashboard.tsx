import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { booksApi, loansApi, recommendationsApi, inventoryApi } from '../api';
import { Book, Loan } from '../types';
import { BookCard } from '../components/BookCard';
import './Dashboard.css';

export function DashboardPage() {
  const { user, isStaff } = useAuth();
  const [myLoans, setMyLoans] = useState<Loan[]>([]);
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [lowStock, setLowStock] = useState<Book[]>([]);
  const [stats, setStats] = useState({ totalBooks: 0, activeLoans: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load user's active loans
      if (user) {
        const loansData = await loansApi.getAll({ status: 'ISSUED' });
        setMyLoans(loansData.loans.slice(0, 5));
      }

      // Load recommendations
      if (user) {
        const recsData = await recommendationsApi.forUser(user.id);
        setRecommendations(recsData.recommendations.slice(0, 4));
      }

      // Load books count
      const booksData = await booksApi.getAll();
      setStats(prev => ({ ...prev, totalBooks: booksData.books.length }));

      // Staff: load low stock
      if (isStaff()) {
        const stockData = await inventoryApi.lowStock(3);
        setLowStock(stockData.books.slice(0, 5));
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Welcome, {user?.full_name}!</h1>
        <p>Here's your library overview</p>
      </header>

      <div className="dashboard-stats">
        <div className="stat-card">
          <span className="stat-icon">📚</span>
          <div className="stat-info">
            <h3>{stats.totalBooks}</h3>
            <p>Total Books</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📖</span>
          <div className="stat-info">
            <h3>{myLoans.length}</h3>
            <p>Active Loans</p>
          </div>
        </div>
      </div>

      {myLoans.length > 0 && (
        <section className="dashboard-section">
          <h2>📖 Your Active Loans</h2>
          <div className="loans-list">
            {myLoans.map(loan => (
              <div key={loan.id} className="loan-item">
                <span className="loan-book">{loan.book_title}</span>
                <span className={`loan-due ${new Date(loan.due_at) < new Date() ? 'overdue' : ''}`}>
                  Due: {new Date(loan.due_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {recommendations.length > 0 && (
        <section className="dashboard-section">
          <h2>✨ Recommended for You</h2>
          <div className="books-grid">
            {recommendations.map(book => (
              <BookCard key={book.id} book={book} showActions={false} />
            ))}
          </div>
        </section>
      )}

      {isStaff() && lowStock.length > 0 && (
        <section className="dashboard-section alert-section">
          <h2>⚠️ Low Stock Alert</h2>
          <div className="low-stock-list">
            {lowStock.map(book => (
              <div key={book.id} className="low-stock-item">
                <span>{book.title}</span>
                <span className="stock-count">{book.available_copies} / {book.total_copies}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
