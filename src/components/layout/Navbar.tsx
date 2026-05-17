/**
 * components/layout/Navbar.tsx
 * 
 * Responsive top navigation bar.
 * Desktop: logo + brand | display name + avatar + bell + settings + logout
 * Mobile:  logo | bell icon + hamburger menu
 *
 * Bell icon shows an unread-count badge and opens an in-app notification
 * panel listing fired habit reminders.
 */
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Bell, Flame, LogOut, Menu, Settings, X } from 'lucide-react';
import { useWindowSize } from '../../hooks/useWindowSize';
import {
  clearAllNotifications,
  formatNotifTime,
  getStoredNotifications,
  getUnreadCount,
  markAllRead,
  removeNotification,
  NOTIF_EVENT,
  type AppNotification,
} from '../../lib/notificationStore';

// ---------------------------------------------------------------------------
// BellButton — file-level component so React never recreates it per render
// ---------------------------------------------------------------------------
interface BellButtonProps {
  unreadCount: number;
  notifications: AppNotification[];
  onOpen: () => void;
  onClearAll: () => void;
  onMarkAllRead: () => void;
  onRemoveNotification: (notificationId: string) => void;
}

const BellButton: React.FC<BellButtonProps> = ({
  unreadCount,
  notifications,
  onOpen,
  onClearAll,
  onMarkAllRead,
  onRemoveNotification,
}) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleClick = () => {
    if (!open) {
      onMarkAllRead();
      onOpen();
    }
    setOpen((o) => !o);
  };

  const handleClear = () => {
    onClearAll();
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      {/* Bell trigger */}
      <button
        className="neo-btn"
        onClick={handleClick}
        aria-label="Notifications"
        style={{
          background: '#FFFFFF',
          color: '#000000',
          padding: '8px 14px',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '44px',
          position: 'relative',
        }}
      >
        <Bell size={14} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-6px',
              right: '-6px',
              background: '#FF2D9B',
              color: '#FFFFFF',
              minWidth: '18px',
              height: '18px',
              borderRadius: '50%',
              fontSize: '10px',
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #000',
              padding: '0 3px',
              lineHeight: 1,
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            width: '300px',
            background: '#FFFFFF',
            border: '3px solid #000000',
            boxShadow: '4px 4px 0 #000000',
            zIndex: 200,
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '10px 14px',
              borderBottom: '2px solid #000000',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#ffe600',
            }}
          >
            <span
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: '13px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              REMINDERS
            </span>
            {notifications.length > 0 && (
              <button
                onClick={handleClear}
                style={{
                  background: 'none',
                  border: 'none',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '11px',
                  cursor: 'pointer',
                  color: '#000',
                  textDecoration: 'underline',
                  padding: 0,
                }}
              >
                Clear all
              </button>
            )}
          </div>

          {/* Body */}
          {notifications.length === 0 ? (
            <div
              style={{
                padding: '24px 16px',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px',
                color: '#888',
                textAlign: 'center',
              }}
            >
              No reminders yet
            </div>
          ) : (
            <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
              {notifications.map((n, idx) => (
                <div
                  key={n.id}
                  onClick={() => {
                    navigate('/dashboard', { state: { activeTab: 2, selectedHabitId: n.habitId } });
                    onRemoveNotification(n.id);
                    setOpen(false);
                  }}
                  style={{
                    padding: '12px 14px',
                    borderBottom: idx < notifications.length - 1 ? '1px solid #e0e0e0' : 'none',
                    background: n.read ? '#FFFFFF' : '#fffde7',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = n.read ? '#f9f9f9' : '#fff9c4'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = n.read ? '#FFFFFF' : '#fffde7'; }}
                >
                  {/* Icon */}
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      border: '2px solid #000',
                      background: '#ffe600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px',
                      boxShadow: '2px 2px 0px #000000',
                    }}
                  >
                    <Bell size={14} />
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "'Syne', sans-serif",
                        fontWeight: 800,
                        fontSize: '13px',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {n.habitName}
                    </div>
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '11px',
                        color: '#333',
                        marginTop: '4px',
                        lineHeight: 1.3,
                      }}
                    >
                      It's time to complete your habit! Click to view details.
                    </div>
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '10px',
                        color: '#888',
                        marginTop: '6px',
                      }}
                    >
                      {formatNotifTime(n.firedAt)}
                    </div>
                  </div>

                  {/* Unread dot */}
                  {!n.read && (
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#FF2D9B',
                        flexShrink: 0,
                        marginTop: '6px',
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Navbar
// ---------------------------------------------------------------------------
interface NavbarProps {
  variant?: 'app' | 'landing';
}

const Navbar: React.FC<NavbarProps> = ({ variant = 'app' }) => {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const { isMobile } = useWindowSize();
  const isLanding = variant === 'landing';

  // Auth
  useEffect(() => {
    let isMounted = true;

    async function fetchProfile() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (session?.user) {
          setIsAuthenticated(true);
          setUserId(session.user.id);
          const { data } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', session.user.id)
            .maybeSingle();
            
          if (data?.display_name) {
            setDisplayName(data.display_name);
          } else {
            // Profile missing -> create it on the fly
            const defaultName = session.user.email?.split('@')[0] || 'User';
            const { data: newProfile } = await supabase
              .from('profiles')
              .insert({ id: session.user.id, display_name: defaultName })
              .select('display_name')
              .single();
            if (newProfile?.display_name) {
              setDisplayName(newProfile.display_name);
            }
          }
        } else {
          setIsAuthenticated(false);
          setUserId(null);
          setDisplayName('');
        }
      } catch {
        if (!isMounted) return;
        setIsAuthenticated(false);
        setUserId(null);
        setDisplayName('');
      }
    }

    fetchProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchProfile();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Notification store — initialise and listen for updates via custom event
  useEffect(() => {
    const refresh = () => {
      if (userId) {
        setUnreadCount(getUnreadCount(userId));
        setNotifications(getStoredNotifications(userId));
      } else {
        setUnreadCount(0);
        setNotifications([]);
      }
    };
    refresh();
    window.addEventListener(NOTIF_EVENT, refresh);
    return () => window.removeEventListener(NOTIF_EVENT, refresh);
  }, [userId]);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch {
      // Ignore logout errors silently and just navigate away
    } finally {
      setIsAuthenticated(false);
      setUserId(null);
      setDisplayName('');
      navigate('/', { replace: true });
    }
  };

  const initial = displayName ? displayName.charAt(0).toUpperCase() : '?';
  const closeMenu = () => setMenuOpen(false);

  const navigateTab = (tab: number) => {
    navigate('/dashboard', { state: { activeTab: tab } });
    closeMenu();
  };

  const mobileItems = isAuthenticated
    ? [
      { label: 'DASHBOARD', onClick: () => navigateTab(0) },
      { label: 'ADD HABIT', onClick: () => navigateTab(1) },
      { label: 'DETAILS', onClick: () => navigateTab(2) },
      { label: 'SETTINGS', onClick: () => { navigate('/settings'); closeMenu(); } },
      { label: 'LOGOUT', onClick: async () => { await handleLogout(); closeMenu(); } },
    ]
    : [
      { label: 'LOGIN', onClick: () => { navigate('/login'); closeMenu(); } },
      { label: 'SIGN UP', onClick: () => { navigate('/signup'); closeMenu(); } },
    ];

  // Shared props for BellButton used in both mobile and desktop
  const bellProps: BellButtonProps = {
    unreadCount,
    notifications,
    onOpen: () => {
      if (userId) {
        setUnreadCount(getUnreadCount(userId));
        setNotifications(getStoredNotifications(userId));
      }
    },
    onClearAll: () => {
      if (userId) clearAllNotifications(userId);
    },
    onMarkAllRead: () => {
      if (userId) markAllRead(userId);
    },
    onRemoveNotification: (id: string) => {
      if (userId) removeNotification(userId, id);
    },
  };

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 50 }}>
      <nav
        className={isLanding ? 'landing-nav' : undefined}
        style={{
          background: isLanding ? '#FFFFFF' : '#ffe600',
          borderBottom: '3px solid #000000',
          padding: isMobile ? '12px 16px' : isLanding ? '16px clamp(20px, 8vw, 146px)' : '16px 24px',
          minHeight: '72px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        {/* Logo / brand */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0' : '16px', cursor: 'pointer' }}
          onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}
        >
          <div
            style={{
              width: isMobile ? '44px' : '42px',
              height: isMobile ? '44px' : '42px',
              background: '#ffe600',
              border: '3px solid #000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '44px',
            }}
          >
            <Flame size={isMobile ? 24 : 22} strokeWidth={3} />
          </div>
          {!isMobile && (
            <span
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: '22px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              HABITSFORGE
            </span>
          )}
        </div>

        {/* Right-side actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isMobile ? (
            <>
              {isAuthenticated && <BellButton {...bellProps} />}
              <button
                className="neo-btn"
                onClick={() => setMenuOpen((o) => !o)}
                type="button"
                aria-label="Open navigation menu"
                style={{
                  width: '44px',
                  height: '44px',
                  minWidth: '44px',
                  background: '#FFFFFF',
                  border: '3px solid #000000',
                  boxShadow: '3px 3px 0px #000000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                }}
              >
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </>
          ) : isAuthenticated ? (
            <>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: '12px',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                }}
              >
                {displayName}
              </span>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  border: '3px solid #000000',
                  boxShadow: '3px 3px 0px #000000',
                  background: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '14px',
                }}
              >
                {initial}
              </div>
              <BellButton {...bellProps} />
              <button
                className="neo-btn"
                onClick={() => navigate('/settings')}
                aria-label="Settings"
                style={{
                  background: '#FFFFFF',
                  color: '#000000',
                  padding: '8px 14px',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '44px',
                }}
              >
                <Settings size={14} />
              </button>
              <button
                className="neo-btn"
                onClick={handleLogout}
                style={{
                  background: '#000000',
                  color: '#FFFFFF',
                  padding: '8px 14px',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  minHeight: '44px',
                }}
              >
                <LogOut size={14} />
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                className="neo-btn"
                onClick={() => navigate('/login')}
                style={{
                  background: '#FFFFFF',
                  color: '#000000',
                  padding: isLanding ? '8px 10px' : '6px 8px',
                  fontSize: isLanding ? '14px' : '12px',
                  minHeight: '44px',
                }}
              >
                Login
              </button>
              <button
                className="neo-btn"
                onClick={() => navigate('/signup')}
                style={{
                  background: isLanding ? '#ffe600' : '#2563EB',
                  color: isLanding ? '#000000' : '#FFFFFF',
                  padding: isLanding ? '8px 10px' : '6px 8px',
                  fontSize: isLanding ? '14px' : '12px',
                  minHeight: '44px',
                }}
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Mobile hamburger menu */}
      {isMobile && menuOpen && (
        <div style={{ background: '#FFFFFF', borderBottom: '3px solid #000000', width: '100%' }}>
          {mobileItems.map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              type="button"
              style={{
                width: '100%',
                minHeight: '44px',
                padding: '16px 20px',
                border: 'none',
                borderBottom: '2px solid #000000',
                background: '#FFFFFF',
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                textTransform: 'uppercase',
                fontSize: '16px',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Navbar;
