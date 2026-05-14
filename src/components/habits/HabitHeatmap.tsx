/**
 * 30-day heatmap component.
 * Renders a 5x6 grid of cells showing habit completion over the last 30 days.
 * Done cells are green, missed cells are grey.
 */
import React from 'react';

interface HabitHeatmapProps {
  logs: string[];
}

const HabitHeatmap: React.FC<HabitHeatmapProps> = ({ logs }) => {
  const logSet = new Set(logs);
  const today = new Date();

  // Build last 30 days
  const cells: { dateStr: string; isDone: boolean }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    cells.push({ dateStr, isDone: logSet.has(dateStr) });
  }

  // Current month label
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const monthLabel = `${monthNames[today.getMonth()]} ${today.getFullYear()}`;

  // Calculate completion percentage for last 30 days
  const doneCount = cells.filter((c) => c.isDone).length;
  const percentage = Math.round((doneCount / 30) * 100);

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>{monthLabel}</div>

      {/* 5x6 grid = 30 cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 24px)', gap: '3px' }}>
        {cells.map((cell) => (
          <div
            key={cell.dateStr}
            title={`${cell.dateStr}: ${cell.isDone ? 'Done' : 'Missed'}`}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '3px',
              border: '2px solid #1A1A1A',
              background: cell.isDone ? '#A8E6CF' : '#f0f0f0',
            }}
          />
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '12px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '2px', border: '1px solid #1A1A1A', background: '#f0f0f0' }} />
          <span>Missed</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '2px', border: '1px solid #1A1A1A', background: '#A8E6CF' }} />
          <span>Done</span>
        </div>
        <span style={{ marginLeft: 'auto', fontWeight: 600 }}>{percentage}% last 30 days</span>
      </div>
    </div>
  );
};

export default HabitHeatmap;
