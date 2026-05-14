/**
 * Dashboard page — the main hub after login.
 * Shows today's progress, weekly AI insight, habit list, and notification banner.
 * Schedules browser notifications for habit reminders.
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Target } from 'lucide-react';
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
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Navbar />

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 16px' }}>
        {/* Notification permission banner */}
        {showNotifBanner && (
          <div
            className="neo-card"
            style={{
              padding: '12px 16px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              background: '#74b9ff',
            }}
          >
            <span style={{ fontWeight: 600, fontSize: '14px' }}>Enable reminders to stay on track</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="neo-btn"
                onClick={requestPermission}
                style={{ background: '#1A1A1A', color: 'white', padding: '6px 12px', fontSize: '12px' }}
              >
                Enable
              </button>
              <button
                onClick={() => {
                  setNotifDismissed(true);
                  localStorage.setItem('habitforge_notif_dismissed', 'true');
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Progress bar section */}
        <div className="neo-card" style={{ padding: '16px', marginBottom: '16px' }}>
          <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>
            Today's Progress — {todayLabel}
          </div>
          <div style={{ fontSize: '13px', color: '#555', marginBottom: '8px' }}>
            {doneCount} / {totalCount} habits done
          </div>
          {/* Progress bar */}
          <div
            style={{
              height: '16px',
              background: '#f0f0f0',
              borderRadius: '8px',
              border: '2px solid #1A1A1A',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progressPercent}%`,
                background: progressPercent === 100 ? '#A8E6CF' : '#FFE566',
                borderRadius: '6px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          {progressPercent === 100 && totalCount > 0 && (
            <p style={{ fontWeight: 700, fontSize: '14px', color: '#2d8a4e', margin: '8px 0 0' }}>
              All habits done for today!
            </p>
          )}
        </div>

        {/* Weekly insight */}
        {!loading && <WeeklyInsightCard habits={habits} />}

        {/* Add habit button */}
        <button
          className="neo-btn"
          onClick={handleAddNew}
          style={{
            background: '#FFE566',
            padding: '14px',
            fontSize: '15px',
            width: '100%',
            marginTop: '16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <Plus size={18} />
          Add New Habit
        </button>

        {/* Error state */}
        {error && (
          <p style={{ color: '#FF6B6B', fontSize: '14px', textAlign: 'center', marginBottom: '16px' }}>{error}</p>
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
            <div style={{ fontSize: '64px', marginBottom: '16px' }}><Target /></div>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '20px', marginBottom: '8px' }}>
              No habits yet!
            </h3>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
              Start building your routine by adding your first habit.
            </p>
            <button
              className="neo-btn"
              onClick={handleAddNew}
              style={{ background: '#FFE566', padding: '12px 24px', fontSize: '14px' }}
            >
              Add Your First Habit
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
