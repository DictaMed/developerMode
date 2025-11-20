/**
 * state.js
 * Manages the application state and notifies listeners of changes.
 */

const State = (function () {
    // Initial State
    const initialState = {
        currentTab: 'tab-normal',
        isAuthenticated: false,
        agentId: '',
        claimId: '',
        policyholderName: '',
        recordings: {}, // Map of sectionId -> base64 audio
        recordingStatus: {}, // Map of sectionId -> 'idle' | 'recording' | 'paused' | 'completed'
        completedSections: new Set(),
        isTestMode: false
    };

    let state = { ...initialState };
    const listeners = [];

    // Getters
    const get = () => ({ ...state });

    // Setters
    const update = (updates) => {
        const oldState = { ...state };
        state = { ...state, ...updates };
        notify(state, oldState);
    };

    const reset = () => {
        update(initialState);
    };

    // Subscription
    const subscribe = (listener) => {
        listeners.push(listener);
        return () => {
            const index = listeners.indexOf(listener);
            if (index > -1) listeners.splice(index, 1);
        };
    };

    const notify = (newState, oldState) => {
        listeners.forEach(listener => listener(newState, oldState));
    };

    // Specific Actions
    const setTab = (tabId) => {
        update({ currentTab: tabId });
    };

    const setAuthenticated = (auth, agentId = '') => {
        update({ isAuthenticated: auth, agentId });
    };

    const setClaimDetails = (id, name) => {
        update({ claimId: id, policyholderName: name });
    };

    const setRecordingStatus = (sectionId, status) => {
        const newStatus = { ...state.recordingStatus, [sectionId]: status };
        update({ recordingStatus: newStatus });
    };

    const saveRecording = (sectionId, audioBase64) => {
        const newRecordings = { ...state.recordings, [sectionId]: audioBase64 };
        const newCompleted = new Set(state.completedSections);
        newCompleted.add(sectionId);

        update({
            recordings: newRecordings,
            completedSections: newCompleted,
            recordingStatus: { ...state.recordingStatus, [sectionId]: 'completed' }
        });
    };

    const deleteRecording = (sectionId) => {
        const newRecordings = { ...state.recordings };
        delete newRecordings[sectionId];

        const newCompleted = new Set(state.completedSections);
        newCompleted.delete(sectionId);

        update({
            recordings: newRecordings,
            completedSections: newCompleted,
            recordingStatus: { ...state.recordingStatus, [sectionId]: 'idle' }
        });
    };

    const setTestMode = (isTest) => {
        update({ isTestMode: isTest });
    };

    return {
        get,
        subscribe,
        setTab,
        setAuthenticated,
        setClaimDetails,
        setRecordingStatus,
        saveRecording,
        deleteRecording,
        setTestMode,
        reset
    };
})();
