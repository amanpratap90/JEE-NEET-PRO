import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    // Structure: { 'jee-mains-physics': ['Kinematics', ...] }
    chapters: {},
    // Structure: { 'jee-mains-physics-kinematics': [{question...}, ...] }
    questions: {},
};

const contentSlice = createSlice({
    name: 'content',
    initialState,
    reducers: {
        setChaptersCache: (state, action) => {
            const { key, data } = action.payload;
            state.chapters[key] = data;
        },
        setQuestionsCache: (state, action) => {
            const { key, data } = action.payload;
            state.questions[key] = data;
        },
        clearCache: (state) => {
            state.chapters = {};
            state.questions = {};
        }
    },
});

export const { setChaptersCache, setQuestionsCache, clearCache } = contentSlice.actions;

export default contentSlice.reducer;
