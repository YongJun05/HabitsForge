/**
 * Top navigation bar. Shows the HabitForge logo on the left
 * and user info + logout on the right.
 * Fetches display_name from the profiles table on mount.
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Flame, LogOut } from 'lucide-react';

interface NavbarProps {
  variant?: 'app' | 'landing';
}

const Navbar: React.FC<NavbarProps> = ({ variant = 'app' }) => {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const isLanding = variant === 'landing';

  useEffect(() => {
    let isMounted = true;

    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!isMounted) return;

      if (user) {
        setIsAuthenticated(true);
        const { data } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .maybeSingle();
        if (data?.display_name) setDisplayName(data.display_name);
      } else {
        setIsAuthenticated(false);
        setDisplayName('');
      }
    }

    fetchProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchProfile();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      console.error('Logout failed:', err instanceof Error ? err.message : err);
    } finally {
      setIsAuthenticated(false);
      setDisplayName('');
      navigate('/', { replace: true });
    }
  };

  const initial = displayName ? displayName.charAt(0).toUpperCase() : '?';

  return (
    <nav
      className={isLanding ? 'landing-nav' : undefined}
      style={{
        background: isLanding ? '#FFFFFF' : '#ffe600',
        borderBottom: `${isLanding ? 4 : 3}px solid #000000`,
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: isLanding ? '0 clamp(20px, 8vw, 146px)' : '0 24px',
        minHeight: isLanding ? '96px' : '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: isLanding ? '24px' : '12px',
      }}
    >
      {/* Logo */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}
        onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}
      >
        <div
          style={{
            width: isLanding ? '48px' : '42px',
            height: isLanding ? '48px' : '42px',
            background: '#ffe600',
            border: `${isLanding ? 4 : 3}px solid #000000`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Flame size={isLanding ? 26 : 22} strokeWidth={3} />
        </div>
        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: isLanding ? '26px' : '22px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px' }}>
          HabitForge
        </span>
      </div>

      {/* Right side: user info + actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {isAuthenticated ? (
          <>
            <span style={{ fontWeight: 800, fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase' }}>{displayName}</span>

            {/* Initials avatar */}
            <div
              style={{
                width: '36px',
                height: '36px',
                border: '3px solid #000000',
                boxShadow: '3px 3px 0px #000000',
                background: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '14px',
              }}
            >
              {initial}
            </div>

            <button
              className="neo-btn"
              onClick={handleLogout}
              style={{
                background: '#000000',
                color: '#FFFFFF',
                padding: '8px 14px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <LogOut size={14} />
              Logout
            </button>
          </>
        ) : (
          <>
            <button
              className="neo-btn"
              onClick={() => navigate('/login')}
              style={{
                background: '#FFFFFF',
                color: '#000000',
                padding: isLanding ? '10px 18px' : '8px 14px',
                fontSize: isLanding ? '14px' : '12px',
                border: isLanding ? '3px solid #000000' : undefined,
                boxShadow: isLanding ? '4px 4px 0px #000000' : undefined,
              }}
            >
              Login
            </button>
            <button
              className="neo-btn"
              onClick={() => navigate('/signup')}
              style={{
                background: isLanding ? '#ffe600' : '#2563EB',
                color: isLanding ? '#000000' : '#FFFFFF',
                padding: isLanding ? '10px 18px' : '8px 14px',
                fontSize: isLanding ? '14px' : '12px',
                border: isLanding ? '3px solid #000000' : undefined,
                boxShadow: isLanding ? '4px 4px 0px #000000' : undefined,
              }}
            >
              Sign Up
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
