import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const HabitTracker = ({ visible }) => {
    // URL to your deployed HabitFlow application
    const HABIT_FLOW_URL = "https://status-frontend-q9a3.vercel.app/";
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);

    return (
        <div style={{
            // Use visibility to keep iframe alive without re-rendering
            visibility: visible ? 'visible' : 'hidden',
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.3s ease',
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: visible ? 1800 : -1, // Move behind when hidden
            background: '#0f172a', // Dark background
            pointerEvents: visible ? 'auto' : 'none', // Disable interactions when hidden
        }}>
            {/* Header Overlay - Only rendered when visible or always rendered but hidden? 
                 Let's keep it simple. If we want persistence, render always. */}
            <div style={{
                position: 'absolute',
                top: '1.5rem',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1801,
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
                padding: '0.50rem 2rem',
                borderRadius: '50px',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(45, 212, 191, 0.2)',
                background: 'rgba(15, 23, 42, 0.8)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}>
                <button
                    onClick={() => navigate('/')}
                    style={{
                        padding: '0.2rem 1rem', // Reduced padding
                        background: 'linear-gradient(135deg, #22d3ee 0%, #2dd4bf 100%)',
                        color: '#0f172a',
                        border: 'none',
                        borderRadius: '30px',
                        cursor: 'pointer',
                        fontWeight: '800',
                        fontSize: '0.60rem', // Reduced font size
                        letterSpacing: '0.1px',
                        boxShadow: '0 4px 15px rgba(34, 211, 238, 0.3)',
                        transition: 'all 0.3s ease',
                        whiteSpace: 'nowrap',
                        textTransform: 'uppercase'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.transform = 'scale(1.05)';
                        e.target.style.boxShadow = '0 6px 20px rgba(34, 211, 238, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.transform = 'scale(1)';
                        e.target.style.boxShadow = '0 4px 15px rgba(34, 211, 238, 0.3)';
                    }}
                >
                    GO BACK TO JEE AND NEET
                </button>
            </div>

            {/* Loading Indicator */}
            {isLoading && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: '#2dd4bf',
                    fontSize: '1.5rem',
                    fontFamily: 'sans-serif'
                }}>
                    Loading Tracker...
                </div>
            )}

            <iframe
                src={HABIT_FLOW_URL}
                onLoad={() => setIsLoading(false)}
                loading="eager" // Hint browser to load immediately
                style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    opacity: isLoading ? 0 : 1,
                    transition: 'opacity 0.5s ease',
                    background: '#0f172a'
                }}
                title="Habit Tracker"
            />
        </div>
    );
};

export default HabitTracker;
