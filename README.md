# Trades Template

An Astro + Tailwind starter template for building websites for local trades and service businesses.

## Quick start

```bash
npm install
npm run dev    # local dev server at http://localhost:4321
npm run build  # production build → ./dist
```

## How it works

- All client-specific data lives in **`src/data/client.json`**. Change a field there and the whole site updates.
- Reusable UI lives in **`src/components/`**.
- Page templates live in **`src/pages/`**. Each `.astro` file in there becomes a route.
- Global styles and the Tailwind import live in **`src/styles/global.css`**.
- The shared HTML shell (head, fonts, body) lives in **`src/layouts/Layout.astro`**.

## Spinning up a new client site from this template

1. On GitHub, click "Use this template" → create a new repo for the client
2. Clone the new repo locally
3. Edit `src/data/client.json` with the new client's info
4. **Set up the contact form** (see checklist below)
5. `npm install && npm run dev` to preview
6. Connect the repo to Cloudflare Pages → automatic deploys on every push

## Contact form setup

The form is handled by a **Cloudflare Pages Function** at `functions/api/contact.ts`. It verifies a Cloudflare Turnstile captcha token, runs basic spam checks (honeypot field), and sends the submission as an email via [Resend](https://resend.com).

This replaces the old per-client form services (Web3Forms, Formspree, etc.) which all cap out at ~20 recipients on their paid tiers. With this setup, **every client is fully self-contained** and there's no per-account ceiling on the Bosque Works side.

### Per-client setup

For a normal new client, the `bootstrap-client.sh` script in the `bosqueworks-templates` repo handles all of this automatically. You just need to:

1. Edit `src/data/client.json` → `contact.recipientEmail` to the address that should receive form submissions
2. Edit `src/data/client.json` → `contact.turnstileSiteKey` to your Turnstile **public** site key (`0x...`)
3. The bootstrap script pre-creates the Cloudflare Pages project with `RESEND_API_KEY` and `TURNSTILE_SECRET_KEY` set as runtime environment variables — you don't have to touch these per-client

### One-time prerequisites (before bootstrapping the first client)

You need a Resend account and a Turnstile widget. Both are free.

1. **Resend**
   - Sign up at https://resend.com (free tier: 3,000 emails/month)
   - Add a sending domain (recommended: `mail.bosqueworks.com` — a subdomain so it doesn't fight with your Google Workspace email)
   - Add the SPF/DKIM/DMARC DNS records they give you to the zone in Cloudflare (auto-verifies in ~2 minutes)
   - Create an API key, save it in your secrets file via `setup-secrets.sh`
2. **Turnstile**
   - In the Cloudflare dashboard → Turnstile → Add Site
   - Hostnames should include all client domains and `*.pages.dev` for staging
   - Mode: **Managed**
   - Save the Site Key (public) and Secret Key (private) — both go in `setup-secrets.sh`

### How it flows in production

```
Visitor fills form on client site
        ↓
Client-side JS POSTs FormData (with cf-turnstile-response token) to /api/contact
        ↓
Pages Function (functions/api/contact.ts):
  • Validates honeypot
  • Verifies Turnstile token via Cloudflare's siteverify endpoint
  • Validates required fields
  • Sends email via Resend API to contact.recipientEmail
  • Returns JSON { ok: true } or { ok: false, error: "..." }
        ↓
Email lands in client's inbox, Reply-To set to the visitor's address
```

### Important: keep functions/ in sync with dist/

The build script (`npm run build`) runs `astro build` then `node scripts/copy-functions.mjs` to copy `functions/` into `dist/functions/`. Wrangler's `pages deploy ./dist` looks for functions inside the deploy directory, so this copy step is required. Don't remove it.

## Structure

```
trades-template/
├── public/                  # static assets (images, favicon, etc.)
├── src/
│   ├── components/          # reusable .astro components
│   ├── data/
│   │   └── client.json      # ← edit this for each client
│   ├── layouts/
│   │   └── Layout.astro     # shared <html> shell
│   ├── pages/
│   │   └── index.astro      # homepage
│   └── styles/
│       └── global.css       # Tailwind import + global styles
├── astro.config.mjs
└── package.json
```

## Commands

| Command           | Action                                       |
| :---------------- | :------------------------------------------- |
| `npm install`     | Installs dependencies                        |
| `npm run dev`     | Starts local dev server at `localhost:4321`  |
| `npm run build`   | Build your production site to `./dist/`      |
| `npm run preview` | Preview your build locally, before deploying |
