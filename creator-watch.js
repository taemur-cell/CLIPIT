/* CLIPIT Creator Watch pilot — read-only discovery, no YouTube media downloads. */
(function (root) {
  'use strict';
  const parseDuration = (value) => {
    const m = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/.exec(String(value || ''));
    return m ? (Number(m[1] || 0)*86400 + Number(m[2] || 0)*3600 + Number(m[3] || 0)*60 + Number(m[4] || 0)) : 0;
  };
  const normalizeSubscriptions = (items) => (Array.isArray(items) ? items : []).map(item => ({
    id: String(item?.snippet?.resourceId?.channelId || '').trim(),
    title: String(item?.snippet?.title || 'Untitled creator').slice(0, 120)
  })).filter(item => /^UC[A-Za-z0-9_-]{22}$/.test(item.id));
  const thumbnailCandidates = thumbs => [...new Set(['medium','high','default','standard','maxres']
    .map(size => thumbs?.[size]?.url)
    .filter(url => typeof url === 'string' && /^https:\/\//i.test(url)))];
  const formatViewCount = value => {
    if (value === undefined || value === null || value === '') return 'Views unavailable';
    const count = Number(value);
    if (!Number.isSafeInteger(count) || count < 0) return 'Views unavailable';
    if (count < 1000) return count.toLocaleString('en-US') + ' views';
    if (count < 1000000) return (count / 1000).toFixed(count < 10000 ? 1 : 0).replace(/\.0$/, '') + 'K views';
    if (count < 1000000000) return (count / 1000000).toFixed(count < 10000000 ? 1 : 0).replace(/\.0$/, '') + 'M views';
    return (count / 1000000000).toFixed(count < 10000000000 ? 1 : 0).replace(/\.0$/, '') + 'B views';
  };
  // Use a browser-gesture-driven Android intent, with a normal YouTube web fallback.
  const videoLinks = videoId => {
    const id = String(videoId || '').trim();
    if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return null;
    const web = 'https://www.youtube.com/watch?v=' + id;
    return {
      web,
      android: 'intent://www.youtube.com/watch?v=' + id
        + '#Intent;scheme=https;package=com.google.android.youtube;S.browser_fallback_url='
        + encodeURIComponent(web) + ';end',
      ios: 'youtube://www.youtube.com/watch?v=' + id
    };
  };
  root.ClipitCreatorWatchUtils = {parseDuration, normalizeSubscriptions, thumbnailCandidates, formatViewCount, videoLinks};
  if (!root.document) return;

  function init() {
    const byId = id => document.getElementById(id);
    if (!byId('creatorWatch')) return;
    const btnImport = byId('watchImportSubscriptions');
    const btnMore = byId('watchMore');
    const btnRefresh = byId('watchRefresh');
    const btnConnect = byId('watchConnect');
    const search = byId('watchSearch');
    const status = byId('watchStatus');
    const subsBox = byId('watchSubscriptions');
    const favBox = byId('watchFavorites');
    const videosBox = byId('watchVideos');
    const count = byId('watchCount');
    const last = byId('watchLastChecked');

    let ownerId = null;
    let subscriptions = [];
    let nextPageToken = '';
    let favorites = [];
    let seen = {};
    let busy = false;

    const ui = (tag, className, text) => {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (text !== undefined) node.textContent = String(text);
      return node;
    };
    // One reusable picker for all Creator Watch video cards.
    const chooser = ui('dialog', 'watch-choice-dialog');
    chooser.setAttribute('aria-labelledby', 'watchChoiceTitle');
    const chooserTitle = ui('h3', '', 'Open YouTube video');
    chooserTitle.id = 'watchChoiceTitle';
    const chooserHelp = ui('p', 'watch-muted', 'Choose the YouTube app, or watch in a new browser tab without handing the link to the installed app.');
    const chooserActions = ui('div', 'watch-choice-actions');
    const chooserApp = ui('a', 'primary', 'Open in YouTube App');
    const chooserWeb = ui('a', 'secondary', 'Open in Browser');
    const chooserCancel = ui('button', 'quiet', 'Cancel');
    chooserCancel.type = 'button';
    chooserCancel.onclick = () => chooser.close();
    chooserApp.addEventListener('click', () => chooser.close());
    chooserWeb.addEventListener('click', () => chooser.close());
    chooserWeb.target = '_blank';
    chooserWeb.rel = 'noopener noreferrer';
    chooserActions.append(chooserApp, chooserWeb, chooserCancel);
    chooser.append(chooserTitle, chooserHelp, chooserActions);
    byId('creatorWatch').append(chooser);
    function showViewerChoice(videoId) {
      const links = videoLinks(videoId);
      if (!links) { message('Cannot open this YouTube video link.', true); return; }
      const agent = navigator.userAgent || '';
      chooserApp.href = /Android/i.test(agent) ? links.android
        : /iPhone|iPad|iPod/i.test(agent) ? links.ios : links.web;
      if (/Android|iPhone|iPad|iPod/i.test(agent)) chooserApp.removeAttribute('target');
      else chooserApp.target = '_blank';
      // Linking directly to youtube.com can trigger Android App Links and open the app.
      // A CLIPIT-hosted tab with the official embedded YouTube player is a browser-safe route.
      chooserWeb.href = './watch.html?v=' + encodeURIComponent(videoId);
      if (!chooser.open) chooser.showModal();
    }
    const saveKey = id => 'clipit_creator_watch_v1_' + id;
    function readSaved(id) {
      try {
        const raw = JSON.parse(localStorage.getItem(saveKey(id)) || '{}');
        const candidates = Array.isArray(raw.favorites) ? raw.favorites : [];
        favorites = candidates.filter(x => x && /^UC[A-Za-z0-9_-]{22}$/.test(x.id)).slice(0, 3).map(x => ({id:x.id,title:String(x.title || 'Creator').slice(0,120)}));
        seen = raw.seen && typeof raw.seen === 'object' && !Array.isArray(raw.seen) ? raw.seen : {};
      } catch (e) { favorites = []; seen = {}; }
    }
    function save() {
      if (!ownerId) return;
      try { localStorage.setItem(saveKey(ownerId), JSON.stringify({favorites,seen})); }
      catch(e) { message('Your browser could not save the creator library locally.', true); }
    }
    function connected() {
      return typeof ytReady === 'function' && ytReady() && typeof yt !== 'undefined' && Boolean(yt.channel?.id);
    }
    function message(text, error) {
      status.textContent = text;
      status.classList.toggle('error', Boolean(error));
    }
    function updateButtons() {
      const ready = connected() && !busy;
      btnImport.disabled = !ready;
      btnRefresh.disabled = !ready || favorites.length === 0;
      btnMore.hidden = !nextPageToken;
      btnMore.disabled = !ready || !nextPageToken;
      search.disabled = !subscriptions.length || busy;
      count.textContent = favorites.length + ' / 3 saved';
    }
    function syncConnection() {
      const channelId = connected() ? yt.channel.id : null;
      if (channelId !== ownerId) {
        ownerId = channelId;
        subscriptions = [];
        nextPageToken = '';
        favorites = [];
        seen = {};
        videosBox.replaceChildren();
        if (ownerId) {
          readSaved(ownerId);
          message('Connected. Import subscriptions and select up to 3 creators.');
        } else {
          message('Connect your YouTube account in the YouTube tab to import subscriptions.');
        }
      }
      btnConnect.hidden = Boolean(ownerId);
      renderFavorites();
      renderSubscriptions();
      updateButtons();
    }
    function renderFavorites() {
      favBox.replaceChildren();
      if (!favorites.length) { favBox.append(ui('p', 'watch-muted', 'No creators selected yet. Import your subscriptions to get started.')); }
      favorites.forEach(f => {
        const row = ui('div', 'watch-line');
        const title = ui('div', 'watch-line-text', f.title);
        const remove = ui('button', 'quiet', 'Remove');
        remove.type = 'button';
        remove.onclick = () => {
          favorites = favorites.filter(x=>x.id!==f.id);
          save(); renderFavorites(); renderSubscriptions(); updateButtons();
          videosBox.replaceChildren(); last.textContent = 'Refresh uploads to update the feed.';
        };
        row.append(title, remove); favBox.append(row);
      });
      count.textContent = favorites.length + ' / 3 saved';
    }
    function renderSubscriptions() {
      subsBox.replaceChildren();
      if (!subscriptions.length) return;
      const needle = search.value.trim().toLocaleLowerCase();
      const results = subscriptions.filter(s => s.title.toLocaleLowerCase().includes(needle)).slice(0, 50);
      if (!results.length) subsBox.append(ui('p', 'watch-muted', 'No matching subscriptions in the loaded pages.'));
      results.forEach(s => {
        const row = ui('div', 'watch-line');
        const name = ui('div', 'watch-line-text', s.title);
        const already = favorites.some(x=>x.id===s.id);
        const add = ui('button', already ? 'secondary' : 'quiet', already ? 'Saved' : 'Add');
        add.type = 'button'; add.disabled = already || favorites.length>=3 || busy;
        add.onclick = () => {
          if (favorites.length>=3 || favorites.some(x=>x.id===s.id)) return;
          favorites.push({id:s.id,title:s.title}); save();
          renderFavorites(); renderSubscriptions(); updateButtons();
        };
        row.append(name, add); subsBox.append(row);
      });
      if (subscriptions.length > 50 && !needle) subsBox.append(ui('p', 'watch-muted', 'Showing 50 subscriptions. Search above to narrow the list.'));
    }
    async function loadSubscriptions(append) {
      if (!connected() || busy) return;
      busy=true; updateButtons();
      message(append ? 'Loading more subscriptions...' : 'Reading subscriptions from YouTube...');
      try {
        const params = {part:'snippet', mine:'true', maxResults:50};
        if (append && nextPageToken) params.pageToken=nextPageToken;
        const data = await ytApi(ytURL('https://www.googleapis.com/youtube/v3/subscriptions',params));
        const found = normalizeSubscriptions(data.items);
        const combined = append ? [...subscriptions,...found] : found;
        subscriptions = [...new Map(combined.map(x=>[x.id,x])).values()].sort((a,b)=>a.title.localeCompare(b.title));
        nextPageToken = data.nextPageToken || '';
        renderSubscriptions();
        message(subscriptions.length + ' subscribed creators loaded. Add up to 3 to your library.');
      } catch(e) {
        message('Could not load subscriptions: '+ e.message + '. Confirm YouTube Data API access and reconnect if needed.',true);
      } finally { busy=false; updateButtons(); renderSubscriptions(); }
    }
    function channelUrl(videoId) {
      return 'https://www.youtube.com/watch?v=' + encodeURIComponent(videoId);
    }
    function dateLabel(raw) {
      const d = new Date(raw);
      return Number.isFinite(d.getTime()) ? d.toLocaleDateString() : '';
    }
    function secondsLabel(seconds) {
      const s = Math.max(0,Math.floor(seconds));
      return Math.floor(s/60) + 'm ' + String(s%60).padStart(2,'0') + 's';
    }
    async function refreshVideos() {
      if (!connected() || busy || !favorites.length) return;
      busy=true; updateButtons(); message('Checking the recent uploads for your saved creators...');
      try {
        const chan = await ytApi(ytURL('https://www.googleapis.com/youtube/v3/channels',{
          part:'contentDetails', id:favorites.map(f=>f.id).join(',')
        }));
        const playlists = (chan.items || []).map(c => ({id:c.id, playlist:c.contentDetails?.relatedPlaylists?.uploads})).filter(c=>c.playlist);
        const uploads = await Promise.all(playlists.map(async c => {
          const d = await ytApi(ytURL('https://www.googleapis.com/youtube/v3/playlistItems',{
            part:'contentDetails',playlistId:c.playlist,maxResults:10
          }));
          return {id:c.id, videos:(d.items || []).map(x=>x.contentDetails?.videoId).filter(Boolean)};
        }));
        const ids = [...new Set(uploads.flatMap(x=>x.videos))];
        const vdata = ids.length ? await ytApi(ytURL('https://www.googleapis.com/youtube/v3/videos',{
          part:'snippet,contentDetails,statistics',id:ids.join(',')
        })) : {items:[]};
        const ownerByVideo = new Map();
        uploads.forEach(u=>u.videos.forEach(id=>ownerByVideo.set(id,u.id)));
        const results = (vdata.items || []).map(v => ({
          id:v.id, owner: ownerByVideo.get(v.id) || v.snippet?.channelId,
          title: String(v.snippet?.title || 'Untitled video').slice(0,200),
          published: v.snippet?.publishedAt || '',
          duration: parseDuration(v.contentDetails?.duration),
          views: formatViewCount(v.statistics?.viewCount),
          thumbnailUrls: thumbnailCandidates(v.snippet?.thumbnails),
          live: v.snippet?.liveBroadcastContent
        })).filter(v=>v.duration>=600 && v.live!=='live' && v.live!=='upcoming')
          .sort((a,b)=>Date.parse(b.published)-Date.parse(a.published)).slice(0,24);
        const previous = {...seen};
        videosBox.replaceChildren();
        if (!results.length) videosBox.append(ui('p','watch-muted','No videos longer than 10 minutes were found among the latest 10 uploads per creator.'));
        results.forEach(v => {
          const creator = favorites.find(f=>f.id===v.owner);
          const hasBaseline = Array.isArray(previous[v.owner]);
          const isNew = hasBaseline && !previous[v.owner].includes(v.id);
          const row = ui('div','watch-video');
          const main = ui('div','watch-video-main');
          const thumb = ui('button','watch-thumbnail');
          thumb.type = 'button';
          thumb.setAttribute('aria-label','Choose how to view ' + v.title + ' on YouTube');
          thumb.addEventListener('click', () => showViewerChoice(v.id));
          const preview = ui('img','watch-thumb-image');
          preview.alt = '';
          preview.loading = 'lazy';
          preview.decoding = 'async';
          const fallback = ui('span','watch-thumb-fallback','Preview unavailable');
          fallback.hidden = v.thumbnailUrls.length > 0;
          if (v.thumbnailUrls.length) {
            let index = 0;
            const loadNext = () => {
              if (index < v.thumbnailUrls.length) preview.src = v.thumbnailUrls[index++];
              else { preview.hidden = true; fallback.hidden = false; }
            };
            preview.addEventListener('error',loadNext);
            loadNext();
          } else preview.hidden = true;
          thumb.append(preview, fallback, ui('span','watch-thumb-duration',secondsLabel(v.duration)));
          const details = ui('div','watch-video-details');
          const label = ui('div','watch-video-title',v.title);
          const meta = ui('p','watch-muted',(creator?.title || 'Creator') + ' · ' + secondsLabel(v.duration) + ' · ' + v.views + ' · ' + dateLabel(v.published) + (isNew ? ' · NEW' : ' · Recent'));
          details.append(label,meta);
          main.append(thumb,details);
          const actions = ui('div','watch-actions');
          const open = ui('button','quiet buttonlike','View on YouTube');
          open.type = 'button';
          open.onclick = () => showViewerChoice(v.id);
          const importFile = ui('button','secondary','Import permitted file');
          importFile.type='button';
          importFile.onclick=()=>{
            if (typeof window.ClipitNavigate === "function") window.ClipitNavigate("create");
            else document.querySelector('.mobile-nav button[data-screen="create"]')?.click();
            byId('source')?.click();
          };
          actions.append(open,importFile);row.append(main,actions);videosBox.append(row);
        });
        uploads.forEach(u => {
          const old = Array.isArray(seen[u.id]) ? seen[u.id] : [];
          seen[u.id] = [...new Set([...u.videos,...old])].slice(0,60);
        });
        save(); last.textContent='Last checked: '+new Date().toLocaleString();
        const newItems=results.filter(v=>Array.isArray(previous[v.owner])&&!previous[v.owner].includes(v.id)).length;
        message(results.length+' eligible long videos found'+(newItems?' · '+newItems+' new since last check':'')+'. Import a permitted source file to draft clips.');
      } catch(e) {
        message('Refresh failed: '+ e.message + '. Try reconnecting YouTube or refreshing later.',true);
      } finally {busy=false; updateButtons();}
    }
    btnConnect.onclick = () => { if (typeof window.ClipitNavigate === "function") window.ClipitNavigate("youtube"); else document.querySelector('.mobile-nav button[data-screen="youtube"]')?.click(); }
    btnImport.onclick = () => loadSubscriptions(false);
    btnMore.onclick = () => loadSubscriptions(true);
    btnRefresh.onclick = refreshVideos;
    search.oninput = renderSubscriptions;
    root.addEventListener('clipit:youtube-state',syncConnection);
    syncConnection();
  }
  if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})(typeof window!=='undefined' ? window : globalThis);
