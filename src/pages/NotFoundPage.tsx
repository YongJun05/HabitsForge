/**
 * 404 Not Found page. Shown for any unmatched routes.
 */
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Navbar from '../components/layout/Navbar';

const NotFoundPage: React.FC = () => {
  useEffect(() => {
    document.title = 'HabitForge — 404';
  }, []);

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      <div
        style={{
          minHeight: 'calc(100vh - 64px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <div style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: '120px',
          lineHeight: 1,
          marginBottom: '8px',
          color: '#000000',
        }}>
          404
        </div>
        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '18px', marginBottom: '16px' }}>
          PAGE NOT FOUND
        </div>
        <Link
          to="/dashboard"
          className="neo-btn"
          style={{
            background: '#2563EB',
            color: '#FFFFFF',
            padding: '12px 24px',
            fontSize: '14px',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <ArrowLeft size={16} />
          GO HOME
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
