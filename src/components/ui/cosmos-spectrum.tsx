"use client"

import { useEffect, useRef } from "react"

declare global {
  interface Window {
    gsap: any
    ScrollTrigger: any
  }
}

interface CosmicSpectrumProps {
  color?:
    | "original"
    | "blue-pink"
    | "blue-orange"
    | "sunset"
    | "purple"
    | "monochrome"
    | "pink-purple"
    | "blue-black"
    | "beige-black"
  blur?: boolean
  title?: string
  subtitle?: string
}

const colorThemes: Record<string, string[]> = {
  original:     ["#340B05", "#0358F7", "#5092C7", "#E1ECFE", "#FFD400", "#FA3D1D", "#FD02F5", "#FFC0FD"],
  "blue-pink":  ["#1E3A8A", "#3B82F6", "#A855F7", "#EC4899", "#F472B6", "#F9A8D4", "#FBCFE8", "#FDF2F8"],
  "blue-orange":["#1E40AF", "#3B82F6", "#60A5FA", "#FFFFFF", "#FED7AA", "#FB923C", "#EA580C", "#9A3412"],
  sunset:       ["#FEF3C7", "#FCD34D", "#F59E0B", "#D97706", "#B45309", "#92400E", "#78350F", "#451A03"],
  purple:       ["#F3E8FF", "#E9D5FF", "#D8B4FE", "#C084FC", "#A855F7", "#9333EA", "#7C3AED", "#6B21B6"],
  monochrome:   ["#1A1A1A", "#404040", "#666666", "#999999", "#CCCCCC", "#E5E5E5", "#F5F5F5", "#FFFFFF"],
  "pink-purple":["#FDF2F8", "#FCE7F3", "#F9A8D4", "#F472B6", "#EC4899", "#BE185D", "#831843", "#500724"],
  "blue-black": ["#000000", "#0F172A", "#1E293B", "#334155", "#475569", "#64748B", "#94A3B8", "#CBD5E1"],
  "beige-black":["#FEF3C7", "#F59E0B", "#D97706", "#92400E", "#451A03", "#1C1917", "#0C0A09", "#000000"],
}

function splitText(text: string) {
  return text.split("").map((char, i) => (
    <span key={i} className="char">{char === " " ? " " : char}</span>
  ))
}

