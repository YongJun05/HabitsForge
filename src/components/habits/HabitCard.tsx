/**
 * Habit card component — the primary display unit for a habit.
 * Shows name, streak, 7-day grid, and action buttons.
 * Gold border highlight for streaks >= 7 days.
 */
import React from 'react';
import { CreditCard as Edit3, Trash2, BarChart3 } from 'lucide-react';
import type { HabitWithStreak } from '../../types';
import HabitGrid from './HabitGrid';

interface HabitCardProps {
  habit: HabitWithStreak;
  onEdit: (habit: HabitWithStreak) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onViewDetail: (id: string) => void;
}

const HabitCard: React.FC<HabitCardProps> = ({ habit, onEdit, onDelete, onToggle, onViewDetail }) => {
  const handleDelete = () => {
    if (window.confirm(`Delete "${habit.name}"? This will also remove all its logs.`)) {
      onDelete(habit.id);
    }
  };

  const streakHighlight = habit.currentStreak >= 7 ? '6px solid #FFE566' : undefined;

  return (
    <div
      style={{
        border: '3px solid #000000',
        boxShadow: '4px 4px 0px #000000',
        background: '#FFFFFF',
        padding: '20px',
        position: 'relative',
        borderLeft: streakHighlight ?? '3px solid #000000',
      }}
    >
      {/* Top row: emoji + name + streak badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
        <div className="neo-icon-box" style={{ background: habit.color }}>{habit.icon}</div>
        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '18px', flex: 1, textTransform: 'uppercase' }}>
          {habit.name}
        </span>
        {habit.currentStreak > 0 && (
          <div
            style={{
              background: '#FFE566',
              color: '#000000',
              border: '2px solid #000000',
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: 800,
              fontFamily: "'JetBrains Mono', monospace",
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            🔥 {habit.currentStreak} DAY STREAK
          </div>
        )}
      </div>

      {/* Description (truncated to 2 lines) */}
      {habit.description && (
        <p
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '13px',
            color: '#666',
            margin: '0 0 8px 0',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {habit.description}
        </p>
      )}

      {/* 7-day grid */}
      <div style={{ marginBottom: '12px' }}>
        <HabitGrid recentLogs={habit.recentLogs} isDoneToday={habit.isDoneToday} />
      </div>

      {/* Action row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Toggle Done button */}
        <button
          onClick={() => onToggle(habit.id)}
          className="neo-btn"
          style={{
            background: habit.isDoneToday ? '#22C55E' : '#FFFFFF',
            color: habit.isDoneToday ? '#FFFFFF' : '#000000',
            border: '2px solid #000000',
            boxShadow: '2px 2px 0px #000000',
            padding: '8px 16px',
            fontSize: '12px',
          }}
        >
          {habit.isDoneToday ? '✓ DONE TODAY' : 'MARK DONE'}
        </button>

        <div style={{ flex: 1 }} />

        {/* Edit */}
        <button
          className="neo-btn"
          onClick={() => onEdit(habit)}
          style={{
            background: '#FFE566',
            border: '2px solid #000000',
            boxShadow: '2px 2px 0px #000000',
            padding: '6px 8px',
          }}
          title="Edit habit"
        >
          <Edit3 size={16} />
        </button>

        {/* Detail */}
        <button
          className="neo-btn"
          onClick={() => onViewDetail(habit.id)}
          style={{
            background: '#2563EB',
            color: '#FFFFFF',
            border: '2px solid #000000',
            boxShadow: '2px 2px 0px #000000',
            padding: '6px 8px',
          }}
          title="View details"
        >
          <BarChart3 size={16} />
        </button>

        {/* Delete */}
        <button
          className="neo-btn"
          onClick={handleDelete}
          style={{
            background: '#FF2D9B',
            color: '#FFFFFF',
            border: '2px solid #000000',
            boxShadow: '2px 2px 0px #000000',
            padding: '6px 8px',
          }}
          title="Delete habit"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default HabitCard;
