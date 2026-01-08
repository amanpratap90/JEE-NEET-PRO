const apiCache = new Map();

// API Response Caching (Questions)
export const getCachedData = (key) => {
    // 1. Check Memory
    if (apiCache.has(key)) {
        console.log(`[Cache Hit - Memory] ${key}`);
        return apiCache.get(key);
    }
    // 2. Check SessionStorage
    try {
        const item = sessionStorage.getItem(key);
        if (item) {
            console.log(`[Cache Hit - SessionStorage] ${key}`);
            const parsed = JSON.parse(item);
            // Re-hydrate memory cache
            apiCache.set(key, parsed);
            return parsed;
        }
    } catch (e) {
        console.warn("Failed to read from sessionStorage", e);
    }
    return null;
};

export const setCachedData = (key, data) => {
    console.log(`[Cache Set] ${key}`);
    apiCache.set(key, data);
    try {
        sessionStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.warn("Failed to save to sessionStorage", e);
    }
};

// Test State Persistence (User Progress)
export const saveTestState = (testId, state) => {
    try {
        const key = `test_progress_${testId}`;
        sessionStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
        console.warn("Failed to save test state", e);
    }
};

export const getTestState = (testId) => {
    try {
        const key = `test_progress_${testId}`;
        const item = sessionStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (e) {
        console.warn("Failed to load test state", e);
        return null;
    }
};

export const clearTestState = (testId) => {
    try {
        sessionStorage.removeItem(`test_progress_${testId}`);
    } catch (e) { }
};

export const clearCache = () => {
    apiCache.clear();
    // Optional: clear sessionStorage relevant keys if needed on manual clear
};

export const removeCachedData = (key) => {
    console.log(`[Cache Remove] ${key}`);
    apiCache.delete(key);
    try {
        sessionStorage.removeItem(key);
    } catch (e) { }
};

// Cache Versioning (Global Busting)
const CACHE_VERSION = 'v1.0.2'; // Increment to force-clear client caches

export const checkCacheVersion = () => {
    try {
        // We check local storage for version to clear stale local storage if we are migrating?
        // Or we use session storage for versioning too?
        // Let's keep versioning in localStorage to handle "across tabs" upgrades or just use sessionStorage.
        // Actually, if we are migrating FROM localStorage to sessionStorage, we should probably clear the old localStorage junk once.

        const storedVersion = localStorage.getItem('app_cache_version');
        if (storedVersion !== CACHE_VERSION) {
            console.log(`[Cache Version Mismatch] Clearing stale data. New: ${CACHE_VERSION}, Old: ${storedVersion}`);

            // Clear legacy localStorage data keys if they exist
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

            // Also clear sessionStorage
            sessionStorage.clear();

            apiCache.clear();

            localStorage.setItem('app_cache_version', CACHE_VERSION);
            console.log(`[Cache Cleared] Removed ${keysToRemove.length} stale entries.`);
        }
    } catch (e) {
        console.warn("Failed to check cache version", e);
    }
};
