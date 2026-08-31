/**
 * Pure Web Audio API sound synthesizer
 * 0ms latency, zero external downloads, 100% offline reliable.
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // 1. 打中地鼠音效 (可愛的木槌敲擊/彈跳聲)
  public playHit(volume = 0.6) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      // Primary pop
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.12);

      gain.gain.setValueAtTime(volume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.12);

      // Cute snap click
      const snap = this.ctx.createOscillator();
      const snapGain = this.ctx.createGain();
      snap.type = 'sine';
      snap.frequency.setValueAtTime(600, t);
      snap.frequency.exponentialRampToValueAtTime(180, t + 0.05);

      snapGain.gain.setValueAtTime(volume * 0.4, t);
      snapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      snap.connect(snapGain);
      snapGain.connect(this.ctx.destination);

      snap.start(t);
      snap.stop(t + 0.05);
    } catch {
      // ignore
    }
  }

  // 2. 答對音效 (清脆悅耳的「叮咚」和弦 C5 -> G5 -> C6)
  public playCorrect(volume = 0.5) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const notes = [523.25, 783.99, 1046.50]; // C5, G5, C6
      const delays = [0, 0.08, 0.16];

      notes.forEach((freq, i) => {
        if (!this.ctx) return;
        const noteTime = t + delays[i];
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0, noteTime);
        gain.gain.linearRampToValueAtTime(volume * 0.7, noteTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.35);
      });
    } catch {
      // ignore
    }
  }

  // 3. 答錯音效 (溫和的低音嗡聲，避免對國小學生產生挫折感)
  public playWrong(volume = 0.4) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.linearRampToValueAtTime(130, t + 0.22);

      gain.gain.setValueAtTime(volume * 0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      // Low pass filter to soften the buzz
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, t);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.25);
    } catch {
      // ignore
    }
  }

  // 4. 連擊 Combo 獎勵音效 (漸升琶音)
  public playCombo(combo: number, volume = 0.5) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const baseFreq = 440 * Math.pow(1.06, Math.min(combo, 12));
      const freqs = [baseFreq, baseFreq * 1.25, baseFreq * 1.5];

      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const noteT = t + idx * 0.05;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteT);

        gain.gain.setValueAtTime(volume * 0.5, noteT);
        gain.gain.exponentialRampToValueAtTime(0.001, noteT + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(noteT);
        osc.stop(noteT + 0.2);
      });
    } catch {
      // ignore
    }
  }

  // 5. 狂熱模式 Fever 啟動音效 (歡慶旋律)
  public playFever(volume = 0.6) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const melody = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      
      melody.forEach((freq, idx) => {
        if (!this.ctx) return;
        const noteT = t + idx * 0.07;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteT);

        gain.gain.setValueAtTime(0, noteT);
        gain.gain.linearRampToValueAtTime(volume * 0.6, noteT + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, noteT + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(noteT);
        osc.stop(noteT + 0.3);
      });
    } catch {
      // ignore
    }
  }

  // 6. 倒數警示音效
  public playTick(volume = 0.3) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, t);

      gain.gain.setValueAtTime(volume * 0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.04);
    } catch {
      // ignore
    }
  }

  // 7. 通關/結算音效 (Fanfare)
  public playVictory(volume = 0.6) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const notes = [
        { f: 523.25, d: 0.12 },
        { f: 659.25, d: 0.12 },
        { f: 783.99, d: 0.12 },
        { f: 1046.50, d: 0.4 }
      ];
      let offset = 0;
      notes.forEach((n) => {
        if (!this.ctx) return;
        const noteT = t + offset;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.f, noteT);

        gain.gain.setValueAtTime(0, noteT);
        gain.gain.linearRampToValueAtTime(volume * 0.6, noteT + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, noteT + n.d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(noteT);
        osc.stop(noteT + n.d);
        offset += n.d * 0.9;
      });
    } catch {
      // ignore
    }
  }
}

export const sfx = new SoundSynthesizer();
