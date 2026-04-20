# Client images

Drop client photos here. They're served at `/images/<filename>` from the live site.

## Conventions

| Slot | client.json field | Recommended size | Notes |
|---|---|---|---|
| Hero photo | `hero.image` (e.g. `/images/hero.jpg`) | 1200×900 (4:3) | First impression — pick the strongest project photo |
| Hero alt text | `hero.imageAlt` | — | Defaults to `"<business> project"` if omitted |
| About photo | `about.image` (e.g. `/images/about.jpg`) | 1000×1000 (1:1) | Team shot, shop, or signature truck |
| About alt text | `about.imageAlt` | — | Defaults to `"<business> team or shop"` if omitted |
| Gallery photo (per item) | `gallery.items[].image` | 1280×800 (16:10) | Currently optional — gallery uses icons by default |

If `hero.image` / `about.image` is omitted, the template renders a branded icon card (no broken image, no placeholder text).

## Optimization

Run images through a compressor (squoosh.app, ImageOptim) before committing. Aim for under 200 KB each. Use `.jpg` for photos, `.png` only for logos/transparency.
