// Aquesta versió del SOS està retirada (18/10/2026). Aquest service worker
// esborra la memòria cau de l'antic, es desinstal·la i porta al SOS d'ara.
// Les dades del navegador no es toquen.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil((async () => {
    for (const k of await caches.keys()) await caches.delete(k);
    await self.registration.unregister();
    for (const c of await self.clients.matchAll({ type: 'window' })) c.navigate('https://teamtowershuma.com/SOS/');
})()));
