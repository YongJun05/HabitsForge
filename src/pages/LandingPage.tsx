/**
 * Landing page — the first thing unauthenticated users see.
 * Hero section with bold headline, two CTA buttons, and feature highlights.
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Brain, Calendar, Flame, Sparkles, TrendingUp } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { supabase } from '../lib/supabase';
import { useWindowSize } from '../hooks/useWindowSize';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const { isMobile, isTablet } = useWindowSize();

  useEffect(() => {
    document.title = 'HabitsForge';
  }, []);

  useEffect(() => {
    let isMounted = true;

    const redirectIfAuthenticated = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (isMounted && session) {
        navigate('/dashboard', { replace: true });
        return;
      }
      if (isMounted) {
        setAuthChecked(true);
      }
    };

    redirectIfAuthenticated();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate('/dashboard', { replace: true });
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (!authChecked) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFAFA' }}>
        <div className="hf-loader" style={{ width: '80px', height: '80px' }}>
          {[...Array(12)].map((_, i) => (
            <div key={i} className="hf-loader__item" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar variant="landing" />
      <section className="landing-hero">
        <div
          className="landing-hero__inner"
          style={{
            gridTemplateColumns: isMobile ? '1fr' : undefined,
            padding: isMobile ? '34px 16px 42px' : undefined,
            gap: isMobile ? '24px' : undefined,
          }}
        >
          <div className="landing-hero__copy">
            <div className="landing-hero__eyebrow">AI HABIT COACH · V1.0</div>
            <h1 className="landing-hero__title">
              <span>Build habits</span>
              <span>
                that <mark>actually</mark>
              </span>
              <span>stick.</span>
            </h1>
            <p className="landing-hero__text" style={{ fontSize: isMobile ? '15px' : undefined }}>
              HabitsForge turns your goals into daily wins with an AI coach, streak tracking, and zero fluff.
            </p>
            <div className="landing-hero__actions" style={{ flexDirection: isMobile ? 'column' : undefined, gap: isMobile ? '12px' : undefined }}>
              <button className="neo-btn landing-hero__primary" onClick={() => navigate('/signup')}>
                Get Started Free →
              </button>
              <button className="neo-btn landing-hero__secondary" onClick={() => navigate('/login')}>
                Login
              </button>
            </div>
          </div>

          <div
            className="landing-hero__art"
            aria-hidden="true"
            style={{
              minHeight: isMobile ? 'auto' : undefined,
              display: isMobile ? 'flex' : undefined,
              justifyContent: isMobile ? 'center' : undefined,
              marginTop: isMobile ? '8px' : undefined,
            }}
          >
            {!isMobile && <div className="hero-tile hero-tile--blue" />}
            {!isMobile && <div className="hero-tile hero-tile--pink" />}
            <div
              className="hero-stat"
              style={{
                position: isMobile ? 'relative' : undefined,
                left: isMobile ? 'auto' : undefined,
                bottom: isMobile ? 'auto' : undefined,
              }}
            >
              <span>Today</span>
              <strong>7/8</strong>
              <small>habits done</small>
            </div>
            {!isMobile && <div className="hero-tile hero-tile--green">
              <Flame size={78} strokeWidth={3.5} />
            </div>}
          </div>
        </div>
      </section>

      <section className="landing-features">
        <div className="landing-features__inner">
          <div className="landing-features__intro">
            <h2>Why HabitsForge?</h2>
            <p>No gimmicks. Just bold, science-backed tracking with an AI in your corner.</p>
          </div>

          <div
            className="landing-features__grid"
            style={{ gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, minmax(0, 1fr))' : undefined }}
          >
            {[
              {
                Icon: Brain,
                title: 'AI Suggestions',
                text: 'Tell us your goal. Gemini-powered coach gives you 3 perfectly-sized habits to start today.',
                color: '#0757ff',
              },
              {
                Icon: Flame,
                title: 'Streak Power',
                text: 'Track current & best streaks. Daily check-ins keep the fire burning - literally.',
                color: '#ff0084',
              },
              {
                Icon: Calendar,
                title: '30-Day Heatmap',
                text: 'See your consistency at a glance with a chunky brutalist heatmap.',
                color: '#ffe600',
              },
              {
                Icon: TrendingUp,
                title: 'Weekly Insights',
                text: 'Get a personalized recap every week. Celebrate wins, fix gaps.',
                color: '#00f060',
              },
              {
                Icon: Bell,
                title: 'Browser Reminders',
                text: 'Custom reminder times per habit, right in your browser. No app needed.',
                color: '#ffffff',
              },
              {
                Icon: Sparkles,
                title: 'Zero Bloat',
                text: 'Just habits, streaks, and AI. No social feed, no ads, no nonsense.',
                color: '#0757ff',
              },
            ].map((feature) => (
              <article className="feature-card" key={feature.title}>
                <div className="feature-card__icon" style={{ background: feature.color }}>
                  <feature.Icon size={28} strokeWidth={3} color={feature.color === '#ffffff' ? '#000000' : '#ffffff'} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-cta">
        <div className="landing-cta__inner">
          <h2>Start your streak.</h2>
          <p>Free. No credit card. Build your first habit in 60 seconds.</p>
          <button className="landing-cta__button" onClick={() => navigate('/signup')}>
            Forge your first habit →
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
