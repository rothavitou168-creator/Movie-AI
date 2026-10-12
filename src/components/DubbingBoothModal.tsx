import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  Mic,
  MicOff,
  RotateCcw,
  Volume2,
  Radio,
  Clock,
  Sparkles,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { DialogueCue } from '../types/dubbing';

interface DubbingBoothModalProps {
  isOpen: boolean;
  onClose: () => void;
  cues: DialogueCue[];
  activeCue: DialogueCue | null;
  currentTime: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (secs: number) => void;
  onPlayTTS: (cue: DialogueCue) => void;
  videoSrc: string | null;
  isCloningAudioId?: string | null;
  playingTTSId?: string | null;
}

export const DubbingBoothModal: React.FC<DubbingBoothModalProps> = ({
  isOpen,
  onClose,
  cues,
  activeCue,
  currentTime,
  isPlaying,
  onTogglePlay,
  onSeek,
  onPlayTTS,
  videoSrc,
  isCloningAudioId,
  playingTTSId,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (activeCue) {
      const idx = cues.findIndex((c) => c.id === activeCue.id);
      if (idx !== -1) {
        setCurrentIndex(idx);
      }
    }
  }, [activeCue, cues]);

  if (!isOpen) return null;

  const currentDialogue = cues[currentIndex] || activeCue;
  const nextDialogue = cues[currentIndex + 1];

  const handleNext = () => {
    if (currentIndex < cues.length - 1) {
      const next = cues[currentIndex + 1];
      setCurrentIndex(currentIndex + 1);
      onSeek(next.startSeconds);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const prev = cues[currentIndex - 1];
      setCurrentIndex(currentIndex - 1);
      onSeek(prev.startSeconds);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col p-4 sm:p-6 select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-red-950/80 border border-red-800/80 rounded-full">
            <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-wider text-red-200 font-bold">
              DUBBING BOOTH • TELEPROMPTER
            </span>
          </div>
          <span className="text-xs text-neutral-400 font-khmer hidden sm:inline">
            បន្ទប់បញ្ចូលសំឡេងភាពយន្ត (Live Voiceover Actor Booth)
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="font-mono text-xs text-neutral-400">
            Line {currentIndex + 1} of {cues.length}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Studio Booth Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 py-6 overflow-hidden">
        {/* Left: Video Preview Pip */}
        <div className="flex flex-col gap-3">
          <div className="aspect-video bg-neutral-950 rounded-2xl border border-neutral-800 overflow-hidden relative shadow-2xl flex items-center justify-center">
            {videoSrc ? (
              <video
                src={videoSrc}
                className="w-full h-full object-contain pointer-events-none"
              />
            ) : (
              <span className="text-neutral-600 font-mono text-xs">NO VIDEO</span>
            )}
            <div className="absolute top-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[10px] font-mono text-amber-400">
              REFERENCE MONITOR
            </div>
          </div>

          {/* Quick Navigator List */}
          <div className="flex-1 bg-neutral-950 rounded-2xl border border-neutral-800/80 p-3 overflow-y-auto max-h-[300px] space-y-1.5">
            <div className="text-[11px] font-mono uppercase text-neutral-500 mb-2 font-semibold">
              Dialogue Cue Sequence
            </div>
            {cues.map((c, i) => (
              <button
                key={c.id}
                onClick={() => {
                  setCurrentIndex(i);
                  onSeek(c.startSeconds);
                }}
                className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition ${
                  i === currentIndex
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                    : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
                }`}
              >
                <div className="truncate pr-2">
                  <span className="font-mono text-[10px] text-neutral-500 mr-2 font-normal">
                    {c.startTime}
                  </span>
                  <span className="font-bold text-white uppercase text-[11px] mr-1.5">
                    {c.speaker}:
                  </span>
                  <span className="font-khmer">{c.khmerSpokenText}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Center / Right: Huge Teleprompter Display */}
        <div className="lg:col-span-2 flex flex-col justify-between bg-neutral-950/80 rounded-3xl border border-neutral-800/90 p-6 sm:p-10 relative overflow-hidden shadow-2xl">
          {currentDialogue ? (
            <div className="space-y-6 my-auto">
              {/* Speaker & Direction */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-3.5 py-1 rounded-xl bg-amber-500 text-neutral-950 font-extrabold uppercase text-xs tracking-wider">
                  {currentDialogue.speaker}
                </span>

                <span className="px-3 py-1 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 text-xs font-mono">
                  {currentDialogue.startTime} → {currentDialogue.endTime}
                </span>

                {currentDialogue.emotionTone && (
                  <span className="px-3 py-1 rounded-xl bg-red-950/50 text-red-300 border border-red-800/60 text-xs font-khmer">
                    {currentDialogue.emotionTone}
                  </span>
                )}
              </div>

              {/* HUGE SPOKEN KHMER SCRIPT */}
              <div className="py-4">
                <h2 className="font-khmer text-3xl sm:text-4xl md:text-5xl font-black text-amber-300 leading-tight tracking-normal drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
                  {currentDialogue.khmerSpokenText}
                </h2>

                {/* Phonetics */}
                {currentDialogue.phoneticGuide && (
                  <p className="font-mono text-base sm:text-lg text-neutral-300 italic mt-4 tracking-wide">
                    {currentDialogue.phoneticGuide}
                  </p>
                )}

                {/* Original Source */}
                <p className="text-sm text-neutral-400 mt-2 font-mono">
                  &quot;{currentDialogue.originalText}&quot;
                </p>
              </div>

              {/* Next upcoming dialogue preview */}
              {nextDialogue && (
                <div className="pt-6 border-t border-neutral-900 text-neutral-400">
                  <div className="text-[11px] font-mono uppercase text-neutral-400 mb-1 flex items-center gap-1.5 font-semibold">
                    <span>UPCOMING LINE</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                  <p className="font-khmer text-sm text-neutral-400 truncate">
                    <strong className="text-neutral-400 uppercase mr-1">{nextDialogue.speaker}:</strong>
                    {nextDialogue.khmerSpokenText}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center my-auto text-neutral-500">
              No active dialogue line selected
            </div>
          )}

          {/* Bottom Teleprompter Control Deck */}
          <div className="pt-6 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="p-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 text-neutral-200 border border-neutral-800 transition"
                title="Previous line"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={onTogglePlay}
                className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                <span>{isPlaying ? 'Pause' : 'Play Scene'}</span>
              </button>

              <button
                onClick={handleNext}
                disabled={currentIndex >= cues.length - 1}
                className="p-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 text-neutral-200 border border-neutral-800 transition"
                title="Next line"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Mic / TTS Buttons */}
            <div className="flex items-center gap-3">
              {currentDialogue && (
                <button
                  onClick={() => onPlayTTS(currentDialogue)}
                  disabled={isCloningAudioId === currentDialogue.id}
                  className={`px-4 py-3 rounded-2xl border text-xs font-semibold flex items-center gap-2 transition ${
                    isCloningAudioId === currentDialogue.id
                      ? 'bg-amber-500 text-neutral-950 border-amber-400 font-bold animate-pulse'
                      : playingTTSId === currentDialogue.id
                      ? 'bg-emerald-500 text-neutral-950 border-emerald-400 font-bold animate-pulse'
                      : 'bg-neutral-900 hover:bg-neutral-800 text-amber-300 border-neutral-800'
                  }`}
                  title="Listen to Khmer voiceover cloned from movie actor's voice (VoxCPM2)"
                >
                  {isCloningAudioId === currentDialogue.id ? (
                    <>
                      <Sparkles className="w-4 h-4 text-neutral-950 animate-spin" />
                      <span>Cloning Voice (VoxCPM2)...</span>
                    </>
                  ) : playingTTSId === currentDialogue.id ? (
                    <>
                      <Volume2 className="w-4 h-4 text-neutral-950 animate-bounce" />
                      <span>Playing Cloned Dub...</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 text-amber-400" />
                      <span>Listen Voiceover</span>
                      <span className="text-[10px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">VoxCPM2</span>
                    </>
                  )}
                </button>
              )}

              <button
                onClick={() => setIsRecording(!isRecording)}
                className={`px-5 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 transition shadow-lg ${
                  isRecording
                    ? 'bg-red-600 text-white animate-pulse shadow-red-600/30'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700'
                }`}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-red-400" />}
                <span>{isRecording ? 'Stop Recording' : 'Record Actor Take'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
