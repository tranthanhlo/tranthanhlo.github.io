// Builds a tiny static site that sends every old address on tranthanhlo.github.io to the new site, keeping the path.
//   node scripts/make-redirect.mjs https://ten-mien-moi.com [thu-muc-dau-ra]
// Put the output on the `gh-pages` branch of the repo (see README, "Chuyển blog cũ").
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const target = (process.argv[2] ?? '').replace(/\/$/, '');
const out = process.argv[3] ?? 'redirect-site';
if (!/^https:\/\/[a-z0-9.-]+(:\d+)?$/i.test(target)) {
  console.error('Usage: node scripts/make-redirect.mjs https://new-address [output-folder]');
  process.exit(1);
}

// GitHub Pages serves 404.html for any address that has no file, so one page can handle every old link.
const page = `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Trần Thanh Lộ</title>
<link rel="canonical" href="${target}/">
<script>
  // /blog/xin-chao → <new site>/blog/xin-chao ; /en/... keeps working because the new site has /en/ too
  var path = location.pathname.replace(/^\\/index\\.html$/, '/');
  location.replace(${JSON.stringify(target)} + path + location.search + location.hash);
</script>
<noscript><meta http-equiv="refresh" content="0; url=${target}/"></noscript>
</head>
<body style="font-family:system-ui,sans-serif;padding:2rem">
<p>Trang đã chuyển sang <a href="${target}/">${target.replace('https://', '')}</a>.</p>
</body>
</html>
`;

mkdirSync(out, { recursive: true });
writeFileSync(path.join(out, 'index.html'), page);
writeFileSync(path.join(out, '404.html'), page);
writeFileSync(path.join(out, '.nojekyll'), '');
console.log(`Wrote ${out}/index.html and 404.html → ${target}`);
