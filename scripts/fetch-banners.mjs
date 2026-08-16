// Download hero banner images shared via ChatGPT share links.
//
// Each share link is a generated-image post; the page streams its loader data
// (React Router stream), which contains public estuary content URLs for the
// generated image. The stream lists several renditions of each image:
//   1. full-size PNG   (e.g. 1717x916, ~2 MB)
//   2. medium JPEG     (~73 KB)
//   3. larger JPEG     (~119 KB, used for the hero carousel)
//   4. thumbnail WebP  (~54 KB)
//
// We save rendition 3 (good quality at a small size) plus the full PNG as a
// hi-res source (banner-<n>-full.png).
//
// Usage: node scripts/fetch-banners.mjs <share-url> [<share-url> ...]
import { mkdirSync, writeFileSync } from 'node:fs';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

const links = process.argv.slice(2);

async function download(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url.slice(0, 80)}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const type = (res.headers.get('content-type') || 'image/png').split(';')[0];
  return { buf, type };
}

async function extractImageUrls(shareUrl) {
  const res = await fetch(shareUrl, { headers: { 'User-Agent': UA }, redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status} for share ${shareUrl}`);
  const html = await res.text();
  const chunks = [];
  const re = /streamController\.enqueue\("([\s\S]*?)"\);/g;
  let m;
  while ((m = re.exec(html))) chunks.push(m[1]);
  const stream = chunks.join('');
  const urls = stream.match(
    /https:\/\/chatgpt\.com\/backend-api\/estuary\/public_content\/enc\/[A-Za-z0-9_=-]+/g
  );
  if (!urls || urls.length < 3) throw new Error(`not enough image urls in ${shareUrl}`);
  return urls;
}

mkdirSync('public/banners', { recursive: true });

for (const [i, link] of links.entries()) {
  try {
    const urls = await extractImageUrls(link);
    const hero = await download(urls[2]); // rendition 3: larger JPEG
    const full = await download(urls[0]); // rendition 1: full-size PNG
    const heroExt = hero.type === 'image/jpeg' ? 'jpg' : hero.type === 'image/webp' ? 'webp' : 'png';
    writeFileSync(`public/banners/banner-${i + 1}.${heroExt}`, hero.buf);
    writeFileSync(`public/banners/banner-${i + 1}-full.png`, full.buf);
    console.log(
      `saved banner-${i + 1}.${heroExt} (${(hero.buf.length / 1024).toFixed(0)} KB) + full PNG ` +
        `(${(full.buf.length / 1024).toFixed(0)} KB) from ${link}`
    );
  } catch (err) {
    console.error(`FAILED ${link}: ${err.message}`);
  }
}
