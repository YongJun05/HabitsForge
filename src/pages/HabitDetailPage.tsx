/**
 * Habit detail page. Shows a single habit's full stats,
 * 30-day heatmap, and recent activity log.
 * Fetches data directly from Supabase (not from useHabits hook)
 * to keep this page independent.
 */
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Flame, Trophy, BarChart2 } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import HabitHeatmap from '../components/habits/HabitHeatmap';
import Spinner from '../components/ui/Spinner';
import HabitIcon from '../components/ui/HabitIcon';
import { supabase } from '../lib/supabase';
import { calculateCurrentStreak, calculateBestStreak } from '../lib/streakUtils';
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
      <div style={{ minHeight: '100vh' }}>
        <Navbar />
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (notFound || !habit) {
    return (
      <div style={{ minHeight: '100vh' }}>
        <Navbar />
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '24px', marginBottom: '12px' }}>
            HABIT NOT FOUND
          </h2>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", marginBottom: '20px' }}>This habit may have been deleted or the URL is incorrect.</p>
          <button className="neo-btn" onClick={() => navigate('/dashboard')} style={{ background: '#ffe600', padding: '10px 20px' }}>
            BACK TO DASHBOARD
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '32px 16px' }}>
        {/* Back button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="neo-btn"
          style={{ background: '#FFFFFF', border: '3px solid #000000', boxShadow: '3px 3px 0px #000000', padding: '8px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}
        >
          <ArrowLeft size={16} />
          BACK
        </button>

        {/* Hero card */}
        <div
          style={{
            padding: '32px',
            marginBottom: '16px',
            background: habit.color,
            border: '3px solid #000000',
            boxShadow: '6px 6px 0px #000000',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              border: '3px solid #000000',
              boxShadow: '3px 3px 0px #000000',
              background: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
            }}
          >
            <HabitIcon iconId={habit.icon} size={32} />
          </div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '36px', margin: '0 0 8px', textTransform: 'uppercase' }}>
            {habit.name}
          </h1>
          {habit.description && (
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '14px', margin: 0 }}>{habit.description}</p>
          )}
        </div>

        {/* Stats boxes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
          {[
            { label: 'Current Streak', value: `${currentStreak}d`, Icon: Flame },
            { label: 'Best Streak', value: `${bestStreak}d`, Icon: Trophy },
            { label: 'Last 30 Days', value: `${last30Percent}%`, Icon: BarChart2 },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                padding: '16px',
                textAlign: 'center',
                background: '#FFFFFF',
                border: '3px solid #000000',
                boxShadow: '3px 3px 0px #000000',
              }}
            >
              <div style={{ marginBottom: '6px' }}>
                <stat.Icon size={22} strokeWidth={2} />
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: '36px' }}>{stat.value}</div>
              <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '2px' }}>{stat.label.toUpperCase()}</div>
            </div>
          ))}
        </div>

        {/* 30-day heatmap */}
        <div style={{ padding: '16px', marginBottom: '16px', background: '#FFFFFF', border: '3px solid #000000', boxShadow: '4px 4px 0px #000000' }}>
          <HabitHeatmap logs={logs} />
        </div>

        {/* Recent activity */}
        <div style={{ padding: '16px', background: '#FFFFFF', border: '3px solid #000000', boxShadow: '4px 4px 0px #000000' }}>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '16px', marginBottom: '12px' }}>
            RECENT ACTIVITY
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
                  borderBottom: '2px solid #000000',
                }}
              >
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}>{entry.date}</span>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    padding: '2px 10px',
                    border: '2px solid #000000',
                    background: entry.done ? '#22C55E' : '#f0f0f0',
                    color: entry.done ? '#FFFFFF' : '#000000',
                  }}
                >
                  {entry.done ? 'DONE' : 'MISSED'}
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
