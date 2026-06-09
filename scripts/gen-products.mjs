// Generate the phones dataset from OUR 2Performant catalog (pretulverde.db).
// Coverage: phones across ALL merchants (category sub OR strong title signal), accessories/parts/
// non-phones excluded. DEDUP: one page per model+storage+COLOR+condition (colors kept — real variants
// people search for). Each page keeps the CHEAPEST offer PER MERCHANT -> product page shows multiple
// offers ("Vezi oferta pe X, Y, Z"), each with its own cloaked /out. Slug tied to the MODEL identity
// (stable across nightly winner/price changes), not the offer id.
import Database from '/sites/pretulverde.ro/node_modules/better-sqlite3/lib/index.js';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const DB = '/sites/pretulverde.ro/pretulverde.db';
const CAMPAIGN = JSON.parse(readFileSync('/sites/pretulverde.ro/_data/campaign.json', 'utf8'));
const AFF = '2ace29e87';
const IMG_HOST = 'https://img.ofertatelefoane.ro';
const SITE_NAME = 'OfertaTelefoane.ro';
const OUT = fileURLToPath(new URL('../src/data/telefoane.json', import.meta.url));

const db = new Database(DB, { readonly: true });
const NOT_WORDS = ['watch', 'macbook', 'ipad', 'imac', 'airpod', 'tableta', ' tablet', 'laptop', 'notebook', 'ipod', 'pencil', 'keyboard', 'husa', 'folie', 'geam', 'sticla', 'capac', 'carcasa', 'display', 'touchscreen', 'flex', 'banda', 'modul', ' placa', 'conector', 'baterie', 'incarcator', 'încărcător', 'cablu', 'casti', 'căști', 'earbuds', ' buds', 'stylus', 'adaptor', 'suport', 'set ', 'protectie', 'protecție', 'smartwatch', 'consola', 'dock', 'statie', 'camera spate', 'ornament', 'breloc', 'snur', 'portofel', 'cooler', 'grip', 'inel', 'stand',
  // books/toys/accessories/landlines/VoIP that leak via the title signal
  'jucarie', 'jucărie', 'paperback', 'dummies', 'for dummies', ' carte', 'povesti', 'interfon', 'microfon', 'stativ', 'trusa', 'holder', 'mount', 'tripod', 'selfie', 'gimbal',
  'telefon fix', 'dect', 'fara fir', 'fără fir', 'cu fir', 'analogic', 'caller id', 'telefon ip', ' ip phone', 'voip', 'cage', ' rig', 'stabilizator', 'cold shoe', 'vlog',
  'casca', 'alimentator', 'priza', 'butoni', 'powerbank', 'power bank', 'docking', 'difuzor', 'lanterna', 'lanternă',
  'case for', ' case,', ' case ', 'controller', 'gamepad', 'kit ', 'instrumente', 'service ', 'tester', 'litechaser', 'tool', 'protector', 'lentila', 'obiectiv', 'lens', ' husa', 'skin '];
const NOT_SQL = NOT_WORDS.map((w) => `lower(title) NOT LIKE '%${w}%'`).join(' AND ');
// brands that aren't phone makers but leak via title (camera rigs, VoIP, books, networking, tools)
const BRAND_BLOCK = ['smallrig', 'insta360', 'joby', 'zhiyun', 'grandstream', 'cisco', 'trotec', 'fisher-price', 'fisher price', 'patona', 'hama', 'klein', 'gave', 'maker media', 'libris', 'carturesti', 'rovision', 'partytent24', 'greeno', 'ookee', 'spionescu', 'alecoair', 'targetdeal', 'pcmadd', 'dji', 'ulanzi', 'manfrotto', 'yealink', 'fanvil', 'tp-link', 'ubiquiti', 'john wiley', 'wiley', 'oneodio', 'vention', 'ugreen', 'baseus', 'anker', 'spigen', 'ringke', 'tellur', 'aukey', 'choetech', 'jbl', 'polarpro', 'polar pro', 'backbone', 'razer', 'gamesir', 'otterbox', 'uag', 'nillkin', 'pitaka', 'caseology', 'esr', 'moft', 'beurer', 'medisana', 'omron', 'garmin', 'fitbit'].filter((b, i, a) => a.indexOf(b) === i);
const BRAND_SQL = BRAND_BLOCK.map((b) => `lower(coalesce(brand,'')) <> '${b}'`).join(' AND ');
const PHONE_SIG = `(subSlug IN ('mobile-phones','smartphone-android','smartphone-uri')
  OR lower(title) LIKE '%telefon mobil%' OR lower(title) LIKE 'telefon %' OR lower(title) LIKE '%smartphone%'
  OR ((lower(title) LIKE '%iphone%' OR lower(title) LIKE '%galaxy s%' OR lower(title) LIKE '%galaxy a%' OR lower(title) LIKE '%galaxy z%' OR lower(title) LIKE '%redmi%' OR lower(title) LIKE '%poco %' OR lower(title) LIKE '%motorola %') AND lower(title) LIKE '%gb%'))`;
