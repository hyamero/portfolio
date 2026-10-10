import { Arrow } from "@/components/icons";
import ScrollLink from "@/components/scroll-link";
import { Words } from "@/components/words";
import { ContactSky } from "@/components/sky/fallback";
import { siteConfig } from "@/lib/site";

const YEAR = new Date().getFullYear();

const LINKS = [
  { label: "Email", href: siteConfig.links.email, external: false },
  { label: "GitHub", href: siteConfig.links.github, external: true },
  { label: "LinkedIn", href: siteConfig.links.linkedin, external: true },
  { label: "Résumé", href: siteConfig.links.resume, external: true },
];

export default function Contact() {
  return (
    <section
      id="contact"
      data-sky-anchor="contact"
      aria-labelledby="contact-title"
      className="relative flex min-h-[640px] flex-[1_0_auto] flex-col overflow-hidden md:min-h-[820px]"
    >
      <ContactSky />
      <div
        aria-hidden="true"
        className="grid-lines absolute inset-0 z-0 bg-position-[calc(50%+32px)_100%] mask-[radial-gradient(ellipse_56%_78%_at_50%_100%,#000_0%,rgb(0_0_0/0.45)_45%,transparent_76%)]"
      />
      <div className="px-gutter relative z-1 mx-auto flex w-full max-w-[1440px] flex-[1_0_auto] flex-col items-center pt-[150px] pb-40 text-center md:pt-[196px]">
        {/* The copy alone, not the block stretched down to the horizon: the sky keeps quiet behind it. */}
        <div data-sky-text="contact" className="flex flex-col items-center">
          <h2
            id="contact-title"
            className="text-sm font-normal text-mute md:text-[15px]"
          >
            Contact
          </h2>
          <a
            data-catch-light
            data-sky-signal
            className="say mt-5 text-[clamp(2.75rem,6.4vw,5.75rem)] leading-[1.1] font-medium tracking-[-0.07em] md:mt-[26px]"
            href={siteConfig.links.email}
          >
            <Words text="Send a signal." />
          </a>
          <ul className="mt-[30px] flex flex-wrap justify-center gap-x-6 text-sm tracking-tight text-mute md:mt-11 md:gap-x-9 md:gap-y-1 md:text-[15px]">
            {LINKS.map((link) => (
              <li key={link.label}>
                <a
                  className="line-link"
                  data-catch-light
                  data-magnet
                  data-sky-signal
                  href={link.href}
                  {...(link.external && { target: "_blank", rel: "noopener noreferrer" })}
                >
                  {link.label} <Arrow dir="ne" size={13} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {/* Above the sky's front layer, so it sits on the ground (spec §3.4). */}
      <footer className="px-gutter relative z-40 mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-x-6 gap-y-2 pb-2.5 text-[13px] font-light tracking-tight text-mute md:pb-3.5 md:text-sm">
        <p>© {YEAR} Dale Bañares</p>
        <ScrollLink to="home" className="line-link" data-catch-light data-magnet>
          Back to top <Arrow dir="n" size={14} />
        </ScrollLink>
      </footer>
    </section>
  );
}
