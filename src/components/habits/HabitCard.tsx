/**
 * Habit card component — the primary display unit for a habit.
 * Shows name, streak, 7-day grid, and action buttons.
 * Gold border highlight for streaks >= 7 days.
 */
import React from 'react';
import { CreditCard as Edit3, Trash2, BarChart3, Check } from 'lucide-react';
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

  // Gold border for streaks >= 7
  const goldBorder = habit.currentStreak >= 7 ? '2px solid #FFD700' : undefined;

  return (
    <div
      style={{
        border: '3px solid #1A1A1A',
        borderLeft: `8px solid ${habit.color}`,
        boxShadow: '4px 4px 0px #1A1A1A',
        borderRadius: '8px',
        background: 'white',
        padding: '16px',
        position: 'relative',
        outline: goldBorder,
        outlineOffset: '2px',
      }}
    >
      {/* Top row: emoji + name + streak badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '24px' }}>{habit.icon}</span>
        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '16px', flex: 1 }}>
          {habit.name}
        </span>
        {habit.currentStreak > 0 && (
          <div
            style={{
              background: '#FF9F43',
              color: '#1A1A1A',
              border: '2px solid #1A1A1A',
              borderRadius: '6px',
              padding: '2px 8px',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            🔥 {habit.currentStreak}
          </div>
        )}
      </div>

      {/* Description (truncated to 2 lines) */}
      {habit.description && (
        <p
          style={{
            fontSize: '13px',
            color: '#555',
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
            background: habit.isDoneToday ? '#A8E6CF' : '#FFFFFF',
            padding: '6px 14px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Check size={14} />
          {habit.isDoneToday ? 'Done Today' : 'Mark Done'}
        </button>

        <div style={{ flex: 1 }} />

        {/* Edit */}
        <button
          onClick={() => onEdit(habit)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
          title="Edit habit"
        >
          <Edit3 size={18} />
        </button>

        {/* Detail */}
        <button
          onClick={() => onViewDetail(habit.id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
          title="View details"
        >
          <BarChart3 size={18} />
        </button>

        {/* Delete */}
        <button
          onClick={handleDelete}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#FF6B6B' }}
          title="Delete habit"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

export default HabitCard;
