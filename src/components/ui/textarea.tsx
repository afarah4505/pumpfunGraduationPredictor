import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full rounded-xl border border-border bg-background-panel px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:ring-2 focus:ring-primary/30",
        className,
      )}
      {...props}
    />
  );
}