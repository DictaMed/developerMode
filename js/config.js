const CONFIG = {
    APP_NAME: "ClaimSnap",
    VERSION: "1.0.0",

    // API Configuration
    // User must replace this with their actual N8N/Webhook URL
    WEBHOOK_URL: "https://primary-production-4263.up.railway.app/webhook/claim-snap-ingest",

    // Feature Flags
    ENABLE_HAPTICS: true,
    ENABLE_LOCAL_STORAGE: true,

    // Limits
    MAX_RECORDING_TIME_MS: 300000, // 5 minutes
    INPUT_MAX_CHARS: 50,

    // Colors for JS usage (matching CSS)
    COLORS: {
        PRIMARY: '#0F52BA',
        SECONDARY: '#FF5722',
        SUCCESS: '#10B981',
        WARNING: '#F59E0B',
        DANGER: '#EF4444'
    },

    // Sections Configuration
    SECTIONS: [
        {
            id: 'incident_details',
            title: '1. Incident Details',
            description: 'Describe what happened, when, and where.',
            icon: '💥'
        },
        {
            id: 'damage_assessment',
            title: '2. Damage Assessment',
            description: 'Describe the visible damage to property/vehicles.',
            icon: '🚗'
        },
        {
            id: 'witness_statements',
            title: '3. Witness/Police Info',
            description: 'Record witness names or police report numbers.',
            icon: '👮'
        },
        {
            id: 'additional_notes',
            title: '4. Additional Notes',
            description: 'Any other relevant information.',
            icon: '📝',
            optional: true
        }
    ]
};

// Freeze config to prevent accidental modifications
Object.freeze(CONFIG);
