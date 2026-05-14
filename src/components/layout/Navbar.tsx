/**
 * Top navigation bar. Shows the HabitForge logo on the left
 * and user info + logout on the right.
 * Fetches display_name from the profiles table on mount.
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { LogOut, Settings } from 'lucide-react';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .maybeSingle();
        if (data) setDisplayName(data.display_name);
      }
    }
    fetchProfile();
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
        borderBottom: '3px solid #1A1A1A',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '0 24px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {/* Logo */}
      <div
        style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '22px', cursor: 'pointer' }}
        onClick={() => navigate('/dashboard')}
      >
        HabitForge
      </div>

      {/* Right side: user info + actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontWeight: 500, fontSize: '14px' }}>{displayName}</span>

        {/* Initials avatar */}
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#1A1A1A',
            color: '#FFE566',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '14px',
          }}
        >
          {initial}
        </div>

        <button
          onClick={() => navigate('/settings')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
          }}
          title="Settings"
        >
          <Settings size={20} />
        </button>

        <button
          onClick={handleLogout}
          style={{
            background: '#1A1A1A',
            color: '#FFE566',
            border: '2px solid #1A1A1A',
            borderRadius: '6px',
            padding: '6px 12px',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <LogOut size={14} />
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
