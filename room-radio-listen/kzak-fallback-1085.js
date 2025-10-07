
// kzak-fallback-1085.js
// Adds robust audio error-handling: if a track fails to load, skip to the next.
(function(){
  function qs(s,r){return (r||document).querySelector(s);}
  function qsa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));}
  function text(el){ return (el && (el.textContent||'')).replace(/\s+/g,' ').trim(); }
  function ready(f){ if(document.readyState!=='loading') f(); else document.addEventListener('DOMContentLoaded', f); }

  var state = { idx: 0, lastKey: 'ALL', skipping: false, triesLeft: 0 };

  function lists(){
    var r = Array.isArray(window.PLAYLIST_ROCK)?window.PLAYLIST_ROCK:[];
    var h = Array.isArray(window.PLAYLIST_HEAVY)?window.PLAYLIST_HEAVY:[];
    var m = Array.isArray(window.PLAYLIST_MELLOW)?window.PLAYLIST_MELLOW:[];
    return {rock:r, heavy:h, mellow:m, all:r.concat(h,m)};
  }

  function ensureAudio(){
    var a=qs('#kzakPlayer'); if(!a){ a=document.createElement('audio'); a.id='kzakPlayer'; a.preload='metadata'; document.body.appendChild(a); }
    if(!a.__wired1085){
      a.addEventListener('ended', function(){ next(true); }, false);
      a.addEventListener('error', function(){
        // If a source fails (404, CORS, etc.), try the next one, but cap attempts at list length.
        if (state.skipping) return;
        state.skipping = true;
        if (!state.triesLeft || state.triesLeft < 0) state.triesLeft = (window.PLAYLIST||[]).length;
        if (state.triesLeft-- > 0) { next(true); }
        setTimeout(function(){ state.skipping = false; }, 50);
      }, false);
      a.__wired1085 = true;
    }
    return a;
  }

  function srcFor(i){
    var L=window.PLAYLIST||[]; if(!L.length) return '';
    var t=L[i]||{}; var s=(t.file||t.url||t).replace(/^\.\//,''); // remove leading ./
    return s;
  }

  function playAt(i,autoplay){
    var L=window.PLAYLIST||[]; if(!L.length) return;
    i=Math.max(0,Math.min(i,L.length-1));
    state.idx=i;
    state.triesLeft = L.length; // reset skip budget
    var a=ensureAudio(); a.src=srcFor(i);
    if(autoplay!==false){ a.play().catch(function(){}); }
  }
  function play(){ ensureAudio().play().catch(function(){}); }
  function pause(){ var a=ensureAudio(); try{a.pause();}catch(_){ } }
  function next(autoplay){
    var L=window.PLAYLIST||[]; if(!L.length) return;
    var n=(state.idx+1)%L.length; state.idx=n;
    var a=ensureAudio(); a.src=srcFor(n);
    if (autoplay) a.play().catch(function(){});
  }
  function prev(){
    var L=window.PLAYLIST||[]; if(!L.length) return;
    var n=(state.idx-1+L.length)%L.length; state.idx=n;
    var a=ensureAudio(); a.src=srcFor(n);
    a.play().catch(function(){});
  }

  function applyKey(key){
    var L = lists(), list=L.all; state.lastKey='ALL';
    if(key==='HEAVY'){ list=L.heavy; state.lastKey='HEAVY'; }
    else if(key==='ROCK'){ list=L.rock; state.lastKey='ROCK'; }
    else if(key==='MELLOW'){ list=L.mellow; state.lastKey='MELLOW'; }
    try{ window.PLAYLIST=list.slice?list.slice():list; }catch(_){ window.PLAYLIST=list; }
    try{ window.PLAYLIST_ALL=L.all.slice?L.all.slice():L.all; }catch(_){ }
    // (Re)wire playlist clicks if your native list exists
    var panel = qs('#playlist') || qs('.playlist') || qs('#playlistPanel');
    if(panel && !panel.__wired1085){
      panel.addEventListener('click', function(e){
        var el=e.target; while(el && el!==panel && !el.getAttribute('data-idx')) el=el.parentNode;
        if(!el||el===panel) return;
        var ix=parseInt(el.getAttribute('data-idx'),10)||0;
        playAt(ix,true);
      }, false);
      // Tag row-like children
      var kids = panel.children && panel.children.length ? qsa(':scope > *', panel) : qsa('*', panel);
      for (var i=0;i<kids.length;i++){ if(kids[i].getAttribute && !kids[i].getAttribute('data-idx')) kids[i].setAttribute('data-idx', i); }
      panel.__wired1085=true;
    }
  }

  // Global control delegation
  document.addEventListener('click', function(e){
    var el = e.target && e.target.closest ? e.target.closest('button') : e.target;
    if(!el) return;
    var t = text(el).toLowerCase();
    if(!t) return;
    if(~t.indexOf('start station')){ e.preventDefault(); playAt(state.idx,true); }
    else if(~t.indexOf('pause station')){ e.preventDefault(); pause(); }
    else if(t==='next' || ~t.indexOf('next')){ e.preventDefault(); next(true); }
    else if(t==='prev' || ~t.indexOf('prev')){ e.preventDefault(); prev(); }
    else if(~t.indexOf('heavy and metal')){ applyKey('HEAVY'); }
    else if(~t.indexOf('middle ground rock')){ applyKey('ROCK'); }
    else if(~t.indexOf('mellow tunes')){ applyKey('MELLOW'); }
    else if(t==='all' || ~t.indexOf('all')){ applyKey('ALL'); }
    else if(~t.indexOf('force break')){
      var sb = qs('#FrasierExit') || qs('#KZAK-StationBreak') || qs('audio[title*="Station Break"]');
      if(sb){ try{ pause(); sb.currentTime=0; sb.play().catch(function(){}); }catch(_){ } }
    }
  }, false);

  // Boot when playlists appear
  ready(function(){
    var tries=0, t=setInterval(function(){
      var ok = Array.isArray(window.PLAYLIST_ROCK)&&Array.isArray(window.PLAYLIST_HEAVY)&&Array.isArray(window.PLAYLIST_MELLOW);
      if(ok){ clearInterval(t); applyKey('ALL'); return; }
      if(++tries>400){ clearInterval(t); console.warn('[KZAK] playlists not detected'); }
    },25);
  });

  window.kzakFallback = { playAt:playAt, play:play, pause:pause, next:next, prev:prev, applyKey:applyKey };
})();
