if (!self.define) {
  let e,
    a = {};
  const i = (i, s) => (
    (i = new URL(i + ".js", s).href),
    a[i] ||
      new Promise((a) => {
        if ("document" in self) {
          const e = document.createElement("script");
          ((e.src = i), (e.onload = a), document.head.appendChild(e));
        } else ((e = i), importScripts(i), a());
      }).then(() => {
        let e = a[i];
        if (!e) throw new Error(`Module ${i} didn’t register its module`);
        return e;
      })
  );
  self.define = (s, c) => {
    const n = e || ("document" in self ? document.currentScript.src : "") || location.href;
    if (a[n]) return;
    let t = {};
    const r = (e) => i(e, n),
      d = { module: { uri: n }, exports: t, require: r };
    a[n] = Promise.all(s.map((e) => d[e] || r(e))).then((e) => (c(...e), t));
  };
}
define(["./workbox-00a24876"], function (e) {
  "use strict";
  (importScripts(),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        { url: "/_next/app-build-manifest.json", revision: "685d680201f0e9533fde82efea9fa40a" },
        { url: "/_next/static/chunks/1472-d5c804d54a032488.js", revision: "mJN1NUkc0RtJz0j_LauK4" },
        { url: "/_next/static/chunks/1594-e68f8b1528b18458.js", revision: "mJN1NUkc0RtJz0j_LauK4" },
        { url: "/_next/static/chunks/2117-a014c879cb5d5864.js", revision: "mJN1NUkc0RtJz0j_LauK4" },
        { url: "/_next/static/chunks/2168.1580b8c43116a47d.js", revision: "1580b8c43116a47d" },
        { url: "/_next/static/chunks/2189-2c802082ce704e36.js", revision: "mJN1NUkc0RtJz0j_LauK4" },
        { url: "/_next/static/chunks/2347.745a5134064bb180.js", revision: "745a5134064bb180" },
        { url: "/_next/static/chunks/2480-68c5a9c6405b7da4.js", revision: "mJN1NUkc0RtJz0j_LauK4" },
        { url: "/_next/static/chunks/2500-67db296ee352f6b5.js", revision: "mJN1NUkc0RtJz0j_LauK4" },
        { url: "/_next/static/chunks/2569-46c4196aec7d41b4.js", revision: "mJN1NUkc0RtJz0j_LauK4" },
        { url: "/_next/static/chunks/2957-7263e1aa70b999d4.js", revision: "mJN1NUkc0RtJz0j_LauK4" },
        { url: "/_next/static/chunks/2972-5f76d69930c1c1d8.js", revision: "mJN1NUkc0RtJz0j_LauK4" },
        { url: "/_next/static/chunks/3145-742f66f3e01c71e3.js", revision: "mJN1NUkc0RtJz0j_LauK4" },
        { url: "/_next/static/chunks/324-8f649610c4ab04a6.js", revision: "mJN1NUkc0RtJz0j_LauK4" },
        { url: "/_next/static/chunks/3457.61739bc68091c28a.js", revision: "61739bc68091c28a" },
        { url: "/_next/static/chunks/3464-881f04f0d034d022.js", revision: "mJN1NUkc0RtJz0j_LauK4" },
        { url: "/_next/static/chunks/4201.bb7bdf140e11c031.js", revision: "bb7bdf140e11c031" },
        { url: "/_next/static/chunks/4797-6b76c822b2cd1700.js", revision: "mJN1NUkc0RtJz0j_LauK4" },
        { url: "/_next/static/chunks/4937-a1962d5ef63ac124.js", revision: "mJN1NUkc0RtJz0j_LauK4" },
        { url: "/_next/static/chunks/5402-f861d05b1b8931e8.js", revision: "mJN1NUkc0RtJz0j_LauK4" },
        { url: "/_next/static/chunks/5626-0d1704d49e362aca.js", revision: "mJN1NUkc0RtJz0j_LauK4" },
        { url: "/_next/static/chunks/5820-1919245983851e12.js", revision: "mJN1NUkc0RtJz0j_LauK4" },
        { url: "/_next/static/chunks/5954.41e9f86609128506.js", revision: "41e9f86609128506" },
        { url: "/_next/static/chunks/6137-55e8654b1ee641b1.js", revision: "mJN1NUkc0RtJz0j_LauK4" },
        { url: "/_next/static/chunks/7135-d27107dc863c99dc.js", revision: "mJN1NUkc0RtJz0j_LauK4" },
        {
          url: "/_next/static/chunks/77a6265a-38b696070bd7dda8.js",
          revision: "mJN1NUkc0RtJz0j_LauK4",
        },
        { url: "/_next/static/chunks/8848-484b9db08ddaf93d.js", revision: "mJN1NUkc0RtJz0j_LauK4" },
        { url: "/_next/static/chunks/9269-caee80ee3dcaeb1f.js", revision: "mJN1NUkc0RtJz0j_LauK4" },
        { url: "/_next/static/chunks/9390-d8d959fdb67d0734.js", revision: "mJN1NUkc0RtJz0j_LauK4" },
        { url: "/_next/static/chunks/a4634e51.33dc640d3ed84889.js", revision: "33dc640d3ed84889" },
        {
          url: "/_next/static/chunks/app/%5BbookSlug%5D/history/page-268448ded53389f1.js",
          revision: "mJN1NUkc0RtJz0j_LauK4",
        },
        {
          url: "/_next/static/chunks/app/%5BbookSlug%5D/journal/%5BpageType%5D/page-c8d1e0f49008668b.js",
          revision: "mJN1NUkc0RtJz0j_LauK4",
        },
        {
          url: "/_next/static/chunks/app/%5BbookSlug%5D/page-e4bb036c00b54d12.js",
          revision: "mJN1NUkc0RtJz0j_LauK4",
        },
        {
          url: "/_next/static/chunks/app/%5BbookSlug%5D/settings/page-b9e10d6e52081134.js",
          revision: "mJN1NUkc0RtJz0j_LauK4",
        },
        {
          url: "/_next/static/chunks/app/(marketing)/pricing/page-f03238eccbf4c5ef.js",
          revision: "mJN1NUkc0RtJz0j_LauK4",
        },
        {
          url: "/_next/static/chunks/app/_not-found/page-33a0d1a4a2aa6ebf.js",
          revision: "mJN1NUkc0RtJz0j_LauK4",
        },
        {
          url: "/_next/static/chunks/app/admin/analytics/loading-6e193ed170e381a2.js",
          revision: "mJN1NUkc0RtJz0j_LauK4",
        },
        {
          url: "/_next/static/chunks/app/admin/analytics/page-f1ee32d57be8629b.js",
          revision: "mJN1NUkc0RtJz0j_LauK4",
        },
        {
          url: "/_next/static/chunks/app/admin/community/loading-f119ac7d45a51d03.js",
          revision: "mJN1NUkc0RtJz0j_LauK4",
        },
        {
          url: "/_next/static/chunks/app/admin/community/page-89f2ef36ebd2ab93.js",
          revision: "mJN1NUkc0RtJz0j_LauK4",
        },
        {
          url: "/_next/static/chunks/app/admin/content/loading-3ff9efda2049cda8.js",
          revision: "mJN1NUkc0RtJz0j_LauK4",
        },
        {
          url: "/_next/static/chunks/app/admin/content/page-6ee19d20538c5178.js",
          revision: "mJN1NUkc0RtJz0j_LauK4",
        },
        {
          url: "/_next/static/chunks/app/admin/error-334aa070a2e9ccf2.js",
          revision: "mJN1NUkc0RtJz0j_LauK4",
        },
        {
          url: "/_next/static/chunks/app/admin/gamification/loading-b928f030b8e2c005.js",
          revision: "mJN1NUkc0RtJz0j_LauK4",
        },
        {
          url: "/_next/static/chunks/app/admin/gamification/page-07490b47a577bffd.js",
          revision: "mJN1NUkc0RtJz0j_LauK4",
        },
        {
          url: "/_next/static/chunks/app/admin/layout-5ef85a34f1ca6938.js",
          revision: "mJN1NUkc0RtJz0j_LauK4",
        },
        {
          url: "/_next/static/chunks/app/admin/loading-cbf88eef81f6e636.js",
          revision: "mJN1NUkc0RtJz0j_LauK4",
        },
        {
          url: "/_next/static/chunks/app/admin/page-48bcf1cddae4cb10.js",
          revision: "mJN1NUkc0RtJz0j_LauK4",
        },
        {
          url: "/_next/static/chunks/app/admin/payments/loading-b5aa81cf8816dd41.js",
          revision: "mJN1NUkc0RtJz0j_LauK4",
        },
        {
          url: "/_next/static/chunks/app/admin/payments/page-3b168df89adefa5d.js",
          revision: "mJN1NUkc0RtJz0j_LauK4",
        },
        {
          url: "/_next/static/chunks/app/admin/settings/loading-03f1657387d6d4b6.js",
          revision: "mJN1NUkc0RtJz0j_LauK4",
        },
        {
          url: "/_next/static/chunks/app/admin/settings/page-3f80231adc4dc556.js",
          revision: "mJN1NUkc0RtJz0j_LauK4",
        },
        {
          url: "/_next/static/chunks/app/admin/system/loading-5562b6c992a34895.js",
          revision: "mJN1NUkc0RtJz0j_LauK4",
        },
        {
          url: "/_next/static/chunks/app/admin/system/page-35d02ae24be1ceed.js",
          revision: "mJN1NUkc0RtJz0j_LauK4",
        },
        {
          url: "/_next/static/chunks/app/admin/users/loading-3607a25da6811065.js",
          revision: "mJN1NUkc0RtJz0j_LauK4",
        },
        {
          url: "/_next/static/chunks/app/admin/users/page-c3841664a9197f71.js",
          revision: "mJN1NUkc0RtJz0j_LauK4",
        },
        {
          url: "/_next/static/chunks/app/community/loading-8bf0a7461ddeabfe.js",
          revision: "mJN1NUkc0RtJz0j_LauK4",
        },
        {
          url: "/_next/static/chunks/app/community/member/%5Bid%5D/page-2918e03ce487a365.js",
          revision: "mJN1NUkc0RtJz0j_LauK4",
        },
        {
          url: "/_next/static/chunks/app/community/page-e978eab6bfaf3a08.js",
          revision: "mJN1NUkc0RtJz0j_LauK4",
        },
        {
          url: "/_next/static/chunks/app/courses/%5BcourseId%5D/edit/page-8ca1f9b3bc66a9ef.js",
          revision: "mJN1NUkc0RtJz0j_LauK4",
        },
        {
          url: "/_next/static/chunks/app/courses/%5BcourseId%5D/page-8ae332facdf33f77.js",
          revision: "mJN1NUkc0RtJz0j_LauK4",
        },
        {
          url: "/_next/static/chunks/app/courses/page-fc0d7b32c6291505.js",
          revision: "mJN1NUkc0RtJz0j_LauK4",
        },
        {
          url: "/_next/static/chunks/app/error-e2c67fc50361380f.js",
          revision: "mJN1NUkc0RtJz0j_LauK4",
        },
        {
          url: "/_next/static/chunks/app/layout-458c4f992e5a1f2d.js",
          revision: "mJN1NUkc0RtJz0j_LauK4",
        },
        {
          url: "/_next/static/chunks/app/library/page-e001e94d10b6f058.js",
          revision: "mJN1NUkc0RtJz0j_LauK4",
        },
        {
          url: "/_next/static/chunks/app/loading-64697651a8bcdbaa.js",
          revision: "mJN1NUkc0RtJz0j_LauK4",
        },
        {
          url: "/_next/static/chunks/app/login/page-10d0cd84fcc1b1d7.js",
          revision: "mJN1NUkc0RtJz0j_LauK4",
        },
        {
          url: "/_next/static/chunks/app/not-found-3c642f704488fb0a.js",
          revision: "mJN1NUkc0RtJz0j_LauK4",
        },
        {
          url: "/_next/static/chunks/app/page-0a40101abd9b5f4a.js",
          revision: "mJN1NUkc0RtJz0j_LauK4",
        },
        {
          url: "/_next/static/chunks/app/payment/success/page-a0bb35620a82a627.js",
          revision: "mJN1NUkc0RtJz0j_LauK4",
        },
        {
          url: "/_next/static/chunks/app/video/%5BroomId%5D/page-f7b9a3f822462c48.js",
          revision: "mJN1NUkc0RtJz0j_LauK4",
        },
        { url: "/_next/static/chunks/e66da216.6f57bddb11e62fe3.js", revision: "6f57bddb11e62fe3" },
        {
          url: "/_next/static/chunks/fd9d1056-4862ea55621d2c8c.js",
          revision: "mJN1NUkc0RtJz0j_LauK4",
        },
        {
          url: "/_next/static/chunks/framework-08aa667e5202eed8.js",
          revision: "mJN1NUkc0RtJz0j_LauK4",
        },
        {
          url: "/_next/static/chunks/main-app-65b540a0b61952f5.js",
          revision: "mJN1NUkc0RtJz0j_LauK4",
        },
        { url: "/_next/static/chunks/main-c888404270df3e84.js", revision: "mJN1NUkc0RtJz0j_LauK4" },
        {
          url: "/_next/static/chunks/pages/_app-3c9ca398d360b709.js",
          revision: "mJN1NUkc0RtJz0j_LauK4",
        },
        {
          url: "/_next/static/chunks/pages/_error-cf5ca766ac8f493f.js",
          revision: "mJN1NUkc0RtJz0j_LauK4",
        },
        {
          url: "/_next/static/chunks/polyfills-42372ed130431b0a.js",
          revision: "846118c33b2c0e922d7b3a7676f81f6f",
        },
        {
          url: "/_next/static/chunks/webpack-17f83fa58e85b7dc.js",
          revision: "mJN1NUkc0RtJz0j_LauK4",
        },
        { url: "/_next/static/css/4c359c64ac064ed9.css", revision: "4c359c64ac064ed9" },
        { url: "/_next/static/css/846d84ba9d8a1055.css", revision: "846d84ba9d8a1055" },
        {
          url: "/_next/static/mJN1NUkc0RtJz0j_LauK4/_buildManifest.js",
          revision: "6310079bf1ae7bebeb6a2135896e4564",
        },
        {
          url: "/_next/static/mJN1NUkc0RtJz0j_LauK4/_ssgManifest.js",
          revision: "b6652df95db52feb4daf4eca35380933",
        },
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
        { url: "/iconfonts/demo-files/demo.css", revision: "608c9d68646ee38f509b14c48c07fce4" },
        { url: "/iconfonts/demo-files/demo.js", revision: "31e65d67ed125ae2aeb9f0e449c741e2" },
        { url: "/iconfonts/demo.html", revision: "4063ea328ab2c3e8483862bf8c971311" },
        { url: "/iconfonts/fonts/Gynergy.eot", revision: "48d1ff01f867b0bc8c3f12fc62b0a9b6" },
        { url: "/iconfonts/fonts/Gynergy.svg", revision: "fc6fef990bf8d6cd46ee9ff3e93d03d6" },
        { url: "/iconfonts/fonts/Gynergy.ttf", revision: "f55c94bdfae6baa019d380d6017677ed" },
        { url: "/iconfonts/fonts/Gynergy.woff", revision: "9fe7d06d969ebbea5b0641f30d0980c8" },
        { url: "/iconfonts/liga.js", revision: "b41ea1cf54b71822fbcffc4f8dacbf61" },
        { url: "/iconfonts/selection.json", revision: "f98a7eaf2179129db2fc00f62826ec84" },
        { url: "/iconfonts/style.css", revision: "990d59514c81eec1962774a5bc8744ad" },
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
        { url: "/site.webmanifest", revision: "8fffcdf720e62d5b464f43d965beff3d" },
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
            cacheWillUpdate: async ({ request: e, response: a, event: i, state: s }) =>
              a && "opaqueredirect" === a.type
                ? new Response(a.body, { status: 200, statusText: "OK", headers: a.headers })
                : a,
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
