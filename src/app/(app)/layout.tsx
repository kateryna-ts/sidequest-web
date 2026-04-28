'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const tabs = [
    { href: "/feed",    label: "quests", icon: "◎" },
    { href: "/compose", label: "post",   icon: "+" },
    { href: "/waves",   label: "waves",  icon: "〜" },
    { href: "/profile", label: "you",    icon: "○" },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1">{children}</div>

      <nav className="sticky bottom-0 border-t border-chalk bg-white/90 backdrop-blur dark:border-graphite dark:bg-obsidian/90">
        <div className="mx-auto flex max-w-2xl">
          {tabs.map(({ href, label, icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-1 flex-col items-center gap-1 py-3 transition ${
                  active
                    ? "text-sq-blue"
                    : "text-graphite hover:text-ink dark:text-chalk dark:hover:text-parchment"
                }`}
              >
                <span className="text-lg leading-none">{icon}</span>
                <span className="text-[10px] font-medium">{label}</span>
                {active && <span className="absolute bottom-0 h-0.5 w-8 rounded-full bg-sq-blue" />}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
