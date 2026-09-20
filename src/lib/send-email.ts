export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const apiKey = process.env.MAILERSEND_API_KEY;
  const from = process.env.MAILERSEND_FROM_EMAIL;

  if (!apiKey || !from) {
    console.error(
      "[Tracko] MAILERSEND_API_KEY ou MAILERSEND_FROM_EMAIL manquant — email non envoyé."
    );
    return false;
  }

  try {
    const response = await fetch("https://api.mailersend.com/v1/email", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: {
          email: from,
          name: "TRACKO",
        },
        to: [{ email: to }],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[Tracko] Échec envoi email MailerSend (${response.status}) :`,
        errorText
      );
      return false;
    }

    return true;
  } catch (err) {
    console.error("[Tracko] Erreur réseau MailerSend :", err);
    return false;
  }
}