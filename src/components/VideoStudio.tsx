import React, { useRef, useState, useEffect } from 'react';
import {
  Upload,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize2,
  Film,
  Sparkles,
  Subtitles,
  Activity,
  Sliders,
  CheckCircle2,
  Radio,
  Loader2,
} from 'lucide-react';
import { DialogueCue, SampleMovie } from '../types/dubbing';
import { SAMPLE_MOVIES } from '../data/sampleData';

interface VideoStudioProps {
  videoSrc: string | null;
  videoFileName: string;
  onVideoUpload: (file: File) => void;
  onSelectSampleMovie: (movie: SampleMovie) => void;
  onAutoTranscribe: () => void;
  isTranscribing: boolean;
  dialogueCues: DialogueCue[];
  activeCue: DialogueCue | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onSeek: (seconds: number) => void;
  onTogglePlay: () => void;
  onSetPlaybackRate: (rate: number) => void;
  playbackRate: number;
  isAudioDucking: boolean;
  setIsAudioDucking: (duck: boolean) => void;
  subtitleMode: 'khmer-phonetic' | 'khmer-only' | 'dual' | 'off';
  setSubtitleMode: (mode: 'khmer-phonetic' | 'khmer-only' | 'dual' | 'off') => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export const VideoStudio: React.FC<VideoStudioProps> = ({
  videoSrc,
  videoFileName,
  onVideoUpload,
  onSelectSampleMovie,
  onAutoTranscribe,
  isTranscribing,
  dialogueCues,
  activeCue,
  currentTime,
  duration,
  isPlaying,
  onSeek,
  onTogglePlay,
  onSetPlaybackRate,
  playbackRate,
  isAudioDucking,
  setIsAudioDucking,
  subtitleMode,
  setSubtitleMode,
  videoRef,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [meterLevel1, setMeterLevel1] = useState(40);
  const [meterLevel2, setMeterLevel2] = useState(45);

  // Animate VU meter when playing
  useEffect(() => {
    if (!isPlaying) {
      setMeterLevel1(10);
      setMeterLevel2(10);
      return;
    }
    const interval = setInterval(() => {
      setMeterLevel1(Math.floor(35 + Math.random() * 55));
      setMeterLevel2(Math.floor(30 + Math.random() * 60));
    }, 120);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onVideoUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.includes('video') || file.name.endsWith('.mp4'))) {
      onVideoUpload(file);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00.0';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${ms}`;
  };

  const handleToggleMute = () => {
    if (!videoRef.current) return;
    const newMute = !isMuted;
    videoRef.current.muted = newMute;
    setIsMuted(newMute);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const handleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  return (
    <div className="flex flex-col bg-neutral-900/90 rounded-2xl border border-neutral-800 overflow-hidden shadow-2xl">
      {/* Studio Monitor Top Header */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-neutral-950 border-b border-neutral-800/80 text-xs gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          <span className="font-mono text-neutral-400 uppercase tracking-wider font-semibold">
            PROGRAM MONITOR
          </span>
          <span className="text-neutral-700">|</span>
          <span className="text-neutral-300 font-mono truncate max-w-[200px]" title={videoFileName}>
            {videoFileName || 'NO_VIDEO_LOADED.MP4'}
          </span>
        </div>

        {/* Audio VU Meters & Ducking status & VISIBLE UPLOAD BUTTON */}
        <div className="flex items-center gap-3">
          {/* Prominent Upload Button in Top Monitor Header */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer"
            title="Upload MP4 video from your computer"
          >
            <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Upload MP4</span>
          </button>

          <div className="hidden sm:flex items-center gap-1.5" title="Stereo Dialogue Levels">
            <Activity className="w-3.5 h-3.5 text-neutral-500" />
            <div className="flex items-center gap-1">
              <div className="w-12 h-2 bg-neutral-800 rounded-sm overflow-hidden flex">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 transition-all duration-75"
                  style={{ width: `${meterLevel1}%` }}
                />
              </div>
              <div className="w-12 h-2 bg-neutral-800 rounded-sm overflow-hidden flex">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 transition-all duration-75"
                  style={{ width: `${meterLevel2}%` }}
                />
              </div>
            </div>
          </div>

          {/* Audio Ducking Toggle */}
          <button
            onClick={() => setIsAudioDucking(!isAudioDucking)}
            className={`px-2 py-0.5 rounded text-[11px] font-mono border transition flex items-center gap-1 ${
              isAudioDucking
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-white'
            }`}
            title="Ducks background video audio so Khmer spoken voiceover is crystal clear"
          >
            <Radio className="w-3 h-3 text-amber-400" />
            <span>DUCKING: {isAudioDucking ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Prominent Video Upload & Active File Strip */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-neutral-900 border-b border-neutral-800 text-xs gap-2">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-amber-400" />
          <span className="text-neutral-400 font-medium">Video File:</span>
          <span
            className="font-mono text-amber-300 bg-neutral-950 px-2.5 py-0.5 rounded-md border border-neutral-800 truncate max-w-[260px] font-semibold"
            title={videoFileName}
          >
            {videoFileName || 'No video selected'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* VIDEO UPLOAD BUTTON */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-neutral-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Upload Video from Computer</span>
          </button>

          {/* AI AUTO-TRANSCRIBE & SYNC CUES BUTTON RIGHT NEXT TO UPLOAD BUTTON */}
          <button
            type="button"
            onClick={onAutoTranscribe}
            disabled={isTranscribing}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-md flex items-center gap-1.5 transition cursor-pointer ${
              isTranscribing
                ? 'bg-purple-900/60 text-purple-200 border border-purple-500/50 cursor-wait'
                : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30 border border-purple-400/40 hover:scale-[1.02]'
            }`}
            title="Automatically extracts dialogue from the video and populates the movie script text box below"
          >
            {isTranscribing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-200" />
                <span>Transcribing Dialogue...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>AI Auto-Transcribe &amp; Sync Cues</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Video Screen Container */}
      <div
        ref={containerRef}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative aspect-video bg-black flex items-center justify-center overflow-hidden group select-none ${
          isDragging ? 'ring-2 ring-amber-500 bg-amber-950/20' : ''
        }`}
      >
        {/* Drag and Drop Active Overlay */}
        {isDragging && (
          <div className="absolute inset-0 bg-amber-950/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 border-2 border-dashed border-amber-400 text-center pointer-events-none">
            <Upload className="w-12 h-12 text-amber-400 animate-bounce mb-2" />
            <div className="text-lg font-bold text-white">Drop MP4 Video File Here</div>
            <div className="text-xs text-amber-200 mt-1">Video will load immediately into the player</div>
          </div>
        )}

        {videoSrc ? (
          <>
            <video
              ref={videoRef as any}
              src={videoSrc}
              className="w-full h-full object-contain cursor-pointer"
              onClick={onTogglePlay}
              playsInline
            />

            {/* Subtitle Overlay (Spoken Khmer + Phonetics) */}
            {subtitleMode !== 'off' && activeCue && (
              <div className="absolute bottom-12 left-0 right-0 px-6 text-center pointer-events-none transition-all duration-200">
                <div className="inline-block max-w-[90%] bg-black/80 backdrop-blur-md px-5 py-3 rounded-xl border border-neutral-700/60 shadow-2xl">
                  {/* Speaker name */}
                  <div className="text-[11px] font-mono tracking-wider uppercase text-amber-400 font-semibold mb-1 flex items-center justify-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>{activeCue.speaker}</span>
                    {activeCue.emotionTone && (
                      <span className="text-neutral-400 font-normal normal-case">
                        • {activeCue.emotionTone}
                      </span>
                    )}
                  </div>

                  {/* Primary Spoken Khmer Translation */}
                  <p className="font-khmer text-xl sm:text-2xl md:text-3xl font-bold text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] leading-relaxed">
                    {activeCue.khmerSpokenText}
                  </p>

                  {/* Secondary Line: Phonetics or Original */}
                  {subtitleMode === 'khmer-phonetic' && activeCue.phoneticGuide && (
                    <p className="text-xs sm:text-sm font-mono text-neutral-300 italic mt-1">
                      {activeCue.phoneticGuide}
                    </p>
                  )}

                  {subtitleMode === 'dual' && activeCue.originalText && (
                    <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                      &quot;{activeCue.originalText}&quot;
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Empty State: Upload Button for MP4 Files */
          <div className="p-8 text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto mb-4 text-amber-400 shadow-inner">
              <Film className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Upload Movie Video (MP4)</h3>
            <p className="text-xs text-neutral-400 mb-6">
              Drag & drop your movie scene MP4 file, or click below to browse from your device.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              {/* PRIMARY MP4 UPLOAD BUTTON */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Upload MP4 Video</span>
              </button>

              {/* AI Auto-Transcribe Button */}
              <button
                onClick={onAutoTranscribe}
                disabled={isTranscribing}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 border border-purple-400/30 transition cursor-pointer"
              >
                {isTranscribing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-purple-200" />
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-300" />
                )}
                <span>AI Auto-Transcribe</span>
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-800/80 text-[11px] text-neutral-500 flex items-center justify-center gap-4">
              <span>Supports .MP4, .WEBM, .MOV</span>
              <span>•</span>
              <span>1080p / 4K Ready</span>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/*,.mp4"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Video Control Bar & Timeline */}
      <div className="bg-neutral-950 p-3 border-t border-neutral-800 space-y-2">
        {/* Timeline Scrubber with Dialogue Cue Markers */}
        <div className="relative group/timeline py-1">
          {/* Cue Markers Overlay */}
          <div className="absolute inset-x-0 top-1 h-2 pointer-events-none z-10">
            {duration > 0 &&
              dialogueCues.map((cue) => {
                const leftPercent = (cue.startSeconds / duration) * 100;
                const widthPercent =
                  (Math.max(1, cue.endSeconds - cue.startSeconds) / duration) * 100;
                return (
                  <div
                    key={cue.id}
                    className="absolute top-0 h-2 bg-amber-400/80 rounded-xs shadow-sm hover:h-3 transition-all"
                    style={{
                      left: `${Math.min(99, leftPercent)}%`,
                      width: `${Math.max(0.6, widthPercent)}%`,
                    }}
                    title={`[${cue.startTime}] ${cue.speaker}: ${cue.khmerSpokenText}`}
                  />
                );
              })}
          </div>

          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500 hover:bg-neutral-700 transition"
          />
        </div>

        {/* Buttons and controls row */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Left Controls: Play, Rewind, Fast Forward, Time Display */}
          <div className="flex items-center gap-2">
            <button
              onClick={onTogglePlay}
              className="w-9 h-9 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20 transition cursor-pointer"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>

            <button
              onClick={() => onSeek(Math.max(0, currentTime - 5))}
              className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition"
              title="Rewind 5s"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onSeek(Math.min(duration, currentTime + 5))}
              className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition"
              title="Forward 5s"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            {/* Timecode display */}
            <div className="font-mono text-neutral-300 bg-neutral-900/90 px-3 py-1.5 rounded-lg border border-neutral-800 flex items-center gap-1.5">
              <span className="text-amber-400 font-semibold">{formatTime(currentTime)}</span>
              <span className="text-neutral-600">/</span>
              <span className="text-neutral-400">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right Controls: Subtitle mode, Speed, Volume, Fullscreen, Change Video */}
          <div className="flex items-center gap-2">
            {/* Subtitle Mode Selector */}
            <div className="flex items-center bg-neutral-900 rounded-lg p-0.5 border border-neutral-800">
              <button
                onClick={() =>
                  setSubtitleMode(
                    subtitleMode === 'khmer-phonetic'
                      ? 'khmer-only'
                      : subtitleMode === 'khmer-only'
                      ? 'dual'
                      : subtitleMode === 'dual'
                      ? 'off'
                      : 'khmer-phonetic'
                  )
                }
                className="px-2.5 py-1 text-neutral-300 hover:text-white flex items-center gap-1"
                title="Toggle Subtitle Style"
              >
                <Subtitles className="w-3.5 h-3.5 text-amber-400" />
                <span className="uppercase text-[11px] font-mono">
                  {subtitleMode === 'khmer-phonetic'
                    ? 'Khmer+Phon'
                    : subtitleMode === 'khmer-only'
                    ? 'Khmer'
                    : subtitleMode === 'dual'
                    ? 'Khmer+Eng'
                    : 'Subs Off'}
                </span>
              </button>
            </div>

            {/* Playback Speed */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 rounded-lg border border-neutral-800 font-mono text-neutral-300 transition"
              >
                {playbackRate}x
              </button>
              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-1 bg-neutral-900 border border-neutral-800 rounded-xl p-1 shadow-xl z-20 flex flex-col gap-1 w-20">
                  {[0.5, 0.75, 1, 1.25, 1.5].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => {
                        onSetPlaybackRate(rate);
                        setShowSpeedMenu(false);
                      }}
                      className={`px-2 py-1 rounded text-left font-mono text-xs ${
                        playbackRate === rate
                          ? 'bg-amber-500 text-neutral-950 font-bold'
                          : 'text-neutral-300 hover:bg-neutral-800'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Volume */}
            <div className="flex items-center gap-1.5 bg-neutral-900 px-2 py-1 rounded-lg border border-neutral-800">
              <button onClick={handleToggleMute} className="text-neutral-400 hover:text-white">
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-3.5 h-3.5 text-red-400" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-14 h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Upload new video button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700/80 hover:border-amber-500/50 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Upload MP4 video from your computer"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400 stroke-[2.5]" />
              <span className="hidden sm:inline">Upload Video</span>
            </button>

            {/* Fullscreen */}
            <button
              onClick={handleFullscreen}
              className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition"
              title="Fullscreen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick sample clips picker drawer */}
        <div className="pt-2 border-t border-neutral-900 flex items-center justify-between text-[11px] text-neutral-400">
          <span className="flex items-center gap-1 text-neutral-400">
            <Film className="w-3 h-3 text-amber-400" />
            <span>Preset Movie Scenes:</span>
          </span>
          <div className="flex items-center gap-2 overflow-x-auto">
            {SAMPLE_MOVIES.map((movie) => (
              <button
                key={movie.id}
                onClick={() => onSelectSampleMovie(movie)}
                className="px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-amber-300 border border-neutral-800 transition truncate max-w-[150px]"
                title={movie.description}
              >
                {movie.title.split(':')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
