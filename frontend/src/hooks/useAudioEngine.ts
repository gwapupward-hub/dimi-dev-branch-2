// Custom hook for audio engine integration
import { useState, useEffect, useCallback, useRef } from 'react';
import { audioEngineManager } from '../lib/audioEngine/AudioEngineManager';
import { multiStemManager, type TakeData } from '../lib/audioEngine/MultiStemManager';

export interface EffectsParams {
  eqLow: number;
  eqMid: number;
  eqHigh: number;
  compression: number;
  reverb: number;
  delay: number;
}

export interface HarmonyParams {
  pitchShift: number;
  harmonyMix: number;
}

export function useAudioEngine() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentPitch, setCurrentPitch] = useState<number>(0);
  const [effects, setEffects] = useState<EffectsParams>({
    eqLow: 0,
    eqMid: 0,
    eqHigh: 0,
    compression: 0,
    reverb: 0,
    delay: 0,
  });
  const [harmony, setHarmony] = useState<HarmonyParams>({
    pitchShift: 0,
    harmonyMix: 0.5,
  });

  const pitchNodeRef = useRef<AudioWorkletNode | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await audioEngineManager.initialize();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize audio engine:', error);
      }
    };

    init();

    return () => {
      audioEngineManager.close();
    };
  }, []);

  const updateEffects = useCallback((newEffects: Partial<EffectsParams>) => {
    const updatedEffects = { ...effects, ...newEffects };
    setEffects(updatedEffects);
    audioEngineManager.updateEffects(updatedEffects);
  }, [effects]);

  const updateHarmony = useCallback((newHarmony: Partial<HarmonyParams>) => {
    const updatedHarmony = { ...harmony, ...newHarmony };
    setHarmony(updatedHarmony);
    audioEngineManager.updateHarmony(updatedHarmony);
  }, [harmony]);

  const startRecording = useCallback(async () => {
    if (!isInitialized) return;

    try {
      audioEngineManager.startRecording();
      setIsRecording(true);

      // Start pitch detection
      if (!pitchNodeRef.current) {
        pitchNodeRef.current = await audioEngineManager.createPitchDetectionNode();
        pitchNodeRef.current.port.onmessage = (event) => {
          if (event.data.type === 'pitchDetected') {
            setCurrentPitch(event.data.pitch);
          }
        };
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }, [isInitialized]);

  const stopRecording = useCallback(async (): Promise<TakeData | null> => {
    if (!isRecording) return null;

    try {
      const result = await audioEngineManager.stopRecording();
      setIsRecording(false);

      // Convert buffers to blobs
      const dryBlob = await buffersToBlob(result.buffers, result.sampleRate);
      const mixedBlob = dryBlob; // In a real implementation, this would be the processed audio
      
      // Create take with multi-stem data
      const takeNumber = multiStemManager.getAllTakes().length + 1;
      const takeData = await multiStemManager.createTake(takeNumber, dryBlob, mixedBlob);

      return takeData;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setIsRecording(false);
      return null;
    }
  }, [isRecording]);

  return {
    isInitialized,
    isRecording,
    currentPitch,
    effects,
    harmony,
    updateEffects,
    updateHarmony,
    startRecording,
    stopRecording,
  };
}

// Helper function to convert audio buffers to blob
async function buffersToBlob(buffers: Float32Array[], sampleRate: number): Promise<Blob> {
  // Concatenate all buffers
  const totalLength = buffers.reduce((sum, buffer) => sum + buffer.length, 0);
  const concatenated = new Float32Array(totalLength);
  
  let offset = 0;
  for (const buffer of buffers) {
    concatenated.set(buffer, offset);
    offset += buffer.length;
  }

  // Convert to WAV format
  const wavBuffer = encodeWAV(concatenated, sampleRate);
  return new Blob([wavBuffer], { type: 'audio/wav' });
}

function encodeWAV(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  // WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  // Write samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }

  return buffer;
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
