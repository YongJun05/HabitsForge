/**
 * Dashboard page — main authenticated app surface.
 * Hosts a 3-tab layout for dashboard, add habit, and details.
 */
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Plus, BarChart2, RefreshCw, Search, X, Filter } from 'lucide-react';
import confetti from 'canvas-confetti';
import Navbar from '../components/layout/Navbar';
import TabBar from '../components/layout/TabBar';
import HabitCard from '../components/habits/HabitCard';
import HabitForm from '../components/habits/HabitForm';
import HabitHeatmap from '../components/habits/HabitHeatmap';
import StatsCard from '../components/habits/StatsCard';
import BestDayChart from '../components/habits/BestDayChart';
import HabitIcon from '../components/ui/HabitIcon';
import Spinner from '../components/ui/Spinner';
import Toast from '../components/ui/Toast';
import Footer from '../components/layout/Footer';
import { supabase } from '../lib/supabase';
import { useHabits } from '../hooks/useHabits';
import { useNotifications } from '../hooks/useNotifications';
import { getMilestoneBadge } from '../lib/streakUtils';
import type { Habit, HabitWithStreak } from '../types';
import { useWindowSize } from '../hooks/useWindowSize';

/** Format a date string to friendly relative/short label */
function formatLogDate(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffMs = today.getTime() - d.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${dayNames[d.getDay()]}, ${monthNames[d.getMonth()]} ${d.getDate()}`;
}

const DashboardPage: React.FC = () => {
    const location = useLocation();
    const { isMobile } = useWindowSize();
    const { habits, loading, error, createHabit, updateHabit, deleteHabit, toggleDone, freezeHabit, reorderHabit } = useHabits();
    const { permission, requestPermission, isSupported, handleSubscribePush } = useNotifications();

    const [activeTab, setActiveTab] = useState(0);
    const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
    const [detailLogs, setDetailLogs] = useState<string[]>([]);
    const [detailLoading, setDetailLoading] = useState(false);
    const [editingHabit, setEditingHabit] = useState<HabitWithStreak | undefined>(undefined);
    const [formKey, setFormKey] = useState(0);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [notifDismissed, setNotifDismissed] = useState(() => localStorage.getItem('habitsforge_notif_dismissed') === 'true');

    // Confetti: track previous done count to detect new full completion
    const prevDoneCountRef = useRef<number>(-1);

    // Drag and drop state
    const [draggedHabitId, setDraggedHabitId] = useState<string | null>(null);
    const [dragOverHabitId, setDragOverHabitId] = useState<string | null>(null);

    // Search, sort & filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'default' | 'name' | 'streak' | 'newest' | 'status'>('default');
    const [filterBy, setFilterBy] = useState<'all' | 'done' | 'not-done'>('all');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // Collapsible toolbar state
    const [toolbarExpanded, setToolbarExpanded] = useState(false);

    // Detail tab: notes map for recent log
    const [detailLogNotes, setDetailLogNotes] = useState<Map<string, string | null>>(new Map());

    useEffect(() => {
        document.title = 'HabitsForge — Dashboard';
    }, []);

    useEffect(() => {
        const state = location.state as { activeTab?: number; selectedHabitId?: string } | null;
        if (typeof state?.activeTab === 'number') {
            setActiveTab(state.activeTab);
        }
        if (state?.selectedHabitId) {
            setSelectedHabitId(state.selectedHabitId);
        }
    }, [location.state]);

    // Scroll to habit card when selected in Dashboard tab (e.g. from notification)
    useEffect(() => {
        if (activeTab === 0 && selectedHabitId) {
            setTimeout(() => {
                const element = document.getElementById(`habit-card-${selectedHabitId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Briefly highlight the card
                    const originalShadow = element.style.boxShadow;
                    element.style.transition = 'box-shadow 0.3s ease';
                    element.style.boxShadow = '0 0 0 4px #FF2D9B, 4px 4px 0px #000000';
                    setTimeout(() => {
                        element.style.boxShadow = originalShadow;
                    }, 2000);
                }
            }, 100);
        }
    }, [activeTab, selectedHabitId, habits]);


    // Auto-select first habit for details tab if none selected
    useEffect(() => {
        if (activeTab === 2 && !selectedHabitId && habits.length > 0) {
            setSelectedHabitId(habits[0].id);
        }
    }, [activeTab, selectedHabitId, habits]);

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

    const handleToggle = async (id: string, note?: string | null) => {
        try {
            const habit = habits.find((h) => h.id === id);
            const prevStreak = habit?.currentStreak ?? 0;
            await toggleDone(id, note);
            if (habit && !habit.isDoneToday) {
                showToast('HABIT CHECKED OFF!');
                // Check for milestone achievement after toggle
                const newStreak = prevStreak + 1;
                const prevMilestone = getMilestoneBadge(prevStreak);
                const newMilestone = getMilestoneBadge(newStreak);
                if (newMilestone && (!prevMilestone || prevMilestone.label !== newMilestone.label)) {
                    setTimeout(() => {
                        setToast({ message: `🎉 MILESTONE UNLOCKED: ${newMilestone.label}!`, type: 'info' });
                    }, 1500);
                }
            } else {
                showToast('HABIT UNCHECKED');
            }
        } catch {
            showToast('FAILED TO TOGGLE', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteHabit(id);
            // Clear selection if deleted habit was selected
            if (selectedHabitId === id) {
                setSelectedHabitId(null);
            }
            showToast('HABIT ARCHIVED');
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

    const handleFreeze = async (id: string) => {
        try {
            await freezeHabit(id);
            showToast('STREAK FREEZE ACTIVATED! 🧊');
        } catch {
            showToast('FAILED TO FREEZE', 'error');
        }
    };

    // Drag and drop handlers
    const handleDragStart = (_e: React.DragEvent, id: string) => {
        setDraggedHabitId(id);
    };

    const handleDragOverCard = (e: React.DragEvent, id: string) => {
        e.preventDefault();
        setDragOverHabitId(id);
    };

    const handleDrop = async (_e: React.DragEvent, targetId: string) => {
        if (!draggedHabitId || draggedHabitId === targetId) {
            setDraggedHabitId(null);
            setDragOverHabitId(null);
            return;
        }
        const draggedIdx = habits.findIndex((h) => h.id === draggedHabitId);
        const targetIdx = habits.findIndex((h) => h.id === targetId);
        if (draggedIdx === -1 || targetIdx === -1) return;

        // Update sort_order for all affected habits
        const newHabits = [...habits];
        const [moved] = newHabits.splice(draggedIdx, 1);
        newHabits.splice(targetIdx, 0, moved);

        // Assign new sort orders
        const updates = newHabits.map((h, i) => reorderHabit(h.id, i));
        try {
            await Promise.all(updates);
        } catch {
            showToast('FAILED TO REORDER', 'error');
        }

        setDraggedHabitId(null);
        setDragOverHabitId(null);
    };

    const doneCount = habits.filter((h) => h.isDoneToday).length;
    const totalCount = habits.length;
    const progressPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

    const today = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const todayLabel = `${dayNames[today.getDay()]}, ${monthNames[today.getMonth()]} ${today.getDate()}`;

    const showNotifBanner = isSupported && permission === 'default' && !notifDismissed;

    const categories = useMemo(() => {
        const cats = new Set<string>();
        habits.forEach(h => {
            if (h.category) cats.add(h.category);
        });
        return Array.from(cats).sort();
    }, [habits]);

    // Search, sort & filter logic
    const isCustomView = searchQuery.trim() !== '' || sortBy !== 'default' || filterBy !== 'all' || selectedCategory !== null;

    const filteredHabits = useMemo(() => {
        let result = [...habits];

        // Search filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(h =>
                h.name.toLowerCase().includes(q) ||
                (h.description?.toLowerCase().includes(q) ?? false)
            );
        }

        // Status filter
        if (filterBy === 'done') {
            result = result.filter(h => h.isDoneToday);
        } else if (filterBy === 'not-done') {
            result = result.filter(h => !h.isDoneToday);
        }

        // Category filter
        if (selectedCategory) {
            result = result.filter(h => h.category === selectedCategory);
        }

        // Sort
        switch (sortBy) {
            case 'name':
                result.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'streak':
                result.sort((a, b) => b.currentStreak - a.currentStreak);
                break;
            case 'newest':
                result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                break;
            case 'status':
                result.sort((a, b) => Number(a.isDoneToday) - Number(b.isDoneToday));
                break;
            default:
                break;
        }

        return result;
    }, [habits, searchQuery, sortBy, filterBy, selectedCategory]);

    // Confetti on full completion
    useEffect(() => {
        if (prevDoneCountRef.current === -1) {
            prevDoneCountRef.current = doneCount;
            return;
        }
        if (doneCount === totalCount && totalCount > 0 && prevDoneCountRef.current < totalCount) {
            confetti({
                particleCount: 150,
                spread: 80,
                origin: { y: 0.6 },
                colors: ['#FFE566', '#22C55E', '#FF2D9B', '#2563EB', '#000000'],
            });
        }
        prevDoneCountRef.current = doneCount;
    }, [doneCount, totalCount]);

    const selectedHabit = selectedHabitId ? habits.find((habit) => habit.id === selectedHabitId) ?? null : null;

    // Fetch full log history for the selected habit (details tab)
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
                    .select('log_date, note')
                    .eq('habit_id', selectedHabitId)
                    .order('log_date', { ascending: false });

                if (!isMounted) return;

                if (logError) throw new Error(logError.message);
                const logs = data ?? [];
                const logDates = logs.map((log: { log_date: string }) => log.log_date);
                setDetailLogs(logDates);

                // Build notes map
                const notesMap = new Map<string, string | null>();
                for (const log of logs) {
                    const l = log as { log_date: string; note?: string | null };
                    if (l.note) notesMap.set(l.log_date, l.note);
                }
                setDetailLogNotes(notesMap);
            } catch (err) {
                if (!isMounted) return;
                console.error('Failed to load detail logs:', err);
            } finally {
                if (isMounted) setDetailLoading(false);
            }
        };

        loadLogs();

        return () => {
            isMounted = false;
        };
    }, [selectedHabitId]);

    const last30Days = useMemo(() => {
        const days: { date: string; done: boolean; isToday: boolean }[] = [];
        const logSet = new Set(detailLogs);
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            days.push({
                date: dateStr,
                done: logSet.has(dateStr),
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
        if (!selectedHabit) return [];
        const entries: { date: string; done: boolean; note?: string | null }[] = [];
        const logSet = new Set(detailLogs);

        const createdDate = new Date(selectedHabit.created_at);
        createdDate.setHours(0, 0, 0, 0);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const diffTime = today.getTime() - createdDate.getTime();
        const daysSinceCreation = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
        const maxDays = Math.min(14, daysSinceCreation + 1);

        for (let i = 0; i < maxDays; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            entries.push({ date: dateStr, done: logSet.has(dateStr), note: detailLogNotes.get(dateStr) ?? null });
        }
        return entries;
    }, [detailLogs, detailLogNotes, selectedHabit]);

    // Full-page loading state — shown while habits are being fetched for the first time
    if (loading && habits.length === 0) {
        return (
            <div style={{ minHeight: '100vh' }}>
                <Navbar />
                <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
                    <Spinner size="lg" />
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '14px', fontWeight: 700, letterSpacing: '2px', color: '#666' }}>
                        LOADING YOUR HABITS...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh' }}>
            <Navbar />
            <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

            <div style={{ maxWidth: isMobile ? '100%' : '860px', margin: '0 auto', padding: isMobile ? '16px 16px 40px' : '24px 16px 48px', boxSizing: 'border-box', overflowX: 'hidden' }}>
                {activeTab === 0 && (
                    <>
                        {showNotifBanner && (
                            <div
                                style={{
                                    background: '#ffe600',
                                    border: '3px solid #000000',
                                    boxShadow: '4px 4px 0px #000000',
                                    padding: isMobile ? '12px' : '14px 16px',
                                    marginBottom: '16px',
                                    display: 'flex',
                                    flexDirection: isMobile ? 'column' : 'row',
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
                                        onClick={async () => {
                                            await requestPermission();
                                            await handleSubscribePush();
                                        }}
                                        style={{ background: '#000000', color: '#FFFFFF', padding: '8px 12px', fontSize: '12px', minHeight: '44px' }}
                                    >
                                        Enable
                                    </button>
                                    <button
                                        className="neo-btn"
                                        onClick={() => {
                                            setNotifDismissed(true);
                                            localStorage.setItem('habitsforge_notif_dismissed', 'true');
                                        }}
                                        style={{ background: '#FFFFFF', color: '#000000', padding: '8px 12px', fontSize: '12px', letterSpacing: '2px', minHeight: '44px' }}
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Compact progress banner */}
                        {progressPercent === 100 && totalCount > 0 ? (
                            <div
                                style={{
                                    background: '#FFE566',
                                    border: '3px solid #000000',
                                    boxShadow: '4px 4px 0px #000000',
                                    padding: '14px 20px',
                                    textAlign: 'center',
                                    marginBottom: '16px',
                                }}
                            >
                                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '20px', textTransform: 'uppercase' }}>
                                    🎉 ALL HABITS DONE TODAY!
                                </div>
                            </div>
                        ) : (
                            <div className="neo-progress-banner" style={{ marginBottom: '16px' }}>
                                <span className="neo-progress-banner__label">
                                    {todayLabel.toUpperCase()}
                                </span>
                                <div className="neo-progress-banner__bar">
                                    <div
                                        className="neo-progress-banner__fill"
                                        style={{
                                            width: `${progressPercent}%`,
                                            background: '#22C55E',
                                        }}
                                    />
                                </div>
                                <span className="neo-progress-banner__count">
                                    {doneCount}/{totalCount}
                                </span>
                            </div>
                        )}

                        {error && (
                            <p style={{ color: '#FF2D9B', fontSize: '14px', textAlign: 'center', marginBottom: '16px', fontFamily: "'JetBrains Mono', monospace" }}>{error}</p>
                        )}

                        {!loading && habits.length === 0 && (
                            <div
                                style={{
                                    border: '3px solid #000000',
                                    boxShadow: '4px 4px 0px #000000',
                                    background: '#FFFFFF',
                                    padding: isMobile ? '16px' : '24px',
                                    textAlign: 'center',
                                }}
                            >
                                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '20px', marginBottom: '6px' }}>NO HABITS YET</div>
                                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: '#666', marginBottom: '16px' }}>Add your first habit to get started.</div>
                                <button
                                    className="neo-btn"
                                    onClick={handleAddNew}
                                    style={{
                                        background: '#ffe600',
                                        padding: '12px 20px',
                                        fontSize: '14px',
                                        fontFamily: "'Syne', sans-serif",
                                        fontWeight: 800,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        minHeight: '44px',
                                    }}
                                >
                                    <Plus size={18} strokeWidth={2} />
                                    ADD NEW HABIT
                                </button>
                            </div>
                        )}

                        {habits.length > 0 && (
                            <>
                                {/* Compact toolbar: Search + Add button + Filter toggle */}
                                <div
                                    style={{
                                        background: '#FFFFFF',
                                        border: '3px solid #000000',
                                        boxShadow: '4px 4px 0px #000000',
                                        padding: isMobile ? '12px' : '16px',
                                        marginBottom: '12px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '12px',
                                    }}
                                >
                                    {/* Top row: Search + Add New Habit button */}
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                                        {/* Search input */}
                                        <div style={{ position: 'relative', flex: 1 }}>
                                            <Search
                                                size={16}
                                                strokeWidth={2.5}
                                                style={{
                                                    position: 'absolute',
                                                    left: '12px',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    color: '#999',
                                                    pointerEvents: 'none',
                                                }}
                                            />
                                            <input
                                                className="neo-input"
                                                type="text"
                                                placeholder="Search habits..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                style={{
                                                    paddingLeft: '36px',
                                                    paddingRight: searchQuery ? '36px' : undefined,
                                                    fontSize: isMobile ? '16px' : '14px',
                                                }}
                                            />
                                            {searchQuery && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSearchQuery('')}
                                                    style={{
                                                        position: 'absolute',
                                                        right: '8px',
                                                        top: '50%',
                                                        transform: 'translateY(-50%)',
                                                        background: '#000',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        color: '#FFF',
                                                        padding: '2px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        width: '20px',
                                                        height: '20px',
                                                    }}
                                                >
                                                    <X size={12} strokeWidth={3} />
                                                </button>
                                            )}
                                        </div>

                                        {/* Filter toggle button */}
                                        <button
                                            className="neo-btn"
                                            onClick={() => setToolbarExpanded((prev) => !prev)}
                                            style={{
                                                background: toolbarExpanded || isCustomView ? '#000000' : '#FFFFFF',
                                                color: toolbarExpanded || isCustomView ? '#FFFFFF' : '#000000',
                                                padding: isMobile ? '8px 10px' : '8px 14px',
                                                fontSize: '12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                minHeight: '44px',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            <Filter size={14} strokeWidth={2.5} />
                                            {!isMobile && 'FILTER'}
                                        </button>

                                        {/* Add New Habit button — compact inline */}
                                        <button
                                            className="neo-btn"
                                            onClick={handleAddNew}
                                            style={{
                                                background: '#ffe600',
                                                padding: isMobile ? '8px 10px' : '8px 14px',
                                                fontSize: '12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                minHeight: '44px',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            <Plus size={16} strokeWidth={2.5} />
                                            {!isMobile && 'ADD'}
                                        </button>
                                    </div>

                                    {/* Expandable filter/sort section */}
                                    <div
                                        className={`neo-collapse-wrapper ${toolbarExpanded ? 'neo-collapse-wrapper--open' : 'neo-collapse-wrapper--closed'}`}
                                        style={{ maxHeight: toolbarExpanded ? '300px' : 0 }}
                                    >
                                        {/* Filter chips + Sort dropdown */}
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                flexWrap: 'wrap',
                                            }}
                                        >
                                            {(['all', 'not-done', 'done'] as const).map((f) => {
                                                const labels: Record<typeof f, string> = { all: 'ALL', 'not-done': 'NOT DONE', done: 'DONE ✓' };
                                                const isActive = filterBy === f;
                                                return (
                                                    <button
                                                        key={f}
                                                        onClick={() => setFilterBy(f)}
                                                        style={{
                                                            background: isActive ? '#000000' : '#FFFFFF',
                                                            color: isActive ? '#FFFFFF' : '#000000',
                                                            border: '2px solid #000000',
                                                            padding: isMobile ? '8px 12px' : '6px 14px',
                                                            fontFamily: "'Syne', sans-serif",
                                                            fontWeight: 800,
                                                            fontSize: '11px',
                                                            letterSpacing: '1px',
                                                            cursor: 'pointer',
                                                            textTransform: 'uppercase',
                                                            boxShadow: isActive ? 'none' : '2px 2px 0px #000000',
                                                            transform: isActive ? 'translate(2px, 2px)' : 'none',
                                                            transition: 'all 0.1s ease',
                                                            minHeight: isMobile ? '40px' : '34px',
                                                        }}
                                                    >
                                                        {labels[f]}
                                                    </button>
                                                );
                                            })}

                                            <div style={{ flex: 1 }} />

                                            {/* Sort dropdown */}
                                            <select
                                                value={sortBy}
                                                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                                                style={{
                                                    border: '2px solid #000000',
                                                    boxShadow: '2px 2px 0px #000000',
                                                    padding: isMobile ? '8px 10px' : '6px 10px',
                                                    fontFamily: "'JetBrains Mono', monospace",
                                                    fontSize: '11px',
                                                    fontWeight: 700,
                                                    background: '#FFFFFF',
                                                    cursor: 'pointer',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '1px',
                                                    minHeight: isMobile ? '40px' : '34px',
                                                    borderRadius: 0,
                                                }}
                                            >
                                                <option value="default">SORT: DEFAULT</option>
                                                <option value="name">SORT: NAME A→Z</option>
                                                <option value="streak">SORT: STREAK ↓</option>
                                                <option value="newest">SORT: NEWEST</option>
                                                <option value="status">SORT: UNDONE FIRST</option>
                                            </select>
                                        </div>

                                        {/* Category Filter */}
                                        {categories.length > 0 && (
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    flexWrap: 'wrap',
                                                    marginTop: '12px',
                                                    paddingTop: '12px',
                                                    borderTop: '2px dashed #e0e0e0',
                                                }}
                                            >
                                                <button
                                                    onClick={() => setSelectedCategory(null)}
                                                    style={{
                                                        background: selectedCategory === null ? '#000000' : '#FFFFFF',
                                                        color: selectedCategory === null ? '#FFFFFF' : '#000000',
                                                        border: '2px solid #000000',
                                                        padding: '4px 10px',
                                                        fontFamily: "'Syne', sans-serif",
                                                        fontWeight: 800,
                                                        fontSize: '10px',
                                                        letterSpacing: '1px',
                                                        cursor: 'pointer',
                                                        textTransform: 'uppercase',
                                                        boxShadow: selectedCategory === null ? 'none' : '2px 2px 0px #000000',
                                                        transform: selectedCategory === null ? 'translate(2px, 2px)' : 'none',
                                                        transition: 'all 0.1s ease',
                                                    }}
                                                >
                                                    ALL CATEGORIES
                                                </button>
                                                {categories.map((cat) => (
                                                    <button
                                                        key={cat}
                                                        onClick={() => setSelectedCategory(cat)}
                                                        style={{
                                                            background: selectedCategory === cat ? '#000000' : '#FFFFFF',
                                                            color: selectedCategory === cat ? '#FFFFFF' : '#000000',
                                                            border: '2px solid #000000',
                                                            padding: '4px 10px',
                                                            fontFamily: "'Syne', sans-serif",
                                                            fontWeight: 800,
                                                            fontSize: '10px',
                                                            letterSpacing: '1px',
                                                            cursor: 'pointer',
                                                            textTransform: 'uppercase',
                                                            boxShadow: selectedCategory === cat ? 'none' : '2px 2px 0px #000000',
                                                            transform: selectedCategory === cat ? 'translate(2px, 2px)' : 'none',
                                                            transition: 'all 0.1s ease',
                                                        }}
                                                    >
                                                        # {cat}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Results count when filtered */}
                                    {isCustomView && (
                                        <div
                                            style={{
                                                fontFamily: "'JetBrains Mono', monospace",
                                                fontSize: '12px',
                                                color: '#666',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                            }}
                                        >
                                            <span>
                                                Showing {filteredHabits.length} of {habits.length} habits
                                            </span>
                                            <button
                                                onClick={() => {
                                                    setSearchQuery('');
                                                    setSortBy('default');
                                                    setFilterBy('all');
                                                    setSelectedCategory(null);
                                                }}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    fontFamily: "'JetBrains Mono', monospace",
                                                    fontSize: '12px',
                                                    fontWeight: 700,
                                                    color: '#2563EB',
                                                    textDecoration: 'underline',
                                                    padding: 0,
                                                }}
                                            >
                                                Clear filters
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Habit cards — now ABOVE stats */}
                                {filteredHabits.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {filteredHabits.map((habit) => (
                                            <HabitCard
                                                key={habit.id}
                                                habit={habit}
                                                onEdit={handleEdit}
                                                onDelete={handleDelete}
                                                onToggle={handleToggle}
                                                onFreeze={handleFreeze}
                                                onViewDetail={(id) => {
                                                    setSelectedHabitId(id);
                                                    setActiveTab(2);
                                                }}
                                                draggable={!isCustomView}
                                                onDragStart={handleDragStart}
                                                onDragOver={(e) => handleDragOverCard(e, habit.id)}
                                                onDrop={handleDrop}
                                                isDragOver={dragOverHabitId === habit.id}
                                                isDragging={draggedHabitId === habit.id}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div
                                        style={{
                                            border: '3px solid #000000',
                                            boxShadow: '4px 4px 0px #000000',
                                            background: '#FFFFFF',
                                            padding: isMobile ? '16px' : '24px',
                                            textAlign: 'center',
                                        }}
                                    >
                                        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '20px', marginBottom: '6px' }}>
                                            NO MATCHING HABITS
                                        </div>
                                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: '#666' }}>
                                            Try adjusting your search or filters.
                                        </div>
                                    </div>
                                )}

                                {/* Stats & Analytics — BELOW habit cards */}
                                {habits.length > 0 && (
                                    <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <StatsCard habits={habits} defaultCollapsed />
                                        {habits.some(h => h.allLogDates.length > 0) && (
                                            <BestDayChart habits={habits} defaultCollapsed />
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}

                {activeTab === 1 && (
                    <div style={{ background: '#FFFFFF', border: '3px solid #000000', boxShadow: '4px 4px 0px #000000', padding: isMobile ? '16px' : '24px' }}>
                        <div style={{ display: 'flex', alignItems: isMobile ? 'stretch' : 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '6px', flexDirection: isMobile ? 'column' : 'row' }}>
                            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: isMobile ? '22px' : '28px', textTransform: 'uppercase' }}>
                                {editingHabit ? 'EDIT HABIT' : 'ADD NEW HABIT'}
                            </div>
                            <button
                                className="neo-btn"
                                onClick={() => {
                                    setEditingHabit(undefined);
                                    setFormKey((prev) => prev + 1);
                                }}
                                style={{ background: '#FFE566', padding: '8px 14px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', minHeight: '44px' }}
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
                        {/* Habit selector — horizontal scrollable pill strip */}
                        {habits.length > 0 && (
                            <div
                                style={{
                                    background: '#FFFFFF',
                                    border: '3px solid #000000',
                                    boxShadow: '4px 4px 0px #000000',
                                    padding: '16px',
                                }}
                            >
                                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '12px', letterSpacing: '2px', marginBottom: '10px', color: '#666' }}>
                                    SELECT HABIT
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '4px 0 8px' }}>
                                    {habits.map((h) => (
                                        <button
                                            key={h.id}
                                            className={`neo-pill ${selectedHabitId === h.id ? 'neo-pill--active' : ''}`}
                                            onClick={() => setSelectedHabitId(h.id)}
                                            style={{
                                                background: selectedHabitId === h.id ? h.color : '#FFFFFF',
                                                color: selectedHabitId === h.id && (h.color === '#000000') ? '#FFFFFF' : '#000000',
                                            }}
                                        >
                                            <HabitIcon iconId={h.icon} size={14} />
                                            {h.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!selectedHabit && habits.length === 0 && (
                            <div
                                style={{
                                    border: '3px solid #000000',
                                    boxShadow: '4px 4px 0px #000000',
                                    background: '#FFFFFF',
                                        padding: isMobile ? '20px' : '32px',
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
                                    NO HABITS YET
                                </div>
                                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: '#666' }}>
                                    Add a habit first to view its details here.
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
                                        padding: isMobile ? '16px' : '24px',
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
                                        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: isMobile ? '20px' : '24px', textTransform: 'uppercase' }}>
                                            {selectedHabit.name}
                                        </div>
                                    </div>
                                    {selectedHabit.description && (
                                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: '#333' }}>
                                            {selectedHabit.description}
                                        </div>
                                    )}
                                </div>

                                {/* Hero streak stat + supporting stats */}
                                <div style={{ display: 'flex', gap: isMobile ? '8px' : '12px', marginBottom: '0' }}>
                                    {/* Hero Current Streak — prominently large */}
                                    <div
                                        style={{
                                            background: '#FFF8E1',
                                            border: '3px solid #000000',
                                            boxShadow: '4px 4px 0 #000000',
                                            padding: isMobile ? '14px 10px' : '20px',
                                            textAlign: 'center',
                                            flex: 1.5,
                                        }}
                                    >
                                        <div style={{
                                            fontFamily: "'JetBrains Mono', monospace",
                                            fontSize: isMobile ? '36px' : '52px',
                                            fontWeight: 700,
                                            lineHeight: 1,
                                        }}>
                                            🔥 {selectedHabit.currentStreak}
                                        </div>
                                        <div
                                            style={{
                                                fontFamily: "'Syne', sans-serif",
                                                fontWeight: 800,
                                                fontSize: isMobile ? '10px' : '12px',
                                                letterSpacing: '2px',
                                                color: '#B8860B',
                                                marginTop: '6px',
                                            }}
                                        >
                                            CURRENT STREAK
                                        </div>
                                    </div>

                                    {/* Supporting stats stacked */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '8px' : '12px', flex: 1 }}>
                                        <div
                                            style={{
                                                background: '#FFFFFF',
                                                border: '3px solid #000000',
                                                boxShadow: '3px 3px 0 #000000',
                                                padding: isMobile ? '10px 8px' : '14px',
                                                textAlign: 'center',
                                                flex: 1,
                                            }}
                                        >
                                            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: isMobile ? '20px' : '28px', fontWeight: 700 }}>
                                                {selectedHabit.bestStreak}
                                            </div>
                                            <div
                                                style={{
                                                    fontFamily: "'Syne', sans-serif",
                                                    fontWeight: 800,
                                                    fontSize: isMobile ? '9px' : '10px',
                                                    letterSpacing: '2px',
                                                    color: '#666',
                                                    marginTop: '2px',
                                                }}
                                            >
                                                BEST STREAK
                                            </div>
                                        </div>
                                        <div
                                            style={{
                                                background: '#FFFFFF',
                                                border: '3px solid #000000',
                                                boxShadow: '3px 3px 0 #000000',
                                                padding: isMobile ? '10px 8px' : '14px',
                                                textAlign: 'center',
                                                flex: 1,
                                            }}
                                        >
                                            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: isMobile ? '20px' : '28px', fontWeight: 700 }}>
                                                {completionRate}%
                                            </div>
                                            <div
                                                style={{
                                                    fontFamily: "'Syne', sans-serif",
                                                    fontWeight: 800,
                                                    fontSize: isMobile ? '9px' : '10px',
                                                    letterSpacing: '2px',
                                                    color: '#666',
                                                    marginTop: '2px',
                                                }}
                                            >
                                                THIS MONTH
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 30-day heatmap */}
                                <div
                                    style={{
                                        background: '#FFFFFF',
                                        border: '3px solid #000000',
                                        boxShadow: '4px 4px 0 #000000',
                                        padding: isMobile ? '12px' : '20px',
                                    }}
                                >
                                    {detailLoading ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 0' }}>
                                            <Spinner size="sm" />
                                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: '#666' }}>Loading history...</span>
                                        </div>
                                    ) : (
                                        <HabitHeatmap logs={detailLogs} />
                                    )}
                                </div>

                                {/* Recent log — with formatted dates and dot indicators */}
                                <div>
                                    <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, textTransform: 'uppercase', marginBottom: '12px' }}>
                                        RECENT LOG
                                    </div>
                                    <div style={{ background: '#FFFFFF', border: '3px solid #000000', boxShadow: '4px 4px 0 #000000', padding: 0 }}>
                                        {detailLoading ? (
                                            <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <Spinner size="sm" />
                                                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: '#666' }}>Loading log...</span>
                                            </div>
                                        ) : (
                                            recentLog.map((entry, idx) => (
                                                <div
                                                    key={entry.date}
                                                    style={{
                                                        borderBottom: idx < recentLog.length - 1 ? '2px solid #000000' : 'none',
                                                        padding: '12px 16px',
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        {/* Color dot indicator */}
                                                        <span className={`log-dot ${entry.done ? 'log-dot--done' : 'log-dot--missed'}`} />
                                                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: isMobile ? '13px' : '14px', fontWeight: 600, flex: 1 }}>
                                                            {formatLogDate(entry.date)}
                                                        </span>
                                                        <span
                                                            style={{
                                                                fontFamily: "'JetBrains Mono', monospace",
                                                                fontSize: '11px',
                                                                fontWeight: 700,
                                                                color: entry.done ? '#22C55E' : '#999',
                                                                textTransform: 'uppercase',
                                                                letterSpacing: '1px',
                                                            }}
                                                        >
                                                            {entry.done ? 'DONE' : 'MISSED'}
                                                        </span>
                                                    </div>
                                                    {entry.note && (
                                                        <div style={{
                                                            fontFamily: "'JetBrains Mono', monospace",
                                                            fontSize: '12px',
                                                            color: '#666',
                                                            fontStyle: 'italic',
                                                            marginTop: '4px',
                                                            marginLeft: '20px',
                                                        }}>
                                                            {entry.note}
                                                        </div>
                                                    )}
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

            <Footer />

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    visible={!!toast}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
};

export default DashboardPage;
