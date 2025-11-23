// HarmonyWorklet - AI-powered harmony generation
// This file runs in AudioWorklet context where global types are available

class HarmonyWorkletProcessor extends AudioWorkletProcessor {
  private pitchShift = 0; // Semitones
  private harmonyMix = 0.5;
  private buffer: Float32Array;
  private bufferSize = 4096;
  private writeIndex = 0;

  constructor() {
    super();
    this.buffer = new Float32Array(this.bufferSize);
    
    this.port.onmessage = (event) => {
      const { type, params } = event.data;
      
      if (type === 'updateHarmony') {
        this.pitchShift = params.pitchShift || 0;
        this.harmonyMix = params.harmonyMix !== undefined ? params.harmonyMix : 0.5;
      }
    };
  }

  private simplePitchShift(sample: number, shift: number): number {
    // Simple pitch shifting using time-domain approach
    // In production, use more sophisticated algorithms like phase vocoder
    const shiftRatio = Math.pow(2, shift / 12);
    
    // Store sample in circular buffer
    this.buffer[this.writeIndex] = sample;
    this.writeIndex = (this.writeIndex + 1) % this.bufferSize;
    
    // Read from buffer with shifted position
    const readPos = (this.writeIndex - Math.floor(this.bufferSize / shiftRatio) + this.bufferSize) % this.bufferSize;
    return this.buffer[readPos];
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean {
    const input = inputs[0];
    const output = outputs[0];
    
    if (!input || !input[0] || !output || !output[0]) {
      return true;
    }

    const inputChannel = input[0];
    const outputChannel = output[0];
    
    for (let i = 0; i < inputChannel.length; i++) {
      const drySample = inputChannel[i];
      
      if (this.pitchShift !== 0) {
        const harmonySample = this.simplePitchShift(drySample, this.pitchShift);
        outputChannel[i] = drySample * (1 - this.harmonyMix) + harmonySample * this.harmonyMix;
      } else {
        outputChannel[i] = drySample;
      }
    }

    return true;
  }
}

registerProcessor('harmony-worklet', HarmonyWorkletProcessor);
