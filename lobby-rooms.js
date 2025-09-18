 // lobby-rooms.js — baseline-compatible

// Build the shared full-screen intro overlay
function buildIntroOverlay(message) {
  const wrap = document.createElement('div');
  wrap.className = 'room-intro-overlay';
  wrap.setAttribute('role', 'dialog');
  wrap.setAttribute('aria-modal', 'true');

  wrap.innerHTML = `
    <div class="intro-frame">
      <video class="intro-video" playsinline preload="auto"></video>
      <div class="intro-ui">
        <p class="intro-status" aria-live="polite">${message}</p>
        <button type="button" class="intro-skip" aria-label="Skip transition and enter room">Skip →</button>
      </div>
    </div>
  `;

  document.body.appendChild(wrap);
  return wrap;
}

// Play the intro clip and then navigate (or let users skip)
function playIntroThenGo(introSrc, roomTarget) {
  const overlay = buildIntroOverlay('Loading room transition video… hit Skip if slow');
  const vid = overlay.querySelector('.intro-video');
  const status = overlay.querySelector('.intro-status');
  const skip = overlay.querySelector('.intro-skip');

  const go = () => { location.href = roomTarget; };

  // Accessibility / keyboard
  skip.addEventListener('click', go);
  overlay.addEventListener('keydown', e => { if (e.key === 'Escape') go(); });

  // Gentle hint if the CDN is slow
  const hintTimer = setTimeout(() => {
    status.textContent = 'Still loading… you can hit Skip → if it feels slow';
  }, 2500);

  // Playback feedback
  vid.addEventListener('loadeddata', () => { status.textContent = 'Starting…'; });
  vid.addEventListener('waiting', () => { status.textContent = 'Buffering… hit Skip → if slow'; });
  vid.addEventListener('error', () => { status.textContent = 'Trouble loading video. Skipping…'; go(); });
  vid.addEventListener('ended', go);

  // Start
  vid.src = introSrc;
  vid.play().catch(() => {
    status.textContent = 'Autoplay blocked. Click Skip → to enter the room';
  });
}

// Generic handler (matches your baseline: buttons with .enter-room + data-intro/data-target)
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.enter-room');
  if (!btn) return;

  e.preventDefault();
  const intro = btn.getAttribute('data-intro');
  const target = btn.getAttribute('data-target');

  // Only local MP4s get the overlay; TikTok tiles should go direct
  if (intro) {
    playIntroThenGo(intro, target);
  } else if (target) {
    location.href = target;
  }
});
