let ctx: AudioContext | null = null;
let muted = false;

export function setMuted(value: boolean) {
  muted = value;
}

export function unlockAudio() {
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") void ctx.resume();
}

function beep(freq: number, start: number, dur: number, type: OscillatorType, gain = 0.07) {
  if (!ctx || muted) return;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
  amp.gain.setValueAtTime(gain, ctx.currentTime + start);
  amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start(ctx.currentTime + start);
  osc.stop(ctx.currentTime + start + dur + 0.02);
}

export function sfx(kind: "ok" | "no" | "fly" | "win" | "tap") {
  unlockAudio();
  if (!ctx || muted) return;
  if (kind === "tap") beep(540, 0, 0.04, "sine", 0.035);
  if (kind === "no") beep(170, 0, 0.16, "triangle", 0.05);
  if (kind === "fly") {
    beep(494, 0, 0.08, "sine", 0.05);
    beep(880, 0.08, 0.12, "sine", 0.05);
  }
  if (kind === "ok") {
    beep(523, 0, 0.09, "sine");
    beep(659, 0.08, 0.12, "sine");
  }
  if (kind === "win") {
    beep(523, 0, 0.1, "sine");
    beep(659, 0.1, 0.1, "sine");
    beep(784, 0.2, 0.18, "sine");
  }
}
