
/*! KZAK Likes v0.59 — classic script, no exports. Safe wrappers, no core rewrites. */
(function(){
  if (window.__kzakLikes059) return; window.__kzakLikes059 = true;

  // ---------- config & keys ----------
  var MAX = 100000;
  var KEY_COUNTS = 'kzak.likes.v7.counts';   // { track_id: number }
  var KEY_DEVICE = 'kzak.likes.device';
  var API = (window.KZAK_LIKES_API && window.KZAK_LIKES_API.baseUrl) ? window.KZAK_LIKES_API : null;

  // ---------- small utils ----------
  function clamp(n){ n = Number(n||0); if (!isFinite(n)) n = 0; return Math.max(0, Math.min(MAX, Math.round(n))); }
  function read(key){ try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch(e){ return {}; } }
  function write(key, obj){ try { localStorage.setItem(key, JSON.stringify(obj)); } catch(e){} }
  function uuid(){
    try {
      var id = localStorage.getItem(KEY_DEVICE);
      if (!id){ id = (crypto.randomUUID && crypto.randomUUID()) || (Date.now().toString(36)+Math.random().toString(36).slice(2)); localStorage.setItem(KEY_DEVICE, id); }
      return id;
    } catch(e){ return 'anon'; }
  }
  function slug(s){
    s = String(s||''); try { s = s.normalize('NFKD').replace(/[\u0300-\u036f]/g,''); } catch(e){}
    s = s.replace(/\.[a-z0-9]{2,4}$/i,'').replace(/[^a-z0-9]+/ig,'-').replace(/^-+|-+$/g,'').toLowerCase();
    return s || 'untitled';
  }
  function idFromEntry(e){
    if (!e || typeof e !== 'object') return null;
    if (e.id) return slug(e.id);
    if (e.file) return slug(String(e.file).split('/').pop());
    var src = e.src || e.url || e.path || e.href || e.mp3;
    if (src) return slug(String(src).split('/').pop());
    if (e.title) return slug(e.title);
    return null;
  }
  function currentId(){
    try{
      if (Array.isArray(window.PLAYLIST) && typeof window.currentIndex === 'number') {
        var e = window.PLAYLIST[window.currentIndex]; var id = idFromEntry(e); if (id) return id;
      }
      var a = document.querySelector('audio');
      var src = (a && (a.currentSrc || a.src)) || '';
      if (!src) return null;
      try { src = new URL(src, location.href).pathname.split('/').pop(); } catch(e){ src = src.split('?')[0].split('/').pop(); }
      return slug(src);
    } catch(e){ return null; }
  }

  // ---------- optional backend bridge ----------
  function apiGet(ids){
    ids = (ids||[]).filter(Boolean);
    var cache = read(KEY_COUNTS);
    if (!API || !ids.length) {
      var out = {}; ids.forEach(function(id){ out[id] = clamp(cache[id]||0); }); return Promise.resolve(out);
    }
    var url = API.baseUrl + (API.endpoints && API.endpoints.get || '/likes?ids=') + encodeURIComponent(ids.join(','));
    return fetch(url, {method:'GET', headers:{'Accept':'application/json'}, credentials:'omit'}).then(function(r){
      if (!r.ok) throw new Error('HTTP '+r.status);
      return r.json();
    }).then(function(data){
      Object.keys(data||{}).forEach(function(k){ cache[k] = clamp(data[k]); });
      write(KEY_COUNTS, cache); return data;
    }).catch(function(){ var out = {}; ids.forEach(function(id){ out[id] = clamp(cache[id]||0); }); return out; });
  }
  function apiPost(id, delta){
    if (!id || !delta) return Promise.resolve();
    var cache = read(KEY_COUNTS); cache[id] = clamp((cache[id]||0) + delta); write(KEY_COUNTS, cache);
    if (!API) return Promise.resolve();
    var url = API.baseUrl + (API.endpoints && API.endpoints.post || '/like');
    var body = JSON.stringify({ track_id:id, device_id:uuid(), action:(delta>0?'like':'unlike'), delta:delta });
    return fetch(url, {method:'POST', headers:{'Content-Type':'application/json'}, body:body, credentials:'omit'}).catch(function(){});
  }

  // ---------- UI: button + "now playing" chip ----------
  function ensureBtn(){
    var btn = document.getElementById('kzak-like-track-btn');
    if (!btn){
      btn = document.createElement('button');
      btn.id = 'kzak-like-track-btn';
      btn.type = 'button';
      btn.className = 'kzak59-like-btn';
      btn.innerHTML = '<span class="heart" aria-hidden="true">♡</span><span class="label">Like Track</span>';
      var host = document.querySelector('#console, .console, #controls, .controls') || document.body;
      var share = Array.from(host.querySelectorAll('button,a')).find(function(el){ return /share/i.test(el.textContent||''); });
      if (share && share.parentElement){ share.parentElement.insertBefore(btn, share.nextSibling); share.parentElement.insertBefore(document.createTextNode(' '), share.nextSibling); }
      else { host.appendChild(btn); }
    }
    return btn;
  }
  function ensureNowChip(){
    var chip = document.getElementById('kzak-like-total');
    if (!chip){
      chip = document.createElement('span');
      chip.id='kzak-like-total';
      chip.className='kzak59-chip';
      chip.textContent='♥ 0';
      var title = document.querySelector('.track-title, #track-title, h1.track, h2.track, .now-playing .title');
      var host = (title && title.parentElement) || document.querySelector('#console, .console, header, .header') || document.body;
      if (title && title.parentElement){ title.parentElement.insertBefore(chip, title.nextSibling); title.parentElement.insertBefore(document.createTextNode(' '), title.nextSibling); }
      else { host.appendChild(chip); }
    }
    return chip;
  }
  function updateBtn(){
    var id = currentId(); var n = clamp(read(KEY_COUNTS)[id] || 0);
    var btn = ensureBtn();
    btn.classList.toggle('is-on', n>0);
    btn.setAttribute('aria-pressed', n>0 ? 'true' : 'false');
    var heart = btn.querySelector('.heart'); if (heart) heart.textContent = n>0 ? '♥' : '♡';
  }
  function repaintNow(){
    var id = currentId();
    return apiGet([id]).then(function(map){
      var n = clamp(map[id] || read(KEY_COUNTS)[id] || 0);
      ensureNowChip().textContent = '♥ ' + n.toLocaleString();
      updateBtn();
    });
  }
  document.addEventListener('click', function(ev){
    var btn = ev.target && ev.target.closest && ev.target.closest('#kzak-like-track-btn'); if (!btn) return;
    var id = currentId(); if (!id) return;
    var delta = ev.altKey ? -1 : 1;
    apiPost(id, delta).then(function(){ repaintNow(); repaintList(); });
  }, true);

  // ---------- Playlist: replace Genre text with likes ----------
  function replaceGenreWithLikes(row, id, count){
    var n = clamp(count||0);
    var target = row.querySelector('.meta-genre');
    if (!target){
      var all = row.querySelectorAll('*');
      for (var i=0;i<all.length;i++){
        var t = (all[i].textContent||'').replace(/\s+/g,' ').trim();
        if (/^genre\s*:/i.test(t)){ target = all[i]; break; }
      }
    }
    if (target){
      target.textContent = '♥ ' + n.toLocaleString();
      target.classList.add('kzak59-replaced');
      target.style.display = 'inline';
      target.style.opacity = '1';
    } else {
      var chip = row.querySelector('.kzak59-row-like');
      if (!chip){
        chip = document.createElement('span');
        chip.className = 'kzak59-chip kzak59-row-like';
        (row.lastElementChild || row).appendChild(document.createTextNode(' '));
        (row.lastElementChild || row).appendChild(chip);
      }
      chip.textContent = '♥ ' + n.toLocaleString();
      chip.setAttribute('data-for', id||'');
    }
  }
  function idFromRow(row){
    var i = Number(row.getAttribute('data-i'));
    var e = Array.isArray(window.PLAYLIST) ? window.PLAYLIST[i] : null;
    return idFromEntry(e);
  }
  function repaintList(){
    var body = document.getElementById('plistBody') || document.querySelector('#plist .body, #plist .items, #plist');
    if (!body) return;
    var rows = Array.prototype.slice.call(body.children || []);
    var ids = rows.map(idFromRow);
    return apiGet(ids).then(function(map){
      rows.forEach(function(row, i){
        var id = ids[i]; replaceGenreWithLikes(row, id, map[id] || read(KEY_COUNTS)[id] || 0);
      });
    });
  }
  function observePlaylist(){
    var body = document.getElementById('plistBody') || document.querySelector('#plist .body, #plist .items, #plist');
    if (!body) return;
    repaintList();
    var mo = new MutationObserver(function(){ repaintList(); });
    mo.observe(body, {childList:true, subtree:true, characterData:true});
  }

  // ---------- init ----------
  function injectStyles(){
    if (document.getElementById('kzak59-like-css')) return;
    var css = document.createElement('style'); css.id='kzak59-like-css'; css.textContent = [
      '.kzak59-like-btn{display:inline-flex;align-items:center;gap:.4rem;padding:.35rem .6rem;border:1px solid #444;border-radius:6px;background:#111;color:#eee;cursor:pointer;font:500 14px/1.1 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}',
      '.kzak59-like-btn.is-on{border-color:#c33;color:#ffcfcf;background:#2a0f13}',
      '.kzak59-like-btn .heart{font-size:16px;line-height:1}',
      '.kzak59-chip{display:inline-flex;align-items:center;gap:.35rem;font:600 14px/1.1 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;padding:.25rem .45rem;border-radius:999px;background:#111;color:#eee;border:1px solid #333}',
      '#genreBar .gbtn[data-genre="Heavy and Metal"]{background:#8b0000;color:#fff}',
      '#genreBar .gbtn[data-genre="Middle Ground Rock"]{background:#1e3a8a;color:#fff}',
      '#genreBar .gbtn[data-genre="Mellow Tunes"]{background:#0f766e;color:#fff}',
      '#genreBar .gbtn.active{outline:2px solid rgba(255,255,255,.15)}'
    ].join('');
    document.head.appendChild(css);
  }
  function boot(){
    injectStyles();
    ensureBtn(); ensureNowChip(); updateBtn(); repaintNow(); observePlaylist();
    var a = document.querySelector('audio'); if (a){
      ['loadedmetadata','play','ended','pause'].forEach(function(ev){ a.addEventListener(ev, function(){ setTimeout(function(){ repaintNow(); repaintList(); updateBtn(); },0); }, {passive:true}); });
    }
    if (typeof window.buildList === 'function' && !window.__kzak59_wrapped){
      window.__kzak59_wrapped = true;
      var orig = window.buildList;
      window.buildList = function(){ var ret = orig.apply(this, arguments); queueMicrotask(repaintList); setTimeout(repaintList,0); return ret; };
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
