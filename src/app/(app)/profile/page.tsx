'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { AIInsightBlock } from '@/components/ui/ai-insight-block'
import { supabase } from '@/lib/supabase'
import { getSession, signInAnonymously, fetchCurrentUser, ensureUserRecord, DbUser } from '@/lib/api'

const QUEST_LABELS: Record<string, string> = {
  grocery: 'grocery', farmers_market: 'farmers market', bookstore: 'bookstore',
  ikea: 'ikea', coffee: 'coffee', gym: 'gym', hardware: 'hardware', thrift: 'thrift',
  tea: 'tea', brunch: 'brunch', lunch: 'lunch', food_market: 'food market',
  boba: 'boba', ice_cream: 'ice cream', yoga: 'yoga', run: 'run', hike: 'hike',
  museum: 'museum', gallery: 'gallery', cinema: 'cinema', trivia: 'trivia',
  pharmacy: 'pharmacy', record_store: 'record store', plant_nursery: 'plant nursery',
  wine_shop: 'wine shop', art_supply: 'art supply', pet_store: 'pet store',
  post_office: 'post office', other: 'other',
}

function ProfileInner() {
  const params = useSearchParams()
  const [user, setUser] = useState<DbUser | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // edit form state
  const [editingProfile, setEditingProfile] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [instagramValue, setInstagramValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [quests, setQuests] = useState<{ id: string; quest_type: string; location_label: string | null; scheduled_time: string; status: string }[]>([])
  const [hasFingerprint, setHasFingerprint] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    (async () => {
      let session = await getSession()
      if (!session) session = await signInAnonymously()
      if (!session) { setLoading(false); return }
      setUserId(session.user.id)
      await ensureUserRecord(session.user.id)
      const u = await fetchCurrentUser(session.user.id)
      setUser(u)
      const name = u?.display_name ?? ''
      setNameValue(name === 'you' ? '' : name)
      setInstagramValue(u?.instagram_handle ?? '')

      // Open edit form automatically if name isn't set yet
      if (!name || name === 'you') setEditingProfile(true)

      const [{ data: questData }, { data: fp }] = await Promise.all([
        supabase.from('quests').select('id, quest_type, location_label, scheduled_time, status').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('taste_fingerprints').select('user_id').eq('user_id', session.user.id).maybeSingle(),
      ])
      setQuests(questData ?? [])
      setHasFingerprint(!!fp)
      setLoading(false)
    })()
  }, [params])

  async function handleSaveProfile() {
    if (!userId) return
    setSaving(true)
    const updates: Record<string, string> = {}
    if (nameValue.trim()) updates.display_name = nameValue.trim()
    if (instagramValue.trim()) updates.instagram_handle = instagramValue.trim().replace('@', '')
    if (Object.keys(updates).length) {
      await supabase.from('users').update(updates).eq('id', userId)
      setUser(u => u ? { ...u, ...updates } : u)
    }
    setSaving(false)
    setSaveSuccess(true)
    setTimeout(() => { setSaveSuccess(false); setEditingProfile(false) }, 1200)
  }

  async function handleAvatarUpload(file: File) {
    if (!userId) return
    setUploadingAvatar(true)
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `avatars/${userId}.${ext}`
      const { error } = await supabase.storage.from('quest-photos').upload(path, file, { upsert: true })
      if (!error) {
        const { data } = supabase.storage.from('quest-photos').getPublicUrl(path)
        await supabase.from('users').update({ avatar_url: data.publicUrl }).eq('id', userId)
        setUser(u => u ? { ...u, avatar_url: data.publicUrl } : u)
      }
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function handleInstagramConnect() {
    setConnecting(true)
    try {
      let session = await getSession()
      if (!session) session = await signInAnonymously()
      if (!session) return
      window.location.href = `/api/auth/instagram/start?token=${encodeURIComponent(session.access_token)}`
    } finally {
      setConnecting(false)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  async function handleDeleteAccount() {
    if (!userId) return
    setDeleting(true)
    try {
      await supabase.from('waves').delete().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      await supabase.from('quests').delete().eq('user_id', userId)
      await supabase.from('taste_fingerprints').delete().eq('user_id', userId)
      await supabase.from('users').delete().eq('id', userId)
      await supabase.auth.signOut()
      window.location.href = '/'
    } finally {
      setDeleting(false)
    }
  }

  const blurb = user?.personality_data?.personalityBlurb
  const tags = user?.personality_data?.interestTags ?? []
  const displayName = (user?.display_name && user.display_name !== 'you') ? user.display_name : null
  const initial = displayName?.[0]?.toUpperCase() ?? '?'

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <span className="font-serif italic text-xl text-white/70">you</span>
          {!editingProfile && (
            <button
              onClick={() => { setEditingProfile(true); setSaveSuccess(false) }}
              className="text-xs text-white/40 hover:text-white/70 transition px-3 py-1.5 rounded-full border border-white/10 hover:border-white/20"
            >
              edit profile
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8 flex flex-col gap-8">
        {loading ? (
          <p className="text-sm text-white/40">loading…</p>
        ) : (
          <>
            {/* ── Avatar + identity ───────────────────────────────────── */}
            <div className="flex items-center gap-5">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadingAvatar}
                className="relative h-20 w-20 shrink-0 rounded-full overflow-hidden border border-white/12 transition hover:opacity-80"
                aria-label="Change photo"
              >
                {user?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-white/8 text-xl font-medium text-white/60">
                    {initial}
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition rounded-full">
                  <span className="text-[10px] text-white font-medium tracking-wider uppercase">
                    {uploadingAvatar ? '…' : 'photo'}
                  </span>
                </div>
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={e => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])} />

              <div className="flex-1 min-w-0">
                <p className="text-lg font-medium text-white truncate">
                  {displayName ?? <span className="text-white/30 italic">set your name →</span>}
                </p>
                {user?.instagram_handle
                  ? <p className="text-sm text-white/40 mt-0.5">@{user.instagram_handle}</p>
                  : <p className="text-sm text-white/25 mt-0.5">instagram not connected</p>}
              </div>
            </div>

            {/* ── Edit profile form ───────────────────────────────────── */}
            <AnimatePresence>
              {editingProfile && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/4 px-5 py-5"
                >
                  <p className="text-xs uppercase tracking-widest text-white/30">edit profile</p>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-white/40">name</label>
                    <input
                      autoFocus
                      value={nameValue}
                      onChange={e => setNameValue(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSaveProfile()}
                      placeholder="how should people know you?"
                      maxLength={32}
                      className="w-full rounded-xl border border-white/12 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-white/30 focus:bg-white/8 focus:outline-none transition"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-white/40">instagram handle <span className="text-white/20">(optional)</span></label>
                    <input
                      value={instagramValue}
                      onChange={e => setInstagramValue(e.target.value)}
                      placeholder="@yourhandle"
                      maxLength={30}
                      className="w-full rounded-xl border border-white/12 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-white/30 focus:bg-white/8 focus:outline-none transition"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving || saveSuccess}
                      className="flex-1 rounded-full bg-sq-blue py-2.5 text-sm font-semibold text-white transition hover:bg-sq-blue/85 disabled:opacity-60"
                    >
                      {saveSuccess ? 'saved ✓' : saving ? 'saving…' : 'save profile'}
                    </button>
                    <button
                      onClick={() => setEditingProfile(false)}
                      className="rounded-full border border-white/12 px-5 py-2.5 text-sm text-white/50 hover:text-white/70 hover:border-white/20 transition"
                    >
                      cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Status banners ──────────────────────────────────────── */}
            {params.get('fingerprint') && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                taste fingerprint saved — your match scores are now live.
              </div>
            )}
            {params.get('connected') && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                instagram connected!
              </div>
            )}
            {params.get('error') && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                something went wrong. try again.
              </div>
            )}

            {/* ── Vibe ───────────────────────────────────────────────── */}
            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-widest text-white/30">your vibe</p>
                <Link href="/interests" className="text-xs text-white/40 hover:text-white/70 transition">
                  {hasFingerprint ? 'update →' : 'build →'}
                </Link>
              </div>
              {blurb
                ? <AIInsightBlock insight={blurb} />
                : hasFingerprint
                  ? <p className="text-xs text-white/40 italic font-serif leading-relaxed">taste fingerprint built — your match scores are live.</p>
                  : (
                    <div className="rounded-2xl border border-white/10 bg-white/4 px-5 py-4 flex flex-col gap-3">
                      <p className="text-sm text-white/60 leading-relaxed">
                        pick your interests to build your 74-point Taste Fingerprint — this is what powers your match score.
                      </p>
                      <Link href="/interests"
                        className="w-full rounded-full bg-white py-2.5 text-sm font-medium text-black text-center hover:bg-white/85 transition">
                        build my vibe
                      </Link>
                    </div>
                  )
              }
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {tags.map((t) => (
                    <span key={t} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/50">{t}</span>
                  ))}
                </div>
              )}
            </section>

            {/* ── Quest history ───────────────────────────────────────── */}
            {quests.length > 0 && (
              <section className="flex flex-col gap-3">
                <p className="text-xs uppercase tracking-widest text-white/30">your quests</p>
                <div className="flex flex-col divide-y divide-white/6 rounded-2xl border border-white/8 bg-white/3 overflow-hidden">
                  {quests.map(q => (
                    <div key={q.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm text-white/80">{QUEST_LABELS[q.quest_type] ?? q.quest_type}</p>
                        <p className="text-xs text-white/35">{q.location_label ?? 'nearby'}</p>
                      </div>
                      <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full ${
                        q.status === 'active'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-white/8 text-white/35'
                      }`}>
                        {q.status}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Settings ───────────────────────────────────────────── */}
            <section className="flex flex-col gap-3">
              <p className="text-xs uppercase tracking-widest text-white/30">settings</p>
              <div className="flex flex-col divide-y divide-white/6 rounded-2xl border border-white/8 overflow-hidden">
                {!user?.instagram_handle && (
                  <button
                    onClick={handleInstagramConnect}
                    disabled={connecting}
                    className="flex items-center justify-between px-4 py-3.5 text-sm text-white/60 hover:text-white hover:bg-white/4 transition text-left"
                  >
                    {connecting ? 'connecting…' : 'connect instagram'}
                    <span className="text-white/25">→</span>
                  </button>
                )}
                <button
                  onClick={handleSignOut}
                  className="flex items-center justify-between px-4 py-3.5 text-sm text-white/60 hover:text-white hover:bg-white/4 transition text-left"
                >
                  sign out
                  <span className="text-white/25">→</span>
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center justify-between px-4 py-3.5 text-sm text-red-400/70 hover:text-red-400 hover:bg-red-500/5 transition text-left"
                >
                  delete account
                  <span className="text-red-400/30">→</span>
                </button>
              </div>
            </section>

            {/* ── Delete confirm ──────────────────────────────────────── */}
            <AnimatePresence>
              {showDeleteConfirm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-8"
                  style={{ backdropFilter: 'blur(8px)' }}
                >
                  <motion.div
                    initial={{ y: 40 }}
                    animate={{ y: 0 }}
                    exit={{ y: 40 }}
                    className="w-full max-w-sm rounded-2xl border border-white/10 bg-obsidian p-6 flex flex-col gap-4"
                  >
                    <div>
                      <p className="font-medium text-white mb-1">delete your account?</p>
                      <p className="text-sm text-white/40">this removes all your quests, waves, and data permanently. there&apos;s no undo.</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={handleDeleteAccount}
                        disabled={deleting}
                        className="rounded-full bg-red-500 py-3 text-sm font-medium text-white transition hover:bg-red-400 disabled:opacity-50"
                      >
                        {deleting ? 'deleting…' : 'yes, delete everything'}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="rounded-full border border-white/12 py-3 text-sm text-white/50 hover:text-white/70 transition"
                      >
                        cancel
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </main>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-ink">
        <p className="text-sm text-white/30">loading…</p>
      </div>
    }>
      <ProfileInner />
    </Suspense>
  )
}
