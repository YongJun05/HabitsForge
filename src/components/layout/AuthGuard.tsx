/**
 * Authentication guard component.
 * Checks for an active Supabase session before rendering children.
 * Redirects to /login if no session exists.
 * Also subscribes to auth state changes to handle mid-session expiry.
 *
 * For Google OAuth users: automatically creates a profile row if one
 * doesn't exist yet (OAuth users don't go through the signup form
 * where profiles are normally created).
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Spinner from '../ui/Spinner';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Ensures a profile row exists for the current user.
 * Google OAuth users may not have a profile yet since they
 * bypass the signup form. We use upsert to handle the race
 * condition where the profile might be created concurrently.
 */
async function ensureProfile(userId: string, userMetadata: Record<string, unknown> | undefined) {
  // Check if profile exists
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (!data) {
    // Derive display name from OAuth metadata or fallback
    const displayName =
      (userMetadata?.full_name as string) ||
      (userMetadata?.name as string) ||
      (userMetadata?.email as string)?.split('@')[0] ||
      'User';

    const { error } = await supabase
      .from('profiles')
      .upsert({ id: userId, display_name: displayName });

    if (error) {
      console.error('Auto profile creation failed:', error.message);
    }
  }
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        await ensureProfile(session.user.id, session.user.user_metadata);
        setAuthenticated(true);
      } else {
        navigate('/login', { replace: true });
      }
      setChecking(false);
    });

    // Subscribe to auth state changes — handles mid-session expiry and OAuth callbacks
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        setAuthenticated(false);
        navigate('/login', { replace: true });
      } else {
        await ensureProfile(session.user.id, session.user.user_metadata);
        setAuthenticated(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (checking) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!authenticated) return null;

  return <>{children}</>;
};

export default AuthGuard;
