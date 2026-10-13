import { describe, expect, test } from "bun:test";

import { siteConfig } from "./site";
import { jsonLd, structuredData } from "./structured-data";

const graph = structuredData()["@graph"];
const byType = (type: string) => graph.find((node) => node["@type"] === type)!;

describe("structuredData", () => {
  test("names the site, with the handle as its alternate name", () => {
    expect(byType("WebSite")).toMatchObject({
      url: siteConfig.url,
      name: siteConfig.name,
      alternateName: siteConfig.handle,
    });
  });
  test("makes the home page the profile of one person", () => {
    const person = byType("Person");
    expect(byType("ProfilePage")).toMatchObject({ url: siteConfig.url, mainEntity: { "@id": person["@id"] } });
    expect(byType("WebSite")).toMatchObject({ publisher: { "@id": person["@id"] } });
    expect(person).toMatchObject({ name: siteConfig.name, jobTitle: siteConfig.role, url: siteConfig.url });
  });
  test("links the person's public profiles, not the mailto", () => {
    const { sameAs } = byType("Person") as { sameAs: string[] };
    expect(sameAs).toEqual([siteConfig.links.github, siteConfig.links.linkedin]);
    expect(sameAs.every((url) => url.startsWith("https://"))).toBe(true);
  });
});

describe("jsonLd", () => {
  test("escapes < so a value can't close the script tag", () => {
    const out = jsonLd({ name: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("<");
    expect(JSON.parse(out)).toEqual({ name: "</script><script>alert(1)</script>" });
  });
});