export function CosmicSpectrum({
  color = "blue-pink",
  blur = false,
  title = "your taste fingerprint",
  subtitle = "74 signals that find your match",
}: CosmicSpectrumProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const currentColors = colorThemes[color]

  useEffect(() => {
    let resizeHandler: (() => void) | null = null

    const loadScript = (src: string) =>
      new Promise<void>((resolve, reject) => {
        // don't double-load
        if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
        const s = document.createElement("script")
        s.src = src
        s.onload = () => resolve()
        s.onerror = reject
        document.head.appendChild(s)
      })

    const init = async () => {
      try {
        await Promise.all([
          loadScript("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"),
          loadScript("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"),
        ])
        setTimeout(() => {
          if (window.gsap && window.ScrollTrigger) {
            window.gsap.registerPlugin(window.ScrollTrigger)
            setup()
          }
        }, 100)
      } catch (e) {
        console.error("GSAP load failed", e)
      }
    }

    const setup = () => {
      const { gsap, ScrollTrigger } = window

      // Scroll-hint pulse
      const hintChars = document.querySelectorAll(".cs-scroll-hint .char")
      if (hintChars.length) {
        gsap.set(hintChars, { opacity: 0, filter: "blur(3px)" })
        gsap.to(hintChars, {
          opacity: 1, filter: "blur(0px)", duration: 0.6,
          stagger: { each: 0.08, repeat: -1, yoyo: true },
          ease: "sine.inOut", delay: 0.8,
        })
      }

      // Hero text entrance
      const heroTl = gsap.timeline({ delay: 0.3 })
      const titleChars = document.querySelectorAll(".cs-hero-title .char")
      if (titleChars.length) {
        gsap.set(titleChars, { opacity: 0, filter: "blur(8px)", x: -20 })
        heroTl.to(titleChars, {
          opacity: 1, filter: "blur(0px)", x: 0,
          duration: 0.8, stagger: 0.03, ease: "power2.out",
        }, 0)
      }
      const textEls = document.querySelectorAll(".cs-hero-text")
      textEls.forEach((el, i) => {
        gsap.set(el, { opacity: 0, y: 50, clipPath: "inset(0 0 100% 0)" })
        heroTl.to(el, {
          opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)",
          duration: 0.8, ease: "power2.out",
        }, 0.6 + i * 0.18)
      })

      // Scroll-triggered spectrum rise
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: ".cs-animation-section",
          start: "top bottom",
          end: "bottom bottom",
          scrub: 1,
        },
      })

      const wlLabels = document.querySelectorAll(".cs-wavelength-label")
      const mainTitle = document.querySelector(".cs-main-title")
      gsap.set([...wlLabels, mainTitle].filter(Boolean), { opacity: 0, y: 30, filter: "blur(8px)" })

      tl.to(".cs-svg-container", { opacity: 1, duration: 0.01 }, 0)
        .to(".cs-svg-container", {
          transform: "scaleY(0.05) translateY(-30px)",
          duration: 0.3, ease: "power2.out",
        }, 0)
        .to(".cs-svg-container", {
          transform: "scaleY(1) translateY(0px)",
          duration: 1.2, ease: "power2.out",
        }, 0.3)
        .to([...wlLabels, mainTitle].filter(Boolean), {
          duration: 0.8, y: 0, opacity: 1, filter: "blur(0px)",
          stagger: 0.08, ease: "power2.out",
        }, 0.9)
        .to(".cs-level-5", { y: "-25vh", duration: 0.8, ease: "power2.out" }, 0.9)
        .to(".cs-level-4", { y: "-20vh", duration: 0.8, ease: "power2.out" }, 0.9)
        .to(".cs-level-3", { y: "-15vh", duration: 0.8, ease: "power2.out" }, 0.9)
        .to(".cs-level-2", { y: "-10vh", duration: 0.8, ease: "power2.out" }, 0.9)
        .to(".cs-level-1", { y: "-5vh",  duration: 0.8, ease: "power2.out" }, 0.9)

      resizeHandler = () => ScrollTrigger.refresh()
      window.addEventListener("resize", resizeHandler)
    }

    init()

    return () => {
      if (resizeHandler) window.removeEventListener("resize", resizeHandler)
      if (window.ScrollTrigger) window.ScrollTrigger.getAll().forEach((t: any) => t.kill())
      if (window.gsap) window.gsap.globalTimeline.clear()
    }
  }, [])

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-x-hidden">

      {/* Scroll hint */}
      <div className="cs-scroll-hint fixed bottom-8 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none text-[11px] uppercase tracking-widest text-white/50">
        {splitText("Scroll to explore")}
      </div>

      {/* Hero */}
      <section className="h-screen w-full flex flex-col items-center justify-center gap-6 px-8">
        <h2 className="cs-hero-title font-serif italic text-center leading-tight tracking-tight text-white"
          style={{ fontSize: "clamp(3rem,8vw,6.5rem)" }}>
          {splitText(title)}
        </h2>
        <p className="cs-hero-text text-sm uppercase tracking-[0.28em] text-white/55 text-center">
          {subtitle}
        </p>
      </section>

      <div className="h-[50vh]" />

      {/* Animation section */}
      <div className="cs-animation-section h-screen relative">
        <div className="fixed bottom-0 left-0 right-0 h-screen pointer-events-none z-[1]">

          {/* Rising spectrum bars */}
          <div
            className="cs-svg-container absolute bottom-0 left-0 right-0 h-screen opacity-0 z-[1]"
            style={{
              transformOrigin: "bottom",
              transform: "scaleY(0.05) translateY(100vh)",
              willChange: "transform, opacity",
            }}
          >
            <svg className="w-full h-full" viewBox="0 0 1567 584" preserveAspectRatio="none" fill="none">
              <g clipPath="url(#cs-clip)" filter={blur ? "url(#cs-blur)" : undefined}>
                <path d="M1219 584H1393V184H1219V584Z" fill="url(#cs-g0)" className="cs-level-1" />
                <path d="M1045 584H1219V104H1045V584Z" fill="url(#cs-g1)" className="cs-level-2" />
                <path d="M348 584H174L174 184H348L348 584Z" fill="url(#cs-g2)" className="cs-level-1" />
                <path d="M522 584H348L348 104H522L522 584Z" fill="url(#cs-g3)" className="cs-level-2" />
                <path d="M697 584H522L522 54H697L697 584Z" fill="url(#cs-g4)" className="cs-level-3" />
                <path d="M870 584H1045V54H870V584Z" fill="url(#cs-g5)" className="cs-level-4" />
                <path d="M870 584H697L697 0H870L870 584Z" fill="url(#cs-g6)" className="cs-level-5" />
                <path d="M174 585H0L0 295H174L174 585Z" fill="url(#cs-g7)" className="cs-level-1" />
                <path d="M1393 584H1567V294H1393V584Z" fill="url(#cs-g8)" className="cs-level-1" />
              </g>
              <defs>
                <filter id="cs-blur" x="-30" y="-30" width="1627" height="644"
                  filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                  <feGaussianBlur stdDeviation="15" result="effect1_foregroundBlur" />
                </filter>
                {Array.from({ length: 9 }, (_, i) => (
                  <linearGradient key={i} id={`cs-g${i}`}
                    x1="50%" y1="100%" x2="50%" y2="0%" gradientUnits="userSpaceOnUse">
                    <stop stopColor={currentColors[0]} />
                    <stop offset="0.182709" stopColor={currentColors[1]} />
                    <stop offset="0.283673" stopColor={currentColors[2]} />
                    <stop offset="0.413484" stopColor={currentColors[3]} />
                    <stop offset="0.586565" stopColor={currentColors[4]} />
                    <stop offset="0.682722" stopColor={currentColors[5]} />
                    <stop offset="0.802892" stopColor={currentColors[6]} />
                    <stop offset="1" stopColor={currentColors[7]} stopOpacity="0" />
                  </linearGradient>
                ))}
                <clipPath id="cs-clip">
                  <rect width="1567" height="584" fill="white" />
                </clipPath>
              </defs>
            </svg>
          </div>

          {/* Centre label */}
          <div className="cs-main-title absolute bottom-1/2 left-1/2 -translate-x-1/2 translate-y-1/2 text-center text-xs leading-relaxed z-20 opacity-0 text-white/80 uppercase tracking-[0.22em]">
            not just nearby
            <br />
            actually compatible
          </div>
        </div>
      </div>

    </div>
  )
}
