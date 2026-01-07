import { configureStore } from '@reduxjs/toolkit';
import practiceReducer from './practiceSlice';
import testReducer from './testSlice';
import contentReducer from './contentSlice';

export const store = configureStore({
    reducer: {
        practice: practiceReducer,
        test: testReducer,
        content: contentReducer,
    },
});
