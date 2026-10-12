import React, { useRef, useState } from 'react';
import {
  FileText,
  Sparkles,
  Clock,
  UserPlus,
  Trash2,
  UploadCloud,
  Wand2,
  Loader2,
  Check,
  ChevronDown,
  Info,
  Layers,
  ArrowRight,
  Download,
  Copy,
  Subtitles,
  FileCode,
} from 'lucide-react';
import { DubbingGenre, DubbingStyle, DialogueCue } from '../types/dubbing';
import { SAMPLE_MOVIES } from '../data/sampleData';
import {
  convertMessyScriptToSRT,
  downloadSRTFile,
  generateSRT,
  parseSRTToCues,
  parseToSrtTime,
} from '../utils/audioSynthesis';

interface ScriptEditorProps {
  scriptText: string;
  setScriptText: (text: string) => void;
  genre: DubbingGenre;
  setGenre: (genre: DubbingGenre) => void;
  dubbingStyle: DubbingStyle;
  setDubbingStyle: (style: DubbingStyle) => void;
  onTranslateToSpokenKhmer: () => void;
  isTranslating: boolean;
  translationProgressText: string;
  currentVideoTimeFormatted: string;
  hasTranslatedDialogues: boolean;
  onSyncCues?: (cues: DialogueCue[]) => void;
  dialogues?: DialogueCue[];
}

