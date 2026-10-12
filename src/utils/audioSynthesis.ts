/**
 * Audio synthesis & speech helper for CINEDUB Khmer
 * Integrates local VoxCPM2 Voice Cloning API (http://127.0.0.1:8000/v1/audio/speech)
 */

export interface VoxCpmVoiceoverRequest {
  text: string;
  speaker: string;
  originalText?: string;
  referenceAudio?: string | null; // Base64 WAV data URL or raw base64
  endpoint?: string;
  apiKey?: string;
  startSeconds?: number;
  endSeconds?: number;
  videoUrl?: string;
}

export interface VoxCpmVoiceoverResult {
  audioData: string; // data:audio/...;base64,...
  source: 'voxcpm2';
  character: string;
}

/**
 * Sends a dialogue line and character reference audio snippet to VoxCPM2 voice cloning API
 * (default endpoint: http://127.0.0.1:8000/v1/audio/speech)
 */
export async function generateVoxCpmVoiceover(
  params: VoxCpmVoiceoverRequest
): Promise<VoxCpmVoiceoverResult> {
  const {
    text,
    speaker,
    originalText = '',
    referenceAudio = null,
    endpoint = 'http://127.0.0.1:8000/v1/audio/speech',
    apiKey = '',
    startSeconds,
    endSeconds,
    videoUrl,
  } = params;

  if (!text || !text.trim()) {
    throw new Error('No dialogue text provided for voiceover generation.');
  }

  // 1. Primary path: Use the backend proxy route (/api/voxcpm-voiceover)
  // This bypasses browser HTTPS->HTTP Mixed Content / CORS blocks when running in web previews
  try {
    const res = await fetch('/api/voxcpm-voiceover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        speaker,
        originalText,
        referenceAudio,
        endpoint,
        apiKey,
        startSeconds,
        endSeconds,
        videoUrl,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.audioData) {
        return {
          audioData: data.audioData,
          source: 'voxcpm2',
          character: speaker,
        };
      }
    } else {
      const errData = await res.json().catch(() => ({}));
      if (errData.error) {
        throw new Error(errData.error);
      }
    }
  } catch (backendErr: any) {
    console.warn('Backend proxy to VoxCPM2 notice:', backendErr?.message);

    // If error explicitly from backend about VoxCPM2 connection:
    if (backendErr?.message && backendErr.message.includes('VoxCPM2')) {
      throw backendErr;
    }

    // 2. Direct client fallback attempt
    try {
      const cleanRef = referenceAudio
        ? referenceAudio.includes('base64,')
          ? referenceAudio.split('base64,')[1]
          : referenceAudio
        : undefined;

      const directRes = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({
          model: 'voxcpm2',
          input: text,
          voice: speaker,
          response_format: 'mp3',
          reference_audio: cleanRef,
          prompt_audio: cleanRef,
          ref_audio: cleanRef,
          prompt_text: originalText,
          ref_text: originalText,
          reference_text: originalText,
        }),
      });

      if (directRes.ok) {
        const contentType = directRes.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const json = await directRes.json();
          const audio = json.audio || json.audio_base64 || json.data;
          if (audio) {
            return {
              audioData: audio.startsWith('data:') ? audio : `data:audio/mp3;base64,${audio}`,
              source: 'voxcpm2',
              character: speaker,
            };
          }
        } else {
          const blob = await directRes.blob();
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          return {
            audioData: dataUrl,
            source: 'voxcpm2',
            character: speaker,
          };
        }
      }
    } catch {
      // Direct call failed
    }

    throw new Error(
      `Could not connect to local VoxCPM2 voice cloning API at ${endpoint}. Please ensure your local VoxCPM2 server is running (port 8000) with OpenAI-compatible /v1/audio/speech enabled.`
    );
  }

  throw new Error(`Failed to generate voiceover from VoxCPM2 at ${endpoint}.`);
}

export async function fetchKhmerTTSAudio(
  text: string,
  voiceName: string = 'Fenrir',
  style: string = 'Cinematic emotional movie dubbing'
): Promise<string | null> {
  try {
    const res = await fetch('/api/generate-khmer-tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        voice: voiceName,
        style,
      }),
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    if (data.audioData) {
      return data.audioData;
    }
  } catch {
    // Ignore
  }
  return null;
}

/**
 * Play speech using Web Speech API (fallback or instant preview)
 */
export function speakWebSpeech(text: string, phoneticText?: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve(false);
      return;
    }

    window.speechSynthesis.cancel();

    // Check for Khmer voice
    const voices = window.speechSynthesis.getVoices();
    const khmerVoice = voices.find((v) => v.lang.includes('km') || v.lang.includes('kh'));

    const utterance = new SpeechSynthesisUtterance();

    if (khmerVoice) {
      utterance.voice = khmerVoice;
      utterance.text = text;
      utterance.lang = 'km-KH';
    } else {
      // If native Khmer voice is missing on user OS, pronounce using phonetic Romanization with clear cadence
      utterance.text = phoneticText || text;
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
    }

    utterance.onend = () => resolve(true);
    utterance.onerror = () => resolve(false);

    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Formats seconds or MM:SS.ms string into standard SRT format: HH:MM:SS,mmm
 */
