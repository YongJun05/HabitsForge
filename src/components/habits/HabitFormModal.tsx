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
        background: 'rgba(0,0,0,0.4)',
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
          background: 'white',
          border: '3px solid #1A1A1A',
          boxShadow: '6px 6px 0px #1A1A1A',
          borderRadius: '8px',
          padding: '24px',
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
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          <X size={20} />
        </button>

        <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '20px', marginBottom: '16px' }}>
          {initialData ? 'Edit Habit' : 'Add New Habit'}
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
