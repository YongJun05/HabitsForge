/**
 * Overall stats card — shows key metrics across all habits in a 2×2 grid.
 */
import React, { useMemo } from 'react';
import type { HabitWithStreak, HabitLog } from '../../types';
import { useWindowSize } from '../../hooks/useWindowSize';

interface StatsCardProps {
  habits: HabitWithStreak[];
  allLogs: HabitLog[];
}

const StatsCard: React.FC<StatsCardProps> = ({ habits, allLogs }) => {
  const { isMobile } = useWindowSize();
  const stats = useMemo(() => {
    const totalCompleted = allLogs.length;
    const bestCurrentStreak = habits.length > 0
      ? Math.max(...habits.map((h) => h.currentStreak))
      : 0;
    const bestHabit = habits.length > 0
      ? habits.reduce((best, h) => h.currentStreak > best.currentStreak ? h : best, habits[0])
      : null;

    // Overall rate: last 30 days logs / (habits.length * 30)
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const thirtyDaysAgoStr = `${thirtyDaysAgo.getFullYear()}-${String(thirtyDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(thirtyDaysAgo.getDate()).padStart(2, '0')}`;

    const last30Logs = allLogs.filter((l) => l.log_date >= thirtyDaysAgoStr);
    const overallRate = habits.length > 0
      ? Math.round((last30Logs.length / (habits.length * 30)) * 100)
      : 0;

    return {
      totalCompleted,
      bestCurrentStreak,
      bestHabitName: bestHabit ? bestHabit.name : '—',
      overallRate: Math.min(overallRate, 100),
    };
  }, [habits, allLogs]);

  const numStyle: React.CSSProperties = {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: isMobile ? '20px' : '28px',
    fontWeight: 700,
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: isMobile ? '9px' : '11px',
    textTransform: 'uppercase',
    letterSpacing: isMobile ? '0.5px' : '2px',
    color: '#666',
    marginTop: '4px',
  };

  const boxStyle: React.CSSProperties = {
    border: '2px solid #000',
    padding: isMobile ? '12px 8px' : '16px',
    textAlign: 'center',
    minWidth: 0,
    overflow: 'hidden',
    ...(isMobile ? { width: '100%' } : { flex: 1 }),
  };

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '3px solid #000',
        boxShadow: '4px 4px 0 #000',
        padding: isMobile ? '14px' : '20px',
        minWidth: 0,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: isMobile ? '14px' : '16px',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          marginBottom: '16px',
        }}
      >
        YOUR STATS
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: isMobile ? '10px' : '12px',
        }}
      >
        <div style={boxStyle}>
          <div style={numStyle}>{stats.totalCompleted}</div>
          <div style={labelStyle}>ALL-TIME COMPLETIONS</div>
        </div>
        <div style={boxStyle}>
          <div style={numStyle}>🔥 {stats.bestCurrentStreak}</div>
          <div style={labelStyle}>BEST ACTIVE STREAK</div>
        </div>
        <div style={boxStyle}>
          <div style={numStyle}>{stats.overallRate}%</div>
          <div style={labelStyle}>OVERALL RATE</div>
        </div>
        <div style={boxStyle}>
          <div style={{ ...numStyle, fontSize: isMobile ? '13px' : '18px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
            {stats.bestHabitName}
          </div>
          <div style={labelStyle}>MOST CONSISTENT</div>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
