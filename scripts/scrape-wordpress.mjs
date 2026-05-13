#!/usr/bin/env node
/**
 * Scrape complet du site WordPress reset-egypt.com → JSON structuré +
 * markdown lisible + téléchargement de tous les médias.
 *
 * Sortie :
 *   scraped/
 *     pages/
 *       home.json          ({ id, title, slug, htmlContent, plainText, sections })
 *       home.md            (markdown lisible)
 *       about-reset.json
 *       ...
 *     posts/
 *       <slug>.json/.md
 *     media/
 *       <id>-<filename>.{png,jpg,svg,...}
 *     manifest.json        (récap : ce qui a été scrapé, taille totale, etc.)
 */
import { promises as fs } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = resolve(ROOT, 'scraped');
const SITE = 'https://reset-egypt.com';
const API = `${SITE}/wp-json/wp/v2`;

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36',
  Accept: 'application/json,text/html,*/*',
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithRetry(url, opts = {}, attempts = 5) {
  let lastErr;
  for (let i = 1; i <= attempts; i++) {
    try {
      const res = await fetch(url, { ...opts, headers: { ...HEADERS, ...(opts.headers ?? {}) } });
      if (res.ok) return res;
      if (res.status === 503 || res.status === 429 || res.status >= 500) {
        const wait = Math.min(15_000, 1500 * Math.pow(2, i - 1));
        console.warn(`  retry ${i}/${attempts} after ${wait}ms (${res.status}) → ${url}`);
        await sleep(wait);
        continue;
      }
      throw new Error(`${url} → ${res.status}`);
    } catch (e) {
      lastErr = e;
      if (i === attempts) throw e;
      await sleep(2000 * i);
    }
  }
  throw lastErr;
}

async function fetchAll(endpoint) {
  const out = [];
  let page = 1;
  while (true) {
    const url = `${API}/${endpoint}?per_page=100&page=${page}`;
    const res = await fetchWithRetry(url);
    const data = await res.json();
    out.push(...data);
    const total = parseInt(res.headers.get('x-wp-totalpages') ?? '1', 10);
    if (page >= total) break;
    page += 1;
    await sleep(500); // gentle pacing
  }
  return out;
}

