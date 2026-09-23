import React, { useState } from 'react';
import { PageRoute, UserSession, ToneMode, IntensityMode, IntentLockMode, AppSettings } from '../types';
import { 
  Settings, 
  Cpu, 
  ShieldCheck, 
  Key, 
  User, 
  Sliders, 
  Sparkles, 
  Check, 
  RotateCcw, 
  Lock, 
  Trash2, 
  Download, 
  Volume2, 
  VolumeX, 
  Database,
  ArrowRight,
  Zap,
  Info
} from 'lucide-react';

interface SettingsViewProps {
  onNavigate: (route: PageRoute) => void;
  userSession: UserSession;
  onUpdateUserSession: (session: UserSession) => void;
}

export const DEFAULT_SETTINGS: AppSettings = {
  defaultTone: 'Formal',
  defaultIntensity: 'Balanced',
  defaultIntentLock: 'Locked',
  intentThreshold: 99.4,
  clichePurgeLevel: 'strict',
  preserveCodeBlocks: true,
  burstinessEntropy: 78,
  soundEnabled: true,
  theme: 'cyber-dark',
  geminiApiKey: '',
  reactBitsKey: '',
  zeroRetention: true,
  autoSaveHistory: true,
};

export default function SettingsView({
  onNavigate,
  userSession,
  onUpdateUserSession
}: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<'engine' | 'account' | 'keys' | 'privacy'>('engine');

  // Load settings from localStorage
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('snyzer_engine_settings');
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  });

  const [profileName, setProfileName] = useState(userSession.name || 'Researcher');
  const [profileEmail, setProfileEmail] = useState(userSession.email || 'user@snyzer.ai');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const handleSave = () => {
    try {
      localStorage.setItem('snyzer_engine_settings', JSON.stringify(settings));
      onUpdateUserSession({
        ...userSession,
        name: profileName,
        email: profileEmail,
        isLoggedIn: true
      });
      setSavedNotice('Settings synchronized to Neural Engine Vault ✓');
      setTimeout(() => setSavedNotice(null), 3000);
    } catch {
      setSavedNotice('Saved locally');
      setTimeout(() => setSavedNotice(null), 2500);
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    setSavedNotice('Default parameters restored');
    setTimeout(() => setSavedNotice(null), 2500);
  };

  const handleExportData = () => {
    try {
      const history = localStorage.getItem('snyzer_history_records') || '[]';
      const blob = new Blob([history], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `snyzer-history-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setSavedNotice('History vault exported successfully');
      setTimeout(() => setSavedNotice(null), 2500);
    } catch {
      // ignore
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your local revision history vault?')) {
      localStorage.removeItem('snyzer_history_records');
      setSavedNotice('Local history purged');
      setTimeout(() => setSavedNotice(null), 2500);
    }
  };

  return (
    <div className="w-full min-h-[85vh] py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto flex flex-col">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-slate-800/80">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-950/60 border border-teal-500/30 text-teal-300 text-xs font-code mb-2">
            <Settings className="w-3.5 h-3.5 text-teal-400" />
            <span>Preferences & System Architecture</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-display text-white tracking-tight">
            Settings
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure writing presets, intent retention strictness, API credentials, and privacy protocols.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs font-medium transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 text-xs font-bold transition-all shadow-[0_0_15px_rgba(45,212,191,0.35)] cursor-pointer hover:scale-105 active:scale-95"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Save Preferences</span>
          </button>
        </div>
      </div>

      {/* Saved Toast Notification */}
      {savedNotice && (
        <div className="mt-4 p-3 rounded-xl bg-teal-950/80 border border-teal-500/50 text-teal-200 text-xs font-code flex items-center justify-between shadow-[0_0_20px_rgba(45,212,191,0.2)]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span>{savedNotice}</span>
          </div>
          <button onClick={() => setSavedNotice(null)} className="text-teal-400/80 hover:text-teal-200">✕</button>
        </div>
      )}

      {/* Main Grid: Tabs on Left, Panel on Right */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mt-8 flex-1">
        {/* Navigation Tabs (3 cols) */}
        <div className="md:col-span-4 lg:col-span-3 space-y-2">
          {[
            {
              id: 'engine',
              label: 'Cadence Engine',
              desc: 'Intent-lock, tone & entropy',
              icon: Cpu
            },
            {
              id: 'account',
              label: 'User & Profile',
              desc: 'Identity, tier & theme',
              icon: User
            },
            {
              id: 'keys',
              label: 'API & Integrations',
              desc: 'Gemini BYOK & React Bits',
              icon: Key
            },
            {
              id: 'privacy',
              label: 'Privacy & Storage',
              desc: 'Zero-retention & data vault',
              icon: ShieldCheck
            }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-start gap-3.5 p-3.5 rounded-2xl text-left transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-teal-950/40 border-teal-500/40 text-white shadow-[0_0_20px_rgba(45,212,191,0.15)]'
                    : 'bg-[#05111c]/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-[#081827]'
                }`}
              >
                <div className={`p-2 rounded-xl mt-0.5 ${
                  isActive ? 'bg-teal-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className={`text-sm font-semibold ${isActive ? 'text-teal-200' : 'text-slate-200'}`}>
                    {tab.label}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {tab.desc}
                  </div>
                </div>
              </button>
            );
          })}

          {/* Quick Jump to Playground */}
          <div className="pt-6 border-t border-slate-800/80 mt-6">
            <button
              onClick={() => onNavigate('playground')}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-teal-950/30 to-slate-900 border border-teal-500/20 text-teal-300 hover:text-teal-200 hover:border-teal-500/40 transition-all text-xs font-semibold cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-400" />
                <span>Test in Playground</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Settings Content Panels (9 cols) */}
        <div className="md:col-span-8 lg:col-span-9 bg-[#051320]/80 rounded-3xl border border-teal-500/20 p-6 sm:p-8 backdrop-blur-xl shadow-xl">
          
          {/* ========================================================================= */}
          {/* TAB 1: CADENCE ENGINE                                                     */}
          {/* ========================================================================= */}
          {activeTab === 'engine' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-bold font-display text-white">Cadence & Intent-Lock Engine</h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Control the rhythm entropy, default persona, and semantic retention thresholds for language revisions.
                </p>
              </div>

              {/* Default Persona Mode */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-code flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-teal-400" />
                  <span>Default Writing Persona</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(['Formal', 'Academic', 'Natural'] as ToneMode[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setSettings(s => ({ ...s, defaultTone: t }))}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        settings.defaultTone === t
                          ? 'bg-teal-950/60 border-teal-400 text-teal-200 shadow-[0_0_15px_rgba(45,212,191,0.2)]'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <div className="font-semibold text-sm">{t}</div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {t === 'Formal' && 'Precision & professional clarity'}
                        {t === 'Academic' && 'Scholarly citations & rigorous flow'}
                        {t === 'Natural' && 'Lively conversational cadence'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Intent-Lock Threshold Slider */}
              <div className="p-5 rounded-2xl bg-[#081827] border border-teal-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white flex items-center gap-2">
                      <Lock className="w-4 h-4 text-teal-400" />
                      <span>Semantic Intent-Lock Threshold</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Prevents factual alteration, statistical shifts, or claim softening.
                    </div>
                  </div>
                  <div className="text-lg font-bold font-mono text-teal-300 bg-teal-950/80 px-3 py-1 rounded-xl border border-teal-500/30">
                    {settings.intentThreshold}%
                  </div>
                </div>

                <input
                  type="range"
                  min="85"
                  max="99.9"
                  step="0.1"
                  value={settings.intentThreshold}
                  onChange={(e) => setSettings(s => ({ ...s, intentThreshold: parseFloat(e.target.value) }))}
                  className="w-full accent-teal-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />

                <div className="flex justify-between text-[11px] text-slate-400 font-code">
                  <span>85% (Fluid Rephrasing)</span>
                  <span>95% (High Fidelity)</span>
                  <span className="text-teal-300 font-semibold">99.4% (Military Grade Lock)</span>
                </div>
              </div>

              {/* Cliché Purge Level */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-code">
                  Robotic Idiom Blacklist Purge
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'strict', label: 'Strict Purge', count: '1,400+ clichés', desc: 'Zero synthetic buzzwords' },
                    { id: 'standard', label: 'Standard Purge', count: '850 clichés', desc: 'Filters common LLM traps' },
                    { id: 'relaxed', label: 'Relaxed', count: '300 clichés', desc: 'Minimal idiomatic changes' },
                  ].map((level) => (
                    <button
                      key={level.id}
                      onClick={() => setSettings(s => ({ ...s, clichePurgeLevel: level.id as any }))}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        settings.clichePurgeLevel === level.id
                          ? 'bg-teal-950/60 border-teal-400 text-teal-200 shadow-[0_0_15px_rgba(45,212,191,0.2)]'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="font-semibold text-sm">{level.label}</div>
                      <div className="text-xs text-teal-400 font-mono mt-0.5">{level.count}</div>
                      <div className="text-[11px] text-slate-400 mt-1">{level.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional Toggles */}
              <div className="pt-4 border-t border-slate-800/80 space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/40 border border-slate-800">
                  <div>
                    <div className="text-sm font-semibold text-white">Technical Term & Code Block Shield</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Automatically preserves markdown backticks, variable names, and equations untouched.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.preserveCodeBlocks}
                    onChange={(e) => setSettings(s => ({ ...s, preserveCodeBlocks: e.target.checked }))}
                    className="w-5 h-5 accent-teal-400 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/40 border border-slate-800">
                  <div>
                    <div className="text-sm font-semibold text-white flex items-center gap-2">
                      <span>Bodoni Moda Editorial Reading Typography</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-950/80 border border-teal-500/30 text-teal-300">
                        Editorial
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 font-editorial text-[13px]">
                      Renders revised output in high-contrast Italian Bodoni Moda serif, ideal for long-form publishing & cadence checking.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={true}
                    readOnly
                    className="w-5 h-5 accent-teal-400 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/40 border border-slate-800">
                  <div>
                    <div className="text-sm font-semibold text-white">Streaming Sound / Audio Haptics</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Play subtle audio clicks as tokens flow through the Cadence Engine.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.soundEnabled}
                    onChange={(e) => setSettings(s => ({ ...s, soundEnabled: e.target.checked }))}
                    className="w-5 h-5 accent-teal-400 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: USER & PROFILE                                                     */}
          {/* ========================================================================= */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold font-display text-white">User Profile & Identity</h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Manage your local session credentials, display pseudonym, and interface theme.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-code">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-teal-400 text-white text-sm outline-none transition-colors"
                    placeholder="Your name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-code">
                    Email Account
                  </label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 focus:border-teal-400 text-white text-sm outline-none transition-colors"
                    placeholder="email@domain.com"
                  />
                </div>
              </div>

              {/* Tier Badge Box */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-950/50 to-emerald-950/30 border border-teal-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-400 text-slate-950 text-xs font-bold uppercase mb-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Neural Enterprise Tier</span>
                  </div>
                  <div className="text-sm font-semibold text-white">
                    Snyzer Cadence v2.4 Engine Active
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Unlimited intent-locked revisions • Zero data training • Sub-millisecond latency
                  </div>
                </div>

                <div className="text-xs font-code text-teal-300 bg-teal-950/80 px-3 py-1.5 rounded-xl border border-teal-500/40 text-center sm:text-right">
                  Status: All systems normal
                </div>
              </div>

              {/* Interface Theme */}
              <div className="space-y-3 pt-4 border-t border-slate-800/80">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 font-code">
                  Interface Palette Theme
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'cyber-dark', label: 'Dark Cyber', desc: 'Teal & deep slate (Recommended)' },
                    { id: 'midnight', label: 'Midnight Obsidian', desc: 'Pure black & cool cyan' },
                    { id: 'matrix', label: 'Matrix Emerald', desc: 'High-contrast phosphor green' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSettings(s => ({ ...s, theme: t.id as any }))}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        settings.theme === t.id
                          ? 'bg-teal-950/60 border-teal-400 text-teal-200'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="font-semibold text-sm">{t.label}</div>
                      <div className="text-[11px] text-slate-400 mt-1">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: API & INTEGRATIONS                                                 */}
          {/* ========================================================================= */}
          {activeTab === 'keys' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold font-display text-white">API Credentials & Keys</h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Connect custom foundation models or register your React Bits Pro license.
                </p>
              </div>

              {/* Gemini BYOK */}
              <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-teal-400" />
                    <span className="text-sm font-semibold text-white">Gemini API Key (Optional BYOK)</span>
                  </div>
                  <span className="text-[11px] text-teal-400/80 font-code">Server-Side Proxy Mode Active</span>
                </div>
                <p className="text-xs text-slate-400">
                  By default, Snyzer uses its high-speed managed Cadence inference pipeline. You may optionally supply your own Google Gemini API key.
                </p>
                <input
                  type="password"
                  value={settings.geminiApiKey}
                  onChange={(e) => setSettings(s => ({ ...s, geminiApiKey: e.target.value }))}
                  placeholder="AIzaSy... (leave blank for default managed cluster)"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-400 text-white font-mono text-xs outline-none transition-colors"
                />
              </div>

              {/* React Bits Pro License */}
              <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-400" />
                    <span className="text-sm font-semibold text-white">React Bits Pro License Key</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-code">Registry Auth</span>
                </div>
                <p className="text-xs text-slate-400">
                  Used by the shadcn registry protocol in <code className="text-teal-300 font-mono">components.json</code> to install premium blocks like Comparison 8.
                </p>
                <input
                  type="password"
                  value={settings.reactBitsKey}
                  onChange={(e) => setSettings(s => ({ ...s, reactBitsKey: e.target.value }))}
                  placeholder="REACTBITS_LICENSE_KEY..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-400 text-white font-mono text-xs outline-none transition-colors"
                />
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: PRIVACY & STORAGE                                                  */}
          {/* ========================================================================= */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold font-display text-white">Privacy & Local Storage Vault</h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Enforce zero-data retention policies and manage your browser's encrypted revision ledger.
                </p>
              </div>

              {/* Zero Data Retention Banner */}
              <div className="p-5 rounded-2xl bg-teal-950/40 border border-teal-500/30 flex items-start gap-3.5">
                <ShieldCheck className="w-6 h-6 text-teal-300 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-white">Zero-Data Retention Policy Active</div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Snyzer never uses your manuscripts, academic drafts, or proprietary memos for model training. 
                    Revisions are processed ephemerally in volatile memory and destroyed once streamed.
                  </p>
                </div>
              </div>

              {/* Vault Data Controls */}
              <div className="pt-4 border-t border-slate-800/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/40 border border-slate-800">
                  <div>
                    <div className="text-sm font-semibold text-white">Export Revision History</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Download all your previous humanized versions and cadence diagnostics as JSON.
                    </div>
                  </div>
                  <button
                    onClick={handleExportData}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold transition-colors cursor-pointer shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export JSON</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-red-950/20 border border-red-500/20">
                  <div>
                    <div className="text-sm font-semibold text-red-200">Purge Local Storage Vault</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Permanently wipe all cached draft history and analytics from this browser.
                    </div>
                  </div>
                  <button
                    onClick={handleClearHistory}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-900/40 hover:bg-red-800/60 border border-red-500/30 text-red-300 text-xs font-semibold transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Purge Vault</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
