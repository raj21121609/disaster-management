import React, { useState } from 'react';
import { Activity, Menu, X, LogOut, User, Bell } from 'lucide-react';
import Button from './Button';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import './Navbar.css';

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
            { id: 'dashboard', label: 'Live Map' },
            { id: 'report', label: 'Report Incident' },
        ];

        if (!isAuthenticated) {
            return baseItems;
        }

        switch (userRole) {
            case 'volunteer':
                return [
                    ...baseItems,
                    { id: 'volunteer', label: 'My Missions' },
                ];
            case 'agency':
                return [
                    ...baseItems,
                    { id: 'agency', label: 'Command Center' },
                ];
            case 'citizen':
            default:
                return baseItems;
        }
    };

    const navItems = getNavItems();

    const getRoleLabel = () => {
        switch (userRole) {
            case 'volunteer': return 'Volunteer';
            case 'agency': return 'Agency';
            case 'citizen': return 'Citizen';
            default: return 'User';
        }
    };

    const getRoleColor = () => {
        switch (userRole) {
            case 'volunteer': return 'var(--color-success)';
            case 'agency': return 'var(--color-info)';
            case 'citizen': return 'var(--color-warning)';
            default: return 'var(--text-secondary)';
        }
    };

    return (
        <nav className="navbar">
            <div className="container navbar-container">
                <div className="navbar-brand" onClick={() => onNavigate('landing')}>
                    <div className="brand-icon">
                        <Activity color="var(--color-emergency)" size={24} />
                    </div>
                    <span className="brand-name">CRISIS<span className="text-emergency">.ONE</span></span>
                </div>

                <div className="navbar-links desktop-only">
                    {navItems.map((item) => (
                        <a
                            key={item.id}
                            href="#"
                            className={`nav-link ${currentPage === item.id ? 'active' : ''}`}
                            onClick={(e) => {
                                e.preventDefault();
                                onNavigate(item.id);
                            }}
                        >
                            {item.label}
                        </a>
                    ))}
                </div>

                <div className="navbar-actions desktop-only">
                    {isAuthenticated ? (
                        <>
                            <div className="notification-wrapper">
                                <button 
                                    className="notification-btn"
                                    onClick={() => setShowNotifications(!showNotifications)}
                                >
                                    <Bell size={20} />
                                    {unreadCount > 0 && (
                                        <span className="notification-badge">{unreadCount}</span>
                                    )}
                                </button>
                                
                                {showNotifications && (
                                    <div className="notification-dropdown">
                                        <div className="notification-header">
                                            <span>Notifications</span>
                                            {unreadCount > 0 && (
                                                <button 
                                                    className="mark-read-btn"
                                                    onClick={markAllAsRead}
                                                >
                                                    Mark all read
                                                </button>
                                            )}
                                        </div>
                                        <div className="notification-list">
                                            {notifications.length === 0 ? (
                                                <div className="notification-empty">
                                                    No notifications
                                                </div>
                                            ) : (
                                                notifications.slice(0, 5).map(notif => (
                                                    <div 
                                                        key={notif.id}
                                                        className={`notification-item ${!notif.read ? 'unread' : ''}`}
                                                        onClick={() => markAsRead(notif.id)}
                                                    >
                                                        <div className={`notification-dot severity-${notif.severity || 'low'}`}></div>
                                                        <div className="notification-content">
                                                            <p>{notif.message}</p>
                                                            <span className="notification-time">
                                                                {new Date(notif.timestamp).toLocaleTimeString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="user-info">
                                <div className="user-avatar">
                                    <User size={16} />
                                </div>
                                <div className="user-details">
                                    <span className="user-email">
                                        {currentUser?.email?.split('@')[0]}
                                    </span>
                                    <span 
                                        className="user-role"
                                        style={{ color: getRoleColor() }}
                                    >
                                        {getRoleLabel()}
                                    </span>
                                </div>
                            </div>
                            
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                icon={LogOut}
                                onClick={handleLogout}
                            >
                                Logout
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="ghost" size="sm" onClick={() => onNavigate('auth')}>
                                Login
                            </Button>
                            <Button variant="primary" size="sm" onClick={() => onNavigate('report')}>
                                SOS Report
                            </Button>
                        </>
                    )}
                </div>

                <button className="mobile-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                {isMenuOpen && (
                    <div className="mobile-menu">
                        {isAuthenticated && (
                            <div className="mobile-user-info">
                                <div className="user-avatar">
                                    <User size={20} />
                                </div>
                                <div>
                                    <span className="user-email">{currentUser?.email}</span>
                                    <span className="user-role" style={{ color: getRoleColor() }}>
                                        {getRoleLabel()}
                                    </span>
                                </div>
                            </div>
                        )}
                        
                        {navItems.map((item) => (
                            <a
                                key={item.id}
                                href="#"
                                className={`mobile-nav-link ${currentPage === item.id ? 'active' : ''}`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    onNavigate(item.id);
                                    setIsMenuOpen(false);
                                }}
                            >
                                {item.label}
                            </a>
                        ))}
                        
                        <div className="mobile-actions">
                            {isAuthenticated ? (
                                <Button 
                                    variant="ghost" 
                                    className="w-full" 
                                    icon={LogOut}
                                    onClick={() => { 
                                        handleLogout(); 
                                        setIsMenuOpen(false); 
                                    }}
                                >
                                    Logout
                                </Button>
                            ) : (
                                <>
                                    <Button 
                                        variant="ghost" 
                                        className="w-full" 
                                        onClick={() => { 
                                            onNavigate('auth'); 
                                            setIsMenuOpen(false); 
                                        }}
                                    >
                                        Login
                                    </Button>
                                    <Button 
                                        variant="primary" 
                                        className="w-full" 
                                        onClick={() => { 
                                            onNavigate('report'); 
                                            setIsMenuOpen(false); 
                                        }}
                                    >
                                        SOS Report
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
