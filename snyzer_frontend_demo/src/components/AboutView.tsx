import { PageRoute } from '../types';
import { Sparkles, ArrowRight, ShieldCheck, CheckCircle2, Cpu, BrainCircuit, Activity, Award } from 'lucide-react';

interface AboutViewProps {
  onNavigate: (route: PageRoute) => void;
}

export default function AboutView({ onNavigate }: AboutViewProps) {
  return (
    <div className="w-full min-h-[90vh] bg-[#030c14] text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-950/60 border border-teal-500/30 text-teal-300 text-xs font-code mb-4 shadow-[0_0_15px_rgba(45,212,191,0.2)]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Cadence Engine Core Philosophy</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white font-display mb-6">
            Engineering Human Resonance in Synthetic Language
          </h1>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            Snyzer was conceived by natural language researchers who noticed a critical flaw in modern generative models: while capable of producing vast quantities of text, AI prose suffers from predictable, sterile cadences that trigger immediate reader fatigue.
          </p>
        </div>

        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="p-8 rounded-3xl bg-[#061520]/80 border border-teal-500/20 backdrop-blur-xl relative shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-6">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold font-headline-sm text-white mb-3">
              The Intent-Lock Principle
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              Traditional re-prompting or rewriting algorithms change the core meaning of your text. Snyzer extracts a semantic dependency graph before altering a single word. Every quantitative metric, citation, and factual claim is anchored with a mathematical guarantee of preservation.
            </p>
            <div className="p-3 rounded-xl bg-teal-950/40 border border-teal-500/30 font-code text-xs text-teal-300">
              Verified Metric: 99.4% intent preservation across multi-clause transformations.
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-[#061520]/80 border border-teal-500/20 backdrop-blur-xl relative shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-6">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold font-headline-sm text-white mb-3">
              Prosodic Burstiness & Rhythm
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              Human speech is rhythmic and dynamic: brief, punchy declarations are interwoven with measured, explanatory clauses. Generative AI models default to uniform paragraph lengths and monotonous sentences. Cadence Engine restores authentic burstiness.
            </p>
            <div className="p-3 rounded-xl bg-teal-950/40 border border-teal-500/30 font-code text-xs text-teal-300">
              Perplexity & Entropy Calibration: 0% synthetic detector trace.
            </div>
          </div>
        </div>

        {/* 4-Layer Cadence Pipeline Diagram */}
        <div className="p-8 sm:p-12 rounded-3xl bg-[#07131e]/90 border border-teal-500/30 backdrop-blur-2xl shadow-2xl mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold font-headline-sm text-white mb-8 text-center">
            The 4-Layer Cadence Pipeline (v2.4)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-teal-500/20">
              <span className="text-xs font-code text-teal-400 font-bold">Layer 1</span>
              <h4 className="text-base font-bold text-white mt-1 mb-2">Lexical Scan</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Flags 1,400+ overused AI idioms, robotic connectors, and formulaic intros.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/60 border border-teal-500/20">
              <span className="text-xs font-code text-teal-400 font-bold">Layer 2</span>
              <h4 className="text-base font-bold text-white mt-1 mb-2">Intent Locking</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Builds dependency tensors to lock factual claims and technical vocabulary.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/60 border border-teal-500/20">
              <span className="text-xs font-code text-teal-400 font-bold">Layer 3</span>
              <h4 className="text-base font-bold text-white mt-1 mb-2">Burstiness Tuning</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Restores variable syllable cadences and human punctuation pauses.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/60 border border-teal-500/20">
              <span className="text-xs font-code text-teal-400 font-bold">Layer 4</span>
              <h4 className="text-base font-bold text-white mt-1 mb-2">Entropy Calibrate</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Refines statistical perplexity to score 98+ on our verified Cadence index.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={() => onNavigate('playground')}
            className="bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-300 text-slate-950 font-bold px-8 py-3.5 rounded-full inline-flex items-center gap-2 shadow-[0_0_30px_rgba(45,212,191,0.5)] hover:shadow-[0_0_40px_rgba(45,212,191,0.7)] transition-all hover:scale-105 active:scale-95 text-base"
          >
            <span>Try Cadence Engine in Playground</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
