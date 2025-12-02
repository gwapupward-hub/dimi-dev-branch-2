// Type definitions matching the backend Motoko canister

export type AppRole = 'Producer' | 'Artist';

export interface UserProfile {
  name: string;
  role: AppRole;
}

export interface ExternalBlob {
  data: Uint8Array;
  contentType: string;
}

export interface Beat {
  id: string;
  title: string;
  description: string;
  producer: string; // Principal as string
  file: ExternalBlob;
  isShared: boolean;
}

export interface Track {
  id: string;
  title: string;
  artist: string; // Principal as string
  beatId: string;
  file: ExternalBlob;
}

// Collaboration types (for future implementation)
export interface ChatMessage {
  id: string;
  sender: string; // Principal as string
  senderName: string;
  message: string;
  timestamp: bigint;
}

export interface CollaborativeTrack {
  id: string;
  title: string;
  participants: string[]; // Array of Principal strings
  beatId: string;
  stems: ExternalBlob[];
  createdAt: bigint;
}

export interface CollabRoom {
  id: string;
  name: string;
  host: string; // Principal as string
  participants: string[]; // Array of Principal strings
  beatId?: string;
  isActive: boolean;
  createdAt: bigint;
}

// Helper function to convert Principal to string
export const principalToString = (principal: any): string => {
  if (typeof principal === 'string') return principal;
  if (principal && typeof principal.toText === 'function') {
    return principal.toText();
  }
  return String(principal);
};

// Helper function to convert Blob to ExternalBlob
export const blobToExternalBlob = async (
  blob: Blob,
  contentType?: string
): Promise<ExternalBlob> => {
  const arrayBuffer = await blob.arrayBuffer();
  return {
    data: new Uint8Array(arrayBuffer),
    contentType: contentType || blob.type || 'application/octet-stream',
  };
};

// Helper function to convert ExternalBlob to Blob
export const externalBlobToBlob = (externalBlob: ExternalBlob): Blob => {
  return new Blob([externalBlob.data], { type: externalBlob.contentType });
};
