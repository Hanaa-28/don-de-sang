// Agent de service de l'application des donneurs.
// 1. Il rend l'application installable (PWA).
// 2. Il garde la coquille et les pages déjà visitées : l'application s'ouvre
//    même quand le réseau est lent ou coupé.
// 3. Sans réseau et sans copie en cache, il affiche la page /hors-connexion.
// 4. Il affiche les notifications envoyées par le centre (alertes).
//
// Changer VERSION à chaque modification de ce fichier pour forcer la mise à jour.
const VERSION = "dds-v1";
const PRECHARGE = ["/", "/hors-connexion", "/manifest.json", "/icones/icone-192.png"];

self.addEventListener("install", (evenement) => {
  evenement.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(PRECHARGE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (evenement) => {
  evenement.waitUntil(
    caches.keys()
      .then((cles) => Promise.all(cles.filter((cle) => cle !== VERSION).map((cle) => caches.delete(cle))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (evenement) => {
  const requete = evenement.request;
  const url = new URL(requete.url);
  // On ne touche ni aux appels de l'API (autre origine), ni aux envois de données.
  if (requete.method !== "GET" || url.origin !== self.location.origin) return;

  // Pages : réseau d'abord, copie en cache en secours, puis page hors connexion.
  if (requete.mode === "navigate") {
    evenement.respondWith(
      fetch(requete)
        .then((reponse) => {
          const copie = reponse.clone();
          caches.open(VERSION).then((cache) => cache.put(requete, copie));
          return reponse;
        })
        .catch(async () => (await caches.match(requete)) || caches.match("/hors-connexion"))
    );
    return;
  }

  // Fichiers statiques (scripts, styles, icônes) : cache d'abord, ils ne changent pas.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icones/")) {
    evenement.respondWith(
      caches.match(requete).then((trouve) => trouve || fetch(requete).then((reponse) => {
        const copie = reponse.clone();
        caches.open(VERSION).then((cache) => cache.put(requete, copie));
        return reponse;
      }))
    );
  }
});

// Notification envoyée par le backend : { titre, corps, lien }.
self.addEventListener("push", (evenement) => {
  let donnees = {};
  try { donnees = evenement.data ? evenement.data.json() : {}; } catch { donnees = {}; }
  evenement.waitUntil(
    self.registration.showNotification(donnees.titre || "Don de sang", {
      body: donnees.corps || "Un centre a besoin de votre groupe sanguin.",
      icon: "/icones/icone-192.png",
      badge: "/icones/icone-192.png",
      data: { lien: donnees.lien || "/alertes" },
    })
  );
});

self.addEventListener("notificationclick", (evenement) => {
  evenement.notification.close();
  const lien = evenement.notification.data?.lien || "/alertes";
  evenement.waitUntil((async () => {
    const fenetres = await clients.matchAll({ type: "window", includeUncontrolled: true });
    const ouverte = fenetres.find((f) => f.url.startsWith(self.location.origin));
    if (ouverte) {
      await ouverte.focus();
      if ("navigate" in ouverte) return ouverte.navigate(lien);
    }
    return clients.openWindow(lien);
  })());
});
