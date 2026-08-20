"use client";

const navProjects = ["omsimos", "umamin", "foliage"];
const navItems = ["tools", "design", "contact"];

/**
 * Renders the word twice (base + absolutely positioned clone) so the CSS
 * letter-flip hover effect in globals.css can rotate them independently.
 */
function FlipText({ word }: { word: string }) {
  // Letters must be direct children of the div: the flip CSS transforms every
  // span it finds, so a wrapper element would get rotated along with them.
  const letters = (word.charAt(0).toUpperCase() + word.slice(1)).split("");

  return (
    <>
      {[false, true].map((isClone) => (
        <div
          key={isClone ? "clone" : "base"}
          style={
            isClone ? { position: "absolute", left: 0, top: 0 } : undefined
          }
          className="col-start-2 row-start-2 flex font-light tracking-tighter"
        >
          {letters.map((letter, idx) => (
            <span key={idx} style={{ "--index": idx } as React.CSSProperties}>
              {letter}
            </span>
          ))}
        </div>
      ))}
    </>
  );
}

export const NavMenu = ({
  scrollTo,
}: {
  scrollTo: (scrollElement: string, offsetY: number) => void;
}) => {
  return (
    <div className="menu fixed top-0 left-0 z-40 grid h-screen w-screen place-items-center justify-center space-y-1 rounded-lg border-b bg-neutral-950/95 text-secondary-foreground [clipPath:polygon(0%_0%,_100%_0%,_100%_0%,_0%_0%)]">
      <div className="flex flex-col gap-14 sm:flex-row sm:gap-28">
        <div className="flex flex-col items-start gap-3 md:gap-5">
          <button
            onClick={() => scrollTo("home", 0)}
            type="button"
            className="menu-item-title cursor-pointer text-left text-xs font-medium text-muted-foreground uppercase opacity-0"
          >
            Home
          </button>
          {navItems.map((item) => (
            <button
              type="button"
              key={item}
              className="menu-item text-4xl font-light tracking-tighter opacity-0 md:text-5xl"
              onClick={() => scrollTo(item, 150)}
            >
              <FlipText word={item} />
            </button>
          ))}
        </div>

        <div className="flex flex-col items-start gap-3 md:gap-5">
          <button
            onClick={() => scrollTo("omsimos", 0)}
            type="button"
            className="menu-item-title cursor-pointer text-left text-xs font-medium text-muted-foreground uppercase opacity-0"
          >
            Projects
          </button>
          {navProjects.map((item) => (
            <button
              type="button"
              key={item}
              className="menu-item text-4xl font-light tracking-tighter opacity-0 md:text-5xl"
              onClick={() => scrollTo(item, 0)}
            >
              <FlipText word={item} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
