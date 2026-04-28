'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from '@/lib/api'
import { supabase } from '@/lib/supabase'

type Step = 'name' | 'photo' | 'instagram'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('name')
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function saveName() {
    if (!displayName.trim()) return
    setSaving(true)
    const session = await getSession()
    if (session) {
      await supabase.from('users').update({ display_name: displayName.trim() }).eq('id', session.user.id)
    }
    setSaving(false)
    setStep('photo')
  }

  async function uploadAvatar(file: File) {
    setUploading(true)
    try {
      const session = await getSession()
      if (!session) return
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `avatars/${session.user.id}.${ext}`
      const { error } = await supabase.storage.from('quest-photos').upload(path, file, { upsert: true })
      if (!error) {
        const { data } = supabase.storage.from('quest-photos').getPublicUrl(path)
        setAvatarUrl(data.publicUrl)
        await supabase.from('users').update({ avatar_url: data.publicUrl }).eq('id', session.user.id)
      }
    } finally {
      setUploading(false)
    }
  }

  function finish() {
    router.replace('/feed')
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

  async function connectInstagram() {
    const session = await getSession()
    if (!session) return
    const redirectTo = `${window.location.origin}/auth/callback`
    const url = `${SUPABASE_URL}/functions/v1/instagram-oauth/authorize?apikey=${SUPABASE_ANON_KEY}&platform=web&redirect_to=${encodeURIComponent(redirectTo)}&token=${encodeURIComponent(session.access_token)}`
    window.location.href = url
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-parchment px-6 dark:bg-ink">
      <div className="w-full max-w-sm flex flex-col gap-8">

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2">
          {(['name', 'photo', 'instagram'] as Step[]).map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${step === s ? 'w-6 bg-ink dark:bg-parchment' : 'w-1.5 bg-chalk dark:bg-graphite'}`}
            />
          ))}
        </div>

        {step === 'name' && (
          <>
            <div className="text-center">
              <h1 className="font-serif italic text-3xl text-ink dark:text-parchment mb-2">what should we call you?</h1>
              <p className="text-sm text-graphite dark:text-chalk">this is what other questers will see.</p>
            </div>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                autoFocus
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && displayName.trim() && saveName()}
                placeholder="your first name, nickname, whatever…"
                maxLength={32}
                className="rounded-xl border border-chalk bg-white px-4 py-3 text-sm text-ink placeholder:text-chalk focus:border-ink focus:outline-none dark:border-graphite dark:bg-obsidian dark:text-parchment dark:placeholder:text-graphite dark:focus:border-parchment"
              />
              <button
                onClick={saveName}
                disabled={!displayName.trim() || saving}
                className="rounded-full bg-ink py-3 text-sm font-medium text-parchment transition hover:bg-graphite disabled:opacity-40 dark:bg-parchment dark:text-ink"
              >
                {saving ? 'saving…' : 'continue'}
              </button>
            </div>
          </>
        )}

        {step === 'photo' && (
          <>
            <div className="text-center">
              <h1 className="font-serif italic text-3xl text-ink dark:text-parchment mb-2">add a photo</h1>
              <p className="text-sm text-graphite dark:text-chalk">optional — helps people recognise you.</p>
            </div>
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="relative h-24 w-24 rounded-full border-2 border-dashed border-chalk overflow-hidden transition hover:border-graphite dark:border-graphite dark:hover:border-chalk"
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-3xl">{uploading ? '…' : '+'}</span>
                )}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setStep('instagram')}
                className="rounded-full bg-ink py-3 text-sm font-medium text-parchment transition hover:bg-graphite dark:bg-parchment dark:text-ink"
              >
                {avatarUrl ? 'looks good' : 'skip for now'}
              </button>
            </div>
          </>
        )}

        {step === 'instagram' && (
          <>
            <div className="text-center">
              <h1 className="font-serif italic text-3xl text-ink dark:text-parchment mb-2">connect instagram</h1>
              <p className="text-sm text-graphite dark:text-chalk leading-relaxed">
                We read your posts to build a taste fingerprint — 74 lifestyle categories that power your match score. We never post or store your photos.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={connectInstagram}
                className="flex items-center justify-center gap-3 rounded-full py-3 text-sm font-medium text-white transition"
                style={{ background: 'linear-gradient(135deg, #f58529, #dd2a7b, #8134af, #515bd4)' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                connect instagram
              </button>
              <button
                onClick={finish}
                className="rounded-full border border-chalk py-3 text-sm text-graphite transition hover:border-graphite hover:text-ink dark:border-graphite dark:text-chalk dark:hover:border-parchment dark:hover:text-parchment"
              >
                skip — go to my feed
              </button>
            </div>
          </>
        )}

      </div>
    </main>
  )
}
