import { starMapSvg } from "@/lib/star-field";

export const dynamic = "force-static";

/** The CSS sky's star map (sky polish spec §7.2), built from the live sky's own star hash at build time. */
export function GET() {
  return new Response(starMapSvg(2560, 1600), { headers: { "Content-Type": "image/svg+xml" } });
}
