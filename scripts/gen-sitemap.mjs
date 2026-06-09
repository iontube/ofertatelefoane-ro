// Full sitemap: static + telefoane pagination + stare(nou/refurb) + tier + brand + magazin + products, with images.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SITE = 'https://ofertatelefoane.ro';
const PAGE = 48, MIN_BRAND = 4;
const recPath = fileURLToPath(new URL('../src/data/telefoane.json', import.meta.url));
const recs = existsSync(recPath) ? JSON.parse(readFileSync(recPath, 'utf-8')) : [];
const FIXED = '2026-04-01';
const maxMod = (arr) => arr.reduce((m, p) => (p.modified && p.modified > m ? p.modified : m), FIXED);
const allMod = recs.length ? maxMod(recs) : FIXED;
const xe = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const urls = [];
const add = (loc, pri = '0.6', lastmod = allMod, img = null) => urls.push(`  <url><loc>${SITE}${loc}</loc><lastmod>${lastmod}</lastmod><priority>${pri}</priority>${img ? `<image:image><image:loc>${xe(img)}</image:loc></image:image>` : ''}</url>`);

const paginate = (path, items, pri) => { add(path, pri); const last = Math.ceil(items.length / PAGE); for (let i = 2; i <= last; i++) add(`${path}${i}/`, '0.4', maxMod(items)); };

add('/', '1.0');
paginate('/oferte/', recs, '0.9');
['/despre-noi/', '/contact/', '/disclaimer-afiliere/', '/politica-confidentialitate/', '/politica-cookies/', '/termeni-si-conditii/', '/gdpr/'].forEach((u) => add(u, '0.3', FIXED));

for (const [cond, label] of [['nou', 'noi'], ['refurb', 'refurbished']]) {
  const items = recs.filter((p) => p.condition === cond);
  if (items.length) paginate(`/stare/${label}/`, items, '0.7');
}
for (const tier of ['flagship', 'premium', 'mediu', 'buget']) {
  const items = recs.filter((p) => p.band === tier);
  if (items.length) paginate(`/gama/${tier}/`, items, '0.7');
}
const byBrand = {};
for (const p of recs) if (p.brandSlug) (byBrand[p.brandSlug] ||= []).push(p);
for (const [b, items] of Object.entries(byBrand)) if (items.length >= MIN_BRAND) paginate(`/brand/${b}/`, items, '0.7');
const byM = {};
for (const p of recs) for (const o of (p.offers || [])) (byM[o.merchantSlug] ||= new Set()).add(p);
for (const [m, set] of Object.entries(byM)) paginate(`/magazin/${m}/`, [...set], '0.6');

for (const p of recs) add(`/telefon/${p.slug}/`, '0.6', p.modified || allMod, p.img);

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.join('\n')}\n</urlset>\n`;
writeFileSync(fileURLToPath(new URL('../public/sitemap.xml', import.meta.url)), xml);
console.log(`sitemap: ${urls.length} URLs`);
