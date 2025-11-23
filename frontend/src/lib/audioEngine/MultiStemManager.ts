// MultiStemManager - Manages multi-stem recording and storage
import { ExternalBlob } from '../../backend';

export interface StemData {
  id: string;
  type: 'dry' | 'mixed' | 'harmony';
  blob: Blob;
  volume: number;
  isMuted: boolean;
  timestamp: number;
}

export interface TakeData {
  id: string;
  takeNumber: number;
  stems: StemData[];
  duration: number;
  waveform: number[];
  createdAt: number;
}

export class MultiStemManager {
  private takes: Map<string, TakeData> = new Map();

  async createTake(
    takeNumber: number,
    dryBlob: Blob,
    mixedBlob: Blob,
    harmonyBlob?: Blob
  ): Promise<TakeData> {
    const takeId = `take_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const stems: StemData[] = [
      {
        id: `${takeId}_dry`,
        type: 'dry',
        blob: dryBlob,
        volume: 100,
        isMuted: false,
        timestamp: Date.now(),
      },
      {
        id: `${takeId}_mixed`,
        type: 'mixed',
        blob: mixedBlob,
        volume: 100,
        isMuted: false,
        timestamp: Date.now(),
      },
    ];

    if (harmonyBlob) {
      stems.push({
        id: `${takeId}_harmony`,
        type: 'harmony',
        blob: harmonyBlob,
        volume: 50,
        isMuted: false,
        timestamp: Date.now(),
      });
    }

    // Generate waveform data
    const waveform = await this.generateWaveform(dryBlob);
    
    // Calculate duration
    const duration = await this.calculateDuration(dryBlob);

    const takeData: TakeData = {
      id: takeId,
      takeNumber,
      stems,
      duration,
      waveform,
      createdAt: Date.now(),
    };

    this.takes.set(takeId, takeData);
    return takeData;
  }

  private async generateWaveform(blob: Blob): Promise<number[]> {
    const audioContext = new AudioContext();
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const channelData = audioBuffer.getChannelData(0);
    const samples = 100; // Number of waveform points
    const blockSize = Math.floor(channelData.length / samples);
    const waveform: number[] = [];

    for (let i = 0; i < samples; i++) {
      const start = i * blockSize;
      const end = start + blockSize;
      let sum = 0;
      
      for (let j = start; j < end && j < channelData.length; j++) {
        sum += Math.abs(channelData[j]);
      }
      
      waveform.push(Math.round((sum / blockSize) * 100));
    }

    await audioContext.close();
    return waveform;
  }

  private async calculateDuration(blob: Blob): Promise<number> {
    const audioContext = new AudioContext();
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const duration = Math.round(audioBuffer.duration);
    await audioContext.close();
    return duration;
  }

  getTake(takeId: string): TakeData | undefined {
    return this.takes.get(takeId);
  }

  getAllTakes(): TakeData[] {
    return Array.from(this.takes.values());
  }

  updateStemVolume(takeId: string, stemId: string, volume: number): void {
    const take = this.takes.get(takeId);
    if (take) {
      const stem = take.stems.find(s => s.id === stemId);
      if (stem) {
        stem.volume = volume;
      }
    }
  }

  toggleStemMute(takeId: string, stemId: string): void {
    const take = this.takes.get(takeId);
    if (take) {
      const stem = take.stems.find(s => s.id === stemId);
      if (stem) {
        stem.isMuted = !stem.isMuted;
      }
    }
  }

  async exportTakeToExternalBlob(takeId: string, stemType: 'dry' | 'mixed' | 'harmony'): Promise<ExternalBlob> {
    const take = this.takes.get(takeId);
    if (!take) {
      throw new Error('Take not found');
    }

    const stem = take.stems.find(s => s.type === stemType);
    if (!stem) {
      throw new Error(`Stem type ${stemType} not found`);
    }

    const arrayBuffer = await stem.blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    return ExternalBlob.fromBytes(uint8Array);
  }

  clear(): void {
    this.takes.clear();
  }
}

// Singleton instance
export const multiStemManager = new MultiStemManager();
