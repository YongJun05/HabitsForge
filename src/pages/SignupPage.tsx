/**
 * Signup page. Creates a new user via Supabase Auth (email/password or OAuth)
 * and inserts a profile row. Validates all fields before submitting.
 * If profile insert fails after successful signup, still navigates to dashboard.
 */
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { signInWithGoogle } from '../lib/auth';
import Navbar from '../components/layout/Navbar';

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    document.title = 'HabitForge — Sign Up';
  }, []);

  const validate = (): string[] => {
    const errs: string[] = [];
    if (!displayName.trim()) errs.push('Display name is required');
    if (!email.trim()) errs.push('Email is required');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.push('Invalid email format');
    if (!password) errs.push('Password is required');
    else if (password.length < 8) errs.push('Password must be at least 8 characters');
    if (password !== confirmPassword) errs.push('Passwords do not match');
    return errs;
  };

  const handleSignup = async () => {
    const validationErrors = validate();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      // Insert profile row — if this fails, still navigate (profile can be created later)
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({ id: data.user.id, display_name: displayName.trim() });

        if (profileError) {
          console.error('Profile insert failed:', profileError.message);
        }
      }

      navigate('/dashboard', { replace: true });
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Signup failed']);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setErrors([]);
    setGoogleLoading(true);

    try {
      await signInWithGoogle();
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Google signup failed']);
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
            <div className="neo-icon-box" style={{ background: '#FF2D9B' }}>✨</div>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '32px' }}>CREATE ACCOUNT</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}>Join HabitForge and start building.</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontWeight: 800, fontSize: '12px', letterSpacing: '2px', display: 'block', marginBottom: '6px' }}>DISPLAY NAME</label>
              <input
                className="neo-input"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              {errors.includes('Display name is required') && (
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#FF2D9B', marginTop: '4px' }}>
                  Display name is required
                </div>
              )}
            </div>

            <div>
              <label style={{ fontWeight: 800, fontSize: '12px', letterSpacing: '2px', display: 'block', marginBottom: '6px' }}>EMAIL</label>
              <input
                className="neo-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.includes('Email is required') && (
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#FF2D9B', marginTop: '4px' }}>
                  Email is required
                </div>
              )}
              {errors.includes('Invalid email format') && (
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#FF2D9B', marginTop: '4px' }}>
                  Invalid email format
                </div>
              )}
            </div>

            <div>
              <label style={{ fontWeight: 800, fontSize: '12px', letterSpacing: '2px', display: 'block', marginBottom: '6px' }}>PASSWORD</label>
              <input
                className="neo-input"
                type="password"
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {errors.includes('Password is required') && (
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#FF2D9B', marginTop: '4px' }}>
                  Password is required
                </div>
              )}
              {errors.includes('Password must be at least 8 characters') && (
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#FF2D9B', marginTop: '4px' }}>
                  Password must be at least 8 characters
                </div>
              )}
            </div>

            <div>
              <label style={{ fontWeight: 800, fontSize: '12px', letterSpacing: '2px', display: 'block', marginBottom: '6px' }}>CONFIRM PASSWORD</label>
              <input
                className="neo-input"
                type="password"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSignup(); }}
              />
              {errors.includes('Passwords do not match') && (
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#FF2D9B', marginTop: '4px' }}>
                  Passwords do not match
                </div>
              )}
            </div>

            {errors.length > 0 && !errors.some((err) => err.includes('required') || err.includes('format') || err.includes('match')) && (
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#FF2D9B' }}>
                {errors[0]}
              </div>
            )}

            <button
              className="neo-btn"
              onClick={handleSignup}
              disabled={loading}
              style={{
                background: '#2563EB',
                color: '#FFFFFF',
                padding: '14px',
                fontSize: '16px',
                width: '100%',
              }}
            >
              {loading ? 'CREATING...' : 'GET STARTED →'}
            </button>

            {/* Divider */}
            <div style={{ textAlign: 'center', color: '#666', fontSize: '12px', margin: '16px 0' }}>
              — OR —
            </div>

            {/* Google OAuth button */}
            <button
              className="neo-btn"
              onClick={handleGoogleSignup}
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

          <p style={{ textAlign: 'center', fontSize: '13px', marginTop: '16px', color: '#000000' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ fontWeight: 800, color: '#000000', textDecoration: 'underline' }}>LOGIN →</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
