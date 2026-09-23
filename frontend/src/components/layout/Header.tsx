import { Menu } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { SnyzerLogo } from '../brand/SnyzerLogo.js';
import { UserMenu } from '../../features/auth/UserMenu.js';
import { cn } from '../../lib/utils.js';
import { Button } from '../ui/button.js';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '../ui/sheet.js';

/**
 * Application header + navigation shell (SNZ-036), rebuilt with the
 * demo-reference visual language: fixed cinematic bar, teal glow accents,
 * and a highlighted Workspace pill with a live indicator.
 *
 * Routing contract is unchanged: brand + Workspace/History/Settings links,
 * account menu, and a mobile sheet drawer. The About link is additive only.
 */
const NAV_ITEMS = [
  { to: '/workspace', label: 'Workspace' },
  { to: '/history', label: 'History' },
  { to: '/settings', label: 'Settings' },
];

function desktopLinkClass({ isActive }: { isActive: boolean }): string {
  return cn(
    'rounded-lg px-3 py-1.5 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 active:scale-95',
    isActive
      ? 'border border-teal-400/20 bg-teal-400/10 font-semibold text-teal-300'
      : 'text-slate-300 hover:text-teal-300',
  );
}

function workspacePillClass({ isActive }: { isActive: boolean }): string {
  return cn(
    'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400',
    isActive
      ? 'border border-teal-400/40 bg-teal-400/15 text-teal-300 shadow-[0_0_15px_rgba(45,212,191,0.25)]'
      : 'border border-teal-500/20 bg-teal-950/40 text-slate-300 hover:text-teal-200',
  );
}

function drawerLinkClass({ isActive }: { isActive: boolean }): string {
  return cn(
    'rounded-xl px-3 py-2.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400',
    isActive
      ? 'border border-teal-500/40 bg-teal-950/70 text-teal-200'
      : 'text-slate-200 hover:bg-teal-950/40 hover:text-white',
  );
}

export function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <header className="fixed top-0 right-0 left-0 z-50 border-b border-teal-500/10 bg-[#030c14]/85 shadow-[0_4px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          aria-label="Snyzer home"
          className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
        >
          <SnyzerLogo />
        </Link>
        <div className="flex items-center gap-2 sm:gap-3 md:gap-6">
          <nav
            aria-label="Primary"
            className="hidden items-center gap-1 text-sm font-medium md:flex"
          >
            <NavLink to="/about" className={desktopLinkClass}>
              About Us
            </NavLink>
            <NavLink to="/workspace" className={workspacePillClass}>
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-400"
              />
              Workspace
            </NavLink>
            <NavLink to="/history" className={desktopLinkClass}>
              History
            </NavLink>
            <NavLink to="/settings" className={desktopLinkClass}>
              Settings
            </NavLink>
          </nav>
          <span aria-hidden="true" className="hidden h-6 w-px bg-slate-800 md:block" />
          <UserMenu />
          <span className="md:hidden">
            <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label="Open navigation menu"
                  className="border border-teal-500/30 bg-teal-950/50 text-teal-300 hover:bg-teal-900/50 hover:text-teal-200"
                >
                  <Menu className="h-5 w-5" aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="border-teal-500/20 bg-[#04101b]">
                <SheetTitle className="text-white">Snyzer</SheetTitle>
                <nav aria-label="Mobile" className="flex flex-col gap-1">
                  <NavLink
                    to="/about"
                    onClick={() => {
                      setDrawerOpen(false);
                    }}
                    className={drawerLinkClass}
                  >
                    About Us
                  </NavLink>
                  {NAV_ITEMS.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => {
                        setDrawerOpen(false);
                      }}
                      className={drawerLinkClass}
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </nav>
                <p className="font-code mt-6 text-[11px] text-teal-300/60">
                  Real-time writing revision · Supabase Auth · OpenRouter
                </p>
              </SheetContent>
            </Sheet>
          </span>
        </div>
      </div>
    </header>
  );
}
