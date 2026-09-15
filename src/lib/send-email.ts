// Envoi d'email via l'API Resend. RESEND_API_KEY et RESEND_FROM_EMAIL sont
// des variables d'environnement configurées côté Netlify — jamais exposées
// au navigateur (ce module ne tourne que côté serveur).
export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    console.error("[Tracko] RESEND_API_KEY ou RESEND_FROM_EMAIL manquant — email non envoyé.");
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Tracko] Échec envoi email Resend (${response.status}) :`, errorText);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Tracko] Erreur réseau lors de l'envoi email :", err);
    return false;
  }
}
