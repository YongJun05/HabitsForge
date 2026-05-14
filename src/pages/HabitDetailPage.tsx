/**
 * Habit detail page. Shows a single habit's full stats,
 * 30-day heatmap, and recent activity log.
 * Fetches data directly from Supabase (not from useHabits hook)
 * to keep this page independent.
 */
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import HabitHeatmap from '../components/habits/HabitHeatmap';
import Spinner from '../components/ui/Spinner';
import { supabase } from '../lib/supabase';
import { calculateCurrentStreak, calculateBestStreak, getTodayString } from '../lib/streakUtils';
import type { Habit } from '../types';

const HabitDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [habit, setHabit] = useState<Habit | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    document.title = 'HabitForge — Habit Detail';
  }, []);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      setLoading(true);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate('/login'); return; }

        // Fetch habit
        const { data: habitData, error: habitError } = await supabase
          .from('habits')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (habitError || !habitData) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setHabit(habitData);

        // Fetch all logs for this habit
        const { data: logData } = await supabase
          .from('habit_logs')
          .select('log_date')
          .eq('habit_id', id)
          .order('log_date', { ascending: false });

        const logDates = (logData ?? []).map((l: { log_date: string }) => l.log_date);
        setLogs(logDates);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id, navigate]);

  const currentStreak = useMemo(() => calculateCurrentStreak(logs), [logs]);
  const bestStreak = useMemo(() => calculateBestStreak(logs), [logs]);
  const today = getTodayString();
  const isDoneToday = logs.includes(today);

  // Last 30 days completion percentage
  const last30Count = useMemo(() => {
    let count = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      if (logs.includes(`${year}-${month}-${day}`)) count++;
    }
    return count;
  }, [logs]);

  const last30Percent = Math.round((last30Count / 30) * 100);

  // Recent activity (last 14 entries)
  const recentActivity = useMemo(() => {
    const entries: { date: string; done: boolean }[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      entries.push({ date: dateStr, done: logs.includes(dateStr) });
    }
    return entries;
  }, [logs]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
        <Navbar />
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (notFound || !habit) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
        <Navbar />
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '24px', marginBottom: '12px' }}>
            Habit not found
          </h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>This habit may have been deleted or the URL is incorrect.</p>
          <button className="neo-btn" onClick={() => navigate('/dashboard')} style={{ background: '#FFE566', padding: '10px 20px' }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Navbar />

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 16px' }}>
        {/* Back button */}
        <button
          onClick={() => navigate('/dashboard')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', fontWeight: 600, fontSize: '14px' }}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        {/* Hero card */}
        <div
          className="neo-card"
          style={{
            padding: '24px',
            marginBottom: '16px',
            background: habit.color,
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>{habit.icon}</div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '24px', margin: '0 0 4px' }}>
            {habit.name}
          </h1>
          {habit.description && (
            <p style={{ fontSize: '14px', color: '#333', margin: 0 }}>{habit.description}</p>
          )}
          {isDoneToday && (
            <div
              style={{
                display: 'inline-block',
                marginTop: '8px',
                background: '#A8E6CF',
                border: '2px solid #1A1A1A',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              Done today
            </div>
          )}
        </div>

        {/* Stats boxes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
          {[
            { label: 'Current Streak', value: `${currentStreak}d`, icon: '🔥' },
            { label: 'Best Streak', value: `${bestStreak}d`, icon: '🏆' },
            { label: 'Last 30 Days', value: `${last30Percent}%`, icon: '📊' },
          ].map((stat) => (
            <div key={stat.label} className="neo-card" style={{ padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>{stat.icon}</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '20px' }}>{stat.value}</div>
              <div style={{ fontSize: '11px', color: '#666', fontWeight: 600 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* 30-day heatmap */}
        <div className="neo-card" style={{ padding: '16px', marginBottom: '16px' }}>
          <HabitHeatmap logs={logs} />
        </div>

        {/* Recent activity */}
        <div className="neo-card" style={{ padding: '16px' }}>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '16px', marginBottom: '12px' }}>
            Recent Activity
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {recentActivity.map((entry) => (
              <div
                key={entry.date}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '6px 0',
                  borderBottom: '1px solid #f0f0f0',
                }}
              >
                <span style={{ fontSize: '13px' }}>{entry.date}</span>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid #1A1A1A',
                    background: entry.done ? '#A8E6CF' : '#f0f0f0',
                  }}
                >
                  {entry.done ? 'Done' : 'Missed'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HabitDetailPage;
