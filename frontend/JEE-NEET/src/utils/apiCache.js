const apiCache = new Map();

// API Response Caching (Questions)
export const getCachedData = (key) => {
    // 1. Check Memory
    if (apiCache.has(key)) {
        console.log(`[Cache Hit - Memory] ${key}`);
        return apiCache.get(key);
    }
    // 2. Check LocalStorage
    try {
        const item = localStorage.getItem(key);
        if (item) {
            console.log(`[Cache Hit - LocalStorage] ${key}`);
            const parsed = JSON.parse(item);
            // Re-hydrate memory cache
            apiCache.set(key, parsed);
            return parsed;
        }
    } catch (e) {
        console.warn("Failed to read from localStorage", e);
    }
    return null;
};

export const setCachedData = (key, data) => {
    console.log(`[Cache Set] ${key}`);
    apiCache.set(key, data);
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.warn("Failed to save to localStorage", e);
    }
};

// Test State Persistence (User Progress)
export const saveTestState = (testId, state) => {
    try {
        const key = `test_progress_${testId}`;
        localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
        console.warn("Failed to save test state", e);
    }
};

export const getTestState = (testId) => {
    try {
        const key = `test_progress_${testId}`;
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (e) {
        console.warn("Failed to load test state", e);
        return null;
    }
};

export const clearTestState = (testId) => {
    try {
        localStorage.removeItem(`test_progress_${testId}`);
    } catch (e) { }
};

export const clearCache = () => {
    apiCache.clear();
    // Optional: decided if we want to clear all localStorage or just api keys.
    // For now, leaving localStorage alone on manual clear unless specified.
};
