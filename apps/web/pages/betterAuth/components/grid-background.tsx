export function GridBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Subtle hand-drawn style grid */}
      <svg
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              className="text-foreground/[0.04]"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Subtle decorative elements */}
      <svg
        className="absolute top-20 left-10 w-16 h-16 text-foreground/[0.03]"
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="50" cy="50" r="40" strokeDasharray="5 5" />
      </svg>

      <svg
        className="absolute bottom-32 right-20 w-24 h-24 text-foreground/[0.03]"
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect
          x="10"
          y="10"
          width="80"
          height="80"
          rx="5"
          strokeDasharray="8 4"
        />
      </svg>

      <svg
        className="absolute top-1/3 right-1/4 w-12 h-12 text-foreground/[0.03]"
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <polygon points="50,10 90,90 10,90" strokeDasharray="6 3" />
      </svg>
    </div>
  );
}