export const ScriptEditor: React.FC<ScriptEditorProps> = ({
  scriptText,
  setScriptText,
  genre,
  setGenre,
  dubbingStyle,
  setDubbingStyle,
  onTranslateToSpokenKhmer,
  isTranslating,
  translationProgressText,
  currentVideoTimeFormatted,
  hasTranslatedDialogues,
  onSyncCues,
  dialogues = [],
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [activeStyle, setActiveStyle] = useState<'khmer' | 'dual' | 'original'>('khmer');

  // Check if current text is standard SRT format with timestamp arrows
  const srtCuesMatches = scriptText.match(
    /\d{1,2}:\d{2}:\d{2}[,. ]\d{1,3}\s*-->\s*\d{1,2}:\d{2}:\d{2}[,. ]\d{1,3}/g
  );
  const isSrtFormat = Boolean(srtCuesMatches && srtCuesMatches.length > 0);
  const cueCount = srtCuesMatches ? srtCuesMatches.length : 0;

  // Check if text has inline brackets clumped together
  const isMessyOrClumped =
    !isSrtFormat &&
    (scriptText.includes('[00:') || scriptText.includes('[01:') || scriptText.includes('SPEAKER'));

  // Calculate script metrics
  const lineCount = scriptText.split('\n').filter((l) => l.trim().length > 0).length;
  const wordCount = scriptText.trim() ? scriptText.trim().split(/\s+/).length : 0;
  const estimatedSeconds = Math.round(wordCount * 0.45);

  const handleConvertToCleanSRT = () => {
    const formatted = convertMessyScriptToSRT(scriptText);
    setScriptText(formatted);
    if (onSyncCues) {
      const parsed = parseSRTToCues(formatted);
      if (parsed.length > 0) {
        onSyncCues(parsed);
      }
    }
  };

  const handleDownloadSRT = () => {
    const srtData = isSrtFormat ? scriptText : convertMessyScriptToSRT(scriptText);
    const suffix = activeStyle === 'khmer' ? 'khmer_dub' : activeStyle === 'dual' ? 'dual_sub' : 'original';
    downloadSRTFile(srtData, `movie_subtitles_${suffix}.srt`);
  };

  const handleCopySRT = async () => {
    const srtData = isSrtFormat ? scriptText : convertMessyScriptToSRT(scriptText);
    await navigator.clipboard.writeText(srtData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleFormatSRTStyle = (style: 'dual' | 'khmer' | 'original') => {
    setActiveStyle(style);
    // Use dialogues from memory if available, or parse current SRT
    const sourceCues =
      dialogues && dialogues.length > 0 ? dialogues : parseSRTToCues(scriptText);
    if (!sourceCues || sourceCues.length === 0) return;

    const formatted = sourceCues
      .map((cue, idx) => {
        let content = '';
        const speaker = cue.speaker ? `${cue.speaker}: ` : '';
        if (style === 'dual') {
          const khText = cue.khmerSpokenText || cue.originalText;
          const origText = cue.originalText ? cue.originalText.replace(/^"|"$/g, '').trim() : '';
          content = `${speaker}${khText}${origText ? `\n(Original: "${origText}")` : ''}`;
        } else if (style === 'khmer') {
          content = `${speaker}${cue.khmerSpokenText || cue.originalText}`;
        } else {
          content = `${speaker}${cue.originalText || cue.khmerSpokenText}`;
        }

        const start = cue.startTime.includes('-->') ? cue.startTime : parseToSrtTime(cue.startTime);
        const end = cue.endTime.includes('-->') ? cue.endTime : parseToSrtTime(cue.endTime);
        return `${idx + 1}\n${start} --> ${end}\n${content}\n`;
      })
      .join('\n');

    setScriptText(formatted);
  };

  const handleInsertTimestamp = () => {
    setScriptText(`${scriptText}\n[${currentVideoTimeFormatted}] SPEAKER: `);
  };

  const handleInsertSpeaker = (speakerName: string) => {
    setScriptText(`${scriptText}\n${speakerName.toUpperCase()}: `);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        // Keep pristine SRT format intact!
        if (file.name.endsWith('.srt')) {
          setScriptText(content.trim());
          if (onSyncCues) {
            const parsed = parseSRTToCues(content);
            if (parsed.length > 0) onSyncCues(parsed);
          }
        } else {
          // If txt or screenplay, convert to clean SRT if it contains timestamps
          const converted = convertMessyScriptToSRT(content);
          setScriptText(converted);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col bg-neutral-900/90 rounded-2xl border border-neutral-800 overflow-hidden shadow-xl">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-neutral-950 border-b border-neutral-800 text-xs gap-2">
        <div className="flex items-center gap-2">
          <Subtitles className="w-4 h-4 text-amber-400" />
          <span className="font-mono text-neutral-300 font-semibold tracking-wide uppercase">
            MOVIE SCRIPT &amp; SRT SUBTITLE
          </span>
          <span className="text-neutral-700">|</span>
          <span className="text-neutral-400 font-khmer">អត្ថបទភាពយន្ត និងចំណងជើងរង SRT</span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2.5 text-neutral-400 font-mono text-[11px]">
          {isSrtFormat ? (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
              <Check className="w-3 h-3" />
              <span>{cueCount} SRT Cues</span>
            </span>
          ) : (
            <span>
              <strong className="text-white">{lineCount}</strong> lines
            </span>
          )}
          <span>•</span>
          <span>
            <strong className="text-white">{wordCount}</strong> words
          </span>
          <span>•</span>
          <span>
            Est. <strong className="text-amber-400">~{estimatedSeconds}s</strong>
          </span>
        </div>
      </div>

      {/* Messy Format Banner Alert - One Click Fix */}
      {isMessyOrClumped && (
        <div className="mx-3 mt-3 px-3 py-2 bg-gradient-to-r from-amber-500/15 to-yellow-500/10 border border-amber-500/30 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-amber-200">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Unformatted / single-line script detected. Convert into standard, numbered SRT subtitle format:
            </span>
          </div>
          <button
            type="button"
            onClick={handleConvertToCleanSRT}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow transition cursor-pointer"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Convert to Clean SRT</span>
          </button>
        </div>
      )}

      {/* Script Controls Toolbar */}
      <div className="px-4 py-2 bg-neutral-900/60 border-b border-neutral-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Preset script loader */}
          <select
            onChange={(e) => {
              const selected = SAMPLE_MOVIES.find((m) => m.id === e.target.value);
              if (selected) {
                const asSrt = convertMessyScriptToSRT(selected.sampleScript);
                setScriptText(asSrt);
                setGenre(selected.genre);
              }
            }}
            className="bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-amber-500 cursor-pointer"
            defaultValue=""
          >
            <option value="" disabled>
              Load Preset...
            </option>
            {SAMPLE_MOVIES.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>

          {/* Format as Clean SRT Button */}
          <button
            type="button"
            onClick={handleConvertToCleanSRT}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
              isSrtFormat
                ? 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:text-white hover:border-neutral-600'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
            }`}
            title="Clean up messy inline text into standard numbered SRT subtitle blocks"
          >
            <Wand2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Format as Clean SRT</span>
          </button>

          {/* Download SRT Button */}
          <button
            type="button"
            onClick={handleDownloadSRT}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition cursor-pointer"
            title="Download as standard UTF-8 .srt subtitle file"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Download .SRT</span>
          </button>

          {/* Copy SRT Button */}
          <button
            type="button"
            onClick={handleCopySRT}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition cursor-pointer"
            title="Copy clean SRT to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-neutral-400" />
                <span>Copy SRT</span>
              </>
            )}
          </button>

          {/* Sync Timestamp from Video */}
          <button
            type="button"
            onClick={handleInsertTimestamp}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition"
            title="Insert timestamp from video playhead"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono">[{currentVideoTimeFormatted}]</span>
          </button>

          {/* Import SRT / Text */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition"
            title="Import .srt, .txt or screenplay file"
          >
            <UploadCloud className="w-3.5 h-3.5 text-neutral-400" />
            <span>Import .SRT</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".srt,.txt,.vtt,.sub"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Clear Button */}
        <button
          type="button"
          onClick={() => setScriptText('')}
          className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-neutral-800 transition"
          title="Clear script text box"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* SRT Format Options Bar */}
      <div className="px-4 py-2 bg-neutral-950 border-b border-neutral-800/70 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-neutral-400">
          <Subtitles className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold text-neutral-300">SRT View Mode:</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleFormatSRTStyle('khmer')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeStyle === 'khmer'
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20'
                : 'bg-neutral-800/80 text-neutral-300 hover:text-white hover:bg-neutral-800 border border-neutral-700/80'
            }`}
            title="Clean standard SRT format with Spoken Khmer dialogues"
          >
            <span>🇰🇭 Khmer Dub SRT</span>
          </button>
          <button
            type="button"
            onClick={() => handleFormatSRTStyle('dual')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeStyle === 'dual'
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20'
                : 'bg-neutral-800/80 text-neutral-300 hover:text-white hover:bg-neutral-800 border border-neutral-700/80'
            }`}
            title="Clean standard SRT with Khmer dub + original dialogue line"
          >
            <span>🌐 Dual Subtitles</span>
          </button>
          <button
            type="button"
            onClick={() => handleFormatSRTStyle('original')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeStyle === 'original'
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20'
                : 'bg-neutral-800/80 text-neutral-300 hover:text-white hover:bg-neutral-800 border border-neutral-700/80'
            }`}
            title="Clean standard SRT with original foreign dialogue"
          >
            <span>🎬 Original Dialogues</span>
          </button>
        </div>
      </div>

      {/* SCRIPT / SRT TEXT BOX */}
      <div className="relative p-3 flex-1 min-h-[260px]">
        <textarea
          value={scriptText}
          onChange={(e) => setScriptText(e.target.value)}
          placeholder={`Standard SRT Subtitle format:\n\n1\n00:00:00,864 --> 00:00:04,104\nSPEAKER 1: ជួយផង! ជួយផង!\n(Original: "救救我! 救救我!")\n\n2\n00:00:04,104 --> 00:00:08,574\nSPEAKER 2: មក មក ឲ្យបងជួយ!\n(Original: "我来帮你。")\n\nOr click "Convert to Clean SRT" above to automatically format any dialogue!`}
          rows={11}
          className="w-full h-full p-3.5 bg-neutral-950 rounded-xl border border-neutral-800/80 text-neutral-200 placeholder-neutral-600 font-mono text-xs sm:text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-amber-500 resize-y font-mono-code selection:bg-amber-500/30"
          spellCheck={false}
        />
      </div>

      {/* Dubbing Configuration Toolbar */}
      <div className="px-4 py-2.5 bg-neutral-950/80 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Genre selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400">Genre:</span>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value as DubbingGenre)}
              className="bg-neutral-900 border border-neutral-700 text-neutral-200 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-amber-500"
            >
              <option value="Action Thriller">Action Thriller</option>
              <option value="Drama & Romance">Drama &amp; Romance</option>
              <option value="Sci-Fi / Cyberpunk">Sci-Fi / Cyberpunk</option>
              <option value="Horror & Suspense">Horror &amp; Suspense</option>
              <option value="Comedy">Comedy</option>
              <option value="Historical / Epic">Historical / Epic</option>
            </select>
          </div>

          {/* Dubbing Style */}
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400 font-khmer">ស្ទីលដាប់:</span>
            <select
              value={dubbingStyle}
              onChange={(e) => setDubbingStyle(e.target.value as DubbingStyle)}
              className="bg-neutral-900 border border-neutral-700 text-neutral-200 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-amber-500"
            >
              <option value="theatrical">រឿងខ្នាតធំ (Theatrical Cinema)</option>
              <option value="tv-series">រឿងភាគ (TV Drama Series)</option>
              <option value="anime">គំនូរជីវចល (Anime / High Energy)</option>
              <option value="documentary">ភាពយន្តឯកសារ (Documentary)</option>
            </select>
          </div>
        </div>

        <span className="text-[11px] text-neutral-500 hidden sm:inline font-khmer">
          • ភាសានិយាយភាពយន្តធម្មជាតិ (Colloquial Spoken Khmer SRT)
        </span>
      </div>

      {/* PRIMARY ACTION BUTTON: TRANSLATE INTO SPOKEN KHMER */}
      <div className="p-3 bg-neutral-950 border-t border-neutral-800">
        <button
          onClick={onTranslateToSpokenKhmer}
          disabled={isTranslating || !scriptText.trim()}
          className={`w-full py-3.5 px-6 rounded-xl font-bold flex items-center justify-center gap-3 transition-all duration-200 shadow-xl cursor-pointer ${
            isTranslating
              ? 'bg-amber-600/50 text-amber-200 cursor-wait border border-amber-500/30'
              : !scriptText.trim()
              ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
              : 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-neutral-950 shadow-amber-500/20 hover:shadow-amber-500/30 transform hover:-translate-y-0.5'
          }`}
        >
          {isTranslating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-amber-300" />
              <div className="text-left">
                <div className="text-sm font-bold flex items-center gap-2">
                  <span>Translating Dialogues into Spoken Khmer...</span>
                </div>
                <div className="text-[11px] text-amber-200/80 font-khmer">
                  {translationProgressText || 'កំពុងបកប្រែជាភាសានិយាយភាពយន្ត និងរៀបចំចង្វាក់...'}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="p-1 rounded-lg bg-neutral-950/15">
                <Wand2 className="w-5 h-5 text-neutral-950" />
              </div>
              <div className="text-center sm:text-left">
                <div className="text-sm font-extrabold uppercase tracking-wide flex items-center gap-2">
                  <span>Translate Movie Dialogues into Spoken Khmer</span>
                  <ArrowRight className="w-4 h-4 hidden sm:inline" />
                </div>
                <div className="text-xs font-semibold text-neutral-900/90 font-khmer">
                  បកប្រែជាភាសានិយាយខ្មែរសម្រាប់បញ្ចូលសំឡេងភាពយន្ត (Spoken Khmer Dub)
                </div>
              </div>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
