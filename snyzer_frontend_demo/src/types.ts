export type PageRoute = 'home' | 'playground' | 'auth' | 'history' | 'about' | 'settings';

export type ToneMode = 'Academic' | 'Formal' | 'Natural';
export type IntensityMode = 'Mild' | 'Balanced' | 'Expressive';
export type IntentLockMode = 'Locked' | 'High' | 'Fluid';

export type PlaygroundState = 'idle' | 'scanning' | 'streaming' | 'completed';

export interface AppSettings {
  defaultTone: ToneMode;
  defaultIntensity: IntensityMode;
  defaultIntentLock: IntentLockMode;
  intentThreshold: number;
  clichePurgeLevel: 'strict' | 'standard' | 'relaxed';
  preserveCodeBlocks: boolean;
  burstinessEntropy: number;
  soundEnabled: boolean;
  theme: 'cyber-dark' | 'midnight' | 'matrix';
  geminiApiKey: string;
  reactBitsKey: string;
  zeroRetention: boolean;
  autoSaveHistory: boolean;
}

export interface HistoryItem {
  id: string;
  title: string;
  timestamp: string;
  originalText: string;
  revisedText: string;
  wordCount: number;
  cadenceScore: number;
  aiDetectedOriginal: number;
  aiDetectedRevised: number;
  tone: ToneMode;
  intensity: IntensityMode;
  clichéFlags: number;
}

export interface UserSession {
  isLoggedIn: boolean;
  email?: string;
  name?: string;
}
