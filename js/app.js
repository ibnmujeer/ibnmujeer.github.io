/* Awwfy Studios. Page behaviour. Content comes from js/content.js. */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement;
  root.classList.remove("no-js");

  var C = window.AWWFY || { site: "https://awwfy.com/", contact: {}, science: [], free: [], showcase: [], valence: {} };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (id) { return doc.getElementById(id); };

  var SUBJECTS = ["physics", "chemistry", "biology", "space", "maths", "reading"];
  var SUBJECT_LABEL = { physics: "Physics", chemistry: "Chemistry", biology: "Biology", space: "Space", maths: "Maths", reading: "Reading" };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function gameUrl(g) { return g.url || (C.site + g.id + "/"); }
  function shot(g) { return g.img || ("assets/shots/" + g.id + ".jpg"); }
  function safePlay(v) { try { var p = v.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {} }
  function allGames() { return (C.science || []).concat(C.free || []); }
  function byId(id) { var a = allGames(); for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }

  function chips(g) {
    var h = '<span class="chip ' + esc(g.subject) + '">' + esc(SUBJECT_LABEL[g.subject] || g.subject) + "</span>";
    h += g.lang === "ar" ? '<span class="chip lang" lang="ar">عربي</span>' : '<span class="chip lang">EN</span>';
    if (g.kids) h += '<span class="chip kids">Kids</span>';
    return '<div class="chips">' + h + "</div>";
  }
  function title(g, tag) {
    var ar = g.lang === "ar" && /[؀-ۿ]/.test(g.name);
    return "<" + tag + (ar ? ' lang="ar" dir="rtl"' : "") + ">" + esc(g.name) + "</" + tag + ">";
  }
  /* Images that fail to load are swapped for a neat text fallback.
     The listener is attached before the picture starts loading, so no failure is missed. */
  function guardImg(img, onFail) {
    if (!img) return;
    var done = false;
    var fail = function () { if (done) return; done = true; img.removeAttribute("src"); img.hidden = true; if (onFail) onFail(); };
    img.addEventListener("error", fail);
    img.addEventListener("load", function () { if (!img.naturalWidth) fail(); });
    var src = img.getAttribute("data-src");
    if (src) { img.removeAttribute("data-src"); img.src = src; }
    else if (img.complete && img.getAttribute("src") && !img.naturalWidth) fail();
  }

  /* ---------- small text bits ---------- */
  var words = ["Physics", "Chemistry", "Biology", "Space", "Maths", "Reading", "Play to learn"], seq = "";
  words.forEach(function (w) { seq += "<span>( " + w + " )</span><span class='x'>&#10033;</span>"; });
  if ($("track")) $("track").innerHTML = seq + seq + seq + seq;
  if ($("year")) $("year").textContent = new Date().getFullYear();
  if (C.contact.hello && $("mailHello")) { $("mailHello").href = "mailto:" + C.contact.hello; $("mailHello").textContent = C.contact.hello; }
  if (C.contact.careers && $("mailJoin")) { $("mailJoin").href = "mailto:" + C.contact.careers; $("mailJoin").textContent = C.contact.careers; }

  var V = C.valence || {};
  if ($("valTag")) $("valTag").textContent = V.tagline || "";
  if ($("valBlurb")) $("valBlurb").textContent = V.blurb || "";
  if ($("valStatus") && V.status) $("valStatus").textContent = "( Chapter 1 ) " + V.status;
  /* "Get early access" scrolls to the footer and highlights the early access line */
  if ($("valCta")) {
    if (V.cta) $("valCta").firstChild.nodeValue = V.cta + " ";
    $("valCta").addEventListener("click", function (ev) {
      var t = $("contact"); if (!t) return;
      ev.preventDefault();
      t.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      var e = $("early");
      if (e) { e.classList.remove("flash"); void e.offsetWidth; e.classList.add("flash"); }
      if (history.replaceState) history.replaceState(null, "", "#contact");
    });
  }

  /* ---------- game cards ---------- */
  function card(g) {
    var a = doc.createElement(g.soon ? "div" : "a");
    a.className = "game rv" + (g.soon ? " soon" : "");
    a.dataset.subject = g.subject; a.dataset.lang = g.lang || "en";
    if (!g.soon) { a.href = gameUrl(g); a.setAttribute("aria-label", "Play " + g.name + (g.sub ? ", " + g.sub : "")); }
    var hasImg = !(g.soon && !g.img && g.id === "nutrient-run");
    a.innerHTML =
      '<div class="thumb">' + (hasImg ? '<img loading="lazy" decoding="async" data-src="' + esc(shot(g)) + '" alt="">' : "") +
      '<div class="fallback"' + (hasImg ? " hidden" : "") + ">" + esc(g.sub || g.name) + "</div></div>" +
      (g.soon ? '<span class="soon-tag">Coming soon</span>' : '<span class="go" aria-hidden="true">&rarr;</span>') +
      '<div class="meta">' + chips(g) + title(g, "h3") + (g.sub ? '<span class="sub">' + esc(g.sub) + "</span>" : "") + "<p>" + esc(g.line) + "</p></div>";
    guardImg(a.querySelector("img"), function () { a.querySelector(".fallback").hidden = false; });
    return a;
  }
  function fill(id, list) { var w = $(id); if (!w) return; (list || []).forEach(function (g) { w.appendChild(card(g)); }); }
  fill("science", C.science); fill("free", C.free);

  /* ---------- filters ---------- */
  var state = { subject: "all", lang: "all" };
  function addBtn(row, key, val, label, ar) {
    var b = doc.createElement("button"); b.type = "button"; b.textContent = label;
    if (ar) b.setAttribute("lang", "ar");
    b.setAttribute("aria-pressed", val === "all" ? "true" : "false");
    b.addEventListener("click", function () {
      state[key] = val;
      [].forEach.call(row.querySelectorAll("button"), function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      applyFilters();
    });
    row.appendChild(b);
  }
  if ($("fSubject")) { addBtn($("fSubject"), "subject", "all", "All"); SUBJECTS.forEach(function (s) { addBtn($("fSubject"), "subject", s, SUBJECT_LABEL[s]); }); }
  if ($("fLang")) { addBtn($("fLang"), "lang", "all", "All"); addBtn($("fLang"), "lang", "en", "English"); addBtn($("fLang"), "lang", "ar", "العربية", true); }
  function applyFilters(initial) {
    var total = 0;
    [["gScience", "science"], ["gFree", "free"]].forEach(function (p) {
      var shown = 0;
      [].forEach.call(($(p[1]) || doc.createElement("div")).children, function (c) {
        var ok = (state.subject === "all" || c.dataset.subject === state.subject) && (state.lang === "all" || c.dataset.lang === state.lang);
        c.hidden = !ok; if (ok) { shown++; if (!initial) c.classList.add("in"); }
      });
      if ($(p[0])) $(p[0]).hidden = shown === 0;
      total += shown;
    });
    if ($("empty")) $("empty").hidden = total > 0;
    if ($("count")) $("count").textContent = total + (total === 1 ? " game shown" : " games shown");
  }

  /* ---------- showcase row ---------- */
  var row = $("row"), show = $("showcase"), prog = $("prog");
  (C.showcase || []).map(byId).filter(Boolean).forEach(function (g, i) {
    var it = doc.createElement("div"); it.className = "item"; it.setAttribute("role", "listitem");
    it.innerHTML = '<div class="phone"><div class="screen"><img ' + (i > 2 ? 'loading="lazy" ' : "") + 'decoding="async" data-src="' + esc(shot(g)) + '" alt="' + esc(g.name) + ' game screen"></div></div>' +
      title(g, "h3") + chips(g) + '<a class="pill dark sm" href="' + esc(gameUrl(g)) + '" aria-label="Play ' + esc(g.name) + '">Play <span class="arr" aria-hidden="true">&rarr;</span></a>';
    guardImg(it.querySelector("img"));
    row.appendChild(it);
  });
  /* Laptop with a mouse: the row slides sideways exactly with the page scroll. No timed animation. */
  var rowMode = window.matchMedia ? matchMedia("(min-width: 981px) and (pointer: fine)") : { matches: false };
  var travel = 0;
  function measure() {
    if (!row || !show) return;
    if (rowMode.matches) {
      var pin = show.querySelector(".pin");
      travel = Math.max(0, row.scrollWidth - pin.clientWidth);
      show.style.height = (pin.offsetHeight + travel) + "px";
    } else { travel = 0; show.style.height = ""; row.style.transform = ""; }
  }

  /* ---------- scroll loop (one rAF per frame, transforms only) ---------- */
  var top = $("top"), word = $("word"), bunny = $("bunny"), ticking = false;
  function frame() {
    ticking = false;
    var y = window.scrollY || window.pageYOffset;
    if (top) top.classList.toggle("scrolled", y > 40);
    if (!reduce && word && bunny) {
      var p = Math.min(y / 600, 1);
      word.style.transform = "translate3d(0," + (p * 60) + "px,0) scale(" + (1 - p * 0.06) + ")";
      bunny.style.transform = "translate3d(0," + (-p * 30) + "px,0) scale(" + (1 + p * 0.05) + ")";
    }
    if (travel > 0) {
      var r = show.getBoundingClientRect();
      var t = Math.min(Math.max(-r.top / travel, 0), 1);
      row.style.transform = "translate3d(" + (-t * travel).toFixed(1) + "px,0,0)";
      if (prog) prog.style.transform = "scaleX(" + t.toFixed(3) + ")";
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", function () { measure(); frame(); });
  if (rowMode.addEventListener) rowMode.addEventListener("change", function () { measure(); frame(); });
  addEventListener("load", function () { measure(); frame(); });
  measure(); frame();

  /* ---------- hero bunny: transparent video drawn with WebGL ----------
     The video file holds colour on the top half and the see-through mask on the bottom half.
     If WebGL is missing or blocked, the still picture stays. */
  var hv = $("heroVid"), can = $("heroCan"), gl = null, live = false;
  if (hv && can && !reduce) {
    try { gl = can.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false }); } catch (e) { gl = null; }
  }
  if (gl) {
    try {
      var vs = "attribute vec2 p;varying vec2 u;void main(){u=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}";
      var fs = "precision mediump float;varying vec2 u;uniform sampler2D t;void main(){vec3 c=texture2D(t,vec2(u.x,u.y*.5)).rgb;float a=texture2D(t,vec2(u.x,.5+u.y*.5)).r;a=smoothstep(.06,.94,a);gl_FragColor=vec4(c*a,a);}";
      var mk = function (type, src) { var o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); return o; };
      var pg = gl.createProgram(); gl.attachShader(pg, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(pg, mk(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pg);
      if (!gl.getProgramParameter(pg, gl.LINK_STATUS)) throw new Error("shader");
      gl.useProgram(pg);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      var loc = gl.getAttribLocation(pg, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      var failed = false;
      var draw = function () {
        if (failed) return;
        if (hv.readyState >= 2) {
          try {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, hv);
            gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            if (!live) { live = true; bunny.classList.add("live"); }
          } catch (e) { failed = true; bunny.classList.remove("live"); return; }
        }
        if (hv.requestVideoFrameCallback) hv.requestVideoFrameCallback(draw); else requestAnimationFrame(draw);
      };
      draw();
      hv.addEventListener("error", function () { failed = true; bunny.classList.remove("live"); }, true);
      new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) safePlay(hv); else hv.pause(); }); }).observe(bunny);
    } catch (e) { bunny.classList.remove("live"); }
  }

  /* ---------- other videos: load only when near the screen, pause when off screen ---------- */
  var vids = doc.querySelectorAll(".lazyvid");
  if (!reduce && "IntersectionObserver" in window) {
    var vio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) {
          var s = v.querySelector("source[data-src]");
          if (s) { s.src = s.dataset.src; s.removeAttribute("data-src"); v.load(); }
          safePlay(v);
        } else if (!v.paused) v.pause();
      });
    }, { rootMargin: "200px" });
    [].forEach.call(vids, function (v) {
      var poster = v.previousElementSibling;
      v.addEventListener("playing", function () { if (poster && poster.tagName === "IMG") poster.style.opacity = 0; });
      v.addEventListener("error", function () { if (poster) poster.style.opacity = 1; v.hidden = true; }, true);
      vio.observe(v);
    });
  }

  /* ---------- reveal on scroll ---------- */
  var rvs = doc.querySelectorAll(".rv");
  if (!reduce && "IntersectionObserver" in window) {
    var rio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); rio.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    [].forEach.call(rvs, function (n) { rio.observe(n); });
  } else [].forEach.call(rvs, function (n) { n.classList.add("in"); });

  applyFilters(true);

  /* ---------- offline support: register the service worker (only on a real web address) ---------- */
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () { /* the site still works without it */ });
    });
  }
})();
