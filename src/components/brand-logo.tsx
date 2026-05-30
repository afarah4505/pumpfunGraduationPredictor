import { cn } from "@/lib/utils";

type BrandLogoProps = {
  compact?: boolean;
  className?: string;
};

export function BrandLogo({ compact = false, className }: BrandLogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <svg
        width="30"
        height="30"
        viewBox="0 0 30 30"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect x="1" y="1" width="28" height="28" rx="9" className="fill-[#0b1222] stroke-[#30415f]" />
        <path d="M7.5 20.5L12.2 15.8L15.4 19L22.5 11.9" stroke="#2CF5A0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="22.5" cy="11.9" r="2.2" fill="#2CF5A0" />
      </svg>
      {!compact && (
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-[0.08em] text-foreground">PumpIQ</p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted">Graduation Intelligence</p>
        </div>
      )}
    </div>
  );
}
