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
        <SmokeBackground smokeColor={BLUE} bgColor="#e8d2a8" />
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

        {/* ── QUEST TYPE SHOWCASE ─────────────────────────────────────────── */}
        <section className="px-8 md:px-16 py-20 pb-32">
          <div className="max-w-6xl mx-auto flex flex-col items-center">
            <Reveal>
              <p className="text-xs uppercase tracking-[0.3em] mb-12 text-center" style={{ color: D }}>
                what are people doing?
              </p>
            </Reveal>
            
            <div className="flex flex-wrap justify-center gap-3 md:gap-4 max-w-4xl mx-auto">
              {[
                'Coffee Run', 'Farmers Market', 'Thrifting', 'Bookstore', 'IKEA Trip', 
                'Grocery Shop', 'Hardware Store', 'Plant Nursery', 'Wine Shop', 'Museum', 
                'Art Gallery', 'Cinema', 'Trivia Night', 'Gym', 'Yoga Class', 
                'Morning Run', 'Weekend Hike', 'Boba', 'Ice Cream', 'Lunch'
              ].map((type, i) => (
                <Reveal key={type} delay={i * 0.04}>
                  <div className="px-5 py-3 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-sm whitespace-nowrap hover:bg-white/10 transition cursor-default"
                    style={{ color: D }}>
                    {type}
                  </div>
                </Reveal>
              ))}
            </div>
            
            <Reveal delay={0.8} className="mt-12 text-center">
              <p className="text-sm italic font-serif" style={{ color: `${D}70` }}>
                ...and anywhere else you'd rather not go alone.
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

        {/* ── THE ENGINE (INVESTOR DEEP DIVE) ──────────────────────────────── */}
        <section className="px-8 md:px-16 py-32 md:py-48 bg-black/40 border-y border-white/5 relative overflow-hidden">
          {/* Subtle grid background for the technical section */}
          <div className="absolute inset-0 pointer-events-none opacity-20" 
               style={{ backgroundImage: 'linear-gradient(to right, #ffffff11 1px, transparent 1px), linear-gradient(to bottom, #ffffff11 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
               
          <div className="max-w-5xl mx-auto relative z-10">
            <Reveal>
              <p className="text-xs uppercase tracking-[0.3em] mb-8 text-emerald-400">
                under the hood
              </p>
            </Reveal>

            <Reveal delay={0.1}>
              <h2 className="font-serif italic leading-tight tracking-tight mb-16"
                style={{ fontSize: 'clamp(2.4rem,5vw,3.5rem)', color: D }}>
                The architecture of<br />implicit connection.
              </h2>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Reveal delay={0.2}>
                <div className="p-8 rounded-2xl bg-white/5 border border-white/10 h-full backdrop-blur-md hover:bg-white/10 transition duration-500">
                  <div className="w-10 h-10 mb-6 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </div>
                  <h3 className="text-lg font-medium mb-3 text-white">Local-First Extraction</h3>
                  <p className="text-sm leading-relaxed text-white/70">
                    Instead of relying on biased self-reporting, our background engine uses Accessibility APIs to privately index Instagram activity directly on-device. Raw data never touches our servers.
                  </p>
                </div>
              </Reveal>

              <Reveal delay={0.3}>
                <div className="p-8 rounded-2xl bg-white/5 border border-white/10 h-full backdrop-blur-md hover:bg-white/10 transition duration-500">
                  <div className="w-10 h-10 mb-6 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                  </div>
                  <h3 className="text-lg font-medium mb-3 text-white">LLM Classification Pipeline</h3>
                  <p className="text-sm leading-relaxed text-white/70">
                    A lightweight, edge-optimized classification model processes raw content into 74 dynamic sub-categories, outputting a highly dense taste vector representing the user's authentic affinities.
                  </p>
                </div>
              </Reveal>

              <Reveal delay={0.4}>
                <div className="p-8 rounded-2xl bg-white/5 border border-white/10 h-full backdrop-blur-md hover:bg-white/10 transition duration-500">
                  <div className="w-10 h-10 mb-6 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  </div>
                  <h3 className="text-lg font-medium mb-3 text-white">HNSW Vector Matching</h3>
                  <p className="text-sm leading-relaxed text-white/70">
                    We use pgvector to perform ultra-low latency cosine similarity searches across geographical bounds. This guarantees matching is determined by shared chemistry, not just proximity.
                  </p>
                </div>
              </Reveal>
            </div>
            
            <Reveal delay={0.5} className="mt-16 border border-white/10 bg-white/5 rounded-xl p-6 backdrop-blur-sm">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h4 className="text-sm font-medium text-white mb-1">High-Intent Organic Growth</h4>
                  <p className="text-xs text-white/60">No cold starts. Users invite their own micro-communities to fill the map.</p>
                </div>
                <div className="flex gap-4 text-xs font-mono text-emerald-400">
                  <div className="flex flex-col items-center"><span className="text-lg font-sans">0</span><span>CAC</span></div>
                  <div className="w-px bg-white/10 h-8" />
                  <div className="flex flex-col items-center"><span className="text-lg font-sans">14%</span><span>W1 RET</span></div>
                  <div className="w-px bg-white/10 h-8" />
                  <div className="flex flex-col items-center"><span className="text-lg font-sans">4.2</span><span>K-FACTOR</span></div>
                </div>
              </div>
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
