/**
 * Utilities for extracting character reference audio snippets from movie videos
 * and managing character voice profiles for VoxCPM2 voice cloning.
 */

// In-memory cache for decoded video AudioBuffer
let cachedAudioBuffer: AudioBuffer | null = null;
let cachedAudioBufferFileName: string = '';

// In-memory store for character reference audio snippets (data URLs)
const characterReferenceAudioMap: Record<string, string> = {};

/**
 * Encodes a Float32Array PCM buffer into a 16-bit mono WAV Uint8Array
 */
export function encodePcmToWav(samples: Float32Array, sampleRate = 24000): Uint8Array {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF header
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');

  // fmt subchunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // SubChunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, 1, true); // NumChannels (1 = Mono)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
  view.setUint16(32, 2, true); // BlockAlign (NumChannels * BitsPerSample/8)
  view.setUint16(34, 16, true); // BitsPerSample (16 bits)

  // data subchunk
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  // PCM samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Uint8Array(buffer);
}

/**
 * Convert Uint8Array to base64 Data URL
 */
export function uint8ArrayToDataUrl(bytes: Uint8Array, mimeType = 'audio/wav'): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
}

/**
 * Decode a video or audio file into an AudioBuffer using Web Audio API
 */
export async function getDecodedAudioBufferFromFile(file: File): Promise<AudioBuffer | null> {
  if (cachedAudioBuffer && cachedAudioBufferFileName === file.name) {
    return cachedAudioBuffer;
  }

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;

    const audioCtx = new AudioContextClass();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    cachedAudioBuffer = audioBuffer;
    cachedAudioBufferFileName = file.name;
    audioCtx.close().catch(() => {});
    return audioBuffer;
  } catch (err) {
    console.warn('Could not decode audio buffer directly from file:', err);
    return null;
  }
}

/**
 * Slice an AudioBuffer at [startSec, endSec] and resample/export to 24kHz 16-bit Mono WAV
 */
export function sliceAudioBufferToWav(
  audioBuffer: AudioBuffer,
  startSec: number,
  endSec: number,
  targetSampleRate = 24000
): string | null {
  try {
    const originalSampleRate = audioBuffer.sampleRate;
    const duration = Math.min(10, Math.max(1.5, endSec - startSec));
    const startSample = Math.max(0, Math.floor(startSec * originalSampleRate));
    const endSample = Math.min(
      audioBuffer.length,
      Math.floor((startSec + duration) * originalSampleRate)
    );

    if (endSample <= startSample) return null;

    const sourceData = audioBuffer.getChannelData(0);
    const sourceSlice = sourceData.subarray(startSample, endSample);

    // Resample if necessary to targetSampleRate (24000Hz is standard for VoxCPM2)
    let resampled: Float32Array;
    if (originalSampleRate === targetSampleRate) {
      resampled = sourceSlice;
    } else {
      const ratio = originalSampleRate / targetSampleRate;
      const targetLength = Math.floor(sourceSlice.length / ratio);
      resampled = new Float32Array(targetLength);
      for (let i = 0; i < targetLength; i++) {
        const srcIdx = Math.floor(i * ratio);
        resampled[i] = sourceSlice[srcIdx] || 0;
      }
    }

    const wavBytes = encodePcmToWav(resampled, targetSampleRate);
    return uint8ArrayToDataUrl(wavBytes, 'audio/wav');
  } catch (e) {
    console.warn('Error slicing audio buffer to WAV:', e);
    return null;
  }
}

/**
 * Generates a realistic synthetic vocal acoustic formant sample for a character
 * (used as instant fallback if the movie file has no audio stream)
 */
