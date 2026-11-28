/* CLIPIT desktop workspace. Presentation only; shared editing and OAuth remain in index.html. */
(function () {
  'use strict';
  function init() {
    if (!window.matchMedia('(min-width: 821px)').matches) return;
    const body=document.body;
    body.classList.add('clipit-desktop');
    const names={create:'Create',ai:'Context AI',clips:'Clips',watch:'Creator Watch',youtube:'YouTube Studio'};
    const descriptions={create:'Import footage and find your highlights.',ai:'Analyze dialogue and actions using an imported report.',clips:'Review clips, edit overlays, render and export.',watch:'Follow creators and check their latest long uploads.',youtube:'Connect, review and publish to your channel.'};
    const top=document.querySelector('.top');
    const brand=top?.querySelector('.logo');
    if(brand)brand.innerHTML='<span class="mark" aria-hidden="true">▶</span><div>CLIPIT <span class="desktop-brand-ai">AI</span><small>UNIFIED CREATOR STUDIO</small></div>';
    const shell=document.createElement('div'); shell.className='desktop-shell';
    const aside=document.createElement('aside');aside.className='desktop-sidebar';aside.setAttribute('aria-label','Desktop workspace');
    const heading=document.createElement('div');heading.className='desktop-sidebar-heading';heading.textContent='WORKSPACE';
    const nav=document.createElement('nav');nav.className='desktop-nav';nav.setAttribute('aria-label','CLIPIT sections');
    const icons={create:'✦',ai:'◈',clips:'▣',watch:'▷',youtube:'▶'};
    Object.keys(names).forEach(key=>{
      const b=document.createElement('button');b.type='button';b.dataset.screen=key;
      const symbol=document.createElement('span');symbol.className='desktop-nav-symbol';symbol.textContent=icons[key];
      const label=document.createElement('span');label.textContent=names[key];
      b.append(symbol,label);nav.append(b);
    });
    const note=document.createElement('p');note.className='desktop-side-note';
    note.textContent='One CLIPIT project. Desktop and mobile use the same editing tools.';
    aside.append(heading,nav,note);
    const main=document.querySelector('main.wrap');
    if(!main)return;
    main.before(shell);shell.append(aside,main);
    const bar=document.createElement('section');bar.className='desktop-page-heading';
    const label=document.createElement('div');label.className='desktop-page-kicker';label.textContent='DESKTOP WORKSPACE';
    const title=document.createElement('h1');const summary=document.createElement('p');
    bar.append(label,title,summary);main.prepend(bar);
    const oldHero=document.querySelector('.hero');
    if(oldHero)oldHero.hidden=true;
    const steps=document.querySelector('.steps');if(steps)steps.hidden=true;
    const cloud=Array.from(main.children).find(el=>el.classList?.contains('card')&&!el.classList.contains('results')&&!el.classList.contains('ytcard')&&!el.id);
    if(cloud)cloud.classList.add('desktop-legacy-cloud');
    function show(key) {
      if(!Object.prototype.hasOwnProperty.call(names,key))key='create';
      body.dataset.clipitScreen=key;
      title.textContent=names[key];summary.textContent=descriptions[key];
      nav.querySelectorAll('button').forEach(b=>{
        if(b.dataset.screen===key)b.setAttribute('aria-current','page');
        else b.removeAttribute('aria-current');
      });
      window.scrollTo({top:0,behavior:'auto'});
    }
    nav.addEventListener('click',e=>{
      const b=e.target.closest('button[data-screen]');if(b)show(b.dataset.screen);
    });
    const shortcuts=document.createElement('div');shortcuts.className='desktop-shortcuts';
    const preview=document.createElement('a');preview.href='./preview.html';preview.textContent='Preview desktop + mobile';preview.className='quiet buttonlike';
    shortcuts.append(preview);aside.append(shortcuts);
    // Allow Creator Watch to switch to Create/YouTube without assuming a phone navbar.
    window.ClipitNavigate=show;
    const clipCount=document.getElementById('clipCount');
    const clipsNav=nav.querySelector('[data-screen="clips"]');
    if(clipCount&&clipsNav){
      const sync=()=>{const n=parseInt(clipCount.textContent,10)||0;clipsNav.title=n? n+' proposed clips':'Review your clips';};
      new MutationObserver(sync).observe(clipCount,{childList:true,characterData:true,subtree:true});sync();
    }
    show('create');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();