// AudioEngineManager - Unified interface for all audio worklets
export class AudioEngineManager {
  private audioContext: AudioContext | null = null;
  private recorderNode: AudioWorkletNode | null = null;
  private effectsNode: AudioWorkletNode | null = null;
  private harmonyNode: AudioWorkletNode | null = null;
  private pitchNode: AudioWorkletNode | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.audioContext = new AudioContext({
      latencyHint: 'interactive',
      sampleRate: 48000,
    });

    // Load all worklet modules
    try {
      await this.audioContext.audioWorklet.addModule('/worklets/recorder-worklet.js');
      await this.audioContext.audioWorklet.addModule('/worklets/effects-chain-worklet.js');
      await this.audioContext.audioWorklet.addModule('/worklets/harmony-worklet.js');
      await this.audioContext.audioWorklet.addModule('/worklets/crepe-processor-worklet.js');
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to load audio worklets:', error);
      throw error;
    }
  }

  async createRecorderNode(): Promise<AudioWorkletNode> {
    if (!this.audioContext || !this.initialized) {
      throw new Error('AudioEngineManager not initialized');
    }

    this.recorderNode = new AudioWorkletNode(this.audioContext, 'recorder-worklet');
    return this.recorderNode;
  }

  async createEffectsChainNode(): Promise<AudioWorkletNode> {
    if (!this.audioContext || !this.initialized) {
      throw new Error('AudioEngineManager not initialized');
    }

    this.effectsNode = new AudioWorkletNode(this.audioContext, 'effects-chain-worklet');
    return this.effectsNode;
  }

  async createHarmonyNode(): Promise<AudioWorkletNode> {
    if (!this.audioContext || !this.initialized) {
      throw new Error('AudioEngineManager not initialized');
    }

    this.harmonyNode = new AudioWorkletNode(this.audioContext, 'harmony-worklet');
    return this.harmonyNode;
  }

  async createPitchDetectionNode(): Promise<AudioWorkletNode> {
    if (!this.audioContext || !this.initialized) {
      throw new Error('AudioEngineManager not initialized');
    }

    this.pitchNode = new AudioWorkletNode(this.audioContext, 'crepe-processor-worklet');
    return this.pitchNode;
  }

  updateEffects(params: {
    eqLow?: number;
    eqMid?: number;
    eqHigh?: number;
    compression?: number;
    reverb?: number;
    delay?: number;
  }): void {
    if (this.effectsNode) {
      this.effectsNode.port.postMessage({
        type: 'updateEffects',
        params,
      });
    }
  }

  updateHarmony(params: {
    pitchShift?: number;
    harmonyMix?: number;
  }): void {
    if (this.harmonyNode) {
      this.harmonyNode.port.postMessage({
        type: 'updateHarmony',
        params,
      });
    }
  }

  startRecording(): void {
    if (this.recorderNode) {
      this.recorderNode.port.postMessage({ type: 'start' });
    }
  }

  stopRecording(): Promise<{ buffers: Float32Array[]; sampleRate: number }> {
    return new Promise((resolve) => {
      if (!this.recorderNode) {
        resolve({ buffers: [], sampleRate: 48000 });
        return;
      }

      this.recorderNode.port.onmessage = (event) => {
        if (event.data.type === 'recordingComplete') {
          resolve({
            buffers: event.data.buffers,
            sampleRate: event.data.sampleRate,
          });
        }
      };

      this.recorderNode.port.postMessage({ type: 'stop' });
    });
  }

  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  async close(): Promise<void> {
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
      this.initialized = false;
    }
  }
}

// Singleton instance
export const audioEngineManager = new AudioEngineManager();
