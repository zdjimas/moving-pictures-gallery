
/*! KZAK genre compat shim v1 (no core edits required) */
(function () {
  try {
    const rock   = (typeof window.PLAYLIST_ROCK   !== 'undefined' && Array.isArray(window.PLAYLIST_ROCK))   ? window.PLAYLIST_ROCK   : [];
    const heavy  = (typeof window.PLAYLIST_HEAVY  !== 'undefined' && Array.isArray(window.PLAYLIST_HEAVY))  ? window.PLAYLIST_HEAVY  : [];
    const mellow = (typeof window.PLAYLIST_MELLOW !== 'undefined' && Array.isArray(window.PLAYLIST_MELLOW)) ? window.PLAYLIST_MELLOW : [];

    // Resolver by name/text
    function resolveByName(name) {
      const n = String(name || '').toLowerCase();
      if (n.includes('heavy'))  return heavy;
      if (n.includes('mellow')) return mellow;
      if (n.includes('middle') || n.includes('rock')) return rock;
      return rock;
    }

    // Expose for debugging
    window.__KZAK_RESOLVE_GENRE__ = resolveByName;

    // Wrap activate(name) to ensure PLAYLIST points to the right array
    if (typeof window.activate === 'function' && !window.activate.__kzakGenreShim) {
      const origActivate = window.activate;
      window.activate = function (name) {
        try { window.PLAYLIST = resolveByName(name); } catch {}
        const rv = origActivate.apply(this, arguments);
        try { if (typeof window.buildList === 'function') window.buildList(); } catch {}
        return rv;
      };
      window.activate.__kzakGenreShim = true;
      console.log('[KZAK] genre shim: activate() wrapped');
    } else {
      console.log('[KZAK] genre shim: activate() not found or already wrapped');
    }

    // As an extra guard, wire the visible genre buttons if present
    function wireButtonsOnce() {
      const labels = [
        { text: 'Heavy and Metal', arr: heavy },
        { text: 'Middle Ground Rock', arr: rock },
        { text: 'Mellow Tunes', arr: mellow },
      ];
      labels.forEach(({ text, arr }) => {
        const btn = Array.from(document.querySelectorAll('button, a')).find(el => (el.textContent || '').trim() === text);
        if (btn && !btn.__kzakWired) {
          btn.addEventListener('click', (e) => {
            try {
              // Let the app do its thing, but also ensure PLAYLIST points to the right data
              window.PLAYLIST = arr;
              // Some builds rely on activate() to set internal indices
              if (typeof window.activate === 'function') {
                // name helps our wrapper choose the same array
                window.activate(text);
                e.preventDefault();
              } else if (typeof window.buildList === 'function') {
                window.buildList();
                e.preventDefault();
              }
            } catch {}
          }, { capture: true });
          btn.__kzakWired = true;
          console.log('[KZAK] genre shim: wired button →', text);
        }
      });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', wireButtonsOnce, { once: true });
    } else {
      wireButtonsOnce();
    }
  } catch (err) {
    console.warn('[KZAK] genre shim error', err);
  }
})();
