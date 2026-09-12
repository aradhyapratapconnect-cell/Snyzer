import helmet from 'helmet';

/**
 * Security headers (SNZ-053).
 *
 * Helmet with explicit directives: framing denied everywhere
 * (`frame-ancestors 'none'` + `X-Frame-Options: DENY`), sniffing off,
 * HSTS, and a tight Content Security Policy. `style-src 'unsafe-inline'`
 * is required — Tailwind and Radix apply runtime inline styles; scripts
 * stay `'self'`-only. These headers protect documents, not the JSON API,
 * which is defended independently by auth + validation (CORS is never the
 * sole control).
 */
export function securityHeaders() {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        fontSrc: ["'self'"],
        connectSrc: ["'self'", 'https://*.supabase.co'],
        frameAncestors: ["'none'"],
        formAction: ["'self'"],
        baseUri: ["'self'"],
      },
    },
    frameguard: { action: 'deny' },
  });
}
