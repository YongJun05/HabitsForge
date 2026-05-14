/**
 * Weekly AI insight card. Uses the useWeeklyInsight hook internally.
 * Shows a personalised AI-generated insight about the user's habit progress.
 * Only renders when the user has at least 1 habit.
 */
import React from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
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
        border: '3px solid #000000',
        borderLeft: '8px solid #FF2D9B',
        boxShadow: '4px 4px 0px #000000',
        background: '#FFFFFF',
        padding: '20px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <div className="neo-icon-box" style={{ background: '#FF2D9B' }}>
          <Sparkles size={22} strokeWidth={2} />
        </div>
        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '16px' }}>
          AI WEEKLY INSIGHT
        </span>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Spinner size="sm" />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}>ANALYSING YOUR HABITS...</span>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div>
          <p style={{ color: '#FF2D9B', fontSize: '13px', margin: '0 0 8px 0', fontFamily: "'JetBrains Mono', monospace" }}>{error}</p>
          <button
            className="neo-btn"
            onClick={refresh}
            style={{ background: '#ffe600', padding: '6px 12px', fontSize: '12px' }}
          >
            TRY AGAIN
          </button>
        </div>
      )}

      {/* Success state */}
      {insight && !loading && !error && (
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '14px', lineHeight: 1.8, margin: '0 0 12px 0' }}>
          {insight}
        </p>
      )}

      {/* Footer */}
      {!loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderTop: '2px solid #000000', paddingTop: '8px' }}>
          <button
            className="neo-btn"
            onClick={refresh}
            style={{
              background: '#FFFFFF',
              border: '2px solid #000000',
              boxShadow: '2px 2px 0px #000000',
              padding: '4px 10px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw size={16} />
            REFRESH
          </button>
        </div>
      )}
    </div>
  );
};

export default WeeklyInsightCard;
