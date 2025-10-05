/* KZAK — ROCK playlist (classic script, global only)
   This version removes ES-module syntax to work in <script> without type="module".
   It exposes window.PLAYLIST_ROCK. */

// Use var (not const) to avoid 'already been declared' if the file is included twice.
var PLAYLIST_ROCK = [
  {
    title: "Billys Eyes Without His Face",
    file:  "Media/Billys Eyes without His Face.mp3",
    img:   "Media/BillysEyesWithoutHisFace.png",
    alt:   "Billys Eyes — artwork",
    genre: "Middle Ground Rock",
    story: "From the dance-rock master himself."
  },
  {
    title: "Touching Too Much",
    file:  "Media/Touching Too Much.mp3",
    img:   "Media/TouchingTooMuch.jpeg",
    alt:   "Touching Too Much — artwork",
    genre: "Middle Ground Rock",
    story: "From the demo archives."
  },
  {
    title: "Catching My Fall",
    file:  "Media/Catching My Fall.mp3",
    img:   "Media/CatchingMyFall.jpeg",
    alt:   "Catching My Fall — artwork",
    genre: "Middle Ground Rock",
    story: "A winner tune from the spike-haired Rebel Yell creator."
  },
  {
    title: "Alexanders Greatness",
    file:  "Media/Alexanders Greatness.mp3",
    img:   "Media/AlexandersGreatness.jpeg",
    alt:   "Alexanders Greatness — artwork",
    genre: "Middle Ground Rock",
    story: "Fast, proggy energy."
  },
  {
    title: "Billys Flesh For Fantasy",
    file:  "Media/Billys Flesh For Fantasy.mp3",
    img:   "Media/BillysFleshForFantasy.jpeg",
    alt:   "Billys Flesh For Fantasy — artwork",
    genre: "Middle Ground Rock",
    story: "Another dance-party remix."
  },
  {
    title: "She Sells Sanctuary Plots",
    file:  "Media/She Sells Sanctuary Plots.mp3",
    img:   "Media/SheSellsSanctuaryPlots.jpeg",
    alt:   "She Sells Sanctuary Plots — artwork",
    genre: "Middle Ground Rock",
    story: "A 90s classic reimagined."
  },

  /* ---- keep the rest of your tracks here (e.g., Grandios Designs, etc.) ---- */
  {
    title: "Grandios Designs",
    file:  "Media/Grandios Designs.mp3",   // fixed stray space before .mp3
    img:   "Media/GrandiosDesigns.jpeg",
    alt:   "Grandios Designs — artwork",
    genre: "Middle Ground Rock",
    story: "A great tune from the great white north."
  },
  {
    title: "Manhattan Project Revisited",
    file:  "Media/Manhattan Project Revisited.mp3",
    img:   "Media/ManhattanProject.jpeg",
    alt:   "Manhattan Project — artwork",
    genre: "Middle Ground Rock",
    story: "Toronto power, revisited."
  }
];

// Expose globally (classic script)
if (typeof window !== "undefined") window.PLAYLIST_ROCK = PLAYLIST_ROCK;
