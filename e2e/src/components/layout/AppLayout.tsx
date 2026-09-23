import { Outlet } from 'react-router-dom';
import { Header } from './Header.js';

/**
 * Main layout wrapper (SNZ-036): fixed cinematic header shell plus routed
 * content. A skip link targets the main landmark for keyboard users; top
 * padding clears the fixed header; the footer lives in `App`.
 */
export function AppLayout() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only z-[60] rounded-full border border-teal-400/50 bg-[#04111c] px-4 py-2 text-sm font-semibold text-teal-200 focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:outline-none focus:ring-2 focus:ring-teal-400"
      >
        Skip to content
      </a>
      <Header />
      <main
        id="main-content"
        className="mx-auto w-full max-w-7xl flex-1 px-4 pt-24 pb-16 sm:px-6 lg:px-8"
      >
        <Outlet />
      </main>
    </>
  );
}
