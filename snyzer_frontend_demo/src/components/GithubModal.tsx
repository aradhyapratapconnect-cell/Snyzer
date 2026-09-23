import { useState } from 'react';
import { X, Copy, Check, ExternalLink, Star, GitFork, Terminal, Code2 } from 'lucide-react';

interface GithubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GithubModal({ isOpen, onClose }: GithubModalProps) {
  const [copied, setCopied] = useState(false);
  const cloneCmd = 'git clone https://github.com/snyzer-ai/snyzer-core.git';

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(cloneCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-[#040e17] border border-teal-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(0,0,0,0.9),0_0_30px_rgba(45,212,191,0.2)] text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-teal-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-950/50 border border-teal-500/30 flex items-center justify-center text-teal-300">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-headline-sm text-white">snyzer-ai / snyzer-core</h3>
              <p className="text-xs text-teal-200/70 font-code">Open-weights neural cadence revision engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-teal-950/40 border border-teal-500/30 flex items-center justify-center text-teal-300 hover:bg-teal-900/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2.5 my-6">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-950/60 border border-teal-500/30 text-teal-300 text-xs font-code">
            <Star className="w-3.5 h-3.5 text-teal-400 fill-teal-400" />
            <span>4.8k Stars</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-950/60 border border-teal-500/30 text-teal-300 text-xs font-code">
            <GitFork className="w-3.5 h-3.5 text-teal-400" />
            <span>312 Forks</span>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-xs font-code">
            Apache-2.0 License
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700/60 text-slate-300 text-xs font-code">
            v2.4.0 Release
          </span>
        </div>

        {/* Quickstart Command */}
        <div className="space-y-2 mb-6">
          <label className="text-xs font-code uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-teal-400" />
            <span>Local Developer Quickstart</span>
          </label>
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-teal-500/25 font-code text-xs text-teal-300">
            <span className="truncate mr-3">{cloneCmd}</span>
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 border border-teal-500/40 flex items-center gap-1 transition-colors shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Architecture Spec */}
        <div className="p-4 rounded-xl bg-teal-950/20 border border-teal-500/20 text-xs text-slate-300 leading-relaxed mb-6 space-y-1.5">
          <div className="font-semibold text-teal-200 font-headline-sm">Model Architecture & Weights:</div>
          <p>
            The Snyzer pipeline integrates a custom LoRA adapter trained over 1.2M human-authored editorial essays, calibrating prosodic entropy without destroying factual semantic fidelity.
          </p>
        </div>

        {/* Footer Link */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <span className="text-xs text-slate-500 font-code">GitHub API integration active</span>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-teal-400 text-slate-950 text-xs font-bold font-code hover:bg-teal-300 transition-colors shadow-lg"
          >
            <span>View on GitHub</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
