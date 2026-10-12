import React, { useState } from 'react';
import {
  Play,
  Volume2,
  Mic,
  Copy,
  Check,
  Edit3,
  Clock,
  Sparkles,
  Search,
  Radio,
  FileCheck,
  Save,
  X,
  VolumeX,
} from 'lucide-react';
import { DialogueCue } from '../types/dubbing';

interface DubbingCueListProps {
  cues: DialogueCue[];
  activeCue: DialogueCue | null;
  onPlayCue: (cue: DialogueCue) => void;
  onPlayTTS: (cue: DialogueCue) => void;
  playingTTSId: string | null;
  isCloningAudioId?: string | null;
  onUpdateCue: (updatedCue: DialogueCue) => void;
  onRecordLine: (cue: DialogueCue) => void;
  recordingCueId: string | null;
  onOpenVoxCpmSettings?: () => void;
  onBatchVoiceover?: () => void;
  onPlayReferenceSnippet?: (cue: DialogueCue) => void;
}

export const DubbingCueList: React.FC<DubbingCueListProps> = ({
  cues,
  activeCue,
  onPlayCue,
  onPlayTTS,
  playingTTSId,
  isCloningAudioId,
  onUpdateCue,
  onRecordLine,
  recordingCueId,
  onOpenVoxCpmSettings,
  onBatchVoiceover,
  onPlayReferenceSnippet,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCueId, setEditingCueId] = useState<string | null>(null);
  const [editKhmerText, setEditKhmerText] = useState('');
  const [editPhonetic, setEditPhonetic] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredCues = cues.filter(
    (c) =>
      c.khmerSpokenText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.originalText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.speaker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phoneticGuide.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartEdit = (cue: DialogueCue) => {
    setEditingCueId(cue.id);
    setEditKhmerText(cue.khmerSpokenText);
    setEditPhonetic(cue.phoneticGuide);
  };

  const handleSaveEdit = (cue: DialogueCue) => {
    onUpdateCue({
      ...cue,
      khmerSpokenText: editKhmerText,
      phoneticGuide: editPhonetic,
    });
    setEditingCueId(null);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (cues.length === 0) {
    return (
      <div className="bg-neutral-900/60 rounded-2xl border border-neutral-800 p-8 text-center">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
          <Sparkles className="w-6 h-6" />
        </div>
        <h4 className="text-base font-bold text-white mb-1">
          No Translated Dialogues Yet
        </h4>
        <p className="text-xs text-neutral-400 max-w-md mx-auto font-khmer">
          បញ្ចូលអត្ថបទភាពយន្តក្នុងប្រអប់ខាងលើ ហើយចុចប៊ូតុង &quot;Translate Movie Dialogues into Spoken Khmer&quot; ដើម្បីបកប្រែជាភាសានិយាយភាពយន្ត។
        </p>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900/90 rounded-2xl border border-neutral-800 overflow-hidden shadow-xl flex flex-col">
      {/* Table Header & Search */}
      <div className="p-4 bg-neutral-950 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <h3 className="font-bold text-white text-sm tracking-wide uppercase font-mono">
            SPOKEN KHMER DIALOGUE CUE SHEET
          </h3>
          <span className="text-neutral-700">|</span>
          <span className="text-xs text-neutral-400 font-khmer">
            បញ្ជីសំឡេងដាប់ភាពយន្ត ({cues.length} បន្ទាត់)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* VoxCPM2 Settings Button */}
          {onOpenVoxCpmSettings && (
            <button
              onClick={onOpenVoxCpmSettings}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-700/60 text-xs font-semibold transition"
              title="Configure local VoxCPM2 voice cloning endpoint (http://127.0.0.1:8000/v1/audio/speech)"
            >
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>VoxCPM2 (Port 8000)</span>
            </button>
          )}

          {/* Batch Clone Voiceovers */}
          {onBatchVoiceover && (
            <button
              onClick={onBatchVoiceover}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold transition"
              title="Clone all dialogue lines with VoxCPM2 using movie actor voices"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">Clone All Lines</span>
            </button>
          )}

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="pl-8 pr-3 py-1 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-amber-500 w-32 sm:w-48"
            />
          </div>
        </div>
      </div>

      {/* Cue Items List */}
      <div className="divide-y divide-neutral-800/80 overflow-y-auto max-h-[600px]">
        {filteredCues.map((cue, idx) => {
          const isActive = activeCue?.id === cue.id;
          const isEditing = editingCueId === cue.id;
          const isPlayingAudio = playingTTSId === cue.id;
          const isCloningThisCue = isCloningAudioId === cue.id;
          const isRecording = recordingCueId === cue.id;

          return (
            <div
              key={cue.id}
              className={`p-4 transition-all duration-150 ${
                isActive
                  ? 'bg-amber-950/25 border-l-4 border-l-amber-400 pl-3'
                  : 'hover:bg-neutral-800/40'
              }`}
            >
              {/* Cue Metadata Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-neutral-500 text-[11px] font-semibold">
                    #{idx + 1}
                  </span>

                  {/* Timestamp Badge */}
                  <button
                    onClick={() => onPlayCue(cue)}
                    className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-neutral-700 flex items-center gap-1 transition"
                    title="Click to jump video to this cue"
                  >
                    <Clock className="w-3 h-3 text-neutral-400" />
                    <span>
                      {cue.startTime} → {cue.endTime}
                    </span>
                  </button>

                  {/* Speaker Tag */}
                  <span className="px-2 py-0.5 rounded-md bg-neutral-800/90 text-white font-semibold uppercase text-[11px] border border-neutral-700/60">
                    {cue.speaker}
                  </span>

                  {/* Emotion / Acting Direction Tag */}
                  {cue.emotionTone && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 text-[11px] border border-amber-500/20 font-khmer">
                      {cue.emotionTone}
                    </span>
                  )}
                </div>

                {/* Cadence Notes */}
                {cue.cadenceNotes && (
                  <span className="text-[11px] text-neutral-400 font-mono hidden md:inline">
                    {cue.cadenceNotes}
                  </span>
                )}
              </div>

              {/* Main Dialogue Content */}
              <div className="space-y-1.5 my-2">
                {isEditing ? (
                  <div className="space-y-2 bg-neutral-950 p-3 rounded-xl border border-neutral-700">
                    <div>
                      <label className="text-[10px] text-neutral-400 uppercase font-mono">
                        Spoken Khmer Script (ភាសានិយាយ)
                      </label>
                      <input
                        type="text"
                        value={editKhmerText}
                        onChange={(e) => setEditKhmerText(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-amber-300 font-khmer text-lg font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-400 uppercase font-mono">
                        Phonetic Guide (អក្សរឡាតាំង)
                      </label>
                      <input
                        type="text"
                        value={editPhonetic}
                        onChange={(e) => setEditPhonetic(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-1.5 text-neutral-200 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div className="flex gap-2 justify-end pt-1">
                      <button
                        onClick={() => setEditingCueId(null)}
                        className="px-2.5 py-1 text-xs text-neutral-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(cue)}
                        className="px-3 py-1 bg-amber-500 text-neutral-950 rounded-lg font-semibold text-xs flex items-center gap-1"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Changes</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Primary Spoken Khmer Translation */}
                    <p className="font-khmer text-amber-300 text-lg md:text-xl font-bold leading-relaxed tracking-normal">
                      {cue.khmerSpokenText}
                    </p>

                    {/* Phonetic Pronunciation Guide */}
                    {cue.phoneticGuide && (
                      <p className="text-xs sm:text-sm font-mono text-neutral-400 italic">
                        {cue.phoneticGuide}
                      </p>
                    )}

                    {/* Original Source Dialogue */}
                    <p className="text-xs text-neutral-400 pt-0.5">
                      <span className="text-neutral-500 uppercase text-[10px] mr-1">Orig:</span>
                      &quot;{cue.originalText}&quot;
                    </p>
                  </>
                )}
              </div>

              {/* Action Buttons for this line */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-800/40 text-xs">
                <div className="flex items-center gap-1.5">
                  {/* Play Video at this timestamp */}
                  <button
                    onClick={() => onPlayCue(cue)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition"
                    title="Play video scene from this dialogue"
                  >
                    <Play className="w-3 h-3 text-amber-400 fill-current" />
                    <span>Sync Video</span>
                  </button>

                  {/* Voiceover using VoxCPM2 Reference Audio Voice Cloning */}
                  <button
                    onClick={() => onPlayTTS(cue)}
                    disabled={isCloningThisCue}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition ${
                      isCloningThisCue
                        ? 'bg-amber-500 text-neutral-950 font-bold border-amber-400 animate-pulse'
                        : isPlayingAudio
                        ? 'bg-emerald-500 text-neutral-950 font-bold border-emerald-400 animate-pulse'
                        : cue.clonedAudioUrl || cue.audioUrl
                        ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40'
                        : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
                    }`}
                    title="Voiceover cloned from movie actor's actual voice using VoxCPM2"
                  >
                    {isCloningThisCue ? (
                      <>
                        <Sparkles className="w-3 h-3 text-neutral-950 animate-spin" />
                        <span>Cloning Voice...</span>
                      </>
                    ) : isPlayingAudio ? (
                      <>
                        <Volume2 className="w-3 h-3 text-neutral-950 animate-bounce" />
                        <span>Playing Dub...</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3 h-3 text-amber-400" />
                        <span>Voiceover</span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                          VoxCPM2
                        </span>
                        {(cue.clonedAudioUrl || cue.audioUrl) && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Cloned audio ready" />
                        )}
                      </>
                    )}
                  </button>

                  {/* Play Actor Reference Audio Snippet */}
                  {onPlayReferenceSnippet && (
                    <button
                      onClick={() => onPlayReferenceSnippet(cue)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-cyan-300 border border-neutral-700/80 transition"
                      title="Listen to movie actor reference audio snippet extracted from video"
                    >
                      <Volume2 className="w-3 h-3 text-cyan-400" />
                      <span className="hidden sm:inline">Actor Ref</span>
                    </button>
                  )}

                  {/* Record Voice Actor Take */}
                  <button
                    onClick={() => onRecordLine(cue)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg border transition ${
                      isRecording
                        ? 'bg-red-600 text-white border-red-500 animate-pulse font-semibold'
                        : 'bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-red-400 border-neutral-700'
                    }`}
                    title="Record voice actor take with microphone"
                  >
                    <Mic className="w-3 h-3" />
                    <span>{isRecording ? 'Recording...' : 'Record Take'}</span>
                  </button>
                </div>

                {/* Edit & Copy */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStartEdit(cue)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
                    title="Edit Spoken Khmer text"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleCopy(cue.khmerSpokenText, cue.id)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
                    title="Copy Spoken Khmer"
                  >
                    {copiedId === cue.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
