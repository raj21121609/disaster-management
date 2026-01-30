import React, { createContext, useContext, useState } from 'react';
import { cn } from '../../lib/utils';

const TabsContext = createContext(null);

export const Tabs = ({ defaultValue, value, onValueChange, children, className }) => {
    const [activeTab, setActiveTab] = useState(defaultValue || value);

    const handleTabChange = (val) => {
        if (value === undefined) {
            setActiveTab(val);
        }
        onValueChange?.(val);
    };

    const currentTab = value !== undefined ? value : activeTab;

    return (
        <TabsContext.Provider value={{ activeTab: currentTab, setActiveTab: handleTabChange }}>
            <div className={cn("w-full", className)}>
                {children}
            </div>
        </TabsContext.Provider>
    );
};

export const TabsList = ({ children, className }) => {
    return (
        <div className={cn("inline-flex h-10 items-center justify-center rounded-md bg-slate-800/50 p-1 text-slate-400", className)}>
            {children}
        </div>
    );
};

export const TabsTrigger = ({ value, children, className, onClick }) => {
    const { activeTab, setActiveTab } = useContext(TabsContext);
    return (
        <button
            className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                activeTab === value ? "bg-slate-950 text-white shadow-sm" : "hover:bg-slate-800 hover:text-white",
                className
            )}
            onClick={(e) => {
                setActiveTab(value);
                onClick?.(e);
            }}
        >
            {children}
        </button>
    );
};

export const TabsContent = ({ value, children, className }) => {
    const { activeTab } = useContext(TabsContext);
    if (activeTab !== value) return null;
    return (
        <div className={cn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)}>
            {children}
        </div>
    );
};
