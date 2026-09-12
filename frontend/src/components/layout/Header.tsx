import { Menu } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { UserMenu } from '../../features/auth/UserMenu.js';
import { cn } from '../../lib/utils.js';
import { Button } from '../ui/button.js';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '../ui/sheet.js';

/**
 * Application header + navigation shell (SNZ-036).
 *
 * Compact top bar: brand, section links with active-route indication, and
 * the account menu. Below the `md` breakpoint the links collapse into a
 * sheet drawer triggered by a labelled menu button.
 */
const NAV_ITEMS = [
  { to: '/workspace', label: 'Workspace' },
  { to: '/history', label: 'History' },
  { to: '/settings', label: 'Settings' },
];

function navLinkClass({ isActive }: { isActive: boolean }): string {
  return cn(
    'rounded-lg px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
    isActive
      ? 'bg-muted-light text-ink-light dark:bg-muted-dark dark:text-ink-dark'
      : 'text-subink-light hover:bg-muted-light hover:text-ink-light dark:text-subink-dark dark:hover:bg-muted-dark dark:hover:text-ink-dark',
  );
}

export function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <header className="border-b border-line-light dark:border-line-dark">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label="Open navigation menu"
                className="md:hidden"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetTitle>Snyzer</SheetTitle>
              <nav aria-label="Mobile" className="flex flex-col gap-1">
                {NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => {
                      setDrawerOpen(false);
                    }}
                    className={navLinkClass}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          <Link to="/" className="text-lg font-semibold tracking-tight">
            Snyzer
          </Link>
        </div>
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-subink-light sm:inline dark:text-subink-dark">
            AI-assisted writing
          </span>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
