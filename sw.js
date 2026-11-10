/* Service worker: deja la app disponible sin conexión.
   Sube el número de VERSION cuando cambies index.html para que los móviles se actualicen.
   En GitHub Pages todos los proyectos de un usuario comparten origen (y por tanto cachés), así que este
   archivo solo toca las cachés con su propio prefijo y solo sirve archivos de su propia carpeta. */
var PREFIJO = "entreno-app-";
var VERSION = PREFIJO + "v15";
var ARCHIVOS = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png"];

/* Una caché es mía si lleva el prefijo propio, o si es una antigua (entreno-vN) que guarda archivos de la carpeta de esta app.
   Una caché con ese nombre antiguo pero con archivos de otro sitio del mismo origen no se toca. */
function esMia(nombre) {
  if (nombre.indexOf(PREFIJO) === 0) return Promise.resolve(true);
  if (!/^entreno-v\d+$/.test(nombre)) return Promise.resolve(false);
  return caches.open(nombre).then(function (c) { return c.keys(); }).then(function (rs) {
    return rs.some(function (r) { return r.url.indexOf(self.registration.scope) === 0; });
  });
}

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(ARCHIVOS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.filter(function (k) { return k !== VERSION; }).map(function (k) {
        return esMia(k).then(function (mia) { return mia ? caches.delete(k) : false; });
      }));
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
