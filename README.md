# linkme-worker

A personal "link in bio" page rendered by a Cloudflare Worker, inspired by
[ironicbadger/linkme](https://github.com/ironicbadger/linkme) — same idea
(single config file drives your links, profile, theme, and analytics), but
implemented as a plain JS Worker instead of a Go static-site generator, so it
deploys directly to Cloudflare with no build step.

## 1. Customize

Edit `config.json`:

- `profile` — name, bio, avatar image URL
- `theme` — colors, font, avatar shape (`circle` or `square`)
- `links` — the buttons on the page, each with a `title`, `url`, and optional emoji `icon`
- `socials` — small icon row underneath the links
- `analytics` — optionally fill in a Plausible domain, GoatCounter id, or GA id; leave blank to skip
- `seo` — page `<title>` and meta description

No rebuild step needed — the Worker reads `config.json` at deploy time.

## 2. Run locally

```bash
npm install
npm run dev
```

This starts a local dev server (via Wrangler) so you can preview changes
before deploying.

## 3. Deploy

```bash
npx wrangler login   # one-time, opens a browser to authorize
npm run deploy
```

Wrangler will print a `*.workers.dev` URL your page is live at.

## 4. (Optional) Use your own domain

If the domain is already on Cloudflare, uncomment the `routes` block in
`wrangler.toml` and set it to your subdomain, e.g.:

```toml
routes = [
  { pattern = "links.yourdomain.com", custom_domain = true }
]
```

Then redeploy with `npm run deploy`.

## Notes

- Everything renders server-side on each request — there's no client-side
  JS beyond whatever analytics snippet you enable.
- `cache-control` is set to 5 minutes in `src/index.js`; lower it (or remove
  it) while you're actively tweaking `config.json`, since Cloudflare's edge
  cache may otherwise serve a stale version briefly after a deploy.