// === HTML → texte propre + extraction d'images =============================
function htmlToPlainText(html) {
  return html
    // images & embeds → on les retire pour le plain text (on a les médias séparément)
    .replace(/<(script|style|iframe)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h\d|li|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#8211;/g, '–')
    .replace(/&#8217;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();
}

function extractImageUrls(html) {
  // Match <img src="..."> + style="background-image:url('...')"
  const out = new Set();
  const imgRegex = /<img[^>]+(?:data-src|src)=["']([^"']+)["']/gi;
  let m;
  while ((m = imgRegex.exec(html))) {
    if (m[1] && !m[1].startsWith('data:')) out.add(m[1]);
  }
  const bgRegex = /background-image\s*:\s*url\(['"]?([^'")]+)['"]?\)/gi;
  while ((m = bgRegex.exec(html))) {
    if (m[1] && !m[1].startsWith('data:')) out.add(m[1]);
  }
  return Array.from(out);
}

function extractHeadings(html) {
  const out = [];
  const re = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let m;
  while ((m = re.exec(html))) {
    const level = parseInt(m[1], 10);
    const text = htmlToPlainText(m[2]).slice(0, 200);
    if (text) out.push({ level, text });
  }
  return out;
}

// === Téléchargement d'un fichier média =====================================
async function downloadMedia(url, destPath) {
  try {
    const res = await fetchWithRetry(url, {}, 3);
    const buf = Buffer.from(await res.arrayBuffer());
    await fs.writeFile(destPath, buf);
    return buf.length;
  } catch (e) {
    console.warn(`  ⚠️  ${url} → ${e.message}`);
    return false;
  }
}

function slugifyFilename(url, mediaId) {
  const u = new URL(url);
  const last = u.pathname.split('/').pop() ?? `media-${mediaId}`;
  // On préfixe avec l'id pour éviter les collisions de nom
  return `${mediaId}-${last}`;
}

// === Markdown pour reading-friendly =========================================
function toMarkdown(page, images) {
  const md = [];
  md.push(`# ${page.title.rendered}`);
  md.push('');
  md.push(`> Slug : \`/${page.slug}\``);
  md.push(`> URL d'origine : ${page.link}`);
  md.push(`> Modifié le : ${page.modified}`);
  md.push('');
  if (page.excerpt?.rendered) {
    md.push('## Extrait');
    md.push(htmlToPlainText(page.excerpt.rendered));
    md.push('');
  }
  md.push('## Contenu');
  md.push(htmlToPlainText(page.content.rendered));
  md.push('');
  if (images.length > 0) {
    md.push('## Images référencées');
    for (const img of images) md.push(`- ${img}`);
  }
  return md.join('\n');
}

// === Main ===================================================================
async function main() {
  await ensureDir(OUT);
  await ensureDir(resolve(OUT, 'pages'));
  await ensureDir(resolve(OUT, 'posts'));
  await ensureDir(resolve(OUT, 'media'));

  console.log('=== 1. Fetch pages =======================================');
  const pages = await fetchAll('pages');
  console.log(`  ${pages.length} pages trouvées`);

  const usedImages = new Set();
  for (const page of pages) {
    const slug = page.slug;
    const html = page.content?.rendered ?? '';
    const plain = htmlToPlainText(html);
    const images = extractImageUrls(html);
    images.forEach((u) => usedImages.add(u));
    const headings = extractHeadings(html);
    const data = {
      id: page.id,
      title: page.title.rendered,
      slug,
      link: page.link,
      modified: page.modified,
      excerpt: htmlToPlainText(page.excerpt?.rendered ?? ''),
      htmlContent: html,
      plainText: plain,
      headings,
      images,
      featuredMedia: page.featured_media,
      parent: page.parent,
    };
    await fs.writeFile(
      resolve(OUT, 'pages', `${slug}.json`),
      JSON.stringify(data, null, 2),
    );
    await fs.writeFile(
      resolve(OUT, 'pages', `${slug}.md`),
      toMarkdown(page, images),
    );
    console.log(`  ✓ /${slug} → ${plain.length} chars, ${images.length} imgs`);
  }

  console.log('\n=== 2. Fetch blog posts =================================');
  const posts = await fetchAll('posts');
  console.log(`  ${posts.length} articles trouvés`);
  for (const post of posts) {
    const slug = post.slug;
    const html = post.content?.rendered ?? '';
    const images = extractImageUrls(html);
    images.forEach((u) => usedImages.add(u));
    const data = {
      id: post.id,
      title: post.title.rendered,
      slug,
      link: post.link,
      date: post.date,
      excerpt: htmlToPlainText(post.excerpt?.rendered ?? ''),
      htmlContent: html,
      plainText: htmlToPlainText(html),
      images,
      featuredMedia: post.featured_media,
    };
    await fs.writeFile(
      resolve(OUT, 'posts', `${slug}.json`),
      JSON.stringify(data, null, 2),
    );
    await fs.writeFile(
      resolve(OUT, 'posts', `${slug}.md`),
      toMarkdown(post, images),
    );
    console.log(`  ✓ /${slug}`);
  }

  console.log('\n=== 3. Fetch media library ===============================');
  const media = await fetchAll('media');
  console.log(`  ${media.length} médias dans la bibliothèque WP`);
  // On télécharge tout : la bibliothèque WP + les images référencées dans le HTML
  const allMediaUrls = new Map(); // url → { mediaId, alt, mimeType, title }
  for (const m of media) {
    if (m.source_url) {
      allMediaUrls.set(m.source_url, {
        mediaId: m.id,
        alt: m.alt_text ?? '',
        mimeType: m.mime_type,
        title: m.title?.rendered ?? '',
      });
    }
  }
  for (const url of usedImages) {
    if (!allMediaUrls.has(url)) {
      allMediaUrls.set(url, { mediaId: `extra-${allMediaUrls.size}`, alt: '', mimeType: '', title: '' });
    }
  }

  console.log(`\n=== 4. Download ${allMediaUrls.size} media files =========`);
  let totalBytes = 0;
  let downloaded = 0;
  let failed = 0;
  const mediaManifest = [];
  let idx = 0;
  for (const [url, meta] of allMediaUrls.entries()) {
    idx += 1;
    if (idx % 10 === 0) console.log(`  ... ${idx}/${allMediaUrls.size}`);
    const filename = slugifyFilename(url, meta.mediaId);
    const destPath = resolve(OUT, 'media', filename);
    const size = await downloadMedia(url, destPath);
    if (size) {
      totalBytes += size;
      downloaded += 1;
      mediaManifest.push({
        url,
        filename,
        mediaId: meta.mediaId,
        alt: meta.alt,
        title: meta.title,
        mimeType: meta.mimeType,
        sizeBytes: size,
      });
    } else {
      failed += 1;
    }
  }

  console.log('\n=== 5. Write manifest ===================================');
  const manifest = {
    scrapedAt: new Date().toISOString(),
    source: SITE,
    counts: {
      pages: pages.length,
      posts: posts.length,
      mediaLibrary: media.length,
      mediaDownloaded: downloaded,
      mediaFailed: failed,
    },
    totalBytes,
    totalSizeMB: (totalBytes / 1024 / 1024).toFixed(2),
    pages: pages.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title.rendered,
      link: p.link,
    })),
    posts: posts.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title.rendered,
    })),
    media: mediaManifest,
  };
  await fs.writeFile(resolve(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));

  console.log('\n=== DONE ================================================');
  console.log(`  Pages       : ${pages.length}`);
  console.log(`  Posts       : ${posts.length}`);
  console.log(`  Médias      : ${downloaded}/${allMediaUrls.size} (${manifest.totalSizeMB} MB)`);
  console.log(`  Échecs      : ${failed}`);
  console.log(`  Sortie      : ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
