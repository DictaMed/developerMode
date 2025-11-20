/**
 * ui.js
 * Handles DOM updates and rendering based on state.
 */

const UI = (function () {
    // DOM Elements
    const els = {
        tabs: document.querySelectorAll('.tab-content'),
        navItems: document.querySelectorAll('.nav-item'),
        authView: document.getElementById('auth-view'),
        dashboardView: document.getElementById('dashboard-view'),
        recordingSections: document.getElementById('recording-sections'),
        testRecordingSections: document.getElementById('test-recording-sections'),
        completedCount: document.getElementById('completed-count'),
        submitBtn: document.getElementById('submit-claim-btn'),
        testSubmitBtn: document.getElementById('test-submit-btn'),
        faqList: document.getElementById('faq-list'),
        inputs: {
            agentId: document.getElementById('agent-id'),
            accessCode: document.getElementById('access-code'),
            claimId: document.getElementById('claim-id'),
            policyholderName: document.getElementById('policyholder-name')
        }
    };

    // Render Functions
    const renderTabs = (activeTabId) => {
        els.tabs.forEach(tab => {
            if (tab.id === activeTabId) {
                tab.classList.add('active');
                // Trigger reflow for animation if needed
            } else {
                tab.classList.remove('active');
            }
        });

        els.navItems.forEach(item => {
            if (item.dataset.tab === activeTabId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    };

    const renderAuth = (isAuthenticated) => {
        if (isAuthenticated) {
            els.authView.classList.add('hidden');
            els.dashboardView.classList.remove('hidden');
        } else {
            els.authView.classList.remove('hidden');
            els.dashboardView.classList.add('hidden');
        }
    };

    const createRecordingCard = (section, isTestMode = false) => {
        const card = document.createElement('div');
        card.className = 'card glass-card recording-section';
        card.dataset.id = section.id;

        const header = `
            <div class="card-header">
                <span class="icon">${section.icon}</span>
                <h3>${section.title}</h3>
            </div>
            <p class="text-muted">${section.description}</p>
        `;

        const controls = `
            <div class="recording-controls">
                <div class="timer-display hidden" id="timer-${section.id}">00:00</div>
                
                <button class="btn btn-danger btn-record" data-action="record" data-section="${section.id}">
                    <span>●</span> Record
                </button>
                
                <button class="btn btn-warning btn-pause hidden" data-action="pause" data-section="${section.id}">
                    <span>⏸</span> Pause
                </button>
                
                <button class="btn btn-secondary btn-stop hidden" data-action="stop" data-section="${section.id}">
                    <span>⏹</span> Stop
                </button>
                
                <button class="btn btn-info btn-play hidden" data-action="play" data-section="${section.id}">
                    <span>▶</span> Play Review
                </button>
                
                <button class="btn btn-danger btn-delete hidden" data-action="delete" data-section="${section.id}">
                    <span>🗑</span>
                </button>
            </div>
            <div class="status-badge hidden" id="status-${section.id}"></div>
        `;

        card.innerHTML = header + controls;
        return card;
    };

    const renderRecordingSections = () => {
        // Normal Mode
        els.recordingSections.innerHTML = '';
        CONFIG.SECTIONS.forEach(section => {
            els.recordingSections.appendChild(createRecordingCard(section));
        });

        // Test Mode
        els.testRecordingSections.innerHTML = '';
        CONFIG.SECTIONS.forEach(section => {
            els.testRecordingSections.appendChild(createRecordingCard(section, true));
        });
    };

    const updateRecordingState = (sectionId, status) => {
        // Find controls for this section (handle both normal and test mode instances if needed, 
        // but usually we only update the active view's controls)
        const sectionCards = document.querySelectorAll(`.recording-section[data-id="${sectionId}"]`);

        sectionCards.forEach(card => {
            const btnRecord = card.querySelector('.btn-record');
            const btnPause = card.querySelector('.btn-pause');
            const btnStop = card.querySelector('.btn-stop');
            const btnPlay = card.querySelector('.btn-play');
            const btnDelete = card.querySelector('.btn-delete');
            const timer = card.querySelector('.timer-display');
            const statusBadge = card.querySelector(`#status-${sectionId}`);

            // Reset all
            [btnRecord, btnPause, btnStop, btnPlay, btnDelete, timer].forEach(el => el.classList.add('hidden'));
            card.classList.remove('recording-active');

            switch (status) {
                case 'idle':
                    btnRecord.classList.remove('hidden');
                    btnRecord.innerHTML = '<span>●</span> Record';
                    break;
                case 'recording':
                    btnPause.classList.remove('hidden');
                    btnStop.classList.remove('hidden');
                    timer.classList.remove('hidden');
                    card.classList.add('recording-active');
                    break;
                case 'paused':
                    btnRecord.classList.remove('hidden');
                    btnRecord.innerHTML = '<span>●</span> Resume';
                    btnStop.classList.remove('hidden');
                    timer.classList.remove('hidden');
                    break;
                case 'completed':
                    btnPlay.classList.remove('hidden');
                    btnDelete.classList.remove('hidden');
                    statusBadge.classList.remove('hidden');
                    statusBadge.textContent = '✓ Recorded';
                    statusBadge.style.color = CONFIG.COLORS.SUCCESS;
                    break;
            }
        });
    };

    const updateProgress = (count, total) => {
        els.completedCount.textContent = count;
        const isComplete = count > 0; // At least one section for demo purposes, or logic as per req

        els.submitBtn.disabled = !isComplete;
        els.testSubmitBtn.disabled = !isComplete;

        // Update dots
        const dots = document.querySelectorAll('.dot');
        dots.forEach((dot, index) => {
            if (index < count) {
                dot.classList.add('active');
                dot.style.background = CONFIG.COLORS.SUCCESS;
            } else {
                dot.classList.remove('active');
                dot.style.background = '#CBD5E0';
            }
        });
    };

    const renderFAQ = () => {
        const faqs = [
            { q: "What is ClaimSnap?", a: "ClaimSnap is an AI-powered tool for instantly documenting insurance claims using voice and photos." },
            { q: "Is my data secure?", a: "Yes, all data is encrypted in transit and at rest. We use bank-grade security protocols." },
            { q: "How does Test Mode work?", a: "Test Mode allows you to try the app features without logging in. Data is sent to a public demo sheet." },
            { q: "Can I edit recordings?", a: "You can re-record any section before submission. Once submitted, you'll need to contact support for changes." },
            { q: "What devices are supported?", a: "ClaimSnap works on all modern smartphones, tablets, and desktop computers with a microphone." },
            { q: "How much does it cost?", a: "We offer flexible pricing plans for independent adjusters and enterprise licenses for carriers." },
            { q: "How accurate is the transcription?", a: "Our AI achieves over 98% accuracy, even with background noise and technical terminology." },
            { q: "Where is data stored?", a: "Data is securely stored in our cloud infrastructure and synced to your designated Google Sheets." }
        ];

        els.faqList.innerHTML = faqs.map(item => `
            <div class="faq-item">
                <div class="faq-question">
                    ${item.q}
                    <span class="toggle">+</span>
                </div>
                <div class="faq-answer">${item.a}</div>
            </div>
        `).join('');

        // Add click listeners
        document.querySelectorAll('.faq-question').forEach(q => {
            q.addEventListener('click', () => {
                const item = q.parentElement;
                item.classList.toggle('open');
                const toggle = q.querySelector('.toggle');
                toggle.textContent = item.classList.contains('open') ? '-' : '+';
            });
        });
    };

    // Character Counter Logic
    const initCharCounters = () => {
        document.querySelectorAll('input[maxlength]').forEach(input => {
            const counter = input.parentElement.querySelector('.char-counter');
            if (counter) {
                input.addEventListener('input', () => {
                    const len = input.value.length;
                    const max = input.getAttribute('maxlength');
                    counter.textContent = `${len}/${max}`;

                    if (len >= max) {
                        counter.classList.add('limit');
                        counter.classList.remove('warning');
                    } else if (len >= max * 0.8) {
                        counter.classList.add('warning');
                        counter.classList.remove('limit');
                    } else {
                        counter.classList.remove('warning', 'limit');
                    }
                });
            }
        });
    };

    return {
        renderTabs,
        renderAuth,
        renderRecordingSections,
        updateRecordingState,
        updateProgress,
        renderFAQ,
        initCharCounters,
        els // Expose elements for event binding
    };
})();
