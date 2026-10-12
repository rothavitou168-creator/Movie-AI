import React from 'react';
import { Film, Mic, Download, Sparkles, RefreshCw, Radio, Layers, Upload } from 'lucide-react';

interface HeaderProps {
  onLoadSample: () => void;
  onOpenTeleprompter: () => void;
  onOpenExport: () => void;
  onReset: () => void;
  onUploadVideo: () => void;
  onOpenVoxCpmSettings?: () => void;
  totalLines: number;
  hasVideo: boolean;
  activeView: 'studio' | 'split' | 'table';
  setActiveView: (view: 'studio' | 'split' | 'table') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onLoadSample,
  onOpenTeleprompter,
  onOpenExport,
  onReset,
  onUploadVideo,
  onOpenVoxCpmSettings,
  totalLines,
  hasVideo,
  activeView,
  setActiveView,
}) => {
  return (
    <header className="border-b border-neutral-800 bg-neutral-950/90 backdrop-blur sticky top-0 z-30 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-neutral-950 rounded-[10px] flex items-center justify-center">
              <Film className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5 font-outfit">
                <span>CINEDUB</span>
                <span className="text-amber-400 font-khmer-display tracking-wider text-xl">ខ្មែរ</span>
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Spoken Khmer AI
              </span>
            </div>
            <p className="text-xs text-neutral-400 font-khmer">
              ប្រព័ន្ធបញ្ចូលសំឡេងភាពយន្តជាភាសានិយាយខ្មែរ • Movie Dialogue Dubbing Studio
            </p>
          </div>
        </div>

        {/* Status badges */}
        <div className="hidden md:flex items-center gap-2 bg-neutral-900/80 px-3 py-1.5 rounded-lg border border-neutral-800 text-xs">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                hasVideo ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-neutral-600'
              }`}
            />
            <span className="text-neutral-300">
              {hasVideo ? 'MP4 Video Ready' : 'No Video Loaded'}
            </span>
          </div>
          <span className="text-neutral-700">|</span>
          <div className="flex items-center gap-1.5 text-neutral-300">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>
              <strong className="text-amber-400">{totalLines}</strong> Dialogue Cues
            </span>
          </div>
          <span className="text-neutral-700">|</span>
          <div className="flex items-center gap-1 text-amber-400 font-mono text-[11px]">
            <Radio className="w-3 h-3 text-red-500 animate-pulse" />
            <span>LIVE BOOTH</span>
          </div>
        </div>

        {/* View mode & Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Prominent Upload Video Button in Header */}
          <button
            onClick={onUploadVideo}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-neutral-950 font-bold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer"
            title="Upload your own MP4 video file from computer"
          >
            <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Upload Video</span>
          </button>

          {/* View Mode Switcher */}
          <div className="hidden sm:flex bg-neutral-900 p-0.5 rounded-lg border border-neutral-800 text-xs">
            <button
              onClick={() => setActiveView('studio')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeView === 'studio'
                  ? 'bg-amber-500 text-neutral-950 font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Studio
            </button>
            <button
              onClick={() => setActiveView('split')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeView === 'split'
                  ? 'bg-amber-500 text-neutral-950 font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Side-by-Side
            </button>
            <button
              onClick={() => setActiveView('table')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeView === 'table'
                  ? 'bg-amber-500 text-neutral-950 font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Cue Sheet
            </button>
          </div>

          {onOpenVoxCpmSettings && (
            <button
              onClick={onOpenVoxCpmSettings}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-700/60 text-xs font-semibold transition cursor-pointer"
              title="Configure local VoxCPM2 voice cloning endpoint (http://127.0.0.1:8000/v1/audio/speech)"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="hidden md:inline">VoxCPM2 Clone</span>
            </button>
          )}

          <button
            onClick={onLoadSample}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700/80 text-xs font-medium transition"
            title="Load ready-to-test sample video and dialogues"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Sample Project</span>
          </button>

          <button
            onClick={onOpenTeleprompter}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/50 hover:bg-red-900/60 text-red-200 border border-red-800/60 text-xs font-medium transition"
            title="Open Dubbing Booth teleprompter"
          >
            <Mic className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden sm:inline">Dubbing Booth</span>
          </button>

          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-medium transition"
            title="Export subtitles & dubbing cues"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={onReset}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900 transition"
            title="Clear all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
