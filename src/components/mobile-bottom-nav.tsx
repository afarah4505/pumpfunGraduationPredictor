"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Flame, Radar, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Home", icon: Flame },
  { href: "/dashboard", label: "Dashboard", icon: Radar },
  { href: "/trending", label: "Trending", icon: BarChart3 },
  { href: "/dashboard#watchlist", label: "Watchlist", icon: Star },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 rounded-2xl border border-border/60 bg-card/90 p-2 shadow-soft backdrop-blur-xl md:hidden">
      <ul className="grid grid-cols-4 gap-1">
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href.includes("#") && pathname === "/dashboard");
          const Icon = item.icon;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center rounded-xl px-2 py-2 text-[11px] font-medium text-muted transition",
                  isActive && "bg-secondary text-foreground",
                )}
              >
                <Icon className="mb-1 h-4 w-4" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
