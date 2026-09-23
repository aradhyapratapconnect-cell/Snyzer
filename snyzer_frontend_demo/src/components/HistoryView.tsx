import { useState } from 'react';
import { HistoryItem, PageRoute, ToneMode } from '../types';
import { Sparkles, ArrowRight, Trash2, Copy, Check, Clock, TrendingUp, AlertTriangle, FileText, ArrowUpRight } from 'lucide-react';

interface HistoryViewProps {
  historyItems: HistoryItem[];
  onSelectForPlayground: (text: string, tone: ToneMode) => void;
  onDeleteItem: (id: string) => void;
  onNavigate: (route: PageRoute) => void;
}

export default function HistoryView({
  historyItems,
  onSelectForPlayground,
  onDeleteItem,
  onNavigate
}: HistoryViewProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedToneFilter, setSelectedToneFilter] = useState<string>('all');

  const filteredItems = selectedToneFilter === 'all'
    ? historyItems
    : historyItems.filter(item => item.tone === selectedToneFilter);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full min-h-[90vh] bg-[#030c14] text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-teal-950/60 border border-teal-500/30 text-teal-300 text-xs font-code mb-3">
              <Clock className="w-3.5 h-3.5" />
              <span>Session Log & Telemetry</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white font-display">
              Revision History
            </h1>
            <p className="text-slate-400 text-sm md:text-base mt-1">
              Browse previous intent-locked revisions, inspect cadence delta benchmarks, and re-open drafts in the editor.
            </p>
          </div>

          {/* Filters and CTA */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-900/90 rounded-xl p-1 border border-slate-800 text-xs">
              {['all', 'Formal', 'Natural', 'Academic'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedToneFilter(filter)}
                  className={`px-3 py-1 rounded-lg transition-colors capitalize ${
                    selectedToneFilter === filter
                      ? 'bg-teal-500/20 text-teal-300 font-semibold border border-teal-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <button
              onClick={() => onNavigate('playground')}
              className="px-4 py-2 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 text-xs font-bold font-code transition-all shadow-[0_0_15px_rgba(45,212,191,0.3)] flex items-center gap-1.5"
            >
              <span>Open Playground</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* History Cards List */}
        {filteredItems.length === 0 ? (
          <div className="p-16 rounded-3xl bg-[#07131e]/50 border border-slate-800 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-teal-950/40 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No history items found</h3>
            <p className="text-slate-400 text-sm max-w-md mb-6">
              You haven't saved any revisions yet. Head to the playground and click the bookmark button on any completed revision to save it here.
            </p>
            <button
              onClick={() => onNavigate('playground')}
              className="px-6 py-2.5 rounded-full bg-teal-400 text-slate-950 text-sm font-semibold hover:bg-teal-300 transition-all"
            >
              Start in Playground
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="p-6 sm:p-8 rounded-2xl bg-[#061520]/80 border border-slate-800 hover:border-teal-500/40 transition-all backdrop-blur-xl shadow-xl group"
              >
                {/* Card Top Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80 mb-5">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    <h3 className="font-bold text-lg text-white font-headline-sm tracking-tight">
                      {item.title}
                    </h3>
                    <span className="text-xs font-code text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {item.timestamp}
                    </span>
                  </div>

                  {/* Telemetry Pills */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="px-2.5 py-1 rounded-lg bg-teal-950/60 border border-teal-500/30 text-teal-300 text-xs font-code flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Cadence: {item.cadenceScore}/100
                    </span>

                    <span className="px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-code flex items-center gap-1 font-semibold">
                      AI: {item.aiDetectedOriginal}% → {item.aiDetectedRevised}%
                    </span>

                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700/60 text-slate-300 text-xs font-code">
                      {item.tone} ({item.intensity})
                    </span>
                  </div>
                </div>

                {/* Dual Previews */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                  {/* Left: Original AI Draft */}
                  <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 text-xs text-slate-400 font-body-sm space-y-2">
                    <div className="flex items-center justify-between font-code text-[11px] text-slate-500 pb-1 border-b border-slate-900">
                      <span className="flex items-center gap-1 text-amber-400/80">
                        <AlertTriangle className="w-3 h-3" /> Original AI Draft
                      </span>
                      <span>{item.wordCount} words</span>
                    </div>
                    <p className="line-clamp-3 leading-relaxed text-slate-400">
                      {item.originalText}
                    </p>
                  </div>

                  {/* Right: Snyzer Revision */}
                  <div className="p-4 rounded-xl bg-teal-950/20 border border-teal-500/25 text-xs text-slate-200 font-body-sm space-y-2">
                    <div className="flex items-center justify-between font-code text-[11px] text-teal-300/80 pb-1 border-b border-teal-900/30">
                      <span className="flex items-center gap-1 text-teal-300">
                        <Sparkles className="w-3 h-3" /> Humanized Snyzer Revision
                      </span>
                      <span className="text-emerald-400 font-code">Verified Intent</span>
                    </div>
                    <p className="line-clamp-3 leading-relaxed text-slate-200 font-editorial text-[13px] sm:text-sm">
                      {item.revisedText}
                    </p>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 text-xs">
                  <div className="text-slate-500 font-code text-[11px]">
                    {item.clichéFlags} cliché structures neutralized
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(item.id, item.revisedText)}
                      className="px-3 py-1.5 rounded-lg bg-teal-950/40 hover:bg-teal-900/60 text-slate-300 hover:text-teal-300 border border-teal-500/20 transition-all flex items-center gap-1.5 font-code"
                    >
                      {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === item.id ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      onClick={() => onSelectForPlayground(item.originalText, item.tone)}
                      className="px-3 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 hover:text-white border border-teal-400/30 transition-all flex items-center gap-1.5 font-code font-semibold"
                    >
                      <span>Re-open in Playground</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/20 transition-colors"
                      title="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
