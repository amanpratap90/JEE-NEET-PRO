import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useDispatch, useSelector } from 'react-redux';
import { setChaptersCache } from '../store/contentSlice';
import { getCachedData, setCachedData } from '../utils/apiCache';
import api from '../utils/api';

const ChapterCard = ({ ch, index, onClick }) => (
    <div
        className="card"
        style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            textAlign: 'left',
            flexDirection: 'row',
            padding: '1.5rem 2rem',
            cursor: 'pointer'
        }}
        onClick={onClick}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <span style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: 'rgba(255,255,255,0.1)',
                fontFamily: 'monospace'
            }}>
                {String(index + 1).padStart(2, '0')}
            </span>
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>{ch}</h2>
        </div>
        <p style={{ margin: 0, color: 'var(--accent-teal)', whiteSpace: 'nowrap' }}>Start &rarr;</p>
    </div>
);

function Chapters() {
    const { exam, subject } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useAuth();

    const cacheKey = `chapters-${exam.toLowerCase()}-${subject.toLowerCase()}`;
    const cachedChapters = useSelector((state) => state.content.chapters[cacheKey]);

    const [chapters, setChapters] = useState(cachedChapters || []); // Renamed chapterList to chapters
    const [loading, setLoading] = useState(!cachedChapters); // Initialized based on cache
    const [error, setError] = useState('');

    useEffect(() => {
        // Cache Check
        const examVal = exam.toLowerCase();
        const subjectVal = subject.toLowerCase();
        const currentCacheKey = `chapters-${examVal}-${subjectVal}`; // Use a distinct name to avoid conflict with outer scope cacheKey

        // 1. Check Memory Cache (Redux)
        if (cachedChapters) {
            setChapters(cachedChapters);
            setLoading(false);
            return; // Stop here if cached
        }

        // 2. Fetch if not cached
        const fetchChapters = async () => {
            // 2a. Check LocalStorage before API
            // 2a. Check LocalStorage before API
            const localData = getCachedData(currentCacheKey);
            // Only use local cache if it has items. If empty, try fetching again in case new items were added.
            if (localData && localData.length > 0) {
                setChapters(localData);
                dispatch(setChaptersCache({ key: currentCacheKey, data: localData }));
                setLoading(false);
                return;
            }

            // 3. API Call
            try {
                // Ensure default values to avoid 404 or bad request
                const ex = examVal || 'jee-mains';
                const sub = subjectVal || 'physics';

                const res = await api.get(`/api/v1/resources/chapters?exam=${ex}&subject=${sub}`);
                const data = res.data;

                if (data.status === 'success') {
                    setChapters(data.data.chapters);
                    dispatch(setChaptersCache({ key: currentCacheKey, data: data.data.chapters }));
                    setCachedData(currentCacheKey, data.data.chapters); // Save to storage
                } else {
                    setError('Failed to fetch chapters');
                }
            } catch (err) {
                console.error(err);
                setError('Error loading chapters');
            } finally {
                setLoading(false);
            }
        };

        if (examVal && subjectVal) {
            fetchChapters();
        }
    }, [exam, subject, cachedChapters, dispatch]); // Updated dependencies to use exam, subject directly

    if (loading) return <div className="page container"><h2>Loading chapters...</h2></div>;
    if (error) return <div className="page container"><h2>Error: {error}</h2></div>;

    // Capitalize subject for display
    const displaySubject = subject.charAt(0).toUpperCase() + subject.slice(1);

    return (
        <div className="page container">
            <button
                onClick={() => navigate(-1)}
                className="auth-btn"
                style={{
                    width: 'auto',
                    padding: '0.5rem 1rem',
                    marginBottom: '1rem',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--text-secondary)',
                    color: 'var(--text-secondary)'
                }}
            >
                &larr; Back
            </button>

            <div className="hero" style={{ minHeight: 'auto', padding: '1rem 0 2rem' }}>
                <h1 className="gradient-text">{displaySubject} Chapters</h1>
                <p className="subtitle">Select a chapter to start practicing</p>
            </div>

            <div className="chapters-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '800px', margin: '0 auto' }}>
                {chapters.length > 0 ? (
                    chapters.map((ch, index) => (
                        <ChapterCard
                            key={ch}
                            ch={ch}
                            index={index}
                            onClick={() => navigate(`/${exam.toLowerCase()}/subjects/${subject.toLowerCase()}/${ch}`)}
                        />
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'gray' }}>
                        <h3>No chapters found for this subject yet.</h3>
                        <p>Check back later or contact admin.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Chapters;
