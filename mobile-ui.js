/* CLIPIT mobile experience: presentation and navigation only; leaves render/OAuth logic intact. */
(function () {
 'use strict';
 function start() {
   if (!window.matchMedia('(max-width: 820px)').matches || !document.querySelector('.layout')) return;
   const body=document.body, select=id=>document.getElementById(id);
   body.classList.add('clipit-mobile');
   const logo=document.querySelector('.top .logo');
   if (logo) logo.innerHTML='<span class="mark" aria-hidden="true">▶</span><div><div class="brand-name">CLIPIT <span>AI</span></div><small class="brand-sub">MOBILE CREATOR STUDIO</small></div>';
   const help=select('helpButton'); if(help) help.textContent='Help';
   const layout=document.querySelector('.layout'), hero=document.querySelector('.hero');
   const cloud=document.querySelector('.wrap > .card:not(.results):not(.ytcard):not(#contextStudio)');
   if (cloud) cloud.classList.add('legacy-cloud');
   if (hero) hero.innerHTML='<div class="eyebrow">YOUR CREATOR WORKSPACE</div><h1>Make moments <em>worth sharing.</em></h1><p>Turn your footage into polished Shorts. Discover highlights, fine-tune your clips, then review before publishing.</p><div class="hero-tags"><span><b>✓</b> Edit on your phone</span><span><b>✓</b> You approve uploads</span></div>';
   const headings=[
     [layout?.querySelector('.card:first-child .cardhead h2'),'Import your footage'],
     [layout?.querySelector('.card:nth-child(2) .cardhead h2'),'Find your highlights'],
     [select('contextStudio')?.querySelector('.cardhead h2'),'Context AI'],
     [document.querySelector('.results .cardhead h2'),'Your clip library'],
     [select('youtubeStudio')?.querySelector('.cardhead h2'),'YouTube Studio']
   ];
   headings.forEach(([el,title])=>{if(el)el.textContent=title;});
   const source=select('source'), count=select('clipCount');
   // Keep the manual cutting tools available without showing everything at once.
   const manualHeading=Array.from(layout?.querySelectorAll('h3')||[]).find(h=>h.textContent.includes('select a precise moment'));
   if(manualHeading) {
     const manualFields=manualHeading.nextElementSibling;
     const manualButtons=manualFields?.nextElementSibling;
     if(manualFields?.classList.contains('two') && manualButtons?.classList.contains('buttons')) {
       const details=document.createElement('details');
       details.className='advanced-controls';
       const summary=document.createElement('summary');
       summary.textContent='Manual trim & precise timestamps';
       manualHeading.parentNode.insertBefore(details,manualHeading);
       details.append(summary,manualHeading,manualFields,manualButtons);
     }
   }
   const status=document.createElement('div');
   status.className='mobile-status';
   status.setAttribute('role','status');
   status.innerHTML='<span class="status-light" aria-hidden="true"></span><strong id="mobileSourceText">No video selected yet</strong>';
   if(layout) layout.parentNode.insertBefore(status,layout);
   const workflow=document.createElement('div');
   workflow.className='mobile-workflow';
   workflow.innerHTML='<div><span class="number">01</span><strong>Import</strong><small>Pick footage</small></div><div><span class="number">02</span><strong>Discover</strong><small>Find moments</small></div><div><span class="number">03</span><strong>Finish</strong><small>Edit & save</small></div>';
   if(layout) layout.parentNode.insertBefore(workflow,layout);
   const shortcuts=document.createElement('div');
   shortcuts.className='mobile-shortcuts';
   shortcuts.innerHTML='<button type="button" data-screen-link="ai">✦ Context AI</button><button type="button" data-screen-link="clips">▣ View my clips</button>';
   if(layout) layout.parentNode.insertBefore(shortcuts,layout);
   const screens={
     ai:['CONTEXT ANALYSIS','Find highlights by meaning.','Import timed subtitles or an optional Colab analysis report to rank moments using dialogue and available visual evidence.'],
     clips:['MY WORKSPACE','Review & finish clips.','Adjust timestamps, edit overlays, and save finished videos to your phone.'],
     youtube:['PUBLISH & INSIGHTS','Your YouTube channel.','Connect your channel, review videos before upload, and explore available analytics.']
   };
   for(const [key,info] of Object.entries(screens)){
     const target=key==='ai'?select('contextStudio'):key==='clips'?document.querySelector('.results'):select('youtubeStudio');
     if (!target) continue;
     const intro=document.createElement('section');intro.className='screen-title';intro.dataset.screenTitle=key;
     const kicker=document.createElement('div');kicker.className='kicker';kicker.textContent=info[0];
     const heading=document.createElement('h1');heading.textContent=info[1];
     const summary=document.createElement('p');summary.textContent=info[2];
     intro.append(kicker,heading,summary);
     target.parentNode.insertBefore(intro,target);
   }
   const svg={
     create:'<path d="M12 5v14M5 12h14"/><rect x="3" y="3" width="18" height="18" rx="5"/>',
     ai:'<path d="M12 3l1.8 6.2L20 11l-6.2 1.8L12 19l-1.8-6.2L4 11l6.2-1.8L12 3z"/><path d="M19 18v4M17 20h4"/>',
     clips:'<rect x="3" y="3" width="18" height="18" rx="4"/><path d="m10 8 6 4-6 4z"/>',
     youtube:'<rect x="2.5" y="5" width="19" height="14" rx="5"/><path d="m10 9 5 3-5 3z"/>'
   };
   const names={create:'Create',ai:'Context AI',clips:'Clips',youtube:'YouTube'};
   const nav=document.createElement('nav');nav.className='mobile-nav';nav.setAttribute('aria-label','CLIPIT sections');
   for(const key of Object.keys(names)){
     const button=document.createElement('button');button.type='button';button.dataset.screen=key;
     button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+svg[key]+'</svg><span>'+names[key]+'</span>';
     if(key==='clips'){const badge=document.createElement('span');badge.className='nav-count';badge.id='mobileClipBadge';badge.hidden=true;button.append(badge);}
     nav.append(button);
   }
   document.body.append(nav);
   function screen(key) {
     if (!Object.hasOwn(names,key)) key='create';
     body.dataset.clipitScreen=key;
     for(const b of nav.querySelectorAll('button')) {
       const active=b.dataset.screen===key;
       if(active)b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current');
       b.setAttribute('aria-label',names[b.dataset.screen]+(active?', current section':''));
     }
     document.querySelectorAll('.screen-title').forEach(el=>{el.hidden=el.dataset.screenTitle!==key;});
     window.scrollTo({top:0,behavior:'auto'});
   }
   nav.addEventListener('click',e=>{const b=e.target.closest('button[data-screen]');if(b)screen(b.dataset.screen);});
   shortcuts.addEventListener('click',e=>{const b=e.target.closest('button[data-screen-link]');if(b)screen(b.dataset.screenLink);});
   const label=select('mobileSourceText');
   function updateSource() {
     const file=source?.files?.[0];
     label.textContent=file?'Loaded: '+file.name:'No video selected yet';
     label.title=file?.name||'';
   }
   source?.addEventListener('change',updateSource);
   function updateClipBadge() {
     const number=parseInt(count?.textContent||'0',10)||0;
     const badge=select('mobileClipBadge');
     if (!badge)return;
     badge.hidden=number<1;badge.textContent=String(number);
     const c=nav.querySelector('button[data-screen="clips"]');
     if(c)c.setAttribute('aria-label','Clips, '+number+' available');
   }
   const observer=new MutationObserver(updateClipBadge);
   if(count)observer.observe(count,{subtree:true,childList:true,characterData:true});
   // Existing YouTube OAuth, preview and upload confirmation remain unchanged.
   updateClipBadge();updateSource();screen('create');
   window.addEventListener('pageshow',()=>{updateSource();updateClipBadge();});
 }
 if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
 else start();
})();
