/* Service worker: deja la app disponible sin conexión.
   Sube el número de VERSION cuando cambies index.html para que los móviles se actualicen.
   En GitHub Pages todos los proyectos de un usuario comparten origen (y por tanto cachés), así que este
   archivo solo toca las cachés con su propio prefijo y solo sirve archivos de su propia carpeta. */
var PREFIJO = "entreno-app-";
var VERSION = PREFIJO + "v11";
var ARCHIVOS = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png"];

/* Cachés propias: las nuevas (entreno-app-vN) y las de versiones antiguas (entreno-vN). */
function esMia(nombre) { return nombre.indexOf(PREFIJO) === 0 || /^entreno-v\d+$/.test(nombre); }

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(ARCHIVOS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.filter(function (k) { return k !== VERSION && esMia(k); }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* Primero la red (para recibir cambios) y, si no hay conexión, la copia guardada. */
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET" || req.url.indexOf(self.registration.scope) !== 0) return;
  e.respondWith(
    fetch(req).then(function (res) {
      var copia = res.clone();
      caches.open(VERSION).then(function (c) { c.put(req, copia); });
      return res;
    }).catch(function () {
      return caches.open(VERSION).then(function (c) {
        return c.match(req).then(function (r) { return r || c.match("index.html"); });
      });
    })
  );
});
