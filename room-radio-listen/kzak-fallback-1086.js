
// kzak-fallback-1086.js
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
  function esc(s){ s=String(s||''); return s.replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }

  var state = { idx: 0, lastKey:'ALL', skipping:false, triesLeft:0 };

  function lists(){
    var r = Array.isArray(window.PLAYLIST_ROCK)?window.PLAYLIST_ROCK:[];
    var h = Array.isArray(window.PLAYLIST_HEAVY)?window.PLAYLIST_HEAVY:[];
    var m = Array.isArray(window.PLAYLIST_MELLOW)?window.PLAYLIST_MELLOW:[];
    return {rock:r, heavy:h, mellow:m, all:r.concat(h,m)};
  }

  function ensureAudio(){
    var a=qs('#kzakPlayer'); if(!a){ a=document.createElement('audio'); a.id='kzakPlayer'; a.preload='metadata'; document.body.appendChild(a); }
    if(!a.__wired1086){
      a.addEventListener('ended', function(){ next(true); }, false);
      a.addEventListener('error', function(){
        if (state.skipping) return;
        state.skipping = true;
        if (!state.triesLeft || state.triesLeft < 0) state.triesLeft = (window.PLAYLIST||[]).length;
        if (state.triesLeft-- > 0) { next(true); }
        setTimeout(function(){ state.skipping = false; }, 60);
      }, false);
      a.__wired1086=true;
    }
    return a;
  }

  function itemAt(i){
    var L=window.PLAYLIST||[]; return L[i]||{};
  }
  function srcFor(i){
    var t=itemAt(i);
    var s=(t.file||t.url||t).replace(/^\.\//,''); // strip leading ./
    return s;
  }

  function renderShim(i){
    var t=itemAt(i);
    var title = t.title || t.file || ('Track '+(i+1));
    var genre = t.genre || state.lastKey || '—';
    var art = t.img || t.image || 'Media/default.jpg';
    var story = t.story || t.desc || '';

    var host = qs('#kzakNowPlayingShim');
    if(!host){
      host = document.createElement('div');
      host.id='kzakNowPlayingShim';
      host.style.cssText='position:absolute; left:24px; right:50%; top:360px; min-width:340px; max-width:640px; background:rgba(0,0,0,.35); border-radius:14px; padding:12px; z-index:9998; pointer-events:none;';
      var anchor = qs('#player') || qs('.player') || qs('main') || document.body;
      anchor.appendChild(host);
    }
    host.innerHTML = ''
      + '<div style="display:flex; gap:12px; align-items:flex-start">'
      +   '<img alt="" src="'+esc(art)+'" style="width:120px;height:120px;object-fit:cover;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,.35)">'
      +   '<div style="flex:1;min-width:0">'
      +     '<div style="font-weight:700;font-size:18px;color:#f2f6ff;letter-spacing:.2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(title)+'</div>'
      +     '<div style="opacity:.75;margin:.25rem 0 .5rem 0">'+esc(genre)+'</div>'
      +     (story ? '<div style="font-size:13px;line-height:1.35;opacity:.85;max-height:3.6em;overflow:hidden">'+esc(story)+'</div>' : '')
      +   '</div>'
      + '</div>';
  }

  function playAt(i,autoplay){
    var L=window.PLAYLIST||[]; if(!L.length) return;
    i=Math.max(0,Math.min(i,L.length-1));
    state.idx=i; state.triesLeft=L.length;
    var a=ensureAudio(); a.src=srcFor(i);
    renderShim(i);
    if(autoplay!==false){ a.play().catch(function(){}); }
  }
  function play(){ ensureAudio().play().catch(function(){}); }
  function pause(){ var a=ensureAudio(); try{a.pause();}catch(_){ } }
  function next(autoplay){
    var L=window.PLAYLIST||[]; if(!L.length) return;
    var n=(state.idx+1)%L.length; state.idx=n;
    var a=ensureAudio(); a.src=srcFor(n);
    renderShim(n);
    if (autoplay) a.play().catch(function(){});
  }
  function prev(){
    var L=window.PLAYLIST||[]; if(!L.length) return;
    var n=(state.idx-1+L.length)%L.length; state.idx=n;
    var a=ensureAudio(); a.src=srcFor(n);
    renderShim(n);
    a.play().catch(function(){});
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

    // Enhance right-side playlist
    var panel = qs('#playlist') || qs('.playlist') || qs('#playlistPanel');
    if(panel){
      var kids = panel.children && panel.children.length ? qsa(':scope > *', panel) : qsa('*', panel);
      for (var i=0;i<kids.length;i++){ if(kids[i].getAttribute && !kids[i].getAttribute('data-idx')) kids[i].setAttribute('data-idx', i); }
      if(!panel.__wired1086){
        panel.addEventListener('click', function(e){
          var el=e.target; while(el && el!==panel && !el.getAttribute('data-idx')) el=el.parentNode;
          if(!el||el===panel) return;
          var ix=parseInt(el.getAttribute('data-idx'),10)||0;
          playAt(ix,true);
        }, false);
        panel.__wired1086=true;
      }
    }
  }

  // Global delegation: detect on text/aria/title; not just <button>
  document.addEventListener('click', function(e){
    var el = e.target;
    if(!el) return;
    var L=''; var walk=el;
    for(var k=0;k<6 && walk;k++){ L += ' ' + lbl(walk); walk=walk.parentNode; }
    L = L.toLowerCase();

    function has(x){ return L.indexOf(x)>=0; }

    if(has('start station')){ e.preventDefault(); playAt(state.idx,true); }
    else if(has('pause station')){ e.preventDefault(); pause(); }
    else if(has('next')){ e.preventDefault(); next(true); }
    else if(has('prev')){ e.preventDefault(); prev(); }
    else if(has('heavy and metal')){ e.preventDefault(); applyKey('HEAVY'); }
    else if(has('middle ground rock')){ e.preventDefault(); applyKey('ROCK'); }
    else if(has('mellow tunes')){ e.preventDefault(); applyKey('MELLOW'); }
    else if(/(^|\s)all(\s|$)/.test(L)){ e.preventDefault(); applyKey('ALL'); }
    else if(has('force break')){
      var sb = qs('#FrasierExit') || qs('#KZAK-StationBreak') || qs('audio[title*="Station Break"]');
      if(sb){ try{ pause(); sb.currentTime=0; sb.play().catch(function(){}); }catch(_){ } }
    }
  }, false);

  // Boot once playlists are present
  ready(function(){
    var tries=0, t=setInterval(function(){
      var ok = Array.isArray(window.PLAYLIST_ROCK)&&Array.isArray(window.PLAYLIST_HEAVY)&&Array.isArray(window.PLAYLIST_MELLOW);
      if(ok){ clearInterval(t); applyKey('ALL'); return; }
      if(++tries>400){ clearInterval(t); console.warn('[KZAK] playlists not detected'); }
    },25);
  });

  window.kzakFallback = { playAt:playAt, play:play, pause:pause, next:next, prev:prev, applyKey:applyKey };
})();
