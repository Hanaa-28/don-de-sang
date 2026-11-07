import { config } from "../config.js";

/**
 * Envoie le code de vérification au donneur.
 *
 * Sans jeton WhatsApp configuré (développement), le code est journalisé dans la
 * console pour permettre les tests — jamais en production. L'envoi réel via la
 * Cloud API de WhatsApp sera branché ici (webhook + message) quand le compte
 * WhatsApp Business du projet sera disponible.
 */
export async function envoyerCodeWhatsApp(
  telephone: string,
  code: string,
  objet: "inscription" | "mot_de_passe",
): Promise<void> {
  if (!config.whatsappToken || !config.whatsappPhoneNumberId) {
    console.log(`[WHATSAPP-DEV] code ${code} pour ${telephone} (${objet})`);
    return;
  }
  // Production : appel à la Cloud API. Le code n'est jamais journalisé ici.
  console.log(`[WHATSAPP] envoi réel non branché (code non journalisé) vers ${telephone} (${objet})`);
}
