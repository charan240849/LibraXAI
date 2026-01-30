import { useState, useEffect } from 'react';
import { loansApi } from '../api';
import { Loan } from '../types';
import { useAuth } from '../context/AuthContext';
import './Loans.css';

export function LoansPage() {
  const { user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadLoans();
  }, [filter]);

  const loadLoans = async () => {
    try {
      setLoading(true);
      const filters: { status?: string } = {};
      if (filter !== 'all') {
        filters.status = filter;
      }
      const data = await loansApi.getAll(filters);
      setLoans(data.loans);
    } catch (error) {
      console.error('Error loading loans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (loanId: number) => {
    try {
      await loansApi.return(loanId);
      setMessage({ type: 'success', text: 'Book returned successfully!' });
      loadLoans();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to return book' });
    }
  };

  const handleRenew = async (loanId: number) => {
    try {
      await loansApi.renew(loanId);
      setMessage({ type: 'success', text: 'Loan renewed successfully!' });
      loadLoans();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to renew loan. Check if renewals are available.' });
    }
  };

  const getStatusClass = (loan: Loan) => {
    if (loan.status === 'RETURNED') return 'status-returned';
    if (loan.status === 'OVERDUE' || new Date(loan.due_at) < new Date()) return 'status-overdue';
    return 'status-issued';
  };

  return (
    <div className="loans-page">
      <header className="page-header">
        <h1>📖 My Loans</h1>
      </header>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
          <button onClick={() => setMessage(null)}>×</button>
        </div>
      )}

      <div className="filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`filter-btn ${filter === 'ISSUED' ? 'active' : ''}`}
          onClick={() => setFilter('ISSUED')}
        >
          Active
        </button>
        <button
          className={`filter-btn ${filter === 'RETURNED' ? 'active' : ''}`}
          onClick={() => setFilter('RETURNED')}
        >
          Returned
        </button>
        <button
          className={`filter-btn ${filter === 'OVERDUE' ? 'active' : ''}`}
          onClick={() => setFilter('OVERDUE')}
        >
          Overdue
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading loans...</div>
      ) : loans.length === 0 ? (
        <div className="empty-state">No loans found</div>
      ) : (
        <div className="loans-table-container">
          <table className="loans-table">
            <thead>
              <tr>
                <th>Book</th>
                <th>Issued</th>
                <th>Due</th>
                <th>Status</th>
                <th>Renewals</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loans.map(loan => (
                <tr key={loan.id}>
                  <td className="book-title">{loan.book_title}</td>
                  <td>{new Date(loan.issued_at).toLocaleDateString()}</td>
                  <td>{new Date(loan.due_at).toLocaleDateString()}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(loan)}`}>
                      {loan.status}
                    </span>
                  </td>
                  <td>{loan.renew_count} / 2</td>
                  <td className="actions">
                    {loan.status === 'ISSUED' && (
                      <>
                        <button onClick={() => handleReturn(loan.id)} className="btn btn-success btn-sm">
                          Return
                        </button>
                        {loan.renew_count < 2 && (
                          <button onClick={() => handleRenew(loan.id)} className="btn btn-secondary btn-sm">
                            Renew
                          </button>
                        )}
                      </>
                    )}
                    {loan.status === 'OVERDUE' && (
                      <button onClick={() => handleReturn(loan.id)} className="btn btn-danger btn-sm">
                        Return Now
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
