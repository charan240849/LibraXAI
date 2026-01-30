import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export function Navbar() {
  const { user, isAuthenticated, logout, isStaff } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) return null;

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/dashboard">📚 LMS</Link>
      </div>
      
      <div className="navbar-links">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/books">Books</Link>
        <Link to="/loans">My Loans</Link>
        <Link to="/search">Search</Link>
        {isStaff() && (
          <>
            <Link to="/manage-loans">Manage Loans</Link>
            <Link to="/inventory">Inventory</Link>
          </>
        )}
      </div>

      <div className="navbar-user">
        <span className="user-info">
          {user?.full_name} <span className="role-badge">{user?.role}</span>
        </span>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>
    </nav>
  );
}
