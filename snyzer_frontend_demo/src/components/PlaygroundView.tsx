import { useState, useEffect, useRef, useCallback } from 'react';
import { ToneMode, IntensityMode, IntentLockMode, PlaygroundState, HistoryItem } from '../types';
import { SAMPLE_DRAFTS, SampleDraft } from '../data/samples';
import {
  Sparkles,
  Lock,
  Unlock,
  Copy,
  Download,
  RotateCw,
  Bookmark,
  Check,
  ClipboardPaste,
  Trash2,
  AlertTriangle,
  FileText,
  TrendingUp,
  BrainCircuit,
  SearchCheck,
  HelpCircle,
  Eye,
  SlidersHorizontal,
  Keyboard,
  Type
} from 'lucide-react';

interface PlaygroundViewProps {
  onSaveToHistory: (item: HistoryItem) => void;
  initialText?: string;
  initialTone?: ToneMode;
  onOpenShortcuts?: () => void;
}

export default function PlaygroundView({
  onSaveToHistory,
  initialText,
  initialTone = 'Formal',
  onOpenShortcuts
}: PlaygroundViewProps) {
  // Configurable states
  const [tone, setTone] = useState<ToneMode>(initialTone);
  const [intensity, setIntensity] = useState<IntensityMode>('Balanced');
  const [intentLock, setIntentLock] = useState<IntentLockMode>('Locked');

  // Content states
  const [inputText, setInputText] = useState(initialText || '');
  const [activeSampleId, setActiveSampleId] = useState<string | null>(null);
  const [activeViewMode, setActiveViewMode] = useState<'diff' | 'clean'>('diff');
  const [outputFont, setOutputFont] = useState<'bodoni' | 'sans'>('bodoni');

  // Engine processing state
  const [engineState, setEngineState] = useState<PlaygroundState>(inputText ? 'completed' : 'idle');
  const [streamProgress, setStreamProgress] = useState(0);
  const [tokenCount, setTokenCount] = useState(0);
  const [streamedText, setStreamedText] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const streamIntervalRef = useRef<number | null>(null);

  // When initial text changes from History selection
  useEffect(() => {
    if (initialText) {
      setInputText(initialText);
      setEngineState('completed');
    }
  }, [initialText]);

  // Derive current sample or generate revision
  const currentSample: SampleDraft | undefined = SAMPLE_DRAFTS.find(s => s.id === activeSampleId);
  const targetRevision = currentSample
    ? currentSample.humanizedVariants[tone]
    : `Modern practical workflows benefit when language models express clear, direct ideas without unnecessary ornamentation. Looking closer at text generation reveals that sterile repetitive cadence fatigues readers. By adjusting rhythmic sentence variety and keeping core intent locked, humanized prose maintains clarity and impact.`;

  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
  const aiDetectedPercent = wordCount > 0 ? (engineState === 'idle' ? 89 : 89) : 0;

  // Cliché highlights for demo
  const sampleClichés = currentSample?.clichéPhrases || [
    "In today's fast-paced digital landscape",
    "Furthermore, delving into",
    "It goes without saying that"
  ];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleSelectSample = (sample: SampleDraft) => {
    setActiveSampleId(sample.id);
    setInputText(sample.originalText);
    setEngineState('completed');
    setIsSaved(false);
    showToast(`Loaded ${sample.title}`);
  };

  const handleClear = () => {
    setInputText('');
    setActiveSampleId(null);
    setEngineState('idle');
    setStreamProgress(0);
    setStreamedText('');
    setIsSaved(false);
  };

  const handlePasteClipboard = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) {
        setInputText(clip);
        setActiveSampleId(null);
        setEngineState('idle');
        showToast('Pasted from clipboard');
      }
    } catch {
      // Fallback
      handleSelectSample(SAMPLE_DRAFTS[0]);
    }
  };

  // Trigger Humanize & Streaming synthesis simulation
  const handleStartHumanize = () => {
    if (!inputText.trim()) return;

    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
    }

    setEngineState('streaming');
    setStreamProgress(0);
    setTokenCount(0);
    setStreamedText('');
    setIsSaved(false);

    const fullTarget = targetRevision;
    const words = fullTarget.split(' ');
    let currentIdx = 0;
    const totalWords = words.length;

    streamIntervalRef.current = window.setInterval(() => {
      currentIdx += 2;
      const progress = Math.min(Math.round((currentIdx / totalWords) * 100), 98);
      setStreamProgress(progress);
      setTokenCount(Math.round((progress / 100) * 240));

      const partialText = words.slice(0, currentIdx).join(' ');
      setStreamedText(partialText);

      if (currentIdx >= totalWords) {
        if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
        setStreamProgress(100);
        setTokenCount(240);
        setStreamedText(fullTarget);
        setEngineState('completed');
        showToast('Cadence synthesis complete (Cadence: 98/100)');
      }
    }, 90);
  };

  const handleCopyRevision = () => {
    const textToCopy = engineState === 'streaming' ? streamedText : targetRevision;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    showToast('Revision copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportMarkdown = () => {
    const content = `# Snyzer Intent-Locked Revision\nTone: ${tone} | Cadence: 98/100 | Target: 0% AI Detected\n\n## Original AI Draft\n${inputText}\n\n## Humanized Snyzer Revision\n${targetRevision}\n`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `snyzer-revision-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported markdown file');
  };

  const handleSaveToHistory = () => {
    const item: HistoryItem = {
      id: `hist-${Date.now()}`,
      title: currentSample?.title || 'Interactive Writing Session',
      timestamp: 'Just now',
      originalText: inputText,
      revisedText: targetRevision,
      wordCount: wordCount,
      cadenceScore: 98,
      aiDetectedOriginal: 89,
      aiDetectedRevised: 0,
      tone: tone,
      intensity: intensity,
      clichéFlags: sampleClichés.length
    };
    onSaveToHistory(item);
    setIsSaved(true);
    showToast('Saved to Revision History');
  };

  // Cycle intensity
  const cycleIntensity = () => {
    if (intensity === 'Balanced') setIntensity('Expressive');
    else if (intensity === 'Expressive') setIntensity('Mild');
    else setIntensity('Balanced');
  };

  // Cycle Intent
  const toggleIntent = () => {
    if (intentLock === 'Locked') setIntentLock('High');
    else if (intentLock === 'High') setIntentLock('Fluid');
    else setIntentLock('Locked');
  };

  // Keyboard Shortcuts Listener for Playground Power Users
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      // 1. Ctrl + Enter: Trigger AI Revision (Humanize & Polish)
      if (isCmdOrCtrl && e.key === 'Enter') {
        e.preventDefault();
        if (engineState === 'streaming') return;
        if (!inputText.trim()) {
          // If empty, auto-load first sample and synthesize
          const defaultSample = SAMPLE_DRAFTS[0];
          setActiveSampleId(defaultSample.id);
          setInputText(defaultSample.originalText);
          showToast('Loaded sample draft & triggered revision [Ctrl+Enter]');
          setTimeout(() => {
            handleStartHumanize();
          }, 50);
        } else {
          handleStartHumanize();
          showToast('Triggered AI Revision [Ctrl+Enter]');
        }
        return;
      }

      // 2. Ctrl + S: Save Revision to History
      if (isCmdOrCtrl && (e.key === 's' || e.key === 'S') && !e.shiftKey) {
        e.preventDefault();
        if (engineState === 'idle') {
          showToast('Cannot save empty session to history');
        } else {
          handleSaveToHistory();
        }
        return;
      }

      // 3. Ctrl + Shift + C: Copy Revision Text
      if (isCmdOrCtrl && e.shiftKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        if (engineState !== 'idle') {
          handleCopyRevision();
        }
        return;
      }

      // 4. Ctrl + R (when not plain browser reload intent) or Alt + R: Regenerate revision
      if ((e.altKey && (e.key === 'r' || e.key === 'R')) || (isCmdOrCtrl && e.shiftKey && (e.key === 'r' || e.key === 'R'))) {
        e.preventDefault();
        if (engineState !== 'streaming' && inputText.trim()) {
          handleStartHumanize();
          showToast('Regenerating revision [Shortcut]');
        }
        return;
      }

      // 5. Ctrl + K: Open Shortcuts modal / sheet
      if (isCmdOrCtrl && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        onOpenShortcuts?.();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [engineState, inputText, targetRevision, wordCount, tone, intensity, intentLock, currentSample, onOpenShortcuts]);

  return (
    <section className="relative min-h-[92vh] bg-[#030c14] text-white flex flex-col overflow-hidden pb-16 pt-24">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-24 right-6 z-50 px-4 py-2.5 rounded-2xl bg-teal-950/95 border border-teal-400/40 text-teal-200 text-xs font-code shadow-[0_0_25px_rgba(45,212,191,0.35)] flex items-center gap-2 animate-fade-in">
          <Sparkles className="w-4 h-4 text-teal-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Atmospheric Background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#030c14]/95 via-[#030c14]/75 to-[#030c14]/60 pointer-events-none z-0" />
      <div className="absolute top-1/4 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Workspace Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        
        {/* Header Bar of Playground */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-teal-950/60 border border-teal-500/30 text-teal-300 text-xs font-code mb-3 shadow-[0_0_15px_rgba(45,212,191,0.15)]">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
              <span>Interactive Writing Engine v2.4</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white font-display">Playground</h1>
            <p className="text-slate-400 text-sm md:text-base mt-1">
              Live semantic humanization with real-time neural cadence matching and intent locking.
            </p>
          </div>

          {/* Controls Toolbar (Tone, Intensity, Intent) */}
          <div className="flex flex-wrap items-center gap-2.5 bg-[#071520]/80 backdrop-blur-md p-2 rounded-2xl border border-teal-500/20 shadow-xl">
            {/* Tone Selector Pills */}
            <div className="flex items-center bg-slate-900/90 rounded-xl p-1 border border-slate-800">
              {(['Academic', 'Formal', 'Natural'] as ToneMode[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
                    tone === t
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tone === t && <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />}
                  {t}
                </button>
              ))}
            </div>

            <div className="h-5 w-px bg-slate-800 hidden sm:block" />

            {/* Intensity Toggle */}
            <button
              onClick={cycleIntensity}
              className="flex items-center gap-2 px-2.5 py-1 bg-slate-900/60 hover:bg-slate-800/80 rounded-xl border border-slate-800 text-xs transition-colors"
              title="Click to cycle intensity level"
            >
              <span className="text-slate-400">Intensity:</span>
              <span className="text-teal-300 font-semibold font-code">{intensity}</span>
            </button>

            {/* Intent Lock Toggle */}
            <button
              onClick={toggleIntent}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-teal-950/40 hover:bg-teal-900/40 rounded-xl border border-teal-500/30 text-xs text-teal-300 font-code transition-colors"
              title="Click to cycle intent lock tightness"
            >
              {intentLock === 'Locked' ? <Lock className="w-3.5 h-3.5 text-teal-400" /> : <Unlock className="w-3.5 h-3.5 text-teal-400" />}
              <span>Intent: {intentLock}</span>
            </button>

            {/* Keyboard Shortcuts Trigger */}
            {onOpenShortcuts && (
              <button
                onClick={onOpenShortcuts}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/80 hover:bg-teal-950/40 text-slate-400 hover:text-teal-300 rounded-xl border border-slate-800 hover:border-teal-500/30 text-xs font-code transition-all cursor-pointer"
                title="View Keyboard Shortcuts (Ctrl+K)"
              >
                <Keyboard className="w-3.5 h-3.5 text-teal-400" />
                <span className="hidden sm:inline">Shortcuts</span>
                <kbd className="hidden md:inline px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-teal-300 border border-slate-700 font-mono">
                  Ctrl+K
                </kbd>
              </button>
            )}
          </div>
        </div>

        {/* Dual-Column Editor Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch relative">
          
          {/* ========================================================================= */}
          {/* LEFT CARD: Original AI Draft                                              */}
          {/* ========================================================================= */}
          <div className="lg:col-span-6 flex flex-col rounded-2xl bg-[#07131e]/75 backdrop-blur-xl border border-slate-800/90 hover:border-teal-500/30 transition-all shadow-2xl overflow-hidden min-h-[460px] relative group">
            
            {/* Laser scanning beam during scanning/streaming */}
            {engineState === 'streaming' && (
              <div className="absolute inset-x-0 h-10 bg-gradient-to-b from-teal-400/20 via-teal-400/10 to-transparent border-t border-teal-400/60 pointer-events-none z-20 animate-laser" />
            )}

            {/* Card Top Bar */}
            <div className="px-5 py-3.5 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between flex-wrap gap-2 relative z-10">
              <div className="flex items-center gap-2.5">
                <span className={`w-2.5 h-2.5 rounded-full ${wordCount > 0 ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)] animate-pulse' : 'bg-slate-500'}`} />
                <span className="font-semibold text-sm text-slate-200 tracking-wide">Original AI Draft</span>
                <span className="text-xs text-slate-500 font-code">(Input)</span>
              </div>

              <div className="flex items-center gap-2">
                {wordCount > 0 ? (
                  <span className="text-xs font-code px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/25 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {aiDetectedPercent}% AI Detected
                  </span>
                ) : (
                  <span className="text-xs font-code px-2 py-0.5 rounded bg-slate-800/60 text-slate-400 border border-slate-700/50 flex items-center gap-1">
                    <SearchCheck className="w-3.5 h-3.5" />
                    -- AI Detected
                  </span>
                )}
                <span className="text-xs text-slate-400 font-code">{wordCount} words</span>
                {engineState === 'streaming' && (
                  <span className="text-[11px] font-code px-2 py-0.5 rounded bg-teal-900/30 text-teal-300 border border-teal-500/30 hidden sm:inline-flex">
                    Layer 3/4
                  </span>
                )}
              </div>
            </div>

            {/* Editor Content Area */}
            <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between min-h-[300px] relative z-10">
              {wordCount === 0 ? (
                /* Empty Textarea Input Mode */
                <div className="w-full flex-1 relative">
                  <textarea
                    value={inputText}
                    onChange={(e) => {
                      setInputText(e.target.value);
                      if (e.target.value.trim() && engineState === 'idle') {
                        setEngineState('completed');
                      }
                    }}
                    className="w-full h-full min-h-[220px] bg-transparent resize-none border-none outline-none text-slate-200 placeholder-slate-500/80 font-body-md text-sm leading-relaxed tracking-normal focus:ring-0"
                    placeholder="Paste or begin typing AI-generated text here (ChatGPT, Claude, Gemini, etc.)... Snyzer analyzes perplexity, rhythmic burstiness, and repetitive phrase structures in real-time."
                  />
                </div>
              ) : (
                /* Populated text with cliché flags and clickable highlights */
                <div className="text-slate-300 text-sm leading-relaxed font-body-md space-y-3.5 overflow-y-auto max-h-[340px]">
                  {inputText.split('\n\n').map((paragraph, pIdx) => {
                    return (
                      <p key={pIdx}>
                        {paragraph.split(/(In today's fast-paced digital landscape|Furthermore, delving into|It goes without saying that|thrilled to unleash our game-changing|supercharge their workflows|foster collaborative synergies)/g).map((segment, sIdx) => {
                          const isCliché = sampleClichés.some(c => segment.toLowerCase().includes(c.toLowerCase()));
                          if (isCliché) {
                            return (
                              <span
                                key={sIdx}
                                className="bg-amber-400/20 border-b-2 border-amber-400 text-amber-200 px-1 py-0.5 rounded transition shadow-[0_0_10px_rgba(251,191,36,0.2)] cursor-help"
                                title="Synthetically uniform cliché pattern flagged by Cadence Engine"
                              >
                                {segment}
                              </span>
                            );
                          }
                          return <span key={sIdx}>{segment}</span>;
                        })}
                      </p>
                    );
                  })}
                </div>
              )}

              {/* Sample Draft Suggestions */}
              <div className="pt-4 border-t border-slate-800/50 mt-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs text-slate-400 font-code">
                  <BrainCircuit className="w-3.5 h-3.5 text-teal-400" />
                  <span>Try a sample draft:</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {SAMPLE_DRAFTS.map((sample) => (
                    <button
                      key={sample.id}
                      onClick={() => handleSelectSample(sample)}
                      className={`px-2.5 py-1 rounded-lg text-xs border transition-all font-body-sm flex items-center gap-1.5 ${
                        activeSampleId === sample.id
                          ? 'bg-teal-950/80 text-teal-300 border-teal-500/50 shadow-sm'
                          : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-teal-300 border-slate-800 hover:border-teal-500/30'
                      }`}
                    >
                      <FileText className="w-3 h-3 text-teal-400/80" />
                      <span>{sample.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Left Card Bottom Utilities */}
            <div className="px-5 py-3 border-t border-slate-800/80 bg-slate-950/50 flex items-center justify-between text-xs text-slate-400 relative z-10">
              <div className="flex items-center gap-3 font-code text-[11px]">
                {wordCount > 0 ? (
                  <>
                    <span className="text-amber-400/90 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      {sampleClichés.length} Cliché Flags
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-400">Perplexity: Low</span>
                  </>
                ) : (
                  <>
                    <span className="text-slate-400">0 / 2,500 words</span>
                    <span className="text-slate-700">•</span>
                    <span className="text-slate-500">Perplexity: --</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePasteClipboard}
                  className="px-2.5 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 transition-colors flex items-center gap-1 font-medium font-code text-xs"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span>Paste</span>
                </button>
                {wordCount > 0 && (
                  <button
                    onClick={handleClear}
                    className="hover:text-red-400 transition-colors flex items-center gap-1 p-1 text-slate-500"
                    title="Clear input"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT CARD: Snyzer Revision                                               */}
          {/* ========================================================================= */}
          <div
            className={`lg:col-span-6 flex flex-col rounded-2xl bg-[#061520]/85 backdrop-blur-xl border transition-all shadow-2xl overflow-hidden min-h-[460px] relative ${
              engineState === 'streaming'
                ? 'border-teal-400/60 shadow-[0_0_40px_rgba(45,212,191,0.22)] ring-1 ring-teal-400/40'
                : engineState === 'completed'
                ? 'border-teal-500/35 hover:border-teal-400/60 shadow-[0_0_35px_rgba(45,212,191,0.12)] ring-1 ring-teal-500/20'
                : 'border-slate-800/80 hover:border-teal-500/20'
            }`}
          >
            {/* Streaming Active Banner */}
            {engineState === 'streaming' && (
              <>
                <div className="bg-gradient-to-r from-teal-950/90 via-teal-900/60 to-teal-950/90 border-b border-teal-500/30 px-5 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-code text-teal-200">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                    </span>
                    <span>
                      Neural cadence matching in progress • <span className="font-bold text-teal-300">{streamProgress}%</span> complete
                    </span>
                  </div>
                  <span className="text-[11px] font-code text-teal-400 animate-pulse hidden sm:inline">
                    {tokenCount}/240 Tokens
                  </span>
                </div>
                {/* Progress Strip */}
                <div className="w-full bg-slate-900 h-1 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-300 h-full transition-all duration-200 shadow-[0_0_10px_rgba(45,212,191,0.8)]"
                    style={{ width: `${streamProgress}%` }}
                  />
                </div>
              </>
            )}

            {/* Card Top Bar */}
            <div className="px-5 py-3.5 border-b border-teal-500/20 bg-teal-950/30 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    engineState === 'completed'
                      ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                      : engineState === 'streaming'
                      ? 'bg-emerald-400 animate-pulse'
                      : 'bg-teal-500/40'
                  }`}
                />
                <span className="font-semibold text-sm text-teal-100 tracking-wide">Snyzer Revision</span>
                
                {engineState === 'streaming' && (
                  <span className="px-2 py-0.5 rounded-full bg-teal-400/20 text-teal-300 text-[11px] font-code border border-teal-400/40 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
                    Streaming
                  </span>
                )}
                {engineState === 'completed' && (
                  <span className="px-2 py-0.5 rounded-full bg-teal-400/15 text-teal-300 text-[11px] font-code border border-teal-400/30 font-medium">
                    Humanized
                  </span>
                )}
                {engineState === 'idle' && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-800/70 text-slate-400 text-[11px] font-code border border-slate-700/50 font-medium">
                    Idle
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                {/* Font Toggle: Bodoni Moda (Editorial) vs Modern Sans */}
                <button
                  onClick={() => setOutputFont(f => f === 'bodoni' ? 'sans' : 'bodoni')}
                  className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs transition-all cursor-pointer ${
                    outputFont === 'bodoni'
                      ? 'bg-teal-950/70 border-teal-500/40 text-teal-300 shadow-[0_0_10px_rgba(45,212,191,0.2)]'
                      : 'bg-slate-900/80 border-slate-700/60 text-slate-400 hover:text-slate-200'
                  }`}
                  title="Toggle typography: Bodoni Moda Editorial vs Grotesk Sans"
                >
                  <Type className="w-3 h-3 text-teal-400" />
                  <span className={outputFont === 'bodoni' ? 'font-editorial font-bold italic tracking-wide text-xs' : 'font-sans'}>
                    {outputFont === 'bodoni' ? 'Bodoni Moda' : 'Sans'}
                  </span>
                </button>

                {/* Diff / Clean toggle */}
                <div className="flex items-center gap-1 bg-slate-900/80 px-2.5 py-0.5 rounded-full border border-slate-700/60 text-xs">
                  <button
                    onClick={() => setActiveViewMode('diff')}
                    className={`transition-colors cursor-pointer ${activeViewMode === 'diff' ? 'text-teal-300 font-semibold' : 'text-slate-400 hover:text-white'}`}
                  >
                    Diff
                  </button>
                  <span className="text-slate-600">|</span>
                  <button
                    onClick={() => setActiveViewMode('clean')}
                    className={`transition-colors cursor-pointer ${activeViewMode === 'clean' ? 'text-teal-300 font-semibold' : 'text-slate-400 hover:text-white'}`}
                  >
                    Clean
                  </button>
                </div>

                <span className="text-xs font-code px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hidden sm:flex items-center gap-1 font-semibold">
                  <Check className="w-3 h-3" />
                  0% AI Detected
                </span>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between min-h-[300px]">
              {engineState === 'idle' && (
                /* Empty / Ready State matching Image 5 */
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-8">
                  <div className="relative flex items-center justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shadow-[0_0_30px_rgba(45,212,191,0.15)]">
                      <BrainCircuit className="w-8 h-8" />
                    </div>
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-teal-400/80 animate-ping" />
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-teal-400" />
                  </div>

                  <div className="max-w-md space-y-2">
                    <h3 className="font-headline-sm text-lg sm:text-xl font-bold text-white tracking-tight">
                      Ready to Humanize
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Once you input your draft and trigger the engine, your polished, authentic revision with calibrated cadence metrics will appear here.
                    </p>
                  </div>

                  {/* Visual Waveform / Cadence indicator from Image 5 */}
                  <div className="flex items-center gap-1.5 pt-2 opacity-60">
                    <span className="w-1 h-3 bg-teal-500/30 rounded-full animate-pulse" />
                    <span className="w-1 h-6 bg-teal-500/50 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 h-8 bg-teal-400/70 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                    <span className="w-1 h-4 bg-teal-500/50 rounded-full animate-pulse" style={{ animationDelay: '450ms' }} />
                    <span className="w-1 h-6 bg-teal-500/40 rounded-full animate-pulse" style={{ animationDelay: '600ms' }} />
                    <span className="w-1 h-2 bg-teal-500/30 rounded-full animate-pulse" style={{ animationDelay: '750ms' }} />
                  </div>
                </div>
              )}

              {engineState === 'streaming' && (
                /* Streaming State matching Image 3 */
                <div className={`text-slate-100 text-sm sm:text-base leading-relaxed space-y-3.5 max-h-[340px] overflow-y-auto ${
                  outputFont === 'bodoni' ? 'font-editorial text-slate-100 text-[15px] sm:text-[17px] leading-[1.75]' : 'font-body-md'
                }`}>
                  <p className="text-teal-100/95 font-medium whitespace-pre-line">
                    {streamedText}
                    <span className="inline-block w-2 h-4 bg-teal-400 ml-1 translate-y-0.5 shadow-[0_0_8px_rgba(45,212,191,0.9)] animate-cursor" />
                  </p>
                  {/* Faint skeleton shimmer preview of incoming sentence */}
                  <div className="space-y-2 pt-2 opacity-40 animate-pulse">
                    <div className="h-3.5 bg-gradient-to-r from-teal-500/20 via-teal-400/30 to-teal-500/10 rounded w-11/12" />
                    <div className="h-3.5 bg-gradient-to-r from-teal-500/20 via-teal-400/25 to-teal-500/10 rounded w-3/4" />
                  </div>
                </div>
              )}

              {engineState === 'completed' && (
                /* Finished State matching Image 7 */
                <div className={`text-slate-100 text-sm sm:text-base leading-relaxed space-y-3.5 max-h-[340px] overflow-y-auto ${
                  outputFont === 'bodoni' ? 'font-editorial text-slate-100 text-[15px] sm:text-[17px] leading-[1.75]' : 'font-body-md'
                }`}>
                  {targetRevision.split('\n\n').map((para, i) => (
                    <p key={i}>
                      {activeViewMode === 'diff' ? (
                        <>
                          <span className="bg-teal-500/15 text-teal-200 px-1 py-0.5 rounded border-b border-teal-400/40 mr-1">
                            {para.split(' ').slice(0, 6).join(' ')}
                          </span>
                          <span>{para.split(' ').slice(6).join(' ')}</span>
                        </>
                      ) : (
                        para
                      )}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Right Card Bottom Utilities */}
            <div className="px-5 py-3 border-t border-teal-500/20 bg-teal-950/20 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-3 font-code text-[11px]">
                {engineState === 'completed' ? (
                  <>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" /> Cadence: 98/100
                    </span>
                    <span className="text-slate-600 hidden sm:inline">•</span>
                    <span className="text-teal-200/80 hidden sm:inline">Readability: Grade 9 (Clean)</span>
                  </>
                ) : engineState === 'streaming' ? (
                  <>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 animate-pulse" /> Cadence: 94/100 (Calibrating...)
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-slate-500">Cadence: --</span>
                    <span className="text-slate-700">•</span>
                    <span className="text-slate-500">Readability: --</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={handleCopyRevision}
                  disabled={engineState === 'idle'}
                  className={`p-1.5 rounded-lg border transition-all flex items-center gap-1 ${
                    engineState === 'idle'
                      ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                      : 'bg-teal-950/50 hover:bg-teal-900/60 text-slate-300 hover:text-teal-300 border-teal-500/20'
                  }`}
                  title="Copy to clipboard (Ctrl+Shift+C)"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  onClick={handleExportMarkdown}
                  disabled={engineState === 'idle'}
                  className={`p-1.5 rounded-lg border transition-all flex items-center gap-1 ${
                    engineState === 'idle'
                      ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                      : 'bg-teal-950/50 hover:bg-teal-900/60 text-slate-300 hover:text-teal-300 border-teal-500/20'
                  }`}
                  title="Export Markdown file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export</span>
                </button>

                <button
                  onClick={handleStartHumanize}
                  disabled={engineState === 'idle' || engineState === 'streaming'}
                  className={`p-1.5 rounded-lg border transition-all flex items-center gap-1 ${
                    engineState === 'idle' || engineState === 'streaming'
                      ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                      : 'bg-teal-950/50 hover:bg-teal-900/60 text-slate-300 hover:text-teal-300 border-teal-500/20'
                  }`}
                  title="Regenerate revision (Alt+R)"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${engineState === 'streaming' ? 'animate-spin text-teal-400' : ''}`} />
                </button>

                <button
                  onClick={handleSaveToHistory}
                  disabled={engineState === 'idle'}
                  className={`p-1.5 px-2 rounded-lg border transition-all flex items-center gap-1.5 ${
                    isSaved
                      ? 'bg-teal-900/50 text-teal-300 border-teal-400/50 shadow-[0_0_10px_rgba(45,212,191,0.2)]'
                      : engineState === 'idle'
                      ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                      : 'bg-teal-950/50 hover:bg-teal-900/60 text-slate-300 hover:text-teal-300 border-teal-500/20'
                  }`}
                  title={isSaved ? 'Saved to History' : 'Save to History (Ctrl+S)'}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current text-teal-400' : ''}`} />
                  <kbd className="hidden sm:inline font-mono text-[9px] text-teal-300/80 bg-teal-950/80 px-1 rounded border border-teal-500/20">
                    Ctrl+S
                  </kbd>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Center Floating Action Button matching Image 5, 3, 7 */}
        <div className="pt-10 w-full flex flex-col items-center justify-center">
          {engineState === 'idle' ? (
            /* Disabled state from Image 5 */
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-4">
              <button
                onClick={() => handleSelectSample(SAMPLE_DRAFTS[0])}
                className="group bg-slate-800/80 text-slate-400 border border-teal-500/20 hover:border-teal-400/50 hover:text-slate-200 font-bold px-8 py-3.5 rounded-full flex items-center justify-center gap-3 shadow-lg text-base transition-all"
              >
                <Sparkles className="w-5 h-5 text-teal-400/50 group-hover:text-teal-400" />
                <span className="tracking-tight font-semibold">Enter text or choose sample to humanize</span>
              </button>
            </div>
          ) : engineState === 'streaming' ? (
            /* Active streaming state from Image 3 */
            <div className="flex flex-col items-center justify-center gap-3 py-2">
              <div className="relative group">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-300 opacity-75 blur-md animate-pulse" />
                <button
                  disabled
                  className="relative bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-300 text-slate-950 font-bold px-8 py-3.5 rounded-full flex items-center justify-center gap-3 shadow-[0_0_35px_rgba(45,212,191,0.6)] animate-glow-pulse text-base cursor-wait"
                >
                  <RotateCw className="w-5 h-5 animate-spin text-slate-950" />
                  <span className="tracking-tight font-semibold">Synthesizing Natural Flow... ({streamProgress}%)</span>
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs font-code text-teal-300/80 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
                <span>Cadence matching Layer 3 of 4 • Applying human sentence variance</span>
              </div>
            </div>
          ) : (
            /* Ready/Finished Humanize & Polish button from Image 7 */
            <div className="flex flex-col items-center justify-center gap-2 py-4">
              <button
                id="playground-humanize-btn"
                onClick={handleStartHumanize}
                className="group bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-300 text-slate-950 font-bold px-8 py-3.5 rounded-full flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(45,212,191,0.55)] hover:shadow-[0_0_45px_rgba(45,212,191,0.8)] hover:scale-105 active:scale-95 transition-all text-base cursor-pointer"
                title="Trigger AI Revision (Ctrl+Enter)"
              >
                <Sparkles className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                <span className="tracking-tight font-semibold">Humanize & Polish</span>
                <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-950/20 text-slate-900 border border-slate-950/20 ml-1">
                  Ctrl+Enter
                </span>
              </button>
              <span className="text-[11px] font-code text-slate-500 flex items-center gap-1.5">
                <span>Press</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-teal-300 text-[10px] font-mono">
                  Ctrl+Enter
                </kbd>
                <span>to trigger AI revision anytime</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
