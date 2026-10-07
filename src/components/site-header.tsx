import { Arrow } from "@/components/icons";
import ScrollLink from "@/components/scroll-link";
import { siteConfig } from "@/lib/site";

const NAV_LINK = "inline-flex min-h-11 items-center transition-colors duration-300 hover:text-white";

export default function SiteHeader() {
  return (
    <header className="header-fade pointer-events-none fixed inset-x-0 top-0 z-50">
      <div className="px-gutter mx-auto flex max-w-[1440px] items-center justify-between gap-3 py-3.5 md:gap-6 md:pt-[18px] md:pb-[30px]">
        <ScrollLink
          to="home"
          className="pointer-events-auto inline-flex min-h-11 items-center gap-2.5 text-base tracking-tighter md:gap-3 md:text-lg"
        >
          <span aria-hidden="true" className="orb-dot size-[13px] rounded-full" />
          hyamero
        </ScrollLink>
        <nav
          aria-label="Primary"
          className="pointer-events-auto flex items-center gap-[18px] text-sm tracking-tight text-mute md:gap-[clamp(18px,3vw,40px)] md:text-[15px]"
        >
          <ScrollLink to="work" className={NAV_LINK}>
            Work
          </ScrollLink>
          <ScrollLink to="contact" className={NAV_LINK}>
            Contact
          </ScrollLink>
          <a
            href={siteConfig.links.resume}
            target="_blank"
            rel="noopener noreferrer"
            className={`${NAV_LINK} gap-1.5`}
          >
            Résumé <Arrow dir="ne" size={13} strokeWidth={1.5} />
          </a>
        </nav>
      </div>
    </header>
  );
}
