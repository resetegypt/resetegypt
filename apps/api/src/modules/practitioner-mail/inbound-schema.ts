import { z } from 'zod';

export const inboundAttachmentSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
  sizeBytes: z.number().int().nonnegative(),
  contentBase64: z.string(),
});

/** Payload envoyé par le Cloudflare Email Worker au webhook /inbound/email. */
export const inboundEmailSchema = z.object({
  to: z.string().email(),
  from: z.string().email(),
  fromName: z.string().nullable().optional(),
  subject: z.string().default('(sans objet)'),
  messageId: z.string().min(1),
  inReplyTo: z.string().nullable().optional(),
  references: z.array(z.string()).default([]),
  bodyText: z.string().nullable().optional(),
  bodyHtml: z.string().nullable().optional(),
  attachments: z.array(inboundAttachmentSchema).default([]),
});

export type InboundEmailPayload = z.infer<typeof inboundEmailSchema>;
export type InboundAttachment = z.infer<typeof inboundAttachmentSchema>;
