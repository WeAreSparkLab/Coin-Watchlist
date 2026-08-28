// Offline shell for Coin Watchlist.
// Bump CACHE when the shell changes so old copies are dropped on activate.
var CACHE = "coin-watchlist-v1";
var SHELL = ["./", "./index.html", "./manifest.webmanifest",
             "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

// Cache storage is not always there: private windows, blocked site data, a
// full quota, or a browser that simply refuses. None of that should stop the
// app installing or loading, so every cache call below is best-effort and a
// failure falls straight through to the network.
function openCache() {
  try {
    return caches.open(CACHE).catch(function () { return null; });
  } catch (e) {
    return Promise.resolve(null);
  }
}

function matchCache(request) {
  try {
    return caches.match(request).catch(function () { return undefined; });
  } catch (e) {
    return Promise.resolve(undefined);
  }
}

function putInCache(request, response) {
  if (!response || !response.ok) return;
  var copy = response.clone();
  openCache().then(function (cache) {
    if (cache) { try { cache.put(request, copy); } catch (e) { } }
  });
}

self.addEventListener("install", function (event) {
  event.waitUntil(
    openCache().then(function (cache) {
      if (!cache) return null;
      // Individually, so one missing file cannot fail the whole install.
      return Promise.all(SHELL.map(function (url) {
        return cache.add(url).catch(function () { });
      }));
    }).catch(function () { }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    Promise.resolve().then(function () {
      return caches.keys();
    }).then(function (keys) {
      return Promise.all(keys.map(function (key) {
        return key === CACHE ? null : caches.delete(key);
      }));
    }).catch(function () { }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (event) {
  var request = event.request;
  if (request.method !== "GET") return;

  var url;
  try { url = new URL(request.url); } catch (e) { return; }

  // Never touch anything off-origin. The price and backup APIs must always
  // hit the network: a cached quote is a wrong quote, and a cached Supabase
  // reply would resurrect stale data.
  if (url.origin !== self.location.origin) return;

  // Pages: network first, so an updated app is picked up as soon as there is
  // a connection, with the cached copy as the offline fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).then(function (response) {
        putInCache(request, response);
        return response;
      }).catch(function () {
        return matchCache(request).then(function (hit) {
          if (hit) return hit;
          return matchCache("./index.html").then(function (index) {
            return index || Response.error();
          });
        });
      })
    );
    return;
  }

  // Everything else same-origin (icons, manifest): serve from cache at once
  // and refresh it in the background.
  event.respondWith(
    matchCache(request).then(function (hit) {
      if (hit) {
        fetch(request).then(function (response) {
          putInCache(request, response);
        }).catch(function () { });
        return hit;
      }
      return fetch(request).then(function (response) {
        putInCache(request, response);
        return response;
      });
    }).catch(function () {
      return fetch(request);
    })
  );
});
