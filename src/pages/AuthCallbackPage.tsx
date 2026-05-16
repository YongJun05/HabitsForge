/**
 * OAuth callback handler for Supabase auth redirects.
 * Completes the PKCE exchange, then sends the user into the app.
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Spinner from '../components/ui/Spinner';
import { supabase } from '../lib/supabase';

/*
  Production URL: https://habitsforge.vercel.app
  Add to Supabase Dashboard → Authentication → URL Configuration:
  - Site URL: https://habitsforge.vercel.app
  - Redirect URLs: https://habitsforge.vercel.app/auth/callback
*/

const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [statusText] = useState('Finishing sign-in...');

  useEffect(() => {
    document.title = 'HabitsForge';
  }, []);

  useEffect(() => {
    let isMounted = true;

    const completeSignIn = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          const { data } = await supabase.auth.getSession();
          if (!data.session) {
            throw new Error('No active session found after redirect.');
          }
        }

        if (isMounted) {
          navigate('/dashboard', { replace: true });
        }
      } catch (err) {
        if (!isMounted) return;

        const message = err instanceof Error ? err.message : 'Authentication failed';
        navigate('/login', {
          replace: true,
          state: { message: `${message} Please try again.` },
        });
      }
    };

    completeSignIn();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
      <Spinner size="lg" />
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', fontWeight: 700, letterSpacing: '2px', color: '#666' }}>
        {statusText.toUpperCase()}
      </div>
    </div>
  );
};

export default AuthCallbackPage;