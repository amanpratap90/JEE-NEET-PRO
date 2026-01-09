import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCachedData, setCachedData } from '../utils/apiCache';
import api from '../utils/api';
import { testSeries } from '../data/testSeries';

const TestSeries = () => {
    console.log("TestSeries Component Rendered");
    const { exam } = useParams();
    const navigate = useNavigate();
    const selectedExam = exam ? exam.toLowerCase() : "jee-mains";
    const displayExam = selectedExam.toUpperCase().replace('-', ' ');
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTests = async () => {
            const cacheKey = `chapters-${selectedExam}-test-series`;
            const cached = getCachedData(cacheKey);

            if (cached) {
                setTests(cached);
                setLoading(false);
                return;
            }

            try {
                // Fetch chapters for the special subject 'Test Series'
                console.log(`Fetching tests for ${selectedExam}`);
                const res = await api.get(`/api/v1/resources/chapters?exam=${selectedExam}&subject=${encodeURIComponent('test series')}`);
                const data = res.data; // Axios typically returns data in res.data
                console.log("Fetch result:", data);

                if (data.status === 'success' && Array.isArray(data.data.chapters)) {
                    const fetchedTests = data.data.chapters.map((title) => ({
                        id: title,
                        title: title,
                        questions: 'Questions Available',
                        duration: 'Untimed'
                    }));
                    setCachedData(cacheKey, fetchedTests);
                    setTests(fetchedTests);
                } else {
                    console.warn("Unexpected API response structure", data);
                }
            } catch (err) {
                console.error("Failed to fetch test series", err);
            } finally {
                setLoading(false);
            }
        };

        fetchTests();
    }, [selectedExam]);

    // Fetch available chapters logic (simplified for determining "Full Syllabus" vs "Chapterwise")
    useEffect(() => {
        const fetchChapters = async () => {
            // Example call to verify backend connectivity or load dynamic data
            try {
                // Determine implicit exam/subject or fetch list.
                // For test series list, we might want to check available content.
                // Currently just fetching to test connectivity.
                const res = await api.get('/api/v1/resources/chapters?exam=jee-mains&subject=physics');
                if (res.data.status === 'success') {
                    // console.log("Backend Connected for TestSeries");
                }
            } catch (err) {
                console.error("TestSeries backend check failed", err);
            }
        };
        fetchChapters();
    }, []);

    if (loading) return <div className="container page" style={{ textAlign: 'center', paddingTop: '4rem', color: 'white' }}>Loading Tests...</div>;

    return (
        <div className="container page">
            <div className="hero" style={{ minHeight: 'auto', padding: '4rem 0 2rem' }}>
                <h1 className="gradient-text">{displayExam} Test Series</h1>
                <p className="subtitle">Practice with full-length mock tests designed for high performance.</p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '2rem',
                justifyItems: 'center'
            }}>
                {tests.length > 0 ? (
                    tests.map((test, idx) => (
                        <div key={idx} className="card" style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            padding: '2rem 1.5rem',
                            position: 'relative',
                            overflow: 'hidden',
                            background: '#0f172a',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            borderRadius: '16px',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer',
                            maxWidth: '380px',
                            width: '100%'
                        }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.borderColor = 'var(--accent-teal)';
                                e.currentTarget.querySelector('.glow-bg').style.opacity = '0.15';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                                e.currentTarget.querySelector('.glow-bg').style.opacity = '0.05';
                            }}
                            onClick={() => navigate(`/${selectedExam}/test-series/${encodeURIComponent(test.title)}`)}
                        >
                            {/* Background Glow Effect */}
                            <div className="glow-bg" style={{
                                position: 'absolute',
                                top: '-20%',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '150%',
                                height: '200px',
                                background: 'radial-gradient(circle, var(--accent-cyan) 0%, transparent 70%)',
                                opacity: '0.05',
                                transition: 'opacity 0.3s ease',
                                pointerEvents: 'none'
                            }}></div>

                            {/* Icon Container */}
                            <div style={{
                                width: '64px',
                                height: '64px',
                                background: 'rgba(34, 211, 238, 0.1)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '1.5rem',
                                color: 'var(--accent-cyan)',
                                position: 'relative',
                                zIndex: 1
                            }}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                    <polyline points="10 9 9 9 8 9"></polyline>
                                </svg>
                            </div>

                            <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
                                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'white', fontWeight: '600' }}>{test.title}</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
                                    Comprehensive mock test designed to boost your performance.
                                </p>

                                <button
                                    className="auth-btn"
                                    style={{
                                        width: '100%',
                                        padding: '0.6rem',
                                        fontSize: '0.9rem',
                                        background: 'transparent',
                                        border: '1px solid var(--accent-teal)',
                                        color: 'var(--accent-teal)',
                                        borderRadius: '8px',
                                        fontWeight: '600',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.background = 'var(--accent-teal)';
                                        e.target.style.color = 'black';
                                        e.stopPropagation();
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.background = 'transparent';
                                        e.target.style.color = 'var(--accent-teal)';
                                        e.stopPropagation();
                                    }}
                                >
                                    Start Test
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', background: 'rgba(30, 41, 59, 0.3)', borderRadius: '12px', border: '1px dashed #334155' }}>
                        <p style={{ color: '#94a3b8', fontSize: '1.2rem', marginBottom: '1rem' }}>No test series available yet.</p>
                        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Check back later or contact your administrator.</p>
                        <button
                            className="auth-btn"
                            onClick={() => {
                                import('../utils/apiCache').then(({ removeCachedData }) => {
                                    removeCachedData(`chapters-${selectedExam}-test-series`);
                                    window.location.reload();
                                });
                            }}
                        >
                            Refresh List
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TestSeries;
