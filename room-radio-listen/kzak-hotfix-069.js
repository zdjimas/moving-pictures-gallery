
/*! kzak-hotfix-069.js  — one-line drop-in
   - Unregister SW & clear caches (once) to stop stale 065 HTML
   - Ensure EXACTLY ONE About badge with v1.069
   - Prefer external playlists; set default playlist when ready
   - Safe, non-reentrant genre binder (Heavy/Middle/Mellow)
*/
(() => {
  if (window.__KZAK_HOTFIX_069) return; window.__KZAK_HOTFIX_069 = true;

  // 0) Kill service workers & caches ONCE (per browser) so 065 cannot shadow new HTML
  try {
    if (!localStorage.getItem('kzak_sw_cleared_069')) {
      if (navigator.serviceWorker?.getRegistrations) {
        navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()));
      }
      if (window.caches?.keys) {
        caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))));
      }
      localStorage.setItem('kzak_sw_cleared_069', '1');
    }
  } catch (e) {}

  // 1) About badge — remove old ones and render a clean single badge
  const renderBadge = () => {
    try {
      for (const sel of ['.build-badge', '[data-build-badge]', '.uncle-build', '[data-uncle]']) {
        document.querySelectorAll(sel).forEach(n => n.remove());
      }
      let host = document.querySelector('#about-badge-anchor') || document.body;
      let badge = document.getElementById('kzak-build-badge');
      if (!badge) {
        badge = document.createElement('div');
        badge.id = 'kzak-build-badge';
        badge.style.cssText = [
          'position:fixed','right:14px','bottom:14px','z-index:9999',
          'background:rgba(0,0,0,.80)','color:#fff','padding:10px 12px',
          'border-radius:12px','font:600 13px/1.3 ui-sans-serif,system-ui',
          'box-shadow:0 4px 18px rgba(0,0,0,.28)','backdrop-filter:saturate(1.2) blur(4px)'
        ].join(';');
        host.appendChild(badge);
      }
      const ts = new Date().toLocaleString();
      badge.textContent = `Release: Bullwinkle-v1.069 • ${ts}`;
    } catch (e) { /* ignore */ }
  };

  // 2) Playlist readiness helpers
  const isArr = a => Array.isArray(a) && a.length >= 0;
  const pickRock   = () => window.PLAYLIST_ROCK   || window.ROCK   || null;
  const pickHeavy  = () => window.PLAYLIST_HEAVY  || window.HEAVY  || null;
  const pickMellow = () => window.PLAYLIST_MELLOW || window.MELLOW || null;

  // 3) Bind genre buttons — capture phase, non-reentrant
  const sources = {
    'Heavy and Metal': pickHeavy,
    'Middle Ground Rock': pickRock,
    'Mellow Tunes': pickMellow,
  };
  const bindGenres = () => {
    const all = Array.from(document.querySelectorAll('button, a'));
    let wired = 0;
    for (const b of all) {
      const txt = (b.textContent||'').trim();
      if (!sources[txt] || b.__kzak069) continue;
      b.__kzak069 = true;
      b.addEventListener('click', () => {
        const arr = sources[txt]();
        if (isArr(arr)) {
          window.PLAYLIST = arr;
          // reset to start if the host app exposes a current index
          for (const k of ['currentIndex','currIndex','index','idx']) {
            if (typeof window[k] === 'number') { window[k] = 0; break; }
          }
        }
      }, true);
      wired++;
    }
    console.log('[KZAK 069] genre buttons wired:', wired);
  };

  // 4) Prefer external playlists automatically when they become available
  const adoptDefaultOnceReady = () => {
    let tries = 0;
    const t = setInterval(() => {
      tries++;
      const rock = pickRock(), heavy = pickHeavy(), mellow = pickMellow();
      if (isArr(rock) || isArr(heavy) || isArr(mellow) || tries > 60) {
        clearInterval(t);
        renderBadge();
        bindGenres();
        // Set default if none chosen yet
        if (!Array.isArray(window.PLAYLIST)) {
          window.PLAYLIST = rock || heavy || mellow || [];
        }
        console.log('[KZAK 069] playlists ready?',
          '{ rock:', !!rock, ', heavy:', !!heavy, ', mellow:', !!mellow, ', active:', Array.isArray(window.PLAYLIST), '}'
        );
      }
    }, 100);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', adoptDefaultOnceReady, { once: true });
  } else {
    adoptDefaultOnceReady();
  }
})();
