import { Outlet } from 'react-router-dom';
import { Header } from './Header.js';

/**
 * Main layout wrapper (SNZ-036): header shell plus routed content.
 * The outer page container and footer stay in `App`.
 */
export function AppLayout() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        <Outlet />
      </main>
    </>
  );
}
