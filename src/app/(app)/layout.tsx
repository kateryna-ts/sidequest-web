'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { SmokeBackground } from "@/components/ui/spooky-smoke-animation"

const D    = '#ffffff'
const BLUE = '#0099ff'

// ── Cursor glow ───────────────────────────────────────────────────────────────
function CursorGlow() {
  const [p, setP] = useState({ x: -999, y: -999 })
  const [vis, setVis] = useState(false)
  useEffect(() => {
    const fn = (e: MouseEvent) => { setP({ x: e.clientX, y: e.clientY }); setVis(true) }
    window.addEventListener('mousemove', fn)
    return () => window.removeEventListener('mousemove', fn)
  }, [])
  if (!vis) return null
  return (
    <div className="pointer-events-none fixed inset-0 z-[300]"
      style={{ background: `radial-gradient(320px at ${p.x}px ${p.y}px, rgba(37,99,235,0.10), transparent 65%)` }} />
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const tabs = [
    { href: "/feed",    label: "quests", icon: "◎" },
    { href: "/compose", label: "post",   icon: "+" },
    { href: "/waves",   label: "waves",  icon: "〜" },
    { href: "/profile", label: "you",    icon: "○" },
  ]

  return (
    <>
      {/* Fixed smoke — entire page background */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[#e8d2a8] dark:bg-[#040a1c]">
        <SmokeBackground smokeColor={BLUE} bgColor="#e8d2a8" />
        {/* Dimming overlay to make text more readable against the smoke */}
        <div className="absolute inset-0 bg-black/70" />
      </div>

      <CursorGlow />

      <div className="relative z-[2] flex flex-col min-h-screen text-white">
        <div className="flex-1">{children}</div>

        <nav className="sticky bottom-0 border-t border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="mx-auto flex max-w-2xl">
            {tabs.map(({ href, label, icon }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative flex flex-1 flex-col items-center gap-1 py-4 transition ${
                    active
                      ? "text-white"
                      : "text-white/40 hover:text-white/80"
                  }`}
                >
                  <span className="text-xl leading-none font-serif">{icon}</span>
                  <span className="text-[9px] font-medium uppercase tracking-[0.2em]">{label}</span>
                  {active && <span className="absolute bottom-0 h-0.5 w-8 rounded-full bg-white/80" />}
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </>
  )
}
