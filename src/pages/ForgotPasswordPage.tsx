/**
 * pages/ForgotPasswordPage.tsx
 *
 * Allows users to request a password-reset email via Supabase.
 * Shows success feedback once the email is sent.
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { resetPassword } from '../lib/auth';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useWindowSize } from '../hooks/useWindowSize';

const ForgotPasswordPage: React.FC = () => {
  const { isMobile } = useWindowSize();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    document.title = 'HabitsForge — Forgot Password';
  }, []);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar variant="landing" />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '24px 16px' : '40px 24px' }}>

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
          {sent ? (
            /* ── Success state ── */
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  background: '#A3E635',
                  border: '3px solid #000000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <CheckCircle2 size={28} strokeWidth={2.5} color="#000000" />
              </div>
              <div
                className="font-hero"
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 800,
                  fontSize: isMobile ? '24px' : '28px',
                  marginBottom: '12px',
                }}
              >
                CHECK YOUR INBOX.
              </div>
              <p
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '14px',
                  color: '#333',
                  lineHeight: 1.6,
                  marginBottom: '24px',
                }}
              >
                We sent a password reset link to{' '}
                <strong style={{ color: '#000' }}>{email}</strong>. Click the link
                in the email to set a new password.
              </p>
              <p
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '12px',
                  color: '#666',
                  lineHeight: 1.5,
                  marginBottom: '24px',
                }}
              >
                Didn't receive it? Check your spam folder, or{' '}
                <button
                  type="button"
                  onClick={() => {
                    setSent(false);
                    setError(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#000',
                    fontWeight: 700,
                    textDecoration: 'underline',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '12px',
                    padding: 0,
                  }}
                >
                  try again
                </button>
                .
              </p>
              <Link
                to="/login"
                className="neo-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#2563EB',
                  color: '#FFFFFF',
                  padding: '10px 18px',
                  fontSize: '14px',
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  textDecoration: 'none',
                  minHeight: '44px',
                }}
              >
                <ArrowLeft size={16} strokeWidth={2.5} />
                BACK TO LOGIN
              </Link>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div className="neo-icon-box" style={{ background: '#ffe600' }}>
                  <Mail size={22} strokeWidth={2} />
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
                    FORGOT PASSWORD?
                  </div>
                  <div
                    className="font-mono"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '14px',
                    }}
                  >
                    No worries, we'll send you a reset link.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                    EMAIL
                  </label>
                  <input
                    className="neo-input"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && email) handleSubmit();
                    }}
                    style={{
                      padding: isMobile ? '10px 12px' : undefined,
                      fontSize: isMobile ? '16px' : undefined,
                    }}
                  />
                </div>

                <button
                  className="neo-btn"
                  onClick={handleSubmit}
                  disabled={loading || !email}
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
                  {loading ? 'SENDING...' : 'SEND RESET LINK →'}
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

              <p
                style={{
                  textAlign: 'center',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '14px',
                  marginTop: '16px',
                  color: '#000000',
                }}
              >
                Remember your password?{' '}
                <Link
                  to="/login"
                  style={{ fontWeight: 700, color: '#000000', textDecoration: 'underline' }}
                >
                  Log in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ForgotPasswordPage;
