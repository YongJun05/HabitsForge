/**
 * Habit form component with AI suggestion integration.
 * Used for both creating and editing habits.
 * IMPORTANT: Uses divs with onClick handlers, not <form> tags.
 */
import React, { useState } from 'react';
import { suggestHabits } from '../../lib/gemini';
import Spinner from '../ui/Spinner';
import type { Habit, HabitSuggestion } from '../../types';

const EMOJI_OPTIONS = ['💧', '🏃', '📚', '🧘', '💪', '🛌', '🥗', '📝', '🎯', '🎨', '🎵', '🧹', '🙏', '🌱', '💊', '🚴', '🧠', '✍️', '🏋️', '🍎'];

const COLOR_OPTIONS = ['#FFE566', '#2563EB', '#FF2D9B', '#22C55E', '#000000', '#FFFFFF'];

interface HabitFormProps {
  initialData?: Partial<Habit>;
  onSave: (data: Omit<Habit, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
}

const HabitForm: React.FC<HabitFormProps> = ({ initialData, onSave, onCancel }) => {
  const [name, setName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [icon, setIcon] = useState(initialData?.icon ?? '🎯');
  const [color, setColor] = useState(initialData?.color ?? '#FFE566');
  const [reminderEnabled, setReminderEnabled] = useState(initialData?.reminder_enabled ?? false);
  const [reminderTime, setReminderTime] = useState(initialData?.reminder_time ?? '09:00');

  // AI suggestion state
  const [goal, setGoal] = useState('');
  const [suggestions, setSuggestions] = useState<HabitSuggestion[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleSuggest = async () => {
    if (!goal.trim()) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const results = await suggestHabits(goal.trim());
      setSuggestions(results);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Failed to get suggestions');
    } finally {
      setAiLoading(false);
    }
  };

  const handleUseSuggestion = (s: HabitSuggestion) => {
    setName(s.name);
    setDescription(s.description);
    setIcon(s.icon);
    setColor(s.color);
    setReminderTime(s.reminder_time);
    setReminderEnabled(true);
    setSuggestions([]);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      icon,
      color,
      reminder_enabled: reminderEnabled,
      reminder_time: reminderEnabled ? reminderTime : undefined,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* AI Coach Banner */}
      <div
        style={{
          background: '#F0E6FF',
          border: '3px solid #000000',
          padding: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800 }}>✨ AI HABIT COACH</span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            className="neo-input"
            placeholder="Describe your goal..."
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSuggest(); }}
          />
          <button
            className="neo-btn"
            onClick={handleSuggest}
            disabled={aiLoading || !goal.trim()}
            style={{
              background: '#FF2D9B',
              color: '#FFFFFF',
              padding: '12px 16px',
              fontSize: '12px',
              whiteSpace: 'nowrap',
            }}
          >
            {aiLoading ? 'SUGGESTING...' : 'SUGGEST →'}
          </button>
        </div>

