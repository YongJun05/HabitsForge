/**
 * Root application component with React Router.
 * Public routes: Landing, Login, Signup
 * Protected routes (wrapped in AuthGuard): Dashboard, HabitDetail, Settings
 * Catch-all: NotFound
 */
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthGuard from './components/layout/AuthGuard';
import Navbar from './components/layout/Navbar';
import { isSupabaseConfigured } from './lib/supabase';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  if (!isSupabaseConfigured) {
    return (
      <BrowserRouter>
      <div style={{ minHeight: '100vh' }}>
        <Navbar />
        <div style={{ padding: '48px 24px' }}>
          <div
            style={{ maxWidth: '640px', margin: '0 auto', padding: '24px', textAlign: 'center', background: '#FFFFFF', border: '3px solid #000000', boxShadow: '4px 4px 0px #000000' }}
          >
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '28px', marginBottom: '12px' }}>
              HabitForge setup required
            </h1>
            <p style={{ margin: '0 0 16px', color: '#333', lineHeight: 1.5 }}>
              Add your Supabase credentials to a .env file so the app can connect.
            </p>
            <pre
              style={{
                background: '#FFFFFF',
                border: '3px solid #000000',
                padding: '12px',
                fontSize: '13px',
                textAlign: 'left',
                overflowX: 'auto',
                margin: 0,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {`VITE_SUPABASE_URL=\nVITE_SUPABASE_ANON_KEY=`}
            </pre>
          </div>
        </div>
      </div>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              <DashboardPage />
            </AuthGuard>
          }
        />
        <Route
          path="/settings"
          element={
            <AuthGuard>
              <SettingsPage />
            </AuthGuard>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
