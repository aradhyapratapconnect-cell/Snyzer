import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, 
  Minus, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Layers, 
  Cpu, 
  Info,
  ChevronRight
} from 'lucide-react';
import { PageRoute } from '../types';

export type StatusType = 'full' | 'partial' | 'none';

export interface CapabilityItem {
  id: string;
  name: string;
  description: string;
  category: 'cadence' | 'intent' | 'quality' | 'enterprise';
  snyzer: {
    status: StatusType;
    label: string;
    detail?: string;
  };
  genericLlm: {
    status: StatusType;
    label: string;
    detail?: string;
  };
  legacyParaphraser: {
    status: StatusType;
    label: string;
    detail?: string;
  };
  grammarTool: {
    status: StatusType;
    label: string;
    detail?: string;
  };
}

export interface CapabilityGroup {
  id: 'cadence' | 'intent' | 'quality' | 'enterprise';
  title: string;
  tagline: string;
  icon: React.ElementType;
}

const GROUPS: CapabilityGroup[] = [
  {
    id: 'cadence',
    title: 'Cadence Engine & Humanization',
    tagline: 'Prosodic variance, rhythm restoration, and authentic human pacing',
    icon: Zap
  },
  {
    id: 'intent',
    title: 'Intent-Lock & Semantic Safeguards',
    tagline: 'Preserving core claims, facts, and quantitative argument structures',
    icon: ShieldCheck
  },
  {
    id: 'quality',
    title: 'Real-Time Diagnostics & Scoring',
    tagline: 'Instant feedback loops, perplexity meters, and detection resilience',
    icon: Cpu
  },
  {
    id: 'enterprise',
    title: 'Privacy, Governance & Control',
    tagline: 'Zero data retention, predictable routing, and multi-model agility',
    icon: Layers
  }
];

