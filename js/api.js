/**
 * api.js
 * Handles data persistence and communication with the backend (Webhook).
 */

const API = (function () {
    const STORAGE_KEY = 'claimsnap_unsaved_data';

    // Save to LocalStorage (Auto-save)
    const saveLocal = (data) => {
        if (!CONFIG.ENABLE_LOCAL_STORAGE) return;
        try {
            const serialized = JSON.stringify(data);
            // Check for quota (approximate)
            if (serialized.length > 4500000) { // ~4.5MB safety limit
                console.warn('LocalStorage quota nearing limit. Clearing old data or warning user.');
                // In a real app, we might implement LRU or prompt user
            }
            localStorage.setItem(STORAGE_KEY, serialized);
        } catch (e) {
            console.error('Error saving to localStorage:', e);
            if (e.name === 'QuotaExceededError') {
                alert('Local storage is full. Please clear some space or submit pending claims.');
            }
        }
    };

    // Load from LocalStorage
    const loadLocal = () => {
        if (!CONFIG.ENABLE_LOCAL_STORAGE) return null;
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Error loading from localStorage:', e);
            return null;
        }
    };

    // Clear LocalStorage
    const clearLocal = () => {
        if (!CONFIG.ENABLE_LOCAL_STORAGE) return;
        localStorage.removeItem(STORAGE_KEY);
    };

    // Submit Data to Webhook
    const submitClaim = async (claimData) => {
        try {
            const response = await fetch(CONFIG.WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(claimData)
            });

            if (!response.ok) {
                throw new Error(`Submission failed: ${response.statusText}`);
            }

            const result = await response.json();
            return { success: true, data: result };
        } catch (error) {
            console.error('Submission error:', error);
            let errorMessage = error.message;
            if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
                errorMessage = 'Network error. Please check your internet connection.';
            }
            return { success: false, error: errorMessage };
        }
    };

    return {
        saveLocal,
        loadLocal,
        clearLocal,
        submitClaim
    };
})();
