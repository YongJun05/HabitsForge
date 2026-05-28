/**
 * Overall stats card — shows key metrics across all habits in a 2×2 grid.
 *
 * Metrics:
 * - This Week: completions / possible this week (Mon → today), creation-aware
 * - Best All-Time Streak: highest best streak across all habits
 * - Last 7 Days Rate: creation-aware completion percentage
 * - Most Consistent: habit with highest 30-day completion rate
 */
import React, { useMemo } from 'react';
import type { HabitWithStreak } from '../../types';
import { useWindowSize } from '../../hooks/useWindowSize';

interface StatsCardProps {
  habits: HabitWithStreak[];
}

/** Format a Date to YYYY-MM-DD in local time */
function toDateStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const StatsCard: React.FC<StatsCardProps> = ({ habits }) => {
  const { isMobile } = useWindowSize();

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Pre-build log sets per habit for O(1) lookups
    const habitLogSets = habits.map((h) => new Set(h.allLogDates));

    // ── This Week (Mon → today) ──
    const jsDay = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const daysSinceMonday = jsDay === 0 ? 6 : jsDay - 1;

    let weekCompletions = 0;
    let weekPossible = 0;

    for (let i = daysSinceMonday; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = toDateStr(d);

      habits.forEach((habit, idx) => {
        const created = new Date(habit.created_at);
        created.setHours(0, 0, 0, 0);
        if (created <= d) {
          weekPossible++;
          if (habitLogSets[idx].has(dateStr)) {
            weekCompletions++;
          }
        }
      });
    }

    // ── Best All-Time Streak ──
    const bestAllTimeStreak =
      habits.length > 0 ? Math.max(...habits.map((h) => h.bestStreak)) : 0;

    // ── Last 7 Days Rate (creation-aware) ──
    let last7Completions = 0;
    let last7Possible = 0;

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = toDateStr(d);

      habits.forEach((habit, idx) => {
        const created = new Date(habit.created_at);
        created.setHours(0, 0, 0, 0);
        if (created <= d) {
          last7Possible++;
          if (habitLogSets[idx].has(dateStr)) {
            last7Completions++;
          }
        }
      });
    }

    const last7Rate =
      last7Possible > 0
        ? Math.round((last7Completions / last7Possible) * 100)
        : 0;

    // ── Most Consistent (30-day completion rate per habit) ──
    let mostConsistentName = '—';
    let bestRate = -1;

    habits.forEach((habit, idx) => {
      const created = new Date(habit.created_at);
      created.setHours(0, 0, 0, 0);

      let possible = 0;
      let completed = 0;

      for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        if (created <= d) {
          possible++;
          const dateStr = toDateStr(d);
          if (habitLogSets[idx].has(dateStr)) {
            completed++;
          }
        }
      }

      const rate = possible > 0 ? completed / possible : 0;
      if (rate > bestRate || (rate === bestRate && completed > 0)) {
        bestRate = rate;
        mostConsistentName = habit.name;
      }
    });

    const mostConsistentRate =
      bestRate >= 0 ? Math.round(bestRate * 100) : 0;

    return {
      weekCompletions,
      weekPossible,
      bestAllTimeStreak,
      last7Rate,
      mostConsistentName,
      mostConsistentRate,
    };
  }, [habits]);

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
        {/* This Week */}
        <div style={boxStyle}>
          <div style={numStyle}>
            {stats.weekCompletions}
            <span
              style={{
                fontSize: isMobile ? '14px' : '18px',
                color: '#999',
              }}
            >
              {' '}
              / {stats.weekPossible}
            </span>
          </div>
          <div style={labelStyle}>THIS WEEK</div>
        </div>

        {/* Best All-Time Streak */}
        <div style={boxStyle}>
          <div style={numStyle}>🏆 {stats.bestAllTimeStreak}</div>
          <div style={labelStyle}>BEST ALL-TIME STREAK</div>
        </div>

        {/* Last 7 Days Rate */}
        <div style={boxStyle}>
          <div style={numStyle}>{stats.last7Rate}%</div>
          <div style={labelStyle}>LAST 7 DAYS</div>
        </div>

        {/* Most Consistent Habit */}
        <div style={boxStyle}>
          <div
            style={{
              ...numStyle,
              fontSize: isMobile ? '13px' : '16px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '100%',
            }}
          >
            {stats.mostConsistentName}
          </div>
          <div style={labelStyle}>
            MOST CONSISTENT
            {stats.mostConsistentRate > 0 ? ` · ${stats.mostConsistentRate}%` : ''}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
