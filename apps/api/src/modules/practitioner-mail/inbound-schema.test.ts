import { describe, it, expect } from 'vitest';
import { inboundEmailSchema } from './inbound-schema.js';

const valid = {
  to: 'ahmadalashry@reset-egypt.com',
  from: 'patient@gmail.com',
  fromName: 'Un Patient',
  subject: 'Question',
  messageId: '<msg-1@gmail.com>',
  inReplyTo: null,
  references: [],
  bodyText: 'Bonjour',
  bodyHtml: null,
  attachments: [],
};

describe('inboundEmailSchema', () => {
  it('valide un payload complet', () => {
    const r = inboundEmailSchema.safeParse(valid);
    expect(r.success).toBe(true);
  });

  it('rejette une adresse to invalide', () => {
    const r = inboundEmailSchema.safeParse({ ...valid, to: 'pas-un-email' });
    expect(r.success).toBe(false);
  });

  it('rejette un messageId vide', () => {
    const r = inboundEmailSchema.safeParse({ ...valid, messageId: '' });
    expect(r.success).toBe(false);
  });

  it('applique les défauts (subject, references, attachments)', () => {
    const r = inboundEmailSchema.safeParse({
      to: 'ahmadalashry@reset-egypt.com',
      from: 'patient@gmail.com',
      messageId: '<msg-2@gmail.com>',
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.subject).toBe('(sans objet)');
      expect(r.data.references).toEqual([]);
      expect(r.data.attachments).toEqual([]);
    }
  });

  it('valide une pièce jointe', () => {
    const r = inboundEmailSchema.safeParse({
      ...valid,
      attachments: [
        { filename: 'doc.pdf', contentType: 'application/pdf', sizeBytes: 1024, contentBase64: 'AAAA' },
      ],
    });
    expect(r.success).toBe(true);
  });
});
