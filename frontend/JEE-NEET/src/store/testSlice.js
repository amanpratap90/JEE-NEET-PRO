import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    testId: null,
    currentSubject: 'Physics',
    currentQuestionIndex: 0,
    questions: {
        Physics: [],
        Chemistry: [],
        Mathematics: [], // Or Biology for NEET
    },
    responses: {}, // { [questionId]: { selectedOption: string, status: 'visited'|'answered'|'marked'|'marked_answered' } }
    timeLeft: 10800, // 3 hours in seconds
    isTestActive: false,
    testSubmitted: false,
};

const testSlice = createSlice({
    name: 'test',
    initialState,
    reducers: {
        restoreTest: (state, action) => {
            return { ...state, ...action.payload };
        },
        initializeTest: (state, action) => {
            const { testId, questions, subjects } = action.payload;
            state.testId = testId;
            state.questions = questions; // Expecting { Physics: [...], Chemistry: [...] }
            state.currentSubject = subjects[0];
            state.currentQuestionIndex = 0;
            state.responses = {};
            state.timeLeft = 10800;
            state.isTestActive = true;
            state.testSubmitted = false;
        },
        switchSubject: (state, action) => {
            state.currentSubject = action.payload;
            state.currentQuestionIndex = 0;
        },
        jumpToQuestion: (state, action) => {
            state.currentQuestionIndex = action.payload;
        },
        markVisited: (state, action) => {
            const { questionId } = action.payload;
            if (!state.responses[questionId]) {
                state.responses[questionId] = { status: 'visited', selectedOption: null };
            }
        },
        saveAndNext: (state, action) => {
            const { questionId, selectedOption } = action.payload;
            state.responses[questionId] = {
                selectedOption,
                status: selectedOption ? 'answered' : 'visited'
            };

            // Logic to move to next question
            const currentSubjectQuestions = state.questions[state.currentSubject];
            if (state.currentQuestionIndex < currentSubjectQuestions.length - 1) {
                state.currentQuestionIndex += 1;
            }
        },
        markForReview: (state, action) => {
            const { questionId, selectedOption } = action.payload;
            state.responses[questionId] = {
                selectedOption,
                status: selectedOption ? 'marked_answered' : 'marked'
            };

            // Logic to move to next question
            const currentSubjectQuestions = state.questions[state.currentSubject];
            if (state.currentQuestionIndex < currentSubjectQuestions.length - 1) {
                state.currentQuestionIndex += 1;
            }
        },
        clearResponse: (state, action) => {
            const { questionId } = action.payload;
            state.responses[questionId] = { status: 'visited', selectedOption: null };
        },
        tickTimer: (state) => {
            if (state.timeLeft > 0 && state.isTestActive) {
                state.timeLeft -= 1;
            } else if (state.timeLeft === 0) {
                state.isTestActive = false;
                state.testSubmitted = true;
            }
        },
        submitTest: (state) => {
            state.isTestActive = false;
            state.testSubmitted = true;
        }
    },
});

export const {
    restoreTest,
    initializeTest,
    switchSubject,
    jumpToQuestion,
    markVisited,
    saveAndNext,
    markForReview,
    clearResponse,
    tickTimer,
    submitTest
} = testSlice.actions;

export default testSlice.reducer;
