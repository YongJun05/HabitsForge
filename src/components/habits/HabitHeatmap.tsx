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

  // Calculate completion percentage for last 30 days
  const doneCount = cells.filter((c) => c.isDone).length;
  const percentage = Math.round((doneCount / 30) * 100);

  return (
    <div>
      <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '16px', marginBottom: '8px' }}>
        30-DAY HISTORY
      </div>

      {/* 5x6 grid = 30 cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 28px)', gap: '4px' }}>
        {cells.map((cell) => (
          <div
            key={cell.dateStr}
            title={`${cell.dateStr}: ${cell.isDone ? 'Done' : 'Missed'}`}
            style={{
              width: '28px',
              height: '28px',
              border: '2px solid #000000',
              background: cell.isDone ? '#22C55E' : '#f0f0f0',
            }}
          />
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '10px', fontSize: '12px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '12px', height: '12px', border: '2px solid #000000', background: '#f0f0f0' }} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>MISSED</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '12px', height: '12px', border: '2px solid #000000', background: '#22C55E' }} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>DONE</span>
        </div>
        <span style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace", fontWeight: 800 }}>
          {percentage}% LAST 30 DAYS
        </span>
      </div>
    </div>
  );
};

export default HabitHeatmap;
