// Premium Web Audio API Synthesizer for FoodIQ Enterprise Dashboards
// Generates lightweight, non-intrusive operational sound effects without external MP3 dependencies

let audioCtx = null;

const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

export const playSuccessChime = () => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Play a series of three notes going up in pitch
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.08);
      
      gainNode.gain.setValueAtTime(0.08, now + index * 0.08);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.08 + 0.3);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(now + index * 0.08);
      osc.stop(now + index * 0.08 + 0.35);
    });
  } catch (e) {
    console.warn('Audio synthesis blocked by browser policy:', e);
  }
};

export const playAlertBleep = () => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Quick double beep
    [0, 0.12].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now + delay); // A5
      
      gainNode.gain.setValueAtTime(0.06, now + delay);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.08);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(now + delay);
      osc.stop(now + delay + 0.09);
    });
  } catch (e) {
    console.warn('Audio synthesis blocked:', e);
  }
};

export const playNotificationTick = () => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    
    gainNode.gain.setValueAtTime(0.03, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.05);
  } catch (e) {
    console.warn('Audio synthesis blocked:', e);
  }
};

export const playEmergencySiren = () => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Pulsing warning siren for 1 second
    const duration = 1.0;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, now);
    // Linear frequency sweep up and down
    osc.frequency.linearRampToValueAtTime(660, now + 0.35);
    osc.frequency.linearRampToValueAtTime(440, now + 0.7);
    osc.frequency.linearRampToValueAtTime(550, now + 1.0);
    
    gainNode.gain.setValueAtTime(0.05, now);
    gainNode.gain.linearRampToValueAtTime(0.05, now + 0.8);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + duration);
  } catch (e) {
    console.warn('Audio synthesis blocked:', e);
  }
};
