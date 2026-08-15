import { type ReactNode, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { FullPageLoader } from '@/components/ui/States';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) return <FullPageLoader message="Loading your workspace..." />;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
