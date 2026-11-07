"""Build the sub-pages (download + legal pages Razorpay checks) into OUT_DIR.
Usage: build-pages.py OUT_DIR [--strict]
Each src/pages/<slug>.html starts with a comment holding `title | description`, then the body fragment.
{{co.key}} is filled from company.json; a missing value renders as a highlighted placeholder,
and --strict fails the build instead (use it for the live deploy)."""
import re, sys, json, os, glob, html
here = os.path.dirname(os.path.abspath(__file__))
out = sys.argv[1]; strict = '--strict' in sys.argv
tpl = open(f'{here}/home.template.html').read()
co = json.load(open(f'{here}/company.json'))

css_all = tpl[tpl.index('<style>') + 7: tpl.index('</style>')]
base = css_all[:css_all.index('/* ---------- hero')]
form = css_all[css_all.index('/* waitlist */'):css_all.index('/* responsive */')]
form = form[form.index('form.big'):]  # drop the homepage's .final section styling

inner = lambda s: re.sub(r'^<svg[^>]*>|</svg>\s*$', '', s.strip())
mark = inner(open(f'{here}/mark.svg').read())
wm = inner(open(f'{here}/wordmark.svg').read())
wm = re.sub(r'<defs>.*?</defs>', '', wm, flags=re.S).replace('fill="#0B0B0F"', 'fill="#F5F4F0"')

PAGE_CSS = """
/* ---------- sub-pages ---------- */
.wl{display:flex;gap:8px;padding:6px;border:1px solid var(--line-strong);border-radius:999px;background:var(--panel);width:min(480px,100%)}
.wl input{flex:1;min-width:0;background:transparent;border:0;color:var(--paper);font:500 15px var(--sans);padding:0 14px}
.wl input::placeholder{color:var(--dim)}
.wl input:focus{outline:none}
.wl:focus-within{border-color:var(--muted)}
.page{position:relative;isolation:isolate;padding-block:88px 120px}
.page::before{content:"";position:absolute;inset:-120px 0 auto;height:560px;z-index:-1;background:radial-gradient(55% 50% at 50% 0%,rgba(255,74,43,.12),transparent 70%)}
.doc{max-width:760px;margin-inline:auto}
.doc header{display:grid;gap:16px;padding-bottom:36px;margin-bottom:40px;border-bottom:1px solid var(--line)}
.doc h1{font-size:clamp(40px,6vw,68px)}
.doc .lede{font-size:18px;color:var(--text-2);max-width:60ch}
.doc .updated{font:500 12px var(--mono);letter-spacing:.04em;color:var(--dim)}
.doc h2{font-size:24px;letter-spacing:-.025em;margin:48px 0 14px;line-height:1.2}
.doc h3{font-size:17px;letter-spacing:-.01em;margin:28px 0 8px;line-height:1.3}
.doc p,.doc li{color:var(--text-2);font-size:16px;line-height:1.7}
.doc p+p,.doc ul+p{margin-top:14px}
form.sent > p{display:none}
.doc ul{margin:12px 0 0;padding-left:20px;display:grid;gap:8px}
.doc li::marker{color:var(--ember)}
.doc a{color:var(--paper);text-decoration:underline;text-decoration-color:rgba(255,74,43,.6);text-underline-offset:3px}
.doc a:hover{text-decoration-color:var(--ember)}
.doc strong{color:var(--paper);font-weight:700}
.summary{margin:0 0 8px;padding:22px 24px;border:1px solid var(--line);border-radius:16px;background:var(--panel);display:grid;gap:10px}
.summary b{font:600 11px var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--glow)}
.summary ul{margin:0}
.facts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:8px}
.fact{border:1px solid var(--line);border-radius:16px;background:var(--panel);padding:20px 22px;display:grid;gap:6px;align-content:start;min-width:0}
.fact span{font:600 11px var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.fact b,.fact a{font-size:17px;font-weight:700;color:var(--paper);overflow-wrap:anywhere}
.fact small{color:var(--muted);font-size:14px}
table.req{width:100%;border-collapse:collapse;margin-top:12px;font-size:15px}
table.req th,table.req td{text-align:left;padding:12px 14px;border-bottom:1px solid var(--line);vertical-align:top}
table.req th{font:600 11px var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
table.req td{color:var(--text-2)}
table.req td:first-child{color:var(--paper);font-weight:600}
mark.todo{background:rgba(255,181,71,.16);color:#FFB547;border:1px dashed rgba(255,181,71,.6);border-radius:6px;padding:0 6px;font:600 13px var(--mono)}
/* download */
.dl-hero{display:grid;justify-items:center;text-align:center;gap:18px;max-width:780px;margin-inline:auto}
.dl-hero h1{font-size:clamp(44px,7vw,88px)}
.dl-hero h1 em{font-style:normal;background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent}
.dl-hero p{font-size:18px;color:var(--text-2);max-width:56ch}
.os{margin-top:56px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}
.os-card{border:1px solid var(--line);border-radius:22px;background:var(--panel);padding:32px;display:grid;gap:18px;align-content:start}
.os-card .ic{width:44px;height:44px;border-radius:12px;background:var(--surface);border:1px solid var(--line);display:grid;place-items:center}
.os-card h2{font-size:28px;letter-spacing:-.03em}
.os-card p{color:var(--text-2);font-size:15px}
.os-card .state{display:inline-flex;align-items:center;gap:8px;font:600 11px var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--glow)}
.os-card .state::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--ember);box-shadow:0 0 0 4px var(--ember-tint)}
.steps{margin-top:96px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;counter-reset:s}
.step{border-top:1px solid var(--line-strong);padding-top:22px;display:grid;gap:10px;counter-increment:s}
.step::before{content:"0" counter(s);font:500 12px var(--mono);color:var(--glow)}
.step h3{font-size:20px;letter-spacing:-.02em}
.step p{color:var(--text-2);font-size:15px}
.join{margin-top:96px;border:1px solid var(--line);border-radius:24px;background:linear-gradient(180deg,rgba(255,74,43,.07),transparent 60%),var(--panel);padding:48px 32px}
.join h2{font-size:clamp(32px,4.5vw,52px);text-align:center}
.join > p{text-align:center;color:var(--text-2);margin-top:12px}
.faq{margin-top:96px;max-width:760px;margin-inline:auto}
.faq h2{font-size:clamp(30px,4vw,44px);margin-bottom:20px}
.faq details{border-bottom:1px solid var(--line);padding:18px 0}
.faq summary{cursor:pointer;font-weight:700;font-size:17px;list-style:none;display:flex;justify-content:space-between;gap:16px}
.faq summary::after{content:"+";color:var(--glow);font-weight:500}
.faq details[open] summary::after{content:"–"}
.faq details p{color:var(--text-2);margin-top:10px}
@media (max-width:960px){.nav-links{display:none}.os,.steps{grid-template-columns:1fr}}
@media (max-width:560px){.nav .btn{display:none}.wl{flex-direction:column;border-radius:18px}.wl input{padding:12px 14px}.facts{grid-template-columns:1fr}.page{padding-block:56px 88px}.os-card,.join{padding:24px}
  table.req,table.req tbody,table.req tr,table.req td{display:block}table.req thead{display:none}table.req td{border:0;padding:4px 0}table.req tr{padding:12px 0;border-bottom:1px solid var(--line)}}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important;scroll-behavior:auto!important}}
"""

