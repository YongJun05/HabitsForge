/**
 * Dashboard page — the main hub after login.
 * Shows today's progress, weekly AI insight, habit list, and notification banner.
 * Schedules browser notifications for habit reminders.
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Plus, Target, Trophy } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import HabitCard from '../components/habits/HabitCard';
import HabitFormModal from '../components/habits/HabitFormModal';
import WeeklyInsightCard from '../components/habits/WeeklyInsightCard';
import Toast from '../components/ui/Toast';
import { supabase } from '../lib/supabase';
import { useHabits } from '../hooks/useHabits';
import { useNotifications } from '../hooks/useNotifications';
import type { Habit, HabitWithStreak } from '../types';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { habits, loading, error, createHabit, updateHabit, deleteHabit, toggleDone } = useHabits();
  const { permission, requestPermission, isSupported, scheduleReminders } = useNotifications();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitWithStreak | undefined>(undefined);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [notifDismissed, setNotifDismissed] = useState(() => localStorage.getItem('habitforge_notif_dismissed') === 'true');

  useEffect(() => {
    document.title = 'HabitForge — Dashboard';
  }, []);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (isMounted && !session) {
        navigate('/login', { replace: true });
      }
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // Schedule reminders when habits change
  useEffect(() => {
    if (habits.length > 0) {
      scheduleReminders(habits);
    }
  }, [habits, scheduleReminders]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  }, []);

  const handleSave = async (data: Omit<Habit, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingHabit) {
        await updateHabit(editingHabit.id, data);
        showToast('Habit updated!');
      } else {
        await createHabit(data);
        showToast('Habit created!');
      }
      setModalOpen(false);
      setEditingHabit(undefined);
    } catch {
      showToast('Something went wrong', 'error');
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const habit = habits.find((h) => h.id === id);
      await toggleDone(id);
      showToast(habit?.isDoneToday ? 'Habit unchecked' : 'Habit checked off!');
    } catch {
      showToast('Failed to toggle', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteHabit(id);
      showToast('Habit deleted');
    } catch {
      showToast('Failed to delete', 'error');
    }
  };

  const handleEdit = (habit: HabitWithStreak) => {
    setEditingHabit(habit);
    setModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingHabit(undefined);
    setModalOpen(true);
  };

  // Today's progress
  const doneCount = habits.filter((h) => h.isDoneToday).length;
  const totalCount = habits.length;
  const progressPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  // Format today's date
  const today = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const todayLabel = `${dayNames[today.getDay()]}, ${monthNames[today.getMonth()]} ${today.getDate()}`;

  const showNotifBanner = isSupported && permission === 'default' && !notifDismissed;

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />

      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '32px 16px' }}>
        {/* Notification permission banner */}
        {showNotifBanner && (
          <div
            style={{
              background: '#ffe600',
              border: '3px solid #000000',
              boxShadow: '4px 4px 0px #000000',
              padding: '14px 16px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <span style={{ fontWeight: 800, fontSize: '12px', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Bell size={18} strokeWidth={2} />
              ENABLE REMINDERS TO STAY ON TRACK
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="neo-btn"
                onClick={requestPermission}
                style={{ background: '#000000', color: '#FFFFFF', padding: '8px 12px', fontSize: '12px' }}
              >
                Enable
              </button>
              <button
                className="neo-btn"
                onClick={() => {
                  setNotifDismissed(true);
                  localStorage.setItem('habitforge_notif_dismissed', 'true');
                }}
                style={{ background: '#FFFFFF', color: '#000000', padding: '8px 12px', fontSize: '12px', letterSpacing: '2px' }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Progress bar section */}
        <div className="neo-card" style={{ padding: '24px', marginBottom: '16px' }}>
          <div style={{ fontWeight: 800, fontSize: '12px', letterSpacing: '2px', color: '#666', marginBottom: '6px' }}>
            TODAY'S PROGRESS
          </div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '24px', marginBottom: '6px' }}>
            {todayLabel.toUpperCase()}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '18px', marginBottom: '10px' }}>
            {doneCount} / {totalCount} HABITS DONE
          </div>
          {/* Progress bar */}
          <div
            style={{
              height: '24px',
              background: '#f0f0f0',
              border: '3px solid #000000',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progressPercent}%`,
                background: '#22C55E',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          {progressPercent === 100 && totalCount > 0 && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#000000',
                color: '#FFFFFF',
                padding: '6px 10px',
                marginTop: '10px',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px',
                fontWeight: 800,
              }}
            >
              <Trophy size={16} strokeWidth={2} /> ALL DONE TODAY!
            </div>
          )}
        </div>

        {/* Weekly insight */}
        {!loading && <WeeklyInsightCard habits={habits} />}

        {/* Add habit button */}
        <button
          className="neo-btn"
          onClick={handleAddNew}
          style={{
            background: '#ffe600',
            padding: '16px',
            fontSize: '18px',
            width: '100%',
            marginTop: '16px',
            marginBottom: '16px',
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <Plus size={20} strokeWidth={2} />
          ADD NEW HABIT
        </button>

        {/* Error state */}
        {error && (
          <p style={{ color: '#FF2D9B', fontSize: '14px', textAlign: 'center', marginBottom: '16px', fontFamily: "'JetBrains Mono', monospace" }}>{error}</p>
        )}

        {/* Loading state */}
        {loading && habits.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading habits...</div>
        )}

        {/* Habit list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggle={handleToggle}
              onViewDetail={(id) => navigate(`/habit/${id}`)}
            />
          ))}
        </div>

        {/* Empty state */}
        {!loading && habits.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div
              style={{
                width: '80px',
                height: '80px',
                border: '3px solid #000000',
                boxShadow: '4px 4px 0px #000000',
                background: '#ffe600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <Target size={36} strokeWidth={2} />
            </div>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '28px', marginBottom: '8px' }}>
              NO HABITS YET
            </h3>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '14px', marginBottom: '20px' }}>
              Add your first habit and start your streak.
            </p>
            <button
              className="neo-btn"
              onClick={handleAddNew}
              style={{ background: '#ffe600', padding: '12px 24px', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={20} strokeWidth={2} />
              ADD YOUR FIRST HABIT
            </button>
          </div>
        )}
      </div>

      {/* Habit form modal */}
      <HabitFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingHabit(undefined); }}
        initialData={editingHabit}
        onSave={handleSave}
      />

      {/* Toast */}
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

export default DashboardPage;
