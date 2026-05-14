/**
 * Login page. Authenticates users via Supabase email/password or OAuth.
 * Shows inline error messages and disables the button while loading.
 */
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { signInWithGoogle } from '../lib/auth';
import Navbar from '../components/layout/Navbar';
import { LockKeyhole } from 'lucide-react';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'HabitForge — Login';
  }, []);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setGoogleLoading(true);

    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google login failed');
      setGoogleLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div
          style={{
            maxWidth: '480px',
            width: '100%',
            background: '#FFFFFF',
            border: '3px solid #000000',
            boxShadow: '6px 6px 0px #000000',
            padding: '32px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div className="neo-icon-box" style={{ background: '#ffe600' }}>
              <LockKeyhole size={22} strokeWidth={2} />
            </div>
            <div>
              <div className="font-hero" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '32px' }}>WELCOME BACK.</div>
              <div className="font-mono" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '14px' }}>Log in to keep your streaks alive.</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '12px', display: 'block', marginBottom: '6px' }}>EMAIL</label>
              <input
                className="neo-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '12px', display: 'block', marginBottom: '6px' }}>PASSWORD</label>
              <input
                className="neo-input"
                type="password"
                placeholder="·······"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
              />
            </div>

            <button
              className="neo-btn"
              onClick={handleLogin}
              disabled={loading || !email || !password}
              style={{
                background: '#2563EB',
                color: '#FFFFFF',
                padding: '14px',
                fontSize: '16px',
                width: '100%',
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              {loading ? 'LOGGING IN...' : 'LOG IN →'}
            </button>

            {error && (
              <div
                style={{
                  background: '#000000',
                  color: '#FFFFFF',
                  padding: '10px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '13px',
                  marginTop: '12px',
                }}
              >
                {error}
              </div>
            )}

            {/* Divider */}
            <div style={{ textAlign: 'center', color: '#666', fontSize: '12px', margin: '16px 0' }}>
              — OR —
            </div>

            {/* Google OAuth button */}
            <button
              className="neo-btn"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              style={{
                background: '#FFFFFF',
                color: '#000000',
                padding: '12px',
                fontSize: '14px',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {googleLoading ? 'CONNECTING...' : 'CONTINUE WITH GOOGLE'}
            </button>
          </div>

          <p style={{ textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: '14px', marginTop: '16px', color: '#000000' }}>
            New here?{' '}
            <Link to="/signup" style={{ fontWeight: 700, color: '#000000', textDecoration: 'underline' }}>Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
