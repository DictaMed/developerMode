/**
 * main.js
 * Application entry point and event orchestration.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize UI
    UI.renderRecordingSections();
    UI.renderFAQ();
    UI.initCharCounters();

    // Subscribe to State Changes
    State.subscribe((newState, oldState) => {
        // Tab Switching
        if (newState.currentTab !== oldState.currentTab) {
            UI.renderTabs(newState.currentTab);
        }

        // Authentication
        if (newState.isAuthenticated !== oldState.isAuthenticated) {
            UI.renderAuth(newState.isAuthenticated);
        }

        // Recording Status
        if (newState.recordingStatus !== oldState.recordingStatus) {
            Object.keys(newState.recordingStatus).forEach(sectionId => {
                if (newState.recordingStatus[sectionId] !== oldState.recordingStatus[sectionId]) {
                    UI.updateRecordingState(sectionId, newState.recordingStatus[sectionId]);
                }
            });
        }

        // Progress
        if (newState.completedSections !== oldState.completedSections) {
            UI.updateProgress(newState.completedSections.size, CONFIG.SECTIONS.length);
        }
    });

    // Event Listeners

    // Navigation
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabId = btn.dataset.tab;
            State.setTab(tabId);

            // Handle Test Mode flag
            if (tabId === 'tab-test') {
                State.setTestMode(true);
            } else {
                State.setTestMode(false);
            }
        });
    });

    // Internal Links
    document.querySelectorAll('.nav-to-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.target;
            State.setTab(target);
            if (target === 'tab-test') State.setTestMode(true);
        });
    });

    // Login
    document.getElementById('login-btn').addEventListener('click', () => {
        const agentId = document.getElementById('agent-id').value;
        const accessCode = document.getElementById('access-code').value;

        if (agentId && accessCode) {
            // Mock validation
            State.setAuthenticated(true, agentId);
            // Haptic feedback
            if (CONFIG.ENABLE_HAPTICS && navigator.vibrate) navigator.vibrate(50);
        } else {
            alert('Please enter Agent ID and Access Code');
        }
    });

    // Recording Controls Delegation
    const handleRecordingAction = async (action, sectionId) => {
        if (CONFIG.ENABLE_HAPTICS && navigator.vibrate) navigator.vibrate(50);

        switch (action) {
            case 'record':
                const started = await AudioRecorder.start();
                if (started) {
                    State.setRecordingStatus(sectionId, 'recording');
                    startTimer(sectionId);
                }
                break;
            case 'pause':
                AudioRecorder.pause();
                State.setRecordingStatus(sectionId, 'paused');
                stopTimer(sectionId);
                break;
            case 'stop':
                const audioBase64 = await AudioRecorder.stop();
                State.saveRecording(sectionId, audioBase64);
                stopTimer(sectionId);
                break;
            case 'play':
                const audioData = State.get().recordings[sectionId];
                if (audioData) {
                    const audio = new Audio(audioData);
                    audio.play();
                }
                break;
            case 'delete':
                if (confirm('Are you sure you want to delete this recording?')) {
                    State.deleteRecording(sectionId);
                }
                break;
        }
    };

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        if (btn.dataset.action && btn.dataset.section) {
            handleRecordingAction(btn.dataset.action, btn.dataset.section);
        }
    });

    // Submission
    const handleSubmit = async (isTestMode) => {
        const state = State.get();
        const claimId = isTestMode ? document.getElementById('test-claim-id').value : document.getElementById('claim-id').value;
        const policyholder = isTestMode ? 'TEST_USER' : document.getElementById('policyholder-name').value;

        if (!claimId) {
            alert('Please enter a Claim ID');
            return;
        }

        const payload = {
            claimId,
            policyholder,
            agentId: state.agentId || 'GUEST',
            isTestMode,
            timestamp: new Date().toISOString(),
            recordings: state.recordings,
            completedSections: Array.from(state.completedSections)
        };

        const btn = isTestMode ? document.getElementById('test-submit-btn') : document.getElementById('submit-claim-btn');
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Submitting...';

        const result = await API.submitClaim(payload);

        if (result.success) {
            alert('Claim submitted successfully!');
            // Reset or redirect
            if (!isTestMode) {
                // Clear form logic could go here
            }
        } else {
            alert('Submission failed: ' + result.error);
        }

        btn.disabled = false;
        btn.textContent = originalText;
    };

    document.getElementById('submit-claim-btn').addEventListener('click', () => handleSubmit(false));
    document.getElementById('test-submit-btn').addEventListener('click', () => handleSubmit(true));

    // Timer Logic
    const timers = {};

    const startTimer = (sectionId) => {
        const timerEl = document.getElementById(`timer-${sectionId}`);
        let seconds = 0;
        timerEl.textContent = '00:00';

        timers[sectionId] = setInterval(() => {
            seconds++;
            const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
            const secs = (seconds % 60).toString().padStart(2, '0');
            timerEl.textContent = `${mins}:${secs}`;
        }, 1000);
    };

    const stopTimer = (sectionId) => {
        if (timers[sectionId]) {
            clearInterval(timers[sectionId]);
            delete timers[sectionId];
        }
    };
});
