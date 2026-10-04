/* Service Worker von "Unser Nest"
   Sorgt dafür, dass die App auch ohne Internet startet (z. B. im Kreißsaal
   mit schlechtem Empfang). Die DATEN speichert Firestore selbst offline –
   hier wird nur die App selbst (HTML, Symbole, Firebase-Bibliotheken,
   Schriften) zwischengespeichert.

   - App-Seite und Konfiguration: zuerst aus dem Netz (immer die neueste
     Version), bei fehlender Verbindung aus dem Zwischenspeicher.
   - Firebase-Bibliotheken und Schriften: haben feste Versionen bzw. ändern
     sich nicht → aus dem Zwischenspeicher, sonst aus dem Netz.
   - Alles andere (Anmeldung, Datenbank) läuft unverändert direkt über das Netz. */

// Bei jeder neuen Version (v. a. neue Firebase-Version in index.html) den
// Namen hochzählen – dann werden alte Dateien beim nächsten Start aufgeräumt.
var CACHE = "unser-nest-v2.2";
var APP_SHELL = ["/", "/manifest.webmanifest", "/icons/icon.svg", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/apple-touch-icon.png"];

self.addEventListener("install", function(event){
  event.waitUntil(
    caches.open(CACHE).then(function(cache){ return cache.addAll(APP_SHELL); }).catch(function(){})
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k.indexOf("unser-nest-") === 0 && k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

function networkFirst(request, cacheKey){
  return fetch(request).then(function(res){
    if (res && res.ok){
      var copy = res.clone();
      caches.open(CACHE).then(function(c){ c.put(cacheKey || request, copy); });
    }
    return res;
  }).catch(function(){
    return caches.match(cacheKey || request).then(function(hit){ return hit || Response.error(); });
  });
}

function cacheFirst(request){
  return caches.match(request).then(function(hit){
    if (hit) return hit;
    return fetch(request).then(function(res){
      // auch "opaque" Antworten (Skripte ohne CORS) dürfen gespeichert werden
      if (res && (res.ok || res.type === "opaque")){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(request, copy); });
      }
      return res;
    });
  });
}

self.addEventListener("fetch", function(event){
  var req = event.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);

  if (url.origin === self.location.origin){
    if (url.pathname.indexOf("/__/auth/") === 0) return;           // Anmelde-Fenster von Firebase
    if (req.mode === "navigate") { event.respondWith(networkFirst(req, "/")); return; }
    if (url.pathname === "/__/firebase/init.json") { event.respondWith(networkFirst(req)); return; }
    if (APP_SHELL.indexOf(url.pathname) !== -1 || url.pathname.indexOf("/icons/") === 0) { event.respondWith(networkFirst(req)); return; }
    return;
  }
  if (url.hostname === "www.gstatic.com" && url.pathname.indexOf("/firebasejs/") === 0){ event.respondWith(cacheFirst(req)); return; }
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com"){ event.respondWith(cacheFirst(req)); return; }
});
