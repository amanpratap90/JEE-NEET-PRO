import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    currentQuestionIndex: 0,
    selectedOption: null,
    isSubmitted: false,
    responses: {}, // { [questionIndex]: { selectedOption, isSubmitted, isCorrect } }
};

const practiceSlice = createSlice({
    name: 'practice',
    initialState,
    reducers: {
        setQuestionIndex: (state, action) => {
            state.currentQuestionIndex = action.payload;
            // Load state for this question if exists
            const saved = state.responses[state.currentQuestionIndex];
            if (saved) {
                state.selectedOption = saved.selectedOption;
                state.isSubmitted = saved.isSubmitted;
            } else {
                state.selectedOption = null;
                state.isSubmitted = false;
            }
        },
        selectOption: (state, action) => {
            state.selectedOption = action.payload;
        },
        submitAnswer: (state, action) => {
            state.isSubmitted = true;
            // Save to responses
            // We can optionally pass isCorrect payload if we want to store it
            state.responses[state.currentQuestionIndex] = {
                selectedOption: state.selectedOption,
                isSubmitted: true
            };
        },
        clearSelection: (state) => {
            state.selectedOption = null;
            state.isSubmitted = false;
            delete state.responses[state.currentQuestionIndex];
        },
        nextQuestion: (state) => {
            state.currentQuestionIndex += 1;
            const saved = state.responses[state.currentQuestionIndex];
            if (saved) {
                state.selectedOption = saved.selectedOption;
                state.isSubmitted = saved.isSubmitted;
            } else {
                state.selectedOption = null;
                state.isSubmitted = false;
            }
        },
        prevQuestion: (state) => {
            state.currentQuestionIndex -= 1;
            const saved = state.responses[state.currentQuestionIndex];
            if (saved) {
                state.selectedOption = saved.selectedOption;
                state.isSubmitted = saved.isSubmitted;
            } else {
                state.selectedOption = null;
                state.isSubmitted = false;
            }
        },
        restorePractice: (state, action) => {
            return { ...state, ...action.payload };
        },
        resetPractice: (state) => {
            state.currentQuestionIndex = 0;
            state.selectedOption = null;
            state.isSubmitted = false;
            state.responses = {};
        }
    },
});

export const {
    setQuestionIndex,
    selectOption,
    submitAnswer,
    clearSelection,
    nextQuestion,
    prevQuestion,
    restorePractice,
    resetPractice
} = practiceSlice.actions;

export default practiceSlice.reducer;
