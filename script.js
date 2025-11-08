const CONFIG = {
  normal: "https://n8n.srv1104707.hstgr.cloud/webhook/DictaMedNormalMode",
  test: "https://n8n.srv1104707.hstgr.cloud/webhook/DictaMed"
};

const $ = q => document.querySelector(q);
const $$ = q => [...document.querySelectorAll(q)];

// Toast system
const toastContainer = document.createElement('div');
toastContainer.className = 'toast-container';
document.body.appendChild(toastContainer);

function toast(message, type = 'info', duration = 4000) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const iconMap = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  toast.innerHTML = `
    <span class="toast-icon">${iconMap[type] || 'ℹ️'}</span>
    <div class="toast-content">
      <div class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
      <div class="toast-message">${message}</div>
    </div>
  `;
  
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Tabs
function switchTab(id) {
  $$('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === id));
  $$('.tab-content').forEach(content => content.classList.toggle('active', content.id === id));
  localStorage.setItem('tab', id);
}

$$('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

switchTab(localStorage.getItem('tab') || 'mode-normal');

// Counter system
$$('input[maxlength],textarea').forEach(el => {
  const counter = el.parentElement.querySelector('.char-counter');
  if (!counter) return;
  
  const update = () => {
    const max = el.getAttribute('maxlength') || '∞';
    counter.textContent = max === '∞' ? `${el.value.length}` : `${el.value.length} / ${max}`;
    
    if (max !== '∞' && el.value.length > max * 0.8) {
      counter.style.color = el.value.length > max * 0.95 ? 'var(--danger)' : 'var(--warning)';
    } else {
      counter.style.color = 'var(--gray-light)';
    }
  };
  
  el.addEventListener('input', update);
  update();
});

// Recorder Class
class Recorder {
  constructor(section) {
    this.section = section;
    this.status = section.querySelector('.status-badge');
    this.timer = section.querySelector('.timer');
    this.recordBtn = section.querySelector('.btn-record');
    this.pauseBtn = section.querySelector('.btn-pause');
    this.stopBtn = section.querySelector('.btn-stop');
    this.deleteBtn = section.querySelector('.btn-delete');
    this.audioPlayer = section.querySelector('.audio-player');
    this.indicator = section.querySelector('.recorded-indicator');
    this.maxDuration = +section.querySelector('.recorder').dataset.max || 120;
    
    this.chunks = [];
    this.startTime = 0;
    this.pausedTime = 0;
    this.timerInterval = null;
    
    this.recordBtn.addEventListener('click', () => this.start());
    this.pauseBtn.addEventListener('click', () => this.togglePause());
    this.stopBtn.addEventListener('click', () => this.stop());
    this.deleteBtn.addEventListener('click', () => this.reset());
  }
  
  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          sampleRate: 44100, 
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      this.recorder = new MediaRecorder(this.stream);
      this.chunks = [];
      
      this.recorder.ondataavailable = e => this.chunks.push(e.data);
      this.recorder.onstop = () => this.onStop();
      
      this.recorder.start(1000);
      this.startTime = Date.now();
      
      this.timerInterval = setInterval(() => this.updateTimer(), 1000);
      
      this.setStatus('recording');
      this.section.classList.add('is-recording');
      this.audioPlayer.classList.add('hidden');
      this.deleteBtn.classList.add('hidden');
      this.indicator.classList.add('hidden');
      this.section.classList.remove('recorded');
      
    } catch (e) {
      toast('Microphone inaccessible. Vérifiez les permissions.', 'error');
    }
  }
  
  togglePause() {
    if (this.recorder.state === 'recording') {
      this.recorder.pause();
      this.pausedTime = Date.now() - this.startTime;
      clearInterval(this.timerInterval);
      this.setStatus('paused');
      this.pauseBtn.innerHTML = '▶️ Reprendre';
    } else {
      this.recorder.resume();
      this.startTime = Date.now() - this.pausedTime;
      this.timerInterval = setInterval(() => this.updateTimer(), 1000);
      this.setStatus('recording');
      this.pauseBtn.innerHTML = '⏸️ Pause';
    }
  }
  
  stop() {
    if (this.recorder && this.recorder.state !== 'inactive') {
      this.recorder.stop();
      this.stream.getTracks().forEach(track => track.stop());
    }
  }
  
  onStop() {
    clearInterval(this.timerInterval);
    this.blob = new Blob(this.chunks, { type: 'audio/webm' });
    this.audioPlayer.src = URL.createObjectURL(this.blob);
    this.setStatus('stopped');
    this.section.classList.remove('is-recording');
    this.section.classList.add('recorded');
    this.indicator.classList.remove('hidden');
    this.recordBtn.classList.add('hidden');
    this.pauseBtn.classList.add('hidden');
    this.stopBtn.classList.add('hidden');
    this.deleteBtn.classList.remove('hidden');
    this.audioPlayer.classList.remove('hidden');
    updateSubmitButtons();
    toast('Enregistrement terminé', 'success');
  }
  
  updateTimer() {
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    this.timer.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    if (elapsed >= this.maxDuration) {
      this.stop();
      toast('Durée maximale atteinte', 'warning');
    }
  }
  
  setStatus(status) {
    this.status.dataset.status = status;
    const statusText = {
      ready: 'Prêt à enregistrer',
      recording: 'Enregistrement en cours...',
      paused: 'En pause',
      stopped: 'Enregistrement terminé'
    };
    this.status.textContent = statusText[status];
  }
  
  reset() {
    if (this.recorder && this.recorder.state !== 'inactive') {
      this.recorder.stop();
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    
    clearInterval(this.timerInterval);
    this.chunks = [];
    this.startTime = 0;
    this.pausedTime = 0;
    this.timer.textContent = '00:00';
    this.audioPlayer.src = '';
    
    this.setStatus('ready');
    this.section.classList.remove('recorded', 'is-recording');
    this.indicator.classList.add('hidden');
    this.recordBtn.classList.remove('hidden');
    this.recordBtn.disabled = false;
    this.pauseBtn.classList.add('hidden');
    this.stopBtn.classList.add('hidden');
    this.deleteBtn.classList.add('hidden');
    this.audioPlayer.classList.add('hidden');
    this.pauseBtn.innerHTML = '⏸️ Pause';
    
    updateSubmitButtons();
  }
}

$$('.recording-section').forEach(section => new Recorder(section));

// Update submit buttons
function updateSubmitButtons() {
  const recordedCount = $$('.recording-section.recorded').length;
  $$('.sections-count').forEach(el => el.textContent = `${recordedCount} section(s) enregistrée(s)`);
  $$('.btn-submit[id^="submit"]').forEach(btn => btn.disabled = recordedCount === 0);
}

updateSubmitButtons();

// Submit function
async function submit(mode) {
  const btn = $(`#submit${mode === 'normal' ? 'Normal' : 'Test'}`);
  const originalText = btn.textContent;
  
  btn.disabled = true;
  btn.textContent = mode === 'normal' ? 'Envoi vers SPSS...' : 'Envoi en cours...';
  
  const payload = {
    mode,
    patient: {
      numero: $(`#numeroDossier${mode === 'test' ? 'Test' : ''}`).value,
      nom: $(`#nomPatient${mode === 'test' ? 'Test' : ''}`).value
    },
    sections: []
  };
  
  const sections = mode === 'normal' ? 
    ['partie1', 'partie2', 'partie3', 'partie4'] : 
    ['clinique', 'antecedents', 'biologie'];
  
  for (const id of sections) {
    const section = $(`[data-section="${id}"]`);
    if (!section.classList.contains('recorded')) continue;
    
    const blobUrl = section.querySelector('.audio-player').src;
    if (!blobUrl) continue;
    
    try {
      const audioBlob = await fetch(blobUrl).then(r => r.blob());
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });
      
      payload.sections.push({ id, base64 });
    } catch (e) {
      toast(`Erreur lors de la lecture de la section ${id}`, 'error');
    }
  }
  
  if (payload.sections.length === 0) {
    toast('Aucune section enregistrée', 'warning');
    btn.disabled = false;
    btn.textContent = originalText;
    return;
  }
  
  try {
    const response = await fetch(CONFIG[mode], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) throw new Error(response.statusText);
    
    toast('Données envoyées avec succès !', 'success');
    
    if (mode === 'test') {
      $('#googleSheetCard').classList.remove('hidden');
    } else {
      $$('input').forEach(input => {
        if (input.type !== 'checkbox' && input.type !== 'password') {
          input.value = '';
          input.dispatchEvent(new Event('input'));
        }
      });
      $$('.recording-section').forEach(s => s.querySelector('.btn-delete').click());
    }
  } catch (e) {
    toast('Erreur réseau. Vérifiez votre connexion.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

$('#submitNormal').addEventListener('click', () => submit('normal'));
$('#submitTest').addEventListener('click', () => submit('test'));

// Toggle Partie 4
$('#togglePartie4').addEventListener('click', function() {
  const partie4 = $('[data-section="partie4"]');
  partie4.classList.toggle('hidden');
  this.textContent = partie4.classList.contains('hidden') ? '+ Ajouter une partie (optionnelle)' : '− Masquer Partie 4';
});

// Photos DMI
const photos = [];
const photosUpload = $('#photosUpload');
const photosPreview = $('#photosPreview');

photosUpload.addEventListener('change', function(e) {
  const remainingSlots = 5 - photos.length;
  const files = Array.from(e.target.files).slice(0, remainingSlots);
  
  files.forEach(file => {
    if (!file.type.startsWith('image/')) {
      toast(`Le fichier ${file.name} n'est pas une image valide`, 'warning');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      photos.push({ name: file.name, data: reader.result.split(',')[1] });
      renderPhotos();
      updateSubmitTexte();
    };
    reader.readAsDataURL(file);
  });
  
  this.value = '';
});

function renderPhotos() {
  photosPreview.innerHTML = photos.map((p, i) => `
    <div class="photo-item">
      <img src="data:image/jpeg;base64,${p.data}" alt="${p.name}">
      <button class="photo-item-remove" data-index="${i}" aria-label="Supprimer la photo">×</button>
    </div>
  `).join('');
  
  $$('.photo-item-remove').forEach(btn => {
    btn.addEventListener('click', function() {
      const index = +this.dataset.index;
      photos.splice(index, 1);
      renderPhotos();
      updateSubmitTexte();
    });
  });
}

function updateSubmitTexte() {
  $('#submitTexte').disabled = !$('#numeroDossierTexte').value.trim();
}

$('#numeroDossierTexte').addEventListener('input', updateSubmitTexte);

// Submit DMI
$('#submitTexte').addEventListener('click', async function() {
  const btn = this;
  const originalText = btn.textContent;
  
  btn.disabled = true;
  btn.textContent = 'Extraction en cours...';
  
  const payload = {
    mode: 'texte',
    patient: {
      numero: $('#numeroDossierTexte').value,
      nom: $('#nomPatientTexte').value,
      texte: $('#texteLibre').value,
      photos
    }
  };
  
  try {
    const response = await fetch(CONFIG.test, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) throw new Error(response.statusText);
    
    toast('Données DMI envoyées avec succès !', 'success');
    
    // Reset form
    $$('#mode-dmi input[type="text"], #mode-dmi textarea').forEach(i => {
      i.value = '';
      i.dispatchEvent(new Event('input'));
    });
    photos.length = 0;
    renderPhotos();
    updateSubmitTexte();
  } catch (e) {
    toast('Erreur lors de l\'envoi des données DMI', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
});

// Auth persistence
const authKey = 'dm_auth';
const rememberCheckbox = $('#rememberAuth');
const username = $('#username');
const accessCode = $('#accessCode');

rememberCheckbox.addEventListener('change', function() {
  if (this.checked) {
    localStorage.setItem(authKey, JSON.stringify({
      u: username.value,
      p: accessCode.value
    }));
  } else {
    localStorage.removeItem(authKey);
  }
});

// Load saved auth
(() => {
  const saved = localStorage.getItem(authKey);
  if (saved) {
    try {
      const { u, p } = JSON.parse(saved);
      username.value = u;
      accessCode.value = p;
      rememberCheckbox.checked = true;
    } catch (e) {
      localStorage.removeItem(authKey);
    }
  }
})();

// Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
    .then(() => console.log('Service Worker registered'))
    .catch(e => console.log('SW registration failed:', e));
}