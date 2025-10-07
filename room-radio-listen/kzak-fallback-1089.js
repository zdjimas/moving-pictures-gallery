/* kzak-fallback-1089.js
 * Minimal, non-invasive player wiring + updates existing Now-Playing fields
 */
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
    if(!a.__wired1089){
      a.addEventListener('ended', function(){ next(true); }, false);
      a.addEventListener('error', function(){
        if (state.skipping) return;
        state.skipping = true;
        if (!state.triesLeft || state.triesLeft < 0) state.triesLeft = (window.PLAYLIST||[]).length;
        if (state.triesLeft-- > 0) { next(true); }
        setTimeout(function(){ state.skipping = false; }, 60);
      }, false);
      a.__wired1089=true;
    }
    return a;
  }

  function itemAt(i){ var L=window.PLAYLIST||[]; return L[i]||{}; }
  function srcFor(i){
    var t=itemAt(i);
    var s=(t.file||t.url||t).replace(/^\.\//,''); // strip leading ./
    return s;
  }

  // ===== Update existing left-pane nodes (best-effort; no structure changes) =====
  function findLeftPane(){
    // Heuristic: the first container that includes the familiar tip text
    var all = qsa('div,section,main,article');
    for (var i=0;i<all.length;i++){
      var k = all[i].textContent||'';
      if (k.indexOf('Tip: The ON AIR pill lights only when music plays.')>=0) return all[i];
    }
    return null;
  }

  function updateExistingPane(track){
    var pane = findLeftPane();
    if(!pane) return;

    // 1) Artwork: pick the largest visible <img> inside pane (likely the current art placeholder)
    var imgs = qsa('img', pane).filter(function(im){
      var r = im.getBoundingClientRect();
      return r && r.width>=120 && r.height>=120;
    }).sort(function(a,b){ return (b.naturalWidth*b.naturalHeight) - (a.naturalWidth*a.naturalHeight); });
    if(track.img && imgs.length){
      imgs[0].src = track.img;
    }

    // 2) Title: try strong/heading/link near top of pane
    var titleNode = qs('h1, h2, h3, .title, .track-title, a, strong', pane);
    if(titleNode) titleNode.textContent = track.title || (track.file||'').split('/').pop();

    // 3) Genre line: find a node that starts with "Genre:"
    var textNodes = qsa('*', pane);
    for (var j=0;j<textNodes.length;j++){
      var val = txt(textNodes[j]);
      if (val && (/^genre\s*:/i).test(val)){
        textNodes[j].textContent = 'Genre: ' + (track.genre || '—');
        break;
      }
    }

    // 4) Description/story: locate the long paragraph that previously held "Under Construction:"
    var paras = qsa('p, .desc, .description', pane);
    if (track.story){
      for (var k=0;k<paras.length;k++){
        var pv = txt(paras[k]);
        if (pv && (pv.indexOf('Under Construction')>=0 || pv.length>40)){
          paras[k].textContent = track.story;
          break;
        }
      }
    }
  }

  function playAt(i,autoplay){
    var L=window.PLAYLIST||[]; if(!L.length) return;
    i=Math.max(0,Math.min(i,L.length-1));
    state.idx=i; state.triesLeft=L.length;
    var tr=itemAt(i);
    var a=ensureAudio(); a.src=srcFor(i);
    if(autoplay!==false){ a.play().catch(function(){}); }
    updateExistingPane(tr);
    try{ document.dispatchEvent(new CustomEvent('kzak:play', {detail:{index:i, track:tr}})); }catch(_){}
  }
  function play(){ ensureAudio().play().catch(function(){}); }
  function pause(){ var a=ensureAudio(); try{a.pause();}catch(_){ } }
  function next(autoplay){
    var L=window.PLAYLIST||[]; if(!L.length) return;
    var n=(state.idx+1)%L.length; state.idx=n;
    var tr=itemAt(n); var a=ensureAudio(); a.src=srcFor(n);
    if (autoplay) a.play().catch(function(){});
    updateExistingPane(tr);
    try{ document.dispatchEvent(new CustomEvent('kzak:next', {detail:{index:n, track:tr}})); }catch(_){}
  }
  function prev(){
    var L=window.PLAYLIST||[]; if(!L.length) return;
    var n=(state.idx-1+L.length)%L.length; state.idx=n;
    var tr=itemAt(n); var a=ensureAudio(); a.src=srcFor(n);
    a.play().catch(function(){});
    updateExistingPane(tr);
    try{ document.dispatchEvent(new CustomEvent('kzak:prev', {detail:{index:n, track:tr}})); }catch(_){}
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

    var panel = qs('#playlist') || qs('.playlist') || qs('#playlistPanel');
    if(panel){
      var kids = panel.children && panel.children.length ? qsa(':scope > *', panel) : qsa('*', panel);
      for (var i=0;i<kids.length;i++){ if(kids[i].getAttribute && !kids[i].getAttribute('data-idx')) kids[i].setAttribute('data-idx', i); }
      if(!panel.__wired1089){
        panel.addEventListener('click', function(e){
          var el=e.target; while(el && el!==panel && !el.getAttribute('data-idx')) el=el.parentNode;
          if(!el||el===panel) return;
          var ix=parseInt(el.getAttribute('data-idx'),10)||0;
          playAt(ix,true);
        }, false);
        panel.__wired1089=true;
      }
    }
  }

  // Global delegation for controls
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
