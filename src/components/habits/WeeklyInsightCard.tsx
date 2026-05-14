/**
 * Weekly AI insight card. Uses the useWeeklyInsight hook internally.
 * Shows a personalised AI-generated insight about the user's habit progress.
 * Only renders when the user has at least 1 habit.
 */
import React from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { useWeeklyInsight } from '../../hooks/useWeeklyInsight';
import Spinner from '../ui/Spinner';
import type { HabitWithStreak } from '../../types';

interface WeeklyInsightCardProps {
  habits: HabitWithStreak[];
}

const WeeklyInsightCard: React.FC<WeeklyInsightCardProps> = ({ habits }) => {
  const { insight, loading, error, refresh } = useWeeklyInsight(habits);

  if (habits.length === 0) return null;

  return (
    <div
      style={{
        border: '3px solid #1A1A1A',
        borderLeft: '8px solid #C9B1FF',
        boxShadow: '4px 4px 0px #1A1A1A',
        borderRadius: '8px',
        background: 'white',
        padding: '16px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <Sparkles size={18} style={{ color: '#C9B1FF' }} />
        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '16px' }}>
          Your AI Weekly Insight
        </span>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', animation: 'pulse 1.5s ease-in-out infinite' }}>
          <Spinner size="sm" />
          <span style={{ fontSize: '13px', color: '#666' }}>Analysing your habits...</span>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div>
          <p style={{ color: '#FF6B6B', fontSize: '13px', margin: '0 0 8px 0' }}>{error}</p>
          <button className="neo-btn" onClick={refresh} style={{ background: '#FFE566', padding: '4px 12px', fontSize: '12px' }}>
            Try again
          </button>
        </div>
      )}

      {/* Success state */}
      {insight && !loading && !error && (
        <p style={{ fontSize: '14px', lineHeight: '1.6', fontStyle: 'italic', color: '#333', margin: '0 0 12px 0' }}>
          {insight}
        </p>
      )}

      {/* Footer */}
      {!loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid #eee', paddingTop: '8px' }}>
          <button
            onClick={refresh}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              color: '#888',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: 0,
            }}
          >
            <RefreshCw size={12} />
            Refresh
          </button>
          <span style={{ fontSize: '11px', color: '#aaa', marginLeft: 'auto' }}>Updates weekly</span>
        </div>
      )}
    </div>
  );
};

export default WeeklyInsightCard;
