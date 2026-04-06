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

## Contact form setup checklist (required before launch)

The contact form uses [Web3Forms](https://web3forms.com) — free, unlimited submissions, no account dashboard required. You need a unique access key for each client site.

1. Go to **https://web3forms.com**
2. Click **"Create your Access Key"**
3. Enter the email address where the client wants form submissions delivered
4. Solve the captcha
5. **The client will receive a verification email** — have them click the verify link to activate the key
6. You'll receive the access key (a UUID like `1a2b3c4d-5e6f-...`)
7. Open `src/data/client.json` and replace `REPLACE_WITH_REAL_WEB3FORMS_KEY` under `contact.accessKey` with the real key
8. Submit a test form on the deployed site to confirm it lands in the client's inbox

⚠️ **If you skip this step**, the form will render but submissions will fail with a Web3Forms error message to the visitor. Always do this before sharing the live site with the client.

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