export function parseToSrtTime(timeStr: string | number): string {
  if (typeof timeStr === 'number') {
    const totalSecs = Math.max(0, timeStr);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = Math.floor(totalSecs % 60);
    const ms = Math.floor((totalSecs % 1) * 1000);
    const pad = (n: number, z = 2) => String(n).padStart(z, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
  }

  const str = String(timeStr).trim();
  const pad = (n: number, z = 2) => String(n).padStart(z, '0');

  // If already standard SRT "00:00:00,000" or "00:00:00.000"
  if (/^\d{2}:\d{2}:\d{2}[,. ]\d{1,3}$/.test(str)) {
    return str.replace('.', ',');
  }

  const parts = str.split(':');
  let h = 0, m = 0, s = 0, ms = 0;

  if (parts.length === 3) {
    h = parseInt(parts[0], 10) || 0;
    m = parseInt(parts[1], 10) || 0;
    const secParts = parts[2].split(/[.,]/);
    s = parseInt(secParts[0], 10) || 0;
    ms = parseInt((secParts[1] || '0').padEnd(3, '0').slice(0, 3), 10) || 0;
  } else if (parts.length === 2) {
    m = parseInt(parts[0], 10) || 0;
    const secParts = parts[1].split(/[.,]/);
    s = parseInt(secParts[0], 10) || 0;
    ms = parseInt((secParts[1] || '0').padEnd(3, '0').slice(0, 3), 10) || 0;
  } else {
    const num = parseFloat(str) || 0;
    return parseToSrtTime(num);
  }

  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

/**
 * Converts standard SRT time "00:00:00,864" into seconds
 */
export function parseSRTTimeToSeconds(srtTime: string): number {
  try {
    const parts = srtTime.trim().split(':');
    if (parts.length === 3) {
      const h = parseInt(parts[0], 10) || 0;
      const m = parseInt(parts[1], 10) || 0;
      const secParts = parts[2].split(/[.,]/);
      const s = parseInt(secParts[0], 10) || 0;
      const ms = parseInt((secParts[1] || '0').padEnd(3, '0').slice(0, 3), 10) || 0;
      return h * 3600 + m * 60 + s + ms / 1000;
    }
  } catch {
    // fallback
  }
  return 0;
}

/**
 * Generates clean, standard-compliant SRT subtitle string from dialogue cues
 */
export function generateSRT(
  cues: Array<{
    startTime: string | number;
    endTime: string | number;
    khmerSpokenText?: string;
    originalText?: string;
    speaker?: string;
  }>
): string {
  if (!cues || cues.length === 0) return '';

  return cues
    .map((cue, index) => {
      const start = parseToSrtTime(cue.startTime);
      const end = parseToSrtTime(cue.endTime);
      const speakerPrefix = cue.speaker ? `${cue.speaker}: ` : '';
      const khmerText = cue.khmerSpokenText || '';
      const originalText = cue.originalText
        ? `\n(Original: "${cue.originalText.replace(/^"|"$/g, '').trim()}")`
        : '';
      return `${index + 1}\n${start} --> ${end}\n${speakerPrefix}${khmerText}${originalText}\n`;
    })
    .join('\n');
}

/**
 * Converts messy, single-line, or clumped script text with inline [MM:SS.ms] timestamps
 * into a clean, numbered, properly spaced standard SRT file.
 */
export function convertMessyScriptToSRT(rawText: string): string {
  if (!rawText || !rawText.trim()) return '';

  // If already standard SRT or has arrows, ensure strict sequential numbering and clean double-spaced blocks
  if (/\d{1,2}:\d{2}:\d{2}[,.]\d{1,3}\s*-->\s*\d{1,2}:\d{2}:\d{2}[,.]\d{1,3}/.test(rawText)) {
    const blocks = rawText.replace(/\r\n/g, '\n').trim().split(/\n\s*\n/);
    const validBlocks = blocks.filter((b) => b.includes('-->'));
    if (validBlocks.length > 0) {
      return validBlocks
        .map((b, idx) => {
          const lines = b.split('\n').map((l) => l.trim()).filter((l) => l.length > 0 && !/^\d+$/.test(l));
          const arrowIdx = lines.findIndex((l) => l.includes('-->'));
          if (arrowIdx === -1) return '';
          const [startRaw, endRaw] = lines[arrowIdx].split('-->').map((s) => s.trim());
          const startTime = parseToSrtTime(startRaw);
          const endTime = parseToSrtTime(endRaw);
          const contentLines = lines.slice(arrowIdx + 1);
          return `${idx + 1}\n${startTime} --> ${endTime}\n${contentLines.join('\n')}\n`;
        })
        .filter(Boolean)
        .join('\n');
    }
  }

  // Regex to extract all inline cues: [00:00.864] SPEAKER: Dialogue (Original: "...")
  const cueRegex = /\[(\d{1,2}:?\d{1,2}(?:[:.]\d{1,3})?)\]\s*([^[]+)/g;
  const matches: Array<{ time: string; text: string }> = [];
  let match: RegExpExecArray | null;

  while ((match = cueRegex.exec(rawText)) !== null) {
    const text = match[2].trim();
    if (text) {
      matches.push({
        time: match[1],
        text,
      });
    }
  }

  if (matches.length > 0) {
    return matches
      .map((m, idx) => {
        const startTime = parseToSrtTime(m.time);
        let endTime = '';

        if (idx < matches.length - 1) {
          endTime = parseToSrtTime(matches[idx + 1].time);
        } else {
          const startSec = parseSRTTimeToSeconds(startTime);
          const endSec = startSec + Math.max(3.0, m.text.length * 0.12);
          endTime = parseToSrtTime(endSec);
        }

        // Format clean dialogue text
        let dialogue = m.text;
        // Separate (Original: "...") onto its own subtitle line
        dialogue = dialogue.replace(/\s*\((Original:[^)]+)\)/i, '\n($1)');

        return `${idx + 1}\n${startTime} --> ${endTime}\n${dialogue}\n`;
      })
      .join('\n');
  }

  // Fallback: line-by-line conversion
  const lines = rawText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0 && !/^\d+$/.test(l));
  if (lines.length > 0) {
    return lines
      .map((line, idx) => {
        const startSec = idx * 4.0;
        const endSec = startSec + 3.5;
        return `${idx + 1}\n${parseToSrtTime(startSec)} --> ${parseToSrtTime(endSec)}\n${line}\n`;
      })
      .join('\n');
  }

  return rawText;
}

/**
 * Triggers browser download of a clean UTF-8 SRT file
 */
export function downloadSRTFile(srtContent: string, fileName = 'movie_dialogues_khmer.srt') {
  const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName.endsWith('.srt') ? fileName : `${fileName}.srt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parses standard SRT content into structured dialogue cues
 */
export function parseSRTToCues(srtContent: string): Array<{
  id: string;
  speaker: string;
  startTime: string;
  endTime: string;
  startSeconds: number;
  endSeconds: number;
  originalText: string;
  khmerSpokenText: string;
  phoneticGuide: string;
  emotionTone: string;
  voiceActorGender: 'male' | 'female' | 'narrator';
  cadenceNotes: string;
}> {
  if (!srtContent || !srtContent.trim()) return [];

  // Normalize newlines and split by empty lines between subtitle blocks
  const blocks = srtContent.replace(/\r\n/g, '\n').trim().split(/\n\s*\n/);
  const cues: any[] = [];

  blocks.forEach((block, idx) => {
    const lines = block.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length < 2) return;

    const timeLineIdx = lines.findIndex((l) => l.includes('-->'));
    if (timeLineIdx === -1) return;

    const timeLine = lines[timeLineIdx];
    const [startRaw, endRaw] = timeLine.split('-->').map((s) => s.trim());
    if (!startRaw || !endRaw) return;

    const startSec = parseSRTTimeToSeconds(startRaw);
    const endSec = parseSRTTimeToSeconds(endRaw);

    const textLines = lines.slice(timeLineIdx + 1);
    let speaker = `SPEAKER ${idx + 1}`;
    let khmerText = '';
    let originalText = '';

    textLines.forEach((tl) => {
      // Check for (Original: "...")
      const origMatch = tl.match(/^\((?:Original:\s*)?"?([^"]+)"?\)$/i);
      if (origMatch) {
        originalText = origMatch[1].trim();
        return;
      }

      // Check for SPEAKER: text
      const speakerMatch = tl.match(/^([A-Za-z0-9_ -]+):\s*(.*)$/);
      if (speakerMatch) {
        speaker = speakerMatch[1].trim();
        const rest = speakerMatch[2].trim();
        if (rest) {
          khmerText = khmerText ? `${khmerText} ${rest}` : rest;
        }
      } else {
        khmerText = khmerText ? `${khmerText} ${tl}` : tl;
      }
    });

    cues.push({
      id: `cue-${idx + 1}`,
      speaker,
      startTime: startRaw.replace(/^[0:]*(\d{2}:\d{2}[,.]\d{2,3})$/, '$1'),
      endTime: endRaw.replace(/^[0:]*(\d{2}:\d{2}[,.]\d{2,3})$/, '$1'),
      startSeconds: startSec,
      endSeconds: Math.max(startSec + 1.5, endSec),
      originalText: originalText || khmerText,
      khmerSpokenText: khmerText || originalText,
      phoneticGuide: '',
      emotionTone: 'ធម្មជាតិ (Natural)',
      voiceActorGender: idx % 2 === 0 ? 'male' : 'female',
      cadenceNotes: 'SRT Subtitle Sync',
    });
  });

  return cues;
}
