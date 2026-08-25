import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/negotiation';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole, requireAdmin }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    const origin = localStorage.getItem('loginOrigin') || '/login';
    return <Navigate to={origin} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'instructor' ? '/instructor' : '/student'} replace />;
  }

  if (requireAdmin && !user.isAdmin) {
    return <Navigate to="/instructor" replace />;
  }

  return <>{children}</>;
};
