import type { MetadataRoute } from "next";
import { projects } from "@/lib/projects";

const BASE_URL = "https://dale.omsimos.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE_URL,
      changeFrequency: "monthly",
      priority: 1,
    },
    ...projects.map((project) => ({
      url: `${BASE_URL}/project/${project.projectTitle}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
