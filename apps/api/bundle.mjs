// Bundle l'API Fastify en un seul fichier ESM pour Vercel serverless.
import esbuild from 'esbuild';
import { mkdirSync, cpSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '.vercel/output/functions/api/index.func');

mkdirSync(outDir, { recursive: true });

await esbuild.build({
  entryPoints: [join(__dirname, 'api/index.ts')],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outfile: join(outDir, 'index.mjs'),
  banner: {
    js: "import { createRequire as __cr } from 'module'; const require = __cr(import.meta.url); import { fileURLToPath as __ftu } from 'url'; import { dirname as __dn } from 'path'; const __filename = __ftu(import.meta.url); const __dirname = __dn(__filename);",
  },
  external: [
    '@prisma/client',
    '.prisma/client',
    'prisma',
    'bcryptjs',
    '@mapbox/node-pre-gyp',
    'aws-sdk',
    'mock-aws-s3',
    'nock',
  ],
  loader: { '.node': 'file' },
  logLevel: 'info',
});

const monorepoRoot = join(__dirname, '../..');
const copies = [
  ['node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client', 'node_modules/@prisma/client'],
  ['node_modules/.pnpm/bcryptjs@2.4.3/node_modules/bcryptjs', 'node_modules/bcryptjs'],
];
for (const [src, dst] of copies) {
  const srcPath = join(monorepoRoot, src);
  const dstPath = join(outDir, dst);
  if (existsSync(srcPath)) {
    mkdirSync(dstPath, { recursive: true });
    cpSync(srcPath, dstPath, { recursive: true });
  } else {
    console.warn('missing:', srcPath);
  }
}

const prismaEngineSrc = join(monorepoRoot, 'node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/.prisma/client');
const prismaEngineDst = join(outDir, 'node_modules/.prisma/client');
if (existsSync(prismaEngineSrc)) {
  mkdirSync(prismaEngineDst, { recursive: true });
  for (const file of readdirSync(prismaEngineSrc)) {
    if (file.includes('windows') || file.includes('darwin')) continue;
    cpSync(join(prismaEngineSrc, file), join(prismaEngineDst, file), { recursive: true });
  }
}

writeFileSync(join(outDir, 'package.json'), JSON.stringify({ type: 'module' }, null, 2));
writeFileSync(
  join(outDir, '.vc-config.json'),
  JSON.stringify({ runtime: 'nodejs20.x', handler: 'index.mjs', launcherType: 'Nodejs' }, null, 2),
);
mkdirSync(join(__dirname, '.vercel/output'), { recursive: true });
writeFileSync(
  join(__dirname, '.vercel/output/config.json'),
  JSON.stringify({ version: 3, routes: [{ src: '/(.*)', dest: '/api/index' }] }, null, 2),
);

console.log('✅ Bundle ready at:', outDir);
