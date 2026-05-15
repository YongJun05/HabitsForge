/**
 * Dashboard page — main authenticated app surface.
 * Hosts a 3-tab layout for dashboard, add habit, and details.
 */
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Plus, Trophy, BarChart2, RefreshCw } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import TabBar from '../components/layout/TabBar';
import HabitCard from '../components/habits/HabitCard';
import HabitForm from '../components/habits/HabitForm';
import HabitIcon from '../components/ui/HabitIcon';
import Toast from '../components/ui/Toast';
import { supabase } from '../lib/supabase';
import { useHabits } from '../hooks/useHabits';
import { useNotifications } from '../hooks/useNotifications';
import type { Habit, HabitWithStreak } from '../types';

const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const { habits, loading, error, createHabit, updateHabit, deleteHabit, toggleDone } = useHabits();
    const { permission, requestPermission, isSupported, scheduleReminders } = useNotifications();

    const [activeTab, setActiveTab] = useState(0);
    const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
    const [detailLogs, setDetailLogs] = useState<string[]>([]);
    const [detailLoading, setDetailLoading] = useState(false);
    const [editingHabit, setEditingHabit] = useState<HabitWithStreak | undefined>(undefined);
    const [formKey, setFormKey] = useState(0);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [notifDismissed, setNotifDismissed] = useState(() => localStorage.getItem('habitforge_notif_dismissed') === 'true');
    const [sessionChecked, setSessionChecked] = useState(true);
    const [renderError, setRenderError] = useState<string | null>(null);

    useEffect(() => {
        document.title = 'HabitForge — Dashboard';
    }, []);

    useEffect(() => {
        let isMounted = true;

        const checkSession = async () => {
            try {
                console.log('[DashboardPage] Checking session...');
                const { data: { session } } = await supabase.auth.getSession();
                console.log('[DashboardPage] Session:', session ? 'FOUND' : 'NOT FOUND');
                if (isMounted && !session) {
                    console.log('[DashboardPage] No session, redirecting to login');
                    navigate('/login', { replace: true });
                }
            } catch (err) {
                console.error('[DashboardPage] Session check error:', err);
                if (isMounted) {
                    setRenderError(err instanceof Error ? err.message : 'Session check failed');
                    navigate('/login', { replace: true });
                }
            }
        };

        checkSession();

        return () => {
            isMounted = false;
        };
    }, [navigate]);

    useEffect(() => {
        if (habits.length > 0) {
            scheduleReminders(habits);
        }
    }, [habits, scheduleReminders]);

    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ message, type });
    }, []);

    const handleSave = async (data: Omit<Habit, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
        try {
            if (editingHabit) {
                await updateHabit(editingHabit.id, data);
                showToast('HABIT UPDATED!');
            } else {
                await createHabit(data);
                showToast('HABIT CREATED!');
            }
            setEditingHabit(undefined);
            setFormKey((prev) => prev + 1);
            setActiveTab(0);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Something went wrong';
            showToast(message, 'error');
        }
    };

    const handleToggle = async (id: string) => {
        try {
            const habit = habits.find((h) => h.id === id);
            await toggleDone(id);
            showToast(habit?.isDoneToday ? 'HABIT UNCHECKED' : 'HABIT CHECKED OFF!');
        } catch {
            showToast('FAILED TO TOGGLE', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteHabit(id);
            showToast('HABIT DELETED');
        } catch {
            showToast('FAILED TO DELETE', 'error');
        }
    };

    const handleEdit = (habit: HabitWithStreak) => {
        setEditingHabit(habit);
        setActiveTab(1);
    };

    const handleAddNew = () => {
        setEditingHabit(undefined);
        setActiveTab(1);
    };

    const doneCount = habits.filter((h) => h.isDoneToday).length;
    const totalCount = habits.length;
    const progressPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const todayLabel = `${dayNames[today.getDay()]}, ${monthNames[today.getMonth()]} ${today.getDate()}`;

    const showNotifBanner = isSupported && permission === 'default' && !notifDismissed;

    const selectedHabit = selectedHabitId ? habits.find((habit) => habit.id === selectedHabitId) ?? null : null;

    useEffect(() => {
        let isMounted = true;

        const loadLogs = async () => {
            if (!selectedHabitId) {
                setDetailLogs([]);
                return;
            }

            setDetailLoading(true);
            try {
                const { data, error: logError } = await supabase
                    .from('habit_logs')
                    .select('log_date')
                    .eq('habit_id', selectedHabitId)
                    .order('log_date', { ascending: false });

                if (!isMounted) return;

                if (logError) throw new Error(logError.message);
                const logDates = (data ?? []).map((log: { log_date: string }) => log.log_date);
                setDetailLogs(logDates);
            } catch (err) {
                if (!isMounted) return;
                const message = err instanceof Error ? err.message : 'Failed to load logs';
                showToast(message, 'error');
            } finally {
                if (isMounted) setDetailLoading(false);
            }
        };

        loadLogs();

        return () => {
            isMounted = false;
        };
    }, [selectedHabitId, showToast]);

    const last30Days = useMemo(() => {
        const days: { date: string; done: boolean; isToday: boolean }[] = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            days.push({
                date: dateStr,
                done: detailLogs.includes(dateStr),
                isToday: i === 0,
            });
        }
        return days;
    }, [detailLogs]);

    const completionRate = useMemo(() => {
        const done = last30Days.filter((day) => day.done).length;
        return Math.round((done / 30) * 100);
    }, [last30Days]);

    const recentLog = useMemo(() => {
        const entries: { date: string; done: boolean }[] = [];
        for (let i = 0; i < 14; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            entries.push({ date: dateStr, done: detailLogs.includes(dateStr) });
        }
        return entries;
    }, [detailLogs]);

    return (
        <div style={{ minHeight: '100vh' }}>
            {renderError && (
                <div style={{ background: '#FF2D9B', color: '#FFF', padding: '20px', fontFamily: "'Syne', sans-serif" }}>
                    <strong>ERROR:</strong> {renderError}
                </div>
            )}
            {!sessionChecked ? (
                <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFAFA' }}>
                    <div className="hf-loader" style={{ width: '80px', height: '80px' }}>
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className="hf-loader__item" />
                        ))}
                    </div>
                </div>
            ) : (
                <>
            <Navbar />
            <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

            <div style={{ maxWidth: '860px', margin: '0 auto', padding: '24px 16px 48px' }}>
                {activeTab === 0 && (
                    <>
                        {showNotifBanner && (
                            <div
                                style={{
                                    background: '#ffe600',
                                    border: '3px solid #000000',
                                    boxShadow: '4px 4px 0px #000000',
                                    padding: '14px 16px',
                                    marginBottom: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '12px',
                                }}
                            >
                                <span style={{ fontWeight: 800, fontSize: '12px', letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Bell size={18} strokeWidth={2} />
                                    ENABLE REMINDERS TO STAY ON TRACK
                                </span>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        className="neo-btn"
                                        onClick={requestPermission}
                                        style={{ background: '#000000', color: '#FFFFFF', padding: '8px 12px', fontSize: '12px' }}
                                    >
                                        Enable
                                    </button>
                                    <button
                                        className="neo-btn"
                                        onClick={() => {
                                            setNotifDismissed(true);
                                            localStorage.setItem('habitforge_notif_dismissed', 'true');
                                        }}
                                        style={{ background: '#FFFFFF', color: '#000000', padding: '8px 12px', fontSize: '12px', letterSpacing: '2px' }}
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="neo-card" style={{ padding: '24px', marginBottom: '16px' }}>
                            <div style={{ fontWeight: 800, fontSize: '12px', letterSpacing: '2px', color: '#666', marginBottom: '6px' }}>
                                TODAY'S PROGRESS
                            </div>
                            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '24px', marginBottom: '6px' }}>
                                {todayLabel.toUpperCase()}
                            </div>
                            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '18px', marginBottom: '10px' }}>
                                {doneCount} / {totalCount} HABITS DONE
                            </div>
                            <div
                                style={{
                                    height: '24px',
                                    background: '#f0f0f0',
                                    border: '3px solid #000000',
                                    overflow: 'hidden',
                                }}
                            >
                                <div
                                    style={{
                                        height: '100%',
                                        width: `${progressPercent}%`,
                                        background: '#22C55E',
                                        transition: 'width 0.3s ease',
                                    }}
                                />
                            </div>
                            {progressPercent === 100 && totalCount > 0 && (
                                <div
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        background: '#000000',
                                        color: '#FFFFFF',
                                        padding: '6px 10px',
                                        marginTop: '10px',
                                        fontFamily: "'JetBrains Mono', monospace",
                                        fontSize: '12px',
                                        fontWeight: 800,
                                    }}
                                >
                                    <Trophy size={16} strokeWidth={2} /> ALL DONE TODAY!
                                </div>
                            )}
                        </div>

                        <button
                            className="neo-btn"
                            onClick={handleAddNew}
                            style={{
                                background: '#ffe600',
                                padding: '16px',
                                fontSize: '18px',
                                width: '100%',
                                marginTop: '16px',
                                marginBottom: '16px',
                                fontFamily: "'Syne', sans-serif",
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                            }}
                        >
                            <Plus size={20} strokeWidth={2} />
                            ADD NEW HABIT
                        </button>

                        {error && (
                            <p style={{ color: '#FF2D9B', fontSize: '14px', textAlign: 'center', marginBottom: '16px', fontFamily: "'JetBrains Mono', monospace" }}>{error}</p>
                        )}

                        {loading && habits.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading habits...</div>
                        )}

                        {!loading && habits.length === 0 && (
                            <div
                                style={{
                                    border: '3px solid #000000',
                                    boxShadow: '4px 4px 0px #000000',
                                    background: '#FFFFFF',
                                    padding: '24px',
                                    textAlign: 'center',
                                }}
                            >
                                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '20px', marginBottom: '6px' }}>NO HABITS YET</div>
                                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: '#666' }}>Add your first habit to get started.</div>
                            </div>
                        )}

                        {habits.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {habits.map((habit) => (
                                    <HabitCard
                                        key={habit.id}
                                        habit={habit}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onToggle={handleToggle}
                                        onViewDetail={(id) => {
                                            setSelectedHabitId(id);
                                            setActiveTab(2);
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}

                {activeTab === 1 && (
                    <div style={{ background: '#FFFFFF', border: '3px solid #000000', boxShadow: '4px 4px 0px #000000', padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '6px' }}>
                            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '28px', textTransform: 'uppercase' }}>
                                {editingHabit ? 'EDIT HABIT' : 'ADD NEW HABIT'}
                            </div>
                            <button
                                className="neo-btn"
                                onClick={() => {
                                    setEditingHabit(undefined);
                                    setFormKey((prev) => prev + 1);
                                }}
                                style={{ background: '#FFE566', padding: '8px 14px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            >
                                <RefreshCw size={14} />
                                RESET
                            </button>
                        </div>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: '#333', marginBottom: '16px' }}>
                            Describe a goal or fill in the form below.
                        </div>
                        {error && (
                            <div style={{ color: '#FF2D9B', fontSize: '13px', marginBottom: '12px', fontFamily: "'JetBrains Mono', monospace" }}>
                                {error}
                            </div>
                        )}
                        <HabitForm
                            key={formKey}
                            initialData={editingHabit}
                            onSave={handleSave}
                            onCancel={() => {
                                setEditingHabit(undefined);
                                setActiveTab(0);
                            }}
                        />
                    </div>
                )}

                {activeTab === 2 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {!selectedHabit && (
                            <div
                                style={{
                                    border: '3px solid #000000',
                                    boxShadow: '4px 4px 0px #000000',
                                    background: '#FFFFFF',
                                    padding: '32px',
                                    textAlign: 'center',
                                }}
                            >
                                <div
                                    style={{
                                        width: '64px',
                                        height: '64px',
                                        border: '3px solid #000000',
                                        background: '#FFE566',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 12px',
                                    }}
                                >
                                    <BarChart2 size={28} strokeWidth={2} />
                                </div>
                                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '24px', marginBottom: '6px' }}>
                                    SELECT A HABIT
                                </div>
                                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: '#666' }}>
                                    Tap the chart icon on any habit to view its details.
                                </div>
                            </div>
                        )}

                        {selectedHabit && (
                            <>
                                <div
                                    style={{
                                        background: selectedHabit.color,
                                        border: '3px solid #000000',
                                        boxShadow: '5px 5px 0 #000000',
                                        padding: '24px',
                                        marginBottom: '16px',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                        <div
                                            style={{
                                                width: '56px',
                                                height: '56px',
                                                border: '3px solid #000000',
                                                background: '#FFFFFF',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxShadow: '3px 3px 0px #000000',
                                            }}
                                        >
                                            <HabitIcon iconId={selectedHabit.icon} size={28} />
                                        </div>
                                        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '24px', textTransform: 'uppercase' }}>
                                            {selectedHabit.name}
                                        </div>
                                    </div>
                                    {selectedHabit.description && (
                                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: '#333' }}>
                                            {selectedHabit.description}
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                                    {[
                                        { label: 'CURRENT STREAK', value: selectedHabit.currentStreak, prefix: '🔥 ' },
                                        { label: 'BEST STREAK', value: selectedHabit.bestStreak, prefix: '' },
                                        { label: 'THIS MONTH', value: `${completionRate}%`, prefix: '' },
                                    ].map((stat) => (
                                        <div
                                            key={stat.label}
                                            style={{
                                                background: '#FFFFFF',
                                                border: '3px solid #000000',
                                                boxShadow: '3px 3px 0 #000000',
                                                padding: '16px',
                                                textAlign: 'center',
                                                flex: 1,
                                            }}
                                        >
                                            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '36px', fontWeight: 700 }}>
                                                {`${stat.prefix}${stat.value}`}
                                            </div>
                                            <div
                                                style={{
                                                    fontFamily: "'Syne', sans-serif",
                                                    fontWeight: 800,
                                                    fontSize: '10px',
                                                    letterSpacing: '2px',
                                                    color: '#666',
                                                    marginTop: '4px',
                                                }}
                                            >
                                                {stat.label}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ marginBottom: '16px' }}>
                                    <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, textTransform: 'uppercase', marginBottom: '12px' }}>
                                        30-DAY HISTORY
                                    </div>
                                    <div
                                        style={{
                                            background: '#FFFFFF',
                                            border: '3px solid #000000',
                                            boxShadow: '4px 4px 0 #000000',
                                            padding: '20px',
                                        }}
                                    >
                                        {detailLoading ? (
                                            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: '#666' }}>Loading history...</div>
                                        ) : (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 32px)', gap: '6px' }}>
                                                {last30Days.map((day) => (
                                                    <div
                                                        key={day.date}
                                                        style={{
                                                            width: '32px',
                                                            height: '32px',
                                                            border: day.isToday ? '3px solid #000000' : '2px solid #000000',
                                                            background: day.done ? '#22C55E' : '#f0f0f0',
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                        <div style={{ marginTop: '12px', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}>
                                            □ Missed  ■ Done
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, textTransform: 'uppercase', marginBottom: '12px' }}>
                                        RECENT LOG
                                    </div>
                                    <div style={{ background: '#FFFFFF', border: '3px solid #000000', boxShadow: '4px 4px 0 #000000', padding: 0 }}>
                                        {detailLoading ? (
                                            <div style={{ padding: '16px', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: '#666' }}>Loading log...</div>
                                        ) : (
                                            recentLog.map((entry) => (
                                                <div
                                                    key={entry.date}
                                                    style={{
                                                        borderBottom: '2px solid #000000',
                                                        padding: '12px 16px',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                    }}
                                                >
                                                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '14px', fontWeight: 600 }}>
                                                        {entry.date}
                                                    </span>
                                                    <span
                                                        style={{
                                                            background: entry.done ? '#22C55E' : '#f0f0f0',
                                                            color: entry.done ? '#FFFFFF' : '#666',
                                                            border: '2px solid #000000',
                                                            padding: '3px 12px',
                                                            fontFamily: "'Syne', sans-serif",
                                                            fontWeight: 800,
                                                            fontSize: '11px',
                                                            textTransform: 'uppercase',
                                                        }}
                                                    >
                                                        {entry.done ? 'DONE' : 'MISSED'}
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    visible={!!toast}
                    onClose={() => setToast(null)}
                />
            )}
            </>
            )}
        </div>
    );
};

export default DashboardPage;
