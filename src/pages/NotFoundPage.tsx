/**
 * 404 Not Found page. Shown for any unmatched routes.
 */
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  useEffect(() => {
    document.title = 'HabitForge — 404';
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      textAlign: 'center',
    }}>
      <div style={{
        fontFamily: "'Syne', sans-serif",
        fontWeight: 800,
        fontSize: '120px',
        lineHeight: 1,
        marginBottom: '16px',
        color: '#1A1A1A',
      }}>
        404
      </div>
      <p style={{ fontSize: '18px', color: '#555', marginBottom: '24px' }}>
        This page doesn't exist.
      </p>
      <Link
        to="/dashboard"
        className="neo-btn"
        style={{
          background: '#FFE566',
          padding: '12px 24px',
          fontSize: '14px',
          textDecoration: 'none',
          color: '#1A1A1A',
        }}
      >
        Back to Dashboard
      </Link>
    </div>
  );
};

export default NotFoundPage;
