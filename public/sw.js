if (!self.define) {
  let s,
    e = {};
  const n = (n, a) => (
    (n = new URL(n + ".js", a).href),
    e[n] ||
      new Promise((e) => {
        if ("document" in self) {
          const s = document.createElement("script");
          ((s.src = n), (s.onload = e), document.head.appendChild(s));
        } else ((s = n), importScripts(n), e());
      }).then(() => {
        let s = e[n];
        if (!s) throw new Error(`Module ${n} didn’t register its module`);
        return s;
      })
  );
  self.define = (a, i) => {
    const t = s || ("document" in self ? document.currentScript.src : "") || location.href;
    if (e[t]) return;
    let c = {};
    const r = (s) => n(s, t),
      u = { module: { uri: t }, exports: c, require: r };
    e[t] = Promise.all(a.map((s) => u[s] || r(s))).then((s) => (i(...s), c));
  };
}
define(["./workbox-00a24876"], function (s) {
  "use strict";
  (importScripts(),
    self.skipWaiting(),
    s.clientsClaim(),
    s.precacheAndRoute(
      [
        { url: "/_next/app-build-manifest.json", revision: "53336a81a5db61e366eebcaba5e898a1" },
        {
          url: "/_next/static/GEbJDWtFswl_nuFRTpFs4/_buildManifest.js",
          revision: "6310079bf1ae7bebeb6a2135896e4564",
        },
        {
          url: "/_next/static/GEbJDWtFswl_nuFRTpFs4/_ssgManifest.js",
          revision: "b6652df95db52feb4daf4eca35380933",
        },
        { url: "/_next/static/chunks/1237-aad556a3b26da625.js", revision: "GEbJDWtFswl_nuFRTpFs4" },
        { url: "/_next/static/chunks/1389-2e3a97440c1d8923.js", revision: "GEbJDWtFswl_nuFRTpFs4" },
        { url: "/_next/static/chunks/1594-e42369771629794a.js", revision: "GEbJDWtFswl_nuFRTpFs4" },
        { url: "/_next/static/chunks/2007-841bcdf8f279bbba.js", revision: "GEbJDWtFswl_nuFRTpFs4" },
        { url: "/_next/static/chunks/2117-d82ff673f47a2953.js", revision: "GEbJDWtFswl_nuFRTpFs4" },
        { url: "/_next/static/chunks/2156-60348c28a63e4feb.js", revision: "GEbJDWtFswl_nuFRTpFs4" },
        { url: "/_next/static/chunks/2168.1580b8c43116a47d.js", revision: "1580b8c43116a47d" },
        { url: "/_next/static/chunks/2347.745a5134064bb180.js", revision: "745a5134064bb180" },
        { url: "/_next/static/chunks/2901.3954cf942d0b7bd7.js", revision: "3954cf942d0b7bd7" },
        { url: "/_next/static/chunks/2957-6c251c341304c21c.js", revision: "GEbJDWtFswl_nuFRTpFs4" },
        { url: "/_next/static/chunks/2972-4531e1685a17362e.js", revision: "GEbJDWtFswl_nuFRTpFs4" },
        { url: "/_next/static/chunks/2990-b539e3ade918961c.js", revision: "GEbJDWtFswl_nuFRTpFs4" },
        { url: "/_next/static/chunks/3053-8f5f280ac936e352.js", revision: "GEbJDWtFswl_nuFRTpFs4" },
        { url: "/_next/static/chunks/3145-f92528dbae5d4465.js", revision: "GEbJDWtFswl_nuFRTpFs4" },
        { url: "/_next/static/chunks/3457.88311f0ebd3735c4.js", revision: "88311f0ebd3735c4" },
        { url: "/_next/static/chunks/3464-2c4660c15befa11f.js", revision: "GEbJDWtFswl_nuFRTpFs4" },
        { url: "/_next/static/chunks/3532-f9d2af7e95c9fea1.js", revision: "GEbJDWtFswl_nuFRTpFs4" },
        { url: "/_next/static/chunks/3587-7dc2c45294f3f24a.js", revision: "GEbJDWtFswl_nuFRTpFs4" },
        { url: "/_next/static/chunks/4019-3d48697bb6aa8bc6.js", revision: "GEbJDWtFswl_nuFRTpFs4" },
        { url: "/_next/static/chunks/4185-665addb370f726ab.js", revision: "GEbJDWtFswl_nuFRTpFs4" },
        { url: "/_next/static/chunks/4201.dbea31b9c3252985.js", revision: "dbea31b9c3252985" },
        { url: "/_next/static/chunks/430-4a3c9a965e21d77b.js", revision: "GEbJDWtFswl_nuFRTpFs4" },
        { url: "/_next/static/chunks/4937-a1962d5ef63ac124.js", revision: "GEbJDWtFswl_nuFRTpFs4" },
        { url: "/_next/static/chunks/5484-b13cd8b9123df478.js", revision: "GEbJDWtFswl_nuFRTpFs4" },
        { url: "/_next/static/chunks/5497-b01fd71dc5fcfe58.js", revision: "GEbJDWtFswl_nuFRTpFs4" },
        { url: "/_next/static/chunks/5560-b05b05269c70b875.js", revision: "GEbJDWtFswl_nuFRTpFs4" },
        { url: "/_next/static/chunks/5717-55745758b1de973e.js", revision: "GEbJDWtFswl_nuFRTpFs4" },
        { url: "/_next/static/chunks/5954.41e9f86609128506.js", revision: "41e9f86609128506" },
        { url: "/_next/static/chunks/6137-55e8654b1ee641b1.js", revision: "GEbJDWtFswl_nuFRTpFs4" },
        { url: "/_next/static/chunks/6287-9e876409ba87f8b1.js", revision: "GEbJDWtFswl_nuFRTpFs4" },
        { url: "/_next/static/chunks/7056-1c6decc61bfad8a1.js", revision: "GEbJDWtFswl_nuFRTpFs4" },
        { url: "/_next/static/chunks/7135-e10549592dfe0d26.js", revision: "GEbJDWtFswl_nuFRTpFs4" },
        { url: "/_next/static/chunks/7327-be3d87391ed1a5a7.js", revision: "GEbJDWtFswl_nuFRTpFs4" },
        { url: "/_next/static/chunks/7756-7e5c05bc8cfa793d.js", revision: "GEbJDWtFswl_nuFRTpFs4" },
        {
          url: "/_next/static/chunks/77a6265a-f6c72e67f5e46087.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        { url: "/_next/static/chunks/8412-3d4ec221bbbb04a6.js", revision: "GEbJDWtFswl_nuFRTpFs4" },
        { url: "/_next/static/chunks/8481-c97b45b951bc437e.js", revision: "GEbJDWtFswl_nuFRTpFs4" },
        { url: "/_next/static/chunks/8848-484b9db08ddaf93d.js", revision: "GEbJDWtFswl_nuFRTpFs4" },
        {
          url: "/_next/static/chunks/a4634e51-99c61b8e7d707a09.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/%5BbookSlug%5D/history/page-e92a2897c8af9916.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/%5BbookSlug%5D/journal/%5BpageType%5D/page-d1fdec38e124a676.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/%5BbookSlug%5D/page-65344d06981f3796.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/%5BbookSlug%5D/settings/page-b64cc96d06cf797d.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/(marketing)/pricing/page-4171ec31a0de9af0.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/_not-found/page-be973cb9cc544508.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/admin/analytics/loading-8e803edea04e163c.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/admin/analytics/page-71ef9fd45306cece.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/admin/assessment/page-5d009c086a6c3515.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/admin/audit/page-20f7c3d96730bf3e.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/admin/community/loading-5220e7d2f340a6d9.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/admin/community/page-1efa804054d45f47.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/admin/content/loading-1316ed01b9a92104.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/admin/content/page-5804e78e82865808.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/admin/error-c81ced9588f07aaa.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/admin/gamification/loading-15bd72496e0080dd.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/admin/gamification/page-504d32783d870855.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/admin/layout-23f3673aeeec24e9.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/admin/loading-3f95003ca5df232e.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/admin/page-92e1896b7cb2e285.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/admin/payments/loading-74ba9b6a24ae9573.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/admin/payments/page-787fc6e4784d8cd4.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/admin/settings/loading-de074ac1d82db4cc.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/admin/settings/page-4a06f27cb3d17692.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/admin/system/loading-44b7c4b26e6ff02a.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/admin/system/page-89f7211be40f3365.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/admin/users/loading-7e6d1461bf6bf53b.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/admin/users/page-3e4430d304c92685.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/admin/webinar/page-b856a93d773088bf.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/assessment/page-8f9aaacc9fe9e938.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/auth/reset-password/page-0e0f48f1bd460138.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/blog/%5Bslug%5D/page-b0041038a20d8a2e.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/blog/page-7b75200070e1b2ad.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/checkout/recovery/page-ecc55868ca7c8fe7.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/community/call/%5BroomId%5D/page-68633c10bd21fd3b.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/community/loading-39a97c453133d6f1.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/community/member/%5Bid%5D/page-f19dc1d5bd984206.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/community/page-a2dca812013a0404.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/community/post/%5Bid%5D/page-5975b6baf1ccbc49.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/courses/%5BcourseId%5D/edit/page-d9959ce5e6df5f64.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/courses/%5BcourseId%5D/page-b7184ee986ae3b46.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/courses/page-cf5af7cdd15aed5d.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/error-31fd07a6ff638b89.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/journal/page-2ef47378df124c20.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/layout-47b78c359490abcd.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/library/page-51c6365749f9b8a6.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/loading-84dc0209f713fdc2.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/login/page-ce7cbc75babdafdb.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/not-found-b413e0aea23ddda7.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/page-4b1b8a02385cce1a.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/payment/success/page-c83e9db72c95f97d.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/payment/upsell/page-bfce191f873e4c99.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/video/%5BroomId%5D/page-0120fca9f4da5f6f.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/webinar/live/%5Bslug%5D/layout-d0bd9fc44b5a3304.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/webinar/live/%5Bslug%5D/page-4a88b5ca951d2f62.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/webinar/page-9e9f23c960e2fa15.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/webinar/replay/%5Bslug%5D/page-72b70ff1c4ecd966.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/app/webinar/studio/%5BwebinarId%5D/page-894823ca877da0ae.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        { url: "/_next/static/chunks/e66da216.6f57bddb11e62fe3.js", revision: "6f57bddb11e62fe3" },
        {
          url: "/_next/static/chunks/fd9d1056-8da09c51c878d1b0.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/framework-08aa667e5202eed8.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        { url: "/_next/static/chunks/main-7fa83e7af288a653.js", revision: "GEbJDWtFswl_nuFRTpFs4" },
        {
          url: "/_next/static/chunks/main-app-65b540a0b61952f5.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/pages/_app-3c9ca398d360b709.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/pages/_error-cf5ca766ac8f493f.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        {
          url: "/_next/static/chunks/polyfills-42372ed130431b0a.js",
          revision: "846118c33b2c0e922d7b3a7676f81f6f",
        },
        {
          url: "/_next/static/chunks/webpack-ffc0631f39d8efa8.js",
          revision: "GEbJDWtFswl_nuFRTpFs4",
        },
        { url: "/_next/static/css/4c359c64ac064ed9.css", revision: "4c359c64ac064ed9" },
        { url: "/_next/static/css/bb7c23fff078804e.css", revision: "bb7c23fff078804e" },
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
    s.cleanupOutdatedCaches(),
    s.registerRoute(
      "/",
      new s.NetworkFirst({
        cacheName: "start-url",
        plugins: [
          {
            cacheWillUpdate: async ({ request: s, response: e, event: n, state: a }) =>
              e && "opaqueredirect" === e.type
                ? new Response(e.body, { status: 200, statusText: "OK", headers: e.headers })
                : e,
          },
        ],
      }),
      "GET"
    ),
    s.registerRoute(
      /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
      new s.CacheFirst({
        cacheName: "google-fonts",
        plugins: [new s.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 31536e3 })],
      }),
      "GET"
    ),
    s.registerRoute(
      /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      new s.StaleWhileRevalidate({
        cacheName: "static-font-assets",
        plugins: [new s.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 })],
      }),
      "GET"
    ),
    s.registerRoute(
      /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      new s.StaleWhileRevalidate({
        cacheName: "static-image-assets",
        plugins: [new s.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 })],
      }),
      "GET"
    ),
    s.registerRoute(
      /\/_next\/image\?url=.+$/i,
      new s.StaleWhileRevalidate({
        cacheName: "next-image",
        plugins: [new s.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 })],
      }),
      "GET"
    ),
    s.registerRoute(
      /\.(?:js)$/i,
      new s.StaleWhileRevalidate({
        cacheName: "static-js-assets",
        plugins: [new s.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 })],
      }),
      "GET"
    ),
    s.registerRoute(
      /\.(?:css|less)$/i,
      new s.StaleWhileRevalidate({
        cacheName: "static-style-assets",
        plugins: [new s.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 })],
      }),
      "GET"
    ),
    s.registerRoute(
      /\/_next\/data\/.+\/.+\.json$/i,
      new s.StaleWhileRevalidate({
        cacheName: "next-data",
        plugins: [new s.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 })],
      }),
      "GET"
    ),
    s.registerRoute(
      /\/api\/.*$/i,
      new s.NetworkFirst({
        cacheName: "apis",
        networkTimeoutSeconds: 10,
        plugins: [new s.ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 86400 })],
      }),
      "GET"
    ),
    s.registerRoute(
      /.*/i,
      new s.NetworkFirst({
        cacheName: "others",
        networkTimeoutSeconds: 10,
        plugins: [new s.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 })],
      }),
      "GET"
    ));
});
