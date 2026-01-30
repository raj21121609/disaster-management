import React, { useState } from 'react';
import { Activity, Menu, X, LogOut, User, Bell } from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { cn } from '../lib/utils';
// import './Navbar.css'; // REMOVED

const Navbar = ({ onNavigate, currentPage }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    const { currentUser, userRole, logout, isAuthenticated } = useAuth();
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

    const handleLogout = async () => {
        try {
            await logout();
            onNavigate('landing');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const getNavItems = () => {
        const baseItems = [
            { id: 'dashboard', label: 'LIVE OPERATIONS' },
            { id: 'report', label: 'INCIDENT REPORT' },
        ];

        if (!isAuthenticated) return baseItems;

        switch (userRole) {
            case 'volunteer':
                return [...baseItems, { id: 'volunteer', label: 'MY MISSIONS' }];
            case 'agency':
                return [...baseItems, { id: 'agency', label: 'COMMAND CENTER' }];
            case 'citizen':
            default:
                return [...baseItems, { id: 'pricing', label: 'SUBSCRIPTION' }];
        }
    };

    const navItems = getNavItems();

    const getRoleBadgeVariant = () => {
        switch (userRole) {
            case 'volunteer': return 'success';
            case 'agency': return 'info'; // or generic blue
            case 'citizen': return 'warning';
            default: return 'outline';
        }
    };

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
            <div className="container flex h-16 items-center justify-between px-4 md:px-6">

                {/* Brand */}
                <div
                    className="flex items-center gap-2 cursor-pointer group"
                    onClick={() => onNavigate('landing')}
                >
                    <div className="relative flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 border border-slate-800 group-hover:border-red-900/50 transition-colors">
                        <Activity className="h-5 w-5 text-red-500 animate-pulse-weak" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-bold tracking-tighter text-slate-100 leading-none">
                            CRISIS<span className="text-red-600">.ONE</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 tracking-widest uppercase">
                            Emergency Response System
                        </span>
                    </div>
                </div>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-1">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={cn(
                                "px-4 py-2 text-sm font-medium transition-colors hover:text-white rounded-md",
                                currentPage === item.id
                                    ? "bg-slate-800 text-white shadow-sm ring-1 ring-slate-700"
                                    : "text-slate-400 hover:bg-slate-900"
                            )}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                {/* Desktop Actions */}
                <div className="hidden md:flex items-center gap-4">
                    {isAuthenticated ? (
                        <>
                            {/* Role Badge */}
                            <Badge variant={getRoleBadgeVariant()} className="uppercase text-[10px] tracking-wider">
                                {userRole || 'USER'}
                            </Badge>

                            {/* Notifications */}
                            <div className="relative">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="relative text-slate-400 hover:text-white"
                                    onClick={() => setShowNotifications(!showNotifications)}
                                >
                                    <Bell className="h-5 w-5" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] text-white">
                                            {unreadCount}
                                        </span>
                                    )}
                                </Button>

                                {showNotifications && (
                                    <div className="absolute right-0 mt-2 w-80 rounded-md border border-slate-800 bg-slate-900 shadow-lg p-1 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800">
                                            <span className="text-sm font-semibold text-slate-200">Notifications</span>
                                            {unreadCount > 0 && (
                                                <button onClick={markAllAsRead} className="text-xs text-blue-400 hover:text-blue-300">
                                                    Mark read
                                                </button>
                                            )}
                                        </div>
                                        <div className="max-h-64 overflow-y-auto py-1">
                                            {notifications.length === 0 ? (
                                                <div className="px-4 py-6 text-center text-sm text-slate-500">
                                                    No new alerts
                                                </div>
                                            ) : (
                                                notifications.slice(0, 5).map(notif => (
                                                    <div
                                                        key={notif.id}
                                                        onClick={() => markAsRead(notif.id)}
                                                        className={cn(
                                                            "px-3 py-2 cursor-pointer hover:bg-slate-800/50 transition-colors border-l-2 ml-1 my-1",
                                                            !notif.read ? "border-blue-500 bg-slate-800/30" : "border-transparent opacity-60"
                                                        )}
                                                    >
                                                        <p className="text-sm text-slate-200 line-clamp-2">{notif.message}</p>
                                                        <span className="text-[10px] text-slate-500 mt-1 block">
                                                            {new Date(notif.timestamp).toLocaleTimeString()}
                                                        </span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* User Profile */}
                            <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
                                <div className="text-right hidden lg:block">
                                    <div className="text-sm font-medium text-slate-200 leading-none">
                                        {currentUser?.email?.split('@')[0]}
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleLogout}
                                    title="Logout"
                                    className="text-slate-400 hover:text-red-400 hover:bg-red-950/20"
                                >
                                    <LogOut className="h-5 w-5" />
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => onNavigate('auth')}>
                                Login
                            </Button>
                            <Button variant="critical" size="sm" onClick={() => onNavigate('report')}>
                                SOS REPORT
                            </Button>
                        </div>
                    )}
                </div>

                {/* Mobile Toggle */}
                <button
                    className="md:hidden p-2 text-slate-400 hover:text-white"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="absolute top-16 left-0 w-full bg-slate-900 border-b border-slate-800 p-4 shadow-xl animate-in slide-in-from-top-5 md:hidden">
                        <div className="flex flex-col space-y-2">
                            {navItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => { onNavigate(item.id); setIsMenuOpen(false); }}
                                    className={cn(
                                        "w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-colors",
                                        currentPage === item.id
                                            ? "bg-slate-800 text-white"
                                            : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                                    )}
                                >
                                    {item.label}
                                </button>
                            ))}
                            <div className="h-px bg-slate-800 my-2" />
                            {isAuthenticated ? (
                                <Button
                                    variant="destructive"
                                    className="w-full justify-start"
                                    onClick={handleLogout}
                                >
                                    <LogOut className="mr-2 h-4 w-4" /> Logout
                                </Button>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    <Button variant="outline" onClick={() => onNavigate('auth')}>Login</Button>
                                    <Button variant="critical" onClick={() => onNavigate('report')}>SOS HELP</Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
