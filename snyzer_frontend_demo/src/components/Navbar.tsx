import React, { useState, useRef, useEffect } from 'react';
import { PageRoute, UserSession } from '../types';
import SnyzerLogo from './SnyzerLogo';
import { 
  Menu, 
  User, 
  LogOut, 
  Settings, 
  ChevronDown, 
  Sparkles, 
  Clock, 
  Zap, 
  ShieldCheck, 
  Sliders 
} from 'lucide-react';

interface NavbarProps {
  currentRoute: PageRoute;
  onNavigate: (route: PageRoute) => void;
  onOpenMobileMenu: () => void;
  onOpenGithub: () => void;
  userSession: UserSession;
  onLogout: () => void;
}

export default function Navbar({
  currentRoute,
  onNavigate,
  onOpenMobileMenu,
  onOpenGithub,
  userSession,
  onLogout
}: NavbarProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#030c14]/85 backdrop-blur-xl border-b border-teal-500/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      <div className="h-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div onClick={() => onNavigate('home')} role="button" tabIndex={0} className="cursor-pointer">
          <SnyzerLogo />
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-6">
          <nav className="flex items-center gap-1 sm:gap-2 font-medium text-sm text-slate-300">
            <button
              id="nav-about-link"
              onClick={() => onNavigate('about')}
              className={`transition-all active:scale-95 px-3 py-1.5 rounded-lg cursor-pointer ${
                currentRoute === 'about'
                  ? 'text-teal-300 font-semibold bg-teal-400/10 border border-teal-400/20'
                  : 'text-slate-300 hover:text-teal-300'
              }`}
            >
              About Us
            </button>

            <button
              id="nav-playground-link"
              onClick={() => onNavigate('playground')}
              className={`px-3.5 py-1.5 rounded-full font-semibold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer ${
                currentRoute === 'playground'
                  ? 'bg-teal-400/15 text-teal-300 border border-teal-400/40 shadow-[0_0_15px_rgba(45,212,191,0.25)]'
                  : 'bg-teal-950/40 text-slate-300 hover:text-teal-200 border border-teal-500/20'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              Playground
            </button>

            <button
              id="nav-history-link"
              onClick={() => onNavigate('history')}
              className={`transition-all active:scale-95 px-3 py-1.5 rounded-lg cursor-pointer ${
                currentRoute === 'history'
                  ? 'text-teal-300 font-semibold bg-teal-400/10 border border-teal-400/20'
                  : 'text-slate-300 hover:text-teal-300'
              }`}
            >
              History
            </button>

            <button
              id="nav-github-link"
              onClick={onOpenGithub}
              className="transition-all active:scale-95 hover:text-teal-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              Github
            </button>
          </nav>

          {/* User Profile & Menu Dropdown */}
          {userSession.isLoggedIn ? (
            <div className="relative pl-2 border-l border-slate-800" ref={userMenuRef}>
              {/* User Avatar Button Trigger */}
              <button
                id="user-menu-trigger-btn"
                onClick={() => setIsUserMenuOpen(prev => !prev)}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                  isUserMenuOpen || currentRoute === 'settings'
                    ? 'bg-teal-950/70 border-teal-400/70 text-teal-200 shadow-[0_0_15px_rgba(45,212,191,0.25)]'
                    : 'bg-teal-950/40 border-teal-500/30 text-teal-200 hover:border-teal-400/60'
                }`}
                aria-expanded={isUserMenuOpen}
                aria-haspopup="true"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 p-[1.5px] flex items-center justify-center">
                  <div className="w-full h-full rounded-full bg-[#04111c] flex items-center justify-center text-teal-300">
                    <User className="w-3.5 h-3.5" />
                  </div>
                </div>
                <span className="max-w-[110px] truncate text-xs font-semibold tracking-tight">
                  {userSession.name || userSession.email?.split('@')[0] || 'Researcher'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-teal-400/80 transition-transform duration-200 ${
                  isUserMenuOpen ? 'rotate-180 text-teal-300' : ''
                }`} />
              </button>

              {/* User Dropdown Menu with Settings Tab */}
              {isUserMenuOpen && (
                <div 
                  id="user-menu-dropdown"
                  className="absolute right-0 mt-3 w-72 bg-[#04101b] border border-teal-500/30 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(45,212,191,0.15)] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-2xl"
                >
                  {/* User Profile Header Card */}
                  <div className="px-4 py-3 border-b border-teal-500/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-400 to-emerald-400 p-[2px] shrink-0">
                        <div className="w-full h-full rounded-full bg-[#051422] flex items-center justify-center text-teal-300 font-bold text-sm">
                          {(userSession.name?.[0] || 'S').toUpperCase()}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">
                          {userSession.name || 'Pro Researcher'}
                        </p>
                        <p className="text-xs text-slate-400 truncate font-mono">
                          {userSession.email || 'user@snyzer.ai'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between px-2.5 py-1 rounded-lg bg-teal-950/60 border border-teal-500/20 text-[11px] font-code">
                      <span className="text-teal-300 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                        Cadence Pro Tier
                      </span>
                      <span className="text-emerald-400 font-medium">Active</span>
                    </div>
                  </div>

                  {/* Navigation Options in User Menu */}
                  <div className="p-1.5 space-y-1">
                    {/* SETTINGS TAB (Requested by user) */}
                    <button
                      id="user-menu-settings-tab"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onNavigate('settings');
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer group ${
                        currentRoute === 'settings'
                          ? 'bg-teal-950/80 border border-teal-500/40 text-teal-200'
                          : 'hover:bg-teal-950/40 text-slate-200 hover:text-white border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-teal-400/10 text-teal-400 group-hover:bg-teal-400 group-hover:text-slate-950 transition-colors">
                          <Settings className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-semibold text-white group-hover:text-teal-200">
                            Settings
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Engine, Preferences & Keys
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-code px-1.5 py-0.5 rounded bg-teal-950/60 border border-teal-500/30 text-teal-300">
                        TAB
                      </span>
                    </button>

                    {/* Playground Link */}
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onNavigate('playground');
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-900/60 text-slate-300 hover:text-white transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <Sparkles className="w-4 h-4 text-teal-400" />
                        <span className="text-xs font-medium">Writing Playground</span>
                      </div>
                      <span className="text-[10px] font-code text-teal-400">LIVE</span>
                    </button>

                    {/* History Vault Link */}
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onNavigate('history');
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-900/60 text-slate-300 hover:text-white transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <Clock className="w-4 h-4 text-teal-400" />
                        <span className="text-xs font-medium">Revision Vault</span>
                      </div>
                    </button>

                    {/* Matrix / Why Snyzer */}
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        if (currentRoute !== 'home') {
                          onNavigate('home');
                          setTimeout(() => {
                            document.getElementById('why-choose-snyzer')?.scrollIntoView({ behavior: 'smooth' });
                          }, 100);
                        } else {
                          document.getElementById('why-choose-snyzer')?.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-900/60 text-slate-300 hover:text-white transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <Zap className="w-4 h-4 text-teal-400" />
                        <span className="text-xs font-medium">Capability Matrix</span>
                      </div>
                    </button>
                  </div>

                  {/* Divider & Sign Out */}
                  <div className="pt-1.5 mt-1 border-t border-teal-500/10 px-1.5">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-red-950/30 text-slate-400 hover:text-red-300 transition-colors cursor-pointer text-left text-xs font-medium"
                    >
                      <LogOut className="w-4 h-4 text-red-400/80" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                id="nav-start-btn"
                onClick={() => onNavigate('auth')}
                className="inline-flex items-center justify-center px-5 py-2 rounded-full bg-teal-400 hover:bg-teal-300 text-slate-950 text-sm font-semibold transition-all shadow-[0_0_20px_rgba(45,212,191,0.35)] hover:scale-105 active:scale-95 cursor-pointer"
              >
                Start
              </button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            id="mobile-menu-btn"
            onClick={onOpenMobileMenu}
            className="p-2 rounded-xl bg-teal-950/50 border border-teal-500/30 text-teal-300 hover:bg-teal-900/50 transition-colors cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </header>
  );
}
