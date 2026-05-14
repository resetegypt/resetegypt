import PostalMime from 'postal-mime';
import { buildWebhookPayload, type ParsedEmailLike } from './payload.js';

export interface Env {
  RESET_API_URL: string; // ex: https://api.reset-egypt.com
  INBOUND_EMAIL_SECRET: string;
  GMAIL_FALLBACK: string; // ex: resetegypt@gmail.com — filet de sécurité v1
}

export default {
  async email(message: ForwardableEmailMessage, env: Env): Promise<void> {
    // 1. Parser l'email brut.
    const raw = await new Response(message.raw).arrayBuffer();
    const parsed = (await PostalMime.parse(raw)) as ParsedEmailLike;
    const payload = buildWebhookPayload(message.to, parsed);

    // 2. POST vers le webhook de l'API RESET.
    try {
      const res = await fetch(`${env.RESET_API_URL}/inbound/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': env.INBOUND_EMAIL_SECRET,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        console.error(`Webhook a répondu ${res.status}: ${await res.text()}`);
      }
    } catch (err) {
      console.error('Échec POST webhook /inbound/email', err);
    }

    // 3. Filet de sécurité v1 : forwarder aussi vers Gmail.
    //    (à retirer une fois la confiance établie — cf. spec §12)
    if (env.GMAIL_FALLBACK) {
      try {
        await message.forward(env.GMAIL_FALLBACK);
      } catch (err) {
        console.error('Échec forward Gmail', err);
      }
    }
  },
};
