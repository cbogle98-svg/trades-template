// Build-time sanity check for src/data/client.json.
// Catches missing required fields and unreplaced placeholder strings
// (REPLACE_WITH_*, [bracketed], TODO) before they ship to a client.
//
// Set SKIP_PLACEHOLDER_CHECK=1 to allow placeholders during local dev.

import { readFileSync, existsSync } from 'node:fs';

const CLIENT_PATH = 'src/data/client.json';

if (!existsSync(CLIENT_PATH)) {
  console.error(`✗ ${CLIENT_PATH} not found`);
  process.exit(1);
}

const client = JSON.parse(readFileSync(CLIENT_PATH, 'utf8'));

const errors = [];
const warnings = [];

function require(path, value) {
  if (value === undefined || value === null || value === '') {
    errors.push(`Missing required field: ${path}`);
  }
}

require('business.name', client.business?.name);
require('business.shortName', client.business?.shortName);
require('business.phone', client.business?.phone);
require('business.email', client.business?.email);
require('business.industry', client.business?.industry);
require('business.address.city', client.business?.address?.city);
require('business.address.state', client.business?.address?.state);
require('brand.primary', client.brand?.primary);
require('brand.fontHeading', client.brand?.fontHeading);
require('brand.fontBody', client.brand?.fontBody);
require('hero.headline', client.hero?.headline);
require('hero.description', client.hero?.description);
require('contact.recipientEmail', client.contact?.recipientEmail);

// Optional structured hours for the HoursBadge component. If present, must
// be a 7-day map with each entry either null (closed) or {open, close} in
// HH:MM 24-hour format.
if (client.business?.hoursStructured) {
  const VALID_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const HM_RE = /^([01]?\d|2[0-3]):[0-5]\d$/;
  for (const day of VALID_DAYS) {
    const entry = client.business.hoursStructured[day];
    if (entry === undefined) {
      warnings.push(`business.hoursStructured.${day} not set — badge will treat as closed`);
      continue;
    }
    if (entry === null) continue;
    if (typeof entry !== 'object' || !entry.open || !entry.close) {
      errors.push(`business.hoursStructured.${day} must be null OR { open: "HH:MM", close: "HH:MM" }`);
      continue;
    }
    if (!HM_RE.test(entry.open)) errors.push(`business.hoursStructured.${day}.open invalid format (expected HH:MM, got "${entry.open}")`);
    if (!HM_RE.test(entry.close)) errors.push(`business.hoursStructured.${day}.close invalid format (expected HH:MM, got "${entry.close}")`);
  }
}

// Pro tier requires a `pages` array describing each multi-page route.
// Each page entry needs slug + title + sections (array of section keys).
const VALID_SECTIONS = new Set(['services', 'about', 'gallery', 'testimonials', 'serviceArea', 'contact']);
if (client.tier === 'pro') {
  if (!Array.isArray(client.pages) || client.pages.length === 0) {
    errors.push('tier=pro requires a non-empty `pages` array (each entry needs { slug, title, sections })');
  } else {
    client.pages.forEach((p, i) => {
      if (!p.slug) errors.push(`pages[${i}].slug missing`);
      if (!p.title) errors.push(`pages[${i}].title missing`);
      if (!Array.isArray(p.sections) || p.sections.length === 0) {
        errors.push(`pages[${i}].sections must be a non-empty array of section keys`);
      } else {
        p.sections.forEach((s) => {
          if (!VALID_SECTIONS.has(s)) errors.push(`pages[${i}].sections: "${s}" is not a valid section key (valid: ${[...VALID_SECTIONS].join(', ')})`);
        });
      }
    });
  }
}

const PLACEHOLDER_PATTERNS = [
  { rx: /REPLACE_WITH_/i, label: 'unreplaced REPLACE_WITH_ token' },
  { rx: /^\[.*\]$/, label: 'unreplaced [bracketed] placeholder' },
  { rx: /\bTODO\b/i, label: 'TODO marker' },
  { rx: /lorem ipsum/i, label: 'lorem ipsum placeholder' }
];

function scan(value, path) {
  if (typeof value === 'string') {
    for (const { rx, label } of PLACEHOLDER_PATTERNS) {
      if (rx.test(value)) warnings.push(`${path}: ${label} → "${value.slice(0, 60)}"`);
    }
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => scan(v, `${path}[${i}]`));
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) scan(v, `${path}.${k}`);
  }
}

scan(client, 'client');

if (errors.length) {
  console.error('✗ client.json validation failed:');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

if (warnings.length && !process.env.SKIP_PLACEHOLDER_CHECK) {
  console.error('✗ client.json contains unfilled placeholders (set SKIP_PLACEHOLDER_CHECK=1 to bypass):');
  for (const w of warnings) console.error(`  - ${w}`);
  process.exit(1);
}

console.log(`  ✓ client.json validated (${client.business.name})`);
