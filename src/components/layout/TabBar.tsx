import React from 'react';
import { LayoutDashboard, Plus, BarChart2 } from 'lucide-react';
import { useWindowSize } from '../../hooks/useWindowSize';

interface TabBarProps {
    activeTab: number;
    onTabChange: (tab: number) => void;
}

const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange }) => {
    const { isMobile } = useWindowSize();
    const tabs = [
        { label: 'DASHBOARD', Icon: LayoutDashboard },
        { label: 'ADD HABIT', Icon: Plus },
        { label: 'DETAILS', Icon: BarChart2 },
    ];

    return (
        <div
            className="hf-tabbar"
            style={{
                display: 'flex',
                overflowX: 'hidden',
            }}
        >
            {tabs.map((tab, index) => (
                <button
                    key={tab.label}
                    className={`hf-tabbar__tab${activeTab === index ? ' hf-tabbar__tab--active' : ''}`}
                    onClick={() => onTabChange(index)}
                    type="button"
                    aria-label={tab.label}
                    title={tab.label}
                    style={{
                        flex: isMobile ? 1 : undefined,
                        padding: isMobile ? '14px 0' : undefined,
                        minHeight: '44px',
                        borderBottom: isMobile && activeTab === index ? '4px solid #000000' : undefined,
                        background: isMobile && activeTab === index ? '#ffe600' : undefined,
                    }}
                >
                    <tab.Icon size={isMobile ? 22 : 16} strokeWidth={2} />
                    {!isMobile && tab.label}
                </button>
            ))}
        </div>
    );
};

export default TabBar;
