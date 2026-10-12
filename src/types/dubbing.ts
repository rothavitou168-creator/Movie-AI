export interface DialogueCue {
  id: string;
  speaker: string;
  startTime: string; // e.g. "00:02.50"
  endTime: string;   // e.g. "00:05.80"
  startSeconds: number;
  endSeconds: number;
  originalText: string;
  khmerSpokenText: string;
  phoneticGuide: string;
  emotionTone: string;
  voiceActorGender: 'male' | 'female' | 'narrator';
  cadenceNotes: string;
  audioUrl?: string;
  clonedAudioUrl?: string;
  referenceAudioUrl?: string;
  isCustomRecorded?: boolean;
}

export type DubbingGenre =
  | 'Action Thriller'
  | 'Drama & Romance'
  | 'Sci-Fi / Cyberpunk'
  | 'Horror & Suspense'
  | 'Comedy'
  | 'Historical / Epic';

export type DubbingStyle =
  | 'theatrical'      // រឿងខ្នាតធំ (Cinematic Big Screen)
  | 'tv-series'       // រឿងភាគទូរទស្សន៍ (TV Drama Style)
  | 'anime'           // គំនូរជីវចល (Animated / High Energy)
  | 'documentary';    // ភាពយន្តឯកសារ (Documentary Voiceover)

export interface VoiceActorProfile {
  id: string;
  name: string;
  khmerName: string;
  gender: 'male' | 'female';
  tone: string;
  avatarColor: string;
  ttsVoice: string;
}

export interface SampleMovie {
  id: string;
  title: string;
  khmerTitle: string;
  genre: DubbingGenre;
  videoUrl: string;
  duration: number;
  description: string;
  sampleScript: string;
}
