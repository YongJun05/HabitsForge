/**
 * Simple CSS-animated spinner for loading states.
 * Uses pure CSS animation — no external dependencies.
 */
import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: '16px',
  md: '24px',
  lg: '40px',
};

const Spinner: React.FC<SpinnerProps> = ({ size = 'md' }) => {
  const dimension = sizeMap[size];

  return (
    <div
      style={{
        width: dimension,
        height: dimension,
        border: `3px solid #e0e0e0`,
        borderTop: `3px solid var(--color-dark)`,
        borderRadius: '50%',
        animation: 'spin 0.6s linear infinite',
      }}
    />
  );
};

// Inject the keyframe animation once
const styleId = 'habitforge-spinner-style';
if (typeof document !== 'undefined' && !document.getElementById(styleId)) {
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}

export default Spinner;
