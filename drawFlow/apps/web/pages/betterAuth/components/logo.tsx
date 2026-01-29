export function DrawFlowLogo() {
  return (
    <div className="flex items-center gap-2.5">
      {/* Logo icon - stylized pencil/flow mark */}
      <div className="relative w-9 h-9">
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Flowing line */}
          <path
            d="M8 32C12 28 16 20 20 20C24 20 24 28 28 28C32 28 34 24 36 20"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="text-primary"
          />
          {/* Pencil tip */}
          <path
            d="M4 36L8 32L12 36L8 38L4 36Z"
            fill="currentColor"
            className="text-primary"
          />
          {/* Dot accent */}
          <circle
            cx="32"
            cy="12"
            r="3"
            fill="currentColor"
            className="text-primary/60"
          />
        </svg>
      </div>

      {/* Wordmark */}
      <span className="text-xl font-semibold tracking-tight text-foreground">
        DrawFlow
      </span>
    </div>
  );
}
