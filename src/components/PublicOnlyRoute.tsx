import { type ReactNode, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { FullPageLoader } from '@/components/ui/States';

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useState(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
      setLoading(false);
    });
  });

  if (loading) return <FullPageLoader message="Loading..." />;
  if (hasSession) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
