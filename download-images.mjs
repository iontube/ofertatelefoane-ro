import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import https from 'https';

const products = [
  // Premium
  { name: "Samsung Galaxy Z Fold7", url: "https://s13emagst.akamaized.net/products/99055/99054940/images/res_120dfc241ae57a7c03e4b219d65f0921.jpg?width=720&height=720&hash=6104A208EA05F8AD4848CBB5B0D0FD83" },
  { name: "Samsung Galaxy Z Fold6", url: "https://s13emagst.akamaized.net/products/73523/73522675/images/res_5a87c128c5124b24f2a724b1dc4778fb.jpg?width=720&height=720&hash=0290BC9AAE7A77E2E5C734E9308045FE" },
  { name: "Apple iPhone 17 Pro Max", url: "https://s13emagst.akamaized.net/products/102972/102971604/images/res_8b9a44b3730436c3966b37351d4ba1d2.jpg?width=720&height=720&hash=F99DA454AA885BB4B06EF1C60D0B6439" },
  { name: "Apple iPhone 16 Pro Max", url: "https://s13emagst.akamaized.net/products/76828/76827265/images/res_1100df91ed470fdd72fe277fcc41f172.jpg?width=720&height=720&hash=FA7BFFBF52BB4D93CD59750DCDA2DDDC" },
  { name: "Google Pixel 10 Pro XL", url: "https://s13emagst.akamaized.net/products/100990/100989853/images/res_657c9bead6426b86d763dba1c5f3f55c.jpg?width=720&height=720&hash=7863DE4974D74E6D131090830172B0D3" },
  // Top
  { name: "Samsung Galaxy S25 Ultra", url: "https://s13emagst.akamaized.net/products/84446/84445769/images/res_001e7e69e6d46fc6986fd4ee21fa0b78.jpg?width=720&height=720&hash=6660C1D946D94CBE36805F70804E8C03" },
  { name: "Samsung Galaxy Z Flip7", url: "https://s13emagst.akamaized.net/products/99055/99054936/images/res_5cb15609fd2b0d87cdf6202ba92ed819.jpg?width=720&height=720&hash=D51F7CBC349879470C6ED6AAC9DBB7CB" },
  { name: "Samsung Galaxy S24 Plus", url: "https://s13emagst.akamaized.net/products/64817/64816450/images/res_eb58f90bc921f9a9cf7fc99e5e5e62a7.jpg?width=720&height=720&hash=8366B8A1D2FCD8E5DE3E66320514306D" },
  { name: "Apple iPhone 16 Plus", url: "https://s13emagst.akamaized.net/products/76828/76827233/images/res_dabc5bab75934ef960cb8f7ce09dfff1.jpg?width=720&height=720&hash=BD973104AB9B38E26C0E81F28E6467A8" },
  { name: "Apple iPhone 15 Plus", url: "https://s13emagst.akamaized.net/products/60458/60457138/images/res_fbbafe4e23f9ffec7d873617211c5892.jpg?width=720&height=720&hash=0751C4ABA0F508469B18AB8C50004A9A" },
  { name: "Google Pixel 10 Pro", url: "https://s13emagst.akamaized.net/products/100990/100989842/images/res_f47f2f1252c074b8353b67fb89a55420.jpg?width=720&height=720&hash=DC414A36BC30507B2D8F292DF129840D" },
  // Buget
  { name: "Google Pixel 9a", url: "https://s13emagst.akamaized.net/products/87839/87838250/images/res_5ed6774bbe3e16ae7d553bf553734955.jpg?width=720&height=720&hash=507CAF2A93992E32E974D743ACE99D19" },
  { name: "Samsung Galaxy S25 FE", url: "https://s13emagst.akamaized.net/products/101820/101819228/images/res_6052e9fd4d83cf0f1f35a38a674e5b2b.jpg?width=720&height=720&hash=79AA0ABA5D92BD1B5EF1CBED234C8D5F" },
  { name: "Xiaomi 15T", url: "https://s13emagst.akamaized.net/products/103853/103852844/images/res_a9b59c41a43864040cb524496c9eef3e.jpg?width=720&height=720&hash=59159D165E6A45B9032262D3E34F29A4" },
  { name: "OnePlus Nord 5", url: "https://s13emagst.akamaized.net/products/98400/98399213/images/res_256a825d9138f97e4be458be962369fe.jpg?width=720&height=720&hash=6B053A4EA4B40A8E4EA56C79F49F201A" },
  { name: "HONOR Magic 8 Lite", url: "https://s13emagst.akamaized.net/products/112412/112411541/images/res_acc22f38432655f8289a2e894f6c2abb.jpg?width=720&height=720&hash=EF513490799159D966B147F199094E13" },
  { name: "Motorola edge 70", url: "https://s13emagst.akamaized.net/products/107971/107970183/images/res_3c5ff120598abd763ba11b184683266f.jpg?width=720&height=720&hash=6C0D8B6AE45946049F96665291FD3E4C" },
  // Ieftin
  { name: "Samsung Galaxy A26", url: "https://s13emagst.akamaized.net/products/89071/89070968/images/res_647e0214d938cd83d6f5117a7b7bfa02.jpg?width=720&height=720&hash=04E15C6209E5BC1CC33F0325ADB59CDC" },
  { name: "HONOR Magic7 Lite", url: "https://s13emagst.akamaized.net/products/96170/96169892/images/res_198622d86ffcb9683a7bf25ec6ac6717.jpg?width=720&height=720&hash=BB9566D8D45740E1771766FDD959A062" },
  { name: "realme 14 Pro 5G", url: "https://s13emagst.akamaized.net/products/105941/105940201/images/res_21387855193beca7e7a9232881e04dd2.jpg?width=720&height=720&hash=D91A920EB59CE4BCE2BA8D70D8D6454D" },
  { name: "Motorola Moto g86", url: "https://s13emagst.akamaized.net/products/96586/96585994/images/res_b2b89de0c9ae56627871af333a6bfd6d.jpg?width=720&height=720&hash=B60B91467D903343E6BB273FE629FA85" },
  { name: "Apple iPhone XR", url: "https://s13emagst.akamaized.net/products/17043/17042909/images/res_beeb2a5b938cd2fc51ad063da79f4321.jpg?width=720&height=720&hash=0B3E3885F6901DBA254C7F15588C93E5" },
  { name: "Huawei P30 Pro", url: "https://s13emagst.akamaized.net/products/20936/20935295/images/res_04584acfa3f95c46a69f665db4834a21.jpg?width=720&height=720&hash=4FDDB796854271EFE867A77E69736E6A" },
];

const outDir = './public/images/products';

function downloadImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function processImage(product) {
  const slug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
  const outPath = path.join(outDir, `${slug}.webp`);

  if (fs.existsSync(outPath)) {
    console.log(`SKIP: ${product.name}`);
    return;
  }

  try {
    console.log(`Downloading: ${product.name}...`);
    const buffer = await downloadImage(product.url);

    await sharp(buffer)
      .resize(480, 480, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .webp({ quality: 82 })
      .toFile(outPath);

    console.log(`OK: ${product.name} -> ${outPath}`);
  } catch (err) {
    console.error(`FAIL: ${product.name}: ${err.message}`);
  }
}

(async () => {
  for (const p of products) {
    await processImage(p);
  }
  console.log('Done!');
})();
