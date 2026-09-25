/* =========================================================
   SERVICE WORKER — GATE / 2º BPChq Anchieta

   Objetivo principal: receber notificações push. Não faz
   cache agressivo — o index.html já é servido com
   Cache-Control: no-cache pelo nginx, e queremos que o app
   sempre pegue a versão mais nova.
========================================================= */

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let dados = {};
  try {
    dados = event.data ? event.data.json() : {};
  } catch {
    dados = { title: "GATE Anchieta", body: event.data ? event.data.text() : "" };
  }

  const titulo = dados.title || "2º BPChq Anchieta";
  const opcoes = {
    body: dados.body || "",
    icon: "/anchieta-logo.png",
    badge: "/anchieta-logo.png",
    data: { url: dados.url || "/" },
    tag: dados.tag || "gate-notificacao",
    renotify: true
  };

  event.waitUntil(self.registration.showNotification(titulo, opcoes));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(url) && "focus" in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
  );
});
