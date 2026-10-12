import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { VideoStudio } from './components/VideoStudio';
import { ScriptEditor } from './components/ScriptEditor';
import { DubbingCueList } from './components/DubbingCueList';
import { DubbingBoothModal } from './components/DubbingBoothModal';
import { ExportModal } from './components/ExportModal';
import { DialogueCue, DubbingGenre, DubbingStyle, SampleMovie } from './types/dubbing';
import { SAMPLE_MOVIES, VOICE_ACTORS } from './data/sampleData';
import {
  generateVoxCpmVoiceover,
  generateSRT,
  convertMessyScriptToSRT,
  parseSRTToCues,
} from './utils/audioSynthesis';
import {
  getCharacterReferenceSnippet,
  getAllCharacterReferenceSnippets,
} from './utils/referenceAudio';
import { VoxCpmSettingsModal } from './components/VoxCpmSettingsModal';
import {
  Sparkles,
  Layers,
  ArrowRight,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Mic,
  Film,
} from 'lucide-react';

export default function App() {
  // Video Player State
  const [videoSrc, setVideoSrc] = useState<string | null>(SAMPLE_MOVIES[0].videoUrl);
  const [videoFileName, setVideoFileName] = useState<string>('TearsOfSteel_SciFi_Clip.mp4');
  const [currentVideoFile, setCurrentVideoFile] = useState<File | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(120);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isAudioDucking, setIsAudioDucking] = useState<boolean>(true);
  const [subtitleMode, setSubtitleMode] = useState<'khmer-phonetic' | 'khmer-only' | 'dual' | 'off'>('khmer-phonetic');
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // VoxCPM2 Voice Cloning State (http://127.0.0.1:8000/v1/audio/speech)
  const [voxCpmEndpoint, setVoxCpmEndpoint] = useState<string>('http://127.0.0.1:8000/v1/audio/speech');
  const [voxCpmApiKey, setVoxCpmApiKey] = useState<string>('');
  const [isCloningAudioId, setIsCloningAudioId] = useState<string | null>(null);
  const [isVoxCpmModalOpen, setIsVoxCpmModalOpen] = useState<boolean>(false);

  // Script & Translation State
  const [scriptText, setScriptText] = useState<string>(
    convertMessyScriptToSRT(SAMPLE_MOVIES[0].sampleScript)
  );
  const [genre, setGenre] = useState<DubbingGenre>(SAMPLE_MOVIES[0].genre);
  const [dubbingStyle, setDubbingStyle] = useState<DubbingStyle>('theatrical');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [translationProgress, setTranslationProgress] = useState<string>('');
  const [dialogueCues, setDialogueCues] = useState<DialogueCue[]>([]);
  const [sceneTitle, setSceneTitle] = useState<string>(SAMPLE_MOVIES[0].title);
  const [sceneSummary, setSceneSummary] = useState<string>(SAMPLE_MOVIES[0].description);

  // Audio / TTS state
  const [playingTTSId, setPlayingTTSId] = useState<string | null>(null);
  const currentAudioElementRef = useRef<HTMLAudioElement | null>(null);
  const [recordingCueId, setRecordingCueId] = useState<string | null>(null);

  // Modals & Upload
  const globalFileInputRef = useRef<HTMLInputElement>(null);
  const [activeView, setActiveView] = useState<'studio' | 'split' | 'table'>('studio');
  const [isTeleprompterOpen, setIsTeleprompterOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const handleGlobalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleVideoUpload(file);
      e.target.value = '';
    }
  };

  const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Convert mm:ss.ms to total seconds
  const parseTimeToSeconds = (timeStr: string): number => {
    try {
      const parts = timeStr.trim().split(':');
      if (parts.length === 2) {
        const mins = parseInt(parts[0], 10);
        const secs = parseFloat(parts[1]);
        return mins * 60 + secs;
      }
      if (parts.length === 3) {
        const hrs = parseInt(parts[0], 10);
        const mins = parseInt(parts[1], 10);
        const secs = parseFloat(parts[2]);
        return hrs * 3600 + mins * 60 + secs;
      }
    } catch {
      // fallback
    }
    return 0;
  };

  // Video Time Update & Cue synchronization
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      if (!isNaN(video.duration) && video.duration > 0) {
        setDuration(video.duration);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [videoSrc]);

  // Determine which cue is currently active based on video playback time
  const activeCue = dialogueCues.find(
    (c) => currentTime >= c.startSeconds - 0.2 && currentTime <= c.endSeconds + 0.3
  ) || null;

  // Handle Video Upload (MP4 files)
  const handleVideoUpload = (file: File) => {
    try {
      const objectUrl = URL.createObjectURL(file);
      setCurrentVideoFile(file);
      setVideoSrc(objectUrl);
      setVideoFileName(file.name);
      setCurrentTime(0);
      setIsPlaying(false);
      setDialogueCues([]);
      setScriptText('');
      showNotification(`Video "${file.name}" loaded. Extracting audio track & transcribing with Gemini...`, 'info');

      // Automatically extract dialogue from actual video and populate script text box!
      handleAutoTranscribe(file);
    } catch (err: any) {
      showNotification(`Failed to load MP4 video: ${err.message}`, 'error');
    }
  };

  // Handle Sample Movie Selection
  const handleSelectSampleMovie = (movie: SampleMovie) => {
    setCurrentVideoFile(null);
    setVideoSrc(movie.videoUrl);
    setVideoFileName(`${movie.title.replace(/\s+/g, '_')}.mp4`);
    setScriptText(convertMessyScriptToSRT(movie.sampleScript));
    setGenre(movie.genre);
    setSceneTitle(movie.title);
    setSceneSummary(movie.description);
    setCurrentTime(0);
    setIsPlaying(false);
    showNotification(`Loaded sample: "${movie.title}" in clean SRT format`, 'info');
  };

  // Video Playback Controls
  const handleTogglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch((err) => {
        console.warn('Playback error:', err);
      });
    }
  };

  const handleSeek = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(duration, seconds));
    setCurrentTime(seconds);
  };

  const handleSetPlaybackRate = (rate: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  };

  // Jump video to dialogue line and play
  const handlePlayCue = (cue: DialogueCue) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = cue.startSeconds;
    setCurrentTime(cue.startSeconds);
    videoRef.current.play().catch(() => {});
    setIsPlaying(true);
  };

  // Play Spoken Khmer Voiceover audio cloned via VoxCPM2 using character reference audio snippet
  const handlePlayTTS = async (cue: DialogueCue) => {
    if (playingTTSId || isCloningAudioId) {
      if (currentAudioElementRef.current) {
        currentAudioElementRef.current.pause();
        currentAudioElementRef.current = null;
      }
      window.speechSynthesis?.cancel();
    }

    // Audio ducking: lower video volume if enabled
    const originalVideoVolume = videoRef.current ? videoRef.current.volume : 1;
    if (isAudioDucking && videoRef.current) {
      videoRef.current.volume = 0.15;
    }

    // 1. If we already have the cloned audio generated for this cue, play immediately
    const existingAudio = cue.clonedAudioUrl || cue.audioUrl;
    if (existingAudio) {
      setPlayingTTSId(cue.id);
      try {
        const audio = new Audio(existingAudio);
        currentAudioElementRef.current = audio;
        audio.onended = () => {
          setPlayingTTSId(null);
          if (isAudioDucking && videoRef.current) {
            videoRef.current.volume = originalVideoVolume;
          }
        };
        audio.onerror = () => {
          setPlayingTTSId(null);
          if (isAudioDucking && videoRef.current) {
            videoRef.current.volume = originalVideoVolume;
          }
        };
        await audio.play();
        return;
      } catch (e: any) {
        console.warn('Playback of cached audio failed, re-cloning:', e);
      }
    }

    // 2. Clone character voice via local VoxCPM2 endpoint using reference audio snippet
    setIsCloningAudioId(cue.id);
    showNotification(`Extracting ${cue.speaker}'s movie audio snippet & cloning voice via VoxCPM2...`, 'info');

    try {
      // Step A: Extract actor reference audio snippet from movie video
      const referenceAudio = await getCharacterReferenceSnippet({
        videoFile: currentVideoFile,
        videoUrl: videoSrc || undefined,
        startSeconds: cue.startSeconds,
        endSeconds: cue.endSeconds,
        speaker: cue.speaker,
        gender: cue.voiceActorGender,
      });

      // Step B: Send dialogue line and reference audio snippet to VoxCPM2 voice cloning API
      const result = await generateVoxCpmVoiceover({
        text: cue.khmerSpokenText,
        speaker: cue.speaker,
        originalText: cue.originalText,
        referenceAudio,
        endpoint: voxCpmEndpoint,
        apiKey: voxCpmApiKey,
        startSeconds: cue.startSeconds,
        endSeconds: cue.endSeconds,
        videoUrl: videoSrc || undefined,
      });

      // Step C: Save generated cloned audio on cue
      setDialogueCues((prev) =>
        prev.map((c) =>
          c.id === cue.id
            ? {
                ...c,
                clonedAudioUrl: result.audioData,
                audioUrl: result.audioData,
                referenceAudioUrl: referenceAudio,
              }
            : c
        )
      );

      // Step D: Play the authentic cloned Khmer voice
      const audio = new Audio(result.audioData);
      currentAudioElementRef.current = audio;
      setPlayingTTSId(cue.id);
      setIsCloningAudioId(null);

      audio.onended = () => {
        setPlayingTTSId(null);
        if (isAudioDucking && videoRef.current) {
          videoRef.current.volume = originalVideoVolume;
        }
      };
      audio.onerror = () => {
        setPlayingTTSId(null);
        if (isAudioDucking && videoRef.current) {
          videoRef.current.volume = originalVideoVolume;
        }
      };

      await audio.play();
      showNotification(`Playing ${cue.speaker}'s cloned Khmer voiceover (VoxCPM2)!`, 'success');
    } catch (err: any) {
      console.warn('VoxCPM2 voice cloning error:', err);
      // STRICT REQUIREMENT: DO NOT fall back to browser robotic speech!
      showNotification(
        `VoxCPM2 voice cloning error: ${err.message}. Please verify local VoxCPM2 server is running at ${voxCpmEndpoint}.`,
        'error'
      );
    } finally {
      setIsCloningAudioId(null);
      if (!currentAudioElementRef.current && isAudioDucking && videoRef.current) {
        videoRef.current.volume = originalVideoVolume;
      }
    }
  };

  // Play extracted character reference audio snippet from movie
  const handlePlayReferenceSnippet = async (cue: DialogueCue) => {
    try {
      showNotification(`Extracting ${cue.speaker}'s original movie voice snippet...`, 'info');
      const snippet = await getCharacterReferenceSnippet({
        videoFile: currentVideoFile,
        videoUrl: videoSrc || undefined,
        startSeconds: cue.startSeconds,
        endSeconds: cue.endSeconds,
        speaker: cue.speaker,
        gender: cue.voiceActorGender,
      });
      if (snippet) {
        const audio = new Audio(snippet);
        audio.play().catch(() => {});
        showNotification(`Playing movie actor voice sample for ${cue.speaker}`, 'info');
      }
    } catch (e: any) {
      showNotification(`Could not extract reference snippet: ${e.message}`, 'error');
    }
  };

  // Batch clone all dialogue cues with VoxCPM2
  const handleBatchVoiceover = async () => {
    if (dialogueCues.length === 0) {
      showNotification('No dialogue cues to clone.', 'error');
      return;
    }
    showNotification('Starting batch VoxCPM2 voice cloning for all characters in scene...', 'info');
    let count = 0;
    for (const cue of dialogueCues) {
      if (cue.clonedAudioUrl) continue;
      setIsCloningAudioId(cue.id);
      try {
        const referenceAudio = await getCharacterReferenceSnippet({
          videoFile: currentVideoFile,
          videoUrl: videoSrc || undefined,
          startSeconds: cue.startSeconds,
          endSeconds: cue.endSeconds,
          speaker: cue.speaker,
          gender: cue.voiceActorGender,
        });
        const result = await generateVoxCpmVoiceover({
          text: cue.khmerSpokenText,
          speaker: cue.speaker,
          originalText: cue.originalText,
          referenceAudio,
          endpoint: voxCpmEndpoint,
          apiKey: voxCpmApiKey,
          startSeconds: cue.startSeconds,
          endSeconds: cue.endSeconds,
          videoUrl: videoSrc || undefined,
        });
        setDialogueCues((prev) =>
          prev.map((c) =>
            c.id === cue.id
              ? { ...c, clonedAudioUrl: result.audioData, audioUrl: result.audioData, referenceAudioUrl: referenceAudio }
              : c
          )
        );
        count++;
      } catch (err: any) {
        showNotification(`Batch voiceover stopped: ${err.message}`, 'error');
        break;
      }
    }
    setIsCloningAudioId(null);
    if (count > 0) {
      showNotification(`Successfully cloned ${count} character voiceovers via VoxCPM2!`, 'success');
    }
  };

  // Record Voice Actor Take
  const handleRecordLine = async (cue: DialogueCue) => {
    if (recordingCueId === cue.id) {
      setRecordingCueId(null);
      showNotification('Voice actor take saved!', 'success');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      setRecordingCueId(cue.id);
      showNotification(`Recording take for ${cue.speaker}... (Click again to stop)`, 'info');

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();

      // Automatically auto-stop after dialogue cue duration + 2s buffer
      const durationSeconds = Math.max(3, cue.endSeconds - cue.startSeconds + 1);
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          setRecordingCueId(null);
          showNotification('Voice take recorded!', 'success');
        }
      }, durationSeconds * 1000);
    } catch {
      showNotification('Microphone access unavailable or denied.', 'error');
    }
  };

  // Update a single dialogue cue
  const handleUpdateCue = (updatedCue: DialogueCue) => {
    setDialogueCues((prev) =>
      prev.map((c) => (c.id === updatedCue.id ? updatedCue : c))
    );
    showNotification('Dialogue updated', 'success');
  };

  // TRANSLATE SCRIPT TO SPOKEN KHMER
  const handleTranslateSpecificScript = async (customScript?: string) => {
    const textToTranslate = typeof customScript === 'string' ? customScript : scriptText;
    if (!textToTranslate.trim()) {
      showNotification('Please enter or paste movie script dialogues first.', 'error');
      return;
    }

    setIsTranslating(true);
    setTranslationProgress('Analyzing dialogue emotions and character registers...');

    try {
      setTimeout(() => {
        setTranslationProgress('Translating into authentic colloquial spoken Khmer (ភាសានិយាយភាពយន្ត)...');
      }, 700);

      setTimeout(() => {
        setTranslationProgress('Generating phonetic pronunciation guides and lip-sync cadence...');
      }, 1500);

      const res = await fetch('/api/translate-dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptText: textToTranslate,
          genre,
          dubbingStyle,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned error status ${res.status}`);
      }

      const data = await res.json();
      if (data.dialogues && Array.isArray(data.dialogues)) {
        // Map to DialogueCue
        const mappedCues: DialogueCue[] = data.dialogues.map((d: any, index: number) => {
          const startSec = parseTimeToSeconds(d.startTime);
          let endSec = parseTimeToSeconds(d.endTime);
          if (endSec <= startSec) {
            endSec = startSec + Math.max(2.5, (d.khmerSpokenText || '').length * 0.15);
          }

          return {
            id: d.id || `cue-${index + 1}`,
            speaker: d.speaker || `Speaker ${index + 1}`,
            startTime: d.startTime,
            endTime: d.endTime,
            startSeconds: startSec,
            endSeconds: endSec,
            originalText: d.originalText,
            khmerSpokenText: d.khmerSpokenText,
            phoneticGuide: d.phoneticGuide,
            emotionTone: d.emotionTone,
            voiceActorGender: d.voiceActorGender || (index % 2 === 0 ? 'male' : 'female'),
            cadenceNotes: d.cadenceNotes || 'Cadence synced',
          };
        });

        setDialogueCues(mappedCues);
        if (data.sceneTitle) setSceneTitle(data.sceneTitle);
        if (data.sceneSummary) setSceneSummary(data.sceneSummary);

        // Update the script text box with clean, numbered standard SRT format!
        const cleanSrt =
          data.srtText ||
          (mappedCues.length > 0 ? generateSRT(mappedCues) : '');
        if (cleanSrt) {
          setScriptText(cleanSrt);
        }

        showNotification(
          `Successfully translated ${mappedCues.length} dialogues into clean SRT Spoken Khmer!`,
          'success'
        );
      }
    } catch (err: any) {
      console.error('Translation error:', err);
      showNotification(`Failed to translate dialogue: ${err.message}`, 'error');
    } finally {
      setIsTranslating(false);
      setTranslationProgress('');
    }
  };

  const handleTranslateToSpokenKhmer = () => {
    handleTranslateSpecificScript(scriptText);
  };

  // AI AUTO-TRANSCRIBE & SYNC CUES FROM VIDEO USING GEMINI
  const handleAutoTranscribe = async (targetFileInput?: File | string) => {
    const fileToProcess =
      targetFileInput instanceof File ? targetFileInput : currentVideoFile;
    const fileName =
      typeof targetFileInput === 'string'
        ? targetFileInput
        : fileToProcess?.name || videoFileName;

    setIsTranscribing(true);
    showNotification(`Gemini: Extracting audio track & listening to spoken dialogue...`, 'info');

    try {
      let res: Response;

      if (fileToProcess instanceof File) {
        // Stream the exact binary video file directly - zero base64 memory overhead, supports up to 200MB!
        const queryParams = new URLSearchParams({
          fileName: fileName,
          genre: genre || 'Action Thriller',
          dubbingStyle: dubbingStyle || 'theatrical',
        });
        res = await fetch(`/api/auto-transcribe-video-binary?${queryParams.toString()}`, {
          method: 'POST',
          headers: {
            'Content-Type': fileToProcess.type || 'video/mp4',
          },
          body: fileToProcess,
        });
      } else {
        // Video from sample movie URL or already loaded src
        res = await fetch('/api/auto-transcribe-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoUrl: videoSrc,
            videoFileName: fileName,
            genre,
            dubbingStyle,
          }),
        });
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        showNotification(
          errJson.error || errJson.message || 'Auto-transcription could not complete. You can import or paste your SRT script directly.',
          'info'
        );
        return;
      }

      const data = await res.json();
      if (data.success === false) {
        showNotification(
          data.message || 'Auto-transcription notice: You can import or paste your SRT script directly.',
          'info'
        );
        return;
      }

      let mappedCues: DialogueCue[] = [];
      if (data.dialogues && Array.isArray(data.dialogues) && data.dialogues.length > 0) {
        mappedCues = data.dialogues.map((d: any, index: number) => {
          const startSec = parseTimeToSeconds(d.startTime);
          let endSec = parseTimeToSeconds(d.endTime);
          if (endSec <= startSec) {
            endSec = startSec + Math.max(2.5, (d.khmerSpokenText || '').length * 0.15);
          }

          return {
            id: d.id || `cue-${index + 1}`,
            speaker: d.speaker || `Speaker ${index + 1}`,
            startTime: d.startTime,
            endTime: d.endTime,
            startSeconds: startSec,
            endSeconds: endSec,
            originalText: d.originalText || '',
            khmerSpokenText: d.khmerSpokenText || '',
            phoneticGuide: d.phoneticGuide || '',
            emotionTone: d.emotionTone || 'ធម្មជាតិ (Natural)',
            voiceActorGender: d.voiceActorGender || (index % 2 === 0 ? 'male' : 'female'),
            cadenceNotes: d.cadenceNotes || 'Cadence synced',
          };
        });

        setDialogueCues(mappedCues);
        if (data.sceneTitle) setSceneTitle(data.sceneTitle);
      }

      // Format clean standard SRT for the script box
      const srtFormatted =
        data.srtText ||
        (mappedCues.length > 0
          ? generateSRT(mappedCues)
          : data.scriptText ? convertMessyScriptToSRT(data.scriptText) : '');

      if (srtFormatted) {
        setScriptText(srtFormatted);
      }

      if (mappedCues.length > 0) {
        showNotification(
          `Gemini: Transcribed ${mappedCues.length} dialogues in clean standard SRT format!`,
          'success'
        );
      } else {
        showNotification(
          data.message || 'No spoken dialogue detected in this video audio track.',
          'info'
        );
      }
    } catch (err: any) {
      console.warn('Auto-transcribe notice:', err);
      showNotification(`Auto-transcribe: ${err.message}`, 'info');
    } finally {
      setIsTranscribing(false);
    }
  };

  // Initial auto-translate of sample script on first render
  useEffect(() => {
    if (dialogueCues.length === 0 && scriptText.trim()) {
      handleTranslateToSpokenKhmer();
    }
  }, []);

  const formatTimeMinutes = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce duration-300">
          <div
            className={`px-4 py-2.5 rounded-xl border text-xs font-semibold shadow-2xl flex items-center gap-2 ${
              notification.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-700/80'
                : notification.type === 'error'
                ? 'bg-rose-950/90 text-rose-200 border-rose-700/80'
                : 'bg-neutral-900/90 text-neutral-200 border-neutral-700'
            }`}
          >
            {notification.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
            {notification.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
            {notification.type === 'info' && <Sparkles className="w-4 h-4 text-amber-400" />}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Hidden global video upload input */}
      <input
        ref={globalFileInputRef}
        type="file"
        accept="video/mp4,video/*,.mp4"
        onChange={handleGlobalFileChange}
        className="hidden"
      />

      {/* Studio Header */}
      <Header
        onLoadSample={() => handleSelectSampleMovie(SAMPLE_MOVIES[0])}
        onOpenTeleprompter={() => setIsTeleprompterOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onReset={() => {
          setDialogueCues([]);
          setScriptText('');
          showNotification('Reset workspace.', 'info');
        }}
        onUploadVideo={() => globalFileInputRef.current?.click()}
        onOpenVoxCpmSettings={() => setIsVoxCpmModalOpen(true)}
        totalLines={dialogueCues.length}
        hasVideo={Boolean(videoSrc)}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      {/* Main Studio Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* VIEW MODE: STUDIO (Video on Top/Left, Script + Translated Dubbing Cues) */}
        {activeView === 'studio' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column (Video Studio Player) */}
            <div className="lg:col-span-7 space-y-6">
              <VideoStudio
                videoSrc={videoSrc}
                videoFileName={videoFileName}
                onVideoUpload={handleVideoUpload}
                onSelectSampleMovie={handleSelectSampleMovie}
                onAutoTranscribe={() => handleAutoTranscribe()}
                isTranscribing={isTranscribing}
                dialogueCues={dialogueCues}
                activeCue={activeCue}
                currentTime={currentTime}
                duration={duration}
                isPlaying={isPlaying}
                onSeek={handleSeek}
                onTogglePlay={handleTogglePlay}
                onSetPlaybackRate={handleSetPlaybackRate}
                playbackRate={playbackRate}
                isAudioDucking={isAudioDucking}
                setIsAudioDucking={setIsAudioDucking}
                subtitleMode={subtitleMode}
                setSubtitleMode={setSubtitleMode}
                videoRef={videoRef}
              />

              {/* Script Text Box & Translation Action Component */}
              <ScriptEditor
                scriptText={scriptText}
                setScriptText={setScriptText}
                genre={genre}
                setGenre={setGenre}
                dubbingStyle={dubbingStyle}
                setDubbingStyle={setDubbingStyle}
                onTranslateToSpokenKhmer={handleTranslateToSpokenKhmer}
                isTranslating={isTranslating}
                translationProgressText={translationProgress}
                currentVideoTimeFormatted={formatTimeMinutes(currentTime)}
                hasTranslatedDialogues={dialogueCues.length > 0}
                onSyncCues={(cues) => setDialogueCues(cues)}
                dialogues={dialogueCues}
              />
            </div>

            {/* Right Column: Spoken Khmer Cue Sheet & Line Actions */}
            <div className="lg:col-span-5 space-y-4">
              <DubbingCueList
                cues={dialogueCues}
                activeCue={activeCue}
                onPlayCue={handlePlayCue}
                onPlayTTS={handlePlayTTS}
                playingTTSId={playingTTSId}
                isCloningAudioId={isCloningAudioId}
                onUpdateCue={handleUpdateCue}
                onRecordLine={handleRecordLine}
                recordingCueId={recordingCueId}
                onOpenVoxCpmSettings={() => setIsVoxCpmModalOpen(true)}
                onBatchVoiceover={handleBatchVoiceover}
                onPlayReferenceSnippet={handlePlayReferenceSnippet}
              />
            </div>
          </div>
        )}

        {/* VIEW MODE: SIDE-BY-SIDE (Direct Comparison: Source Script vs Spoken Khmer) */}
        {activeView === 'split' && (
          <div className="space-y-6">
            <div className="bg-neutral-900/80 p-4 rounded-2xl border border-neutral-800 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Side-by-Side Dubbing Comparison</span>
                  <span className="text-amber-400 font-khmer">ការប្រៀបធៀបអត្ថបទដើម និងសំឡេងដាប់ខ្មែរ</span>
                </h3>
                <p className="text-xs text-neutral-400">
                  Direct alignment between foreign source dialogues and adapted colloquial spoken Khmer.
                </p>
              </div>

              <button
                onClick={handleTranslateToSpokenKhmer}
                disabled={isTranslating}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs flex items-center gap-2 transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>Re-Translate into Spoken Khmer</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Script Text Box */}
              <ScriptEditor
                scriptText={scriptText}
                setScriptText={setScriptText}
                genre={genre}
                setGenre={setGenre}
                dubbingStyle={dubbingStyle}
                setDubbingStyle={setDubbingStyle}
                onTranslateToSpokenKhmer={handleTranslateToSpokenKhmer}
                isTranslating={isTranslating}
                translationProgressText={translationProgress}
                currentVideoTimeFormatted={formatTimeMinutes(currentTime)}
                hasTranslatedDialogues={dialogueCues.length > 0}
                onSyncCues={(cues) => setDialogueCues(cues)}
              />

              {/* Right Column: Spoken Khmer Cues */}
              <DubbingCueList
                cues={dialogueCues}
                activeCue={activeCue}
                onPlayCue={handlePlayCue}
                onPlayTTS={handlePlayTTS}
                playingTTSId={playingTTSId}
                isCloningAudioId={isCloningAudioId}
                onUpdateCue={handleUpdateCue}
                onRecordLine={handleRecordLine}
                recordingCueId={recordingCueId}
                onOpenVoxCpmSettings={() => setIsVoxCpmModalOpen(true)}
                onBatchVoiceover={handleBatchVoiceover}
                onPlayReferenceSnippet={handlePlayReferenceSnippet}
              />
            </div>
          </div>
        )}

        {/* VIEW MODE: CUE SHEET (Full Screen Table) */}
        {activeView === 'table' && (
          <div className="space-y-6">
            <DubbingCueList
              cues={dialogueCues}
              activeCue={activeCue}
              onPlayCue={handlePlayCue}
              onPlayTTS={handlePlayTTS}
              playingTTSId={playingTTSId}
              isCloningAudioId={isCloningAudioId}
              onUpdateCue={handleUpdateCue}
              onRecordLine={handleRecordLine}
              recordingCueId={recordingCueId}
              onOpenVoxCpmSettings={() => setIsVoxCpmModalOpen(true)}
              onBatchVoiceover={handleBatchVoiceover}
              onPlayReferenceSnippet={handlePlayReferenceSnippet}
            />
          </div>
        )}
      </main>

      {/* Teleprompter / Dubbing Booth Modal */}
      <DubbingBoothModal
        isOpen={isTeleprompterOpen}
        onClose={() => setIsTeleprompterOpen(false)}
        cues={dialogueCues}
        activeCue={activeCue}
        currentTime={currentTime}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onSeek={handleSeek}
        onPlayTTS={handlePlayTTS}
        videoSrc={videoSrc}
        isCloningAudioId={isCloningAudioId}
        playingTTSId={playingTTSId}
      />

      {/* VoxCPM2 Voice Cloning Setup Modal */}
      <VoxCpmSettingsModal
        isOpen={isVoxCpmModalOpen}
        onClose={() => setIsVoxCpmModalOpen(false)}
        endpoint={voxCpmEndpoint}
        setEndpoint={setVoxCpmEndpoint}
        apiKey={voxCpmApiKey}
        setApiKey={setVoxCpmApiKey}
        dialogueCues={dialogueCues}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        cues={dialogueCues}
        movieTitle={sceneTitle}
      />

      {/* Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950 py-4 px-6 text-xs text-neutral-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 font-mono">
          <div className="flex items-center gap-2">
            <span className="text-amber-500 font-bold">CINEDUB KHMER</span>
            <span>•</span>
            <span className="text-neutral-400 font-khmer">ស្ទូឌីយោបកប្រែបញ្ចូលសំឡេងភាពយន្តខ្មែរអាជីព</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-neutral-400">
            <span>MP4 Video Player</span>
            <span>•</span>
            <span>Spoken Khmer Dialogue Engine</span>
            <span>•</span>
            <span>Phonetic Guide &amp; Subtitle Sync</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
