import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [criticalAlert, setCriticalAlert] = useState(null);
    const { currentUser } = useAuth();

    const addNotification = useCallback((notification) => {
        const newNotification = {
            id: Date.now().toString(),
            timestamp: new Date(),
            read: false,
            ...notification
        };

        setNotifications(prev => [newNotification, ...prev].slice(0, 50));
        setUnreadCount(prev => prev + 1);

        if (notification.severity === 'critical') {
            setCriticalAlert(newNotification);
        }

        return newNotification;
    }, []);

    const dismissCriticalAlert = useCallback(() => {
        setCriticalAlert(null);
    }, []);

    const markAsRead = useCallback((notificationId) => {
        setNotifications(prev => 
            prev.map(n => 
                n.id === notificationId ? { ...n, read: true } : n
            )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    }, []);

    useEffect(() => {
        if (!db || !currentUser) return;

        try {
            const q = query(
                collection(db, 'notifications'),
                where('userId', '==', currentUser.uid),
                orderBy('createdAt', 'desc'),
                limit(50)
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const dbNotifications = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    timestamp: doc.data().createdAt?.toDate() || new Date()
                }));
                
                setNotifications(dbNotifications);
                setUnreadCount(dbNotifications.filter(n => !n.read).length);
            }, (error) => {
                console.error('Notification subscription error:', error);
            });

            return () => unsubscribe();
        } catch (error) {
            console.error('Notification setup error:', error);
        }
    }, [currentUser]);

    const value = {
        notifications,
        unreadCount,
        criticalAlert,
        addNotification,
        dismissCriticalAlert,
        markAsRead,
        markAllAsRead
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};
