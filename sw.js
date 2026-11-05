// Offline support for the trip pages.
// Pages/JS: network first (always fresh when online), cached copy when offline.
// Images, fonts and the receipt-OCR engine: served from cache once downloaded.
// Bump VERSION when images change so phones re-download them.
const VERSION = 'v1-2026-11-05';
const CORE = 'core-' + VERSION;
const RUNTIME = 'runtime-' + VERSION;
const PRECACHE = [
  './',
  'index.html',
  'list.html',
  'itinerary.html',
  'card-rewards.html',
  'ledger.html',
  'tax-free.html',
  'rewards.js',
  'img/acnes.jpg',
  'img/andbe_eye.jpg',
  'img/andbe_reflect.jpg',
  'img/bocca.jpg',
  'img/brow.jpg',
  'img/by365.jpg',
  'img/calypso.jpg',
  'img/canele.jpg',
  'img/cezanne.jpg',
  'img/cm_clearveil.jpg',
  'img/cpb_lip.jpg',
  'img/cpb_veil.jpg',
  'img/cplip.jpg',
  'img/curel_bath.jpg',
  'img/cushion.jpg',
  'img/cz_faceglow.jpg',
  'img/cz_pale.jpg',
  'img/cz_pearl.jpg',
  'img/cz_shading.jpg',
  'img/cz_tonefilter.jpg',
  'img/decorte.jpg',
  'img/elixir_mizu.jpg',
  'img/enamor.jpg',
  'img/etvos.jpg',
  'img/garaku_pack.jpg',
  'img/hiruzen.jpg',
  'img/hoka.jpg',
  'img/inoui.jpg',
  'img/kate_namida.jpg',
  'img/kiss.jpg',
  'img/lasana.jpg',
  'img/laserbalm.jpg',
  'img/lipscrub.jpg',
  'img/locobase.jpg',
  'img/loveliner.jpg',
  'img/mb_base.jpg',
  'img/mb_pack.jpg',
  'img/melon.jpg',
  'img/meme.jpg',
  'img/merucheese.jpg',
  'img/mqure.jpg',
  'img/muhi_baby.jpg',
  'img/muhi_ex.jpg',
  'img/muhi_patch.jpg',
  'img/muji_bagin.jpg',
  'img/muji_brush.jpg',
  'img/muji_hairess.jpg',
  'img/muji_hook.jpg',
  'img/muji_scalp.jpg',
  'img/myboostars.jpg',
  'img/narisup.jpg',
  'img/ombre.jpg',
  'img/oofos.jpg',
  'img/polybaby.jpg',
  'img/pyt.jpg',
  'img/pyuora.jpg',
  'img/royalcream.jpg',
  'img/santen_med.jpg',
  'img/silky.jpg',
  'img/snowcheese.jpg',
  'img/sui_clay.jpg',
  'img/sui_hand.jpg',
  'img/suqqu_blush.jpg',
  'img/suqqu_hl.jpg',
  'img/tc_comb.jpg',
  'img/three.jpg',
  'img/toe_cushion.jpg',
  'img/tokio.jpg',
  'img/ululis_black.jpg',
  'img/ululis_pink.jpg',
  'img/unlabel_c.jpg',
  'img/uq_henley.jpg',
  'img/uq_jacket.jpg',
  'img/whomee.jpg',
  'img/zenyaku.jpg'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil((async () => {
    const cache = await caches.open(CORE);
    // add one by one so a single missing file doesn't block the rest
    await Promise.all(PRECACHE.map(u => cache.add(new Request(u, {cache: 'reload'})).catch(() => {})));
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keep = [CORE, RUNTIME];
    for (const k of await caches.keys()) if (!keep.includes(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

const sameOrigin = url => url.origin === self.location.origin;
const isPage = (req, url) => req.mode === 'navigate' || /\.(html|js)$/.test(url.pathname) || url.pathname.endsWith('/');
const CDN = /^(fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net)$/;

async function networkFirst(req) {
  const cache = await caches.open(CORE);
  const network = fetch(req).then(res => {
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  });
  network.catch(() => {});
  const cached = () => caches.match(req, {ignoreSearch: true});
  try {
    // slow network: show the saved copy after 4s instead of spinning
    const res = await Promise.race([network, new Promise((_, rej) => setTimeout(() => rej(new Error('slow')), 4000))]);
    return res;
  } catch (e) {
    const hit = await cached();
    if (hit) return hit;
    try { return await network; } catch (e2) {
      if (req.mode === 'navigate') { const home = await caches.match('index.html'); if (home) return home; }
      throw e2;
    }
  }
}

async function cacheFirst(req, name) {
  const hit = await caches.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res && (res.ok || res.type === 'opaque')) (await caches.open(name)).put(req, res.clone());
  return res;
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;            // Google Sheets sync etc. go straight to the network
  const url = new URL(req.url);
  if (sameOrigin(url)) {
    event.respondWith(isPage(req, url) ? networkFirst(req) : cacheFirst(req, CORE));
  } else if (CDN.test(url.hostname)) {
    event.respondWith(cacheFirst(req, RUNTIME));
  }
});
