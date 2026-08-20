import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://dale.omsimos.com/sitemap.xml",
    host: "https://dale.omsimos.com",
  };
}
