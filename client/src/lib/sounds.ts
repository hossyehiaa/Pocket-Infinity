let audioContext: AudioContext | null = null;
let isMuted = false;
let audioInitialized = false;

function getAudioContext(): AudioContext | null {
  if (!audioContext) {
    try {
      audioContext = new AudioContext();
      audioInitialized = true;
    } catch (e) {
      console.warn("AudioContext creation failed:", e);
      return null;
    }
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }
  return audioContext;
}

export function ensureAudioReady(): void {
  if (!audioContext) {
    getAudioContext();
  }
}

export function setMuted(muted: boolean) {
  isMuted = muted;
}

export function getMuted(): boolean {
  return isMuted;
}

export function playLaserShoot() {
  if (isMuted) return;
  
  const ctx = getAudioContext();
  if (!ctx) return;
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.type = 'square';
  oscillator.frequency.setValueAtTime(880, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.15);
  
  gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
  
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.15);
}

export function playJump() {
  if (isMuted) return;
  
  const ctx = getAudioContext();
  if (!ctx) return;
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(200, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
  oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.15);
  
  gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
  
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.15);
}

export function playExplosion() {
  if (isMuted) return;
  
  const ctx = getAudioContext();
  if (!ctx) return;
  
  const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseData.length; i++) {
    noiseData[i] = Math.random() * 2 - 1;
  }
  
  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noiseBuffer;
  
  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.setValueAtTime(1000, ctx.currentTime);
  lowpass.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
  
  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
  
  noiseSource.connect(lowpass);
  lowpass.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  noiseSource.start(ctx.currentTime);
  noiseSource.stop(ctx.currentTime + 0.3);
  
  const oscillator = ctx.createOscillator();
  const oscGain = ctx.createGain();
  
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(150, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.2);
  
  oscGain.gain.setValueAtTime(0.4, ctx.currentTime);
  oscGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
  
  oscillator.connect(oscGain);
  oscGain.connect(ctx.destination);
  
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.2);
}

export function playWarpDrive() {
  if (isMuted) return;
  
  const ctx = getAudioContext();
  if (!ctx) return;
  const duration = 2;
  
  const oscillator1 = ctx.createOscillator();
  const oscillator2 = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator1.type = 'sawtooth';
  oscillator1.frequency.setValueAtTime(50, ctx.currentTime);
  oscillator1.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + duration * 0.7);
  oscillator1.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + duration);
  
  oscillator2.type = 'sine';
  oscillator2.frequency.setValueAtTime(100, ctx.currentTime);
  oscillator2.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + duration * 0.7);
  oscillator2.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + duration);
  
  gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.25, ctx.currentTime + duration * 0.7);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
  
  oscillator1.connect(gainNode);
  oscillator2.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator1.start(ctx.currentTime);
  oscillator2.start(ctx.currentTime);
  oscillator1.stop(ctx.currentTime + duration);
  oscillator2.stop(ctx.currentTime + duration);
  
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.type = 'sine';
  lfo.frequency.setValueAtTime(5, ctx.currentTime);
  lfo.frequency.linearRampToValueAtTime(20, ctx.currentTime + duration);
  lfoGain.gain.setValueAtTime(50, ctx.currentTime);
  
  lfo.connect(lfoGain);
  lfoGain.connect(oscillator1.frequency);
  lfoGain.connect(oscillator2.frequency);
  
  lfo.start(ctx.currentTime);
  lfo.stop(ctx.currentTime + duration);
}

export function playTalk() {
  if (isMuted) return;
  
  const ctx = getAudioContext();
  if (!ctx) return;
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(440, ctx.currentTime);
  oscillator.frequency.setValueAtTime(550, ctx.currentTime + 0.05);
  oscillator.frequency.setValueAtTime(440, ctx.currentTime + 0.1);
  
  gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
  
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.15);
}

export function initAudio() {
  getAudioContext();
}
