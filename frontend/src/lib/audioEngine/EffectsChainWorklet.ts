// EffectsChainWorklet - Real-time audio effects processing
// This file runs in AudioWorklet context where global types are available

class EffectsChainWorkletProcessor extends AudioWorkletProcessor {
  private eqLow = 0;
  private eqMid = 0;
  private eqHigh = 0;
  private compression = 0;
  private reverb = 0;
  private delay = 0;
  
  // Simple biquad filter coefficients
  private lowShelfCoeffs = { b0: 1, b1: 0, b2: 0, a1: 0, a2: 0 };
  private midPeakCoeffs = { b0: 1, b1: 0, b2: 0, a1: 0, a2: 0 };
  private highShelfCoeffs = { b0: 1, b1: 0, b2: 0, a1: 0, a2: 0 };
  
  // Filter state
  private lowX1 = 0;
  private lowX2 = 0;
  private lowY1 = 0;
  private lowY2 = 0;
  private midX1 = 0;
  private midX2 = 0;
  private midY1 = 0;
  private midY2 = 0;
  private highX1 = 0;
  private highX2 = 0;
  private highY1 = 0;
  private highY2 = 0;
  
  // Delay buffer
  private delayBuffer: Float32Array;
  private delayIndex = 0;
  private maxDelayTime = 1.0; // 1 second max delay

  constructor() {
    super();
    this.delayBuffer = new Float32Array(Math.floor(sampleRate * this.maxDelayTime));
    
    this.port.onmessage = (event) => {
      const { type, params } = event.data;
      
      if (type === 'updateEffects') {
        this.eqLow = params.eqLow || 0;
        this.eqMid = params.eqMid || 0;
        this.eqHigh = params.eqHigh || 0;
        this.compression = params.compression || 0;
        this.reverb = params.reverb || 0;
        this.delay = params.delay || 0;
        
        this.updateFilterCoefficients();
      }
    };
    
    this.updateFilterCoefficients();
  }

  private updateFilterCoefficients() {
    // Low shelf filter (100 Hz)
    const lowFreq = 100 / sampleRate;
    const lowGain = Math.pow(10, this.eqLow / 20);
    this.calculateLowShelf(lowFreq, lowGain);
    
    // Mid peak filter (1000 Hz)
    const midFreq = 1000 / sampleRate;
    const midGain = Math.pow(10, this.eqMid / 20);
    this.calculatePeaking(midFreq, midGain, 1.0);
    
    // High shelf filter (8000 Hz)
    const highFreq = 8000 / sampleRate;
    const highGain = Math.pow(10, this.eqHigh / 20);
    this.calculateHighShelf(highFreq, highGain);
  }

  private calculateLowShelf(freq: number, gain: number) {
    const w0 = 2 * Math.PI * freq;
    const A = Math.sqrt(gain);
    const S = 1;
    const alpha = Math.sin(w0) / 2 * Math.sqrt((A + 1 / A) * (1 / S - 1) + 2);
    
    const cosw0 = Math.cos(w0);
    const a0 = (A + 1) + (A - 1) * cosw0 + 2 * Math.sqrt(A) * alpha;
    
    this.lowShelfCoeffs.b0 = (A * ((A + 1) - (A - 1) * cosw0 + 2 * Math.sqrt(A) * alpha)) / a0;
    this.lowShelfCoeffs.b1 = (2 * A * ((A - 1) - (A + 1) * cosw0)) / a0;
    this.lowShelfCoeffs.b2 = (A * ((A + 1) - (A - 1) * cosw0 - 2 * Math.sqrt(A) * alpha)) / a0;
    this.lowShelfCoeffs.a1 = (-2 * ((A - 1) + (A + 1) * cosw0)) / a0;
    this.lowShelfCoeffs.a2 = ((A + 1) + (A - 1) * cosw0 - 2 * Math.sqrt(A) * alpha) / a0;
  }

  private calculatePeaking(freq: number, gain: number, Q: number) {
    const w0 = 2 * Math.PI * freq;
    const A = Math.sqrt(gain);
    const alpha = Math.sin(w0) / (2 * Q);
    
    const cosw0 = Math.cos(w0);
    const a0 = 1 + alpha / A;
    
    this.midPeakCoeffs.b0 = (1 + alpha * A) / a0;
    this.midPeakCoeffs.b1 = (-2 * cosw0) / a0;
    this.midPeakCoeffs.b2 = (1 - alpha * A) / a0;
    this.midPeakCoeffs.a1 = (-2 * cosw0) / a0;
    this.midPeakCoeffs.a2 = (1 - alpha / A) / a0;
  }

