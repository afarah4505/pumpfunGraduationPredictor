import { cn } from "@/lib/utils";

type ScoreRingProps = {
  score: number | null;
  label?: string;
  className?: string;
};

export function ScoreRing({ score, label = "Graduation Score", className }: ScoreRingProps) {
  const safeScore = Math.max(0, Math.min(100, score ?? 0));
  const degrees = (safeScore / 100) * 360;

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div
        className="relative grid h-28 w-28 place-items-center rounded-full"
        style={{
          background: `conic-gradient(var(--color-accent-bull) ${degrees}deg, rgba(107, 129, 168, 0.24) ${degrees}deg)`,
        }}
      >
        <div className="grid h-[84%] w-[84%] place-items-center rounded-full border border-border/70 bg-background-panel">
          <p className="text-2xl font-semibold text-foreground">{score === null ? "--" : `${Math.round(score)}`}</p>
        </div>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-muted">{label}</p>
        <p className="text-sm text-muted">0-100 probability model</p>
      </div>
    </div>
  );
}