const CAPABILITIES: CapabilityItem[] = [
  // Cadence & Humanization
  {
    id: 'burstiness',
    name: 'Dynamic Sentence Burstiness',
    description: 'Alternates punchy clauses with nuanced compound thoughts to mimic authentic human respiratory rhythm.',
    category: 'cadence',
    snyzer: { status: 'full', label: 'Full Variance', detail: 'Algorithmic syllable entropy modeling' },
    genericLlm: { status: 'partial', label: 'Monotonous', detail: 'Tends to uniform 18-24 word sentences' },
    legacyParaphraser: { status: 'none', label: 'Rigid', detail: 'Replaces words in place without restruct' },
    grammarTool: { status: 'none', label: 'Fixed Rules', detail: 'Standardizes rather than varies' }
  },
  {
    id: 'cliche-elim',
    name: '1,400+ Robotic Idiom Purge',
    description: 'Eliminates telltale AI phrases like "delve into", "tapestry of", "testament to", and "beacon of hope".',
    category: 'cadence',
    snyzer: { status: 'full', label: '100% Purged', detail: 'Dedicated idiom blacklist & contextual replacement' },
    genericLlm: { status: 'none', label: 'High Frequency', detail: 'Naturally defaults to cliché token sequences' },
    legacyParaphraser: { status: 'partial', label: 'Inconsistent', detail: 'Often substitutes with awkward synonyms' },
    grammarTool: { status: 'none', label: 'Ignored', detail: 'Does not detect generative clichés' }
  },
  {
    id: 'prosody-entropy',
    name: 'Prosodic Perplexity Calibration',
    description: 'Tunes statistical word-choice perplexity to align with natural cognitive processing patterns.',
    category: 'cadence',
    snyzer: { status: 'full', label: 'Targeted & Balanced', detail: 'Achieves <0.6% synthetic detection footprint' },
    genericLlm: { status: 'partial', label: 'Low Perplexity', detail: 'Predictable word choices trigger AI detectors' },
    legacyParaphraser: { status: 'partial', label: 'Over-Randomized', detail: 'High perplexity but ungrammatical' },
    grammarTool: { status: 'none', label: 'Unsupported', detail: 'No statistical entropy calculation' }
  },
  {
    id: 'voice-retention',
    name: 'Tone & Voice Adaptability',
    description: 'Selectable persona modes (Academic, Executive, Candid, Technical) calibrated for distinct audiences.',
    category: 'cadence',
    snyzer: { status: 'full', label: '4 Calibrated Modes', detail: 'Precision prompt-chained embeddings' },
    genericLlm: { status: 'partial', label: 'Unstable Drift', detail: 'Requires repetitive system prompt coaching' },
    legacyParaphraser: { status: 'none', label: 'Flat Synonyms', detail: 'No persona awareness' },
    grammarTool: { status: 'partial', label: 'Basic Presets', detail: 'Surface level formal/casual slider' }
  },

  // Intent & Accuracy Safeguards
  {
    id: 'intent-lock',
    name: 'Intent-Lock Guarantee (99.4%)',
    description: 'Constructs semantic dependency graphs prior to rewrite to prevent factual drift or claim mutation.',
    category: 'intent',
    snyzer: { status: 'full', label: '99.4% Verified', detail: 'Mathematical claim preservation tensor' },
    genericLlm: { status: 'partial', label: 'Drift Prone', detail: 'Often modifies facts or softens assertive claims' },
    legacyParaphraser: { status: 'partial', label: 'Semantic Distortion', detail: 'Blind thesaurus replacements distort meaning' },
    grammarTool: { status: 'full', label: 'Preserved', detail: 'Edits punctuation and spelling only' }
  },
  {
    id: 'technical-terms',
    name: 'Technical Term & Code Block Shield',
    description: 'Protects programming identifiers, mathematical formulas, and industry acronyms from modification.',
    category: 'intent',
    snyzer: { status: 'full', label: 'Automated Anchor', detail: 'AST recognition and regex pinning' },
    genericLlm: { status: 'partial', label: 'Occasional Edits', detail: 'May rewrite specialized jargon without warning' },
    legacyParaphraser: { status: 'none', label: 'Breaks Jargon', detail: 'Translates domain jargon into common words' },
    grammarTool: { status: 'partial', label: 'Dictionary Flags', detail: 'Marks technical terms as misspellings' }
  },
  {
    id: 'citation-protection',
    name: 'Zero-Hallucination Citations',
    description: 'Ensures parenthetical citations, footnotes, and external URL references are never fabricated or deleted.',
    category: 'intent',
    snyzer: { status: 'full', label: 'Zero Hallucination', detail: 'Referential integrity check pre/post pass' },
    genericLlm: { status: 'none', label: 'Hallucinates', detail: 'Frequently invents author years or sources' },
    legacyParaphraser: { status: 'partial', label: 'Mangling Risk', detail: 'Breaks reference styles like APA/IEEE' },
    grammarTool: { status: 'full', label: 'Untouched', detail: 'Ignores parenthetical text' }
  },

  // Real-Time Quality & Analytics
  {
    id: 'cadence-score',
    name: 'Live 0-100 Cadence Rating',
    description: 'Instant multidimensional rating combining burstiness, lexical diversity, and readability flow.',
    category: 'quality',
    snyzer: { status: 'full', label: 'Real-Time Gauge', detail: 'Visual color-coded telemetry in Playground' },
    genericLlm: { status: 'none', label: 'Unavailable', detail: 'Returns text only with no diagnostic metrics' },
    legacyParaphraser: { status: 'none', label: 'Unavailable', detail: 'No scoring metrics provided' },
    grammarTool: { status: 'partial', label: 'Basic Score', detail: 'Focuses strictly on rule compliance' }
  },
  {
    id: 'detector-resilience',
    name: 'AI Detection Resilience (>98%)',
    description: 'Engineered specifically to avoid watermarks and uniform n-gram patterns flagged by institutional scanners.',
    category: 'quality',
    snyzer: { status: 'full', label: '>98% Organic', detail: 'Tested against Turnitin, GPTZero, CopyLeaks' },
    genericLlm: { status: 'none', label: 'Flagged (85-100%)', detail: 'Heavily flagged as synthetic by modern scanners' },
    legacyParaphraser: { status: 'partial', label: 'Inconsistent (40-70%)', detail: 'Pattern substitutions still leave traces' },
    grammarTool: { status: 'partial', label: 'Neutral', detail: 'Does not alter generative fingerprints' }
  },
  {
    id: 'streaming-feedback',
    name: 'Interactive Streaming Revision',
    description: 'Visual token-by-token transformation letting you watch robotic clauses reshape in real-time.',
    category: 'quality',
    snyzer: { status: 'full', label: 'Active Stream', detail: 'Low-latency SSE streaming with live diffs' },
    genericLlm: { status: 'full', label: 'Raw Token Stream', detail: 'Standard model streaming output' },
    legacyParaphraser: { status: 'none', label: 'Batch Only', detail: 'Spinner delay until complete' },
    grammarTool: { status: 'none', label: 'Underline Batch', detail: 'Static post-hoc suggestions' }
  },

  // Privacy, Governance & Control
  {
    id: 'zero-retention',
    name: 'Zero-Data Retention Policy',
    description: 'Your manuscripts, company memos, and code are never used to train foundation models or public datasets.',
    category: 'enterprise',
    snyzer: { status: 'full', label: 'Zero Training', detail: 'Ephemerally processed in volatile memory' },
    genericLlm: { status: 'partial', label: 'Opt-Out Required', detail: 'Default settings frequently ingest inputs' },
    legacyParaphraser: { status: 'none', label: 'Logs Stored', detail: 'Terms often permit corpus aggregation' },
    grammarTool: { status: 'partial', label: 'Cloud Synced', detail: 'Telemetry retained on remote infrastructure' }
  },
  {
    id: 'history-vault',
    name: 'Local History & Version Vault',
    description: 'Client-side encrypted revision ledger preserving your drafts without mandatory cloud sync.',
    category: 'enterprise',
    snyzer: { status: 'full', label: 'Local Encrypted', detail: 'Instant restore, clear, or copy with one click' },
    genericLlm: { status: 'partial', label: 'Cloud Chat Logs', detail: 'Stored in server account history' },
    legacyParaphraser: { status: 'none', label: 'Single Session', detail: 'History resets on tab refresh' },
    grammarTool: { status: 'full', label: 'Cloud Document Hub', detail: 'Saves documents to proprietary cloud' }
  }
];

