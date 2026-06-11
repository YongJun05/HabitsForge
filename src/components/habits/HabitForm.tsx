/**
 * Habit form component with AI suggestion integration.
 * Used for both creating and editing habits.
 * IMPORTANT: Uses divs with onClick handlers, not <form> tags.
 *
 * Layout: Grouped into visual sections:
 *   1. AI Coach — suggestion area
 *   2. Habit Details — Name, Description, Category
 *   3. Appearance — Icon + Color side-by-side on desktop
 *   4. Schedule — Reminder toggle + time picker
 *   5. Sticky Save/Cancel at bottom
 */
import React, { useState } from 'react';
import {
  Flame,
  BookOpen,
  Brain,
  Droplets,
  Dumbbell,
  Apple,
  Moon,
  Sun,
  Heart,
  Footprints,
  Pencil,
  Coffee,
  Music,
  Smile,
  Sparkles,
  Bike,
  Leaf,
  Pill,
  Target,
  Trophy,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { suggestHabits } from '../../lib/gemini';
import Spinner from '../ui/Spinner';
import HabitIcon from '../ui/HabitIcon';
import type { Habit, HabitSuggestion } from '../../types';
import { useWindowSize } from '../../hooks/useWindowSize';

const HABIT_ICONS: { id: string; Icon: LucideIcon }[] = [
  { id: 'flame', Icon: Flame },
  { id: 'book', Icon: BookOpen },
  { id: 'brain', Icon: Brain },
  { id: 'droplets', Icon: Droplets },
  { id: 'dumbbell', Icon: Dumbbell },
  { id: 'apple', Icon: Apple },
  { id: 'moon', Icon: Moon },
  { id: 'sun', Icon: Sun },
  { id: 'heart', Icon: Heart },
  { id: 'footprints', Icon: Footprints },
  { id: 'pencil', Icon: Pencil },
  { id: 'coffee', Icon: Coffee },
  { id: 'music', Icon: Music },
  { id: 'smile', Icon: Smile },
  { id: 'sparkles', Icon: Sparkles },
  { id: 'bike', Icon: Bike },
  { id: 'leaf', Icon: Leaf },
  { id: 'pill', Icon: Pill },
  { id: 'target', Icon: Target },
  { id: 'trophy', Icon: Trophy },
];

const COLOR_OPTIONS = ['#ffe600', '#2563EB', '#FF2D9B', '#22C55E', '#FFFFFF'];

interface HabitFormProps {
  initialData?: Partial<Habit>;
  onSave: (data: Omit<Habit, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void> | void;
  onCancel: () => void;
}

const HabitForm: React.FC<HabitFormProps> = ({ initialData, onSave, onCancel }) => {
  const { isMobile } = useWindowSize();
  const [name, setName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [category, setCategory] = useState(initialData?.category ?? '');
  const [icon, setIcon] = useState(initialData?.icon ?? 'target');
  const [color, setColor] = useState(initialData?.color ?? '#ffe600');
  const [reminderEnabled, setReminderEnabled] = useState(initialData?.reminder_enabled ?? false);
  const [reminderTime, setReminderTime] = useState(initialData?.reminder_time ?? '09:00');
  const [formError, setFormError] = useState<string | null>(null);

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
    setIcon(HABIT_ICONS.some(({ id }) => id === s.icon) ? s.icon : 'target');
    setColor(s.color);
    setReminderTime(s.reminder_time);
    setReminderEnabled(true);
    setSuggestions([]);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setFormError('Name is required.');
      return;
    }

    setFormError(null);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        category: category.trim() || undefined,
        icon,
        color,
        reminder_enabled: reminderEnabled,
        reminder_time: reminderEnabled ? reminderTime : undefined,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save habit.';
      setFormError(message);
    }
  };

  const iconBtnSize = isMobile ? 44 : 48;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

      {/* ── Section 1: AI Coach ──────────────────────── */}
      <div
        style={{
          background: '#F0E6FF',
          border: '3px solid #000000',
          padding: isMobile ? '12px' : '16px',
        }}
      >
        <div className="neo-section-heading" style={{ color: '#7C3AED', marginBottom: '12px' }}>
          <Sparkles size={14} strokeWidth={2.5} />
          <span>AI HABITS COACH</span>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexDirection: isMobile ? 'column' : 'row' }}>
          <input
            className="neo-input"
            placeholder="Describe your goal..."
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSuggest(); }}
            style={{ fontSize: isMobile ? '16px' : undefined }}
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
              minHeight: '44px',
              width: isMobile ? '100%' : undefined,
            }}
          >
            {aiLoading ? 'SUGGESTING...' : 'SUGGEST'}
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
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px', marginTop: '12px' }}>
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
                <div style={{ marginBottom: '4px' }}>
                  <HabitIcon iconId={s.icon} />
                </div>
                <div style={{ fontWeight: 800, fontSize: '13px', marginBottom: '2px' }}>{s.name}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#666', marginBottom: '6px' }}>{s.description}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', marginBottom: '8px' }}>{s.reminder_time}</div>
                <button
                  className="neo-btn"
                  onClick={() => handleUseSuggestion(s)}
                  style={{ background: '#22C55E', color: '#FFFFFF', border: '2px solid #000000', boxShadow: '2px 2px 0px #000000', padding: '6px 10px', fontSize: '12px', width: '100%' }}
                >
                  USE THIS
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <hr className="neo-section-divider" />

      {/* ── Section 2: Habit Details ─────────────────── */}
      <div className="neo-section-heading">
        <span>HABIT DETAILS</span>
      </div>

      {/* Name */}
      <div style={{ marginBottom: isMobile ? '12px' : '16px' }}>
        <label style={{ fontWeight: 800, fontSize: '12px', letterSpacing: '2px', display: 'block', marginBottom: '6px' }}>
          NAME <span style={{ color: '#FF2D9B' }}>*</span>
        </label>
        <input
          className="neo-input"
          placeholder="e.g. Drink 8 glasses of water"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 50))}
          maxLength={50}
          style={{ fontSize: isMobile ? '16px' : undefined }}
        />
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', textAlign: 'right', marginTop: '2px' }}>
          {name.length}/50
        </div>
      </div>

      {/* Description */}
      <div style={{ marginBottom: isMobile ? '12px' : '16px' }}>
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
          style={{ resize: 'vertical', fontSize: isMobile ? '16px' : undefined }}
        />
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', textAlign: 'right', marginTop: '2px' }}>
          {description.length}/200
        </div>
      </div>

      {/* Category */}
      <div>
        <label style={{ fontWeight: 800, fontSize: '12px', letterSpacing: '2px', display: 'block', marginBottom: '6px' }}>
          CATEGORY
        </label>
        <input
          className="neo-input"
          placeholder="e.g. Health, Productivity, Finance..."
          value={category}
          onChange={(e) => setCategory(e.target.value.slice(0, 30))}
          maxLength={30}
          list="category-suggestions"
          style={{ fontSize: isMobile ? '16px' : undefined }}
        />
        <datalist id="category-suggestions">
          <option value="Health" />
          <option value="Productivity" />
          <option value="Mindfulness" />
          <option value="Fitness" />
          <option value="Finance" />
          <option value="Learning" />
        </datalist>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', textAlign: 'right', marginTop: '2px' }}>
          {category.length}/30
        </div>
      </div>

      <hr className="neo-section-divider" />

      {/* ── Section 3: Appearance ────────────────────── */}
      <div className="neo-section-heading">
        <span>APPEARANCE</span>
      </div>

      <div style={{
        display: isMobile ? 'flex' : 'grid',
        gridTemplateColumns: isMobile ? undefined : '1fr 1fr',
        gap: isMobile ? '0' : '24px',
        flexDirection: isMobile ? 'column' : undefined,
      }}>
        {/* Icon picker — horizontal scrollable strip */}
        <div style={{ marginBottom: isMobile ? '12px' : '0' }}>
          <label style={{ fontWeight: 800, fontSize: '12px', letterSpacing: '2px', display: 'block', marginBottom: '6px' }}>
            CHOOSE ICON
          </label>
          <div className="neo-scroll-strip">
            {HABIT_ICONS.map(({ id, Icon }) => (
              <button
                key={id}
                onClick={() => setIcon(id)}
                aria-label={`Choose ${id} icon`}
                style={{
                  width: `${iconBtnSize}px`,
                  height: `${iconBtnSize}px`,
                  minWidth: `${iconBtnSize}px`,
                  minHeight: '44px',
                  border: '2px solid #000000',
                  boxShadow: icon === id ? '2px 2px 0px #000000' : '3px 3px 0px #000000',
                  background: icon === id ? '#FFE566' : '#FFFFFF',
                  transform: icon === id ? 'translate(1px, 1px)' : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 0,
                  padding: 0,
                }}
              >
                <Icon size={22} strokeWidth={2} color="#000000" />
              </button>
            ))}
          </div>
        </div>

        {/* Color picker — compact row */}
        <div>
          <label style={{ fontWeight: 800, fontSize: '12px', letterSpacing: '2px', display: 'block', marginBottom: '6px' }}>
            CARD COLOR
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap' }}>
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{
                  width: isMobile ? '40px' : '36px',
                  height: isMobile ? '40px' : '36px',
                  minWidth: '36px',
                  minHeight: '36px',
                  background: c,
                  border: '2px solid #000000',
                  cursor: 'pointer',
                  boxShadow: color === c ? '4px 4px 0px #000000' : 'none',
                  transform: color === c ? 'translate(-2px, -2px)' : 'none',
                  padding: 0,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <hr className="neo-section-divider" />

      {/* ── Section 4: Schedule ──────────────────────── */}
      <div className="neo-section-heading">
        <span>SCHEDULE</span>
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontWeight: 800, fontSize: '12px', letterSpacing: '2px' }}>REMINDER</label>
          <label className="hf-switch">
            <input
              className="hf-switch__input"
              type="checkbox"
              checked={reminderEnabled}
              onChange={(e) => setReminderEnabled(e.target.checked)}
            />
            <span className="hf-switch__toggle">
              <span className="hf-switch__left">off</span>
              <span className="hf-switch__right">on</span>
            </span>
          </label>
        </div>

        {reminderEnabled && (
          <input
            type="time"
            className="neo-input"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            style={{ marginTop: '8px', maxWidth: isMobile ? '100%' : '160px', fontSize: isMobile ? '16px' : undefined }}
          />
        )}
      </div>

      {/* ── Sticky Save + Cancel ─────────────────────── */}
      <div className="neo-form-actions-sticky">
        {formError && (
          <div style={{ color: '#FF2D9B', fontSize: '13px', fontFamily: "'JetBrains Mono', monospace", marginBottom: '8px' }}>
            {formError}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            className="neo-btn"
            onClick={handleSave}
            disabled={!name.trim()}
            type="button"
            style={{
              background: '#2563EB',
              color: '#FFFFFF',
              padding: '12px 24px',
              fontSize: '14px',
              width: '100%',
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              minHeight: '44px',
            }}
          >
            {initialData ? 'SAVE CHANGES' : 'ADD HABIT'}
          </button>
          <button
            className="neo-btn"
            onClick={onCancel}
            type="button"
            style={{
              background: '#FFFFFF',
              padding: '12px 24px',
              fontSize: '14px',
              width: '100%',
              minHeight: '44px',
            }}
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
};

export default HabitForm;
