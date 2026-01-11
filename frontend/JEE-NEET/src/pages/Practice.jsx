import { useRef, useCallback, useEffect, memo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import api from '../utils/api'; // Import the axios instance
import { API_BASE_URL } from '../utils/config';
import { getCachedData, setCachedData, saveTestState, getTestState } from '../utils/apiCache'; // Reusing saveTestState for practice too
import {
    setQuestionIndex,
    selectOption,
    submitAnswer,
    clearSelection,
    nextQuestion,
    prevQuestion,
    resetPractice,
    restorePractice
} from '../store/practiceSlice';
import { setQuestionsCache } from '../store/contentSlice';


// Memoized Option Button Component
const OptionButton = memo(({ opt, index, isSubmitted, selectedOption, answer, onSelect }) => {
    return (
        <button
            className="option-btn"
            onClick={() => onSelect(opt)}
            style={{
                borderColor: isSubmitted && opt === answer ? 'var(--accent-teal)' :
                    isSubmitted && opt === selectedOption && opt !== answer ? '#ef4444' :
                        selectedOption === opt ? 'var(--accent-cyan)' : 'var(--card-border)',
                backgroundColor: isSubmitted && opt === answer ? 'rgba(45, 212, 191, 0.1)' :
                    isSubmitted && opt === selectedOption && opt !== answer ? 'rgba(239, 68, 68, 0.1)' :
                        selectedOption === opt ? 'rgba(34, 211, 238, 0.1)' : 'rgba(255, 255, 255, 0.03)'
            }}
        >
            <span style={{ marginRight: '1rem', opacity: 0.5, minWidth: '20px' }}>{String.fromCharCode(65 + index)}.</span>
            {opt}
        </button>
    );
});

OptionButton.displayName = 'OptionButton';

function Practice() {
    const { exam, subject, chapter } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { currentQuestionIndex, selectedOption, isSubmitted, responses } = useSelector((state) => state.practice);

    // Cache key
    const cacheKey = `practice-questions-${exam.toLowerCase()}-${subject.toLowerCase()}-${chapter}`;
    // We use a unique key for progress persistence
    const progressKey = `practice-progress-${exam.toLowerCase()}-${subject.toLowerCase()}-${chapter}`;

    const cachedQuestions = useSelector((state) => state.content.questions[cacheKey]);

    // Local state for fetched questions
    const [qList, setQList] = useState(cachedQuestions || []);
    const [loading, setLoading] = useState(!cachedQuestions);
    const [error, setError] = useState('');
    const fetchingRef = useRef(false);

    // Fetch questions from backend
    useEffect(() => {
        // 1. Check if we have saved progress to restore
        const savedProgress = getTestState(progressKey); // Reusing usage of localStorage wrapper
        if (savedProgress && savedProgress.questions && savedProgress.questions.length > 0) {
            console.log("Restoring practice session...");
            // If we have saved progress, we use the saved questions list to avoid refetching mismatch
            // although usually questions list is static per chapter.
            // However, let's trust the cache/API more for "source of truth" on content updates.
            // Actually, simpler: load questions from cache/API, then restore *user state* (responses).

            // If we don't have qList yet, we need to get it first.
        }

        const fetchQuestions = async () => {
            if (fetchingRef.current) return;

            // Check memory cache from Redux
            if (cachedQuestions) {
                setQList(cachedQuestions);
                setLoading(false);
                return;
            }

            // Check persistence cache (localStorage) for questions
            const localCached = getCachedData(cacheKey);
            if (localCached && localCached.length > 0) {
                setQList(localCached);
                dispatch(setQuestionsCache({ key: cacheKey, data: localCached }));
                setLoading(false);
                return;
            }

            fetchingRef.current = true;
            setLoading(true);
            try {
                // Determine exam/subject if not detected (fallback logic could be improved)
                const examParam = exam ? exam.toLowerCase() : 'jee-mains';
                const subjectParam = subject ? subject.toLowerCase() : 'physics';

                const encodedChapter = encodeURIComponent(chapter);
                const res = await api.get(`/api/v1/resources/questions`, {
                    params: {
                        exam: examParam,
                        subject: subjectParam,
                        chapter: chapter
                    }
                });
                const data = res.data;

                if (data.status === 'success') {
                    setQList(data.data.questions);
                    dispatch(setQuestionsCache({ key: cacheKey, data: data.data.questions }));
                    setCachedData(cacheKey, data.data.questions); // Save to storage
                } else {
                    setError(data.message || 'Failed to fetch questions');
                }
            } catch (err) {
                // Axios error handling
                console.error(err);
                setError('Failed to load questions. Please try again.');
            } finally {
                setLoading(false);
                fetchingRef.current = false;
            }
        };

        if (exam && subject && chapter) {
            fetchQuestions();
        }
    }, [exam, subject, chapter, cachedQuestions, dispatch, cacheKey]);

    // Restore Progress ONLY after questions are loaded
    useEffect(() => {
        if (!loading && qList.length > 0) {
            const savedProgress = getTestState(progressKey);
            if (savedProgress) {
                // Restore
                dispatch(restorePractice(savedProgress));
            }
        }
    }, [loading, qList.length, progressKey, dispatch]);

    // Save Progress on Change
    useEffect(() => {
        if (!loading && qList.length > 0) {
            const stateToSave = {
                currentQuestionIndex,
                selectedOption,
                isSubmitted,
                responses
            };
            saveTestState(progressKey, stateToSave);
        }
    }, [currentQuestionIndex, selectedOption, isSubmitted, responses, loading, qList.length, progressKey]);

    // Cleanup on unmount? 
    // Usually practice mode persists until manually reset or finished. 
    // If user wants "refreshing" to keep state, we should NOT reset on unmount.
    // BUT we must reset if we navigate to a *different* chapter.
    // The `key` in `resetPractice` logic handles this? No.
    // We should use a separate useEffect to reset ONLY if chapter changes.
    // Actually, React unmounts when route changes.
    // If we want to persist across refresh, we CANNOT `resetPractice` on unmount.
    // We should `resetPractice` on *mount* if we decide NOT to restore? 
    // No, we want to restore on mount.
    // So we should effectively remove the `resetPractice` on unmount.
    // Instead, rely on `useEffect` with `[chapter]` dependency to reset if chapter changes?
    // Route change triggers component remount usually.

    // We will clean up `resetPractice` on unmount line, and instead reset on init if needed.
    // Actually, unmount cleanup is bad for persistence across page navigation if not SPA navigation.
    // But this is SPA.
    // If I leave page and come back, I want state?
    // If I leave to Home and come back to Practice, do I want state? Yes usually.
    // So I remove `resetPractice` from unmount.

    // However, if I change chapter, `key` changes, and I load different data.
    // I should ensure `resetPractice` is called when mounting a NEW chapter.
    // The existing `useEffect(() => { dispatch(resetPractice()) ... }, [chapter])` handles this?
    // It runs on mount. So it resets state. Then I restore it from localStorage. This is fine.

    // One nuance: `useEffect` dependencies.
    // If I added restoration logic, I need to make sure `resetPractice` doesn't overwrite restoration.
    // `useEffect` runs in order.

    // Let's refactor the reset/restore logic.
    useEffect(() => {
        // Reset purely on mount/chapter change
        dispatch(resetPractice());
    }, [dispatch, chapter]);
    // Note: This needs to run BEFORE restoration. React runs effects in order? 
    // Actually standard `useEffect` runs after render.
    // If I have multiple useEffects, they run in order of definition.
    // So Reset first, then Fetch/Restore.




    const currentQuestion = qList[currentQuestionIndex];

    const handleOptionSelect = useCallback((opt) => {
        if (!isSubmitted) {
            dispatch(selectOption(opt));
        }
    }, [dispatch, isSubmitted]);

    const handleSubmission = useCallback(() => {
        if (selectedOption) {
            dispatch(submitAnswer());
        }
    }, [dispatch, selectedOption]);

    const handleClearSelection = useCallback(() => {
        dispatch(clearSelection());
    }, [dispatch]);

    const handleNextQuestion = useCallback(() => {
        if (currentQuestionIndex < qList.length - 1) {
            dispatch(nextQuestion());
        }
    }, [dispatch, currentQuestionIndex, qList.length]);

    const handlePrevQuestion = useCallback(() => {
        if (currentQuestionIndex > 0) {
            dispatch(prevQuestion());
        }
    }, [dispatch, currentQuestionIndex]);

    if (loading) return <div className="page container hero"><h2>Loading questions...</h2></div>;
    if (error) return <div className="page container hero"><h2>{error}</h2><button className="auth-btn" onClick={() => navigate(-1)}>Go Back</button></div>;

    if (!currentQuestion) {
        return (
            <div className="page container hero">
                <h2>No questions available for this chapter yet.</h2>
                <button className="auth-btn" style={{ marginTop: '1rem' }} onClick={() => navigate(-1)}>Go Back</button>
            </div>
        );
    }

    // Adapt backend field names to frontend logic (questionText -> question, correctAnswer -> answer)
    console.log("Practice Render - currentQuestion:", currentQuestion); // DEBUG
    const questionText = currentQuestion?.questionText || "Question text missing";
    const answer = currentQuestion?.correctAnswer;
    const isCorrect = selectedOption === answer;

    return (
        <div className="page container hero" style={{ justifyContent: 'flex-start', paddingTop: '2rem' }}>
            <button
                onClick={() => navigate(-1)}
                className="auth-btn"
                style={{
                    width: 'auto',
                    padding: '0.5rem 1rem',
                    marginBottom: '1rem',
                    alignSelf: 'flex-start',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--text-secondary)',
                    color: 'var(--text-secondary)'
                }}
            >
                &larr; Back
            </button>

            <div className="question-card">
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                    <span>Question {currentQuestionIndex + 1} of {qList.length}</span>
                    <span>{subject.toUpperCase()} / {chapter}</span>
                </div>

                <h2 className="question-text">{questionText}</h2>

                {currentQuestion.image && (
                    <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
                        <img
                            src={currentQuestion.image.startsWith('http') ? currentQuestion.image : `${API_BASE_URL}${currentQuestion.image}`}
                            alt="Question"
                            loading="lazy"
                            style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', cursor: 'zoom-in' }}
                            onClick={(e) => {
                                if (e.target.style.maxHeight === '300px') {
                                    e.target.style.maxHeight = 'none';
                                    e.target.style.cursor = 'zoom-out';
                                } else {
                                    e.target.style.maxHeight = '300px';
                                    e.target.style.cursor = 'zoom-in';
                                }
                            }}
                        />
                    </div>
                )}

                <div className="options-grid">
                    {currentQuestion?.options?.map((opt, index) => (
                        <OptionButton
                            key={index}
                            opt={opt}
                            index={index}
                            isSubmitted={isSubmitted}
                            selectedOption={selectedOption}
                            answer={answer}
                            onSelect={handleOptionSelect}
                        />
                    ))}
                </div>

                <div className="practice-actions" style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem', width: '100%', justifyContent: 'center' }}>
                    <button
                        className="auth-btn"
                        style={{ backgroundColor: 'transparent', border: '1px solid var(--text-secondary)', color: 'var(--text-primary)' }}
                        onClick={handlePrevQuestion}
                        disabled={currentQuestionIndex === 0}
                    >
                        Previous
                    </button>

                    {!isSubmitted ? (
                        <>
                            <button
                                className="auth-btn"
                                style={{ backgroundColor: 'transparent', border: '1px solid #ef4444', color: '#ef4444' }}
                                onClick={handleClearSelection}
                            >
                                Clear Selection
                            </button>
                            <button
                                className="auth-btn"
                                style={{ backgroundColor: 'transparent', border: '1px solid var(--text-secondary)', color: 'var(--text-secondary)' }}
                                onClick={handleNextQuestion}
                                disabled={currentQuestionIndex === qList.length - 1}
                            >
                                Skip
                            </button>
                            <button
                                className="auth-btn"
                                onClick={handleSubmission}
                                disabled={!selectedOption}
                                style={{ opacity: !selectedOption ? 0.5 : 1, cursor: !selectedOption ? 'not-allowed' : 'pointer' }}
                            >
                                Submit
                            </button>
                        </>
                    ) : (
                        <button
                            className="auth-btn"
                            onClick={handleNextQuestion}
                            disabled={currentQuestionIndex === qList.length - 1}
                        >
                            {currentQuestionIndex === qList.length - 1 ? 'Finish' : 'Next Question'}
                        </button>
                    )}
                </div>

                {isSubmitted && (
                    <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', width: '100%', textAlign: 'left', border: '1px solid var(--card-border)' }}>
                        <h3 style={{ color: isCorrect ? 'var(--accent-teal)' : '#ef4444', marginBottom: '0.5rem' }}>
                            {isCorrect ? 'Correct Answer!' : 'Incorrect'}
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                            <strong style={{ color: 'var(--text-primary)' }}>Solution:</strong> {currentQuestion.solution}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Practice;