interface Comparison8Props {
  onNavigate?: (route: PageRoute) => void;
}

export default function Comparison8({ onNavigate }: Comparison8Props) {
  const [activeTab, setActiveTab] = useState<'all' | 'cadence' | 'intent' | 'quality' | 'enterprise'>('all');
  const [showDetails, setShowDetails] = useState<boolean>(false);

  const filteredGroups = activeTab === 'all' 
    ? GROUPS 
    : GROUPS.filter(g => g.id === activeTab);

  // Status Chip Component
  const StatusChip = ({ status, label, detail, isFeatured }: { status: StatusType; label: string; detail?: string; isFeatured?: boolean }) => {
    let chipStyles = '';
    let Icon = Check;

    if (status === 'full') {
      Icon = Check;
      chipStyles = isFeatured
        ? 'bg-teal-400/20 text-teal-200 border-teal-400/40 shadow-[0_0_12px_rgba(45,212,191,0.25)]'
        : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
    } else if (status === 'partial') {
      Icon = Minus;
      chipStyles = 'bg-amber-500/10 text-amber-300/90 border-amber-500/25';
    } else {
      Icon = Minus;
      chipStyles = 'bg-slate-800/40 text-slate-500 border-slate-700/40';
    }

    return (
      <div className="flex flex-col items-center md:items-start justify-center gap-1">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${chipStyles}`}>
          <Icon className={`w-3.5 h-3.5 ${status === 'full' ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
          <span className="whitespace-nowrap">{label}</span>
        </div>
        {showDetails && detail && (
          <span className="text-[11px] text-slate-400 leading-tight text-center md:text-left mt-0.5 max-w-[170px]">
            {detail}
          </span>
        )}
      </div>
    );
  };

  return (
    <section id="why-choose-snyzer" className="relative w-full py-20 bg-[#030c14] text-white border-t border-slate-800/80 overflow-hidden">
      {/* Subtle background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-teal-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-950/60 border border-teal-500/30 text-teal-300 text-xs font-code mb-4 shadow-[0_0_15px_rgba(45,212,191,0.15)]">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>Why to choose Snyzer</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white font-display mb-4">
            Grouped Capability Matrix
          </h2>

          <p className="text-slate-400 text-sm sm:text-base md:text-lg leading-relaxed">
            Direct benchmark comparing Snyzer Cadence Engine v2.4 against raw generative models, legacy thesaurus paraphrasers, and standard grammar rule checkers.
          </p>
        </div>

        {/* Tab Switcher & Details Toggle Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-[#061420]/80 border border-teal-500/20 rounded-2xl p-2 backdrop-blur-xl">
          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            {[
              { id: 'all', label: 'All Capabilities' },
              { id: 'cadence', label: 'Cadence & Tone' },
              { id: 'intent', label: 'Intent-Lock' },
              { id: 'quality', label: 'Diagnostics' },
              { id: 'enterprise', label: 'Privacy & Control' }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`relative px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer select-none ${
                    isActive
                      ? 'text-slate-950 font-semibold shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabPill"
                      className="absolute inset-0 bg-gradient-to-r from-teal-400 to-emerald-400 rounded-xl -z-10"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Toggle Technical Details */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-code text-teal-300/90 hover:text-teal-200 bg-teal-950/40 hover:bg-teal-900/40 border border-teal-500/30 transition-all cursor-pointer whitespace-nowrap"
          >
            <Info className="w-3.5 h-3.5" />
            <span>{showDetails ? 'Hide Technical Details' : 'Show Technical Details'}</span>
          </button>
        </div>

        {/* Legend / Chip Explainer */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-6 text-xs text-slate-400 mb-6 px-2">
          <span className="font-semibold text-slate-300">Status Chips:</span>
          <div className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.6)]" />
            <span>Supported / Native</span>
          </div>
          <div className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>Partial / Limited</span>
          </div>
          <div className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
            <span>Unsupported / Fails</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MATRIX TABLE CONTAINER (with Sticky Label Rail on Horizontal Scroll)       */}
        {/* ========================================================================= */}
        <div className="relative rounded-2xl border border-teal-500/25 bg-[#05111b]/90 shadow-2xl overflow-hidden backdrop-blur-xl">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-teal-500/30 scrollbar-track-slate-900">
            <table className="w-full text-left border-collapse min-w-[840px] md:min-w-[960px]">
              {/* Table Header */}
              <thead>
                <tr className="border-b border-teal-500/20 bg-[#071724]">
                  {/* Sticky Label Rail Column Header */}
                  <th scope="col" className="sticky left-0 z-30 bg-[#071724] p-5 md:p-6 w-[320px] md:w-[360px] text-xs font-bold uppercase tracking-wider text-slate-400 border-r border-slate-800 shadow-[4px_0_12px_rgba(0,0,0,0.4)]">
                    <div className="flex items-center gap-2">
                      <span className="font-code text-teal-400">01.</span>
                      <span>Capability Matrix</span>
                    </div>
                  </th>

                  {/* Tinted Featured Column Header: Snyzer */}
                  <th scope="col" className="relative p-5 md:p-6 w-[200px] md:w-[230px] bg-gradient-to-b from-teal-950/90 to-teal-900/40 border-x border-teal-500/40 text-white shadow-lg">
                    {/* Featured Badge */}
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-400 text-slate-950 text-[10px] font-bold uppercase tracking-wide mb-2 shadow-[0_0_10px_rgba(45,212,191,0.5)]">
                      <Sparkles className="w-3 h-3" />
                      <span>Featured</span>
                    </div>
                    <div className="text-base md:text-lg font-bold font-headline-sm text-teal-200">
                      Snyzer Cadence v2.4
                    </div>
                    <div className="text-xs text-teal-300/70 mt-0.5">
                      Intent-Locked Engine
                    </div>
                  </th>

                  {/* Competitor 1: Generic LLM */}
                  <th scope="col" className="p-5 md:p-6 w-[170px] md:w-[190px] text-slate-300">
                    <div className="text-sm md:text-base font-bold text-white">
                      Generic LLMs
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Raw GPT-4o / Claude
                    </div>
                  </th>

                  {/* Competitor 2: Legacy Paraphrasers */}
                  <th scope="col" className="p-5 md:p-6 w-[170px] md:w-[190px] text-slate-300">
                    <div className="text-sm md:text-base font-bold text-white">
                      Legacy Spinners
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Thesaurus Paraphrasers
                    </div>
                  </th>

                  {/* Competitor 3: Grammar Checkers */}
                  <th scope="col" className="p-5 md:p-6 w-[170px] md:w-[190px] text-slate-300">
                    <div className="text-sm md:text-base font-bold text-white">
                      Grammar Tools
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Rule-Based Correctors
                    </div>
                  </th>
                </tr>
              </thead>

              {/* Table Body: Grouped Capabilities */}
              <tbody className="divide-y divide-slate-800/60">
                {filteredGroups.map((group) => {
                  const items = CAPABILITIES.filter((c) => c.category === group.id);
                  const GroupIcon = group.icon;

                  return (
                    <React.Fragment key={group.id}>
                      {/* Capability Group Header Banner */}
                      <tr className="bg-[#081b2a]/95 border-t-2 border-teal-500/30">
                        {/* Sticky Header Rail cell */}
                        <td
                          colSpan={5}
                          className="sticky left-0 z-20 py-3.5 px-5 md:px-6 bg-[#081b2a]/95 backdrop-blur-md"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
                              <GroupIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-bold text-sm text-white font-headline-sm">
                                {group.title}
                              </span>
                              <span className="hidden md:inline-block text-xs text-slate-400 ml-3">
                                — {group.tagline}
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* Capability Rows */}
                      {items.map((item, idx) => (
                        <tr 
                          key={item.id} 
                          className="hover:bg-teal-950/20 transition-colors group"
                        >
                          {/* STICKY LABEL RAIL COLUMN (Leftmost) */}
                          <th 
                            scope="row" 
                            className="sticky left-0 z-20 bg-[#061420]/95 group-hover:bg-[#081a29]/95 backdrop-blur-md p-5 md:p-6 border-r border-slate-800 shadow-[4px_0_12px_rgba(0,0,0,0.35)] transition-colors"
                          >
                            <div className="font-semibold text-sm text-white group-hover:text-teal-200 transition-colors">
                              {item.name}
                            </div>
                            <p className="text-xs text-slate-400 mt-1 leading-relaxed font-normal">
                              {item.description}
                            </p>
                          </th>

                          {/* TINTED FEATURED COLUMN: Snyzer */}
                          <td className="p-5 md:p-6 bg-gradient-to-b from-teal-950/40 via-teal-900/20 to-teal-950/40 border-x border-teal-500/30 shadow-inner">
                            <StatusChip 
                              status={item.snyzer.status} 
                              label={item.snyzer.label} 
                              detail={item.snyzer.detail} 
                              isFeatured={true} 
                            />
                          </td>

                          {/* Competitor 1: Generic LLM */}
                          <td className="p-5 md:p-6">
                            <StatusChip 
                              status={item.genericLlm.status} 
                              label={item.genericLlm.label} 
                              detail={item.genericLlm.detail} 
                            />
                          </td>

                          {/* Competitor 2: Legacy Paraphrasers */}
                          <td className="p-5 md:p-6">
                            <StatusChip 
                              status={item.legacyParaphraser.status} 
                              label={item.legacyParaphraser.label} 
                              detail={item.legacyParaphraser.detail} 
                            />
                          </td>

                          {/* Competitor 3: Grammar Checkers */}
                          <td className="p-5 md:p-6">
                            <StatusChip 
                              status={item.grammarTool.status} 
                              label={item.grammarTool.label} 
                              detail={item.grammarTool.detail} 
                            />
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}

                {/* Bottom Summary / Call-to-Action Row */}
                <tr className="bg-[#071622] border-t-2 border-teal-500/30">
                  <td className="sticky left-0 z-20 bg-[#071622] p-5 md:p-6 border-r border-slate-800 shadow-[4px_0_12px_rgba(0,0,0,0.35)]">
                    <div className="font-bold text-sm text-white font-headline-sm">
                      Try Cadence Engine v2.4
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Experience intent-preserved revision live in Playground.
                    </p>
                  </td>

                  {/* Snyzer CTA Column */}
                  <td className="p-5 md:p-6 bg-gradient-to-b from-teal-950/60 to-teal-900/30 border-x border-teal-500/40">
                    <button
                      onClick={() => onNavigate && onNavigate('playground')}
                      className="w-full bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-bold px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-[0_0_18px_rgba(45,212,191,0.4)] hover:shadow-[0_0_24px_rgba(45,212,191,0.6)] text-xs transition-all cursor-pointer hover:scale-105 active:scale-95"
                    >
                      <span>Open Playground</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </td>

                  <td className="p-5 md:p-6 text-xs text-slate-500 italic">
                    Requires manual prompt loops
                  </td>
                  <td className="p-5 md:p-6 text-xs text-slate-500 italic">
                    High distortion risk
                  </td>
                  <td className="p-5 md:p-6 text-xs text-slate-500 italic">
                    Surface corrections only
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Metrics Bar matching Snyzer design tokens */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#061520]/80 border border-teal-500/20 text-center">
            <div className="text-2xl md:text-3xl font-bold text-teal-300 font-display">99.4%</div>
            <div className="text-xs text-slate-400 mt-1">Intent Retention Rate</div>
          </div>
          <div className="p-5 rounded-2xl bg-[#061520]/80 border border-teal-500/20 text-center">
            <div className="text-2xl md:text-3xl font-bold text-teal-300 font-display">1,400+</div>
            <div className="text-xs text-slate-400 mt-1">Robotic Clichés Purged</div>
          </div>
          <div className="p-5 rounded-2xl bg-[#061520]/80 border border-teal-500/20 text-center">
            <div className="text-2xl md:text-3xl font-bold text-teal-300 font-display">&lt; 0.6%</div>
            <div className="text-xs text-slate-400 mt-1">Synthetic Trace Residual</div>
          </div>
          <div className="p-5 rounded-2xl bg-[#061520]/80 border border-teal-500/20 text-center">
            <div className="text-2xl md:text-3xl font-bold text-teal-300 font-display">0.0s</div>
            <div className="text-xs text-slate-400 mt-1">User Training Storage</div>
          </div>
        </div>
      </div>
    </section>
  );
}
