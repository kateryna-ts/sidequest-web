'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { SmokeBackground } from '@/components/ui/spooky-smoke-animation'
import { TextEffect } from '@/components/ui/text-effect'
import FestivityHero from '@/components/ui/festivity-hero'
import { supabase } from '@/lib/supabase'

const D    = '#ffffff'
const BLUE = '#0099ff'
const VEIL = 'rgba(200,169,122,0.25)'
const E    = [0.22, 1, 0.36, 1] as const

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

// ── Fade-up reveal ────────────────────────────────────────────────────────────
function Reveal({ children, className, delay = 0 }: {
  children: React.ReactNode; className?: string; delay?: number
}) {
  return (
    <motion.div className={className}
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.65, delay, ease: E }}>
      {children}
    </motion.div>
  )
}

// ── Expanding rule ────────────────────────────────────────────────────────────
function Rule() {
  return (
    <motion.div style={{ height: 1, background: `${D}20` }}
      initial={{ scaleX: 0, originX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1.0, ease: E }} />
  )
}

// ── Live count ────────────────────────────────────────────────────────────────
function useLiveCount() {
  const [count, setCount] = useState<number | null>(null)
  useEffect(() => {
    supabase.from('quests').select('id', { count: 'exact', head: true })
      .eq('status', 'active').then(({ count: c }) => setCount(c ?? 0))
  }, [])
  return count
}

