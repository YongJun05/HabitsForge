/**
 * Best Day of Week chart — horizontal bar chart showing actual
 * completion rates per day of the week over the last 28 days.
 *
 * Each bar shows: completions / possible completions as a percentage.
 * "Possible" accounts for when each habit was created, so new habits
 * don't deflate the rate unfairly.
 */
import React, { useMemo } from 'react';
import type { HabitWithStreak } from '../../types';
import { useWindowSize } from '../../hooks/useWindowSize';

interface BestDayChartProps {
  habits: HabitWithStreak[];
}

const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

/** Format a Date to YYYY-MM-DD in local time */
function toDateStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const BestDayChart: React.FC<BestDayChartProps> = ({ habits }) => {
  const { isMobile } = useWindowSize();

  const data = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Track completions and possible per day of week (Mon=0 ... Sun=6)
    const completions = [0, 0, 0, 0, 0, 0, 0];
    const possible = [0, 0, 0, 0, 0, 0, 0];

    // Pre-build log sets per habit for O(1) lookups
    const habitLogSets = habits.map((h) => new Set(h.allLogDates));

    // Look at the last 28 days (4 full weeks — each day appears exactly 4 times)
    for (let i = 27; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const jsDay = d.getDay(); // 0=Sun, 1=Mon ... 6=Sat
      const idx = jsDay === 0 ? 6 : jsDay - 1; // Remap to Mon=0 ... Sun=6
      const dateStr = toDateStr(d);

      habits.forEach((habit, hIdx) => {
        const created = new Date(habit.created_at);
        created.setHours(0, 0, 0, 0);
        if (created <= d) {
          possible[idx]++;
          if (habitLogSets[hIdx].has(dateStr)) {
            completions[idx]++;
          }
        }
      });
    }

    const rates = completions.map((count, i) => {
      const rate =
        possible[i] > 0 ? Math.round((count / possible[i]) * 100) : 0;
      return { day: DAY_LABELS[i], rate, count, possible: possible[i] };
    });

    const maxRate = Math.max(...rates.map((r) => r.rate), 1);

    return rates.map((r) => ({
      ...r,
      barPercent: Math.round((r.rate / maxRate) * 100), // relative scaling for bars
      isBest: r.rate === maxRate && r.rate > 0,
    }));
  }, [habits]);

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '3px solid #000',
        boxShadow: '4px 4px 0 #000',
        padding: isMobile ? '16px' : '20px',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: '14px',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          marginBottom: '4px',
        }}
      >
        BEST DAY OF WEEK
      </div>
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '11px',
          color: '#999',
          marginBottom: '16px',
        }}
      >
        COMPLETION RATE · LAST 28 DAYS
      </div>

      {data.map((row) => (
        <div
          key={row.day}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '8px' : '12px',
            marginBottom: '10px',
          }}
        >
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              width: isMobile ? '34px' : '40px',
              fontSize: isMobile ? '11px' : '13px',
            }}
          >
            {row.day}
          </span>
          <div
            style={{
              flex: 1,
              height: isMobile ? '20px' : '24px',
              background: '#f0f0f0',
              border: '2px solid #000',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${row.barPercent}%`,
                background: row.isBest ? '#FFE566' : '#22C55E',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: isMobile ? '11px' : '12px',
              fontWeight: 700,
              width: '40px',
              textAlign: 'right',
            }}
          >
            {row.rate}%
          </span>
        </div>
      ))}
    </div>
  );
};

export default BestDayChart;
