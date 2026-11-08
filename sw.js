// Weather app service worker: the page is always fetched fresh when online; the saved copy is only a fallback when offline.
const CACHE = "wx-shell-v1";
const SHELL = ["./", "index.html", "manifest.json", "icon-192.png", "icon-512.png"];
self.addEventListener("install", function (e) {
    e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL).catch(function () {}); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
    e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
    var r = e.request, u = new URL(r.url);
    if (r.method !== "GET" || u.origin !== self.location.origin) return;   // forecasts, maps and other sites are never cached
    e.respondWith(fetch(r).then(function (res) {
        if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(r, copy); }); }
        return res;
    }).catch(function () { return caches.match(r).then(function (m) { return m || caches.match("index.html"); }); }));
});
self.addEventListener("notificationclick", function (e) {
    e.notification.close();
    e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (cs) {
        for (var i = 0; i < cs.length; i++) if ("focus" in cs[i]) return cs[i].focus();
        return self.clients.openWindow("./");
    }));
});
