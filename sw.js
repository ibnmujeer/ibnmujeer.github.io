/* Awwfy Studios service worker.
   Makes the website open offline, and lets games that were opened before still open offline.
   When you change the website, raise VERSION by one (v2, v3...) so phones pick up the new files. */
var VERSION = "v1";
var HUB = "awwfy-hub-" + VERSION;
var GAMES = "awwfy-games-" + VERSION;

var CORE = [
  "./", "index.html", "offline.html", "404.html", "manifest.webmanifest",
  "css/styles.css", "js/content.js", "js/app.js",
  "assets/fonts/anton-latin-400-normal.woff2", "assets/fonts/inter-latin-400-normal.woff2",
  "assets/fonts/inter-latin-600-normal.woff2", "assets/fonts/inter-latin-800-normal.woff2",
  "assets/fonts/space-mono-latin-400-normal.woff2", "assets/fonts/space-mono-latin-700-normal.woff2",
  "assets/img/logo.png", "assets/img/emblem.png", "assets/img/bunny-hero.webp", "assets/img/bunny-think.jpg",
  "assets/icons/icon-192.png", "assets/icons/favicon-64.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(HUB).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf("awwfy-") === 0 && k !== HUB && k !== GAMES; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function rel(url) { return url.href.slice(self.registration.scope.length); }
function isHub(path) {
  return path === "" || path === "index.html" || path === "offline.html" || path === "404.html" ||
    path === "manifest.webmanifest" || /^(css|js|assets)\//.test(path);
}
function offline() { return caches.match("offline.html"); }

/* Try the network first, keep a copy, fall back to the saved copy. */
function networkFirst(req, cacheName, isPage) {
  return fetch(req).then(function (res) {
    if (res && res.ok && res.type === "basic") {
      var copy = res.clone();
      caches.open(cacheName).then(function (c) { c.put(req, copy); });
    }
    return res;
  }).catch(function () {
    return caches.match(req).then(function (hit) { return hit || (isPage ? offline() : Response.error()); });
  });
}
/* Show the saved copy at once, refresh it quietly in the background. */
function staleWhileRevalidate(req) {
  return caches.open(HUB).then(function (c) {
    return c.match(req).then(function (hit) {
      var net = fetch(req).then(function (res) { if (res && res.ok) c.put(req, res.clone()); return res; })
        .catch(function () { return hit || Response.error(); });
      return hit || net;
    });
  });
}

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;     /* other websites: leave alone */
  if (req.headers.has("range")) return;                  /* video streaming: let the browser handle it */
  var path = rel(url).split("#")[0].split("?")[0];
  var isPage = req.mode === "navigate";

  if (isHub(path)) {
    e.respondWith(isPage || path === "" || path === "index.html" || /\.js$|\.css$|content/.test(path)
      ? networkFirst(req, HUB, isPage)
      : staleWhileRevalidate(req));
    return;
  }
  /* Everything else on awwfy.com is a game: fresh when online, saved copy when offline. */
  e.respondWith(networkFirst(req, GAMES, isPage));
});
