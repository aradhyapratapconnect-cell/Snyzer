import { useState } from 'react';
import { UserSession } from '../types';
import SnyzerLogo from './SnyzerLogo';
import { CheckCircle2, ShieldCheck, Mail, Key, Eye, EyeOff, Sparkles, HelpCircle, ArrowRight, ArrowLeft } from 'lucide-react';

interface AuthModalProps {
  onSuccess: (session: UserSession) => void;
  onClose?: () => void;
  isStandalone?: boolean;
}

export default function AuthModal({ onSuccess, onClose, isStandalone = false }: AuthModalProps) {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('colleague@enterprise.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage('Authenticating Neural Session...');

    setTimeout(() => {
      setStatusMessage('Authorization Granted ✓');
      setTimeout(() => {
        const username = email.split('@')[0] || 'Researcher';
        const session: UserSession = {
          isLoggedIn: true,
          email: email,
          name: username.charAt(0).toUpperCase() + username.slice(1)
        };
        onSuccess(session);
        if (onClose) onClose();
      }, 800);
    }, 1000);
  };

  const handleOAuth = (provider: string) => {
    setIsLoading(true);
    setStatusMessage(`Connecting to ${provider}...`);
    setTimeout(() => {
      const session: UserSession = {
        isLoggedIn: true,
        email: `user@${provider.toLowerCase()}.com`,
        name: `${provider} Engineer`
      };
      onSuccess(session);
      if (onClose) onClose();
    }, 900);
  };

  return (
    <div className={`w-full ${isStandalone ? 'min-h-[85vh] py-8' : ''} flex items-center justify-center p-2 sm:p-4`}>
      {/* Main Split Architecture Container matching Image 1.jpeg */}
      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 min-h-[720px] bg-[#071520]/90 rounded-3xl border border-teal-500/25 backdrop-blur-2xl shadow-[0_0_60px_rgba(0,0,0,0.8),0_0_30px_rgba(45,212,191,0.12)] overflow-hidden">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: Atmospheric Neural Experience & Social Proof (58% / 7 cols)   */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 flex flex-col justify-between p-8 sm:p-12 lg:p-14 relative overflow-hidden bg-gradient-to-br from-[#000411] via-[#091e3a]/90 to-[#002416]/70 border-b lg:border-b-0 lg:border-r border-teal-500/20 text-white">
          
          {/* Living Synaptic Light Field (SVG paths from Image 1) */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <svg className="absolute -right-20 -top-20 w-[640px] h-[640px] text-teal-300/15 opacity-80" fill="none" viewBox="0 0 600 600">
              <defs>
                <radialGradient cx="50%" cy="50%" id="neuralGlow" r="50%">
                  <stop offset="0%" stopColor="#6ffbbe" stopOpacity="0.8" />
                  <stop offset="40%" stopColor="#39b8fd" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#000411" stopOpacity="0" />
                </radialGradient>
                <filter id="blurFilter">
                  <feGaussianBlur stdDeviation="35" />
                </filter>
              </defs>
              <circle cx="340" cy="260" fill="url(#neuralGlow)" filter="url(#blurFilter)" r="160" />
              <path d="M120 450 C 240 380, 290 280, 360 260 S 480 180, 580 110" stroke="#6ffbbe" strokeDasharray="6 4" strokeOpacity="0.4" strokeWidth="2.5" />
              <path d="M220 540 C 310 420, 340 300, 370 250 S 420 120, 520 40" stroke="#39b8fd" strokeOpacity="0.5" strokeWidth="1.5" />
              <path d="M50 200 C 180 220, 320 230, 380 270 S 490 380, 590 490" stroke="#6ffbbe" strokeOpacity="0.3" strokeWidth="2" />
            </svg>
            <div className="absolute top-1/3 -right-24 w-80 h-80 bg-teal-400/20 rounded-full blur-3xl mix-blend-screen animate-pulse" />
            <div className="absolute bottom-10 left-10 w-96 h-96 bg-cyan-500/15 rounded-full blur-[110px] pointer-events-none" />
          </div>

          {/* Top Header: Brand Identity & Telemetry Chip */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <SnyzerLogo size="lg" showText={false} />
              <div className="flex flex-col">
                <span className="font-headline-sm text-2xl tracking-tight text-white font-bold">
                  Snyzer<span className="text-teal-400">.ai</span>
                </span>
                <span className="font-label-sm text-[11px] text-teal-200/70 tracking-wider uppercase font-code">
                  Neural Language Core
                </span>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-teal-400/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400" />
              </span>
              <span className="font-label-sm text-xs text-white/90 font-medium tracking-wide font-code">
                Cadence Engine v2.4 Active
              </span>
            </div>
          </div>

          {/* Center Content: Heroic Value Proposition */}
          <div className="relative z-10 max-w-xl my-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/15 text-teal-300 text-xs font-code mb-5 border border-teal-500/30">
              <Sparkles className="w-3.5 h-3.5 text-teal-300" />
              <span>Zero Artifact Intent Preservation</span>
            </div>

            <h1 className="font-headline-lg text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
              Unleash human resonance in <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-200 via-teal-400 to-cyan-300">synthetic language.</span>
            </h1>

            <p className="font-body-lg text-base sm:text-lg text-slate-300 mt-4 leading-relaxed">
              The leading neural cadence and intent-locking revision framework engineered for high-caliber researchers, quantitative writers, and autonomous AI product teams.
            </p>

            {/* Interactive Spec Checklist */}
            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] backdrop-blur-sm border border-teal-500/20">
                <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-teal-400/20 text-teal-300">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className="text-sm text-white/90 font-medium">
                  99.4% intent preservation across complex semantic transformations
                </span>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] backdrop-blur-sm border border-teal-500/20">
                <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-teal-400/20 text-teal-300">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-sm text-white/90 font-medium">
                  Zero watermark leakage & undetectable neural cadence matching
                </span>
              </div>
            </div>
          </div>

          {/* Close/Back button for modal view */}
          {onClose && (
            <div className="relative z-10 pt-2">
              <button
                onClick={onClose}
                className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-teal-300 transition-colors font-code"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Return to Previous View
              </button>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: Interactive Form (42% / 5 cols) - Crisp Light/Dark Design   */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 flex flex-col justify-between p-8 sm:p-10 lg:p-12 bg-[#ffffff] text-slate-900 relative">
          <div>
            {/* Top Switcher Tabs */}
            <div className="flex items-center justify-between mb-6">
              <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200" id="authModeTabs">
                <button
                  type="button"
                  onClick={() => setAuthMode('signin')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold font-code transition-all ${
                    authMode === 'signin'
                      ? 'bg-[#091e3a] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold font-code transition-all ${
                    authMode === 'signup'
                      ? 'bg-[#091e3a] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Create Account
                </button>
              </div>

              <a
                href="#help"
                onClick={(e) => { e.preventDefault(); alert('For workspace onboarding assistance, contact access@snyzer.ai'); }}
                className="text-xs font-code text-teal-700 hover:text-teal-900 flex items-center gap-1 transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Need Help?</span>
              </a>
            </div>

            {/* Form Title */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold font-headline-sm text-slate-950 tracking-tight">
                {authMode === 'signin' ? 'Welcome back to Snyzer' : 'Create your Snyzer Account'}
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                {authMode === 'signin'
                  ? 'Enter your credentials or authenticate via single sign-on.'
                  : 'Start humanizing and intent-locking your generative outputs.'}
              </p>
            </div>

            {/* Social OAuth Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => handleOAuth('GitHub')}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-medium font-code transition-all shadow-sm"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <span>GitHub</span>
              </button>

              <button
                type="button"
                onClick={() => handleOAuth('Google')}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-medium font-code transition-all shadow-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
                <span>Google</span>
              </button>
            </div>

            {/* SSO Button */}
            <button
              type="button"
              onClick={() => handleOAuth('SAML SSO')}
              className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-code transition-colors"
            >
              <span className="material-symbols-outlined text-teal-700 text-sm">domain</span>
              <span>Continue with SSO / SAML 2.0</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-4">
              <div className="w-full border-t border-slate-200" />
              <span className="absolute px-3 bg-white text-[11px] font-code text-slate-500 uppercase tracking-wider">
                or continue with email
              </span>
            </div>

            {/* Credential Input Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-code uppercase tracking-wider text-slate-700 font-semibold mb-1">
                  Work Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="colleague@enterprise.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 text-slate-900 border border-slate-200 focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-500/20 text-sm outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-code uppercase tracking-wider text-slate-700 font-semibold">
                    Session Password
                  </label>
                  <button
                    type="button"
                    onClick={() => alert('Password reset link sent to ' + email)}
                    className="text-[11px] font-code text-teal-700 hover:text-teal-900"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Key className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-slate-50 text-slate-900 border border-slate-200 focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-500/20 text-sm outline-none transition-all font-code"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberSession}
                    onChange={(e) => setRememberSession(e.target.checked)}
                    className="w-4 h-4 rounded text-[#091e3a] border-slate-300 focus:ring-teal-500"
                  />
                  <span className="text-xs text-slate-600">Remember session (30 days)</span>
                </label>
                <span className="inline-flex items-center gap-1 font-code text-[11px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                  256-Bit TLS
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-6 rounded-xl font-headline-sm text-base font-semibold text-white bg-[#091e3a] hover:bg-[#061426] transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 hover:shadow-xl group relative overflow-hidden"
                >
                  <span>
                    {statusMessage || (authMode === 'signin' ? 'Sign In to Workspace' : 'Initialize Account & Start Free')}
                  </span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => alert('Magic authentication link sent to ' + email)}
                  className="text-xs font-code text-teal-700 hover:text-teal-900 transition-colors inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Send instant passwordless magic link</span>
                </button>
              </div>
            </form>
          </div>

          {/* Bottom Security Verification & Legal */}
          <div className="pt-6 mt-6 border-t border-slate-200 text-center">
            <div className="flex items-center justify-center gap-2 text-slate-500 text-xs font-code mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
              <span>Protected by Zero-Knowledge Cryptographic Telemetry</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-slate-400">
              <a href="#terms" onClick={(e) => e.preventDefault()} className="hover:text-slate-800 transition">Terms of Service</a>
              <span>•</span>
              <a href="#privacy" onClick={(e) => e.preventDefault()} className="hover:text-slate-800 transition">Privacy Policy</a>
              <span>•</span>
              <a href="#audit" onClick={(e) => e.preventDefault()} className="hover:text-slate-800 transition">Audit Logs</a>
              <span>•</span>
              <a href="#security" onClick={(e) => e.preventDefault()} className="hover:text-slate-800 transition">Security Disclosures</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
