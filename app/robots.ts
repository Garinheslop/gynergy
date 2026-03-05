import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/webinar"],
        disallow: ["/api/", "/admin/", "/webinar/studio/", "/webinar/live/"],
      },
    ],
    sitemap: "https://www.gynergy.app/sitemap.xml",
  };
}
