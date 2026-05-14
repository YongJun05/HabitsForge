/**
 * CSS-animated loader for loading states.
 * Uses global styles from globals.css.
 */
import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: '48px',
  md: '64px',
  lg: '80px',
};

const Spinner: React.FC<SpinnerProps> = ({ size = 'md' }) => {
  const dimension = sizeMap[size];

  return (
    <div
      className="hf-loader"
      role="status"
      aria-label="Loading"
      style={{ width: dimension, height: dimension }}
    >
      {Array.from({ length: 12 }).map((_, index) => (
        <div key={index} className="hf-loader__item" />
      ))}
    </div>
  );
};

export default Spinner;
