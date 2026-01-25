
class SoundEngine {
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  
  private ambientOsc1: OscillatorNode | null = null;
  private ambientOsc2: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;
  private ghostTimerId: number | null = null;
  
  private currentSource: AudioBufferSourceNode | null = null;

  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;

  public isMuted: boolean = false;
  private dataArray: Uint8Array | null = null;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.value = 0.4; 
      
      this.gainNode.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }
  }

  async enableMicrophone() {
    this.init();
    if (!this.ctx || this.micStream) return;

    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      this.micSource = this.ctx.createMediaStreamSource(this.micStream);
      this.micSource.connect(this.analyser!); 
    } catch (e) {
      console.error("Microphone access denied", e);
      throw e;
    }
  }

  disableMicrophone() {
    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
      this.micStream = null;
    }
    if (this.micSource) {
      this.micSource.disconnect();
      this.micSource = null;
    }
  }

  getAudioData(): Uint8Array {
    if (this.analyser && this.dataArray) {
      this.analyser.getByteFrequencyData(this.dataArray);
      return this.dataArray;
    }
    return new Uint8Array(0);
  }

  setVolume(vol: number) {
    if (this.gainNode) {
      this.gainNode.gain.value = vol;
    }
  }

  async resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  stop() {
      if (this.currentSource) {
          try {
              this.currentSource.stop();
          } catch(e) { }
          this.currentSource.disconnect();
          this.currentSource = null;
      }
  }

  async playPCM(base64Data: string, sampleRate = 24000, onEnded?: () => void) {
      if (this.isMuted) return;
      if (!this.ctx) this.init();
      await this.resume();
      
      this.stop();

      try {
          const binaryString = atob(base64Data);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
              bytes[i] = binaryString.charCodeAt(i);
          }
          
          const float32 = new Float32Array(len / 2);
          const dataView = new DataView(bytes.buffer);
          
          for (let i = 0; i < len / 2; i++) {
              const int16 = dataView.getInt16(i * 2, true); 
              float32[i] = int16 / 32768.0;
          }

          const buffer = this.ctx!.createBuffer(1, float32.length, sampleRate);
          buffer.copyToChannel(float32, 0);

          const source = this.ctx!.createBufferSource();
          source.buffer = buffer;
          source.connect(this.gainNode!);
          
          source.onended = () => {
              if (this.currentSource === source) {
                this.currentSource = null;
              }
              if(onEnded) onEnded();
          };

          this.currentSource = source;
          source.start();
      } catch (e) {
          console.error("Audio playback error", e);
      }
  }

  playLoadTick() {
      if (this.isMuted || !this.ctx || !this.gainNode) return;
      
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(1000, t);
      
      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      
      osc.connect(gain);
      gain.connect(this.gainNode);
      osc.start(t);
      osc.stop(t + 0.05);
  }

  playRetroBootSound() {
      if (this.isMuted) return;
      if (!this.ctx) this.init(); 
      
      const t = this.ctx!.currentTime;
      const duration = 2.5; 
      
      const freqs = [130.81, 196.00, 261.63, 293.66, 329.63, 392.00]; 
      
      freqs.forEach((f, i) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          
          osc.type = i < 2 ? 'sawtooth' : 'sine'; 
          osc.frequency.setValueAtTime(f, t);
          osc.detune.setValueAtTime((Math.random() - 0.5) * 15, t);
          
          gain.connect(this.gainNode!);
          osc.connect(gain);
          
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.15, t + 0.1); 
          gain.gain.exponentialRampToValueAtTime(0.001, t + duration); 
          
          osc.start(t);
          osc.stop(t + duration);
      });

      const sparkle = this.ctx!.createOscillator();
      const sGain = this.ctx!.createGain();
      sparkle.type = 'square';
      sparkle.frequency.setValueAtTime(880, t);
      sparkle.frequency.exponentialRampToValueAtTime(1760, t + 0.5);
      
      sGain.gain.setValueAtTime(0.05, t);
      sGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      
      sparkle.connect(sGain);
      sGain.connect(this.gainNode!);
      sparkle.start(t);
      sparkle.stop(t + 0.5);
  }

  playBootSound() {
    this.playRetroBootSound();
  }

  playTypingSound(variance: number = 0) {
    if (this.isMuted || !this.ctx || !this.gainNode) return;

    const t = this.ctx.currentTime;
    const isHeavyKey = Math.abs(variance) > 50;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter(); 
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.gainNode);

    osc.type = Math.random() > 0.6 ? 'square' : 'triangle';
    const baseFreq = isHeavyKey ? 600 : 800; 
    const randomDetune = (Math.random() * 120 - 60);
    osc.frequency.setValueAtTime(baseFreq + (variance * 0.5) + randomDetune, t);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isHeavyKey ? 1200 : 1800, t);
    filter.frequency.exponentialRampToValueAtTime(400, t + 0.04);

    const volume = isHeavyKey ? 0.07 : 0.04;
    gain.gain.setValueAtTime(volume, t); 
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.start(t);
    osc.stop(t + 0.06);

    const bufferSize = this.ctx.sampleRate * 0.05; 
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this.ctx.createGain();
    const noiseFilter = this.ctx.createBiquadFilter();

    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = isHeavyKey ? 800 : 1500; 

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.gainNode);

    const noiseVol = (0.02 + (Math.random() * 0.02)) * (isHeavyKey ? 1.5 : 1);
    noiseGain.gain.setValueAtTime(noiseVol, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    noise.start(t);
  }

  playUserTyping() {
      this.playTypingSound(-400);
  }

  playSendSound() {
    if (this.isMuted || !this.ctx || !this.gainNode) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.gainNode!);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.2);
    
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    
    osc.start(t);
    osc.stop(t + 0.2);
  }

  playReceiveSound() {
    if (this.isMuted || !this.ctx || !this.gainNode) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.gainNode!);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.linearRampToValueAtTime(800, t + 0.1);
    osc.frequency.linearRampToValueAtTime(600, t + 0.4);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.15, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    
    osc.start(t);
    osc.stop(t + 0.4);
  }

  playWindowSound(opening: boolean) {
    if (this.isMuted || !this.ctx || !this.gainNode) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.gainNode!);

    osc.type = 'sine';
    
    if (opening) {
      osc.frequency.setValueAtTime(200, t);
      osc.frequency.exponentialRampToValueAtTime(800, t + 0.15);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.08, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    } else {
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(200, t + 0.15);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    }

    osc.start(t);
    osc.stop(t + 0.15);
  }

  playConfirmSound() {
    if (this.isMuted || !this.ctx || !this.gainNode) return;

    const t = this.ctx.currentTime;
    const playTone = (freq: number, start: number) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.connect(gain);
      gain.connect(this.gainNode!);
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.08, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);
      osc.start(start);
      osc.stop(start + 0.15);
    };
    playTone(880, t);
    playTone(1760, t + 0.1);
  }
  
  playClickSound() {
      if (this.isMuted || !this.ctx || !this.gainNode) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.gainNode);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1500, t);
      osc.frequency.exponentialRampToValueAtTime(500, t + 0.05);
      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      osc.start(t);
      osc.stop(t + 0.05);
  }

  playLevelUpSound() {
      if (this.isMuted || !this.ctx || !this.gainNode) return;
      const t = this.ctx.currentTime;
      const freqs = [440, 554, 659, 880, 1108, 1318];
      freqs.forEach((f, i) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(f, t + (i * 0.1));
          gain.connect(this.gainNode!);
          osc.connect(gain);
          gain.gain.setValueAtTime(0, t + (i * 0.1));
          gain.gain.linearRampToValueAtTime(0.1, t + (i * 0.1) + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, t + (i * 0.1) + 0.4);
          osc.start(t + (i * 0.1));
          osc.stop(t + (i * 0.1) + 0.4);
      });
  }

  playCombatSound() {
      if (this.isMuted || !this.ctx || !this.gainNode) return;
      const t = this.ctx.currentTime;
      
      const bufferSize = this.ctx.sampleRate * 0.3;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for(let i=0; i<bufferSize; i++) data[i] = Math.random() * 2 - 1;
      
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = this.ctx.createGain();
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(1000, t);
      noiseFilter.frequency.exponentialRampToValueAtTime(100, t + 0.2);
      
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.gainNode);
      
      noiseGain.gain.setValueAtTime(0.2, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      noise.start(t);

      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.2);
      osc.connect(oscGain);
      oscGain.connect(this.gainNode);
      oscGain.gain.setValueAtTime(0.2, t);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.start(t);
      osc.stop(t + 0.2);
  }

  playItemGetSound() {
      if (this.isMuted || !this.ctx || !this.gainNode) return;
      const t = this.ctx.currentTime;
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, t);
      osc.frequency.linearRampToValueAtTime(2000, t + 0.1);
      
      gain.connect(this.gainNode);
      osc.connect(gain);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.1, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      
      osc.start(t);
      osc.stop(t + 0.5);
      
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(2400, t + 0.1);
      gain2.connect(this.gainNode);
      osc2.connect(gain2);
      gain2.gain.setValueAtTime(0, t + 0.1);
      gain2.gain.linearRampToValueAtTime(0.1, t + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      osc2.start(t + 0.1);
      osc2.stop(t + 0.6);
  }

  playCritSuccess() {
      if (this.isMuted || !this.ctx || !this.gainNode) return;
      const t = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, t);
          osc.detune.setValueAtTime(Math.random() * 10, t);
          gain.connect(this.gainNode!);
          osc.connect(gain);
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.1, t + 0.5);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 2.0);
          osc.start(t);
          osc.stop(t + 2.0);
      });
  }

  playCritFail() {
      if (this.isMuted || !this.ctx || !this.gainNode) return;
      const t = this.ctx.currentTime;
      
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(440, t); 
      osc1.frequency.linearRampToValueAtTime(110, t + 0.5); 
      osc2.frequency.setValueAtTime(311, t); 
      osc2.frequency.linearRampToValueAtTime(77, t + 0.5);
      
      gain.connect(this.gainNode);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.5);
      osc2.stop(t + 0.5);
  }

  playFailSound() {
      if (this.isMuted || !this.ctx || !this.gainNode) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.linearRampToValueAtTime(100, t + 0.2);
      gain.connect(this.gainNode);
      osc.connect(gain);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.start(t);
      osc.stop(t + 0.2);
  }

  startAmbientHum() {
    if (!this.ctx || !this.gainNode) this.init();
    if (this.ghostTimerId) return;

    const attemptTrigger = () => {
        if (Math.random() < 0.05 && !this.isMuted && this.ctx) {
            this.triggerGhostHum();
        }
        this.ghostTimerId = window.setTimeout(attemptTrigger, 60000); 
    };
    
    this.ghostTimerId = window.setTimeout(attemptTrigger, 10000);
  }

  private triggerGhostHum() {
    if (!this.ctx || !this.gainNode) return;
    
    const t = this.ctx.currentTime;
    const duration = 15 + Math.random() * 30; 

    this.ambientOsc1 = this.ctx.createOscillator();
    this.ambientOsc2 = this.ctx.createOscillator();
    this.ambientGain = this.ctx.createGain();
    
    this.ambientOsc1.connect(this.ambientGain);
    this.ambientOsc2.connect(this.ambientGain);
    this.ambientGain.connect(this.gainNode); 

    this.ambientOsc1.type = 'sine';
    this.ambientOsc1.frequency.value = 60 + (Math.random() * 2 - 1); 
    
    this.ambientOsc2.type = 'sine';
    this.ambientOsc2.frequency.value = 61 + (Math.random() * 2 - 1);

    this.ambientGain.gain.setValueAtTime(0, t);
    this.ambientGain.gain.linearRampToValueAtTime(0.015, t + 5);
    
    this.ambientGain.gain.setValueAtTime(0.015, t + duration - 5);
    this.ambientGain.gain.linearRampToValueAtTime(0, t + duration);

    this.ambientOsc1.start(t);
    this.ambientOsc2.start(t);
    this.ambientOsc1.stop(t + duration);
    this.ambientOsc2.stop(t + duration);

    console.log("[SYSTEM] Ghost hum detected in machine.");
  }

  toggleMute(mute: boolean) {
    this.isMuted = mute;
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setTargetAtTime(mute ? 0 : 0.015, this.ctx.currentTime, 0.1);
    }
  }
}

export const audio = new SoundEngine();
