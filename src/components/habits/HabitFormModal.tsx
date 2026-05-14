/**
 * Modal wrapper for the HabitForm component.
 * Renders a semi-transparent overlay with a centered card.
 * Closes on overlay click (but NOT on card click — stopPropagation).
 */
import React from 'react';
import { X } from 'lucide-react';
import HabitForm from './HabitForm';
import type { Habit } from '../../types';

interface HabitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<Habit>;
  onSave: (data: Omit<Habit, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
}

const HabitFormModal: React.FC<HabitFormModalProps> = ({ isOpen, onClose, initialData, onSave }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#FFFFFF',
          border: '3px solid #000000',
          boxShadow: '8px 8px 0px #000000',
          padding: '32px',
          maxWidth: '520px',
          width: '100%',
          maxHeight: '85vh',
          overflowY: 'auto',
          position: 'relative',
        }}
        className="custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="neo-btn"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: '#FFFFFF',
            border: '3px solid #000000',
            boxShadow: '2px 2px 0px #000000',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={18} />
        </button>

        <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '24px', marginBottom: '16px', textTransform: 'uppercase' }}>
          {initialData ? 'EDIT HABIT' : 'ADD NEW HABIT'}
        </h2>

        <HabitForm
          initialData={initialData}
          onSave={onSave}
          onCancel={onClose}
        />
      </div>
    </div>
  );
};

export default HabitFormModal;
