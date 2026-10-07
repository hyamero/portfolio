const PATHS = {
  ne: ["M7 7h10v10", "M7 17 17 7"],
  s: ["M12 5v14", "m19 12-7 7-7-7"],
  n: ["m5 12 7-7 7 7", "M12 19V5"],
} as const;

type ArrowProps = {
  /** Also styles the hover nudge (see .line-link in globals.css). */
  dir: keyof typeof PATHS;
  size: number;
  strokeWidth?: number;
  className?: string;
};

export function Arrow({ dir, size, strokeWidth = 1.25, className }: ArrowProps) {
  return (
    <svg
      data-dir={dir}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {PATHS[dir].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
