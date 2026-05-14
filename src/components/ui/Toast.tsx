/**
 * Toast notification component for user feedback.
 * Fixed bottom-right position, auto-dismisses after 3 seconds.
 * Neobrutalism styled with thick borders and shadows.
 */
import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
  onClose: () => void;
}

const bgMap = {
  success: '#A8E6CF',
  error: '#FF6B6B',
  info: '#FFE566',
};

const Toast: React.FC<ToastProps> = ({ message, type, visible, onClose }) => {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 100,
        background: bgMap[type],
        border: '3px solid #1A1A1A',
        borderRadius: '8px',
        boxShadow: '4px 4px 0px #1A1A1A',
        padding: '12px 20px',
        fontWeight: 700,
        fontSize: '14px',
        maxWidth: '360px',
        animation: 'slideIn 0.2s ease-out',
      }}
    >
      {message}
    </div>
  );
};

// Inject slide-in animation
const styleId = 'habitforge-toast-style';
if (typeof document !== 'undefined' && !document.getElementById(styleId)) {
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`;
  document.head.appendChild(style);
}

export default Toast;
