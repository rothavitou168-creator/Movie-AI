import React, { useState } from 'react';
import {
  X,
  Radio,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Play,
  Volume2,
  Sparkles,
  Server,
  Layers,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { DialogueCue } from '../types/dubbing';
import { getAllCharacterReferenceSnippets } from '../utils/referenceAudio';

interface VoxCpmSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  endpoint: string;
  setEndpoint: (url: string) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  dialogueCues: DialogueCue[];
  onPlayReferenceSnippet?: (speaker: string) => void;
}

export const VoxCpmSettingsModal: React.FC<VoxCpmSettingsModalProps> = ({
  isOpen,
  onClose,
  endpoint,
  setEndpoint,
  apiKey,
  setApiKey,
  dialogueCues,
}) => {
  const [testingStatus, setTestingStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [playingSpeaker, setPlayingSpeaker] = useState<string | null>(null);

  if (!isOpen) return null;

  const characters = Array.from(new Set(dialogueCues.map((c) => c.speaker)));
  const refSnippets = getAllCharacterReferenceSnippets();

  const handleTestConnection = async () => {
    setTestingStatus('testing');
    setStatusMessage('Checking VoxCPM2 API connection...');

    try {
      const res = await fetch(`/api/voxcpm-status?endpoint=${encodeURIComponent(endpoint)}`);
      const data = await res.json();

      if (data.reachable || data.status === 200 || data.status === 401 || data.status === 405) {
        setTestingStatus('success');
        setStatusMessage(`Endpoint reachable at ${endpoint} (Status: ${data.status || 'Ready'})`);
      } else {
        // Also try direct client ping
        try {
          const direct = await fetch(endpoint, { method: 'OPTIONS' }).catch(() => null);
          if (direct) {
            setTestingStatus('success');
            setStatusMessage(`Endpoint reachable from browser at ${endpoint}`);
            return;
          }
        } catch {
          // ignore
        }
        setTestingStatus('failed');
        setStatusMessage(`Could not connect to ${endpoint}. Verify your local VoxCPM2 server is running.`);
      }
    } catch (e: any) {
      setTestingStatus('failed');
      setStatusMessage(`Connection failed: ${e.message}`);
    }
  };

  const handlePlaySnippet = (speaker: string) => {
    const key = speaker.trim().toUpperCase();
    const dataUrl = refSnippets[key];
    if (!dataUrl) return;

    if (playingSpeaker === speaker) {
      setPlayingSpeaker(null);
      return;
    }

    const audio = new Audio(dataUrl);
    setPlayingSpeaker(speaker);
    audio.onended = () => setPlayingSpeaker(null);
    audio.onerror = () => setPlayingSpeaker(null);
    audio.play().catch(() => setPlayingSpeaker(null));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-neutral-900 border border-neutral-700/80 rounded-2xl max-w-2xl w-full p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">VoxCPM2 Voice Cloning Setup</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Reference Audio Cloning
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-khmer">
                កំណត់រចនាសម្ព័ន្ធម៉ាស៊ីនក្លូនសំឡេងតួអង្គភាពយន្ត VoxCPM2 (Local Voice Cloning)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-5 overflow-y-auto pr-1">
          {/* Explanation Box */}
          <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3.5 text-xs text-neutral-300 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-amber-300">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>How Movie Actor Voice Cloning Works</span>
            </div>
            <p className="leading-relaxed text-neutral-300">
              When you click <strong>Voiceover</strong> on any line, the app extracts the movie actor&apos;s actual voice snippet from the video (at the dialogue line&apos;s timestamp) and sends it alongside the Spoken Khmer script to your local <strong>VoxCPM2</strong> model.
            </p>
            <p className="text-[11px] text-neutral-400">
              This replaces robotic browser speech with authentic Cambodian cinema dubbing matching the movie actor&apos;s true vocal timbre, emotion, and register.
            </p>
          </div>

          {/* Endpoint configuration */}
          <div className="space-y-3 bg-neutral-950/70 p-4 rounded-xl border border-neutral-800">
            <div>
              <label className="text-xs font-semibold text-neutral-200 block mb-1">
                VoxCPM2 API Endpoint URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder="http://127.0.0.1:8000/v1/audio/speech"
                  className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <button
                  onClick={handleTestConnection}
                  disabled={testingStatus === 'testing'}
                  className="px-3.5 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingStatus === 'testing' ? 'animate-spin' : ''}`} />
                  <span>Test Connection</span>
                </button>
              </div>
              <p className="text-[11px] text-neutral-500 mt-1 font-mono">
                Standard OpenAI-compatible audio speech endpoint (vLLM-omni, MLX-Audio, FastAPI)
              </p>
            </div>

            {/* Optional API Key */}
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">
                API Key / Bearer Token <span className="text-neutral-500 text-[10px] font-normal">(Optional for local server)</span>
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="voxcpm-local-token or leave empty"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Status indicator */}
            {testingStatus !== 'idle' && (
              <div
                className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                  testingStatus === 'success'
                    ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                    : testingStatus === 'failed'
                    ? 'bg-red-950/40 text-red-300 border border-red-500/30'
                    : 'bg-neutral-900 text-neutral-300 border border-neutral-700'
                }`}
              >
                {testingStatus === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : testingStatus === 'failed' ? (
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                ) : (
                  <RefreshCw className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
                )}
                <span>{statusMessage}</span>
              </div>
            )}
          </div>

          {/* Character Voice Reference Snippets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Extracted Movie Actor Reference Audio Snippets</span>
              </label>
              <span className="text-[11px] text-neutral-400 font-mono">
                {characters.length} characters in scene
              </span>
            </div>

            {characters.length === 0 ? (
              <p className="text-xs text-neutral-500 italic p-3 bg-neutral-950 rounded-xl border border-neutral-800">
                Load or translate a scene to see character voice signatures.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {characters.map((speaker) => {
                  const speakerKey = speaker.trim().toUpperCase();
                  const hasSnippet = !!refSnippets[speakerKey];
                  const cueCount = dialogueCues.filter((c) => c.speaker === speaker).length;

                  return (
                    <div
                      key={speaker}
                      className="flex items-center justify-between p-2.5 bg-neutral-950 rounded-xl border border-neutral-800 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center justify-center font-bold font-mono text-[11px]">
                          {speaker[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-white uppercase">{speaker}</div>
                          <div className="text-[10px] text-neutral-500">
                            {cueCount} lines • {hasSnippet ? 'Movie voice snippet ready' : 'Extracts on first voiceover'}
                          </div>
                        </div>
                      </div>

                      {hasSnippet ? (
                        <button
                          onClick={() => handlePlaySnippet(speaker)}
                          className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-neutral-700 flex items-center gap-1 transition"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>{playingSpeaker === speaker ? 'Playing...' : 'Test Actor Voice'}</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-neutral-500 font-mono">Auto-extracts from film</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
          <div className="text-[11px] text-neutral-500 flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-emerald-400" />
            <span>Port 8000 local voice cloning pipeline configured</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
