/**
 * Media helper to extract audio or video base64 for Gemini API multimodal processing
 */

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function encodeWAV(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // RIFF chunk length
  view.setUint32(4, 36 + samples.length * 2, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw PCM)
  view.setUint16(20, 1, true);
  // channel count (1 = mono)
  view.setUint16(22, 1, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * 2, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, 2, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, samples.length * 2, true);

  // write the PCM samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

export async function getVideoOrAudioBase64(
  file: File | null,
  videoSrc: string | null
): Promise<{ base64: string; mimeType: string } | null> {
  // Strategy A: Extract the actual audio track directly from video using AudioContext
  // This extracts pure audio (only ~500KB - 1.5MB WAV) which transfers instantly
  // and Gemini models process in 2-3 seconds without multimodal video decoding timeouts!
  try {
    let arrayBuffer: ArrayBuffer | null = null;
    if (file) {
      // If file is very large (> 40MB), read the first 30MB chunk
      if (file.size > 40 * 1024 * 1024) {
        const slice = file.slice(0, 30 * 1024 * 1024);
        arrayBuffer = await slice.arrayBuffer();
      } else {
        arrayBuffer = await file.arrayBuffer();
      }
    } else if (videoSrc) {
      const resp = await fetch(videoSrc);
      const blob = await resp.blob();
      arrayBuffer = await blob.arrayBuffer();
    }

    if (arrayBuffer && window.AudioContext) {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      try {
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
        if (audioBuffer && audioBuffer.length > 0) {
          // Downsample or extract first channel (mono)
          const channelData = audioBuffer.getChannelData(0);
          const sampleRate = audioBuffer.sampleRate;

          // Downsample to ~16000Hz for high-speed speech recognition
          const targetRate = 16000;
          const ratio = sampleRate / targetRate;
          const newLength = Math.floor(channelData.length / ratio);
          const downsampled = new Float32Array(newLength);
          for (let i = 0; i < newLength; i++) {
            downsampled[i] = channelData[Math.floor(i * ratio)];
          }

          const wavBlob = encodeWAV(downsampled, targetRate);
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const res = reader.result as string;
              const commaIdx = res.indexOf(',');
              const base64 = commaIdx !== -1 ? res.substring(commaIdx + 1) : res;
              resolve({ base64, mimeType: 'audio/wav' });
            };
            reader.onerror = reject;
            reader.readAsDataURL(wavBlob);
          });
        }
      } catch (decodeErr) {
        console.warn('AudioContext decode fallback to video slice:', decodeErr);
      } finally {
        audioCtx.close().catch(() => {});
      }
    }
  } catch (audioExtractErr) {
    console.warn('Audio extraction error, falling back to direct video base64:', audioExtractErr);
  }

  // Strategy B: Fallback to direct video file slice (up to 12MB)
  try {
    if (file) {
      const mimeType = file.type || 'video/mp4';
      const safeBlob = file.size > 12 * 1024 * 1024 ? file.slice(0, 12 * 1024 * 1024, mimeType) : file;

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const commaIndex = result.indexOf(',');
          const base64 = commaIndex !== -1 ? result.substring(commaIndex + 1) : result;
          resolve({ base64, mimeType });
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(safeBlob);
      });
    }

    if (videoSrc) {
      const response = await fetch(videoSrc);
      const blob = await response.blob();
      const mimeType = blob.type || 'video/mp4';
      const safeBlob = blob.size > 12 * 1024 * 1024 ? blob.slice(0, 12 * 1024 * 1024, mimeType) : blob;

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const commaIndex = result.indexOf(',');
          const base64 = commaIndex !== -1 ? result.substring(commaIndex + 1) : result;
          resolve({ base64, mimeType });
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(safeBlob);
      });
    }
  } catch (err) {
    console.warn('Fallback base64 error:', err);
  }

  return null;
}
