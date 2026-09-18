/* 서울도담치과 관리자 — 예약 알림 서비스 워커 (캐시 없음, 푸시 알림 전용) */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

self.addEventListener('push', function (e) {
  var data = {};
  try { data = e.data ? e.data.json() : {}; } catch (err) { data = { body: e.data ? e.data.text() : '' }; }
  var title = data.title || '새 예약 신청';
  var options = {
    body: data.body || '',
    tag: data.tag || 'reservation',
    renotify: true,
    icon: '/favicon-192.png',
    badge: '/favicon-192.png',
    data: { url: data.url || '/admin/reservations' }
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || '/admin/reservations';
  var target = new URL(url, self.location.origin).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      var client = list[i];
      if (new URL(client.url).origin === self.location.origin && 'focus' in client) {
        return client.focus().then(function (c) { return c && 'navigate' in c ? c.navigate(target) : c; });
      }
    }
    return self.clients.openWindow(target);
  }));
});
