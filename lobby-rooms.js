 (function(){
  if (!window.MPG_ROOMS || !Array.isArray(window.MPG_ROOMS)) return;
  var host = document.getElementById('exhibits');
  if (!host) return;

  // Build a minimalist row for each room (plaque + poster). Tile click -> room.
  function rand(min,max){ return Math.random()*(max-min)+min; }
  function choose(a){ return a[Math.floor(Math.random()*a.length)]; }
  var FINISHES = ["finish-gilded","finish-ebony","finish-brass","finish-walnut"];

  function makeRow(room){
    var ex = document.createElement('article');
    var plaqueLeft = Math.random() < 0.5;
    var finish = choose(FINISHES);
    var frameTilt = (rand(-0.35,0.35)).toFixed(3) + "deg";
    var plaqueTilt = (rand(-0.4,0.4)).toFixed(3) + "deg";
    var plaqueW = Math.round(rand(240,340)) + "px";
    var plaqueTop = Math.round(rand(0,24)) + "px";
    var spacing = Math.round(rand(16,52));
    ex.className = "exhibit " + (plaqueLeft ? "pl-left" : "pl-right") + " " + finish;
    ex.style.marginBottom = spacing + "px";
    ex.style.setProperty("--frame-tilt", frameTilt);
    ex.style.setProperty("--pl-tilt", plaqueTilt);
    ex.style.setProperty("--plaqueW", plaqueW);
    ex.style.setProperty("--plaqueTop", plaqueTop);

    var plaque = document.createElement('div');
    plaque.className = "plaque-col";
    plaque.innerHTML = '<div class="plaque">'
      + '<h2>' + room.title + '</h2>'
      + '<p>Curated selections. Click the poster or use the button to enter.</p>'
      + '<a class="cta" href="' + room.slug + '/index.html">🏛 Enter this Room</a>'
      + '</div>';

    var frameCol = document.createElement('div');
    frameCol.className = "frame-col";
    var poster = room.poster || "";
    var posterSrc = poster || (room.slug + "/img/cover.jpg");
    frameCol.innerHTML = '<div class="frame-wrap"><div class="frame"><div class="mat">'
      + '<article class="tile" data-room="' + room.slug + '" tabindex="0">'
      +   '<img class="thumb" src="' + posterSrc + '" alt="Poster: ' + room.title.replace(/"/g,'&quot;') + '" loading="lazy" />'
      +   '<div class="overlay"><div class="title">' + room.title + '</div><div class="badge">Enter Room</div></div>'
      + '</article>'
      + '</div></div></div>';

    ex.appendChild(plaque); ex.appendChild(frameCol);
    return ex;
  }

  window.addEventListener('click', function(e){
    var tile = e.target.closest('.tile'); if(!tile || !tile.dataset.room) return;
    var slug = tile.dataset.room;
    window.location.href = slug + "/index.html";
  });

  // Append generated rows AFTER whatever the Uncle page already rendered
  window.MPG_ROOMS.forEach(function(r){ host.appendChild(makeRow(r)); });
})();
