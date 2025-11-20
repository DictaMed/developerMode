/**
 * audio.js
 * Handles audio recording using the MediaRecorder API.
 */

const AudioRecorder = (function () {
    let mediaRecorder = null;
    let audioChunks = [];
    let stream = null;

    const start = async () => {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            mediaRecorder.start();
            return true;
        } catch (error) {
            console.error('Error starting recording:', error);
            return false;
        }
    };

    const stop = () => {
        return new Promise((resolve) => {
            if (!mediaRecorder) return resolve(null);

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const base64Audio = await blobToBase64(audioBlob);

                // Stop all tracks to release microphone
                stream.getTracks().forEach(track => track.stop());

                mediaRecorder = null;
                stream = null;
                audioChunks = [];

                resolve(base64Audio);
            };

            mediaRecorder.stop();
        });
    };

    const pause = () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.pause();
            return true;
        }
        return false;
    };

    const resume = () => {
        if (mediaRecorder && mediaRecorder.state === 'paused') {
            mediaRecorder.resume();
            return true;
        }
        return false;
    };

    const blobToBase64 = (blob) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result); // Returns data:audio/webm;base64,...
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    return {
        start,
        stop,
        pause,
        resume
    };
})();
