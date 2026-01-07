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

export const removeCachedData = (key) => {
    console.log(`[Cache Remove] ${key}`);
    apiCache.delete(key);
    try {
        localStorage.removeItem(key);
    } catch (e) { }
};

// Cache Versioning (Global Busting)
const CACHE_VERSION = 'v1.0.1'; // Increment this to force-clear client caches

export const checkCacheVersion = () => {
    try {
        const storedVersion = localStorage.getItem('app_cache_version');
        if (storedVersion !== CACHE_VERSION) {
            console.log(`[Cache Version Mismatch] Clearing stale data. New: ${CACHE_VERSION}, Old: ${storedVersion}`);

            // Clear only content keys, preserve auth (token, user)
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (
                    key.startsWith('chapters-') ||
                    key.startsWith('resources-') ||
                    key.startsWith('practice-questions-') ||
                    key.startsWith('practice-progress-')
                )) {
                    keysToRemove.push(key);
                }
            }

            keysToRemove.forEach(k => localStorage.removeItem(k));
            apiCache.clear(); // Clear memory too

            localStorage.setItem('app_cache_version', CACHE_VERSION);
            console.log(`[Cache Cleared] Removed ${keysToRemove.length} stale entries.`);
        }
    } catch (e) {
        console.warn("Failed to check cache version", e);
    }
};
