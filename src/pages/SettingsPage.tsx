/**
 * pages/SettingsPage.tsx
 * 
 * Settings page. Allows users to update their display name,
 * manage notification preferences, and delete all habits (danger zone).
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Toast from '../components/ui/Toast';
import { supabase } from '../lib/supabase';
import { useNotifications, isNotificationSupported } from '../hooks/useNotifications';
import { User, Bell, AlertTriangle, Archive, RotateCcw, Trash2 } from 'lucide-react';
import type { Habit } from '../types';
import HabitIcon from '../components/ui/HabitIcon';
import { useWindowSize } from '../hooks/useWindowSize';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isMobile } = useWindowSize();
  const { permission, requestPermission, isSupported, pushSubscribed, pushLoading, isPushAvailable, handleSubscribePush, handleUnsubscribePush } = useNotifications();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [notifGlobal, setNotifGlobal] = useState(() => localStorage.getItem('habitsforge_notifications') !== 'false');
  const [archivedHabits, setArchivedHabits] = useState<Habit[]>([]);
  const [archiveLoading, setArchiveLoading] = useState(false);

  useEffect(() => {
    document.title = 'HabitsForge — Settings';

    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }

      setEmail(user.email ?? '');

      const { data } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        setDisplayName(data.display_name);
      } else {
        // Profile missing -> create it on the fly
        const defaultName = user.email?.split('@')[0] || 'User';
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({ id: user.id, display_name: defaultName })
          .select('display_name')
          .single();
        if (newProfile) {
          setDisplayName(newProfile.display_name);
        }
      }
    }

    loadProfile();
  }, [navigate]);

  // Fetch archived habits
  useEffect(() => {
    async function loadArchived() {
      setArchiveLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('habits')
          .select('*')
          .eq('user_id', user.id)
          .eq('archived', true)
          .order('archived_at', { ascending: false });
        setArchivedHabits((data as Habit[]) ?? []);
      } catch {
        // Ignoring error to prevent console.error
      } finally {
        setArchiveLoading(false);
      }
    }
    loadArchived();
  }, [toast]); // refetch when toast changes (after restore/delete)

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
    localStorage.setItem('habitsforge_notifications', String(newVal));
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

  const handleRestoreHabit = async (id: string) => {
    try {
      const { error } = await supabase
        .from('habits')
        .update({ archived: false, archived_at: null })
        .eq('id', id);
      if (error) throw error;
      setToast({ message: 'HABIT RESTORED', type: 'success' });
    } catch {
      setToast({ message: 'Failed to restore habit', type: 'error' });
    }
  };

  const handlePermanentDelete = async (id: string, name: string) => {
    if (!window.confirm(`Permanently delete "${name}"? This cannot be undone.`)) return;
    try {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setToast({ message: 'HABIT DELETED FOREVER', type: 'success' });
    } catch {
      setToast({ message: 'Failed to delete habit', type: 'error' });
    }
  };

  const permissionLabel = permission === 'granted' ? 'Granted' : permission === 'denied' ? 'Denied' : permission === 'unsupported' ? 'Not supported' : 'Not requested';

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />

      <div style={{ maxWidth: isMobile ? '100%' : '640px', margin: '0 auto', padding: isMobile ? '16px' : '32px 16px', boxSizing: 'border-box', overflowX: 'hidden' }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '24px', marginBottom: '20px' }}>
          SETTINGS
        </h1>

        {/* Account section */}
        <div style={{ padding: isMobile ? '16px' : '20px', marginBottom: '16px', background: '#FFFFFF', border: '3px solid #000000', boxShadow: '4px 4px 0px #000000', width: '100%', boxSizing: 'border-box' }}>
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
            <div style={{ display: 'flex', gap: '8px', flexDirection: isMobile ? 'column' : 'row' }}>
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
                style={{ background: '#2563EB', color: '#FFFFFF', padding: '10px 16px', fontSize: '12px', whiteSpace: 'nowrap', minHeight: '44px' }}
              >
                {saving ? 'SAVING...' : 'SAVE CHANGES'}
              </button>
            </div>
          </div>
        </div>

        {/* Notifications section — hidden entirely on unsupported browsers (e.g. iOS Safari) */}
        {isNotificationSupported && (
        <div style={{ padding: isMobile ? '16px' : '20px', marginBottom: '16px', background: '#FFFFFF', border: '3px solid #000000', boxShadow: '4px 4px 0px #000000', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div className="neo-icon-box" style={{ background: '#2563EB', color: '#FFFFFF' }}>
              <Bell size={22} strokeWidth={2} />
            </div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '16px', margin: 0 }}>
              NOTIFICATIONS
            </h2>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: '12px', gap: '12px', flexDirection: isMobile ? 'column' : 'row' }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}>BROWSER PERMISSION: <strong>{permissionLabel.toUpperCase()}</strong></span>
            {isSupported && permission !== 'granted' && permission !== 'unsupported' && (
              <button
                className="neo-btn"
                onClick={requestPermission}
                style={{ background: '#2563EB', color: '#FFFFFF', padding: '8px 12px', fontSize: '12px', minHeight: '44px' }}
              >
                ENABLE NOTIFICATIONS
              </button>
            )}
          </div>

          {/* Blocked message */}
          {permission === 'denied' && (
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: '#888', margin: '0 0 12px' }}>
              Notifications are blocked. Please enable them in your browser settings.
            </p>
          )}

          {/* Test Notification button — only when permission is granted */}
          {permission === 'granted' && (
            <div style={{ marginBottom: '12px' }}>
              <button
                className="neo-btn"
                onClick={async () => {
                  // Test via service worker if available, otherwise fallback
                  if ('serviceWorker' in navigator) {
                    const reg = await navigator.serviceWorker.ready;
                    reg.showNotification('HabitsForge 🔥', {
                      body: 'Push notifications are working!',
                      icon: '/favicon.svg',
                    });
                  } else {
                    new Notification('HabitsForge', {
                      body: 'Notifications are working!',
                      icon: '/favicon.svg',
                    });
                  }
                }}
                style={{
                  background: '#FFFFFF',
                  color: '#000000',
                  border: '2px solid #000000',
                  boxShadow: '3px 3px 0 #000000',
                  padding: '10px 20px',
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 800,
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  minHeight: '44px',
                  cursor: 'pointer',
                }}
              >
                TEST NOTIFICATION
              </button>
            </div>
          )}

          {/* Push Notification Subscription */}
          {isPushAvailable && permission === 'granted' && (
            <div style={{ marginBottom: '12px', padding: '12px', background: '#f8f8f8', border: '2px solid #000000' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: '12px', flexDirection: isMobile ? 'column' : 'row' }}>
                <div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: pushSubscribed ? '#22C55E' : '#999',
                      display: 'inline-block',
                    }} />
                    PUSH NOTIFICATIONS: <strong>{pushSubscribed ? 'ACTIVE' : 'INACTIVE'}</strong>
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#666' }}>
                    {pushSubscribed
                      ? 'You will receive reminders even when the browser is closed.'
                      : 'Enable to receive reminders even when the browser is closed.'}
                  </div>
                </div>
                <button
                  className="neo-btn"
                  onClick={pushSubscribed ? handleUnsubscribePush : handleSubscribePush}
                  disabled={pushLoading}
                  style={{
                    background: pushSubscribed ? '#FF2D9B' : '#22C55E',
                    color: '#FFFFFF',
                    padding: '8px 14px',
                    fontSize: '11px',
                    minHeight: '44px',
                    whiteSpace: 'nowrap',
                    opacity: pushLoading ? 0.6 : 1,
                  }}
                >
                  {pushLoading ? 'PROCESSING...' : pushSubscribed ? 'UNSUBSCRIBE' : 'ENABLE PUSH'}
                </button>
              </div>
            </div>
          )}

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
        )}

        {/* Archived Habits section */}
        <div style={{ padding: isMobile ? '16px' : '20px', marginBottom: '16px', background: '#FFFFFF', border: '3px solid #000000', boxShadow: '4px 4px 0px #000000', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div className="neo-icon-box" style={{ background: '#666', color: '#FFFFFF' }}>
              <Archive size={22} strokeWidth={2} />
            </div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '16px', margin: 0 }}>
              ARCHIVED HABITS
            </h2>
          </div>

          {archiveLoading ? (
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: '#666' }}>Loading...</div>
          ) : archivedHabits.length === 0 ? (
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: '#666' }}>No archived habits</div>
          ) : (
            archivedHabits.map((habit) => (
              <div
                key={habit.id}
                style={{
                  borderBottom: '2px solid #000',
                  padding: '12px',
                  display: 'flex',
                  flexWrap: isMobile ? 'wrap' : 'nowrap',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <HabitIcon iconId={habit.icon} size={20} />
                <span style={{ flex: 1, fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '14px', textTransform: 'uppercase' }}>
                  {habit.name}
                </span>
                <button
                  className="neo-btn"
                  onClick={() => handleRestoreHabit(habit.id)}
                  style={{ background: '#2563EB', color: '#FFFFFF', border: '2px solid #000', boxShadow: '2px 2px 0 #000', padding: '6px 12px', fontSize: '11px', fontFamily: "'Syne', sans-serif", fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px', minHeight: '44px' }}
                >
                  <RotateCcw size={14} /> RESTORE
                </button>
                <button
                  className="neo-btn"
                  onClick={() => handlePermanentDelete(habit.id, habit.name)}
                  style={{ background: '#FF2D9B', color: '#FFFFFF', border: '2px solid #000', boxShadow: '2px 2px 0 #000', padding: '6px 12px', fontSize: '11px', fontFamily: "'Syne', sans-serif", fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px', minHeight: '44px' }}
                >
                  <Trash2 size={14} /> DELETE FOREVER
                </button>
              </div>
            ))
          )}
        </div>

        {/* Danger zone */}
        <div style={{ padding: isMobile ? '16px' : '20px', border: '3px solid #FF2D9B', boxShadow: '4px 4px 0px #000000', background: '#FFFFFF', width: '100%', boxSizing: 'border-box' }}>
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
            style={{ background: '#FF2D9B', color: '#FFFFFF', padding: '10px 16px', fontSize: '12px', minHeight: '44px', width: isMobile ? '100%' : undefined }}
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
