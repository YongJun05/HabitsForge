/**
 * Best Day of Week chart — horizontal bar chart showing which
 * days of the week have the most habit completions.
 */
import React, { useMemo } from 'react';

interface BestDayChartProps {
  logs: string[]; // array of all YYYY-MM-DD log dates across ALL habits
}

const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const BestDayChart: React.FC<BestDayChartProps> = ({ logs }) => {
  const data = useMemo(() => {
    // Count logs per day of week (0=Mon, 1=Tue, ... 6=Sun)
    const counts = [0, 0, 0, 0, 0, 0, 0];
    for (const dateStr of logs) {
      const d = new Date(dateStr + 'T00:00:00');
      // JS getDay: 0=Sun, 1=Mon ... 6=Sat → remap to Mon=0 ... Sun=6
      const jsDay = d.getDay();
      const idx = jsDay === 0 ? 6 : jsDay - 1;
      counts[idx]++;
    }

    const maxCount = Math.max(...counts, 1);
    return counts.map((count, i) => ({
      day: DAY_LABELS[i],
      count,
      percent: Math.round((count / maxCount) * 100),
      isBest: count === maxCount && count > 0,
    }));
  }, [logs]);

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '3px solid #000',
        boxShadow: '4px 4px 0 #000',
        padding: '20px',
      }}
    >
      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: '14px',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          marginBottom: '16px',
        }}
      >
        BEST DAY OF WEEK
      </div>

      {data.map((row) => (
        <div
          key={row.day}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '10px',
          }}
        >
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              width: '40px',
              fontSize: '13px',
            }}
          >
            {row.day}
          </span>
          <div
            style={{
              flex: 1,
              height: '24px',
              background: '#f0f0f0',
              border: '2px solid #000',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${row.percent}%`,
                background: row.isBest ? '#FFE566' : '#22C55E',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px',
              fontWeight: 700,
              width: '40px',
              textAlign: 'right',
            }}
          >
            {row.percent}%
          </span>
        </div>
      ))}
    </div>
  );
};

export default BestDayChart;
