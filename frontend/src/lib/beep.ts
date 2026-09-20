let sharedAudioCtx: AudioContext | null = null;

/**
 * Must be called from within a real user gesture (e.g. the "Start timer"
 * click) so the browser allows audio to play later, even though the actual
 * beep fires asynchronously once the countdown reaches zero.
 */
export function primeAudioContext(): AudioContext {
  if (!sharedAudioCtx) {
    sharedAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (sharedAudioCtx.state === "suspended") {
    sharedAudioCtx.resume();
  }
  return sharedAudioCtx;
}

function playTone(ctx: AudioContext, startTime: number, duration: number) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = 880;
  gain.gain.setValueAtTime(0.3, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

/** Plays two short beeps, like an oven timer. */
export function playDoubleBeep() {
  const ctx = primeAudioContext();
  const now = ctx.currentTime;
  playTone(ctx, now, 0.18);
  playTone(ctx, now + 0.28, 0.18);
}
