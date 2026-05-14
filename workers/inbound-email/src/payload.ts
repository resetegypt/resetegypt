/** Forme minimale d'un email parsé (sous-ensemble de l'objet postal-mime). */
export interface ParsedEmailLike {
  from?: { address?: string; name?: string };
  subject?: string;
  messageId?: string;
  inReplyTo?: string;
  references?: string;
  text?: string;
  html?: string;
  attachments?: Array<{ filename?: string; mimeType?: string; content: ArrayBuffer }>;
}

export interface WebhookPayload {
  to: string;
  from: string;
  fromName: string | null;
  subject: string;
  messageId: string;
  inReplyTo: string | null;
  references: string[];
  bodyText: string | null;
  bodyHtml: string | null;
  attachments: Array<{
    filename: string;
    contentType: string;
    sizeBytes: number;
    contentBase64: string;
  }>;
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

function splitReferences(refs: string | undefined): string[] {
  if (!refs) return [];
  return refs
    .split(/\s+/)
    .map((r) => r.trim())
    .filter(Boolean);
}

/** Transforme un email parsé en payload JSON pour le webhook /inbound/email. */
export function buildWebhookPayload(recipient: string, parsed: ParsedEmailLike): WebhookPayload {
  return {
    to: recipient.toLowerCase().trim(),
    from: (parsed.from?.address ?? '').toLowerCase().trim(),
    fromName: parsed.from?.name?.trim() || null,
    subject: parsed.subject?.trim() || '(sans objet)',
    messageId: parsed.messageId ?? `generated-${Date.now()}@reset-egypt.com`,
    inReplyTo: parsed.inReplyTo ?? null,
    references: splitReferences(parsed.references),
    bodyText: parsed.text ?? null,
    bodyHtml: parsed.html ?? null,
    attachments: (parsed.attachments ?? []).map((a) => ({
      filename: a.filename ?? 'attachment',
      contentType: a.mimeType ?? 'application/octet-stream',
      sizeBytes: a.content.byteLength,
      contentBase64: arrayBufferToBase64(a.content),
    })),
  };
}
