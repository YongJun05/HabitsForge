/**
 * Responsive top navigation bar.
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Flame, LogOut, Menu, Settings, X } from 'lucide-react';
import { useWindowSize } from '../../hooks/useWindowSize';

interface NavbarProps {
  variant?: 'app' | 'landing';
}

const Navbar: React.FC<NavbarProps> = ({ variant = 'app' }) => {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { isMobile } = useWindowSize();
  const isLanding = variant === 'landing';

  useEffect(() => {
    let isMounted = true;

    async function fetchProfile() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (session?.user) {
          setIsAuthenticated(true);
          const { data } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', session.user.id)
            .maybeSingle();
          if (data?.display_name) setDisplayName(data.display_name);
        } else {
          setIsAuthenticated(false);
          setDisplayName('');
        }
      } catch {
        if (!isMounted) return;
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
  const closeMenu = () => setMenuOpen(false);

  const navigateTab = (tab: number) => {
    navigate('/dashboard', { state: { activeTab: tab } });
    closeMenu();
  };

  const mobileItems = isAuthenticated
    ? [
      { label: 'DASHBOARD', onClick: () => navigateTab(0) },
      { label: 'ADD HABIT', onClick: () => navigateTab(1) },
      { label: 'DETAILS', onClick: () => navigateTab(2) },
      { label: 'SETTINGS', onClick: () => { navigate('/settings'); closeMenu(); } },
      { label: 'LOGOUT', onClick: async () => { await handleLogout(); closeMenu(); } },
    ]
    : [
      { label: 'LOGIN', onClick: () => { navigate('/login'); closeMenu(); } },
      { label: 'SIGN UP', onClick: () => { navigate('/signup'); closeMenu(); } },
    ];

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 50 }}>
      <nav
        className={isLanding ? 'landing-nav' : undefined}
        style={{
          background: isLanding ? '#FFFFFF' : '#ffe600',
          borderBottom: '3px solid #000000',
          padding: isMobile ? '0 16px' : isLanding ? '0 clamp(20px, 8vw, 146px)' : '0 24px',
          minHeight: isMobile ? '64px' : '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div
          style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0' : '16px', cursor: 'pointer' }}
          onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}
        >
          <div
            style={{
              width: isMobile ? '44px' : '42px',
              height: isMobile ? '44px' : '42px',
              background: '#ffe600',
              border: '3px solid #000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '44px',
            }}
          >
            <Flame size={isMobile ? 24 : 22} strokeWidth={3} />
          </div>
          {!isMobile && (
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '22px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px' }}>
              HABITSFORGE
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isMobile ? (
            <button
              className="neo-btn"
              onClick={() => setMenuOpen((open) => !open)}
              type="button"
              aria-label="Open navigation menu"
              style={{
                width: '44px',
                height: '44px',
                minWidth: '44px',
                background: '#FFFFFF',
                border: '3px solid #000000',
                boxShadow: '3px 3px 0px #000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          ) : isAuthenticated ? (
            <>
              <span style={{ fontWeight: 800, fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase' }}>{displayName}</span>
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
                onClick={() => navigate('/settings')}
                aria-label="Settings"
                style={{
                  background: '#000000',
                  color: '#FFFFFF',
                  padding: '8px 14px',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '44px',
                }}
              >
                <Settings size={14} />
              </button>
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
                  minHeight: '44px',
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
                  padding: isLanding ? '8px 10px' : '6px 8px',
                  fontSize: isLanding ? '14px' : '12px',
                  minHeight: '44px',
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
                  padding: isLanding ? '8px 10px' : '6px 8px',
                  fontSize: isLanding ? '14px' : '12px',
                  minHeight: '44px',
                }}
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </nav>

      {isMobile && menuOpen && (
        <div style={{ background: '#FFFFFF', borderBottom: '3px solid #000000', width: '100%' }}>
          {mobileItems.map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              type="button"
              style={{
                width: '100%',
                minHeight: '44px',
                padding: '16px 20px',
                border: 'none',
                borderBottom: '2px solid #000000',
                background: '#FFFFFF',
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                textTransform: 'uppercase',
                fontSize: '16px',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Navbar;
