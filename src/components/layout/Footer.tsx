/**
 * Shared footer component used across all pages.
 */
import React from 'react';
import { useWindowSize } from '../../hooks/useWindowSize';

const Footer: React.FC = () => {
  const { isMobile } = useWindowSize();
  return (
    <footer className="landing-footer" style={{ flexDirection: isMobile ? 'column' : undefined, alignItems: isMobile ? 'flex-start' : undefined, gap: isMobile ? '8px' : undefined }}>
      <span>© 2026 HabitsForge</span>
      <span>Built with bricks & brutalism.</span>
    </footer>
  );
};

export default Footer;