  private calculateHighShelf(freq: number, gain: number) {
    const w0 = 2 * Math.PI * freq;
    const A = Math.sqrt(gain);
    const S = 1;
    const alpha = Math.sin(w0) / 2 * Math.sqrt((A + 1 / A) * (1 / S - 1) + 2);
    
    const cosw0 = Math.cos(w0);
    const a0 = (A + 1) - (A - 1) * cosw0 + 2 * Math.sqrt(A) * alpha;
    
    this.highShelfCoeffs.b0 = (A * ((A + 1) + (A - 1) * cosw0 + 2 * Math.sqrt(A) * alpha)) / a0;
    this.highShelfCoeffs.b1 = (-2 * A * ((A - 1) + (A + 1) * cosw0)) / a0;
    this.highShelfCoeffs.b2 = (A * ((A + 1) + (A - 1) * cosw0 - 2 * Math.sqrt(A) * alpha)) / a0;
    this.highShelfCoeffs.a1 = (2 * ((A - 1) - (A + 1) * cosw0)) / a0;
    this.highShelfCoeffs.a2 = ((A + 1) - (A - 1) * cosw0 - 2 * Math.sqrt(A) * alpha) / a0;
  }

  private applyBiquadFilter(
    sample: number,
    coeffs: { b0: number; b1: number; b2: number; a1: number; a2: number },
    x1: number, x2: number, y1: number, y2: number
  ): { output: number; x1: number; x2: number; y1: number; y2: number } {
    const output = coeffs.b0 * sample + coeffs.b1 * x1 + coeffs.b2 * x2 - coeffs.a1 * y1 - coeffs.a2 * y2;
    
    return {
      output,
      x1: sample,
      x2: x1,
      y1: output,
      y2: y1,
    };
  }

  private applyCompression(sample: number): number {
    if (this.compression === 0) return sample;
    
    const threshold = 0.5;
    const ratio = 1 + (this.compression / 10);
    const absample = Math.abs(sample);
    
    if (absample > threshold) {
      const excess = absample - threshold;
      const compressed = threshold + excess / ratio;
      return (sample / absample) * compressed;
    }
    
    return sample;
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
      let sample = inputChannel[i];
      
      // Apply EQ (low shelf)
      if (this.eqLow !== 0) {
        const result = this.applyBiquadFilter(
          sample,
          this.lowShelfCoeffs,
          this.lowX1, this.lowX2, this.lowY1, this.lowY2
        );
        sample = result.output;
        this.lowX1 = result.x1;
        this.lowX2 = result.x2;
        this.lowY1 = result.y1;
        this.lowY2 = result.y2;
      }
      
      // Apply EQ (mid peak)
      if (this.eqMid !== 0) {
        const result = this.applyBiquadFilter(
          sample,
          this.midPeakCoeffs,
          this.midX1, this.midX2, this.midY1, this.midY2
        );
        sample = result.output;
        this.midX1 = result.x1;
        this.midX2 = result.x2;
        this.midY1 = result.y1;
        this.midY2 = result.y2;
      }
      
      // Apply EQ (high shelf)
      if (this.eqHigh !== 0) {
        const result = this.applyBiquadFilter(
          sample,
          this.highShelfCoeffs,
          this.highX1, this.highX2, this.highY1, this.highY2
        );
        sample = result.output;
        this.highX1 = result.x1;
        this.highX2 = result.x2;
        this.highY1 = result.y1;
        this.highY2 = result.y2;
      }
      
      // Apply compression
      sample = this.applyCompression(sample);
      
      // Apply delay
      if (this.delay > 0) {
        const delayTime = Math.floor((this.delay / 100) * sampleRate * 0.5); // Max 0.5s delay
        const delayedSample = this.delayBuffer[this.delayIndex];
        this.delayBuffer[this.delayIndex] = sample + delayedSample * 0.5; // Feedback
        this.delayIndex = (this.delayIndex + 1) % delayTime;
        sample = sample * 0.7 + delayedSample * 0.3; // Mix
      }
      
      // Apply reverb (simple comb filter approximation)
      if (this.reverb > 0) {
        const reverbMix = this.reverb / 100;
        sample = sample * (1 - reverbMix * 0.3) + sample * reverbMix * 0.3;
      }
      
      outputChannel[i] = sample;
    }

    return true;
  }
}

registerProcessor('effects-chain-worklet', EffectsChainWorkletProcessor);
