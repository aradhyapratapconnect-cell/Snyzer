import { PageRoute } from '../types';
import HeroShaderCanvas from './HeroShaderCanvas';
import Comparison8 from './Comparison8';
import { ArrowRight, Sparkles, CheckCircle2, ShieldCheck, Zap, Layers, Terminal, Cpu } from 'lucide-react';

interface HomeViewProps {
  onNavigate: (route: PageRoute) => void;
  onOpenGithub: () => void;
}

export default function HomeView({ onNavigate, onOpenGithub }: HomeViewProps) {
  return (
    <div className="w-full flex flex-col bg-[#030c14] text-white">
      {/* ========================================================================= */}
      {/* HERO SECTION matching Image 11.jpeg                                       */}
      {/* ========================================================================= */}
      <section className="relative min-h-[92vh] bg-[#030c14] text-white flex flex-col justify-center overflow-hidden pt-20 pb-16">
        {/* Living WebGL Filament Shader Canvas from Image 11 */}
        <HeroShaderCanvas />

        {/* Left-side vignette & readability gradient overlay from Image 11 */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#030c14]/95 via-[#030c14]/65 to-transparent pointer-events-none z-0" />

        {/* Hero Content Area */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-20 pb-8 w-full">
          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white max-w-3xl leading-[1.06] mb-6 font-display">
            Snyzer
          </h1>

          {/* Body Paragraphs & Subtitle */}
          <p className="text-slate-300 text-lg md:text-xl max-w-2xl font-normal leading-relaxed mb-4">
            Snyzer is a web-based AI-assisted writing editor. Users sign in, write or paste text, choose improvement preferences, and receive a clearer, more natural revision while preserving meaning and intent.
          </p>
          <p className="text-teal-200/80 text-sm md:text-base font-medium mb-10 max-w-2xl font-code">
            Snyzer is a writing-quality product.
          </p>

          {/* Dual Action Buttons */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              id="hero-playground-btn"
              onClick={() => onNavigate('playground')}
              className="bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-semibold px-7 py-3 rounded-full flex items-center gap-2 transition-all shadow-[0_0_25px_rgba(20,184,166,0.35)] hover:opacity-95 hover:shadow-[0_0_30px_rgba(45,212,191,0.55)] hover:scale-105 active:scale-95 text-base"
            >
              <span>Playground</span>
              <ArrowRight className="w-4 h-4 font-semibold" />
            </button>

            <button
              id="hero-github-btn"
              onClick={onOpenGithub}
              className="border border-teal-400/25 bg-teal-950/20 hover:border-teal-400/50 hover:text-teal-300 hover:shadow-[0_0_15px_rgba(45,212,191,0.15)] text-white font-medium px-7 py-3 rounded-full backdrop-blur transition-all inline-flex items-center justify-center text-base"
            >
              Github
            </button>
          </div>

          {/* Partner Logos / Trust Bar from Image 11 */}
          <div className="pt-16 w-full">
            <div className="border-t border-teal-950/60 pt-8">
              <p className="text-xs uppercase tracking-widest text-teal-200/50 font-medium mb-6 font-code">
                Made using
              </p>
              <div className="flex flex-wrap items-center gap-8 md:gap-14 opacity-80">
                <div className="flex items-center gap-2.5 text-slate-300 hover:text-teal-200 transition-colors">
                  <Cpu className="w-5 h-5 text-teal-400/80" />
                  <span className="font-bold text-sm tracking-wide">OpenAI</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-300 hover:text-teal-200 transition-colors">
                  <Zap className="w-5 h-5 text-teal-400/80" />
                  <span className="font-bold text-sm tracking-wide font-headline-sm">Opencode</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-300 hover:text-teal-200 transition-colors">
                  <span className="material-symbols-outlined text-xl text-teal-400/80">change_history</span>
                  <span className="font-bold text-sm tracking-wide">Vercel</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-300 hover:text-teal-200 transition-colors">
                  <Layers className="w-5 h-5 text-teal-400/80" />
                  <span className="font-bold text-sm tracking-wide font-headline-sm">Supabase</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-300 hover:text-teal-200 transition-colors">
                  <span className="font-code text-teal-400/90 font-bold text-base">TS</span>
                  <span className="font-bold text-sm tracking-wide">Typescript</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-300 hover:text-teal-200 transition-colors">
                  <Terminal className="w-5 h-5 text-teal-400/80" />
                  <span className="font-bold text-sm tracking-wide font-code">React</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* COMPARISON 8: "Why to choose Snyzer" Grouped Capability Matrix            */}
      {/* ========================================================================= */}
      <Comparison8 onNavigate={onNavigate} />

      {/* ========================================================================= */}
      {/* ARCHITECTURE & CAPABILITY GRID                                            */}
      {/* ========================================================================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full relative z-10 border-t border-slate-800/80">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-950/50 border border-teal-500/30 text-teal-300 text-xs font-code mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Intent-Locked Architecture</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white font-display mb-4">
            How Cadence Engine v2.4 Replaces Robotic AI
          </h2>
          <p className="text-slate-400 text-base md:text-lg leading-relaxed">
            Standard AI rewrites rewrite your ideas and strip out authentic personality. Snyzer locks your semantic meaning while humanizing rhythm and cadence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-8 rounded-2xl bg-[#061520]/80 border border-teal-500/25 backdrop-blur-xl relative group hover:border-teal-400/50 transition-all shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-6 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-headline-sm text-white mb-2">99.4% Intent Preservation</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Mathematical validation matrices ensure that every claim, technical term, and logical argument in your draft remains completely untouched.
            </p>
            <span className="font-code text-xs text-teal-300/80">Semantic Variance &lt; 0.6%</span>
          </div>

          {/* Card 2 */}
          <div className="p-8 rounded-2xl bg-[#061520]/80 border border-teal-500/25 backdrop-blur-xl relative group hover:border-teal-400/50 transition-all shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-headline-sm text-white mb-2">Cliché Elimination</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Scans 1,400+ telltale robotic phrases such as "delve into", "testament to", and "tapestry of" to inject authentic human sentence variance.
            </p>
            <span className="font-code text-xs text-teal-300/80">Zero Watermark Leakage</span>
          </div>

          {/* Card 3 */}
          <div className="p-8 rounded-2xl bg-[#061520]/80 border border-teal-500/25 backdrop-blur-xl relative group hover:border-teal-400/50 transition-all shadow-xl">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-6 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-headline-sm text-white mb-2">Real-Time Cadence Scoring</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Live prosodic entropy calculation provides an objective 0-100 cadence rating, ensuring your writing resonates with real decision-makers.
            </p>
            <span className="font-code text-xs text-teal-300/80">Burstiness &amp; Prosodic Analysis</span>
          </div>
        </div>

        {/* Interactive CTA Banner */}
        <div className="mt-16 p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-teal-950/60 via-[#071d2b] to-teal-950/60 border border-teal-500/30 text-center flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-2xl">
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4 font-headline-sm">
              Ready to experience true human cadence?
            </h3>
            <p className="text-slate-300 text-sm sm:text-base mb-8">
              Open the interactive Playground with live semantic streaming, sample prompts, and real-time cadence scoring.
            </p>
            <button
              onClick={() => onNavigate('playground')}
              className="bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-300 text-slate-950 font-bold px-8 py-3.5 rounded-full flex items-center gap-2 mx-auto shadow-[0_0_30px_rgba(45,212,191,0.55)] hover:shadow-[0_0_45px_rgba(45,212,191,0.8)] hover:scale-105 active:scale-95 transition-all text-base"
            >
              <span>Launch Playground</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
