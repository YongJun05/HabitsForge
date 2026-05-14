/**
 * Root application component with React Router.
 * Public routes: Landing, Login, Signup
 * Protected routes (wrapped in AuthGuard): Dashboard, HabitDetail, Settings
 * Catch-all: NotFound
 */
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthGuard from './components/layout/AuthGuard';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import HabitDetailPage from './pages/HabitDetailPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
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
          path="/habit/:id"
          element={
            <AuthGuard>
              <HabitDetailPage />
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
