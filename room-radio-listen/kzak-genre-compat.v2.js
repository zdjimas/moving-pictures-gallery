
/*! kzak-genre-compat.v2.js  — safe, non-reentrant binder */
(() => {
  if (window.__KZAK_V2) return; window.__KZAK_V2 = true;

  const isArr = a => Array.isArray(a) && a.length >= 0;

  // Map visible labels to arrays already defined by the three playlist scripts
  const sources = {
    "Heavy and Metal": () => window.PLAYLIST_HEAVY || window.HEAVY || window.PLAYLIST,
    "Middle Ground Rock": () => window.PLAYLIST_ROCK || window.ROCK || window.PLAYLIST,
    "Mellow Tunes": () => window.PLAYLIST_MELLOW || window.MELLOW || window.PLAYLIST,
  };

  // Prefer capture phase so we run before app's own click handlers
  const bind = (btn, label) => {
    if (btn.__kzakV2) return; btn.__kzakV2 = true;
    btn.addEventListener('click', (ev) => {
      try {
        const pick = sources[label]?.();
        if (isArr(pick)) window.PLAYLIST = pick;
        // Do NOT call buildList()/activate(): app will handle render
      } catch (e) { console.warn('[KZAK v2] bind err', e); }
    }, true);
  };

  const wire = () => {
    const all = Array.from(document.querySelectorAll('button, a'));
    let count = 0;
    for (const b of all) {
      const txt = (b.textContent || '').trim();
      if (sources[txt]) { bind(b, txt); count++; }
    }
    console.log('[KZAK v2] wired genre buttons:', count);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire, { once: true });
  } else {
    wire();
  }
})();
