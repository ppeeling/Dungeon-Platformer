export class MusicManager {
  private audioCtx: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying = false;
  private currentState: 'normal' | 'boss' | 'gameover' | 'none' = 'none';
  private intervalId: number | null = null;
  private step = 0;

  private normalMelody = [
    261.63, 0, 329.63, 0, 392.00, 0, 329.63, 0,
    261.63, 0, 329.63, 0, 392.00, 0, 440.00, 0
  ];

  private bossMelody = [
    130.81, 138.59, 130.81, 146.83, 130.81, 138.59, 130.81, 155.56,
    130.81, 138.59, 130.81, 146.83, 130.81, 138.59, 130.81, 164.81
  ];

  private gameOverMelody = [
    392.00, 0, 370.00, 0, 349.23, 0, 329.63, 0,
    0, 0, 0, 0, 0, 0, 0, 0
  ];

  init() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.value = 0.1;
      this.gainNode.connect(this.audioCtx.destination);
    }
  }

  playState(state: 'normal' | 'boss' | 'gameover') {
    if (this.currentState === state) return;
    this.currentState = state;
    this.step = 0;

    if (this.intervalId) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.oscillator) {
      this.oscillator.stop();
      this.oscillator.disconnect();
      this.oscillator = null;
    }

    this.init();
    if (!this.audioCtx) return;

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const speed = state === 'boss' ? 150 : (state === 'gameover' ? 300 : 200);

    this.intervalId = window.setInterval(() => {
      this.playNextNote();
    }, speed);
  }

  private playNextNote() {
    if (!this.audioCtx || !this.gainNode) return;

    let melody: number[];
    let type: OscillatorType = 'square';

    switch (this.currentState) {
      case 'boss':
        melody = this.bossMelody;
        type = 'sawtooth';
        break;
      case 'gameover':
        melody = this.gameOverMelody;
        type = 'triangle';
        break;
      case 'normal':
      default:
        melody = this.normalMelody;
        type = 'square';
        break;
    }

    const freq = melody[this.step % melody.length];
    this.step++;

    if (freq === 0) return;

    const osc = this.audioCtx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    
    const noteGain = this.audioCtx.createGain();
    noteGain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
    noteGain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.1);
    
    osc.connect(noteGain);
    noteGain.connect(this.gainNode);
    
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.1);
  }

  stop() {
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.oscillator) {
      this.oscillator.stop();
      this.oscillator.disconnect();
      this.oscillator = null;
    }
    this.currentState = 'none';
  }
}

export const musicManager = new MusicManager();