        {aiLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
            <Spinner size="sm" />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}>ANALYSING YOUR GOAL...</span>
          </div>
        )}

        {aiError && (
          <p style={{ color: '#FF2D9B', fontSize: '13px', marginTop: '8px', fontFamily: "'JetBrains Mono', monospace" }}>{aiError}</p>
        )}

        {/* Suggestion cards */}
        {suggestions.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px', marginTop: '12px' }}>
            {suggestions.map((s, i) => (
              <div
                key={i}
                style={{
                  border: '2px solid #000000',
                  padding: '12px',
                  background: '#FFFFFF',
                  boxShadow: '3px 3px 0px #000000',
                }}
              >
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>{s.icon}</div>
                <div style={{ fontWeight: 800, fontSize: '13px', marginBottom: '2px' }}>{s.name}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#666', marginBottom: '6px' }}>{s.description}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', marginBottom: '8px' }}>⏰ {s.reminder_time}</div>
                <button
                  className="neo-btn"
                  onClick={() => handleUseSuggestion(s)}
                  style={{ background: '#22C55E', color: '#FFFFFF', border: '2px solid #000000', boxShadow: '2px 2px 0px #000000', padding: '6px 10px', fontSize: '12px', width: '100%' }}
                >
                  + USE THIS
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Name */}
      <div>
        <label style={{ fontWeight: 800, fontSize: '12px', letterSpacing: '2px', display: 'block', marginBottom: '6px' }}>
          NAME <span style={{ color: '#FF2D9B' }}>*</span>
        </label>
        <input
          className="neo-input"
          placeholder="e.g. Drink 8 glasses of water"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 50))}
          maxLength={50}
        />
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', textAlign: 'right', marginTop: '2px' }}>
          {name.length}/50
        </div>
      </div>

      {/* Description */}
      <div>
        <label style={{ fontWeight: 800, fontSize: '12px', letterSpacing: '2px', display: 'block', marginBottom: '6px' }}>
          DESCRIPTION
        </label>
        <textarea
          className="neo-input"
          placeholder="Why this habit matters to you..."
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, 200))}
          maxLength={200}
          rows={2}
          style={{ resize: 'vertical' }}
        />
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', textAlign: 'right', marginTop: '2px' }}>
          {description.length}/200
        </div>
      </div>

      {/* Emoji picker */}
      <div>
        <label style={{ fontWeight: 800, fontSize: '12px', letterSpacing: '2px', display: 'block', marginBottom: '6px' }}>
          CHOOSE ICON
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => setIcon(emoji)}
              style={{
                width: '40px',
                height: '40px',
                border: '2px solid #000000',
                background: icon === emoji ? '#FFE566' : '#FFFFFF',
                fontSize: '18px',
                boxShadow: icon === emoji ? '2px 2px 0px #000000' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Color picker */}
      <div>
        <label style={{ fontWeight: 800, fontSize: '12px', letterSpacing: '2px', display: 'block', marginBottom: '6px' }}>
          CARD COLOR
        </label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{
                width: '36px',
                height: '36px',
                background: c,
                border: '2px solid #000000',
                cursor: 'pointer',
                boxShadow: color === c ? '4px 4px 0px #000000' : 'none',
                transform: color === c ? 'translate(-2px, -2px)' : 'none',
              }}
            />
          ))}
        </div>
      </div>

      {/* Reminder toggle */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontWeight: 800, fontSize: '12px', letterSpacing: '2px' }}>REMINDER</label>
          <button
            onClick={() => setReminderEnabled(!reminderEnabled)}
            style={{
              width: '48px',
              height: '24px',
              background: reminderEnabled ? '#22C55E' : '#f0f0f0',
              border: '3px solid #000000',
              boxShadow: '4px 4px 0px #000000',
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: '16px',
                height: '16px',
                background: '#000000',
                position: 'absolute',
                top: '2px',
                left: reminderEnabled ? '26px' : '4px',
                transition: 'left 0.2s',
              }}
            />
          </button>
        </div>

        {reminderEnabled && (
          <input
            type="time"
            className="neo-input"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            style={{ marginTop: '8px', maxWidth: '160px' }}
          />
        )}
      </div>

      {/* Save + Cancel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
        <button
          className="neo-btn"
          onClick={handleSave}
          disabled={!name.trim()}
          style={{
            background: '#2563EB',
            color: '#FFFFFF',
            padding: '12px 24px',
            fontSize: '14px',
            width: '100%',
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
          }}
        >
          {initialData ? 'SAVE CHANGES' : 'ADD HABIT'}
        </button>
        <button
          className="neo-btn"
          onClick={onCancel}
          style={{
            background: '#FFFFFF',
            padding: '12px 24px',
            fontSize: '14px',
            width: '100%',
          }}
        >
          CANCEL
        </button>
      </div>
    </div>
  );
};

export default HabitForm;
