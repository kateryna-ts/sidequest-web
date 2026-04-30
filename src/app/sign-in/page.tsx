'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ShaderAnimation } from '@/components/ui/shader-animation'
import { signInWithPassword, signInWithOtp, verifyOtp, ensureUserRecord } from '@/lib/api'
import { supabase } from '@/lib/supabase'

type Step = 'password' | 'magic' | 'magic-verify'

const SLIDE = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 60 }),
  center: { opacity: 1, x: 0 },
  exit:  (dir: number) => ({ opacity: 0, x: dir * -60 }),
}

export default function SignInPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('password')
  const [dir, setDir] = useState(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const digitRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (step === 'magic-verify') setTimeout(() => digitRefs.current[0]?.focus(), 400)
  }, [step])

  function goTo(next: Step, forward = true) {
    setDir(forward ? 1 : -1)
    setError(null)
    setStep(next)
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const session = await signInWithPassword(email, password)
      if (!session) throw new Error('no session')
      const { data: existing } = await supabase.from('users').select('id').eq('id', session.user.id).single()
      await ensureUserRecord(session.user.id)
      router.replace(existing ? '/feed' : '/onboarding')
    } catch {
      setError('incorrect email or password.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSendMagic(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signInWithOtp(email)
      goTo('magic-verify', true)
    } catch {
      setError('could not send link. check the email and try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    const token = digits.join('')
    if (token.length < 6) return
    setError(null)
    setLoading(true)
    try {
      const session = await verifyOtp(email, token)
      if (!session) throw new Error('invalid code')
      const { data: existing } = await supabase.from('users').select('id').eq('id', session.user.id).single()
      await ensureUserRecord(session.user.id)
      router.replace(existing ? '/feed' : '/onboarding')
    } catch {
      setError('invalid or expired code. try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleInstagram() {
    setLoading(true)
    const res = await fetch('/api/auth/instagram/configured')
    const { ok } = await res.json()
    if (ok) {
      window.location.href = '/api/auth/instagram/start'
    } else {
      setError("Instagram sign-in isn't available yet. Use email instead.")
      setLoading(false)
    }
  }

  function handleDigit(i: number, val: string) {
    const cleaned = val.replace(/\D/g, '').slice(0, 1)
    const next = [...digits]
    next[i] = cleaned
    setDigits(next)
    if (cleaned && i < 5) digitRefs.current[i + 1]?.focus()
  }

  function handleDigitKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) digitRefs.current[i - 1]?.focus()
  }

  function handleDigitPaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    e.preventDefault()
    const next = pasted.split('').concat(Array(6).fill('')).slice(0, 6)
    setDigits(next)
    digitRefs.current[Math.min(pasted.length, 5)]?.focus()
  }

  const codeComplete = digits.every(d => d !== '')

  const inputCls = "w-full bg-parchment/5 border border-parchment/15 rounded-full py-3 px-5 text-sm text-parchment placeholder:text-chalk/30 focus:outline-none focus:border-parchment/40 transition"

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-ink">
      <ShaderAnimation speed={loading ? 15 : 1} />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-ink to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink to-transparent pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm px-6">
        <Link href="/" className="block text-center mb-10">
          <span className="font-serif italic text-4xl text-parchment tracking-tight">side quest</span>
        </Link>

        <AnimatePresence mode="wait" custom={dir}>

          {/* ── Password sign-in ── */}
          {step === 'password' && (
            <motion.div key="password" custom={dir} variants={SLIDE} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-6"
            >
              <div className="text-center flex flex-col gap-1">
                <h1 className="font-serif italic text-3xl text-parchment">welcome back.</h1>
                <p className="text-sm text-chalk/60">sign in to your side quest.</p>
              </div>

              <button onClick={handleInstagram} disabled={loading}
                className="flex items-center justify-center gap-3 rounded-full py-3 text-sm font-medium text-parchment border border-parchment/20 bg-parchment/5 hover:bg-parchment/10 transition disabled:opacity-40"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="opacity-80">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                continue with instagram
              </button>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-parchment/10" />
                <span className="text-xs text-chalk/40">or use email</span>
                <div className="h-px flex-1 bg-parchment/10" />
              </div>

              <form onSubmit={handlePassword} className="flex flex-col gap-3">
                <input type="email" required autoFocus value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputCls}
                />
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="password"
                    className={`${inputCls} pr-12`}
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-chalk/40 hover:text-chalk/70 transition"
                  >
                    {showPw
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>

                {error && <p className="text-xs text-red-400">{error}</p>}

                <button type="submit" disabled={loading || !email || !password}
                  className="rounded-full bg-parchment text-ink text-sm font-medium py-3 hover:bg-parchment/90 transition disabled:opacity-40"
                >
                  {loading ? 'signing in…' : 'sign in'}
                </button>
              </form>

              <div className="flex flex-col items-center gap-2">
                <button onClick={() => goTo('magic', true)}
                  className="text-xs text-chalk/40 hover:text-chalk/70 transition underline underline-offset-2"
                >
                  use a magic link instead
                </button>
                <p className="text-xs text-chalk/40">
                  don't have an account?{' '}
                  <Link href="/sign-up" className="text-parchment/70 underline underline-offset-2 hover:text-parchment transition">
                    create one
                  </Link>
                </p>
              </div>
            </motion.div>
          )}

          {/* ── Magic link entry ── */}
          {step === 'magic' && (
            <motion.div key="magic" custom={dir} variants={SLIDE} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-6"
            >
              <div className="text-center flex flex-col gap-1">
                <h1 className="font-serif italic text-3xl text-parchment">magic link.</h1>
                <p className="text-sm text-chalk/60">we'll email you a one-click sign-in link.</p>
              </div>

              <form onSubmit={handleSendMagic} className="flex flex-col gap-3">
                <input type="email" required autoFocus value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputCls}
                />
                {error && <p className="text-xs text-red-400">{error}</p>}
                <button type="submit" disabled={loading || !email}
                  className="rounded-full bg-parchment text-ink text-sm font-medium py-3 hover:bg-parchment/90 transition disabled:opacity-40"
                >
                  {loading ? 'sending…' : 'send link'}
                </button>
              </form>

              <button onClick={() => goTo('password', false)}
                className="text-xs text-center text-chalk/40 hover:text-chalk/70 transition underline underline-offset-2"
              >
                back to password
              </button>
            </motion.div>
          )}

          {/* ── Magic verify ── */}
          {step === 'magic-verify' && (
            <motion.div key="magic-verify" custom={dir} variants={SLIDE} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-6"
            >
              <div className="text-center flex flex-col gap-1">
                <h1 className="font-serif italic text-3xl text-parchment">check your email.</h1>
                <p className="text-sm text-chalk/60">
                  link sent to <span className="text-parchment/90">{email}</span>
                </p>
              </div>

              <div className="rounded-2xl border border-parchment/10 bg-parchment/5 px-5 py-4 text-center text-sm text-chalk/60 leading-relaxed">
                click the link in your email to sign in.
                <br /><span className="text-xs text-chalk/35">check spam if you don't see it.</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-parchment/10" />
                <span className="text-xs text-chalk/40">or enter code</span>
                <div className="h-px flex-1 bg-parchment/10" />
              </div>

              <form onSubmit={handleVerify} className="flex flex-col gap-4">
                <div className="flex items-center justify-center gap-2 rounded-full border border-parchment/15 bg-parchment/5 py-4 px-5">
                  {digits.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="relative">
                        <input ref={el => { digitRefs.current[i] = el }}
                          type="text" inputMode="numeric" maxLength={1} value={d}
                          onChange={e => handleDigit(i, e.target.value)}
                          onKeyDown={e => handleDigitKey(i, e)}
                          onPaste={i === 0 ? handleDigitPaste : undefined}
                          className="w-8 h-8 text-center text-lg bg-transparent text-parchment border-none focus:outline-none appearance-none"
                          style={{ caretColor: 'transparent' }}
                        />
                        {!d && <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="w-1.5 h-1.5 rounded-full bg-parchment/20" />
                        </div>}
                      </div>
                      {i < 5 && <span className="text-parchment/15 text-lg select-none">|</span>}
                    </div>
                  ))}
                </div>
                {error && <p className="text-xs text-red-400 text-center">{error}</p>}
                <div className="flex gap-3">
                  <button type="button" onClick={() => goTo('magic', false)}
                    className="rounded-full border border-parchment/20 text-parchment/70 text-sm py-3 px-6 hover:border-parchment/40 hover:text-parchment transition"
                  >back</button>
                  <button type="submit" disabled={loading || !codeComplete}
                    className={`flex-1 rounded-full text-sm font-medium py-3 transition ${codeComplete ? 'bg-parchment text-ink hover:bg-parchment/90' : 'bg-parchment/10 text-parchment/30 cursor-not-allowed'}`}
                  >{loading ? 'verifying…' : 'verify'}</button>
                </div>
              </form>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
