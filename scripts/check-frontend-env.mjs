/**
 * Build-time guard for the frontend (SNZ-004).
 *
 * Vite only inlines `VITE_*` variables that exist when the build runs, so a
 * missing public variable would otherwise surface as a cryptic runtime
 * failure. This script runs as the frontend `prebuild` step and halts the
 * build with the missing key names. Values are never printed.
 *
 * Run from the `frontend/` workspace (npm sets cwd accordingly).
 */
const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY'];

const missing = required.filter((key) => {
  const value = process.env[key];
  return value === undefined || value.trim() === '';
});

if (missing.length > 0) {
  console.error(
    `Missing required frontend environment variables: ${missing.join(', ')}\n` +
      'Copy .env.example to .env and fill in the VITE_ values, then rebuild.',
  );
  process.exit(1);
}
