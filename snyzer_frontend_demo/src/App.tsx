/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { PageRoute, UserSession, HistoryItem, ToneMode } from './types';
import { INITIAL_HISTORY } from './data/samples';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MobileDrawer from './components/MobileDrawer';
import GithubModal from './components/GithubModal';
import ShortcutsModal from './components/ShortcutsModal';
import HomeView from './components/HomeView';
import PlaygroundView from './components/PlaygroundView';
import HistoryView from './components/HistoryView';
import AboutView from './components/AboutView';
import SettingsView from './components/SettingsView';
import AuthModal from './components/AuthModal';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<PageRoute>('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGithubModalOpen, setIsGithubModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);

  // User session state with localStorage persistence
  const [userSession, setUserSession] = useState<UserSession>(() => {
    try {
      const saved = localStorage.getItem('snyzer_user_session');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      isLoggedIn: true,
      name: 'Meenakshi Chauhan',
      email: '99meenakshichauhan@gmail.com'
    };
  });

  // History state with localStorage persistence
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('snyzer_history_records');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_HISTORY;
  });

  // Playground re-open seed
  const [playgroundSeed, setPlaygroundSeed] = useState<{ text: string; tone: ToneMode } | null>(null);

  // Sync session to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('snyzer_user_session', JSON.stringify(userSession));
    } catch {
      // ignore
    }
  }, [userSession]);

  // Sync history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('snyzer_history_records', JSON.stringify(historyItems));
    } catch {
      // ignore
    }
  }, [historyItems]);

  const handleNavigate = (route: PageRoute) => {
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveToHistory = (item: HistoryItem) => {
    setHistoryItems(prev => [item, ...prev]);
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistoryItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSelectHistoryForPlayground = (text: string, tone: ToneMode) => {
    setPlaygroundSeed({ text, tone });
    setCurrentRoute('playground');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = (session: UserSession) => {
    setUserSession(session);
    setCurrentRoute('playground');
  };

  const handleLogout = () => {
    setUserSession({ isLoggedIn: false });
  };

  // Global Navigation & Power User Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // 1. Close active modals on Escape
      if (e.key === 'Escape') {
        if (isShortcutsModalOpen) {
          setIsShortcutsModalOpen(false);
          return;
        }
        if (isGithubModalOpen) {
          setIsGithubModalOpen(false);
          return;
        }
        if (isMobileMenuOpen) {
          setIsMobileMenuOpen(false);
          return;
        }
      }

      // 2. Open Shortcuts modal with Ctrl + K / Cmd + K
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsShortcutsModalOpen(prev => !prev);
        return;
      }

      // 3. Quick Navigation with Alt + 1, 2, 3, H
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        if (e.key === '1') {
          e.preventDefault();
          handleNavigate('playground');
        } else if (e.key === '2') {
          e.preventDefault();
          handleNavigate('history');
        } else if (e.key === '3') {
          e.preventDefault();
          handleNavigate('settings');
        } else if (e.key === 'h' || e.key === 'H') {
          e.preventDefault();
          handleNavigate('home');
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isShortcutsModalOpen, isGithubModalOpen, isMobileMenuOpen]);

  return (
    <div className="min-h-screen bg-[#030c14] text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-slate-950">
      {/* Navigation Header */}
      <Navbar
        currentRoute={currentRoute}
        onNavigate={handleNavigate}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onOpenGithub={() => setIsGithubModalOpen(true)}
        userSession={userSession}
        onLogout={handleLogout}
      />

      {/* Main Content View Switcher */}
      <main className="flex-1 flex flex-col">
        {currentRoute === 'home' && (
          <HomeView
            onNavigate={handleNavigate}
            onOpenGithub={() => setIsGithubModalOpen(true)}
          />
        )}

        {currentRoute === 'playground' && (
          <PlaygroundView
            onSaveToHistory={handleSaveToHistory}
            initialText={playgroundSeed?.text}
            initialTone={playgroundSeed?.tone}
            onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
          />
        )}

        {currentRoute === 'history' && (
          <HistoryView
            historyItems={historyItems}
            onSelectForPlayground={handleSelectHistoryForPlayground}
            onDeleteItem={handleDeleteHistoryItem}
            onNavigate={handleNavigate}
          />
        )}

        {currentRoute === 'about' && (
          <AboutView onNavigate={handleNavigate} />
        )}

        {currentRoute === 'settings' && (
          <div className="pt-24 pb-16 px-4 flex-1 flex flex-col">
            <SettingsView 
              onNavigate={handleNavigate}
              userSession={userSession}
              onUpdateUserSession={(newSession) => setUserSession(newSession)}
            />
          </div>
        )}

        {currentRoute === 'auth' && (
          <div className="pt-24 pb-16 px-4 flex items-center justify-center flex-1">
            <AuthModal
              onSuccess={handleLoginSuccess}
              isStandalone={true}
            />
          </div>
        )}
      </main>

      {/* Global Footer */}
      <Footer
        onNavigate={handleNavigate}
        onOpenGithub={() => setIsGithubModalOpen(true)}
        onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
      />

      {/* Mobile Drawer Navigation (Image 9) */}
      <MobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onNavigate={handleNavigate}
        onOpenGithub={() => setIsGithubModalOpen(true)}
      />

      {/* GitHub Repository Modal */}
      <GithubModal
        isOpen={isGithubModalOpen}
        onClose={() => setIsGithubModalOpen(false)}
      />

      {/* Global Keyboard Shortcuts Modal */}
      <ShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />
    </div>
  );
}
