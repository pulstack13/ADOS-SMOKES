const scene = document.querySelector('#scene');
const moods = [...document.querySelectorAll('.mood')];
const vapor = document.querySelector('#vapor');
let smokeTimer;

function chooseMood(theme) {
  const choice = moods.find(button => button.dataset.theme === theme);
  if (!choice) return;
  moods.forEach(button => button.classList.toggle('active', button === choice));
  scene.dataset.theme = theme;
  document.querySelector('#sceneName').textContent = choice.dataset.name;
  document.querySelector('#sceneMood').textContent = choice.dataset.mood;
  puff();
}

function puff() {
  vapor.classList.remove('active');
  void vapor.offsetWidth;
  vapor.classList.add('active');
  clearTimeout(smokeTimer);
  smokeTimer = setTimeout(() => vapor.classList.remove('active'), 4100);
}

moods.forEach(button => button.addEventListener('click', () => chooseMood(button.dataset.theme)));
document.querySelectorAll('.world-card').forEach(card => card.addEventListener('click', () => {
  chooseMood(card.dataset.select);
  document.querySelector('#studio').scrollIntoView({ behavior: 'smooth', block: 'center' });
}));
document.querySelector('#puffButton').addEventListener('click', puff);
const cameraModal = document.querySelector('#cameraModal');
const cameraFeed = document.querySelector('#cameraFeed');
const cameraEmpty = document.querySelector('#cameraEmpty');
const cameraStatus = document.querySelector('#cameraStatus');
const cameraVapor = document.querySelector('#cameraVapor');
const trackedPipe = document.querySelector('#trackedPipe');
const hosePath = document.querySelector('#hosePath');
const experiencePuff = document.querySelector('#experiencePuff');
const stopCamera = document.querySelector('#stopCamera');
const fullscreenCamera = document.querySelector('#fullscreenCamera');
let cameraStream;
let holistic;
let trackingActive = false;
let trackingBusy = false;
let lastMouthCloud = 0;
let trackingErrorShown = false;
let lastTrackAt = 0;
async function startCamera() {
  cameraModal.hidden = false;
  cameraStatus.textContent = 'Requesting camera permission…';
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 360 }, frameRate: { ideal: 24, max: 24 } }, audio: false });
    cameraFeed.srcObject = cameraStream;
    cameraEmpty.hidden = true;
    cameraStatus.textContent = 'Camera is active. Create a virtual cloud whenever you like.';
    experiencePuff.disabled = false;
    stopCamera.disabled = false;
    fullscreenCamera.disabled = false;
    await cameraFeed.play();
    startTracking();
  } catch (error) {
    const secureHint = location.protocol === 'file:' ? ' Open the project through localhost, then try again.' : '';
    cameraStatus.textContent = `Camera could not start. Please allow access in your browser.${secureHint}`;
  }
}
function stopCameraFeed() {
  cameraStream?.getTracks().forEach(track => track.stop());
  cameraStream = undefined;
  cameraFeed.srcObject = null;
  trackingActive = false;
  trackedPipe.classList.remove('visible');
  hosePath.style.opacity = '0';
  cameraEmpty.hidden = false;
  experiencePuff.disabled = true;
  stopCamera.disabled = true;
  fullscreenCamera.disabled = true;
  cameraStatus.textContent = 'Camera is off. Start it again whenever you want.';
}
function virtualCloud() {
  cameraVapor.classList.remove('active'); void cameraVapor.offsetWidth; cameraVapor.classList.add('active');
  setTimeout(() => cameraVapor.classList.remove('active'), 4100);
  puff(); if (soundOn) playChime();
}

