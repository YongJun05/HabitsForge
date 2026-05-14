/**
 * 7-day progress grid component.
 * Shows the last 7 days as small squares with day labels.
 * Filled = done, empty = missed, today = special treatment.
 */
import React from 'react';

interface HabitGridProps {
  recentLogs: string[];
  isDoneToday: boolean;
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const HabitGrid: React.FC<HabitGridProps> = ({ recentLogs, isDoneToday }) => {
  // Build the last 7 days with correct day-of-week mapping
  const days: { dateStr: string; dayLabel: string; isToday: boolean; isDone: boolean }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const dayOfWeek = d.getDay(); // 0=Sun, 1=Mon, ...
    // Map Sunday=6, Monday=0, Tuesday=1, etc. to match M T W T F S S
    const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    days.push({
      dateStr,
      dayLabel: DAY_LABELS[dayIndex],
      isToday: i === 0,
      isDone: i === 0 ? isDoneToday : recentLogs.includes(dateStr),
    });
  }

  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
      {days.map((day) => (
        <div key={day.dateStr} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '1px' }}>{day.dayLabel}</span>
          <div
            style={{
              width: '32px',
              height: '32px',
              border: '2px solid #000000',
              background: day.isToday
                ? day.isDone
                  ? '#FFE566'
                  : '#FFFFFF'
                : day.isDone
                  ? '#22C55E'
                  : '#f0f0f0',
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default HabitGrid;
