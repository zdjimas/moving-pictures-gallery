
// kzak-fallback-1084.js
// Strong control delegation + playlist enhancement (ES5-only). Safe to include after existing scripts.
(function(){
  function qs(s,r){return (r||document).querySelector(s);}
  function qsa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));}
  function text(el){ return (el && (el.textContent||'')).replace(/\s+/g,' ').trim(); }
  function ready(f){ if(document.readyState!=='loading') f(); else document.addEventListener('DOMContentLoaded', f); }

  var state = { idx: 0, lastKey: 'ALL' };

  function lists(){
    var r = Array.isArray(window.PLAYLIST_ROCK)?window.PLAYLIST_ROCK:[];
    var h = Array.isArray(window.PLAYLIST_HEAVY)?window.PLAYLIST_HEAVY:[];
    var m = Array.isArray(window.PLAYLIST_MELLOW)?window.PLAYLIST_MELLOW:[];
    return {rock:r, heavy:h, mellow:m, all:r.concat(h,m)};
  }

  function setCounts(list){
    var n=list&&list.length?list.length:0;
    var e=qs('#tmax'); if(e) e.textContent=n;
    e=qs('#tcount'); if(e) e.textContent=n;
    e=qs('#countRight'); if(e) e.textContent=n+' items';
  }

  function ensureAudio(){
    var a=qs('#kzakPlayer'); if(!a){ a=document.createElement('audio'); a.id='kzakPlayer'; a.preload='metadata'; document.body.appendChild(a); }
    a.onended=function(){ next(); };
    return a;
  }

  function srcFor(i){
    var L=window.PLAYLIST||[]; if(!L.length) return '';
    var t=L[i]||{}; return (t.file||t.url||t).replace(/^\.\?\/?/, '');
  }

  function playAt(i,autoplay){
    var L=window.PLAYLIST||[]; if(!L.length) return;
    i=Math.max(0,Math.min(i,L.length-1));
    state.idx=i;
    var a=ensureAudio(); a.src=srcFor(i);
    if(autoplay!==false){ a.play().catch(function(){}); }
  }
  function play(){ ensureAudio().play().catch(function(){}); }
  function pause(){ var a=ensureAudio(); try{a.pause();}catch(_){ } }
  function next(){ var L=window.PLAYLIST||[]; if(!L.length) return; playAt((state.idx+1)%L.length,true); }
  function prev(){ var L=window.PLAYLIST||[]; if(!L.length) return; playAt((state.idx-1+L.length)%L.length,true); }

  function applyKey(key){
    var L = lists(), list=L.all; state.lastKey='ALL';
    if(key==='HEAVY'){ list=L.heavy; state.lastKey='HEAVY'; }
    else if(key==='ROCK'){ list=L.rock; state.lastKey='ROCK'; }
    else if(key==='MELLOW'){ list=L.mellow; state.lastKey='MELLOW'; }
    try{ window.PLAYLIST=list.slice?list.slice():list; }catch(_){ window.PLAYLIST=list; }
    try{ window.PLAYLIST_ALL=L.all.slice?L.all.slice():L.all; }catch(_){ }
    setCounts(list);
    enhanceExistingList();
  }

  function enhanceExistingList(){
    var panel = qs('#playlist') || qs('.playlist') || qs('#playlistPanel');
    if(!panel) return;
    var idx=0;
    var children = panel.children && panel.children.length ? qsa(':scope > *', panel) : qsa('*', panel);
    for (var i=0; i<children.length; i++){
      var node = children[i];
      if(!node.getAttribute) continue;
      if(!node.getAttribute('data-idx')) node.setAttribute('data-idx', idx);
      idx++;
    }
    if(!panel.__wired1084){
      panel.addEventListener('click', function(e){
        var el=e.target; while(el && el!==panel && !el.getAttribute('data-idx')) el=el.parentNode;
        if(!el||el===panel) return;
        var ix=parseInt(el.getAttribute('data-idx'),10)||0;
        playAt(ix,true);
      }, false);
      panel.__wired1084=true;
    }
  }

  // Global click delegation for control buttons
  document.addEventListener('click', function(e){
    var el = e.target && e.target.closest ? e.target.closest('button') : e.target;
    if(!el) return;
    var t = text(el).toLowerCase();
    if(!t) return;
    if(~t.indexOf('start station')){ e.preventDefault(); playAt(state.idx,true); }
    else if(~t.indexOf('pause station')){ e.preventDefault(); pause(); }
    else if(t==='next' || ~t.indexOf('next')){ e.preventDefault(); next(); }
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

  // Boot
  ready(function(){
    var tries=0, t=setInterval(function(){
      var ok = Array.isArray(window.PLAYLIST_ROCK)&&Array.isArray(window.PLAYLIST_HEAVY)&&Array.isArray(window.PLAYLIST_MELLOW);
      if(ok){ clearInterval(t); applyKey('ALL'); return; }
      if(++tries>400){ clearInterval(t); console.warn('[KZAK] playlists not detected'); }
    },25);
  });

  // Expose for debugging
  window.kzakFallback = { playAt:playAt, play:play, pause:pause, next:next, prev:prev, applyKey:applyKey };
})();
