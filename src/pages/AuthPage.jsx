import React, { useState } from 'react';
import { User, Heart, Briefcase, ChevronRight, Lock, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import { useAuth } from '../contexts/AuthContext';
import './AuthPage.css';

const AuthPage = ({ onNavigate }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [selectedRole, setSelectedRole] = useState('citizen');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, signup } = useAuth();

    const roles = [
        { 
            id: 'citizen', 
            label: 'Citizen', 
            icon: User, 
            desc: 'Report & Track',
            color: '#f59e0b'
        },
        { 
            id: 'volunteer', 
            label: 'Volunteer', 
            icon: Heart, 
            desc: 'Help & Respond',
            color: '#10b981'
        },
        { 
            id: 'agency', 
            label: 'Agency', 
            icon: Briefcase, 
            desc: 'Manage & Dispatch',
            color: '#3b82f6'
        },
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            return setError('Please fill in all fields');
        }

        if (password.length < 6) {
            return setError('Password must be at least 6 characters');
        }

        try {
            setError('');
            setLoading(true);
            
            if (isLogin) {
                await login(email, password);
            } else {
                await signup(email, password, selectedRole, displayName);
            }

            if (selectedRole === 'agency') {
                onNavigate('agency');
            } else if (selectedRole === 'volunteer') {
                onNavigate('volunteer');
            } else {
                onNavigate('dashboard');
            }
        } catch (err) {
            console.error('Auth error:', err);
            let errorMessage = 'Authentication failed';
            
            if (err.code === 'auth/email-already-in-use') {
                errorMessage = 'This email is already registered';
            } else if (err.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address';
            } else if (err.code === 'auth/weak-password') {
                errorMessage = 'Password is too weak';
            } else if (err.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email';
            } else if (err.code === 'auth/wrong-password') {
                errorMessage = 'Incorrect password';
            } else if (err.code === 'auth/invalid-credential') {
                errorMessage = 'Invalid email or password';
            } else if (err.message) {
                errorMessage = err.message;
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page flex-center">
            <Card className="auth-card">
                <div className="auth-header">
                    <h2 className="auth-title">
                        {isLogin ? 'Welcome Back' : 'Join Crisis.One'}
                    </h2>
                    <p className="auth-subtitle">
                        {isLogin
                            ? 'Sign in to access the emergency network.'
                            : 'Create an account to start helping your community.'}
                    </p>
                </div>

                {error && (
                    <div className="auth-error">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    {!isLogin && (
                        <>
                            <div className="role-selection">
                                <label className="form-label">Select Your Role</label>
                                <div className="roles-grid">
                                    {roles.map((role) => {
                                        const Icon = role.icon;
                                        return (
                                            <button
                                                key={role.id}
                                                type="button"
                                                className={`role-btn ${selectedRole === role.id ? 'active' : ''}`}
                                                onClick={() => setSelectedRole(role.id)}
                                                style={selectedRole === role.id ? { borderColor: role.color } : {}}
                                            >
                                                <Icon 
                                                    size={24} 
                                                    className="role-icon" 
                                                    style={{ color: role.color }}
                                                />
                                                <div className="role-text">
                                                    <span className="role-label">{role.label}</span>
                                                    <span className="role-desc">{role.desc}</span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Display Name (Optional)</label>
                                <div className="input-wrapper">
                                    <User size={18} className="input-icon" />
                                    <input
                                        type="text"
                                        placeholder="Your name"
                                        className="form-input"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <div className="input-wrapper">
                            <Mail size={18} className="input-icon" />
                            <input
                                type="email"
                                placeholder="name@example.com"
                                className="form-input"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div className="input-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                className="form-input"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <Button 
                        type="submit" 
                        variant="primary" 
                        className="w-full" 
                        icon={ChevronRight} 
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                    </Button>

                    <div className="auth-footer">
                        <p>
                            {isLogin ? "Don't have an account?" : "Already have an account?"}
                            <button
                                type="button"
                                className="link-btn"
                                onClick={() => {
                                    setIsLogin(!isLogin);
                                    setError('');
                                }}
                            >
                                {isLogin ? 'Sign Up' : 'Sign In'}
                            </button>
                        </p>
                    </div>
                </form>

                <div className="demo-credentials">
                    <p className="text-xs text-muted text-center mt-4">
                        Demo Mode: Create any account to explore the platform
                    </p>
                </div>
            </Card>
        </div>
    );
};

export default AuthPage;
