"use client";
/**
 * - Enregistre l'agent de service (PWA) en production.
 * - Affiche un bandeau quand le téléphone perd le réseau.
 */
import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export default function Reseau() {
  const [horsLigne, setHorsLigne] = useState(false);

  useEffect(() => {
    // En développement, l'agent de service gênerait le rechargement à chaud.
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/service-worker.js").catch(() => {});
    }
    const maj = () => setHorsLigne(!navigator.onLine);
    maj();
    window.addEventListener("online", maj);
    window.addEventListener("offline", maj);
    return () => {
      window.removeEventListener("online", maj);
      window.removeEventListener("offline", maj);
    };
  }, []);

  if (!horsLigne) return null;
  return (
    <div className="bandeau-reseau" role="status">
      <WifiOff size={16} aria-hidden="true" />
      Pas de réseau. Les informations affichées peuvent dater.
    </div>
  );
}
