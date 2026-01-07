import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCachedData, setCachedData } from '../utils/apiCache';
import api from '../utils/api';

import { exams } from '../data/Exams';

import PDFViewer from '../Components/PDFViewer';

const ResourceList = ({ type, title }) => {
    const { exam } = useParams();
    // exam param from URL (e.g. 'jee-mains') matches keys in Exams.js and DB
    const selectedExam = exam || "jee-mains";

    const [viewingPdf, setViewingPdf] = useState(null);
    const [resourceList, setResourceList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Persist selected subject
    const storageKey = `resource-subject-${selectedExam}-${type}`;
    const [selectedSubject, setSelectedSubject] = useState(() => {
        return localStorage.getItem(storageKey) || null;
    });

    useEffect(() => {
        if (selectedSubject) {
            localStorage.setItem(storageKey, selectedSubject);
        }
    }, [selectedSubject, storageKey]);

    // Map frontend type to backend type enum
    const getBackendType = (t) => {
        switch (t) {
            case 'shortNotes': return 'short-notes';
            case 'books': return 'book';
            default: return t; // 'notes' -> 'notes'
        }
    };

    // Fetch resources
    useEffect(() => {
        if (!selectedSubject) {
            setResourceList([]);
            return;
        }

        const fetchResources = async () => {
            setLoading(true);
            setError(null);

            // Cache check
            const cacheKey = `resources-${selectedExam}-${selectedSubject}-${type}`;
            const cached = getCachedData(cacheKey); // Assuming getCachedData is defined elsewhere
            if (cached) {
                setResourceList(cached); // Assuming setResources is setResourceList
                setLoading(false);
                return;
            }

            try {
                // Ensure default values to avoid 404 or bad request
                const ex = selectedExam || 'jee-mains';
                const sub = selectedSubject || 'physics';
                const resourceType = getBackendType(type) || 'notes'; // Using getBackendType for 'type'

                const res = await api.get(`/api/v1/resources?exam=${ex}&subject=${sub}&type=${resourceType}`); // Assuming api is imported
                const data = res.data;

                if (data.status === 'success') {
                    setResourceList(data.data.resources); // Assuming setResources is setResourceList
                    setCachedData(cacheKey, data.data.resources); // Assuming setCachedData is defined elsewhere
                } else {
                    setError('Failed to fetch resources');
                }
            } catch (err) {
                console.error(err);
                setError('Error connecting to server');
            } finally {
                setLoading(false);
            }
        };

        if (selectedExam && selectedSubject) { // Changed condition to match instruction's implied logic
            fetchResources();
        }
    }, [selectedExam, selectedSubject, type]); // Dependencies updated to reflect variables used in fetchResources

    // Memoize the list of subjects for the selected exam
    const subjects = useMemo(() => {
        return exams[selectedExam]?.subjects || [];
    }, [selectedExam]);

    const handleResourceClick = (e, link) => {
        // Enforce Read Mode for ALL resource types (Notes, Books, Short Notes)
        e.preventDefault();
        setViewingPdf(link);
    };

    return (
        <div className="container page">
            {viewingPdf && (
                <PDFViewer
                    url={viewingPdf}
                    onClose={() => setViewingPdf(null)}
                />
            )}

            <div className="hero" style={{ minHeight: 'auto', padding: '4rem 0 2rem' }}>
                <h1 className="gradient-text">{title}</h1>
                <p className="subtitle">Select your exam and subject to find resources</p>
            </div>

            {/* Exam Selection removed - filtered by route */}

            {/* Subject Selection */}
            <div className="grid" style={{ marginBottom: '3rem' }}>
                {subjects.map(subject => (
                    <div
                        key={subject}
                        className="card"
                        style={{
                            borderColor: selectedSubject === subject ? 'var(--accent-teal)' : 'var(--card-border)',
                            cursor: 'pointer'
                        }}
                        onClick={() => setSelectedSubject(subject)}
                    >
                        <h3>{subject}</h3>
                    </div>
                ))}
            </div>

            {/* Resource List */}
            {selectedSubject && (
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>
                        {selectedSubject} {title}
                    </h2>

                    {loading && <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading resources...</p>}
                    {error && <p style={{ textAlign: 'center', color: '#ef4444' }}>{error}</p>}

                    {!loading && !error && resourceList.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {resourceList.map((res, idx) => (
                                <a
                                    key={idx}
                                    href={res.fileUrl} // Backend uses fileUrl
                                    className="card"
                                    onClick={(e) => handleResourceClick(e, res.fileUrl)}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        textDecoration: 'none',
                                        color: 'inherit'
                                    }}
                                >
                                    <span>{res.title}</span>
                                    <span style={{ color: 'var(--accent-teal)', fontSize: '0.9rem' }}>Read Now &rarr;</span>
                                </a>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>No resources found for this subject yet.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default ResourceList;
