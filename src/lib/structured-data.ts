import { siteConfig } from "@/lib/site";

const person = `${siteConfig.url}/#person`;

/** The home page's JSON-LD: the site, so search results can show its name, and the person it's the profile of. */
export function structuredData() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteConfig.url}/#website`,
        url: siteConfig.url,
        name: siteConfig.name,
        alternateName: siteConfig.handle,
        publisher: { "@id": person },
      },
      {
        "@type": "ProfilePage",
        "@id": `${siteConfig.url}/#profile`,
        url: siteConfig.url,
        mainEntity: { "@id": person },
      },
      {
        "@type": "Person",
        "@id": person,
        name: siteConfig.name,
        alternateName: siteConfig.handle,
        url: siteConfig.url,
        jobTitle: siteConfig.role,
        description: siteConfig.description,
        sameAs: [siteConfig.links.github, siteConfig.links.linkedin],
      },
    ],
  };
}

/** JSON for an inline script, with `<` escaped so no value can close the tag. */
export function jsonLd(data: object) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