function startTracking() {
  if (!window.Holistic) {
    cameraStatus.textContent = 'Camera is active. Hand and mouth tracking could not load; you can still create a virtual cloud.';
    return;
  }
  if (!holistic) {
    holistic = new Holistic({ locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}` });
    holistic.setOptions({
      modelComplexity: 0,
      smoothLandmarks: true,
      refineFaceLandmarks: false,
      minDetectionConfidence: 0.25,
      minTrackingConfidence: 0.25
    });
    holistic.onResults(handleTrackingResults);
  }
  trackingActive = true;
  cameraStatus.textContent = 'Show your hand to place the virtual pipe. Open your mouth to create a cloud.';
  requestAnimationFrame(trackFrame);
}

async function trackFrame() {
  if (!trackingActive || !cameraStream) return;
  const now = performance.now();
  if (!trackingBusy && now - lastTrackAt >= 120 && cameraFeed.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    lastTrackAt = now;
    trackingBusy = true;
    try {
      await holistic.send({ image: cameraFeed });
    } catch (error) {
      if (!trackingErrorShown) {
        trackingErrorShown = true;
        cameraStatus.textContent = 'Camera is active, but hand tracking could not process this browser session. Reload the page and allow graphics acceleration.';
      }
    }
    trackingBusy = false;
  }
  requestAnimationFrame(trackFrame);
}

function handleTrackingResults(results) {
  // Holistic returns each hand separately; it does not use the multiHandLandmarks field.
  const hand = results.rightHandLandmarks || results.leftHandLandmarks;
  if (hand) {
    const wrist = hand[0];
    const fingerTip = hand[8];
    const x = (1 - wrist.x) * 100;
    const y = wrist.y * 100;
    const dx = wrist.x - fingerTip.x;
    const dy = fingerTip.y - wrist.y;
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    trackedPipe.style.transform = `translate(-20px, -17px) rotate(${angle}deg)`;
    trackedPipe.style.left = `${x}%`;
    trackedPipe.style.top = `${y}%`;
    trackedPipe.classList.add('visible');
    hosePath.style.opacity = '1';
    hosePath.setAttribute('d', `M 91 83 C 78 83 76 ${Math.min(94, y + 18)} ${x} ${y}`);
  } else {
    trackedPipe.classList.remove('visible');
    hosePath.style.opacity = '0.45';
    if (!trackingErrorShown) cameraStatus.textContent = 'Scanning for one hand… hold your hand in front of the camera with your palm visible.';
  }
  const face = results.faceLandmarks;
  if (face?.length) {
    const mouthGap = Math.abs(face[13].y - face[14].y);
    const faceHeight = Math.abs(face[10].y - face[152].y);
    const now = Date.now();
    const mouth = face[13];
    const handTip = hand?.[8];
    if (mouth && handTip) {
      const dx = handTip.x - mouth.x;
      const dy = handTip.y - mouth.y;
      const nearMouth = Math.hypot(dx, dy) < 0.15;
      if (nearMouth && now - lastMouthCloud > 2800) {
        lastMouthCloud = now;
        cameraVapor.style.left = `${(1 - mouth.x) * 100}%`;
        cameraVapor.style.top = `${mouth.y * 100}%`;
        cameraVapor.classList.add('tracked');
        cameraStatus.textContent = 'Mouthpiece detected at your mouth — cloud released.';
        virtualCloud();
      }
    }
    if (faceHeight && mouthGap / faceHeight > 0.062 && now - lastMouthCloud > 2800) {
      lastMouthCloud = now;
      cameraVapor.style.left = `${(1 - face[13].x) * 100}%`;
      cameraVapor.style.top = `${face[13].y * 100}%`;
      cameraVapor.classList.add('tracked');
      cameraStatus.textContent = 'Mouth gesture detected — cloud released.';
      virtualCloud();
    }
  }
}
document.querySelector('#startExperience').addEventListener('click', startCamera);
document.querySelector('#closeCamera').addEventListener('click', () => { stopCameraFeed(); cameraModal.hidden = true; });
stopCamera.addEventListener('click', stopCameraFeed);
experiencePuff.addEventListener('click', virtualCloud);
fullscreenCamera.addEventListener('click', async () => {
  const frame = document.querySelector('.camera-frame');
  try {
    const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;
    if (isFullscreen) {
      const exit = document.exitFullscreen || document.webkitExitFullscreen;
      await exit.call(document);
    } else {
      const enter = frame.requestFullscreen || frame.webkitRequestFullscreen;
      if (!enter) throw new Error('Fullscreen unsupported');
      await enter.call(frame);
    }
  } catch (_) { cameraStatus.textContent = 'Your browser blocked full screen. Use its menu to open this page in full screen.'; }
});
document.addEventListener('fullscreenchange', () => {
  fullscreenCamera.textContent = document.fullscreenElement ? '⛶ Exit full screen' : '⛶ Full screen';
});
document.addEventListener('webkitfullscreenchange', () => {
  fullscreenCamera.textContent = document.webkitFullscreenElement ? '⛶ Exit full screen' : '⛶ Full screen';
});
cameraModal.addEventListener('click', event => { if (event.target === cameraModal) { stopCameraFeed(); cameraModal.hidden = true; } });
document.querySelector('#petalToggle').addEventListener('click', event => {
  const button = event.currentTarget;
  const enabled = button.getAttribute('aria-checked') !== 'true';
  button.setAttribute('aria-checked', String(enabled));
  document.querySelector('.scene').classList.toggle('still', !enabled);
});

// Sound is intentionally opt-in and synthesized locally; nothing is downloaded or recorded.
let audioContext;
let soundOn = false;
document.querySelector('#soundToggle').addEventListener('click', async () => {
  soundOn = !soundOn;
  document.querySelector('#soundText').textContent = soundOn ? 'Sound on' : 'Sound off';
  document.querySelector('#soundToggle').setAttribute('aria-pressed', String(soundOn));
  if (soundOn) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioContext ||= new AudioContextClass();
      if (audioContext.state === 'suspended') await audioContext.resume();
      playChime();
    }
  }
});

function playChime() {
  if (!soundOn || !audioContext) return;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(528, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(396, audioContext.currentTime + .45);
  gain.gain.setValueAtTime(.0001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(.045, audioContext.currentTime + .025);
  gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + .55);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + .56);
}
document.querySelector('#puffButton').addEventListener('click', () => { if (soundOn) playChime(); });
