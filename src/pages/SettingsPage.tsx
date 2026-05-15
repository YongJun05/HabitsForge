/**
 * Settings page. Allows users to update their display name,
 * manage notification preferences, and delete all habits (danger zone).
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Toast from '../components/ui/Toast';
import { supabase } from '../lib/supabase';
import { useNotifications } from '../hooks/useNotifications';
import { User, Bell, AlertTriangle } from 'lucide-react';

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
    <div style={{ minHeight: '100vh' }}>
      <Navbar />

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 16px' }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '24px', marginBottom: '20px' }}>
          SETTINGS
        </h1>

        {/* Account section */}
        <div style={{ padding: '20px', marginBottom: '16px', background: '#FFFFFF', border: '3px solid #000000', boxShadow: '4px 4px 0px #000000' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div className="neo-icon-box" style={{ background: '#ffe600' }}>
              <User size={22} strokeWidth={2} />
            </div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '16px', margin: 0 }}>
              ACCOUNT
            </h2>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontWeight: 800, fontSize: '12px', letterSpacing: '2px', display: 'block', marginBottom: '6px' }}>EMAIL</label>
            <input className="neo-input" value={email} disabled style={{ opacity: 0.6 }} />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontWeight: 800, fontSize: '12px', letterSpacing: '2px', display: 'block', marginBottom: '6px' }}>DISPLAY NAME</label>
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
                style={{ background: '#2563EB', color: '#FFFFFF', padding: '10px 16px', fontSize: '12px', whiteSpace: 'nowrap' }}
              >
                {saving ? 'SAVING...' : 'SAVE CHANGES'}
              </button>
            </div>
          </div>
        </div>

        {/* Notifications section */}
        <div style={{ padding: '20px', marginBottom: '16px', background: '#FFFFFF', border: '3px solid #000000', boxShadow: '4px 4px 0px #000000' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div className="neo-icon-box" style={{ background: '#2563EB', color: '#FFFFFF' }}>
              <Bell size={22} strokeWidth={2} />
            </div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '16px', margin: 0 }}>
              NOTIFICATIONS
            </h2>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}>BROWSER PERMISSION: <strong>{permissionLabel.toUpperCase()}</strong></span>
            {isSupported && permission !== 'granted' && permission !== 'unsupported' && (
              <button
                className="neo-btn"
                onClick={requestPermission}
                style={{ background: '#2563EB', color: '#FFFFFF', padding: '8px 12px', fontSize: '12px' }}
              >
                ENABLE NOTIFICATIONS
              </button>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}>GLOBAL NOTIFICATIONS</span>
            <button
              onClick={handleToggleNotifGlobal}
              style={{
                width: '48px',
                height: '24px',
                background: notifGlobal ? '#22C55E' : '#e0e0e0',
                border: '3px solid #000000',
                boxShadow: '4px 4px 0px #000000',
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  background: '#000000',
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
        <div style={{ padding: '20px', border: '3px solid #FF2D9B', boxShadow: '4px 4px 0px #000000', background: '#FFFFFF' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div className="neo-icon-box" style={{ background: '#FF2D9B', color: '#FFFFFF' }}>
              <AlertTriangle size={22} strokeWidth={2} />
            </div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '16px', margin: 0, color: '#FF2D9B' }}>
              DANGER ZONE
            </h2>
          </div>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', marginBottom: '12px' }}>
            This will permanently delete all your habits and their logs. This action cannot be undone.
          </p>
          <button
            className="neo-btn"
            onClick={handleDeleteAllHabits}
            style={{ background: '#FF2D9B', color: '#FFFFFF', padding: '10px 16px', fontSize: '12px' }}
          >
            DELETE ALL HABITS
          </button>
        </div>
      </div>

      <Footer />

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