const rows = db.prepare(`SELECT id, slug, title, price, oldPrice, brand, brandSlug, merchant, merchantSlug, img, descr
  FROM products WHERE megaSlug='electronice-it' AND (${PHONE_SIG}) AND ${NOT_SQL} AND ${BRAND_SQL} AND img IS NOT NULL AND img <> '' AND price >= 150
  ORDER BY price DESC`).all();

// ---- helpers ----
const esc = (s) => String(s || '');
const money = (n) => Number(n).toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' lei';
const sl = (s) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').slice(0, 70).replace(/^-+|-+$/g, '');
const seedOf = (s) => { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const rng = (a) => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const strip = (s) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
const GRADE = /\b(ca nou|foarte bun|excelent|acceptabil|bun)\b\.?\s*$/i;
const COLORS = ['negru', 'neagra', 'alb', 'alba', 'albastru', 'albastra', 'verde', 'rosu', 'rosie', 'gri', 'gold', 'auriu', 'aurie', 'argintiu', 'argintie', 'black', 'white', 'blue', 'green', 'red', 'silver', 'grey', 'gray', 'titanium', 'midnight', 'graphite', 'phantom', 'marble', 'onyx', 'lavender', 'mint', 'cream', 'purple', 'mov', 'roz', 'pink', 'yellow', 'galben', 'orange', 'portocaliu', 'desert', 'natural', 'ultramarine', 'teal', 'starlight', 'sierra', 'space', 'sky', 'coral', 'lime', 'sand', 'sandy', 'obsidian', 'jade', 'amber', 'cobalt', 'lemongrass', 'mocha', 'navy', 'beige', 'bej', 'violet', 'turquoise', 'aqua'];
const M_NAMES = { evomag: 'evoMAG', dwyn: 'Dwyn', ozone: 'Ozone', flanco: 'Flanco', vonmag: 'Vonmag', flip: 'Flip', bsgmag: 'BSGmag', gsmnet: 'GSMnet', a2t: 'A2T', 'spy-shop': 'Spy-Shop', 'avatar-shop': 'Avatar' };
const merchSlugOf = (m) => (m || '').replace(/\/+$/, '').split('.')[0].toLowerCase().replace(/[^a-z0-9]/g, '') || 'magazin';

function imgUrl(poolImg, name) {
  const m = /([0-9a-f]{16})\.webp$/.exec(poolImg || '');
  if (!m) return '';
  return `${IMG_HOST}/${sl(name).slice(0, 55).replace(/-+$/, '')}-${m[1]}.webp`;
}

function parseSpecs(t, descr, brand) {
  const s = t + ' ' + (descr || '');
  let ram = null, storage = null;
  const rs = s.match(/(\d{1,2})\s*GB\s*\/\s*(\d{2,4})\s*GB/i);
  if (rs) { ram = +rs[1]; storage = +rs[2]; }
  else {
    const gbs = [...s.matchAll(/(\d{2,4})\s*GB/gi)].map((m) => +m[1]).filter((n) => [16, 32, 64, 128, 256, 512, 1024].includes(n));
    if (gbs.length) storage = Math.max(...gbs);
    const ramm = s.match(/(\d{1,2})\s*GB\s*RAM/i); if (ramm) ram = +ramm[1];
  }
  let screen = null;
  const sc = s.match(/(\d\.\d{1,2})\s*(?:''|"|inch|inci|”|″)/); if (sc) screen = sc[1];
  const net = /\b5g\b/i.test(s) ? '5G' : /\b4g\b|lte/i.test(s) ? '4G' : '';
  const dual = /dual\s*sim/i.test(s);
  const cond = (t.match(GRADE) || [])[1] || '';
  let color = ''; const ss = strip(t);
  for (const c of COLORS) { if (new RegExp('\\b' + c + '\\b').test(ss)) { color = c; break; } }
  return { brand: brand || '', ram, storage, screen, net, dual, cond, color };
}

function modelKey(title, brandSlug, sp) {
  let core = strip(title).split(',')[0].replace(GRADE, '')
    .replace(/\b(telefon mobil|telefon|smartphone|mobil|dual ?sim|nano ?sim|e?sim|5g|4g|lte|gb|ram|procesor.*)\b/g, ' ');
  for (const c of COLORS) core = core.replace(new RegExp('\\b' + c + '\\b', 'g'), ' ');
  if (brandSlug) core = core.replace(new RegExp('\\b' + brandSlug.replace(/-/g, ' ') + '\\b', 'g'), ' ');
  core = core.replace(/[^a-z0-9]+/g, '');
  return `${brandSlug || 'x'}|${core}|${sp.storage || 0}|${sp.color}|${sp.cond ? 'refurb' : 'nou'}`;
}

function tierBand(price) { return price < 800 ? 'buget' : price < 1800 ? 'mediu' : price < 3000 ? 'premium' : 'flagship'; }
const TIER_LABELS = { flagship: 'Flagship', premium: 'Premium', mediu: 'Gama medie', buget: 'Buget' };
const PREMIUM_BRANDS = new Set(['apple', 'samsung', 'google', 'sony']);
const VALUE_BRANDS = new Set(['xiaomi', 'motorola', 'poco', 'honor', 'realme', 'oppo', 'nothing tech', 'nothing']);

function genProse(p, sp, offerCount) {
  const r = rng(seedOf(p.slug));
  const b = sp.brand || 'acest producător';
  const bl = (sp.brand || '').toLowerCase();
  const price = money(p.price);
  const m = esc(p.merchant).replace(/\/+$/, '');
  const reduced = p.oldPrice > p.price;
  const mem = sp.storage ? `${sp.storage} GB stocare${sp.ram ? ` și ${sp.ram} GB RAM` : ''}` : (sp.ram ? `${sp.ram} GB RAM` : 'memorie pentru aplicații și fotografii');
  const condTxt = sp.cond ? pick(r, [`Este în stare „${sp.cond}", verificat înainte de livrare — o cale de a prinde un telefon bun sub prețul de nou.`, `Vine în stare „${sp.cond}" (reconditionat/verificat), plătești mai puțin decât pe varianta sigilată.`]) : '';
  const brandTxt = PREMIUM_BRANDS.has(bl) ? pick(r, [`${b} înseamnă actualizări software pe termen lung, service ușor de găsit și valoare bună de revânzare.`, `Fiind ${b}, te bazezi pe ecosistem matur și suport îndelungat.`])
    : VALUE_BRANDS.has(bl) ? pick(r, [`${b} oferă un raport preț-specificații foarte bun, cu dotări apropiate de flagship la cost mai mic.`, `${b} s-a impus prin telefoane cu specificații generoase la preț corect.`])
    : pick(r, [`Este un brand accesibil unde prețul mic e principalul argument.`, `Un brand bugetar: iei specificațiile de bază fără să plătești numele.`]);
  const opener = pick(r, [
    `${esc(p.title)} este un telefon ${b} disponibil de la ${price}${reduced ? ` (redus de la ${money(p.oldPrice)})` : ''}.`,
    `La ${price}${reduced ? `, sub prețul vechi de ${money(p.oldPrice)},` : ''} ${esc(p.title)} este oferta ${b} pe care o urmărim.`,
    `Cauți un telefon ${b} bun la preț corect? ${esc(p.title)} pornește de la ${price}.`,
  ]);
  const specSent = pick(r, [`Vine cu ${mem}${sp.screen ? `, ecran de ${sp.screen}"` : ''}${sp.net ? ` și ${sp.net}` : ''}${sp.color ? `, culoare ${sp.color}` : ''}.`, `Are ${mem}${sp.screen ? ` și ecran de ${sp.screen}"` : ''}${sp.net ? `, cu ${sp.net}` : ''}.`]);
  const offerSent = offerCount > 1 ? ` Îl găsești la ${offerCount} magazine — mai jos îți arătăm fiecare ofertă, de la cea mai mică.` : ` Disponibil prin ${m}.`;
  const intro = `${opener} ${specSent}${condTxt ? ' ' + condTxt : ' ' + brandTxt}${offerSent}`;
  const guide = [
    `${sp.storage ? `Cu ${sp.storage} GB ai loc pentru aplicații, jocuri, poze și câteva filme offline${sp.storage <= 64 ? ' — suficient pentru un utilizator obișnuit' : ''}.` : 'Verifică stocarea în funcție de câte aplicații și poze ții pe telefon.'} ${sp.ram ? `Cei ${sp.ram} GB RAM ajută la rularea fluidă a mai multor aplicații deodată.` : ''}`.trim(),
    `${sp.net === '5G' ? 'Suportă 5G, ești pregătit pentru rețelele rapide unde sunt disponibile.' : sp.net === '4G' ? 'Funcționează pe 4G/LTE, suficient pentru navigare, streaming și apeluri.' : ''} ${brandTxt}`.trim(),
  ].filter(Boolean);
  const faq = [
    { q: `Cât costă ${esc(p.title)}?`, a: `${esc(p.title)} pornește de la ${price}${reduced ? ` (redus de la ${money(p.oldPrice)})` : ''}.${offerCount > 1 ? ` Este listat la ${offerCount} magazine; afișăm fiecare ofertă.` : ''} Prețurile sunt actualizate periodic.` },
    ...(sp.storage ? [{ q: `Câtă memorie are?`, a: `Are ${mem}.` }] : []),
    ...(sp.net ? [{ q: `Are ${sp.net}?`, a: `Da, ${esc(p.title)} suportă ${sp.net}.` }] : []),
    ...(sp.cond ? [{ q: `În ce stare este?`, a: `Este listat în stare „${sp.cond}" — model verificat, vândut sub prețul unuia sigilat.` }] : [{ q: `Este nou?`, a: `Da, este un produs nou, sigilat.` }]),
    { q: `De unde îl pot cumpăra?`, a: `Prin ${SITE_NAME} — îți arătăm ${offerCount > 1 ? 'toate ofertele și' : ''} prețul curent și te ducem direct la magazin.` },
  ];
  return { intro, guide, faq };
}

// ---- DEDUP: keep the cheapest offer PER MERCHANT, per model identity ----
const winners = {};
for (const row of rows) {
  const img = imgUrl(row.img, row.title); if (!img) continue;
  const cu = (CAMPAIGN[row.merchantSlug] || {}).c; if (!cu) continue;
  const sp = parseSpecs(row.title, row.descr, row.brand);
  const mkey = modelKey(row.title, row.brandSlug, sp);
  const mSlug = merchSlugOf(row.merchant);
  const offer = { mSlug, mName: M_NAMES[mSlug] || cap(mSlug), price: row.price, oldPrice: row.oldPrice > row.price ? row.oldPrice : null, affiliate: `https://event.2performant.com/events/click?ad_type=product_store&aff_code=${AFF}&unique=${encodeURIComponent(row.id)}&campaign_unique=${cu}`, row, sp, img };
  const w = winners[mkey] || (winners[mkey] = { byMerchant: {} });
  const cur = w.byMerchant[mSlug];
  if (!cur || offer.price < cur.price) w.byMerchant[mSlug] = offer;
}

// ---- honest modified date + STABLE slug, ledger keyed by MODEL identity ----
const LEDGER = fileURLToPath(new URL('../.cache/modified-ledger.json', import.meta.url));
const oldLedger = existsSync(LEDGER) ? JSON.parse(readFileSync(LEDGER, 'utf8')) : {};
const newLedger = {};
const BUILD_DATE = new Date().toISOString().slice(0, 10);

const seen = new Set();
const products = [];
for (const [mkey, w] of Object.entries(winners)) {
  const offers = Object.values(w.byMerchant).sort((a, b) => a.price - b.price).slice(0, 6);
  const best = offers[0];
  const { row, sp, img } = best;
  const name = row.title.replace(GRADE, '').trim();
  let slug = oldLedger[mkey] && oldLedger[mkey].s;
  if (!slug) { slug = (sl(name).slice(0, 55).replace(/-+$/, '') || 'tel') + '-' + seedOf(mkey).toString(36); if (seen.has(slug)) { let k = 2; while (seen.has(slug + '-' + k)) k++; slug += '-' + k; } }
  seen.add(slug);
  const offerCount = offers.length;
  const prose = genProse({ title: name, slug, price: best.price, oldPrice: best.oldPrice || 0, merchant: best.row.merchant }, sp, offerCount);
  const brandSlug = row.brandSlug || (sp.brand ? sl(sp.brand) : '');
  const band = tierBand(best.price);
  const condition = sp.cond ? 'refurb' : 'nou';
  // smartphone vs feature/senior phone: screen size decides (>=4.5"); without a screen, brand/keyword.
  const scr = sp.screen ? parseFloat(sp.screen) : null;
  const SMART_BRANDS = new Set(['apple', 'samsung', 'xiaomi', 'oppo', 'oneplus', 'google', 'honor', 'realme', 'vivo', 'nubia', 'poco', 'blackview', 'ulefone', 'doogee', 'tecno', 'infinix', 'nothing tech', 'nothing', 'asus', 'sony', 'huawei', 'motorola']);
  const smart = (scr !== null ? scr >= 4.5 : (SMART_BRANDS.has((sp.brand || '').toLowerCase()) || /smartphone|android|iphone|galaxy [saznf]|redmi|poco/i.test(row.title))) ? 1 : 0;
  // each offer gets a cloak key: cheapest -> slug, others -> slug~merchant
  const offerList = offers.map((o, i) => ({ merchantSlug: o.mSlug, merchantName: o.mName, price: o.price, oldPrice: o.oldPrice, affiliate: o.affiliate, outKey: i === 0 ? slug : `${slug}~${o.mSlug}` }));
  const chash = seedOf(`${best.price}|${best.oldPrice}|${name}|${img}|${JSON.stringify(sp)}|${offers.map((o) => o.mSlug + o.price).join()}`);
  const modified = (oldLedger[mkey] && oldLedger[mkey].h === chash) ? oldLedger[mkey].m : BUILD_DATE;
  newLedger[mkey] = { h: chash, m: modified, s: slug, b: brandSlug, z: band, d: BUILD_DATE };
  products.push({
    slug, id: row.id, name, brand: sp.brand, brandSlug, price: best.price, oldPrice: best.oldPrice,
    merchant: best.row.merchant, merchantSlug: best.mSlug, merchantName: best.mName, img, affiliate: best.affiliate, modified, band, tierLabel: TIER_LABELS[band], condition, smart, offerCount,
    offers: offerList,
    specs: { Brand: sp.brand || '—', ...(sp.storage ? { Stocare: `${sp.storage} GB` } : {}), ...(sp.ram ? { RAM: `${sp.ram} GB` } : {}), ...(sp.screen ? { Ecran: `${sp.screen}"` } : {}), ...(sp.net ? { Rețea: sp.net } : {}), ...(sp.color ? { Culoare: cap(sp.color) } : {}), ...(sp.dual ? { 'Dual SIM': 'Da' } : {}), Stare: sp.cond ? cap(sp.cond) : 'Nou sigilat' },
    prose,
  });
}

// ---- dropped -> 301 to a similar surviving model ----
const RETAIN_DAYS = 150;
const cutoff = new Date(new Date(BUILD_DATE + 'T00:00:00Z').getTime() - RETAIN_DAYS * 864e5).toISOString().slice(0, 10);
const byBrandBand = {};
for (const p of products) (byBrandBand[`${p.brandSlug}|${p.band}`] ||= []).push(p);
const brandPages = new Set();
{ const bc = {}; for (const p of products) if (p.brandSlug) bc[p.brandSlug] = (bc[p.brandSlug] || 0) + 1; for (const b in bc) if (bc[b] >= 4) brandPages.add(b); }
const dropped = {};
for (const mkey of Object.keys(oldLedger)) {
  if (newLedger[mkey]) continue;
  const e = oldLedger[mkey];
  if (!e || !e.s) continue;
  if ((e.d || '0') < cutoff) continue;
  const sim = byBrandBand[`${e.b}|${e.z}`];
  const target = (sim && sim.length) ? `/telefon/${sim[0].slug}/` : (brandPages.has(e.b) ? `/brand/${e.b}/` : '/oferte/');
  dropped[e.s] = target;
  newLedger[mkey] = e;
}

mkdirSync(fileURLToPath(new URL('../src/data', import.meta.url)), { recursive: true });
writeFileSync(OUT, JSON.stringify(products));
mkdirSync(fileURLToPath(new URL('../.cache', import.meta.url)), { recursive: true });
writeFileSync(LEDGER, JSON.stringify(newLedger));
writeFileSync(fileURLToPath(new URL('../.cache/dropped.json', import.meta.url)), JSON.stringify(dropped));
const changed = products.filter((p) => p.modified === BUILD_DATE).length;
const multi = products.filter((p) => p.offerCount > 1).length;
console.log(`  ${rows.length} offers -> ${products.length} distinct models (${multi} multi-merchant); ${changed} dated today; ${Object.keys(dropped).length} dropped 301s`);
const cc = { refurb: 0, nou: 0 }; for (const p of products) cc[p.condition]++;
const bands = {}; for (const p of products) bands[p.band] = (bands[p.band] || 0) + 1;
const brands = {}; for (const p of products) brands[p.brand] = (brands[p.brand] || 0) + 1;
console.log(`  condition: ${JSON.stringify(cc)} | tiers: ${JSON.stringify(bands)}`);
console.log('  top brands:', Object.entries(brands).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k}:${v}`).join(', '));