FOOT_LINKS = [('/#features', 'Features'), ('/#pricing', 'Pricing'), ('/download', 'Download'), ('/contact', 'Contact'),
              ('/privacy', 'Privacy'), ('/terms', 'Terms'), ('/refunds', 'Refunds'), ('/shipping', 'Shipping')]

def footer():
    links = ''.join(f'<a href="{h}">{t}</a>' for h, t in FOOT_LINKS)
    return ('<footer>\n  <div class="wrap">\n    <div class="brand"><svg class="mk" style="width:24px;height:24px"><use href="#mark"/></svg>'
            f'<span>Verso by Agape Labs · {html.escape(co["legal_name"])}</span></div>\n'
            f'    <nav aria-label="Footer">{links}</nav>\n  </div>\n</footer>')

missing = set()
def fill(s):
    def rep(m):
        k = m.group(1); v = co.get(k)
        if v: return html.escape(str(v))
        missing.add(k)
        return f'<mark class="todo">{k.replace("_", " ")}</mark>'
    return re.sub(r'\{\{co\.(\w+)\}\}', rep, s)

def page(slug, title, desc, body, extra_js=''):
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{html.escape(title)} · Verso</title>
<meta name="robots" content="noindex, nofollow">
<meta name="description" content="{html.escape(desc)}">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:title" content="{html.escape(title)} · Verso">
<meta property="og:image" content="https://verso.video/og.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap">
<style>{base}{form}{PAGE_CSS}</style>
</head>
<body>
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><symbol id="mark" viewBox="0 0 120 120">{mark}</symbol></defs></svg>
<header class="nav">
  <div class="wrap">
    <a class="brand" href="/" aria-label="Verso home">
      <svg class="mk"><use href="#mark"/></svg>
      <svg class="wm" viewBox="0 -1140 5124 1170" aria-hidden="true">{wm}</svg>
    </a>
    <nav class="nav-links" aria-label="Main">
      <a href="/#features">Features</a><a href="/#modes">How it works</a><a href="/#pricing">Pricing</a><a href="/download"{' aria-current="page"' if slug=='download' else ''}>Download</a>
    </nav>
    <div class="nav-right"><a class="btn btn-ember btn-sm" href="/download#join">Join the waitlist</a></div>
  </div>
</header>
<main id="top" class="page">
{body}
</main>
{footer()}
{extra_js}
</body>
</html>
"""

WAITLIST_JS = open(f'{here}/pages/_waitlist.js').read()
os.makedirs(out, exist_ok=True)
for f in sorted(glob.glob(f'{here}/pages/*.html')):
    slug = os.path.basename(f)[:-5]
    src = open(f).read()
    m = re.match(r'\s*<!--\s*(.*?)\s*\|\s*(.*?)\s*-->\s*', src, re.S)
    title, desc = m.group(1), m.group(2)
    body = fill(src[m.end():])
    js = f'<script>{WAITLIST_JS}</script>' if 'data-wl' in body else ''
    open(f'{out}/{slug}.html', 'w').write(page(slug, title, desc, body, js))
if missing:
    msg = 'company.json missing: ' + ', '.join(sorted(missing))
    if strict: sys.exit('ERROR ' + msg)
    print('WARN ' + msg)
