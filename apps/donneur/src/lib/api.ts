/**
 * Client d'API de l'application des donneurs.
 * Un seul interrupteur (NEXT_PUBLIC_UTILISER_EXEMPLES) bascule entre
 * les exemples JSON du contrat et le vrai backend : les écrans ne changent pas.
 */
import type {
  Reponse, ProfilDonneur, CarteDonneur, Alerte, DonHistorique, Centre, Notification,
  ConnexionRequete, ConnexionReponse, ReponseAlerte,
} from "@dds/contrat-api";

import exConnexion from "@dds/contrat-api/exemples/connexion.json";
import exProfil from "@dds/contrat-api/exemples/profil.json";
import exCarte from "@dds/contrat-api/exemples/carte.json";
import exAlertes from "@dds/contrat-api/exemples/alertes.json";
import exHistorique from "@dds/contrat-api/exemples/historique.json";
import exCentres from "@dds/contrat-api/exemples/centres.json";
import exNotifications from "@dds/contrat-api/exemples/notifications.json";

const UTILISER_EXEMPLES = process.env.NEXT_PUBLIC_UTILISER_EXEMPLES !== "false";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function exemple<T>(json: unknown): Promise<T> {
  // Petit délai pour simuler le réseau et voir les états de chargement.
  return new Promise((r) => setTimeout(() => r((json as Reponse<T>).donnees), 300));
}

async function appel<T>(chemin: string, options: RequestInit = {}): Promise<T> {
  const jeton = typeof window !== "undefined" ? localStorage.getItem("jeton") : null;
  const res = await fetch(`${API_URL}${chemin}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}),
      ...options.headers,
    },
  });
  const corps = await res.json();
  if (!res.ok) throw new Error(corps?.erreur?.message ?? "Erreur réseau");
  return (corps as Reponse<T>).donnees;
}

export const api = {
  connexion: (r: ConnexionRequete) =>
    UTILISER_EXEMPLES
      ? exemple<ConnexionReponse>(exConnexion)
      : appel<ConnexionReponse>("/auth/connexion", { method: "POST", body: JSON.stringify(r) }),
  profil: () =>
    UTILISER_EXEMPLES ? exemple<ProfilDonneur>(exProfil) : appel<ProfilDonneur>("/donneurs/moi"),
  carte: () =>
    UTILISER_EXEMPLES ? exemple<CarteDonneur>(exCarte) : appel<CarteDonneur>("/donneurs/moi/carte"),
  alertes: () =>
    UTILISER_EXEMPLES ? exemple<Alerte[]>(exAlertes) : appel<Alerte[]>("/donneurs/moi/alertes"),
  repondreAlerte: (id: string, reponse: ReponseAlerte) =>
    UTILISER_EXEMPLES
      ? Promise.resolve()
      : appel<void>(`/alertes/${id}/reponse`, { method: "POST", body: JSON.stringify({ reponse }) }),
  historique: () =>
    UTILISER_EXEMPLES ? exemple<DonHistorique[]>(exHistorique) : appel<DonHistorique[]>("/donneurs/moi/historique"),
  centres: () =>
    UTILISER_EXEMPLES ? exemple<Centre[]>(exCentres) : appel<Centre[]>("/centres"),
  notifications: () =>
    UTILISER_EXEMPLES ? exemple<Notification[]>(exNotifications) : appel<Notification[]>("/donneurs/moi/notifications"),
};
