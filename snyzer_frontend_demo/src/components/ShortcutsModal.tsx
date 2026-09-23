import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Command, Sparkles, Bookmark, Copy, FileText, ArrowRight, RotateCw, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutGroup {
  category: string;
  items: {
    keys: string[];
    description: string;
    context?: string;
  }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    category: 'Editor & AI Revision',
    items: [
      {
        keys: ['Ctrl', 'Enter'],
        description: 'Trigger AI Humanize & Cadence revision',
        context: 'Playground / Input'
      },
      {
        keys: ['Ctrl', 'S'],
        description: 'Save current revision session to History vault',
        context: 'Playground'
      },
      {
        keys: ['Ctrl', 'Shift', 'C'],
        description: 'Copy humanized revision text to clipboard',
        context: 'Playground'
      },
      {
        keys: ['Ctrl', 'R'],
        description: 'Regenerate / resynthesize revision',
        context: 'Playground'
      },
      {
        keys: ['Ctrl', 'K'],
        description: 'Open this Keyboard Shortcuts cheat-sheet',
        context: 'Global'
      }
    ]
  },
  {
    category: 'Quick App Navigation',
    items: [
      {
        keys: ['Alt', '1'],
        description: 'Go to Playground',
        context: 'Global'
      },
      {
        keys: ['Alt', '2'],
        description: 'Go to Revision History Vault',
        context: 'Global'
      },
      {
        keys: ['Alt', '3'],
        description: 'Go to Settings & Preferences',
        context: 'Global'
      },
      {
        keys: ['Alt', 'H'],
        description: 'Return to Home / Overview',
        context: 'Global'
      },
      {
        keys: ['Esc'],
        description: 'Close modals & drawers',
        context: 'Global'
      }
    ]
  }
];

export default function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  if (!isOpen) return null;

  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#020810]/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-2xl bg-[#061421] border border-teal-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_40px_rgba(45,212,191,0.15)] text-white z-10 overflow-hidden"
        >
          {/* Subtle top ambient glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-32 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between pb-5 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-950/80 border border-teal-500/30 flex items-center justify-center text-teal-300 shadow-[0_0_15px_rgba(45,212,191,0.2)]">
                <Keyboard className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-display tracking-tight text-white flex items-center gap-2">
                  Keyboard Shortcuts
                  <span className="text-[10px] font-code px-2 py-0.5 rounded-full bg-teal-950/80 border border-teal-500/30 text-teal-300">
                    Power User
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Accelerate your writing and revision cadence without touching your mouse
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent hover:border-slate-700 transition-colors"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Lists */}
          <div className="py-6 space-y-6 max-h-[60vh] overflow-y-auto pr-1">
            {SHORTCUT_GROUPS.map((group, gIdx) => (
              <div key={gIdx} className="space-y-3">
                <h3 className="text-xs font-semibold text-teal-300 uppercase tracking-wider font-code flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                  {group.category}
                </h3>

                <div className="space-y-2">
                  {group.items.map((item, iIdx) => (
                    <div
                      key={iIdx}
                      className="flex items-center justify-between p-3 rounded-2xl bg-[#030d17]/80 border border-slate-800/70 hover:border-teal-500/30 transition-colors"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-200">
                          {item.description}
                        </span>
                        {item.context && (
                          <span className="text-[11px] text-slate-500 font-code">
                            {item.context}
                          </span>
                        )}
                      </div>

                      {/* Key badge combo */}
                      <div className="flex items-center gap-1.5 shrink-0 pl-3">
                        {item.keys.map((k, kIdx) => {
                          const displayKey = isMac && k === 'Ctrl' ? '⌘ Cmd' : k;
                          return (
                            <React.Fragment key={kIdx}>
                              <kbd className="px-2.5 py-1 rounded-lg bg-[#091e2e] border border-teal-500/30 text-teal-200 font-mono text-xs font-semibold shadow-inner">
                                {displayKey}
                              </kbd>
                              {kIdx < item.keys.length - 1 && (
                                <span className="text-slate-600 font-mono text-xs">+</span>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-code">
            <span className="flex items-center gap-1.5 text-teal-400/90">
              <Sparkles className="w-3.5 h-3.5" />
              Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-teal-300 text-[10px]">Ctrl+Enter</kbd> while typing in the draft box to start revision immediately.
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 font-semibold transition-colors"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
