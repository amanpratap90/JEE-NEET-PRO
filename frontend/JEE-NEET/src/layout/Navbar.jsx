import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <header className="navbar">
            <Link to="/" className="logo">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="2" width="20" height="20" rx="4" stroke="url(#logo-gradient)" strokeWidth="2" />
                    <circle cx="12" cy="12" r="4" fill="url(#logo-gradient)" />
                    <defs>
                        <linearGradient id="logo-gradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#22D3EE" />
                            <stop offset="1" stopColor="#2DD4BF" />
                        </linearGradient>
                    </defs>
                </svg>
                JEE & NEET Prep
            </Link>

            <button
                className="hamburger-btn"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle menu"
            >
                {isOpen ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                )}
            </button>

            <div className={`nav-links ${isOpen ? 'open' : ''}`}>
                <Link
                    to="/test-series"
                    className="blinking-link"
                    onClick={() => setIsOpen(false)}
                >
                    Test Series
                </Link>

                {user ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexDirection: 'inherit' }}>
                        <span style={{ color: 'var(--accent-teal)', fontWeight: '600' }}>Hi, {user.name}</span>
                        {user.role === 'admin' && (
                            <Link to="/admin" style={{ color: 'var(--accent-teal)' }} onClick={() => setIsOpen(false)}>Admin</Link>
                        )}
                        <button onClick={() => { logout(); setIsOpen(false); }} className="auth-btn" style={{ background: 'transparent', border: '1px solid var(--accent-teal)', color: 'white', fontWeight: 'bold' }}>
                            Logout
                        </button>
                    </div>
                ) : (
                    <button onClick={() => { navigate('/login'); setIsOpen(false); }} className="auth-btn">Sign In</button>
                )}
            </div>
        </header>
    );
}
