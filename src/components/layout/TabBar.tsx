import React from 'react';
import { LayoutDashboard, Plus, BarChart2 } from 'lucide-react';

interface TabBarProps {
    activeTab: number;
    onTabChange: (tab: number) => void;
}

const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange }) => {
    const tabs = [
        { label: 'DASHBOARD', Icon: LayoutDashboard },
        { label: 'ADD HABIT', Icon: Plus },
        { label: 'DETAILS', Icon: BarChart2 },
    ];

    return (
        <div className="hf-tabbar">
            {tabs.map((tab, index) => (
                <button
                    key={tab.label}
                    className={`hf-tabbar__tab${activeTab === index ? ' hf-tabbar__tab--active' : ''}`}
                    onClick={() => onTabChange(index)}
                    type="button"
                >
                    <tab.Icon size={16} strokeWidth={2} />
                    {tab.label}
                </button>
            ))}
        </div>
    );
};

export default TabBar;
