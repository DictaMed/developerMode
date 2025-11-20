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
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error('Error saving to localStorage:', e);
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
            return { success: false, error: error.message };
        }
    };

    return {
        saveLocal,
        loadLocal,
        clearLocal,
        submitClaim
    };
})();
