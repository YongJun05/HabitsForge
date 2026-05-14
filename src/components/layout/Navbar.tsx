/**
 * Top navigation bar. Shows the HabitForge logo on the left
 * and user info + logout on the right.
 * Fetches display_name from the profiles table on mount.
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { LogOut } from 'lucide-react';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
    await supabase.auth.signOut();
    navigate('/', { replace: true });
  };

  const initial = displayName ? displayName.charAt(0).toUpperCase() : '?';

  return (
    <nav
      style={{
        background: '#FFE566',
        borderBottom: '3px solid #000000',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '0 24px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {/* Logo */}
      <div
        style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '22px', cursor: 'pointer', textTransform: 'uppercase' }}
        onClick={() => navigate('/dashboard')}
      >
        HabitForge
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
                padding: '8px 14px',
                fontSize: '12px',
              }}
            >
              Login
            </button>
            <button
              className="neo-btn"
              onClick={() => navigate('/signup')}
              style={{
                background: '#2563EB',
                color: '#FFFFFF',
                padding: '8px 14px',
                fontSize: '12px',
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