// ── Taste fingerprint dimensions ──────────────────────────────────────────────
const DIMS = [
  {
    label: 'taste & food',
    n: '01',
    body: 'What you eat, drink, and seek out says more than any bio.',
    tags: ['natural wine', 'farmers market', 'dim sum', 'fermentation', 'olive oil'],
    color: '#3b82f6',
  },
  {
    label: 'culture',
    n: '02',
    body: 'The art, music, and media that actually move you.',
    tags: ['vinyl records', 'indie folk', 'literary fiction', 'slow cinema', 'zines'],
    color: '#8b5cf6',
  },
  {
    label: 'aesthetic',
    n: '03',
    body: 'How you see the world and the things you surround yourself with.',
    tags: ['film photography', 'thrift stores', 'analog life', 'brutalism', 'dark humor'],
    color: '#a855f7',
  },
  {
    label: 'social vibe',
    n: '04',
    body: 'Your rhythm — when you show up, how you recharge, what you enjoy doing.',
    tags: ['slow mornings', 'early riser', 'low-key plans', 'solo walks', 'maker fairs'],
    color: '#ec4899',
  },
]

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const count = useLiveCount()
  const [ctasVisible, setCtasVisible] = useState(false)

  const steps = [
    { n: '01', title: 'Drop a pin',  body: "Say where you're going and when. Farmers market Saturday morning? IKEA run after work? Post it in 15 seconds." },
    { n: '02', title: 'Vibe check',  body: "Your 74-point Taste Fingerprint finds someone who matches your chemistry — not just your coordinates." },
    { n: '03', title: 'Show up',     body: "Our AI writes a personalised icebreaker so you don't have to. You just share the errand." },
  ]

  return (
    <>
      {/* Fixed smoke — entire page background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <SmokeBackground smokeColor="#6366f1" bgColor="#0a0a0a" />
      </div>

      <CursorGlow />

      <main className="relative z-[2]" style={{ color: D }}>

        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <section className="relative min-h-screen flex flex-col">
          <div className="absolute inset-0 z-0">
            <FestivityHero />
          </div>

          <header className="relative z-20 flex items-center justify-between px-8 md:px-14 pt-10">
            <span className="font-serif italic text-xl" style={{ color: D }}>side quest</span>
            <nav className="flex items-center gap-6 md:gap-8">
              <Link href="/sign-in"
                className="text-sm uppercase tracking-[0.16em] hover:opacity-60 transition"
                style={{ color: `${D}cc` }}>
                sign in
              </Link>
              <Link href="/sign-up"
                className="hidden md:block text-sm uppercase tracking-[0.16em] border rounded-full px-6 py-2.5 hover:opacity-70 transition"
                style={{ color: D, borderColor: `${D}50`, background: `${D}0a` }}>
                post a quest
              </Link>
            </nav>
          </header>

          <div className="relative z-20 flex-1 flex flex-col items-center justify-center gap-10 select-none">
            <TextEffect
              per="char"
              preset="scale"
              delay={3.2}
              onAnimationComplete={() => setCtasVisible(true)}
              className="font-serif italic leading-none text-center"
              style={{ fontSize: 'clamp(5.5rem,17vw,13rem)', color: D, letterSpacing: '-0.02em' } as React.CSSProperties}
            >
              side quest
            </TextEffect>

            <motion.div
              className="flex flex-col items-center gap-5 w-full max-w-xs px-6"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: ctasVisible ? 1 : 0, y: ctasVisible ? 0 : 12 }}
              transition={{ duration: 0.7, ease: E }}>
              <Link href="/sign-up"
                className="w-full text-center py-4 rounded-full text-sm font-medium uppercase tracking-[0.16em] hover:opacity-80 transition"
                style={{ border: `1px solid ${D}55`, color: D, background: `${D}0e` }}>
                post a quest
              </Link>
              <Link href="/sign-up"
                className="text-sm uppercase tracking-[0.16em] hover:opacity-70 transition"
                style={{ color: `${D}90` }}>
                browse quests →
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ── STATEMENT ────────────────────────────────────────────────────── */}
        <section className="px-8 md:px-16 py-40 md:py-56">
          <div className="max-w-5xl mx-auto">
            <Reveal>
              <h2 className="font-serif italic leading-[1.06] tracking-tight"
                style={{ fontSize: 'clamp(3.5rem,8vw,7rem)', color: D }}>
                Stop doing<br />errands alone.
              </h2>
            </Reveal>
            <Reveal delay={0.3} className="mt-10 max-w-xl">
              <p style={{ color: D, fontSize: '18px', lineHeight: '1.8', opacity: 0.78 }}>
                Dating apps are high-stakes. Meetups are awkward. Side Quest turns your
                ordinary errands — grabbing coffee, hitting IKEA, browsing a bookstore —
                into low-pressure hangouts with someone who actually matches your vibe.
              </p>
            </Reveal>
            <Reveal delay={0.5} className="mt-10">
              <p className="text-sm uppercase tracking-[0.26em]" style={{ color: `${D}75` }}>
                no followers &nbsp;·&nbsp; no feed &nbsp;·&nbsp; just show up
              </p>
            </Reveal>
          </div>
        </section>

        {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
        <section className="px-8 md:px-16 pb-44">
          <div className="max-w-5xl mx-auto">
            <Reveal>
              <p className="text-xs uppercase tracking-[0.3em] mb-20" style={{ color: D }}>
                how it works
              </p>
            </Reveal>
            {steps.map(({ n, title, body }, i) => (
              <div key={n}>
                <Rule />
                <Reveal delay={i * 0.06}>
                  <div className="grid py-14 md:py-16"
                    style={{ gridTemplateColumns: 'clamp(48px,8vw,96px) 1fr', gap: 'clamp(20px,4vw,56px)' }}>
                    <span className="font-serif italic leading-none pt-1 select-none"
                      style={{ fontSize: 'clamp(2.5rem,5vw,4rem)', color: `${D}90` }}>
                      {n}
                    </span>
                    <div className="flex-1 max-w-md">
                      <h3 className="text-2xl md:text-3xl font-medium mb-5" style={{ color: D }}>
                        {title}
                      </h3>
                      <p className="text-base md:text-lg leading-relaxed" style={{ color: D, opacity: 0.9 }}>
                        {body}
                      </p>
                    </div>
                  </div>
                </Reveal>
              </div>
            ))}
            <Rule />
          </div>
        </section>

        {/* ── TASTE FINGERPRINT ────────────────────────────────────────────── */}
        <section className="px-8 md:px-16 py-36 md:py-52">
          <div className="max-w-5xl mx-auto">
            <Reveal>
              <p className="text-xs uppercase tracking-[0.3em] mb-20" style={{ color: D }}>
                the secret sauce
              </p>
            </Reveal>

            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-20">
              <Reveal>
                <h2 className="font-serif italic leading-tight tracking-tight"
                  style={{ fontSize: 'clamp(2.4rem,5vw,4rem)', color: D }}>
                  Not just nearby.<br />Actually compatible.
                </h2>
              </Reveal>
              <Reveal delay={0.2} className="max-w-sm">
                <p style={{ color: D, fontSize: '17px', lineHeight: '1.85', opacity: 0.82 }}>
                  We build a 74-point Taste Fingerprint from four dimensions of who you are —
                  so your match is someone who actually gets your vibe, not just someone close by.
                </p>
              </Reveal>
            </div>

            {/* 4-dimension grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {DIMS.map(({ label, n, body, tags, color }, i) => (
                <Reveal key={label} delay={i * 0.08}>
                  <div className="p-8 md:p-10 rounded-2xl h-full"
                    style={{
                      background: 'rgba(4,10,28,0.55)',
                      border: `1px solid rgba(255,255,255,0.10)`,
                    }}>
                    <div className="flex items-baseline gap-3 mb-4">
                      <span className="font-serif italic text-lg"
                        style={{ color: `${D}35` }}>{n}</span>
                      <span className="text-xs uppercase tracking-[0.22em] font-semibold"
                        style={{ color }}>{label}</span>
                    </div>
                    <p className="text-sm leading-relaxed mb-6"
                      style={{ color: D, opacity: 0.75 }}>{body}</p>
                    <div className="flex flex-wrap gap-2">
                      {tags.map(tag => (
                        <span key={tag}
                          className="text-[11px] px-3 py-1 rounded-full border whitespace-nowrap"
                          style={{ color, borderColor: color, background: `${color}20` }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.3} className="mt-8 flex justify-end">
              <p className="text-xs uppercase tracking-[0.26em]"
                style={{ color: `${D}40` }}>
                74 signals &nbsp;·&nbsp; 4 dimensions &nbsp;·&nbsp; one match
              </p>
            </Reveal>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────────── */}
        <section className="px-8 md:px-16 py-44 md:py-56 text-center">
          <div className="max-w-2xl mx-auto flex flex-col items-center gap-12">
            <Reveal>
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm uppercase tracking-[0.2em]" style={{ color: `${D}85` }}>
                  {count === null ? '—'
                    : count === 0 ? 'be the first to post near you'
                    : `${count} quest${count === 1 ? '' : 's'} live near you`}
                </span>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <h2 className="font-serif italic leading-tight tracking-tight"
                style={{ fontSize: 'clamp(3rem,7vw,5.5rem)', color: D }}>
                Ready for your<br />next quest?
              </h2>
            </Reveal>

            <Reveal delay={0.25} className="flex flex-col items-center gap-5 w-full max-w-xs">
              <Link href="/sign-up"
                className="w-full text-center py-4 rounded-full text-sm font-medium uppercase tracking-[0.18em] hover:opacity-80 transition"
                style={{ border: `1px solid ${D}55`, color: D, background: `${D}0e` }}>
                post a quest
              </Link>
              <Link href="/sign-in"
                className="text-sm uppercase tracking-[0.18em] hover:opacity-70 transition"
                style={{ color: `${D}70` }}>
                sign in
              </Link>
            </Reveal>
          </div>
        </section>

        {/* ── FOOTER ───────────────────────────────────────────────────────── */}
        <footer className="px-8 md:px-16 pt-0 pb-16">
          <div className="max-w-5xl mx-auto">

            {/* Same expanding rule used through the page */}
            <motion.div style={{ height: 1, background: `${D}18` }}
              initial={{ scaleX: 0, originX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: E }} />

            {/* Main footer body */}
            <div className="flex flex-col md:flex-row md:justify-between gap-16 pt-16 pb-16">

              {/* Brand column */}
              <div className="max-w-[260px]">
                <span className="font-serif italic text-2xl" style={{ color: D }}>side quest</span>
                <p className="mt-4 text-sm leading-relaxed" style={{ color: `${D}55` }}>
                  Turn your ordinary errands into low-pressure hangouts with someone
                  who actually matches your vibe.
                </p>
                <div className="flex items-center gap-2 mt-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] uppercase tracking-[0.2em]" style={{ color: `${D}45` }}>
                    live in your city
                  </span>
                </div>
              </div>

              {/* Link columns */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-10 md:gap-20">
                <div className="flex flex-col gap-5">
                  <span className="text-[10px] uppercase tracking-[0.32em]" style={{ color: `${D}35` }}>explore</span>
                  <Link href="/sign-up"
                    className="text-sm hover:opacity-60 transition"
                    style={{ color: `${D}70` }}>post a quest</Link>
                  <Link href="/sign-up"
                    className="text-sm hover:opacity-60 transition"
                    style={{ color: `${D}70` }}>browse quests</Link>
                  <Link href="/sign-in"
                    className="text-sm hover:opacity-60 transition"
                    style={{ color: `${D}70` }}>sign in</Link>
                </div>

                <div className="flex flex-col gap-5">
                  <span className="text-[10px] uppercase tracking-[0.32em]" style={{ color: `${D}35` }}>company</span>
                  <a href="mailto:hi@sidequest.app"
                    className="text-sm hover:opacity-60 transition"
                    style={{ color: `${D}70` }}>contact us</a>
                  <a href="mailto:press@sidequest.app"
                    className="text-sm hover:opacity-60 transition"
                    style={{ color: `${D}70` }}>press</a>
                </div>

                <div className="flex flex-col gap-5">
                  <span className="text-[10px] uppercase tracking-[0.32em]" style={{ color: `${D}35` }}>legal</span>
                  <Link href="/privacy"
                    className="text-sm hover:opacity-60 transition"
                    style={{ color: `${D}70` }}>privacy policy</Link>
                  <Link href="/terms"
                    className="text-sm hover:opacity-60 transition"
                    style={{ color: `${D}70` }}>terms of use</Link>
                </div>
              </div>
            </div>

            {/* Bottom bar */}
            <motion.div style={{ height: 1, background: `${D}12` }}
              initial={{ scaleX: 0, originX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: E }} />

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-8">
              <span className="text-[11px] uppercase tracking-[0.22em]" style={{ color: `${D}30` }}>
                © 2025 side quest
              </span>
              <span className="text-[11px] uppercase tracking-[0.22em]" style={{ color: `${D}30` }}>
                no followers &nbsp;·&nbsp; no feed &nbsp;·&nbsp; just show up
              </span>
            </div>
          </div>
        </footer>

      </main>
    </>
  )
}
