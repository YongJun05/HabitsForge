/**
 * Authentication guard component.
 * Checks for an active Supabase session before rendering children.
 * Redirects to /login if no session exists.
 * Also subscribes to auth state changes to handle mid-session expiry.
 *
 * For OAuth users: automatically creates a profile row if one
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
 * OAuth users may not have a profile yet since they
 * bypass the signup form. We use upsert to handle the race
 * condition where the profile might be created concurrently.
 * 
 * Non-blocking: failures here should NOT prevent the user from
 * accessing the app — the profile is a nice-to-have, not a gate.
 */
async function ensureProfile(userId: string, userMetadata: Record<string, unknown> | undefined) {
  try {
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
  } catch (err) {
    // Non-blocking — don't let profile issues block auth
    console.error('ensureProfile error:', err);
  }
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    // Safety timeout — if session check takes too long, redirect to login
    const timeout = setTimeout(() => {
      if (isMounted && checking) {
        console.warn('[AuthGuard] Session check timed out after 8s');
        setChecking(false);
        navigate('/login', { replace: true });
      }
    }, 8000);

    // Check for existing session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;

      if (session) {
        setAuthenticated(true);
        setChecking(false);
        // Run profile creation in background — don't block rendering
        ensureProfile(session.user.id, session.user.user_metadata);
      } else {
        setChecking(false);
        navigate('/login', { replace: true });
      }
    }).catch((err) => {
      console.error('[AuthGuard] getSession failed:', err);
      if (isMounted) {
        setChecking(false);
        navigate('/login', { replace: true });
      }
    });

    // Subscribe to auth state changes — handles mid-session expiry and OAuth callbacks
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (!session) {
        setAuthenticated(false);
        navigate('/login', { replace: true });
      } else {
        setAuthenticated(true);
        setChecking(false);
        // Run profile creation in background
        ensureProfile(session.user.id, session.user.user_metadata);
        if (event === 'SIGNED_IN') {
          navigate('/dashboard', { replace: true });
        }
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [navigate, checking]);

  if (checking) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', gap: '16px' }}>
        <Spinner size="lg" />
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', fontWeight: 700, letterSpacing: '2px', color: '#666' }}>
          CHECKING SESSION...
        </div>
      </div>
    );
  }

  if (!authenticated) return null;

  return <>{children}</>;
};

export default AuthGuard;
