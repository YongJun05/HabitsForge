/**
 * Habit card component — the primary display unit for a habit.
 * Shows name, streak, 7-day grid, milestone badge, freeze button,
 * inline note panel, archive button, and drag handle.
 * Gold border highlight for streaks >= 7 days.
 */
import React, { useState } from 'react';
import { Pencil, Archive, BarChart2, Check, Flame, GripVertical } from 'lucide-react';
import type { HabitWithStreak } from '../../types';
import { getCurrentWeekString, getMilestoneBadge } from '../../lib/streakUtils';
import HabitGrid from './HabitGrid';
import HabitIcon from '../ui/HabitIcon';
import { useWindowSize } from '../../hooks/useWindowSize';

interface HabitCardProps {
  habit: HabitWithStreak;
  onEdit: (habit: HabitWithStreak) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, note?: string | null) => void;
  onViewDetail: (id: string) => void;
  onFreeze?: (id: string) => void;
  // Drag and drop
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, id: string) => void;
  isDragOver?: boolean;
  isDragging?: boolean;
}

const HabitCard: React.FC<HabitCardProps> = ({
  habit, onEdit, onDelete, onToggle, onViewDetail, onFreeze,
  draggable, onDragStart, onDragOver, onDrop, isDragOver, isDragging,
}) => {
  const { isMobile } = useWindowSize();
  const [showNotePanel, setShowNotePanel] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);

  const handleArchive = () => {
    if (window.confirm(`Archive "${habit.name}"? You can restore it from Settings.`)) {
      onDelete(habit.id);
    }
  };

  const handleMarkDone = () => {
    if (habit.isDoneToday) {
      // Undo — no note panel needed
      onToggle(habit.id);
    } else {
      // Show note panel instead of immediately toggling
      setShowNotePanel(true);
      setNoteText('');
    }
  };

  const handleSaveWithNote = async () => {
    setNoteLoading(true);
    try {
      await onToggle(habit.id, noteText.trim() || null);
    } finally {
      setNoteLoading(false);
      setShowNotePanel(false);
      setNoteText('');
    }
  };

  const handleSkipNote = async () => {
    setNoteLoading(true);
    try {
      await onToggle(habit.id, null);
    } finally {
      setNoteLoading(false);
      setShowNotePanel(false);
      setNoteText('');
    }
  };

  const handleFreeze = () => {
    if (window.confirm(`Use your weekly streak freeze for "${habit.name}"?`)) {
      onFreeze?.(habit.id);
    }
  };

  const streakHighlight = habit.currentStreak >= 7 ? '6px solid #ffe600' : undefined;
  const currentWeek = getCurrentWeekString();
  const isFreezeUsedThisWeek = habit.freeze_used_week === currentWeek;
  const showFreezeButton = !isFreezeUsedThisWeek && !habit.isDoneToday && habit.currentStreak > 0;
  const milestone = getMilestoneBadge(habit.bestStreak);

  return (
    <div
      draggable={draggable}
      onDragStart={draggable && onDragStart ? (e) => onDragStart(e, habit.id) : undefined}
      onDragOver={onDragOver}
      onDrop={onDrop ? (e) => onDrop(e, habit.id) : undefined}
      style={{
        border: '3px solid #000000',
        boxShadow: '4px 4px 0px #000000',
        background: '#FFFFFF',
        padding: isMobile ? '16px' : '20px',
        position: 'relative',
        borderLeft: streakHighlight ?? '3px solid #000000',
        opacity: isDragging ? 0.5 : 1,
        borderTop: isDragOver ? '3px dashed #000' : '3px solid #000000',
        transition: 'opacity 0.15s ease',
      }}
    >
      {/* Top row: drag handle + icon + name + streak badge + freeze */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px', marginBottom: '10px', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
        {draggable && (
          <div style={{ color: '#999', cursor: 'grab', padding: '0 8px 0 0', display: 'flex', alignItems: 'center' }}>
            <GripVertical size={18} />
          </div>
        )}
        <div className="neo-icon-box" style={{ background: habit.color }}>
          <HabitIcon iconId={habit.icon} />
        </div>
        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: isMobile ? '15px' : '18px', flex: 1, textTransform: 'uppercase', minWidth: isMobile ? '140px' : undefined }}>
          {habit.name}
        </span>
        {habit.currentStreak > 0 && (
          <div
            style={{
              background: '#ffe600',
              color: '#000000',
              border: '2px solid #000000',
              padding: isMobile ? '3px 8px' : '4px 12px',
              fontSize: isMobile ? '10px' : '12px',
              fontWeight: 800,
              fontFamily: "'JetBrains Mono', monospace",
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {isFreezeUsedThisWeek ? '🧊' : <Flame size={16} strokeWidth={2} />} {habit.currentStreak} DAY STREAK
          </div>
        )}
        {/* Freeze button */}
        {showFreezeButton && onFreeze && (
          <button
            onClick={handleFreeze}
            style={{
              border: '2px solid #000',
              boxShadow: '2px 2px 0 #000',
              background: 'white',
              padding: isMobile ? '4px 8px' : '4px 10px',
              fontSize: isMobile ? '10px' : '12px',
              minHeight: '44px',
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            🧊 FREEZE
          </button>
        )}
        {isFreezeUsedThisWeek && (
          <span style={{ fontSize: '14px', opacity: 0.4 }} title="Freeze used this week">🧊</span>
        )}
      </div>

      {/* Milestone badge */}
      {milestone && (
        <div style={{ marginBottom: '8px' }}>
          <span
            style={{
              background: '#000',
              color: 'white',
              border: '2px solid #000',
              padding: '2px 10px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              display: 'inline-block',
            }}
          >
            {milestone.emoji} {milestone.label}
          </span>
        </div>
      )}

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
          onClick={handleMarkDone}
          className="neo-btn"
          style={{
            background: habit.isDoneToday ? '#22C55E' : '#FFFFFF',
            color: habit.isDoneToday ? '#FFFFFF' : '#000000',
            border: '2px solid #000000',
            boxShadow: '2px 2px 0px #000000',
            padding: '8px 16px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flex: isMobile ? 1 : undefined,
            justifyContent: 'center',
            minHeight: '44px',
          }}
        >
          {habit.isDoneToday ? (
            <>
              <Check size={16} strokeWidth={2} /> DONE TODAY
            </>
          ) : (
            'MARK DONE'
          )}
        </button>

        <div style={{ flex: 1 }} />

        {/* Edit */}
        <button
          className="neo-btn"
          onClick={() => onEdit(habit)}
          style={{
            background: '#ffe600',
            border: '2px solid #000000',
            boxShadow: '2px 2px 0px #000000',
            padding: isMobile ? 0 : '6px 8px',
            width: isMobile ? '32px' : undefined,
            height: isMobile ? '32px' : undefined,
            minWidth: isMobile ? '44px' : '44px',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Edit habit"
        >
          <Pencil size={16} />
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
            padding: isMobile ? 0 : '6px 8px',
            width: isMobile ? '32px' : undefined,
            height: isMobile ? '32px' : undefined,
            minWidth: '44px',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="View details"
        >
          <BarChart2 size={16} />
        </button>

        {/* Archive */}
        <button
          className="neo-btn"
          onClick={handleArchive}
          style={{
            background: '#FF2D9B',
            color: '#FFFFFF',
            border: '2px solid #000000',
            boxShadow: '2px 2px 0px #000000',
            padding: isMobile ? 0 : '6px 8px',
            width: isMobile ? '32px' : undefined,
            height: isMobile ? '32px' : undefined,
            minWidth: '44px',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Archive habit"
        >
          <Archive size={16} />
        </button>
      </div>

      {/* Inline Note Panel — shown when MARK DONE is clicked */}
      {showNotePanel && (
        <div style={{ marginTop: '12px', borderTop: '2px solid #000', paddingTop: '12px' }}>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            maxLength={150}
            placeholder="Add a note... (optional)"
            style={{
              width: '100%',
              border: '2px solid #000',
              padding: '8px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '13px',
              borderRadius: '0',
              resize: 'vertical',
              minHeight: '60px',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button
              className="neo-btn"
              onClick={handleSaveWithNote}
              disabled={noteLoading}
              style={{
                background: '#22C55E',
                color: 'white',
                border: '2px solid #000',
                boxShadow: '2px 2px 0 #000',
                padding: '8px 16px',
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: '12px',
                textTransform: 'uppercase',
              }}
            >
              {noteLoading ? 'SAVING...' : 'SAVE ✓'}
            </button>
            <button
              className="neo-btn"
              onClick={handleSkipNote}
              disabled={noteLoading}
              style={{
                background: 'white',
                border: '2px solid #000',
                boxShadow: '2px 2px 0 #000',
                padding: '8px 16px',
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: '12px',
                textTransform: 'uppercase',
              }}
            >
              SKIP →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HabitCard;
