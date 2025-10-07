// kzak-fallback-1088.js
// Controls + *gentle* Now-Playing updater (no full-screen overlay, no absolute art overlay)
// - Wires Start/Pause/Prev/Next/Genres/Force Break with robust label matching
// - Click-to-play on the right playlist
// - Auto-skip on audio errors
// - Updates a small "Now Playing" shim *inside* the existing left panel without covering it
(function(){
  function qs(s,r){return (r||document).querySelector(s);}
  function qsa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));}
  function txt(n){ return (n && (n.textContent||'')).replace(/\s+/g,' ').trim(); }
  function lbl(n){
    if(!n) return '';
    var s = (n.getAttribute && (n.getAttribute('aria-label')||n.getAttribute('title'))) || '';
    return (txt(n)+' '+s).toLowerCase();
  }
  function ready(f){ if(document.readyState!=='loading') f(); else document.addEventListener('DOMContentLoaded', f); }

  var state = { idx: 0, lastKey:'ALL', skipping:false, triesLeft:0 };

  function lists(){
    var r = Array.isArray(window.PLAYLIST_ROCK)?window.PLAYLIST_ROCK:[];
    var h = Array.isArray(window.PLAYLIST_HEAVY)?window.PLAYLIST_HEAVY:[];
    var m = Array.isArray(window.PLAYLIST_MELLOW)?window.PLAYLIST_MELLOW:[];
    return {rock:r, heavy:h, mellow:m, all:r.concat(h,m)};
  }

  function ensureAudio(){
    var a=qs('#kzakPlayer'); if(!a){ a=document.createElement('audio'); a.id='kzakPlayer'; a.preload='metadata'; document.body.appendChild(a); }
    if(!a.__wired1088){
      a.addEventListener('ended', function(){ next(true); }, false);
      a.addEventListener('error', function(){
        if (state.skipping) return;
        state.skipping = true;
        if (!state.triesLeft || state.triesLeft < 0) state.triesLeft = (window.PLAYLIST||[]).length;
        if (state.triesLeft-- > 0) { next(true); }
        setTimeout(function(){ state.skipping = false; }, 60);
      }, false);
      a.__wired1088=true;
    }
    return a;
  }

  function itemAt(i){ var L=window.PLAYLIST||[]; return L[i]||{}; }
  function srcFor(i){
    var t=itemAt(i);
    var s=(t.file||t.url||t).replace(/^\.\//,''); // strip leading ./
    return s;
  }

  function nowPlayingShimContainer(){
    // Try to locate the big left panel (heuristics).
    // 1) Any element that contains the tip text.
    var containers = qsa('div,section,main,article');
    var target = null;
    for (var i=0;i<containers.length;i++){
      var t = containers[i];
      var k = t.textContent||'';
      if (k.indexOf('Tip: The ON AIR pill lights')>=0 || k.indexOf('Status:')>=0) { target = t; break; }
    }
    if (!target) target = qs('#player') || qs('#mainPlayer') || qs('.main-player') || document.body;

    // Create a small area if absent
    var host = qs('#kzak-np-shim', target) || qs('#kzak-np-shim');
    if(!host){
      host = document.createElement('div');
      host.id = 'kzak-np-shim';
      host.style.margin = '8px 12px';
      host.style.padding = '10px 12px';
      host.style.borderRadius = '14px';
      host.style.background = 'rgba(0,0,0,0.25)';
      host.style.backdropFilter = 'blur(2px)';
      host.style.display = 'grid';
      host.style.gridTemplateColumns = '88px 1fr';
      host.style.gap = '12px';
      host.style.alignItems = 'center';
      // Insert near the top of the big panel but after any header/progress bars
      if (target.firstElementChild) {
        target.insertBefore(host, target.firstElementChild.nextSibling);
      } else {
        target.appendChild(host);
      }
      var art = document.createElement('img'); art.id='kzak-np-art'; art.alt='Now Playing Art';
      art.style.width='88px'; art.style.height='88px'; art.style.objectFit='cover'; art.style.borderRadius='10px';
      var meta = document.createElement('div'); meta.id='kzak-np-meta'; meta.style.minWidth='0';
      meta.innerHTML = '<div id="kzak-np-title" style="font-weight:700;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"></div>' +
                       '<div id="kzak-np-genre" style="opacity:.8;margin-top:2px"></div>' +
                       '<div id="kzak-np-story" style="opacity:.8;margin-top:6px;font-size:.92em;line-height:1.3;max-height:2.6em;overflow:hidden;text-overflow:ellipsis;"></div>';
      host.appendChild(art); host.appendChild(meta);
    }
    return host;
  }

  function updateNowPlaying(i){
    var t = itemAt(i)||{};
    var host = nowPlayingShimContainer();
    var art = qs('#kzak-np-art', host), title = qs('#kzak-np-title', host), genre = qs('#kzak-np-genre', host), story = qs('#kzak-np-story', host);
    if (art && t.img) art.src = t.img;
    if (title) title.textContent = t.title || (t.file||'').split('/').pop();
    if (genre) genre.textContent = t.genre ? ('Genre: '+t.genre) : '';
    if (story) story.textContent = t.story || '';
  }

  function playAt(i,autoplay){
    var L=window.PLAYLIST||[]; if(!L.length) return;
    i=Math.max(0,Math.min(i,L.length-1));
    state.idx=i; state.triesLeft=L.length;
    var a=ensureAudio(); a.src=srcFor(i);
    if(autoplay!==false){ a.play().catch(function(){}); }
    updateNowPlaying(i);
    try{ document.dispatchEvent(new CustomEvent('kzak:play', {detail:{index:i, track:itemAt(i)}})); }catch(_){}
  }
  function play(){ ensureAudio().play().catch(function(){}); }
  function pause(){ var a=ensureAudio(); try{a.pause();}catch(_){ } }
  function next(autoplay){
    var L=window.PLAYLIST||[]; if(!L.length) return;
    var n=(state.idx+1)%L.length; state.idx=n;
    var a=ensureAudio(); a.src=srcFor(n);
    if (autoplay) a.play().catch(function(){});
    updateNowPlaying(n);
    try{ document.dispatchEvent(new CustomEvent('kzak:next', {detail:{index:n, track:itemAt(n)}})); }catch(_){}
  }
  function prev(){
    var L=window.PLAYLIST||[]; if(!L.length) return;
    var n=(state.idx-1+L.length)%L.length; state.idx=n;
    var a=ensureAudio(); a.src=srcFor(n);
    a.play().catch(function(){});
    updateNowPlaying(n);
    try{ document.dispatchEvent(new CustomEvent('kzak:prev', {detail:{index:n, track:itemAt(n)}})); }catch(_){}
  }

  function setCounts(list){
    var n=list&&list.length?list.length:0;
    var e=qs('#tmax'); if(e) e.textContent=n;
    e=qs('#tcount'); if(e) e.textContent=n;
    e=qs('#countRight'); if(e) e.textContent=n+' items';
  }

  function applyKey(key){
    var L = lists(), list=L.all; state.lastKey='ALL';
    if(key==='HEAVY'){ list=L.heavy; state.lastKey='HEAVY'; }
    else if(key==='ROCK'){ list=L.rock; state.lastKey='ROCK'; }
    else if(key==='MELLOW'){ list=L.mellow; state.lastKey='MELLOW'; }
    try{ window.PLAYLIST=list.slice?list.slice():list; }catch(_){ window.PLAYLIST=list; }
    try{ window.PLAYLIST_ALL=L.all.slice?L.all.slice():L.all; }catch(_){ }
    setCounts(list);

    // Make visible playlist rows clickable (non-invasive)
    var panel = qs('#playlist') || qs('.playlist') || qs('#playlistPanel');
    if(panel){
      var kids = panel.children && panel.children.length ? qsa(':scope > *', panel) : qsa('*', panel);
      for (var i=0;i<kids.length;i++){ if(kids[i].getAttribute && !kids[i].getAttribute('data-idx')) kids[i].setAttribute('data-idx', i); }
      if(!panel.__wired1088){
        panel.addEventListener('click', function(e){
          var el=e.target; while(el && el!==panel && !el.getAttribute('data-idx')) el=el.parentNode;
          if(!el||el===panel) return;
          var ix=parseInt(el.getAttribute('data-idx'),10)||0;
          playAt(ix,true);
        }, false);
        panel.__wired1088=true;
      }
    }
  }

  // Global delegation; do not preventDefault unless necessary
  document.addEventListener('click', function(e){
    var el = e.target;
    if(!el) return;
    var L=''; var walk=el;
    for(var k=0;k<5 && walk;k++){ L += ' ' + lbl(walk); walk=walk.parentNode; }
    L = L.toLowerCase();

    function has(x){ return L.indexOf(x)>=0; }

    if(has('start station')){ playAt(state.idx,true); }
    else if(has('pause station')){ pause(); }
    else if(has('next')){ next(true); }
    else if(has('prev')){ prev(); }
    else if(has('heavy and metal')){ applyKey('HEAVY'); }
    else if(has('middle ground rock')){ applyKey('ROCK'); }
    else if(has('mellow tunes')){ applyKey('MELLOW'); }
    else if(/(^|\s)all(\s|$)/.test(L)){ applyKey('ALL'); }
    else if(has('force break')){
      var sb = qs('#FrasierExit') || qs('#KZAK-StationBreak') || qs('audio[title*="Station Break"]');
      if(sb){ try{ pause(); sb.currentTime=0; sb.play().catch(function(){}); }catch(_){ } }
    }
  }, false);

  ready(function(){
    var tries=0, t=setInterval(function(){
      var ok = Array.isArray(window.PLAYLIST_ROCK)&&Array.isArray(window.PLAYLIST_HEAVY)&&Array.isArray(window.PLAYLIST_MELLOW);
      if(ok){ clearInterval(t); applyKey('ALL'); return; }
      if(++tries>400){ clearInterval(t); console.warn('[KZAK] playlists not detected'); }
    },25);
  });

  window.kzakFallback = { playAt:playAt, play:play, pause:pause, next:next, prev:prev, applyKey:applyKey };
})();
