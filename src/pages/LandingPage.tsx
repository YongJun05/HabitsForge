/**
 * Landing page — the first thing unauthenticated users see.
 * Hero section with bold headline, two CTA buttons, and feature highlights.
 */
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Flame, Bell } from 'lucide-react';
import Navbar from '../components/layout/Navbar';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'HabitForge — Build Better Habits';
  }, []);

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      {/* Hero section */}
      <section
        style={{
          background: '#ffe600',
          borderBottom: '3px solid #000000',
          padding: '80px 24px 60px',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: 'clamp(32px, 6vw, 56px)',
            lineHeight: 1.1,
            maxWidth: '700px',
            margin: '0 auto 20px',
            textTransform: 'uppercase',
          }}
        >
          Build habits. Break patterns. Stay consistent.
        </h1>
        <p
          style={{
            fontSize: '18px',
            maxWidth: '560px',
            margin: '0 auto 32px',
            lineHeight: 1.5,
            color: '#000000',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          HabitForge uses AI to help you build the right habits, track your streaks, and stay consistent — one day at a time.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            className="neo-btn"
            onClick={() => navigate('/signup')}
            style={{
              background: '#000000',
              color: '#FFFFFF',
              padding: '14px 32px',
              fontSize: '16px',
            }}
          >
            Get Started Free
          </button>
          <button
            className="neo-btn"
            onClick={() => navigate('/login')}
            style={{
              background: '#FFFFFF',
              padding: '14px 32px',
              fontSize: '16px',
            }}
          >
            Login
          </button>
        </div>
      </section>

      {/* Feature highlights */}
      <section style={{ padding: '60px 24px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          {[
            {
              Icon: Sparkles,
              title: 'AI Habit Coach',
              desc: 'Describe a goal, get 3 habit suggestions instantly',
              color: '#FF2D9B',
            },
            {
              Icon: Flame,
              title: 'Streak Tracking',
              desc: 'Visual streaks that keep you accountable every day',
              color: '#ffe600',
            },
            {
              Icon: Bell,
              title: 'Smart Reminders',
              desc: 'Browser notifications at the exact time you need them',
              color: '#2563EB',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="neo-card"
              style={{ padding: '24px', textAlign: 'left' }}
            >
              <div
                className="neo-icon-box"
                style={{ background: feature.color, marginBottom: '12px' }}
              >
                <feature.Icon size={22} strokeWidth={2} />
              </div>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '18px', marginBottom: '8px' }}>
                {feature.title}
              </h3>
              <p style={{ fontSize: '14px', color: '#000000', margin: 0, lineHeight: 1.5, fontFamily: "'JetBrains Mono', monospace" }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
