import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ReactNode } from 'react';
import { UserRole } from '@/types/user.types';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole | 'student';
  redirectTo?: string;
}

export const ProtectedRoute = ({
  children,
  requiredRole = 'student',
  redirectTo = '/login',
}: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // If user is not logged in, redirect to login
  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check if user has the required role
  const hasRequiredRole = () => {
    if (!user.role) return false;
    
    // If user is admin, they have access to everything
    if (user.role === 'admin') return true;
    
    // Subadmin has access to subadmin routes and below
    if (user.role === 'subadmin' && requiredRole !== 'admin') return true;
    
    // For other roles, check if they match the required role
    if (requiredRole === 'student') return true; // All logged-in users have student access
    if (requiredRole === 'teacher' && user.role === 'teacher') return true;
    
    return false;
  };

  if (!hasRequiredRole()) {
    // Redirect to home page or show unauthorized page
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
