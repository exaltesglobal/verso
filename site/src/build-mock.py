"""Build the homepage mock. Usage: build-mock.py OUT [--inline]
--inline embeds images as data URIs (for the Artifact preview); otherwise they point at /img/*.webp."""
import re,sys,base64,os
here=os.path.dirname(os.path.abspath(__file__))
inner=lambda s: re.sub(r'^<svg[^>]*>|</svg>\s*$','',s.strip())
m=inner(open(f'{here}/mark.svg').read())
w=inner(open(f'{here}/wordmark.svg').read()); w=re.sub(r'<defs>.*?</defs>','',w,flags=re.S).replace('fill="#0B0B0F"','fill="#F5F4F0"')
t=open(f'{here}/home.template.html').read().replace('{{MARK}}',m).replace('{{WORDMARK}}',w)

# ---- footage sections: include only assets that exist ----
imgdir=f'{here}/../public/img'
have=lambda n,e: os.path.exists(f'{imgdir}/{n}.{e}')
WALL=[('wall-01','Podcast','0:42'),('wall-02','Food','0:31'),('wall-03','Fitness','0:28'),('wall-04','Travel','0:35'),('wall-05','Music','0:24'),
      ('wall-06','Fashion','0:19'),('wall-07','Tech','0:46'),('wall-08','Dance','0:22'),('wall-09','Founder','0:38'),('wall-10','Classes','0:51')]
def tile(n,label,dur):
    return (f'<div class="reel"><video muted loop playsinline preload="none" poster="{{{{IMG:{n}}}}}" data-src="{{{{VID:{n}}}}}"></video>'
            f'<i>{dur}</i><b>{label}</b></div>')
tiles=[tile(*w) for w in WALL if have(w[0],'mp4') and have(w[0],'webp')]
if len(tiles)>=6:
    half=(len(tiles)+1)//2; r1=''.join(tiles[:half]); r2=''.join(tiles[half:])
    wall=('  <section class="wall">\n    <div class="wrap"><div class="head"><span class="eyebrow">Made with Verso</span>'
          '<h2>Made for every kind of creator.</h2><p>Podcasts, kitchens, gyms, classrooms and stages. If you film it, Verso turns it into reels.</p></div></div>\n'
          f'    <div class="wall-rows" aria-hidden="true"><div class="wall-row">{r1}{r1}</div><div class="wall-row r2">{r2}{r2}</div></div>\n  </section>')
else: wall=''
WHO=[('who-podcaster','Podcasters','Turn one episode into a week of reels.'),('who-educator','Educators','Clip every lesson into short, sharp takeaways.'),
     ('who-brand','Brands','Product videos, cut for every platform.'),('who-youtuber','YouTubers','Shorts from every upload, ready to post.')]
cards=[f'<article class="who-card" style="background-image:url({{{{IMG:{n}}}}})"><h3>{t}</h3><p>{d}</p></article>' for n,t,d in WHO if have(n,'webp')]
who=('  <section class="block">\n    <div class="wrap"><div class="head"><span class="eyebrow">Who it\'s for</span><h2>Built for people who make things.</h2>'
     f'<p>Whatever you record, Verso does the slow part so you can post more often.</p></div>\n      <div class="who">{"".join(cards)}</div>\n    </div>\n  </section>') if len(cards)==4 else ''
finalbg=('    <video class="bgv" muted loop playsinline preload="none" poster="{{IMG:final-bg}}" data-src="{{VID:final-bg}}" aria-hidden="true"></video><div class="bgv-shade"></div>'
         if have('final-bg','mp4') and have('final-bg','webp') else '')
t=t.replace('{{WALL}}',wall).replace('{{WHO}}',who).replace('{{FINALBG}}',finalbg)
# auto-cut thumbnails: use short clips when present
for i,old in enumerate(['clip-podcast','clip-vlog','clip-food','clip-teacher'],1):
    n=f'feat-clip-0{i}'
    if have(n,'mp4') and have(n,'webp'):
        t=t.replace(f'<span class="th" style="background-image:url({{{{IMG:{old}}}}})"></span>',
                    f'<span class="th"><video muted loop playsinline preload="none" poster="{{{{IMG:{n}}}}}" data-src="{{{{VID:{n}}}}}"></video></span>')
if have('feat-captions','mp4') and have('feat-captions','webp'):
    t=t.replace('<div class="capphone" style="background-image:url({{IMG:creator-portrait}})">',
                '<div class="capphone"><video muted loop playsinline preload="none" poster="{{IMG:feat-captions}}" data-src="{{VID:feat-captions}}"></video>')
inline='--inline' in sys.argv
cache={}
import hashlib
ver=lambda f: hashlib.md5(open(f,'rb').read()).hexdigest()[:8]  # cache-busting: browsers cached old images for 30 days
def img(mo):
    n=mo.group(1)
    if not inline: return f'/img/{n}.webp?v='+ver(f'{here}/../public/img/{n}.webp')
    if n not in cache:
        cache[n]='data:image/webp;base64,'+base64.b64encode(open(f'{here}/../public/img/{n}.webp','rb').read()).decode()
    return cache[n]
t=re.sub(r'\{\{IMG:([\w-]+)\}\}',img,t)
def vid(mo):
    n=mo.group(1); f=f'{here}/../public/img/{n}.mp4'
    if not os.path.exists(f): return ''
    if not inline: return f'/img/{n}.mp4?v='+ver(f)
    return 'data:video/mp4;base64,'+base64.b64encode(open(f,'rb').read()).decode()
t=re.sub(r'\{\{VID:([\w-]+)\}\}',vid,t)
if not inline:
    head_end=t.index('</style>')+len('</style>')
    t=('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
       '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">\n<link rel="apple-touch-icon" href="/apple-touch-icon.png">\n'
       '<meta property="og:title" content="Verso: Long videos in. Reels out.">\n<meta property="og:image" content="https://verso.video/og.png">\n'
       + t[:head_end] + '\n</head>\n<body>\n' + t[head_end:] + '\n</body>\n</html>\n')
open(sys.argv[1],'w').write(t)
