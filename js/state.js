export const appState = {
    currentMode: 'normal', // 'normal' ou 'test'
    recordings: {
        normal: {},
        test: {}
    },
    autoSaveInterval: null,
    lastSaveTime: null,
    uploadedPhotos: [],
    audioRecorders: new Map()
};
