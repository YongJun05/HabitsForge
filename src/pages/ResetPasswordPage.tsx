/**
 * pages/ResetPasswordPage.tsx
 *
 * Lets the user set a new password after clicking the reset link in their email.
 * Supabase automatically creates a session from the URL token before this page loads.
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { KeyRound, Eye, EyeOff } from 'lucide-react';
import { useWindowSize } from '../hooks/useWindowSize';

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { isMobile } = useWindowSize();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'HabitsForge — Reset Password';
  }, []);

  const handleReset = async () => {
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) throw updateError;

      navigate('/login', {
        replace: true,
        state: { message: 'Password updated successfully! Log in with your new password.' },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar variant="landing" />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isMobile ? '24px 16px' : '40px 24px',
        }}
      >
        <div
          style={{
            maxWidth: isMobile ? 'none' : '480px',
            width: '100%',
            background: '#FFFFFF',
            border: '3px solid #000000',
            boxShadow: isMobile ? 'none' : '6px 6px 0px #000000',
            padding: isMobile ? '20px 16px' : '32px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div className="neo-icon-box" style={{ background: '#ffe600' }}>
              <KeyRound size={22} strokeWidth={2} />
            </div>
            <div>
              <div
                className="font-hero"
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 800,
                  fontSize: isMobile ? '24px' : '28px',
                }}
              >
                NEW PASSWORD.
              </div>
              <div
                className="font-mono"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '14px',
                }}
              >
                Choose a strong new password.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* New password */}
            <div>
              <label
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  fontSize: '12px',
                  display: 'block',
                  marginBottom: '6px',
                }}
              >
                NEW PASSWORD
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  className="neo-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="·······"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    paddingRight: '44px',
                    paddingTop: isMobile ? '10px' : undefined,
                    paddingBottom: isMobile ? '10px' : undefined,
                    fontSize: isMobile ? '16px' : undefined,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#666',
                    padding: '0',
                    minWidth: '44px',
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  fontSize: '12px',
                  display: 'block',
                  marginBottom: '6px',
                }}
              >
                CONFIRM PASSWORD
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  className="neo-input"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="·······"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleReset();
                  }}
                  style={{
                    paddingRight: '44px',
                    paddingTop: isMobile ? '10px' : undefined,
                    paddingBottom: isMobile ? '10px' : undefined,
                    fontSize: isMobile ? '16px' : undefined,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#666',
                    padding: '0',
                    minWidth: '44px',
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              className="neo-btn"
              onClick={handleReset}
              disabled={loading || !password || !confirmPassword}
              style={{
                background: '#2563EB',
                color: '#FFFFFF',
                padding: '10px 18px',
                fontSize: '14px',
                width: '100%',
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                minHeight: '44px',
              }}
            >
              {loading ? 'UPDATING...' : 'SET NEW PASSWORD →'}
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
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ResetPasswordPage;
