/**
 * Habit form component with AI suggestion integration.
 * Used for both creating and editing habits.
 * IMPORTANT: Uses divs with onClick handlers, not <form> tags.
 */
import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { suggestHabits } from '../../lib/gemini';
import Spinner from '../ui/Spinner';
import type { Habit, HabitSuggestion } from '../../types';

const EMOJI_OPTIONS = ['💧', '🏃', '📚', '🧘', '💪', '🛌', '🥗', '📝', '🎯', '🎨', '🎵', '🧹', '🙏', '🌱', '💊', '🚴', '🧠', '✍️', '🏋️', '🍎'];

const COLOR_OPTIONS = ['#FFE566', '#A8E6CF', '#FF6B6B', '#C9B1FF', '#FF9F43', '#74b9ff'];

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
          background: '#f3eeff',
          border: '2px solid #C9B1FF',
          borderRadius: '8px',
          padding: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Sparkles size={18} style={{ color: '#C9B1FF' }} />
          <span style={{ fontWeight: 700, fontSize: '14px' }}>AI Habit Coach</span>
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
              background: '#C9B1FF',
              padding: '8px 16px',
              fontSize: '13px',
              whiteSpace: 'nowrap',
            }}
          >
            {aiLoading ? 'Thinking...' : 'Suggest'}
          </button>
        </div>

        {aiLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
            <Spinner size="sm" />
            <span style={{ fontSize: '13px', color: '#666' }}>Analysing your goal...</span>
          </div>
        )}

        {aiError && (
          <p style={{ color: '#FF6B6B', fontSize: '13px', marginTop: '8px' }}>{aiError}</p>
        )}

        {/* Suggestion cards */}
        {suggestions.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px', marginTop: '12px' }}>
            {suggestions.map((s, i) => (
              <div
                key={i}
                style={{
                  border: '2px solid #1A1A1A',
                  borderRadius: '6px',
                  padding: '10px',
                  background: 'white',
                  boxShadow: '2px 2px 0px #1A1A1A',
                }}
              >
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>{s.icon}</div>
                <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '2px' }}>{s.name}</div>
                <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>{s.description}</div>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>⏰ {s.reminder_time}</div>
                <button
                  className="neo-btn"
                  onClick={() => handleUseSuggestion(s)}
                  style={{ background: '#C9B1FF', padding: '4px 10px', fontSize: '12px', width: '100%' }}
                >
                  + Use This
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Name */}
      <div>
        <label style={{ fontWeight: 700, fontSize: '13px', display: 'block', marginBottom: '4px' }}>
          Name <span style={{ color: '#FF6B6B' }}>*</span>
        </label>
        <input
          className="neo-input"
          placeholder="e.g. Drink 8 glasses of water"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 50))}
          maxLength={50}
        />
        <div style={{ fontSize: '11px', color: '#888', textAlign: 'right', marginTop: '2px' }}>
          {name.length}/50
        </div>
      </div>

      {/* Description */}
      <div>
        <label style={{ fontWeight: 700, fontSize: '13px', display: 'block', marginBottom: '4px' }}>
          Description
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
        <div style={{ fontSize: '11px', color: '#888', textAlign: 'right', marginTop: '2px' }}>
          {description.length}/200
        </div>
      </div>

      {/* Emoji picker */}
      <div>
        <label style={{ fontWeight: 700, fontSize: '13px', display: 'block', marginBottom: '4px' }}>
          Icon
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => setIcon(emoji)}
              style={{
                width: '36px',
                height: '36px',
                border: icon === emoji ? '2px solid #1A1A1A' : '1px solid #ddd',
                borderRadius: '6px',
                background: icon === emoji ? '#FFE566' : 'white',
                fontSize: '18px',
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
        <label style={{ fontWeight: 700, fontSize: '13px', display: 'block', marginBottom: '4px' }}>
          Color
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                background: c,
                border: color === c ? '3px solid #1A1A1A' : '2px solid #ddd',
                cursor: 'pointer',
                boxShadow: color === c ? '2px 2px 0px #1A1A1A' : 'none',
              }}
            />
          ))}
        </div>
      </div>

      {/* Reminder toggle */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontWeight: 700, fontSize: '13px' }}>Reminder</label>
          {/* Custom styled toggle */}
          <button
            onClick={() => setReminderEnabled(!reminderEnabled)}
            style={{
              width: '44px',
              height: '24px',
              borderRadius: '12px',
              background: reminderEnabled ? '#A8E6CF' : '#e0e0e0',
              border: '2px solid #1A1A1A',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background 0.2s',
            }}
          >
            <div
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: '#1A1A1A',
                position: 'absolute',
                top: '2px',
                left: reminderEnabled ? '22px' : '2px',
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
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <button
          className="neo-btn"
          onClick={handleSave}
          disabled={!name.trim()}
          style={{
            background: '#FFE566',
            padding: '10px 24px',
            fontSize: '14px',
            flex: 1,
          }}
        >
          {initialData ? 'Save Changes' : 'Add Habit'}
        </button>
        <button
          className="neo-btn"
          onClick={onCancel}
          style={{
            background: 'white',
            padding: '10px 24px',
            fontSize: '14px',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default HabitForm;
