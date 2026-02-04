if (!self.define) {
  let e,
    s = {};
  const i = (i, a) => (
    (i = new URL(i + ".js", a).href),
    s[i] ||
      new Promise((s) => {
        if ("document" in self) {
          const e = document.createElement("script");
          ((e.src = i), (e.onload = s), document.head.appendChild(e));
        } else ((e = i), importScripts(i), s());
      }).then(() => {
        let e = s[i];
        if (!e) throw new Error(`Module ${i} didn’t register its module`);
        return e;
      })
  );
  self.define = (a, n) => {
    const c = e || ("document" in self ? document.currentScript.src : "") || location.href;
    if (s[c]) return;
    let r = {};
    const t = (e) => i(e, c),
      d = { module: { uri: c }, exports: r, require: t };
    s[c] = Promise.all(a.map((e) => d[e] || t(e))).then((e) => (n(...e), r));
  };
}
define(["./workbox-00a24876"], function (e) {
  "use strict";
  (importScripts(),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        { url: "/_next/app-build-manifest.json", revision: "f12112c360b33f343138e2a3073930ae" },
        {
          url: "/_next/static/9rbW2S4uTWsEfMyFySzQ3/_buildManifest.js",
          revision: "c155cce658e53418dec34664328b51ac",
        },
        {
          url: "/_next/static/9rbW2S4uTWsEfMyFySzQ3/_ssgManifest.js",
          revision: "b6652df95db52feb4daf4eca35380933",
        },
        { url: "/_next/static/chunks/1-1aa0ee7282d475bb.js", revision: "9rbW2S4uTWsEfMyFySzQ3" },
        { url: "/_next/static/chunks/117-5259aebacb1cc53f.js", revision: "9rbW2S4uTWsEfMyFySzQ3" },
        { url: "/_next/static/chunks/137-a3ace61d70381f11.js", revision: "9rbW2S4uTWsEfMyFySzQ3" },
        { url: "/_next/static/chunks/168.c1408d91a5aa6bc0.js", revision: "c1408d91a5aa6bc0" },
        { url: "/_next/static/chunks/213-f279e1260fb21218.js", revision: "9rbW2S4uTWsEfMyFySzQ3" },
        { url: "/_next/static/chunks/219-369505b10d7de22b.js", revision: "9rbW2S4uTWsEfMyFySzQ3" },
        { url: "/_next/static/chunks/268-d995594f5adbe217.js", revision: "9rbW2S4uTWsEfMyFySzQ3" },
        { url: "/_next/static/chunks/347.3e60fd2a5a30033d.js", revision: "3e60fd2a5a30033d" },
        { url: "/_next/static/chunks/434-e3000e1272edfcbe.js", revision: "9rbW2S4uTWsEfMyFySzQ3" },
        { url: "/_next/static/chunks/464-77b1906df70eabdb.js", revision: "9rbW2S4uTWsEfMyFySzQ3" },
        { url: "/_next/static/chunks/481-ab5e090df0f90874.js", revision: "9rbW2S4uTWsEfMyFySzQ3" },
        { url: "/_next/static/chunks/497-358901969877d370.js", revision: "9rbW2S4uTWsEfMyFySzQ3" },
        { url: "/_next/static/chunks/538-4eb0dd4fb64541a5.js", revision: "9rbW2S4uTWsEfMyFySzQ3" },
        { url: "/_next/static/chunks/648-d8877f39249c57b8.js", revision: "9rbW2S4uTWsEfMyFySzQ3" },
        { url: "/_next/static/chunks/74-62ede2f6e871a17a.js", revision: "9rbW2S4uTWsEfMyFySzQ3" },
        {
          url: "/_next/static/chunks/77a6265a-8b56bf2c9f3c07fa.js",
          revision: "9rbW2S4uTWsEfMyFySzQ3",
        },
        { url: "/_next/static/chunks/797-28a97769803e6b46.js", revision: "9rbW2S4uTWsEfMyFySzQ3" },
        { url: "/_next/static/chunks/937-dc18177fa41b046d.js", revision: "9rbW2S4uTWsEfMyFySzQ3" },
        { url: "/_next/static/chunks/943-0c3abaf6ce17a225.js", revision: "9rbW2S4uTWsEfMyFySzQ3" },
        { url: "/_next/static/chunks/982-fb6b5363c0c90bb9.js", revision: "9rbW2S4uTWsEfMyFySzQ3" },
        {
          url: "/_next/static/chunks/app/%5BbookSlug%5D/history/page-5af4e1319bdd671f.js",
          revision: "9rbW2S4uTWsEfMyFySzQ3",
        },
        {
          url: "/_next/static/chunks/app/%5BbookSlug%5D/journal/%5BpageType%5D/page-2b4bda7a984119bc.js",
          revision: "9rbW2S4uTWsEfMyFySzQ3",
        },
        {
          url: "/_next/static/chunks/app/%5BbookSlug%5D/page-0ae33047bd24dcd4.js",
          revision: "9rbW2S4uTWsEfMyFySzQ3",
        },
        {
          url: "/_next/static/chunks/app/%5BbookSlug%5D/settings/page-109f5a691b9d364e.js",
          revision: "9rbW2S4uTWsEfMyFySzQ3",
        },
        {
          url: "/_next/static/chunks/app/(marketing)/pricing/page-de6ebb58e136d9c5.js",
          revision: "9rbW2S4uTWsEfMyFySzQ3",
        },
        {
          url: "/_next/static/chunks/app/_not-found/page-57194e5f52196e6e.js",
          revision: "9rbW2S4uTWsEfMyFySzQ3",
        },
        {
          url: "/_next/static/chunks/app/error-87df1f4158175927.js",
          revision: "9rbW2S4uTWsEfMyFySzQ3",
        },
        {
          url: "/_next/static/chunks/app/layout-4305ff30841fd95b.js",
          revision: "9rbW2S4uTWsEfMyFySzQ3",
        },
        {
          url: "/_next/static/chunks/app/page-02f59626fddd0922.js",
          revision: "9rbW2S4uTWsEfMyFySzQ3",
        },
        {
          url: "/_next/static/chunks/app/payment/success/page-0bc0fb3edcd3ac75.js",
          revision: "9rbW2S4uTWsEfMyFySzQ3",
        },
        {
          url: "/_next/static/chunks/app/video/%5BroomId%5D/page-9a611b62f5d26edc.js",
          revision: "9rbW2S4uTWsEfMyFySzQ3",
        },
        { url: "/_next/static/chunks/e66da216.4e1212727c0aa628.js", revision: "4e1212727c0aa628" },
        {
          url: "/_next/static/chunks/fd9d1056-123bdeb4f264f530.js",
          revision: "9rbW2S4uTWsEfMyFySzQ3",
        },
        {
          url: "/_next/static/chunks/framework-aec844d2ccbe7592.js",
          revision: "9rbW2S4uTWsEfMyFySzQ3",
        },
        {
          url: "/_next/static/chunks/main-app-f40cdd3507df6bf3.js",
          revision: "9rbW2S4uTWsEfMyFySzQ3",
        },
        { url: "/_next/static/chunks/main-b5dac8d5bd89fd9b.js", revision: "9rbW2S4uTWsEfMyFySzQ3" },
        {
          url: "/_next/static/chunks/pages/_app-72b849fbd24ac258.js",
          revision: "9rbW2S4uTWsEfMyFySzQ3",
        },
        {
          url: "/_next/static/chunks/pages/_error-7ba65e1336b92748.js",
          revision: "9rbW2S4uTWsEfMyFySzQ3",
        },
        {
          url: "/_next/static/chunks/polyfills-42372ed130431b0a.js",
          revision: "846118c33b2c0e922d7b3a7676f81f6f",
        },
        {
          url: "/_next/static/chunks/webpack-7fca1b2b62121b1b.js",
          revision: "9rbW2S4uTWsEfMyFySzQ3",
        },
        { url: "/_next/static/css/4c359c64ac064ed9.css", revision: "4c359c64ac064ed9" },
        { url: "/_next/static/css/ab6a53438d27396f.css", revision: "ab6a53438d27396f" },
        { url: "/_next/static/media/Gynergy.1e2ccfa9.woff", revision: "1e2ccfa9" },
        { url: "/_next/static/media/Gynergy.4df777d4.eot", revision: "4df777d4" },
        { url: "/_next/static/media/Gynergy.ba240e9e.svg", revision: "ba240e9e" },
        { url: "/_next/static/media/Gynergy.f7847939.ttf", revision: "f7847939" },
        {
          url: "/_next/static/media/community.f61d013a.svg",
          revision: "1e1b8aa4c851241d21283fe3b2dbfd35",
        },
        {
          url: "/_next/static/media/congrats-avatar.840c500f.png",
          revision: "a929730cafa4513c87d5ebc8041a9171",
        },
        {
          url: "/_next/static/media/date-zero-logo.c3e70c7a.svg",
          revision: "746290093772b7e6a833d2b170c7dfcc",
        },
        {
          url: "/_next/static/media/icon-128x128.e9287455.png",
          revision: "9a263640c81438cdfe34cc5b284fa5b7",
        },
        {
          url: "/_next/static/media/icon-144x144.19f19307.png",
          revision: "d75d4e2be7a53e37ec16dbdbf09df671",
        },
        {
          url: "/_next/static/media/icon-152x152.dc784233.png",
          revision: "054b5e17b21c2d123e88565d7c6ec0e0",
        },
        {
          url: "/_next/static/media/icon-192x192.d98ee616.png",
          revision: "723d3bfa8f5617c9534fa73b5939a1fc",
        },
        {
          url: "/_next/static/media/icon-384x384.2bf8f451.png",
          revision: "4b9c3f11ca5e3b608562b26a412aae24",
        },
        {
          url: "/_next/static/media/icon-512x512.90150b56.png",
          revision: "674af25fadda97ed3965417681b45279",
        },
        {
          url: "/_next/static/media/icon-72x72.dca41b35.png",
          revision: "1f2851a40980176046aaecb86acdfd91",
        },
        {
          url: "/_next/static/media/icon-96x96.6ba7f727.png",
          revision: "f551b666483071e1ecf70cda28158941",
        },
        {
          url: "/_next/static/media/image-placeholder.ae4240f7.jpg",
          revision: "4ec76af3958398a2b343df10c13d40be",
        },
        {
          url: "/_next/static/media/inspiration-gratitude.fafd16dd.jpg",
          revision: "a9aad636a650adb4a63525b158aeccdd",
        },
        {
          url: "/_next/static/media/leaves-right.d3f036a4.svg",
          revision: "aed384dc0cfc78dc5e8295a989afd03b",
        },
        {
          url: "/_next/static/media/login-banner.4cfa02db.jpg",
          revision: "0b23f8737c4adbd0bb538e361cf4c8a0",
        },
        {
          url: "/_next/static/media/meta-image.6bc36bf3.jpg",
          revision: "07dea4fb6248a442f3d5b9833d730bd2",
        },
        {
          url: "/_next/static/media/point.2bcf7e71.svg",
          revision: "c25a60242103085fea67f9b4770b670d",
        },
        {
          url: "/_next/static/media/prize-medal-winner-award-star.56cdc840.svg",
          revision: "690bcd18df3d4448d962d17acd656169",
        },
        {
          url: "/_next/static/media/profile-image-placeholder.14d15c5d.jpg",
          revision: "1c095a2e8a44e2b14ba15eb560049ba1",
        },
        {
          url: "/_next/static/media/rank-1.17557fff.svg",
          revision: "8a3f64e2fbee4116da7a0a4479a24e58",
        },
        {
          url: "/_next/static/media/rank-2.143acf80.svg",
          revision: "daa4e6365a7bd628abdc09be8d45577c",
        },
        {
          url: "/_next/static/media/rank-3.3acfc485.svg",
          revision: "aa3416568ba6d8a9e5e5976673d5646b",
        },
        {
          url: "/_next/static/media/shortcut-chat.6ba7f727.png",
          revision: "f551b666483071e1ecf70cda28158941",
        },
        {
          url: "/_next/static/media/shortcut-evening.6ba7f727.png",
          revision: "f551b666483071e1ecf70cda28158941",
        },
        {
          url: "/_next/static/media/shortcut-morning.6ba7f727.png",
          revision: "f551b666483071e1ecf70cda28158941",
        },
        {
          url: "/_next/static/media/streak.85d111cd.svg",
          revision: "4bb9a5e1c506b560b2f1282f73bcab73",
        },
        {
          url: "/_next/static/media/video-placeholder.c18fc9c0.png",
          revision: "209b9188ecf38a691062c2525b64c2e0",
        },
        { url: "/android-chrome-192x192.png", revision: "f0b5ccd11c2b71d4e474b4443fdff3ca" },
        { url: "/android-chrome-512x512.png", revision: "674af25fadda97ed3965417681b45279" },
        { url: "/apple-touch-icon.png", revision: "2bc7fdc113dec96aa7b5664a24162ebd" },
        { url: "/favicon-16x16.png", revision: "ddfabc3261c611ce593a37bee4f4aadb" },
        { url: "/favicon-32x32.png", revision: "9446608f1c103db4c8f88046dd579887" },
        { url: "/favicon.ico", revision: "4a40c6e7d12779039debef568e87709b" },
        { url: "/fonts/WorkSans-Black.ttf", revision: "b2aba36e3bf90520d734ccf777833847" },
        { url: "/fonts/WorkSans-Bold.ttf", revision: "1559ffc7cf61cbae7ea55a250722009c" },
        { url: "/fonts/WorkSans-Regular.ttf", revision: "a3d6c7f7606fc33a6ab5bed9688d1fe8" },
        { url: "/fonts/WorkSans.ttf", revision: "c3972579bd5cb0090c0c9fc6201fda19" },
        { url: "/iconfonts/Read Me.txt", revision: "b7682365f59b9ebe9891e608ea182e44" },
        { url: "/iconfonts/demo-files/demo.css", revision: "9a37c3b875ee5f4b1c6975bb31d6d3cd" },
        { url: "/iconfonts/demo-files/demo.js", revision: "3b9d1a0e781f00d1ef22bc48202efab1" },
        { url: "/iconfonts/demo.html", revision: "05202528ba4d246fcb6fa17c1ea962bd" },
        { url: "/iconfonts/fonts/Gynergy.eot", revision: "48d1ff01f867b0bc8c3f12fc62b0a9b6" },
        { url: "/iconfonts/fonts/Gynergy.svg", revision: "fc6fef990bf8d6cd46ee9ff3e93d03d6" },
        { url: "/iconfonts/fonts/Gynergy.ttf", revision: "f55c94bdfae6baa019d380d6017677ed" },
        { url: "/iconfonts/fonts/Gynergy.woff", revision: "9fe7d06d969ebbea5b0641f30d0980c8" },
        { url: "/iconfonts/liga.js", revision: "997f5c46bf11c45095c20f0592c53b02" },
        { url: "/iconfonts/selection.json", revision: "f248cfb6854fc1b6ca515b7800c65f53" },
        { url: "/iconfonts/style.css", revision: "936421e58f4f668e00a7713a5488894c" },
        { url: "/icons/community.svg", revision: "1e1b8aa4c851241d21283fe3b2dbfd35" },
        { url: "/icons/date-zero-logo.svg", revision: "746290093772b7e6a833d2b170c7dfcc" },
        { url: "/icons/icon-128x128.png", revision: "9a263640c81438cdfe34cc5b284fa5b7" },
        { url: "/icons/icon-144x144.png", revision: "d75d4e2be7a53e37ec16dbdbf09df671" },
        { url: "/icons/icon-152x152.png", revision: "054b5e17b21c2d123e88565d7c6ec0e0" },
        { url: "/icons/icon-192x192.png", revision: "723d3bfa8f5617c9534fa73b5939a1fc" },
        { url: "/icons/icon-384x384.png", revision: "4b9c3f11ca5e3b608562b26a412aae24" },
        { url: "/icons/icon-512x512.png", revision: "674af25fadda97ed3965417681b45279" },
        { url: "/icons/icon-72x72.png", revision: "1f2851a40980176046aaecb86acdfd91" },
        { url: "/icons/icon-96x96.png", revision: "f551b666483071e1ecf70cda28158941" },
        { url: "/icons/point.svg", revision: "c25a60242103085fea67f9b4770b670d" },
        { url: "/icons/shortcut-chat.png", revision: "f551b666483071e1ecf70cda28158941" },
        { url: "/icons/shortcut-evening.png", revision: "f551b666483071e1ecf70cda28158941" },
        { url: "/icons/shortcut-morning.png", revision: "f551b666483071e1ecf70cda28158941" },
        { url: "/icons/streak.svg", revision: "4bb9a5e1c506b560b2f1282f73bcab73" },
        { url: "/images/congrats-avatar.png", revision: "a929730cafa4513c87d5ebc8041a9171" },
        { url: "/images/image-placeholder.jpg", revision: "4ec76af3958398a2b343df10c13d40be" },
        { url: "/images/inspiration-gratitude.jpg", revision: "a9aad636a650adb4a63525b158aeccdd" },
        { url: "/images/leaves-right.svg", revision: "aed384dc0cfc78dc5e8295a989afd03b" },
        { url: "/images/login-banner.jpg", revision: "0b23f8737c4adbd0bb538e361cf4c8a0" },
        { url: "/images/meta-image.jpg", revision: "07dea4fb6248a442f3d5b9833d730bd2" },
        {
          url: "/images/prize-medal-winner-award-star.svg",
          revision: "690bcd18df3d4448d962d17acd656169",
        },
        {
          url: "/images/profile-image-placeholder.jpg",
          revision: "1c095a2e8a44e2b14ba15eb560049ba1",
        },
        { url: "/images/rank-1.svg", revision: "8a3f64e2fbee4116da7a0a4479a24e58" },
        { url: "/images/rank-2.svg", revision: "daa4e6365a7bd628abdc09be8d45577c" },
        { url: "/images/rank-3.svg", revision: "aa3416568ba6d8a9e5e5976673d5646b" },
        { url: "/images/video-placeholder.png", revision: "209b9188ecf38a691062c2525b64c2e0" },
        { url: "/manifest.json", revision: "729ed73ed32e4c823c02550709bfa56e" },
        { url: "/placeholder.png", revision: "d41d8cd98f00b204e9800998ecf8427e" },
        { url: "/screenshots/home.png", revision: "674af25fadda97ed3965417681b45279" },
        { url: "/site.webmanifest", revision: "053100cb84a50d2ae7f5492f7dd7f25e" },
      ],
      { ignoreURLParametersMatching: [] }
    ),
    e.cleanupOutdatedCaches(),
    e.registerRoute(
      "/",
      new e.NetworkFirst({
        cacheName: "start-url",
        plugins: [
          {
            cacheWillUpdate: async ({ request: e, response: s, event: i, state: a }) =>
              s && "opaqueredirect" === s.type
                ? new Response(s.body, { status: 200, statusText: "OK", headers: s.headers })
                : s,
          },
        ],
      }),
      "GET"
    ),
    e.registerRoute(
      /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
      new e.CacheFirst({
        cacheName: "google-fonts",
        plugins: [new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 31536e3 })],
      }),
      "GET"
    ),
    e.registerRoute(
      /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-font-assets",
        plugins: [new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 })],
      }),
      "GET"
    ),
    e.registerRoute(
      /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-image-assets",
        plugins: [new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 })],
      }),
      "GET"
    ),
    e.registerRoute(
      /\/_next\/image\?url=.+$/i,
      new e.StaleWhileRevalidate({
        cacheName: "next-image",
        plugins: [new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 })],
      }),
      "GET"
    ),
    e.registerRoute(
      /\.(?:js)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-js-assets",
        plugins: [new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 })],
      }),
      "GET"
    ),
    e.registerRoute(
      /\.(?:css|less)$/i,
      new e.StaleWhileRevalidate({
        cacheName: "static-style-assets",
        plugins: [new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 })],
      }),
      "GET"
    ),
    e.registerRoute(
      /\/_next\/data\/.+\/.+\.json$/i,
      new e.StaleWhileRevalidate({
        cacheName: "next-data",
        plugins: [new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 })],
      }),
      "GET"
    ),
    e.registerRoute(
      /\/api\/.*$/i,
      new e.NetworkFirst({
        cacheName: "apis",
        networkTimeoutSeconds: 10,
        plugins: [new e.ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 86400 })],
      }),
      "GET"
    ),
    e.registerRoute(
      /.*/i,
      new e.NetworkFirst({
        cacheName: "others",
        networkTimeoutSeconds: 10,
        plugins: [new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 })],
      }),
      "GET"
    ));
});
