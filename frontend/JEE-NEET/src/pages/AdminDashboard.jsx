import { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import api from '../utils/api';
import { API_BASE_URL } from '../utils/config';
import { removeCachedData } from '../utils/apiCache';
import { invalidateCache } from '../store/contentSlice';

const AdminDashboard = () => {
    const dispatch = useDispatch();

    // -- State --
    const [activeTab, setActiveTab] = useState('add'); // 'add' or 'manage'

    // Add Content State
    const [step, setStep] = useState(1);
    const [exam, setExam] = useState('');
    const [subject, setSubject] = useState('');
    const [chapter, setChapter] = useState('');
    const [testSection, setTestSection] = useState(''); // For Test Series subject separation
    const [uploadType, setUploadType] = useState('questions'); // 'questions', 'notes', etc.

    const [questionData, setQuestionData] = useState({
        questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: '', solution: ''
    });
    const [questionImage, setQuestionImage] = useState(null);
    const [fileData, setFileData] = useState({ title: '', description: '', fileUrl: '' });

    // Manage Content State
    const [manageExam, setManageExam] = useState('');
    const [manageSubject, setManageSubject] = useState('');
    const [manageChapter, setManageChapter] = useState('');
    const [manageTestSection, setManageTestSection] = useState(''); // For Test Series filtering
    const [chapterList, setChapterList] = useState([]);
    const [questionsList, setQuestionsList] = useState([]);
    const [isNextLoading, setIsNextLoading] = useState(false);

    // Editing State
    const [isEditingChapter, setIsEditingChapter] = useState(false);
    const [newChapterName, setNewChapterName] = useState('');
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [editQuestionImage, setEditQuestionImage] = useState(null);
    const [existingChapters, setExistingChapters] = useState([]); // Store chapters for autocomplete

    const questionsCache = useRef({});

    // -- Constants --
    const subjects = {
        'jee-mains': ['Physics', 'Chemistry', 'Maths', 'Test Series'],
        'neet': ['Physics', 'Chemistry', 'Biology', 'Test Series']
    };

    const testSections = {
        'jee-mains': ['Physics', 'Chemistry', 'Mathematics'],
        'neet': ['Physics', 'Chemistry', 'Biology']
    };



    // -- Handlers --

    // Fetch chapters for Manage Tab
    const fetchChapters = async (examOverride, subjectOverride) => {
        const e = examOverride || manageExam;
        const s = subjectOverride || manageSubject;
        if (!e || !s) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/resources/chapters?exam=${e}&subject=${s}`);
            const data = await res.json();
            setChapterList(data.data.chapters);
        } catch (err) {
            console.error(err);
        }
    };

    // Fetch questions for Manage Tab
    const fetchQuestions = async (examOverride, subjectOverride, chapterOverride, sectionOverride) => {
        const e = examOverride || manageExam;
        const s = subjectOverride || manageSubject;
        const c = chapterOverride || manageChapter;
        const sec = sectionOverride || manageTestSection;

        // If Test Series, we need the Section to actually find questions
        const finalSub = (s === 'Test Series' && sec) ? sec : s;

        if (!e || !s || !c) return;
        if (s === 'Test Series' && !sec) return; // Wait for section

        const cacheKey = `${e}-${finalSub}-${c}`;
        if (questionsCache.current[cacheKey]) {
            setQuestionsList(questionsCache.current[cacheKey]);
            return; // Use cached data
        }

        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/resources/questions?exam=${e}&subject=${finalSub}&chapter=${c}`);
            const data = await res.json();
            questionsCache.current[cacheKey] = data.data.questions;
            setQuestionsList(data.data.questions);
        } catch (err) {
            console.error(err);
        }
    };

    const handleNext = async () => {
        if (step === 1) {
            if (!exam || !subject) return alert('Select exam and subject');

            setIsNextLoading(true);
            try {
                // Fetch existing chapters for autocomplete using params for safety
                const res = await api.get(`/api/v1/resources/chapters`, {
                    params: { exam, subject }
                });

                if (res.data.status === 'success') {
                    setExistingChapters(Array.isArray(res.data.data.chapters) ? res.data.data.chapters : []);
                } else {
                    setExistingChapters([]);
                }
            } catch (err) {
                console.error("Failed to fetch chapters for autocomplete", err);
                setExistingChapters([]);
            } finally {
                setIsNextLoading(false);
                setStep(step + 1);
            }
            return;
        }

        if (step === 2 && !chapter) return alert('Enter chapter name');
        setStep(step + 1);
    };

    useEffect(() => {
        if (subject === 'Test Series') {
            setUploadType('questions');
        }
    }, [subject]);

    const handleQuestionSubmit = async (e) => {
        e.preventDefault();

        // If Test Series: 
        // 1. Subject remains 'test series' (so it doesn't show in generic Question Bank)
        // 2. Section is stored in 'section' field
        const finalSubject = (subject === 'Test Series') ? 'test series' : subject.toLowerCase();
        // If normal subject, no section needed (or could be same as subject).

        const formData = new FormData();
        formData.append('exam', exam);
        formData.append('subject', finalSubject);
        formData.append('chapter', chapter);

        if (subject === 'Test Series' && testSection) {
            console.log("Appending section:", testSection);
            formData.append('section', testSection);
        } else {
            console.log("No section appended. Subject:", subject, "TestSection:", testSection);
        }

        formData.append('questionText', questionData.questionText);
        [questionData.optionA, questionData.optionB, questionData.optionC, questionData.optionD].forEach(opt => formData.append('options', opt));
        formData.append('correctAnswer', questionData.correctAnswer);
        formData.append('solution', questionData.solution);

        if (questionImage) {
            formData.append('image', questionImage);
        }

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/v1/resources/questions`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();
            if (data.status === 'success') {
                // Critical: Ensure a "Test Series" resource marker exists so it shows up in the list
                if (subject === 'Test Series') {
                    try {
                        const checkRes = await api.get('/api/v1/resources', {
                            params: { exam, subject: 'test series', chapter: chapter.trim(), limit: 1 }
                        });

                        // Robust check: if results is 0 OR resources array is empty/undefined
                        const resources = checkRes?.data?.data?.resources;
                        if (!resources || resources.length === 0 || checkRes.data.results === 0) {
                            console.log("Creating Test Series Marker for:", chapter);
                            // Create marker resource
                            await api.post('/api/v1/resources', {
                                exam,
                                subject: 'test series',
                                chapter: chapter.trim(),
                                type: 'test-series',
                                title: chapter.trim(),
                                description: 'Generated Test Series',
                                fileUrl: '#'
                            }, { headers: { 'Authorization': `Bearer ${token}` } });
                        }
                    } catch (markerErr) {
                        console.error("Failed to check/create test marker", markerErr);
                    }
                }

                // Clear Caches
                removeCachedData(`chapters-${exam}-${finalSubject}`);
                removeCachedData(`practice-questions-${exam}-${finalSubject}-${chapter}`);
                // Critical: Clear Mock Test Page Cache
                removeCachedData(`questions-${exam}-${chapter}`);

                dispatch(invalidateCache(`chapters-${exam}-${finalSubject}`));
                dispatch(invalidateCache(`practice-questions-${exam}-${finalSubject}-${chapter}`));
                dispatch(invalidateCache(`questions-${exam}-${chapter}`));

                // If it was Test Series, clear generic test series cache just in case
                if (subject === 'Test Series') {
                    removeCachedData(`chapters-${exam}-test series`);
                    removeCachedData(`chapters-${exam}-test-series`);
                }

                // Clear Internal Admin Cache
                const internalCacheKey = `${exam}-${finalSubject}-${chapter}`;
                if (questionsCache.current[internalCacheKey]) {
                    delete questionsCache.current[internalCacheKey];
                }

                alert('Question added successfully!');
                setQuestionData({
                    questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: '', solution: ''
                });
                setQuestionImage(null);
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert(err.message);
        }
    };

    const handleResourceSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            exam,
            subject: subject.toLowerCase(),
            chapter,
            type: uploadType,
            title: fileData.title,
            description: fileData.description,
            fileUrl: fileData.fileUrl
        };

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/v1/resources`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.status === 'success') {
                removeCachedData(`chapters-${exam}-${subject.toLowerCase()}`);
                dispatch(invalidateCache(`chapters-${exam}-${subject.toLowerCase()}`));
                alert('Resource added successfully!');
                setFileData({ title: '', description: '', fileUrl: '' });
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert(err.message);
        }
    };

    const handleRenameChapter = async () => {
        if (!newChapterName || !manageChapter) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/api/v1/resources/chapters/rename`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    exam: manageExam,
                    subject: manageSubject.toLowerCase(),
                    oldChapterName: manageChapter,
                    newChapterName
                })
            });
            const data = await res.json();
            if (data.status === 'success') {
                alert('Chapter renamed successfully');
                removeCachedData(`chapters-${manageExam}-${manageSubject.toLowerCase()}`);
                removeCachedData(`practice-questions-${manageExam}-${manageSubject.toLowerCase()}-${manageChapter}`);
                removeCachedData(`practice-questions-${manageExam}-${manageSubject.toLowerCase()}-${newChapterName}`);
                dispatch(invalidateCache(`chapters-${manageExam}-${manageSubject.toLowerCase()}`));
                dispatch(invalidateCache(`practice-questions-${manageExam}-${manageSubject.toLowerCase()}-${manageChapter}`));
                dispatch(invalidateCache(`practice-questions-${manageExam}-${manageSubject.toLowerCase()}-${newChapterName}`));

                setIsEditingChapter(false);
                setManageChapter(newChapterName);
                fetchChapters();
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDeleteChapter = async () => {
        if (!window.confirm(`Are you sure you want to delete chapter "${manageChapter}" and ALL its content ? This cannot be undone.`)) return;
        try {
            const token = localStorage.getItem('token');
            const res = await api.post('/api/v1/resources/chapters/delete', {
                exam: manageExam,
                subject: manageSubject.toLowerCase(),
                chapter: manageChapter
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = res.data;
            if (data.status === 'success') {
                alert(data.message);
                removeCachedData(`chapters-${manageExam}-${manageSubject.toLowerCase()}`);
                removeCachedData(`practice-questions-${manageExam}-${manageSubject.toLowerCase()}-${manageChapter}`);
                dispatch(invalidateCache(`chapters-${manageExam}-${manageSubject.toLowerCase()}`));
                dispatch(invalidateCache(`practice-questions-${manageExam}-${manageSubject.toLowerCase()}-${manageChapter}`));

                setManageChapter('');
                fetchChapters();
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert(err.response?.data?.message || err.message);
        }
    };

    const handleDeleteQuestion = async (id) => {
        if (!window.confirm('Are you sure you want to delete this question?')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await api.delete(`/api/v1/resources/questions/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.status === 200) {
                const newList = questionsList.filter(q => q._id !== id);
                setQuestionsList(newList);

                const finalSub = (manageSubject === 'Test Series' && manageTestSection) ? manageTestSection : manageSubject;

                removeCachedData(`practice-questions-${manageExam}-${finalSub}-${manageChapter}`);
                dispatch(invalidateCache(`practice-questions-${manageExam}-${finalSub}-${manageChapter}`));

                const cacheKey = `${manageExam}-${finalSub}-${manageChapter}`;
                if (questionsCache.current[cacheKey]) {
                    questionsCache.current[cacheKey] = newList;
                }
            } else {
                alert(res.data.message || 'Failed to delete question');
            }
        } catch (err) {
            alert(err.message);
        }
    };

    const handleUpdateQuestion = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('questionText', editingQuestion.questionText);
            editingQuestion.options.forEach(opt => formData.append('options', opt));
            formData.append('correctAnswer', editingQuestion.correctAnswer);
            formData.append('solution', editingQuestion.solution);

            if (editQuestionImage) {
                formData.append('image', editQuestionImage);
            }

            const res = await fetch(`${API_BASE_URL}/api/v1/resources/questions/${editingQuestion._id}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();
            if (data.status === 'success') {
                alert('Question updated');
                setEditingQuestion(null);
                setEditQuestionImage(null);

                const finalSub = (manageSubject === 'Test Series' && manageTestSection) ? manageTestSection : manageSubject;

                const cacheKey = `${manageExam}-${finalSub}-${manageChapter}`;
                delete questionsCache.current[cacheKey];

                removeCachedData(`practice-questions-${manageExam}-${finalSub}-${manageChapter}`);
                dispatch(invalidateCache(`practice-questions-${manageExam}-${finalSub}-${manageChapter}`));

                fetchQuestions();
            }
        } catch (err) {
            alert(err.message);
        }
    };

    const handleSyncTestSeries = async () => {
        if (!manageExam) return alert("Select Exam first");

        try {
            // 1. Get all chapters from Physics (assuming Physics is always present in a test)
            const phyRes = await api.get(`/api/v1/resources/chapters?exam=${manageExam}&subject=physics`);
            const phyChapters = phyRes.data.data.chapters;

            // 2. Get all chapters from Test Series
            const tsRes = await api.get(`/api/v1/resources/chapters?exam=${manageExam}&subject=test series`);
            const tsChapters = tsRes.data.data.chapters;

            // 3. Find missing
            const missing = phyChapters.filter(ch => !tsChapters.includes(ch));

            if (missing.length === 0) {
                return alert("All tests appear to be synced!");
            }

            if (!window.confirm(`Found ${missing.length} potential Mock Tests missing from the list:\n${missing.join(', ')}\n\nCreate markers for them?`)) {
                return;
            }

            // 4. Create markers
            let count = 0;
            for (const ch of missing) {
                try {
                    await api.post('/api/v1/resources', {
                        exam: manageExam,
                        subject: 'test series',
                        chapter: ch,
                        type: 'test-series',
                        title: ch,
                        description: 'Synced Test Series',
                        fileUrl: '#'
                    });
                    count++;
                } catch (err) {
                    console.error(`Failed to sync ${ch}`, err);
                }
            }

            alert(`Successfully synced ${count} tests. Please refresh the Test Series list.`);

            // Clear cache
            removeCachedData(`chapters-${manageExam}-test series`);
            removeCachedData(`chapters-${manageExam}-test-series`);
            dispatch(invalidateCache(`chapters-${manageExam}-test series`));

            // Refresh current view if needed
            if (manageSubject === 'Test Series') {
                fetchChapters(manageExam, 'Test Series');
            }

        } catch (err) {
            console.error(err);
            alert("Sync failed: " + err.message);
        }
    };

    return (
        <div className="container page">
            <h1 className="gradient-text" style={{ textAlign: 'center', marginBottom: '2rem' }}>Admin Panel</h1>

            {/* Tabs */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    className={`cbt-btn ${activeTab === 'add' ? '' : 'secondary'} `}
                    onClick={() => setActiveTab('add')}
                >
                    Add New Content
                </button>
                <button
                    className={`cbt-btn ${activeTab === 'manage' ? '' : 'secondary'} `}
                    onClick={() => setActiveTab('manage')}
                >
                    Manage Existing
                </button>
            </div>

            {activeTab === 'add' ? (
                /* ADD FLOW */
                <div className="card" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '1px solid #334155', paddingBottom: '1rem' }}>
                        <span style={{ color: step >= 1 ? 'var(--accent-teal)' : 'gray' }}>1. Exam & Subject</span>
                        <span style={{ color: step >= 2 ? 'var(--accent-teal)' : 'gray' }}>2. Chapter</span>
                        <span style={{ color: step >= 3 ? 'var(--accent-teal)' : 'gray' }}>3. Upload Content</span>
                    </div>

                    {step === 1 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Select Exam</label>
                                <select
                                    value={exam}
                                    onChange={(e) => { setExam(e.target.value); setSubject(''); }}
                                    style={{ width: '100%', padding: '0.8rem', background: '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '8px' }}
                                >
                                    <option value="">Select Exam</option>
                                    <option value="jee-mains">JEE Mains</option>
                                    <option value="neet">NEET</option>
                                </select>
                            </div>
                            {exam && (
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Select Subject</label>
                                    <select
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        style={{ width: '100%', padding: '0.8rem', background: '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '8px' }}
                                    >
                                        <option value="">Select Subject</option>
                                        {subjects[exam].map(sub => (
                                            <option key={sub} value={sub}>{sub}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <button
                                className="auth-btn"
                                onClick={handleNext}
                                disabled={!exam || !subject || isNextLoading}
                            >
                                {isNextLoading ? 'Loading...' : 'Next'}
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                                    {subject === 'Test Series' ? "Select or Create Mock Test Name" : "Select or Create Chapter"}
                                </label>
                                <input
                                    list="chapter-suggestions"
                                    type="text"
                                    value={chapter}
                                    onChange={(e) => setChapter(e.target.value)}
                                    placeholder={subject === 'Test Series' ? "Type to search or create new (e.g. Mock Test 1)" : "Type to search or create new (e.g. Kinematics)"}
                                    style={{ width: '100%', padding: '0.8rem', background: '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '8px' }}
                                />
                                <datalist id="chapter-suggestions">
                                    {(existingChapters || []).map((ch, idx) => (
                                        <option key={idx} value={ch} />
                                    ))}
                                </datalist>
                                <p style={{ fontSize: '0.8rem', color: 'gray', marginTop: '0.5rem' }}>
                                    {(existingChapters || []).length > 0 ? "Select from the list to add to an existing chapter, or type a new name to create one." : "No existing chapters found. Type a name to create one."}
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button className="cbt-btn secondary" onClick={() => setStep(1)}>Back</button>
                                <button className="auth-btn" onClick={handleNext} disabled={!chapter}>Next</button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Content Type</label>
                                <select
                                    value={subject === 'Test Series' ? 'questions' : uploadType}
                                    onChange={(e) => setUploadType(e.target.value)}
                                    disabled={subject === 'Test Series'}
                                    style={{
                                        width: '100%',
                                        padding: '0.8rem',
                                        background: subject === 'Test Series' ? '#0f172a' : '#1e293b',
                                        color: subject === 'Test Series' ? 'gray' : 'white',
                                        border: '1px solid #334155',
                                        borderRadius: '8px',
                                        cursor: subject === 'Test Series' ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    <option value="questions">Questions (MCQ)</option>
                                    {subject !== 'Test Series' && (
                                        <>
                                            <option value="notes">Notes (PDF)</option>
                                            <option value="short-notes">Short Notes (PDF)</option>
                                            <option value="book">Books (PDF)</option>
                                            <option value="test-series">Test Series (PDF Link)</option>
                                        </>
                                    )}
                                </select>
                                {subject === 'Test Series' && (
                                    <p style={{ fontSize: '0.8rem', color: 'var(--accent-teal)', marginTop: '0.5rem' }}>
                                        For Test Series, you can only add Questions (MCQ).
                                    </p>
                                )}
                            </div>

                            {/* Test Series Specific: Section Selection */}
                            {subject === 'Test Series' && (
                                <div style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--accent-teal)' }}>Select Section (Subject)</label>
                                    <select
                                        value={testSection}
                                        onChange={(e) => setTestSection(e.target.value)}
                                        style={{ width: '100%', padding: '0.8rem', background: '#0f172a', color: 'white', border: '1px solid var(--accent-teal)', borderRadius: '8px' }}
                                    >
                                        <option value="">Select Section</option>
                                        {(testSections[exam] || []).map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                    <p style={{ fontSize: '0.8rem', color: 'gray', marginTop: '0.5rem' }}>Question will be added to this section of {chapter}.</p>
                                </div>
                            )}

                            {uploadType === 'questions' ? (
                                <form onSubmit={handleQuestionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <textarea
                                        placeholder="Question Text"
                                        value={questionData.questionText}
                                        onChange={(e) => setQuestionData({ ...questionData, questionText: e.target.value })}
                                        required
                                        style={{ width: '100%', padding: '0.8rem', background: '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '8px', minHeight: '100px' }}
                                    ></textarea>
                                    <div className="grid" style={{ marginTop: '0', gridTemplateColumns: '1fr 1fr' }}>
                                        {['A', 'B', 'C', 'D'].map(opt => (
                                            <input
                                                key={opt}
                                                type="text"
                                                placeholder={`Option ${opt} `}
                                                value={questionData[`option${opt}`]}
                                                onChange={(e) => setQuestionData({ ...questionData, [`option${opt}`]: e.target.value })}
                                                required
                                                style={{ padding: '0.8rem', background: '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '8px' }}
                                            />
                                        ))}
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Correct Option (Enter full text of correct option)"
                                        value={questionData.correctAnswer}
                                        onChange={(e) => setQuestionData({ ...questionData, correctAnswer: e.target.value })}
                                        required
                                        style={{ width: '100%', padding: '0.8rem', background: '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '8px' }}
                                    />
                                    <textarea
                                        placeholder="Solution / Explanation"
                                        value={questionData.solution}
                                        onChange={(e) => setQuestionData({ ...questionData, solution: e.target.value })}
                                        style={{ width: '100%', padding: '0.8rem', background: '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '8px', minHeight: '80px' }}
                                    ></textarea>
                                    <div style={{ padding: '0.8rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'gray' }}>Upload Image (Optional)</label>
                                        <input type="file" accept="image/*" onChange={(e) => setQuestionImage(e.target.files[0])} style={{ color: 'white' }} />
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button type="button" className="cbt-btn secondary" onClick={() => setStep(2)}>Back</button>
                                        <button type="submit" className="auth-btn" disabled={subject === 'Test Series' && !testSection}>Add Question</button>
                                    </div>
                                </form>
                            ) : (
                                <form onSubmit={handleResourceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <input
                                        type="text"
                                        placeholder="Title"
                                        value={fileData.title}
                                        onChange={(e) => setFileData({ ...fileData, title: e.target.value })}
                                        required
                                        style={{ width: '100%', padding: '0.8rem', background: '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '8px' }}
                                    />
                                    <input
                                        type="text"
                                        placeholder="File URL (e.g. Google Drive Link)"
                                        value={fileData.fileUrl}
                                        onChange={(e) => setFileData({ ...fileData, fileUrl: e.target.value })}
                                        required
                                        style={{ width: '100%', padding: '0.8rem', background: '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '8px' }}
                                    />
                                    <textarea
                                        placeholder="Description (Optional)"
                                        value={fileData.description}
                                        onChange={(e) => setFileData({ ...fileData, description: e.target.value })}
                                        style={{ width: '100%', padding: '0.8rem', background: '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '8px', minHeight: '80px' }}
                                    ></textarea>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button type="button" className="cbt-btn secondary" onClick={() => setStep(2)}>Back</button>
                                        <button type="submit" className="auth-btn">Upload {uploadType}</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                /* MANAGE FLOW */
                <div className="card" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
                    <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Manage Content</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <select
                            value={manageExam}
                            onChange={(e) => { setManageExam(e.target.value); setManageSubject(''); setChapterList([]); }}
                            style={{ padding: '0.8rem', background: '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '8px' }}
                        >
                            <option value="">Select Exam</option>
                            <option value="jee-mains">JEE Mains</option>
                            <option value="neet">NEET</option>
                        </select>
                        <select
                            value={manageSubject}
                            onChange={(e) => {
                                const val = e.target.value;
                                setManageSubject(val);
                                fetchChapters(manageExam, val);
                                setManageTestSection('');
                            }}
                            style={{ padding: '0.8rem', background: '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '8px' }}
                            disabled={!manageExam}
                        >
                            <option value="">Select Subject</option>
                            {manageExam && subjects[manageExam].map(sub => (
                                <option key={sub} value={sub}>{sub}</option>
                            ))}
                        </select>
                    </div>

                    {/* Sync for Test Series */}
                    {manageExam && manageSubject === 'Test Series' && (
                        <div style={{ marginBottom: '1.5rem', textAlign: 'right' }}>
                            <button
                                type="button"
                                className="cbt-btn secondary"
                                onClick={handleSyncTestSeries}
                                style={{ fontSize: '0.9rem', color: 'var(--accent-teal)', borderColor: 'var(--accent-teal)' }}
                            >
                                ↻ Sync Missing Tests
                            </button>
                            <p style={{ fontSize: '0.8rem', color: 'gray', marginTop: '0.5rem' }}>
                                Use this if a newly created test is not appearing in the list.
                            </p>
                        </div>
                    )}

                    {/* Test Series Section Filter */}
                    {manageSubject === 'Test Series' && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Select Section (Subject)</label>
                            <select
                                value={manageTestSection}
                                onChange={(e) => {
                                    setManageTestSection(e.target.value);
                                    if (manageChapter) fetchQuestions(manageExam, manageSubject, manageChapter, e.target.value);
                                }}
                                style={{ width: '100%', padding: '0.8rem', background: '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '8px' }}
                            >
                                <option value="">Select Section to View Questions</option>
                                {testSections[manageExam].map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {manageSubject && (
                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Select Chapter</label>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <select
                                    value={manageChapter}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setManageChapter(val);
                                        fetchQuestions(manageExam, manageSubject, val);
                                    }}
                                    style={{ flex: 1, padding: '0.8rem', background: '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '8px' }}
                                >
                                    <option value="">Select Chapter</option>
                                    {chapterList.map(ch => <option key={ch} value={ch}>{ch}</option>)}
                                </select>
                                <button className="cbt-btn secondary" onClick={() => { setIsEditingChapter(true); setNewChapterName(manageChapter); }} disabled={!manageChapter}>Rename</button>
                                <button className="cbt-btn secondary" onClick={handleDeleteChapter} disabled={!manageChapter} style={{ borderColor: '#ef4444', color: '#ef4444' }}>Delete</button>
                            </div>
                        </div>
                    )}

                    {isEditingChapter && (
                        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Rename "{manageChapter}" to:</label>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <input type="text" value={newChapterName} onChange={(e) => setNewChapterName(e.target.value)} style={{ flex: 1, padding: '0.8rem', background: '#0f172a', color: 'white', border: '1px solid #334155', borderRadius: '8px' }} />
                                <button className="auth-btn" onClick={handleRenameChapter}>Save</button>
                                <button className="cbt-btn secondary" onClick={() => setIsEditingChapter(false)}>Cancel</button>
                            </div>
                        </div>
                    )}

                    {/* Edit Question Modal */}
                    {editingQuestion && (
                        <div style={{ padding: '1.5rem', background: 'rgba(34, 211, 238, 0.1)', borderRadius: '8px', marginBottom: '2rem', border: '1px solid var(--accent-teal)' }}>
                            <h3 style={{ marginBottom: '1rem' }}>Edit Question</h3>
                            <form onSubmit={handleUpdateQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <textarea value={editingQuestion.questionText} onChange={(e) => setEditingQuestion({ ...editingQuestion, questionText: e.target.value })} style={{ width: '100%', padding: '0.8rem', background: '#0f172a', color: 'white', border: '1px solid #334155', borderRadius: '8px' }} />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                    {[0, 1, 2, 3].map(idx => (
                                        <input key={idx} value={editingQuestion.options[idx]} onChange={(e) => { const newOpts = [...editingQuestion.options]; newOpts[idx] = e.target.value; setEditingQuestion({ ...editingQuestion, options: newOpts }); }} style={{ padding: '0.8rem', background: '#0f172a', color: 'white', border: '1px solid #334155', borderRadius: '8px' }} />
                                    ))}
                                </div>
                                <input value={editingQuestion.correctAnswer} onChange={(e) => setEditingQuestion({ ...editingQuestion, correctAnswer: e.target.value })} style={{ width: '100%', padding: '0.8rem', background: '#0f172a', color: 'white', border: '1px solid #334155', borderRadius: '8px' }} />
                                <textarea value={editingQuestion.solution} onChange={(e) => setEditingQuestion({ ...editingQuestion, solution: e.target.value })} placeholder="Solution" style={{ width: '100%', padding: '0.8rem', background: '#0f172a', color: 'white', border: '1px solid #334155', borderRadius: '8px' }} />
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button type="submit" className="auth-btn">Update</button>
                                    <button type="button" className="cbt-btn secondary" onClick={() => setEditingQuestion(null)}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* List Questions */}
                    {manageChapter && (
                        <div>
                            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
                                Questions in {manageChapter} ({questionsList.length})
                            </h3>
                            <div style={{ height: '500px', overflowY: 'auto', border: '1px solid #334155', borderRadius: '8px', padding: '1rem', background: '#1e293b' }}>
                                {questionsList.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {questionsList.map((q, idx) => (
                                            <div key={q._id} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid #334155' }}>
                                                <div style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>Q{idx + 1}: {q.questionText}</div>
                                                <div style={{ color: 'gray', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Answer: {q.correctAnswer}</div>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button className="cbt-btn secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }} onClick={() => setEditingQuestion(q)}>Edit</button>
                                                    <button className="cbt-btn secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', borderColor: '#ef4444', color: '#ef4444' }} onClick={() => handleDeleteQuestion(q._id)}>Delete</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ color: 'gray' }}>No questions found in this chapter.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
