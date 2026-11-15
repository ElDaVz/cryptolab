/** Optional synthesized feedback. No context exists until an explicit enable action. */
export class MechanicalAudio {
  enabled = false;
  #context: AudioContext | null = null;
  #voices = new Set<{ oscillator: OscillatorNode; gain: GainNode }>();
  #lastClick = -Infinity;
  constructor(private readonly create: () => AudioContext = () => new AudioContext()) {}
  async enable() {
    try {
      this.#context ??= this.create();
      await this.#context.resume();
      if (this.#context.state !== 'running') throw Error('Audio suspended');
      this.enabled = true;
      return true;
    } catch {
      this.enabled = false;
      this.stop();
      return false;
    }
  }
  mute() {
    this.enabled = false;
    this.stop();
  }
  click() {
    const context = this.#context;
    if (
      !this.enabled ||
      !context ||
      context.state !== 'running' ||
      performance.now() - this.#lastClick < 100
    )
      return;
    this.#lastClick = performance.now();
    try {
      const oscillator = context.createOscillator(),
        gain = context.createGain(),
        voice = { oscillator, gain };
      this.#voices.add(voice);
      const release = () => {
        oscillator.disconnect();
        gain.disconnect();
        this.#voices.delete(voice);
      };
      oscillator.onended = release;
      oscillator.type = 'triangle';
      oscillator.frequency.value = 160;
      gain.gain.setValueAtTime(0.018, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.035);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.04);
    } catch {
      this.mute();
    }
  }
  stop() {
    for (const voice of this.#voices) {
      voice.oscillator.onended = null;
      try {
        voice.oscillator.stop();
      } catch {
        /* Already ended. */
      }
      voice.oscillator.disconnect();
      voice.gain.disconnect();
    }
    this.#voices.clear();
  }
  destroy() {
    this.mute();
    if (this.#context) void this.#context.close().catch(() => {});
    this.#context = null;
  }
}
