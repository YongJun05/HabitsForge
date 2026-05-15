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
import Footer from '../components/layout/Footer';
import { Sparkles, Mail, Eye, EyeOff } from 'lucide-react';

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    if (validationErrors.length > 0) { setErrors(validationErrors); return; }
    setErrors([]); setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) throw authError;
      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').insert({ id: data.user.id, display_name: displayName.trim() });
        if (profileError) console.error('Profile insert failed:', profileError.message);
      }
      if (data.session) {
        await supabase.auth.signOut();
      }
      navigate('/login', { state: { message: 'Account created successfully! Please log in.' } });
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Signup failed']);
    } finally { setLoading(false); }
  };

  const handleGoogleSignup = async () => {
    setErrors([]); setGoogleLoading(true);
    try { await signInWithGoogle(); }
    catch (err) { setErrors([err instanceof Error ? err.message : 'Google signup failed']); setGoogleLoading(false); }
  };

  const labelStyle: React.CSSProperties = { fontFamily: "'DM Sans', sans-serif", fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '12px', display: 'block', marginBottom: '6px' };
  const errStyle: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#FF2D9B', marginTop: '4px' };
  const eyeBtnStyle: React.CSSProperties = { position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#666', padding: '0', display: 'flex', alignItems: 'center' };

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar variant="landing" />
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px' }}>
        <div style={{ maxWidth: '480px', width: '100%', background: '#FFFFFF', border: '3px solid #000000', boxShadow: '6px 6px 0px #000000', padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div className="neo-icon-box" style={{ background: '#FF2D9B' }}><Sparkles size={22} strokeWidth={2} /></div>
            <div>
              <div className="font-hero" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '32px' }}>CREATE ACCOUNT.</div>
              <div className="font-mono" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '14px' }}>Start building streaks that stick.</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={labelStyle}>DISPLAY NAME</label>
              <input className="neo-input" placeholder="Your name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              {errors.includes('Display name is required') && <div style={errStyle}>Display name is required</div>}
            </div>

            <div>
              <label style={labelStyle}>EMAIL</label>
              <input className="neo-input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              {errors.includes('Email is required') && <div style={errStyle}>Email is required</div>}
              {errors.includes('Invalid email format') && <div style={errStyle}>Invalid email format</div>}
            </div>

            <div>
              <label style={labelStyle}>PASSWORD</label>
              <div style={{ position: 'relative' }}>
                <input className="neo-input" type={showPassword ? 'text' : 'password'} placeholder="·······" value={password} onChange={(e) => setPassword(e.target.value)} style={{ paddingRight: '44px' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={eyeBtnStyle}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.includes('Password is required') && <div style={errStyle}>Password is required</div>}
              {errors.includes('Password must be at least 8 characters') && <div style={errStyle}>Password must be at least 8 characters</div>}
            </div>

            <div>
              <label style={labelStyle}>CONFIRM PASSWORD</label>
              <div style={{ position: 'relative' }}>
                <input className="neo-input" type={showConfirmPassword ? 'text' : 'password'} placeholder="·······" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSignup(); }} style={{ paddingRight: '44px' }} />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={eyeBtnStyle}>
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.includes('Passwords do not match') && <div style={errStyle}>Passwords do not match</div>}
            </div>

            {errors.length > 0 && !errors.some((err) => err.includes('required') || err.includes('format') || err.includes('match') || err.includes('characters')) && (
              <div style={errStyle}>{errors[0]}</div>
            )}

            <button className="neo-btn" onClick={handleSignup} disabled={loading} style={{ background: '#2563EB', color: '#FFFFFF', padding: '10px 18px', fontSize: '14px', width: '100%', fontFamily: "'Syne', sans-serif", fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
              {loading ? 'CREATING...' : 'GET STARTED →'}
            </button>

            <div style={{ textAlign: 'center', color: '#666', fontSize: '12px', margin: '16px 0' }}>— OR —</div>

            <button className="neo-btn" onClick={handleGoogleSignup} disabled={googleLoading} style={{ background: '#FFFFFF', color: '#000000', padding: '12px', fontSize: '14px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
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
            Already have an account?{' '}
            <Link to="/login" style={{ fontWeight: 700, color: '#000000', textDecoration: 'underline' }}>Log in</Link>
          </p>
        </div>


      </div>
      <Footer />
    </div>
  );
};

export default SignupPage;
