/* Service worker: deja la app disponible sin conexión.
   Sube el número de VERSION cuando cambies index.html para que los móviles se actualicen. */
var VERSION = "entreno-v5";
var ARCHIVOS = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(ARCHIVOS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* Primero la red (para recibir cambios) y, si no hay conexión, la copia guardada. */
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req).then(function (res) {
      var copia = res.clone();
      caches.open(VERSION).then(function (c) { c.put(req, copia); });
      return res;
    }).catch(function () {
      return caches.match(req).then(function (r) { return r || caches.match("index.html"); });
    })
  );
});
