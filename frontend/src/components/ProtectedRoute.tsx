import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireStaff?: boolean;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireStaff, requireAdmin }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isStaff, isAdmin } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireStaff && !isStaff()) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
