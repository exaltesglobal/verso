(() => {
const f=document.querySelector('form.big'); if(!f) return;
f.addEventListener('submit',async e=>{
  e.preventDefault();
  const btn=f.querySelector('button'); btn.disabled=true;
  const data={ email:f.querySelector('input[type=email]').value.trim(),
    make:[...f.querySelectorAll('input[name=make]:checked')].map(i=>i.value),
    os:(f.querySelector('input[name=os]:checked')||{}).value||'', lang:'en', hp:(document.getElementById('hp')||{}).value||'' };
  let ok=false; try{ ok=(await fetch('/waitlist.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})).ok; }catch(_){}
  btn.disabled=false;
  const d=f.querySelector('.done');
  d.querySelector('b').textContent= ok ? "You're on the list." : "That didn't go through.";
  d.querySelector('span').textContent= ok ? "We'll email your invite code and download link when your batch opens." : "Please check your connection and try again in a moment.";
  f.classList.add('sent'); if(!ok) setTimeout(()=>f.classList.remove('sent'),3500);
});
if(/Mac/i.test(navigator.platform||navigator.userAgent)){ const m=document.getElementById('os-mac'); if(m) m.checked=true; }
})();
