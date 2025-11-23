// CrepeProcessorWorklet - Real-time pitch detection
// This file runs in AudioWorklet context where global types are available

class CrepeProcessorWorkletProcessor extends AudioWorkletProcessor {
  private buffer: Float32Array;
  private bufferSize = 1024;
  private writeIndex = 0;
  private analysisInterval = 100; // Analyze every 100 samples
  private sampleCounter = 0;

  constructor() {
    super();
    this.buffer = new Float32Array(this.bufferSize);
  }

  private autocorrelate(buffer: Float32Array): number {
    // Simple autocorrelation for pitch detection
    let maxCorrelation = 0;
    let bestLag = 0;
    
    const minLag = Math.floor(sampleRate / 1000); // 1000 Hz max
    const maxLag = Math.floor(sampleRate / 50);   // 50 Hz min
    
    for (let lag = minLag; lag < maxLag; lag++) {
      let correlation = 0;
      for (let i = 0; i < buffer.length - lag; i++) {
        correlation += buffer[i] * buffer[i + lag];
      }
      
      if (correlation > maxCorrelation) {
        maxCorrelation = correlation;
        bestLag = lag;
      }
    }
    
    return bestLag > 0 ? sampleRate / bestLag : 0;
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean {
    const input = inputs[0];
    const output = outputs[0];
    
    if (!input || !input[0]) {
      return true;
    }

    const inputChannel = input[0];
    
    // Pass through audio
    if (output && output[0]) {
      output[0].set(inputChannel);
    }
    
    // Collect samples for analysis
    for (let i = 0; i < inputChannel.length; i++) {
      this.buffer[this.writeIndex] = inputChannel[i];
      this.writeIndex = (this.writeIndex + 1) % this.bufferSize;
      this.sampleCounter++;
      
      // Perform pitch detection periodically
      if (this.sampleCounter >= this.analysisInterval) {
        this.sampleCounter = 0;
        const pitch = this.autocorrelate(this.buffer);
        
        // Send pitch data to main thread
        this.port.postMessage({
          type: 'pitchDetected',
          pitch,
          timestamp: currentTime,
        });
      }
    }

    return true;
  }
}

registerProcessor('crepe-processor-worklet', CrepeProcessorWorkletProcessor);
