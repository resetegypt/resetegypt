// ============================================================================
// backup-db.ts — snapshot quotidien BDD Postgres → Cloudflare R2 (ou S3 compat).
//
// Usage manuel :   pnpm tsx scripts/backup-db.ts
// Usage via cron : déclenché par GET /internal/cron/backup-db (secret protégé)
//
// Stratégie : pg_dump --format=custom → upload S3 → keep N derniers.
//
// Env vars requises :
//   DIRECT_URL                — Postgres direct (port 5432, pas pooler)
//   BACKUP_S3_ENDPOINT        — ex https://abc.r2.cloudflarestorage.com
//   BACKUP_S3_BUCKET          — ex reset-egypt-backups
//   BACKUP_S3_ACCESS_KEY      — R2 access key
//   BACKUP_S3_SECRET_KEY      — R2 secret key
//   BACKUP_S3_REGION          — auto pour R2, ex eu-central-1 pour AWS
//   BACKUP_RETENTION_DAYS     — défaut 30 (supprime > 30j)
// ============================================================================

import { execSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';

interface BackupResult {
  ok: boolean;
  filename: string;
  sizeBytes: number;
  durationMs: number;
  retained: number;
  deleted: number;
  error?: string;
}

export async function runBackup(): Promise<BackupResult> {
  const start = Date.now();
  const directUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!directUrl) throw new Error('DIRECT_URL or DATABASE_URL required');

  const bucket = required('BACKUP_S3_BUCKET');
  const endpoint = required('BACKUP_S3_ENDPOINT');
  const accessKeyId = required('BACKUP_S3_ACCESS_KEY');
  const secretAccessKey = required('BACKUP_S3_SECRET_KEY');
  const region = process.env.BACKUP_S3_REGION ?? 'auto';
  const retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS ?? '30', 10);

  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `reset-egypt-${ts}.dump`;
  const tmpDir = mkdtempSync(join(tmpdir(), 'reset-backup-'));
  const dumpPath = join(tmpDir, filename);

  try {
    // 1. pg_dump format custom (compressé, restaurable via pg_restore)
    // -Fc = format custom binaire, -Z 9 = compression max, -v = verbose stderr
    execSync(`pg_dump --format=custom --compress=9 --file="${dumpPath}" "${directUrl}"`, {
      stdio: ['ignore', 'ignore', 'inherit'],
      timeout: 10 * 60 * 1000, // 10 min max
    });

    const sizeBytes = statSync(dumpPath).size;
    const checksum = sha256(readFileSync(dumpPath));

    // 2. Upload S3/R2
    const s3 = new S3Client({
      endpoint,
      region,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true, // R2 + S3 compat
    });

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: `daily/${filename}`,
        Body: readFileSync(dumpPath),
        ContentType: 'application/octet-stream',
        Metadata: {
          'sha256': checksum,
          'created-at': new Date().toISOString(),
          'source': 'auto-cron-daily',
        },
      }),
    );

    // 3. Rotation : delete > retentionDays
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    const list = await s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: 'daily/' }));
    let deleted = 0;
    for (const obj of list.Contents ?? []) {
      if (obj.LastModified && obj.LastModified < cutoff && obj.Key) {
        await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: obj.Key }));
        deleted++;
      }
    }
    const retained = (list.Contents?.length ?? 0) - deleted + 1; // +1 = celui qu'on vient d'écrire

    return {
      ok: true,
      filename,
      sizeBytes,
      durationMs: Date.now() - start,
      retained,
      deleted,
    };
  } finally {
    // Cleanup tmp
    try { rmSync(tmpDir, { recursive: true, force: true }); } catch { /* noop */ }
  }
}

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function sha256(buf: Buffer): string {
  return createHash('sha256').update(buf).digest('hex');
}

// Run direct via CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  runBackup()
    .then((r) => {
      console.log(JSON.stringify(r, null, 2));
      process.exit(r.ok ? 0 : 1);
    })
    .catch((err) => {
      console.error('Backup failed:', err);
      process.exit(1);
    });
}
