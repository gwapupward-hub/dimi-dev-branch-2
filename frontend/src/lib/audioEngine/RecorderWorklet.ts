// RecorderWorklet - Professional audio recording with sample-accurate timing
// This file runs in AudioWorklet context where global types are available

class RecorderWorkletProcessor extends AudioWorkletProcessor {
  private buffers: Float32Array[] = [];
  private isRecording = false;
  private sampleRate: number;

  constructor() {
    super();
    this.sampleRate = sampleRate;
    
    this.port.onmessage = (event) => {
      const { type } = event.data;
      
      if (type === 'start') {
        this.isRecording = true;
        this.buffers = [];
      } else if (type === 'stop') {
        this.isRecording = false;
        this.port.postMessage({
          type: 'recordingComplete',
          buffers: this.buffers,
          sampleRate: this.sampleRate,
        });
      }
    };
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean {
    const input = inputs[0];
    
    if (this.isRecording && input && input[0]) {
      // Store a copy of the input buffer
      const buffer = new Float32Array(input[0].length);
      buffer.set(input[0]);
      this.buffers.push(buffer);
    }

    // Pass through audio
    if (input && input[0] && outputs && outputs[0] && outputs[0][0]) {
      outputs[0][0].set(input[0]);
    }

    return true;
  }
}

// Register the processor
registerProcessor('recorder-worklet', RecorderWorkletProcessor);
