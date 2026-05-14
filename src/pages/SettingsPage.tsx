/**
 * Settings page. Allows users to update their display name,
 * manage notification preferences, and delete all habits (danger zone).
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Toast from '../components/ui/Toast';
import { supabase } from '../lib/supabase';
import { useNotifications } from '../hooks/useNotifications';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { permission, requestPermission, isSupported } = useNotifications();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [notifGlobal, setNotifGlobal] = useState(() => localStorage.getItem('habitforge_notifications') !== 'false');

  useEffect(() => {
    document.title = 'HabitForge — Settings';

    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }

      setEmail(user.email ?? '');

      const { data } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .maybeSingle();

      if (data) setDisplayName(data.display_name);
    }

    loadProfile();
  }, [navigate]);

  const handleSaveName = async () => {
    if (!displayName.trim()) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName.trim() })
        .eq('id', user.id);

      if (error) throw error;
      setToast({ message: 'Name updated!', type: 'success' });
    } catch {
      setToast({ message: 'Failed to update name', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleNotifGlobal = () => {
    const newVal = !notifGlobal;
    setNotifGlobal(newVal);
    localStorage.setItem('habitforge_notifications', String(newVal));
    setToast({ message: newVal ? 'Notifications enabled' : 'Notifications disabled', type: 'info' });
  };

  const handleDeleteAllHabits = async () => {
    const first = window.confirm('Are you sure you want to delete ALL your habits? This cannot be undone.');
    if (!first) return;
    const second = window.confirm('Really delete everything? Type "yes" mentally and click OK to proceed.');
    if (!second) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('habits').delete().eq('user_id', user.id);
      if (error) throw error;
      setToast({ message: 'All habits deleted', type: 'success' });
    } catch {
      setToast({ message: 'Failed to delete habits', type: 'error' });
    }
  };

  const permissionLabel = permission === 'granted' ? 'Granted' : permission === 'denied' ? 'Denied' : permission === 'unsupported' ? 'Not supported' : 'Not requested';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Navbar />

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px' }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '24px', marginBottom: '20px' }}>
          Settings
        </h1>

        {/* Account section */}
        <div className="neo-card" style={{ padding: '20px', marginBottom: '16px' }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '16px', marginBottom: '12px' }}>
            Account
          </h2>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontWeight: 700, fontSize: '13px', display: 'block', marginBottom: '4px' }}>Email</label>
            <input className="neo-input" value={email} disabled style={{ opacity: 0.6 }} />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontWeight: 700, fontSize: '13px', display: 'block', marginBottom: '4px' }}>Display Name</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                className="neo-input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); }}
              />
              <button
                className="neo-btn"
                onClick={handleSaveName}
                disabled={saving || !displayName.trim()}
                style={{ background: '#FFE566', padding: '8px 16px', fontSize: '13px', whiteSpace: 'nowrap' }}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>

        {/* Notifications section */}
        <div className="neo-card" style={{ padding: '20px', marginBottom: '16px' }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '16px', marginBottom: '12px' }}>
            Notifications
          </h2>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px' }}>Browser permission: <strong>{permissionLabel}</strong></span>
            {isSupported && permission !== 'granted' && permission !== 'unsupported' && (
              <button
                className="neo-btn"
                onClick={requestPermission}
                style={{ background: '#74b9ff', padding: '6px 12px', fontSize: '12px' }}
              >
                Enable Notifications
              </button>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px' }}>Global notifications</span>
            <button
              onClick={handleToggleNotifGlobal}
              style={{
                width: '44px',
                height: '24px',
                borderRadius: '12px',
                background: notifGlobal ? '#A8E6CF' : '#e0e0e0',
                border: '2px solid #1A1A1A',
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: '#1A1A1A',
                  position: 'absolute',
                  top: '2px',
                  left: notifGlobal ? '22px' : '2px',
                  transition: 'left 0.2s',
                }}
              />
            </button>
          </div>
        </div>

        {/* Danger zone */}
        <div className="neo-card" style={{ padding: '20px', border: '3px solid #FF6B6B' }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '16px', marginBottom: '12px', color: '#FF6B6B' }}>
            Danger Zone
          </h2>
          <p style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
            This will permanently delete all your habits and their logs. This action cannot be undone.
          </p>
          <button
            className="neo-btn"
            onClick={handleDeleteAllHabits}
            style={{ background: '#FF6B6B', color: 'white', padding: '8px 16px', fontSize: '13px' }}
          >
            Delete All Habits
          </button>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          visible={!!toast}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default SettingsPage;
