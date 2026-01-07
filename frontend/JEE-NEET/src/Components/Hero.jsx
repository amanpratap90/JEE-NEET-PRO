export default function Hero() {
    return (
        <section className="hero">
            <h1>
                Crack <span className="gradient-text">JEE & NEET</span> with <br />
                Practice & Precision
            </h1>
            <p className="subtitle">
                Master Physics, Chemistry,Mathematics & BIOLOGY with comprehensive question banks, detailed solutions, and progress tracking.
            </p>

            <div className="hero-features">
                <div className="feature-item">
                    <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <circle cx="12" cy="12" r="6" strokeOpacity="0.5" />
                        <circle cx="12" cy="12" r="2" fill="currentColor" />
                    </svg>
                    <span>1000+ Questions</span>
                </div>
                <div className="feature-item">
                    <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                    <span>JEE Main & NEET</span>
                </div>
                <div className="feature-item">
                    <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                    </svg>
                    <span>Detailed Solutions</span>
                </div>
            </div>

            <div style={{ marginTop: '5rem' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Choose Your Subject</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Select a subject to start practicing</p>
            </div>
        </section>
    );
}
