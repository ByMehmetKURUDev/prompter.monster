"use client";

import { Activity, BarChart3, BookOpenCheck, CreditCard, LayoutDashboard, Link2, Megaphone, Plug, Settings, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/cx";

const ITEMS = [
  { href: "/admin", label: "Genel bakış", Icon: LayoutDashboard },
  { href: "/admin/users", label: "Kullanıcılar", Icon: Users },
  { href: "/admin/subscriptions", label: "Abonelikler", Icon: CreditCard },
  { href: "/admin/usage", label: "Kullanım", Icon: BarChart3 },
  { href: "/admin/channels", label: "Kanallar", Icon: Megaphone },
  { href: "/admin/api", label: "API ve MCP", Icon: Plug },
  { href: "/admin/catalog", label: "Katalog", Icon: BookOpenCheck },
  { href: "/admin/shares", label: "Paylaşımlar", Icon: Link2 },
  { href: "/admin/settings", label: "Ayarlar", Icon: Settings },
  { href: "/admin/system", label: "Sistem", Icon: Activity },
];

export function AdminNav({ horizontal = false }: { horizontal?: boolean }) {
  const path = usePathname();
  return (
    <nav className={cx(horizontal ? "flex gap-1 min-w-max" : "space-y-0.5")} aria-label="Admin">
      {ITEMS.map(({ href, label, Icon }) => {
        const active = href === "/admin" ? path === "/admin" : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cx(
              "flex items-center gap-2.5 px-3 h-9 rounded-lg text-[13px] whitespace-nowrap transition",
              active ? "bg-ink-800 text-white border border-ink-600" : "text-zinc-400 hover:text-white hover:bg-ink-900 border border-transparent",
            )}
          >
            <Icon className={cx("w-4 h-4", active ? "text-lime" : "text-zinc-500")} aria-hidden /> {label}
          </Link>
        );
      })}
    </nav>
  );
}