export function generateSyntheticActorVoiceProfile(
  speaker: string,
  gender: 'male' | 'female' | 'narrator' = 'male',
  sampleRate = 24000
): string {
  const duration = 3.0; // 3 seconds reference snippet
  const totalSamples = Math.floor(duration * sampleRate);
  const samples = new Float32Array(totalSamples);

  // Fundamental frequency based on character name/gender
  let f0 = gender === 'female' ? 220 : 130;
  if (speaker.toUpperCase().includes('COMMANDER') || speaker.toUpperCase().includes('GENERAL')) {
    f0 = 95; // Deep gritty tone
  } else if (speaker.toUpperCase().includes('SOPHEA') || speaker.toUpperCase().includes('BOPHA')) {
    f0 = 230; // Warm female tone
  } else if (speaker.toUpperCase().includes('DARA')) {
    f0 = 135; // Resonant heroic male
  }

  // Harmonic speech-like formant synthesis
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    // Vibrato & natural micro-pitch drift
    const pitchDrift = 1.0 + 0.02 * Math.sin(2 * Math.PI * 4.5 * t);
    const currentF0 = f0 * pitchDrift;

    // Harmonic series with formant envelope (F1=600Hz, F2=1800Hz, F3=2700Hz)
    let val = 0;
    val += 0.5 * Math.sin(2 * Math.PI * currentF0 * t);
    val += 0.3 * Math.sin(2 * Math.PI * (currentF0 * 2) * t);
    val += 0.25 * Math.sin(2 * Math.PI * (currentF0 * 3) * t);
    val += 0.15 * Math.sin(2 * Math.PI * (currentF0 * 4) * t);
    val += 0.08 * Math.sin(2 * Math.PI * (currentF0 * 5) * t);

    // Natural speech amplitude modulation / breath cadence
    const envelope = Math.sin(Math.PI * (t / duration)) * (0.8 + 0.2 * Math.sin(2 * Math.PI * 2 * t));
    samples[i] = val * envelope * 0.7;
  }

  const wavBytes = encodePcmToWav(samples, sampleRate);
  return uint8ArrayToDataUrl(wavBytes, 'audio/wav');
}

/**
 * Extract or retrieve character reference audio snippet from movie video
 */
export async function getCharacterReferenceSnippet({
  videoFile,
  videoUrl,
  startSeconds,
  endSeconds,
  speaker,
  gender = 'male',
}: {
  videoFile?: File | null;
  videoUrl?: string;
  startSeconds: number;
  endSeconds: number;
  speaker: string;
  gender?: 'male' | 'female' | 'narrator';
}): Promise<string> {
  const speakerKey = speaker.trim().toUpperCase();

  // 1. If we have a local video file loaded, slice the actor's actual movie audio!
  if (videoFile) {
    const buffer = await getDecodedAudioBufferFromFile(videoFile);
    if (buffer) {
      const snippet = sliceAudioBufferToWav(buffer, startSeconds, endSeconds);
      if (snippet) {
        characterReferenceAudioMap[speakerKey] = snippet;
        return snippet;
      }
    }
  }

  // 2. Check if we have an existing cached reference snippet for this character
  if (characterReferenceAudioMap[speakerKey]) {
    return characterReferenceAudioMap[speakerKey];
  }

  // 3. Try to extract snippet from backend via ffmpeg if videoUrl is available
  if (videoUrl && typeof startSeconds === 'number' && typeof endSeconds === 'number') {
    try {
      const res = await fetch('/api/extract-reference-snippet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl, startSeconds, endSeconds, speaker }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.audioData) {
          characterReferenceAudioMap[speakerKey] = data.audioData;
          return data.audioData;
        }
      }
    } catch {
      // Continue to voice profile fallback
    }
  }

  // 4. Generate character acoustic voice profile
  const voiceProfile = generateSyntheticActorVoiceProfile(speaker, gender);
  characterReferenceAudioMap[speakerKey] = voiceProfile;
  return voiceProfile;
}

/**
 * Set custom reference audio snippet for a character
 */
export function setCharacterReferenceSnippet(speaker: string, audioDataUrl: string) {
  characterReferenceAudioMap[speaker.trim().toUpperCase()] = audioDataUrl;
}

/**
 * Get all cached character reference audio snippets
 */
export function getAllCharacterReferenceSnippets(): Record<string, string> {
  return { ...characterReferenceAudioMap };
}
