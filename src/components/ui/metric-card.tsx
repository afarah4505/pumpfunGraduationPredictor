import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  title: string;
  value: string;
  icon: ReactNode;
  tone?: "neutral" | "bull" | "risk";
  className?: string;
};

export function MetricCard({ title, value, icon, tone = "neutral", className }: MetricCardProps) {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden p-4 transition duration-300 hover:-translate-y-0.5",
        tone === "bull" && "before:absolute before:inset-0 before:bg-gradient-to-br before:from-[#173426]/40 before:to-transparent before:content-['']",
        tone === "risk" && "before:absolute before:inset-0 before:bg-gradient-to-br before:from-[#3d1d2a]/35 before:to-transparent before:content-['']",
        className,
      )}
    >
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted">{title}</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
        </div>
        <div className="rounded-xl border border-border/70 bg-background-soft p-2 text-muted transition group-hover:text-foreground">{icon}</div>
      </div>
    </Card>
  );
}
