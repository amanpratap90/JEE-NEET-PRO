import { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { getCachedData, setCachedData, saveTestState, getTestState, clearTestState } from '../utils/apiCache';
import api from '../utils/api';
import {
    initializeTest,
    restoreTest,
    switchSubject,
    jumpToQuestion,
    saveAndNext,
    markForReview,
    clearResponse,
    tickTimer,
    submitTest
} from '../store/testSlice';

import { questions as questionBank } from '../data/questions'; // Using existing question bank

const MockTestPage = () => {
    const { exam, testId: routeTestId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const fetchingRef = useRef(false); // Ref to track if fetching is in progress

    const {
        testId,
        currentSubject,
        currentQuestionIndex,
        questions,
        responses,
        timeLeft,
        isTestActive,
        testSubmitted
    } = useSelector((state) => state.test);

    // Initialize Test on Mount
    useEffect(() => {
        // Only fetch if testId is provided (from URL)
        // AND we haven't already initialized this test
        if (routeTestId && (!testId || testId !== routeTestId)) {

            // 1. Check for saved Test State (User Progress)
            const savedState = getTestState(routeTestId);
            if (savedState && savedState.isTestActive && !savedState.testSubmitted) {
                console.log("Restoring saved test state...");
                dispatch(restoreTest(savedState));
                return;
            }

            const fetchTestQuestions = async () => {
                // Prevent duplicate fetch requests
                if (fetchingRef.current) return;
                fetchingRef.current = true;

                const cacheKey = `questions-${exam}-${routeTestId}`;
                const cachedQuestions = getCachedData(cacheKey);

                if (cachedQuestions) {
                    dispatch(initializeTest({
                        testId: routeTestId,
                        questions: cachedQuestions.questions,
                        subjects: cachedQuestions.subjects
                    }));
                    fetchingRef.current = false;
                    return;
                }

                try {
                    const examConfig = exam.toLowerCase().includes('jee') ?
                        ["Physics", "Chemistry", "Mathematics"] :
                        ["Physics", "Chemistry", "Biology"];

                    // Primary Fetch: Get all questions for this "Test Series" chapter
                    // They should have subject='test series' and section='Physics', etc.
                    const res = await api.get(`/api/v1/resources/questions`, {
                        params: {
                            exam: exam.toLowerCase(),
                            subject: 'test series',
                            chapter: routeTestId
                        }
                    });

                    let allQuestions = [];
                    if (res.data.status === 'success') {
                        allQuestions = res.data.data.questions;
                    }

                    // ALWAYS fetch legacy subject-based questions to support mixed data (old & new)
                    const fetchPromises = examConfig.map(sub =>
                        api.get(`/api/v1/resources/questions`, {
                            params: { exam: exam.toLowerCase(), subject: sub, chapter: routeTestId }
                        }).catch(e => ({ data: { status: 'fail' } }))
                    );
                    const legacyResults = await Promise.all(fetchPromises);
                    legacyResults.forEach(r => {
                        if (r.data && r.data.status === 'success') {
                            allQuestions = [...allQuestions, ...r.data.data.questions];
                        }
                    });

                    // Deduplicate
                    const uniqueQuestions = Array.from(new Map(allQuestions.map(item => [item._id, item])).values());

                    // Grouping Logic
                    const grouped = {};
                    examConfig.forEach(sub => grouped[sub] = []);

                    uniqueQuestions.forEach(q => {
                        // Use 'section' if available (new schema), otherwise 'subject' (legacy)
                        // Ensure comparison is case-insensitive
                        const targetCategory = q.section || q.subject;

                        // Find matches in examConfig (e.g. 'Physics' matches 'physics')
                        const match = examConfig.find(s => s.toLowerCase() === targetCategory.toLowerCase());

                        if (match) {
                            grouped[match].push(q);
                        } else {
                            // Fallback categorization for messy data
                            if (targetCategory.toLowerCase().includes('math')) grouped[examConfig[2]].push(q);
                            else if (targetCategory.toLowerCase().includes('bio')) grouped[examConfig[2]].push(q);
                            else if (targetCategory.toLowerCase().includes('chem')) grouped[examConfig[1]].push(q);
                            else grouped[examConfig[0]].push(q);
                        }
                    });

                    const subjectsList = examConfig.filter(s => grouped[s].length > 0);
                    const finalQuestionsData = {};
                    subjectsList.forEach(s => finalQuestionsData[s] = grouped[s]);

                    if (subjectsList.length > 0) {
                        setCachedData(cacheKey, { questions: finalQuestionsData, subjects: subjectsList });
                        dispatch(initializeTest({
                            testId: routeTestId,
                            questions: finalQuestionsData,
                            subjects: subjectsList
                        }));
                    } else {
                        // Handle Empty State nicely
                        alert("No questions found for this test. Please check Admin Dashboard.");
                    }

                } catch (err) {
                    console.error("Failed to load test", err);
                } finally {
                    fetchingRef.current = false;
                }
            };
            fetchTestQuestions();
        }
    }, [dispatch, exam, routeTestId, testId]);

    // Timer Logic
    useEffect(() => {
        let interval = null;
        if (isTestActive && timeLeft > 0) {
            interval = setInterval(() => {
                dispatch(tickTimer());
            }, 1000);
        } else if (timeLeft === 0) {
            clearInterval(interval);
            // Handle Auto Submit if needed
        }
        return () => clearInterval(interval);
    }, [isTestActive, timeLeft, dispatch]);

    // Save Test State on Changes (Persistence)
    useEffect(() => {
        if (isTestActive && testId) {
            // Save state but debounce or limit frequency if needed. 
            // For now, saving on every relevant change which is fine 
            // as long as it's not every tick (we handle timer separately or just include it)
            // We WILL include timeLeft here so it saves continuously.
            // If performance issues arise, we can throttle this.
            const currentState = {
                testId,
                currentSubject,
                currentQuestionIndex,
                questions,
                responses,
                timeLeft,
                isTestActive,
                testSubmitted
            };
            saveTestState(testId, currentState);
        }
    }, [testId, currentSubject, currentQuestionIndex, questions, responses, timeLeft, isTestActive, testSubmitted]);

    // Clean up saved state on successful submit
    useEffect(() => {
        if (testSubmitted && testId) {
            clearTestState(testId);
        }
    }, [testSubmitted, testId]);


    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')} `;
    };

    // Local selection state for current question (before saving)
    const [localSelection, setLocalSelection] = useState(null);

    // Sync local selection when changing questions
    useEffect(() => {
        setLocalSelection(responses[`${currentSubject} -${currentQuestionIndex} `]?.selectedOption || null);
    }, [currentSubject, currentQuestionIndex, responses]);

    if (!questions[currentSubject] || questions[currentSubject].length === 0) {
        return <div className="cbt-container loading">Loading Test...</div>;
    }

    const currentQuestion = questions[currentSubject][currentQuestionIndex];
    const QID = `${currentSubject} -${currentQuestionIndex} `;

    // Handlers
    const handleSaveNext = () => {
        dispatch(saveAndNext({ questionId: QID, selectedOption: localSelection }));
    };

    const handleMarkReview = () => {
        dispatch(markForReview({ questionId: QID, selectedOption: localSelection }));
    };

    const handleClear = () => {
        setLocalSelection(null);
        dispatch(clearResponse({ questionId: QID }));
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'answered': return '#22c55e'; // Green
            case 'marked': return '#a855f7'; // Purple
            case 'marked_answered': return '#a855f7'; // Purple with check indicator usually
            case 'visited': return '#ef4444'; // Red
            default: return 'transparent'; // Not visited
        }
    };

    if (testSubmitted) {
        return (
            <div className="container page" style={{ textAlign: 'center', paddingTop: '5rem' }}>
                <h1>Test Submitted Successfully!</h1>
                <p>Your result analysis will be displayed here.</p>
                <button className="auth-btn" onClick={() => navigate(`/ ${exam} `)}>Back to Dashboard</button>
            </div>
        );
    }

    return (
        <div className="cbt-layout">
            {/* Header */}
            <header className="cbt-header">
                <div className="test-info">
                    <span className="exam-tag">{exam.toUpperCase()} MOCK TEST</span>
                </div>
                <div className="timer-section">
                    <span>Time Left: </span>
                    <span className="timer-display" style={{ color: timeLeft < 300 ? '#ef4444' : 'white' }}>
                        {formatTime(timeLeft)}
                    </span>
                </div>
                <button className="submit-btn" onClick={() => { if (window.confirm('Submit Test?')) dispatch(submitTest()) }}>
                    Submit
                </button>
            </header>

            <div className="cbt-main">
                {/* Left Panel: Question Area */}
                <div className="question-area">
                    {/* Subject Tabs */}
                    <div className="subject-tabs">
                        {Object.keys(questions).map(sub => (
                            <button
                                key={sub}
                                className={`sub-tab ${currentSubject === sub ? 'active' : ''}`}
                                onClick={() => dispatch(switchSubject(sub))}
                            >
                                {sub}
                            </button>
                        ))}
                    </div>

                    <div className="question-header-bar">
                        <div className="q-meta">
                            <h3>Question {currentQuestionIndex + 1}</h3>
                        </div>
                        <div className="marking-controls">
                            <span>+4, -1</span>
                        </div>
                    </div>

                    <div className="q-content-scroll">
                        <p className="q-text">{currentQuestion.questionText}</p>

                        <div className="cbt-options">
                            {currentQuestion.options.map((opt, idx) => (
                                <label key={idx} className={`cbt-option-label ${localSelection === opt ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="option"
                                        checked={localSelection === opt}
                                        onChange={() => setLocalSelection(opt)}
                                    />
                                    <span className="circle-text">{String.fromCharCode(65 + idx)}</span>
                                    {opt}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="action-footer">
                        <div className="left-actions">
                            <button
                                className="cbt-btn secondary"
                                onClick={handleClear}
                            >
                                Clear Response
                            </button>
                            <button
                                className="cbt-btn warning"
                                onClick={handleMarkReview}
                            >
                                Mark for Review & Next
                            </button>
                        </div>
                        <button
                            className="cbt-btn primary"
                            onClick={handleSaveNext}
                        >
                            Save & Next
                        </button>
                    </div>
                </div>

                {/* Right Panel: Palette */}
                <div className="side-panel">
                    <div className="user-profile">
                        <div className="avatar">U</div>
                        <span>Candidate</span>
                    </div>

                    <div className="palette-legend">
                        <div className="legend-item"><span className="dot answered"></span> Answered</div>
                        <div className="legend-item"><span className="dot not-answered"></span> Not Answered</div>
                        <div className="legend-item"><span className="dot not-visited"></span> Not Visited</div>
                        <div className="legend-item"><span className="dot marked"></span> Marked for Review</div>
                    </div>

                    <div className="palette-header">
                        Choose a Question
                    </div>

                    <div className="question-grid">
                        {questions[currentSubject].map((_, idx) => {
                            const qid = `${currentSubject} -${idx} `;
                            const status = responses[qid]?.status || 'not-visited';
                            return (
                                <button
                                    key={idx}
                                    className={`palette-btn ${status} ${currentQuestionIndex === idx ? 'current' : ''}`}
                                    onClick={() => dispatch(jumpToQuestion(idx))}
                                >
                                    {idx + 1}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};



export default MockTestPage;
