import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const signup = async (email, password, role = 'citizen', displayName = '') => {
        if (!auth) throw new Error("Firebase not configured. Setup .env file.");
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        if (db) {
            const userDoc = {
                uid: user.uid,
                email: user.email,
                role: role,
                displayName: displayName || email.split('@')[0],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                isOnline: true,
                location: null
            };
            
            await setDoc(doc(db, 'users', user.uid), userDoc);
            setUserRole(role);
            setUserProfile(userDoc);
        }
        
        return userCredential;
    };

    const login = async (email, password) => {
        if (!auth) throw new Error("Firebase not configured. Setup .env file.");
        
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        if (db) {
            const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setUserRole(userData.role);
                setUserProfile(userData);
                
                await setDoc(doc(db, 'users', userCredential.user.uid), {
                    isOnline: true,
                    lastLoginAt: serverTimestamp()
                }, { merge: true });
            }
        }
        
        return userCredential;
    };

    const logout = async () => {
        if (!auth) return Promise.resolve();
        
        if (db && currentUser) {
            await setDoc(doc(db, 'users', currentUser.uid), {
                isOnline: false,
                lastSeenAt: serverTimestamp()
            }, { merge: true });
        }
        
        setUserRole(null);
        setUserProfile(null);
        return signOut(auth);
    };

    const getIdToken = async () => {
        if (!currentUser) return null;
        return await currentUser.getIdToken();
    };

    const updateUserLocation = async (latitude, longitude) => {
        if (!db || !currentUser) return;
        
        await setDoc(doc(db, 'users', currentUser.uid), {
            location: { latitude, longitude },
            locationUpdatedAt: serverTimestamp()
        }, { merge: true });
    };

    const updateVolunteerStatus = async (isAvailable) => {
        if (!db || !currentUser) return;
        
        await setDoc(doc(db, 'users', currentUser.uid), {
            isAvailable: isAvailable,
            updatedAt: serverTimestamp()
        }, { merge: true });
    };

    useEffect(() => {
        if (!auth) {
            setLoading(false);
            return;
        }
        
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            
            if (user && db) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setUserRole(userData.role);
                        setUserProfile(userData);
                    }
                } catch (error) {
                    console.error('Error fetching user profile:', error);
                }
            } else {
                setUserRole(null);
                setUserProfile(null);
            }
            
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        userRole,
        userProfile,
        signup,
        login,
        logout,
        getIdToken,
        updateUserLocation,
        updateVolunteerStatus,
        isAuthenticated: !!currentUser,
        isCitizen: userRole === 'citizen',
        isVolunteer: userRole === 'volunteer',
        isAgency: userRole === 'agency'
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
