#!/usr/bin/env node
/**
 * Fail production web builds that would ship with a localhost API URL.
 * Netlify (and CI) set CI=true / NETLIFY=true.
 */

const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim() ?? '';
const isCi = process.env.CI === 'true' || process.env.NETLIFY === 'true';

if (!isCi) {
  process.exit(0);
}

if (!apiUrl) {
  console.error(
    'EXPO_PUBLIC_API_URL is required for production web builds (e.g. https://dars-api-oqtb.onrender.com/api/v1).',
  );
  process.exit(1);
}

if (/localhost|127\.0\.0\.1/i.test(apiUrl)) {
  console.error(
    `EXPO_PUBLIC_API_URL must not point at localhost in production builds (got: ${apiUrl}).`,
  );
  process.exit(1);
}

if (!/^https?:\/\//i.test(apiUrl) && !apiUrl.startsWith('/')) {
  console.error(`EXPO_PUBLIC_API_URL looks invalid (got: ${apiUrl}).`);
  process.exit(1);
}

console.log(`Web API URL OK: ${apiUrl}`);
