import re,sys
inner=lambda s: re.sub(r'^<svg[^>]*>|</svg>\s*$','',s.strip())
m=inner(open('mark.svg').read())
w=inner(open('wordmark.svg').read()); w=re.sub(r'<defs>.*?</defs>','',w,flags=re.S).replace('fill="#0B0B0F"','fill="#F5F4F0"')
t=open('home.template.html').read().replace('{{MARK}}',m).replace('{{WORDMARK}}',w)
open(sys.argv[1],'w').write(t)
