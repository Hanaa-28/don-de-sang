import { config } from "../config.js";

/**
 * Envoi des codes de vérification par WhatsApp (Cloud API de Meta).
 *
 * - Sans jeton configuré (développement), le code est journalisé dans la
 *   console pour permettre les tests — jamais en production.
 * - Avec jeton, le message est réellement envoyé via la Cloud API. Le code
 *   n'est alors jamais journalisé.
 *
 * L'envoi échoue « silencieusement » côté donneur : on ne fait pas échouer la
 * requête d'inscription/renvoi, le code a déjà été créé et le donneur peut le
 * redemander (route /auth/code/renvoi). L'échec est journalisé côté serveur.
 */

const VERSION_API = "v21.0";

function corpsMessage(code: string, objet: "inscription" | "mot_de_passe"): string {
  const intro = objet === "inscription"
    ? "Votre code de vérification Don de sang est"
    : "Votre code de réinitialisation Don de sang est";
  return `${intro} : ${code}. Il expire dans 10 minutes. Ne le partagez à personne.`;
}

export async function envoyerCodeWhatsApp(
  telephone: string,
  code: string,
  objet: "inscription" | "mot_de_passe",
): Promise<void> {
  if (!config.whatsappToken || !config.whatsappPhoneNumberId) {
    console.log(`[WHATSAPP-DEV] code ${code} pour ${telephone} (${objet})`);
    return;
  }

  const url = `https://graph.facebook.com/${VERSION_API}/${config.whatsappPhoneNumberId}/messages`;
  try {
    const reponse = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.whatsappToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: telephone,
        type: "text",
        text: { body: corpsMessage(code, objet) },
      }),
    });
    if (!reponse.ok) {
      console.error(`[WHATSAPP] envoi refusé (${reponse.status}) : ${await reponse.text()}`);
    }
  } catch (err) {
    console.error("[WHATSAPP] échec réseau lors de l'envoi :", err);
  }
}
