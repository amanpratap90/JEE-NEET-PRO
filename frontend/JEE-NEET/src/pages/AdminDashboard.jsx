import { useState, useRef } from 'react';

const AdminDashboard = () => {
    const [step, setStep] = useState(1);
    const [exam, setExam] = useState('');
    const [subject, setSubject] = useState('');
    const [chapter, setChapter] = useState('');
    const [uploadType, setUploadType] = useState('questions'); // 'questions', 'notes', etc.

    // For Questions
    const [questionData, setQuestionData] = useState({
        questionText: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        correctAnswer: '', // store the option text or value
        solution: ''
    });
    const [questionImage, setQuestionImage] = useState(null);
    const [editQuestionImage, setEditQuestionImage] = useState(null);

    // For Files
    const [fileData, setFileData] = useState({
        title: '',
        description: '',
        fileUrl: '' // In real app, this comes from upload
    });

    const subjects = {
        'jee-mains': ['Physics', 'Chemistry', 'Maths', 'Test Series'],
        'neet': ['Physics', 'Chemistry', 'Biology', 'Test Series']
    };

    const handleNext = () => {
        if (step === 1 && (!exam || !subject)) return alert('Select exam and subject');
        if (step === 2 && !chapter) return alert('Enter chapter name');
        setStep(step + 1);
    };

    const handleQuestionSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('exam', exam);
        formData.append('subject', subject.toLowerCase());
        formData.append('chapter', chapter);
        formData.append('questionText', questionData.questionText);
        [questionData.optionA, questionData.optionB, questionData.optionC, questionData.optionD].forEach(opt => formData.append('options', opt));
        formData.append('correctAnswer', questionData.correctAnswer);
        formData.append('solution', questionData.solution);

        if (questionImage) {
            formData.append('image', questionImage);
        }

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/v1/resources/questions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // Content-Type not set for FormData
                },
                body: formData
            });
            const data = await res.json();
            if (data.status === 'success') {
                alert('Question added successfully!');
                setQuestionData({
                    questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: '', solution: ''
                });
                setQuestionImage(null);
                // Clear file input manually if needed using ref, but keeping it simple for now
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert(err.message);
        }
    };

    const handleResourceSubmit = async (e) => {
        e.preventDefault();
        // In a real app, handle file upload first to get URL
        const payload = {
            exam,
            subject: subject.toLowerCase(),
            chapter,
            type: uploadType,
            title: fileData.title,
            description: fileData.description,
            fileUrl: fileData.fileUrl // Mock URL or result from file upload
        };

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/v1/resources', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.status === 'success') {
                alert('Resource added successfully!');
                setFileData({ title: '', description: '', fileUrl: '' });
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert(err.message);
        }
    };

    const [activeTab, setActiveTab] = useState('add'); // 'add' or 'manage'
    const [manageExam, setManageExam] = useState('');
    const [manageSubject, setManageSubject] = useState('');
    const [manageChapter, setManageChapter] = useState('');
    const [chapterList, setChapterList] = useState([]);
    const [questionsList, setQuestionsList] = useState([]);
    const [isEditingChapter, setIsEditingChapter] = useState(false);
    const [newChapterName, setNewChapterName] = useState('');
    const [editingQuestion, setEditingQuestion] = useState(null); // null or question object
    const questionsCache = useRef({}); // Cache for questions: { 'exam-subject-chapter': [questions] }

    // Fetch chapters when exam/subject changes in Manage tab
    // Fetch chapters when exam/subject changes in Manage tab
    const fetchChapters = async (examOverride, subjectOverride) => {
        const e = examOverride || manageExam;
        const s = subjectOverride || manageSubject;
        if (!e || !s) return;
        try {
            const res = await fetch(`/api/v1/resources/chapters?exam=${e}&subject=${s}`);
            const data = await res.json();
            setChapterList(data.data.chapters);
        } catch (err) {
            console.error(err);
        }
    };

    // Fetch questions when chapter changes
    // Fetch questions when chapter changes
    const fetchQuestions = async (examOverride, subjectOverride, chapterOverride) => {
        const e = examOverride || manageExam;
        const s = subjectOverride || manageSubject;
        const c = chapterOverride || manageChapter;

        if (!e || !s || !c) return;

        const cacheKey = `${e}-${s}-${c}`;
        if (questionsCache.current[cacheKey]) {
            setQuestionsList(questionsCache.current[cacheKey]);
            return; // Use cached data
        }

        try {
            const res = await fetch(`/api/v1/resources/questions?exam=${e}&subject=${s}&chapter=${c}`);
            const data = await res.json();
            questionsCache.current[cacheKey] = data.data.questions; // Cache the result
            setQuestionsList(data.data.questions);
        } catch (err) {
            console.error(err);
        }
    };

    const handleRenameChapter = async () => {
        if (!newChapterName || !manageChapter) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/v1/resources/chapters/rename', {
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
        if (!window.confirm(`Are you sure you want to delete chapter "${manageChapter}" and ALL its content? This cannot be undone.`)) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/v1/resources/chapters/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    exam: manageExam,
                    subject: manageSubject.toLowerCase(),
                    chapter: manageChapter
                })
            });
            const data = await res.json();
            if (data.status === 'success') {
                alert(data.message);
                setManageChapter('');
                fetchChapters();
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDeleteQuestion = async (id) => {
        if (!window.confirm('Are you sure you want to delete this question?')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/v1/resources/questions/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const newList = questionsList.filter(q => q._id !== id);
                setQuestionsList(newList);

                // Update Cache
                const cacheKey = `${manageExam}-${manageSubject}-${manageChapter}`;
                if (questionsCache.current[cacheKey]) {
                    questionsCache.current[cacheKey] = newList;
                }
            } else {
                const data = await res.json().catch(() => ({ message: 'Failed to delete' }));
                alert(data.message || 'Failed to delete question');
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

            const res = await fetch(`/api/v1/resources/questions/${editingQuestion._id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            const data = await res.json();
            if (data.status === 'success') {
                alert('Question updated');
                setEditingQuestion(null);
                setEditQuestionImage(null);

                // Invalidate Cache for current selection so it refetches fresh data
                const cacheKey = `${manageExam}-${manageSubject}-${manageChapter}`;
                delete questionsCache.current[cacheKey];

                fetchQuestions();
            }
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className="container page">
            <h1 className="gradient-text" style={{ textAlign: 'center', marginBottom: '2rem' }}>Admin Panel</h1>

            {/* Tabs */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    className={`cbt-btn ${activeTab === 'add' ? '' : 'secondary'}`}
                    onClick={() => setActiveTab('add')}
                >
                    Add New Content
                </button>
                <button
                    className={`cbt-btn ${activeTab === 'manage' ? '' : 'secondary'}`}
                    onClick={() => setActiveTab('manage')}
                >
                    Manage Existing
                </button>
            </div>

            {activeTab === 'add' ? (
                /* EXISTING ADD FLOW */
                <div className="card" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
                    {/* Progress Steps */}
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

                            <button className="auth-btn" onClick={handleNext} disabled={!exam || !subject}>Next</button>
                        </div>
                    )}

                    {step === 2 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Enter Chapter Name</label>
                                <input
                                    type="text"
                                    value={chapter}
                                    onChange={(e) => setChapter(e.target.value)}
                                    placeholder="e.g. Kinematics, Thermodynamics"
                                    style={{ width: '100%', padding: '0.8rem', background: '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '8px' }}
                                />
                                <p style={{ fontSize: '0.8rem', color: 'gray', marginTop: '0.5rem' }}>If chapter doesn't exist, it will be created implicitly with the content.</p>
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
                                    value={uploadType}
                                    onChange={(e) => setUploadType(e.target.value)}
                                    style={{ width: '100%', padding: '0.8rem', background: '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '8px' }}
                                >
                                    <option value="questions">Questions (MCQ)</option>
                                    <option value="notes">Notes (PDF)</option>
                                    <option value="short-notes">Short Notes (PDF)</option>
                                    <option value="book">Books (PDF)</option>
                                    <option value="test-series">Test Series (PDF Link)</option>
                                </select>
                            </div>

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
                                                placeholder={`Option ${opt}`}
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
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setQuestionImage(e.target.files[0])}
                                            style={{ color: 'white' }}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button type="button" className="cbt-btn secondary" onClick={() => setStep(2)}>Back</button>
                                        <button type="submit" className="auth-btn">Add Question</button>
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
                                <button
                                    className="cbt-btn secondary"
                                    onClick={() => { setIsEditingChapter(true); setNewChapterName(manageChapter); }}
                                    disabled={!manageChapter}
                                >
                                    Rename
                                </button>
                                <button
                                    className="cbt-btn secondary"
                                    onClick={handleDeleteChapter}
                                    disabled={!manageChapter}
                                    style={{ borderColor: '#ef4444', color: '#ef4444' }}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    )}

                    {isEditingChapter && (
                        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Rename "{manageChapter}" to:</label>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <input
                                    type="text"
                                    value={newChapterName}
                                    onChange={(e) => setNewChapterName(e.target.value)}
                                    style={{ flex: 1, padding: '0.8rem', background: '#0f172a', color: 'white', border: '1px solid #334155', borderRadius: '8px' }}
                                />
                                <button className="auth-btn" onClick={handleRenameChapter}>Save</button>
                                <button className="cbt-btn secondary" onClick={() => setIsEditingChapter(false)}>Cancel</button>
                            </div>
                        </div>
                    )}

                    {/* Editor Modal / Inline */}
                    {editingQuestion && (
                        <div style={{ padding: '1.5rem', background: 'rgba(34, 211, 238, 0.1)', borderRadius: '8px', marginBottom: '2rem', border: '1px solid var(--accent-teal)' }}>
                            <h3 style={{ marginBottom: '1rem' }}>Edit Question</h3>
                            <form onSubmit={handleUpdateQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <textarea
                                    value={editingQuestion.questionText}
                                    onChange={(e) => setEditingQuestion({ ...editingQuestion, questionText: e.target.value })}
                                    style={{ width: '100%', padding: '0.8rem', background: '#0f172a', color: 'white', border: '1px solid #334155', borderRadius: '8px' }}
                                />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                    {[0, 1, 2, 3].map(idx => (
                                        <input
                                            key={idx}
                                            value={editingQuestion.options[idx]}
                                            onChange={(e) => {
                                                const newOpts = [...editingQuestion.options];
                                                newOpts[idx] = e.target.value;
                                                setEditingQuestion({ ...editingQuestion, options: newOpts });
                                            }}
                                            style={{ padding: '0.8rem', background: '#0f172a', color: 'white', border: '1px solid #334155', borderRadius: '8px' }}
                                        />
                                    ))}
                                </div>
                                <input
                                    value={editingQuestion.correctAnswer}
                                    onChange={(e) => setEditingQuestion({ ...editingQuestion, correctAnswer: e.target.value })}
                                    style={{ width: '100%', padding: '0.8rem', background: '#0f172a', color: 'white', border: '1px solid #334155', borderRadius: '8px' }}
                                />
                                <textarea
                                    value={editingQuestion.solution}
                                    onChange={(e) => setEditingQuestion({ ...editingQuestion, solution: e.target.value })}
                                    placeholder="Solution"
                                    style={{ width: '100%', padding: '0.8rem', background: '#0f172a', color: 'white', border: '1px solid #334155', borderRadius: '8px' }}
                                />
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
                                                    <button
                                                        className="cbt-btn secondary"
                                                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                                                        onClick={() => setEditingQuestion(q)}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="cbt-btn secondary"
                                                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', borderColor: '#ef4444', color: '#ef4444' }}
                                                        onClick={() => handleDeleteQuestion(q._id)}
                                                    >
                                                        Delete
                                                    </button>
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
