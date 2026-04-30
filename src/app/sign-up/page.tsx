'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ShaderAnimation } from '@/components/ui/shader-animation'
import { signUpWithPassword, ensureUserRecord, getSession } from '@/lib/api'
import { supabase } from '@/lib/supabase'

type Step = 'email' | 'profile' | 'city' | 'vibe' | 'photo' | 'instagram'
const STEPS: Step[] = ['email', 'profile', 'city', 'vibe', 'photo', 'instagram']

const SLIDE = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 60 }),
  center: { opacity: 1, x: 0 },
  exit:  (dir: number) => ({ opacity: 0, x: dir * -60 }),
}

export default function SignUpPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [dir, setDir] = useState(1)

  // fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [age, setAge] = useState('')
  const [city, setCity] = useState('')
  const [vibe, setVibe] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  // ui state
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [confirmEmail, setConfirmEmail] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const stepIndex = STEPS.indexOf(step)

  function goTo(next: Step, forward = true) {
    setDir(forward ? 1 : -1)
    setError(null)
    setStep(next)
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    if (!email || password.length < 6) {
      setError('password must be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      const session = await signUpWithPassword(email, password)
      if (session) {
        await ensureUserRecord(session.user.id)
        goTo('profile', true)
      } else {
        setConfirmEmail(true)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.toLowerCase().includes('already registered')) {
        setError('an account with that email already exists. try signing in.')
      } else {
        setError('could not create account. try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!displayName.trim()) return
    const ageNum = parseInt(age)
    if (!age || isNaN(ageNum) || ageNum < 18 || ageNum > 100) {
      setError('you must be 18 or older to use side quest.')
      return
    }
    setLoading(true)
    const session = await getSession()
    if (session) {
      await supabase.from('users').update({
        display_name: displayName.trim(),
        age: ageNum,
      }).eq('id', session.user.id)
    }
    setLoading(false)
    goTo('city', true)
  }

  async function handleSaveCity(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const session = await getSession()
    if (session && city.trim()) {
      await supabase.from('users').update({ city: city.trim() }).eq('id', session.user.id)
    }
    setLoading(false)
    goTo('vibe', true)
  }

  async function handleSaveVibe(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const session = await getSession()
    if (session && vibe.trim()) {
      await supabase.from('users').update({ bio: vibe.trim() }).eq('id', session.user.id)
    }
    setLoading(false)
    goTo('photo', true)
  }

  async function uploadAvatar(file: File) {
    setUploadError(null)
    setUploading(true)
    try {
      const session = await getSession()
      if (!session) return
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `avatars/${session.user.id}.${ext}`
      const { error: storageErr } = await supabase.storage
        .from('quest-photos')
        .upload(path, file, { upsert: true })
      if (storageErr) {
        setUploadError('upload failed — check storage bucket setup.')
        return
      }
      const { data } = supabase.storage.from('quest-photos').getPublicUrl(path)
      setAvatarUrl(data.publicUrl)
      await supabase.from('users').update({ avatar_url: data.publicUrl }).eq('id', session.user.id)
    } finally {
      setUploading(false)
    }
  }

  async function handleInstagramSignUp() {
    const res = await fetch('/api/auth/instagram/configured')
    const { ok } = await res.json()
    if (ok) {
      window.location.href = '/api/auth/instagram/start'
    } else {
      setError("Instagram sign-up isn't available yet. Use email to create your account.")
    }
  }

  async function handleInstagramConnect() {
    window.location.href = '/api/auth/instagram/start'
  }

  const inputCls = "w-full bg-parchment/5 border border-parchment/15 rounded-2xl py-3.5 px-5 text-sm text-parchment placeholder:text-parchment/25 focus:outline-none focus:border-parchment/40 transition"
  const primaryBtn = "w-full rounded-full bg-parchment text-ink text-sm font-medium py-3.5 hover:bg-parchment/90 transition disabled:opacity-40"
  const ghostBtn = "w-full rounded-full border border-parchment/20 text-parchment/60 text-sm py-3.5 hover:border-parchment/40 hover:text-parchment transition"

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-ink">

      <ShaderAnimation speed={loading ? 3 : 1} />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_50%_50%,rgba(10,10,10,0.82)_0%,rgba(10,10,10,0.25)_100%)]" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-ink to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink to-transparent" />

      <div className="relative z-10 w-full max-w-sm px-6 py-12">

        <Link href="/" className="block text-center mb-8">
          <span className="font-serif italic text-4xl text-parchment tracking-tight">side quest</span>
        </Link>

        {/* Progress bar */}
        <div className="flex items-center justify-center gap-1.5 mb-10">
          {STEPS.map((s, i) => (
            <div key={s} className={`h-1 rounded-full transition-all duration-300 ${
              i === stepIndex ? 'w-6 bg-parchment'
              : i < stepIndex ? 'w-3 bg-parchment/40'
              : 'w-1.5 bg-parchment/15'
            }`} />
          ))}
        </div>

        <AnimatePresence mode="wait" custom={dir}>

          {/* ── Email + Password ── */}
          {step === 'email' && (
            <motion.div key="email" custom={dir} variants={SLIDE} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-6"
            >
              <div className="text-center flex flex-col gap-1.5">
                <h1 className="font-serif italic text-3xl text-parchment">create your account.</h1>
                <p className="text-sm text-parchment/45">join to post quests and find your errand buddy.</p>
              </div>

              <button onClick={handleInstagramSignUp} disabled={loading}
                className="flex items-center justify-center gap-3 rounded-full py-3.5 text-sm font-medium text-parchment border border-parchment/20 bg-parchment/5 hover:bg-parchment/10 transition disabled:opacity-40">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="opacity-80">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                continue with instagram
              </button>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-parchment/10" />
                <span className="text-xs text-parchment/30">or use email</span>
                <div className="h-px flex-1 bg-parchment/10" />
              </div>

              {confirmEmail ? (
                <div className="rounded-2xl border border-parchment/10 bg-parchment/5 px-5 py-5 text-center flex flex-col gap-2">
                  <p className="text-sm text-parchment/90">check your email.</p>
                  <p className="text-xs text-parchment/45 leading-relaxed">
                    we sent a confirmation link to <span className="text-parchment/70">{email}</span>. click it to activate your account, then sign in.
                  </p>
                  <Link href="/sign-in" className="mt-2 text-xs text-parchment/50 underline underline-offset-2 hover:text-parchment transition">
                    go to sign in
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSignUp} className="flex flex-col gap-3">
                  <input type="email" required autoFocus
                    value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com" className={inputCls} />
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} required
                      value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="password (6+ characters)"
                      className="w-full bg-parchment/5 border border-parchment/15 rounded-2xl py-3.5 pl-5 pr-12 text-sm text-parchment placeholder:text-parchment/25 focus:outline-none focus:border-parchment/40 transition" />
                    <button type="button" onClick={() => setShowPassword(p => !p)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-parchment/30 hover:text-parchment/60 transition" tabIndex={-1}>
                      {showPassword ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                  {error && <p className="text-xs text-red-400 text-center">{error}</p>}
                  <button type="submit" disabled={loading || !email || password.length < 6} className={primaryBtn}>
                    {loading ? 'creating account…' : 'create account'}
                  </button>
                </form>
              )}

              <p className="text-center text-xs text-parchment/30">
                already have an account?{' '}
                <Link href="/sign-in" className="text-parchment/60 underline underline-offset-2 hover:text-parchment transition">sign in</Link>
              </p>
            </motion.div>
          )}

          {/* ── Name + Age ── */}
          {step === 'profile' && (
            <motion.div key="profile" custom={dir} variants={SLIDE} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-6"
            >
              <div className="text-center flex flex-col gap-1.5">
                <h1 className="font-serif italic text-3xl text-parchment">who are you?</h1>
                <p className="text-sm text-parchment/45">this is what other questers will see.</p>
              </div>
              <form onSubmit={handleSaveProfile} className="flex flex-col gap-3">
                <input type="text" required autoFocus
                  value={displayName} onChange={e => setDisplayName(e.target.value)}
                  placeholder="your name or nickname"
                  maxLength={32} className={inputCls} />
                <input type="number" min={18} max={100} required
                  value={age} onChange={e => setAge(e.target.value)}
                  placeholder="age (18+)"
                  className={inputCls} />
                {error && <p className="text-xs text-red-400 text-center">{error}</p>}
                <button type="submit" disabled={!displayName.trim() || loading} className={primaryBtn}>
                  {loading ? 'saving…' : 'continue'}
                </button>
              </form>
            </motion.div>
          )}

          {/* ── City ── */}
          {step === 'city' && (
            <motion.div key="city" custom={dir} variants={SLIDE} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-6"
            >
              <div className="text-center flex flex-col gap-1.5">
                <h1 className="font-serif italic text-3xl text-parchment">where are you based?</h1>
                <p className="text-sm text-parchment/45">helps us find quests near you.</p>
              </div>
              <form onSubmit={handleSaveCity} className="flex flex-col gap-3">
                <input type="text" autoFocus
                  value={city} onChange={e => setCity(e.target.value)}
                  placeholder="city — e.g. miami, brooklyn, la"
                  maxLength={64} className={inputCls} />
                <button type="submit" disabled={loading} className={primaryBtn}>
                  {loading ? 'saving…' : city.trim() ? 'continue' : 'skip'}
                </button>
              </form>
            </motion.div>
          )}

          {/* ── Vibe ── */}
          {step === 'vibe' && (
            <motion.div key="vibe" custom={dir} variants={SLIDE} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-6"
            >
              <div className="text-center flex flex-col gap-1.5">
                <h1 className="font-serif italic text-3xl text-parchment">what's your vibe?</h1>
                <p className="text-sm text-parchment/45">one line. be honest, not impressive.</p>
              </div>
              <form onSubmit={handleSaveVibe} className="flex flex-col gap-3">
                <textarea
                  autoFocus rows={3}
                  value={vibe} onChange={e => setVibe(e.target.value)}
                  placeholder="e.g. always at the farmers market before 9am, probably carrying a tote bag"
                  maxLength={120}
                  className="w-full bg-parchment/5 border border-parchment/15 rounded-2xl py-3.5 px-5 text-sm text-parchment placeholder:text-parchment/25 focus:outline-none focus:border-parchment/40 transition resize-none leading-relaxed"
                />
                <div className="flex justify-end">
                  <span className="text-xs text-parchment/25">{vibe.length}/120</span>
                </div>
                <button type="submit" disabled={loading} className={primaryBtn}>
                  {loading ? 'saving…' : vibe.trim() ? 'continue' : 'skip'}
                </button>
              </form>
            </motion.div>
          )}

          {/* ── Photo ── */}
          {step === 'photo' && (
            <motion.div key="photo" custom={dir} variants={SLIDE} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-6"
            >
              <div className="text-center flex flex-col gap-1.5">
                <h1 className="font-serif italic text-3xl text-parchment">add a photo.</h1>
                <p className="text-sm text-parchment/45">optional — helps people recognise you.</p>
              </div>
              <div className="flex justify-center">
                <button onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="relative h-28 w-28 rounded-full border-2 border-dashed border-parchment/20 overflow-hidden hover:border-parchment/40 transition disabled:opacity-60 flex items-center justify-center">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-4xl text-parchment/20 select-none">{uploading ? '…' : '+'}</span>
                  )}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
              </div>
              {uploadError && <p className="text-xs text-red-400 text-center">{uploadError}</p>}
              <button onClick={() => goTo('instagram', true)} disabled={uploading} className={primaryBtn}>
                {avatarUrl ? 'looks good' : 'skip for now'}
              </button>
            </motion.div>
          )}

          {/* ── Instagram ── */}
          {step === 'instagram' && (
            <motion.div key="instagram" custom={dir} variants={SLIDE} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-6"
            >
              <div className="text-center flex flex-col gap-2">
                <h1 className="font-serif italic text-3xl text-parchment">one last thing.</h1>
                <p className="text-sm text-parchment/45 leading-relaxed">
                  connect instagram so we can build your taste fingerprint — 74 signals that power your match score. we never post or store your photos.
                </p>
              </div>
              {error && <p className="text-xs text-red-400 text-center">{error}</p>}
              <div className="flex flex-col gap-3">
                <button onClick={handleInstagramConnect}
                  className="flex items-center justify-center gap-3 rounded-full py-3.5 text-sm font-medium text-white transition"
                  style={{ background: 'linear-gradient(135deg, #f58529, #dd2a7b, #8134af, #515bd4)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  connect instagram
                </button>
                <button onClick={() => router.replace('/feed')} className={ghostBtn}>
                  skip — take me to the feed
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
