var SCOPE = self.registration.scope;
var CACHE = 'daybook-v1';
var SHELL = ['./', './index.html', './manifest.json', './icon-192.png'];

self.addEventListener('install', function(ev){
  self.skipWaiting();
  ev.waitUntil(
    caches.open(CACHE).then(function(c){
      return Promise.all(SHELL.map(function(u){ return c.add(u).catch(function(){}); }));
    })
  );
});

self.addEventListener('activate', function(ev){
  ev.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){ return k === CACHE ? null : caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(ev){
  var req = ev.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;
  ev.respondWith(
    fetch(req).then(function(res){
      var copy = res.clone();
      caches.open(CACHE).then(function(c){ c.put(req, copy); });
      return res;
    }).catch(function(){
      return caches.match(req).then(function(hit){ return hit || caches.match('./'); });
    })
  );
});

self.addEventListener('push', function(ev){
  var d = {};
  try { d = ev.data ? ev.data.json() : {}; } catch (e) { d = {}; }
  var opts = {
    body: d.body || 'Evening review',
    icon: './icon-192.png',
    badge: './icon-192.png',
    tag: d.tag || 'daybook',
    data: { url: SCOPE + '?s=review' }
  };
  ev.waitUntil(self.registration.showNotification(d.title || 'Daybook', opts));
});

self.addEventListener('notificationclick', function(ev){
  ev.notification.close();
  var url = (ev.notification.data && ev.notification.data.url) || SCOPE;
  ev.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list){
      for (var i = 0; i < list.length; i++){
        if (list[i].url.indexOf(SCOPE) === 0 && 'focus' in list[i]) return list[i].focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
