import config from "../config.json";

// --- tiny helper to avoid HTML injection if you ever pull config from
// somewhere untrusted (KV, a form, etc). Safe no-op for static config too.
function esc(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function analyticsSnippet(analytics = {}) {
  let out = "";

  if (analytics.plausible?.domain) {
    out += `<script defer data-domain="${esc(analytics.plausible.domain)}" src="${esc(
      analytics.plausible.scriptUrl || "https://plausible.io/js/script.js"
    )}"></script>\n`;
  }

  if (analytics.goatcounter?.id) {
    const host = analytics.goatcounter.selfhosted
      ? analytics.goatcounter.id
      : `${analytics.goatcounter.id}.goatcounter.com`;
    out += `<script data-goatcounter="https://${esc(host)}/count" async src="//gc.zgo.at/count.js"></script>\n`;
  }

  if (analytics.googleAnalytics?.id) {
    const id = esc(analytics.googleAnalytics.id);
    out += `
<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${id}');
</script>\n`;
  }

  return out;
}

function renderPage(cfg) {
  const { profile, theme, links, socials, analytics, seo } = cfg;

  const linkItems = (links || [])
    .map(
      (l) => `
      <a class="link-card" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">
        <span class="link-icon">${l.icon ? esc(l.icon) : ""}</span>
        <span class="link-title">${esc(l.title)}</span>
      </a>`
    )
    .join("\n");

  const socialItems = (socials || [])
    .map(
      (s) => `
      <a class="social-icon" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" title="${esc(
        s.platform
      )}">${s.icon ? esc(s.icon) : esc(s.platform[0])}</a>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(seo?.title || profile?.name || "Links")}</title>
<meta name="description" content="${esc(seo?.description || "")}">
<meta property="og:title" content="${esc(seo?.title || profile?.name || "Links")}">
<meta property="og:description" content="${esc(seo?.description || "")}">
${profile?.avatar ? `<meta property="og:image" content="${esc(profile.avatar)}">` : ""}
<link rel="icon" href="data:,">
${analyticsSnippet(analytics)}
<style>
  :root {
    --bg: ${theme?.background || "#0f172a"};
    --card-bg: ${theme?.cardBackground || "#1e293b"};
    --text: ${theme?.text || "#f8fafc"};
    --muted: ${theme?.muted || "#94a3b8"};
    --accent: ${theme?.accent || "#38bdf8"};
    --font: ${theme?.font || "system-ui, sans-serif"};
    --avatar-radius: ${theme?.avatarShape === "square" ? "16px" : "50%"};
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    background: var(--bg);
    color: var(--text);
    font-family: var(--font);
    display: flex;
    justify-content: center;
    padding: 48px 16px 64px;
  }
  main {
    width: 100%;
    max-width: 480px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  img.avatar {
    width: 96px;
    height: 96px;
    border-radius: var(--avatar-radius);
    object-fit: cover;
    border: 2px solid var(--accent);
  }
  h1 { font-size: 1.4rem; margin: 16px 0 4px; }
  p.bio { color: var(--muted); margin: 0 0 24px; font-size: 0.95rem; line-height: 1.4; }
  .links { width: 100%; display: flex; flex-direction: column; gap: 12px; }
  .link-card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 18px;
    background: var(--card-bg);
    color: var(--text);
    border-radius: 12px;
    text-decoration: none;
    font-weight: 500;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    border: 1px solid rgba(255,255,255,0.06);
  }
  .link-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(0,0,0,0.25);
    border-color: var(--accent);
  }
  .link-icon { font-size: 1.1rem; }
  .socials { display: flex; gap: 16px; margin-top: 28px; }
  .social-icon {
    font-size: 1.3rem;
    text-decoration: none;
    opacity: 0.85;
  }
  .social-icon:hover { opacity: 1; }
  footer { margin-top: 40px; color: var(--muted); font-size: 0.75rem; }
  footer a { color: var(--muted); }
</style>
</head>
<body>
  <main>
    ${profile?.avatar ? `<img class="avatar" src="${esc(profile.avatar)}" alt="${esc(profile?.name || "")}">` : ""}
    <h1>${esc(profile?.name || "")}</h1>
    ${profile?.bio ? `<p class="bio">${esc(profile.bio)}</p>` : ""}

    <div class="links">
      ${linkItems}
    </div>

    ${socials?.length ? `<div class="socials">${socialItems}</div>` : ""}

    <footer>built with a Cloudflare Worker</footer>
  </main>
</body>
</html>`;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/robots.txt") {
      return new Response("User-agent: *\nAllow: /\n", {
        headers: { "content-type": "text/plain" },
      });
    }

    const html = renderPage(config);

    return new Response(html, {
      headers: {
        "content-type": "text/html;charset=UTF-8",
        // tweak/remove caching while you're iterating on the config
        "cache-control": "public, max-age=300",
      },
    });
  },
};
