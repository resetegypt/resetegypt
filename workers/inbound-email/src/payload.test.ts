import { describe, it, expect } from 'vitest';
import { buildWebhookPayload, type ParsedEmailLike } from './payload.js';

function toArrayBuffer(s: string): ArrayBuffer {
  const enc = new TextEncoder().encode(s);
  return enc.buffer.slice(enc.byteOffset, enc.byteOffset + enc.byteLength);
}

describe('buildWebhookPayload', () => {
  it('mappe les champs de base et normalise les adresses', () => {
    const parsed: ParsedEmailLike = {
      from: { address: 'Patient@Gmail.com', name: 'Un Patient' },
      subject: 'Bonjour',
      messageId: '<m1@gmail.com>',
      text: 'Salut',
    };
    const out = buildWebhookPayload('AhmadAlAshry@Reset-Egypt.com', parsed);
    expect(out.to).toBe('ahmadalashry@reset-egypt.com');
    expect(out.from).toBe('patient@gmail.com');
    expect(out.fromName).toBe('Un Patient');
    expect(out.subject).toBe('Bonjour');
    expect(out.messageId).toBe('<m1@gmail.com>');
    expect(out.bodyText).toBe('Salut');
    expect(out.references).toEqual([]);
    expect(out.attachments).toEqual([]);
  });

  it('met un sujet par défaut si absent', () => {
    const out = buildWebhookPayload('a@b.com', { messageId: '<m@x>' });
    expect(out.subject).toBe('(sans objet)');
  });

  it('découpe les references en tableau', () => {
    const out = buildWebhookPayload('a@b.com', {
      messageId: '<m@x>',
      references: '<r1@x>  <r2@x>',
    });
    expect(out.references).toEqual(['<r1@x>', '<r2@x>']);
  });

  it('encode les pièces jointes en base64', () => {
    const out = buildWebhookPayload('a@b.com', {
      messageId: '<m@x>',
      attachments: [{ filename: 'f.txt', mimeType: 'text/plain', content: toArrayBuffer('hi') }],
    });
    expect(out.attachments).toHaveLength(1);
    expect(out.attachments[0]!.filename).toBe('f.txt');
    expect(out.attachments[0]!.sizeBytes).toBe(2);
    expect(Buffer.from(out.attachments[0]!.contentBase64, 'base64').toString()).toBe('hi');
  });

  it('génère un messageId de secours si absent', () => {
    const out = buildWebhookPayload('a@b.com', {});
    expect(out.messageId).toMatch(/@reset-egypt\.com$/);
  });
});
