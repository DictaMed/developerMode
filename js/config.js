export const CONFIG = {
    API_ENDPOINTS: {
        NORMAL: 'https://n8n.srv1104707.hstgr.cloud/webhook/DictaMedNormalMode',
        TEST: 'https://n8n.srv1104707.hstgr.cloud/webhook/DictaMed'
    },
    LIMITS: {
        MAX_AUDIO_DURATION: 120, // seconds
        MAX_PHOTO_SIZE: 10 * 1024 * 1024, // 10MB
        MAX_AUDIO_SIZE: 50 * 1024 * 1024, // 50MB
        MAX_PHOTOS: 5
    },
    SECTIONS: {
        NORMAL: ['partie1', 'partie2', 'partie3', 'partie4'],
        TEST: ['clinique', 'antecedents', 'biologie']
    },
    STORAGE_KEYS: {
        AUTOSAVE: 'dictamed_autosave',
        AUTH: 'dictamed_auth_credentials'
    }
};
