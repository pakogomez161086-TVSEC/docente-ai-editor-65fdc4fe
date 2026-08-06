import { cn } from "@/lib/utils";

/**
 * Marca DocentePRO. Cuando el usuario suba el logotipo oficial en PNG/SVG,
 * basta con sustituir el <svg> de DocenteMark por una <img> con el archivo.
 */
function DocenteMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="DocentePRO">
      <defs>
        <linearGradient id="dp-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--brand)" />
          <stop offset="100%" stopColor="var(--cyan-accent)" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="46" height="46" rx="13" fill="url(#dp-grad)" />
      <path
        d="M13 33V15h8.4c5.6 0 9.1 3.4 9.1 9s-3.5 9-9.1 9H13Zm5.2-4.4h3c2.8 0 4.4-1.7 4.4-4.6s-1.6-4.6-4.4-4.6h-3v9.2Z"
        fill="var(--brand-foreground)"
      />
      <circle cx="35.5" cy="17" r="3.2" fill="var(--amber-accent)" />
      <circle cx="35.5" cy="26" r="2.4" fill="var(--yellow-accent)" />
      <circle cx="35.5" cy="33" r="2" fill="var(--green-accent)" />
    </svg>
  );
}

/** Emblema Telesecundaria (marca acompañante). */
function TelesecundariaMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="Telesecundaria">
      <rect x="1" y="1" width="46" height="46" rx="13" fill="var(--brand-deep)" />
      <rect x="10" y="14" width="28" height="18" rx="4" fill="none" stroke="var(--cyan-accent)" strokeWidth="2.4" />
      <path d="M20 22.5v-4l6 3.5-6 3.5v-3Z" fill="var(--amber-accent)" />
      <path d="M18 36h12" stroke="var(--green-accent)" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M24 32v4" stroke="var(--green-accent)" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

type BrandLogoProps = {
  className?: string;
  showWordmark?: boolean;
  showTelesecundaria?: boolean;
  inverted?: boolean;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: { mark: "h-8 w-8", title: "text-base", sub: "text-[10px]" },
  md: { mark: "h-10 w-10", title: "text-lg", sub: "text-[11px]" },
  lg: { mark: "h-14 w-14", title: "text-2xl", sub: "text-xs" },
} as const;

export function BrandLogo({
  className,
  showWordmark = true,
  showTelesecundaria = true,
  inverted = false,
  size = "md",
}: BrandLogoProps) {
  const s = sizes[size];
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <DocenteMark className={cn(s.mark, "shrink-0 rounded-[13px]")} />
      {showWordmark ? (
        <div className="leading-tight">
          <p
            className={cn(
              "font-display font-extrabold tracking-tight",
              s.title,
              inverted ? "text-brand-foreground" : "text-foreground",
            )}
          >
            Docente<span className="text-gradient-brand">PRO</span>
          </p>
          <p
            className={cn(
              "font-semibold uppercase tracking-[0.22em]",
              s.sub,
              inverted ? "text-brand-foreground/70" : "text-muted-foreground",
            )}
          >
            Telesecundaria
          </p>
        </div>
      ) : null}
      {showTelesecundaria ? (
        <>
          <span className="mx-1 h-8 w-px bg-border" aria-hidden />
          <TelesecundariaMark className={cn(s.mark, "shrink-0 rounded-[13px]")} />
        </>
      ) : null}
    </div>
  );
}

export { DocenteMark, TelesecundariaMark };