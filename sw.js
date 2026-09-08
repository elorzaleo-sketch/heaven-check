// Service worker mínimo: solo existe para que el navegador considere
// instalable la página ("Agregar a pantalla de inicio" con ícono propio).
// No cachea nada — todo el tráfico sigue yendo directo a la red / Supabase.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
