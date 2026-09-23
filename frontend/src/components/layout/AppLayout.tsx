import { Outlet } from 'react-router-dom';
import { Header } from './Header.js';

/**
 * Main layout wrapper (SNZ-036): fixed cinematic header shell plus routed
 * content. Top padding clears the fixed header; the footer lives in `App`.
 */
export function AppLayout() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-24 pb-16 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </>
  );
}
