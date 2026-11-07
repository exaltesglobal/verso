"""Build the homepage mock. Usage: build-mock.py OUT [--inline]
--inline embeds images as data URIs (for the Artifact preview); otherwise they point at /img/*.webp."""
import re,sys,base64,os
here=os.path.dirname(os.path.abspath(__file__))
inner=lambda s: re.sub(r'^<svg[^>]*>|</svg>\s*$','',s.strip())
m=inner(open(f'{here}/mark.svg').read())
w=inner(open(f'{here}/wordmark.svg').read()); w=re.sub(r'<defs>.*?</defs>','',w,flags=re.S).replace('fill="#0B0B0F"','fill="#F5F4F0"')
t=open(f'{here}/home.template.html').read().replace('{{MARK}}',m).replace('{{WORDMARK}}',w)
inline='--inline' in sys.argv
cache={}
def img(mo):
    n=mo.group(1)
    if not inline: return f'/img/{n}.webp'
    if n not in cache:
        cache[n]='data:image/webp;base64,'+base64.b64encode(open(f'{here}/../public/img/{n}.webp','rb').read()).decode()
    return cache[n]
t=re.sub(r'\{\{IMG:([\w-]+)\}\}',img,t)
if not inline:
    head_end=t.index('</style>')+len('</style>')
    t=('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
       '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">\n<link rel="apple-touch-icon" href="/apple-touch-icon.png">\n'
       '<meta property="og:title" content="Verso: Long videos in. Reels out.">\n<meta property="og:image" content="https://verso.video/og.png">\n'
       + t[:head_end] + '\n</head>\n<body>\n' + t[head_end:] + '\n</body>\n</html>\n')
open(sys.argv[1],'w').write(t)
