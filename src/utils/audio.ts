// Web Audio API helper for extremely subtle, minimalist, professional UI feedback sounds
// Designed to be extremely non-intrusive, organic, and eyes-friendly.

let audioCtx: AudioContext | null = null;
let soundVolume = 0.08; // Very soft by default (8%)

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    // Lazy initialisation to comply with browser autoplay protections
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Low-pass filter node common helper
const playTone = (freqs: number[], duration: number, type: OscillatorType = 'sine', slide = false, customVol?: number) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Resume context if suspended
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const destination = ctx.destination;
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = type;
  osc.connect(gainNode);
  gainNode.connect(destination);

  const now = ctx.currentTime;
  const volume = customVol !== undefined ? customVol : soundVolume;

  // Envelope
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  if (freqs.length === 1) {
    osc.frequency.setValueAtTime(freqs[0], now);
  } else if (freqs.length > 1) {
    if (slide) {
      osc.frequency.setValueAtTime(freqs[0], now);
      osc.frequency.exponentialRampToValueAtTime(freqs[1], now + duration);
    } else {
      // Arpeggiate notes
      const noteDuration = duration / freqs.length;
      freqs.forEach((freq, i) => {
        osc.frequency.setValueAtTime(freq, now + i * noteDuration);
      });
    }
  }

  osc.start(now);
  osc.stop(now + duration + 0.05);
};

export const uiSound = {
  // Ultra short high pitch organic pluck for subtle navigation / tabs
  click: () => {
    // 800Hz fading instantly, like a tiny physical button tick or wooden tap
    playTone([1200], 0.04, 'sine', false, soundVolume * 0.7);
  },

  // Soft elegant double chime for success states
  success: () => {
    // Major triad arpeggio (C major vibe) -> clean and extremely airy
    playTone([523.25, 659.25, 783.99], 0.25, 'sine', false, soundVolume * 0.9);
  },

  // Soft subtle reminder chime (when query finishes executing, etc)
  queryComplete: () => {
    // Warm harmonic sound
    playTone([880, 1046.5], 0.35, 'sine', true, soundVolume * 0.82);
  },

  // Extremely dull, non-annoying error pop
  error: () => {
    // Soft low thud (frequency sliding down)
    playTone([160, 110], 0.18, 'sine', true, soundVolume * 1.2);
  },

  // Very gentle metallic hover rustle
  hover: () => {
    // Extremely subtle, short, very high frequency tap
    playTone([1800], 0.02, 'sine', false, soundVolume * 0.4);
  },

  // Set general sound volume dynamically (0.0 to 1.0)
  setVolume: (v: number) => {
    soundVolume = Math.max(0, Math.min(1, v));
  },
  
  getVolume: () => soundVolume
};
