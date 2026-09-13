/**
 * Production smoke test (SNZ-060).
 *
 * Usage: `BASE_URL=https://api.example.com npm run smoke`
 *
 * GETs `<BASE_URL>/api/v1/health` and requires HTTP 200 with
 * `{ status: 'ok' }`. Any failure (connection refused, non-200, wrong body,
 * timeout) prints the cause and exits 1 so deploy pipelines gate on it.
 * No credentials needed — the health endpoint is intentionally public.
 */
const BASE_URL = process.env['BASE_URL'] ?? 'http://localhost:5000';
const TIMEOUT_MS = 10_000;

async function main() {
  const url = `${BASE_URL.replace(/\/$/, '')}/api/v1/health`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (response.status !== 200) {
      console.error(`[smoke] FAIL ${url} returned HTTP ${response.status}`);
      process.exitCode = 1;
      return;
    }
    const body = await response.json().catch(() => null);
    if (body === null || typeof body !== 'object' || body['status'] !== 'ok') {
      console.error(`[smoke] FAIL ${url} returned unexpected body: ${JSON.stringify(body)}`);
      process.exitCode = 1;
      return;
    }
    console.log(`[smoke] OK ${url} -> 200 { status: 'ok' }`);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`[smoke] FAIL could not reach ${url}: ${reason}`);
    process.exitCode = 1;
  } finally {
    clearTimeout(timer);
  }
}

await main();
