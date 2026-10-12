import React, { useState } from 'react';
import { X, Download, FileText, Check, Copy, Film, Sparkles } from 'lucide-react';
import { DialogueCue } from '../types/dubbing';
import { generateSRT } from '../utils/audioSynthesis';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  cues: DialogueCue[];
  movieTitle: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  cues,
  movieTitle,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleDownloadSRT = () => {
    const srtContent = generateSRT(cues);
    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${movieTitle.replace(/\s+/g, '_')}_Khmer_Subtitles.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadScript = () => {
    const textLines = cues.map(
      (c) =>
        `[${c.startTime} -> ${c.endTime}] ${c.speaker}: ${c.khmerSpokenText}\nPhonetic: ${c.phoneticGuide}\nOriginal: "${c.originalText}"\nEmotion: ${c.emotionTone}\n`
    );
    const scriptContent = `=== CINEDUB KHMER DUBBING CUE SHEET ===\nProject: ${movieTitle}\nTotal Cues: ${cues.length}\nDate: ${new Date().toLocaleDateString()}\n\n${textLines.join('\n')}`;

    const blob = new Blob([scriptContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${movieTitle.replace(/\s+/g, '_')}_Khmer_Dub_Script.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    const jsonStr = JSON.stringify(
      {
        project: movieTitle,
        exportedAt: new Date().toISOString(),
        cuesCount: cues.length,
        dialogues: cues,
      },
      null,
      2
    );
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${movieTitle.replace(/\s+/g, '_')}_cinedub.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyAllKhmer = () => {
    const allKhmer = cues.map((c) => `${c.speaker}: ${c.khmerSpokenText}`).join('\n');
    navigator.clipboard.writeText(allKhmer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Export Dubbing Package</h3>
            <p className="text-xs text-neutral-400 font-khmer">
              ទាញយកឯកសាររង និងអត្ថបទបញ្ចូលសំឡេងខ្មែរ
            </p>
          </div>
        </div>

        <p className="text-xs text-neutral-300 mb-6 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
          Ready to export <strong>{cues.length}</strong> spoken Khmer dialogues with timecode alignment and phonetic guides.
        </p>

        {/* Export Options Cards */}
        <div className="space-y-3 mb-6">
          <button
            onClick={handleDownloadSRT}
            className="w-full p-3.5 rounded-2xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/40 text-left flex items-center justify-between group transition"
          >
            <div className="flex items-center gap-3">
              <Film className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-sm font-semibold text-white">
                  Khmer Subtitles (.SRT)
                </div>
                <div className="text-xs text-neutral-400">
                  Standard UTF-8 subtitle file for video players &amp; YouTube
                </div>
              </div>
            </div>
            <Download className="w-4 h-4 text-neutral-400 group-hover:text-amber-400 transition" />
          </button>

          <button
            onClick={handleDownloadScript}
            className="w-full p-3.5 rounded-2xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/40 text-left flex items-center justify-between group transition"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-sm font-semibold text-white">
                  Dubbing Script &amp; Cue Sheet (.TXT)
                </div>
                <div className="text-xs text-neutral-400">
                  Complete voice actor screenplay with phonetics &amp; emotion cues
                </div>
              </div>
            </div>
            <Download className="w-4 h-4 text-neutral-400 group-hover:text-amber-400 transition" />
          </button>

          <button
            onClick={handleDownloadJSON}
            className="w-full p-3.5 rounded-2xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/40 text-left flex items-center justify-between group transition"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-sm font-semibold text-white">
                  CINEDUB Project File (.JSON)
                </div>
                <div className="text-xs text-neutral-400">
                  Full structured data including timestamps and voice metadata
                </div>
              </div>
            </div>
            <Download className="w-4 h-4 text-neutral-400 group-hover:text-amber-400 transition" />
          </button>
        </div>

        {/* Quick Clipboard Action */}
        <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
          <button
            onClick={handleCopyAllKhmer}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 font-medium flex items-center gap-2 transition"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Spoken Khmer Text</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
