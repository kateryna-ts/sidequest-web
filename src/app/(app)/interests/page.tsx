'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from '@/lib/api'
import { supabase } from '@/lib/supabase'

const GROUPS: { label: string; items: { id: string; emoji: string; label: string }[] }[] = [
  {
    label: 'food & drink',
    items: [
      { id: 'cooking',        emoji: '🍳', label: 'cooking' },
      { id: 'baking',         emoji: '🧁', label: 'baking' },
      { id: 'coffee_culture', emoji: '☕', label: 'coffee' },
      { id: 'cocktails',      emoji: '🍷', label: 'drinks' },
      { id: 'healthy_eating', emoji: '🥗', label: 'healthy eating' },
      { id: 'restaurant',     emoji: '🍽️', label: 'restaurants' },
      { id: 'food_travel',    emoji: '🌮', label: 'food travel' },
    ],
  },
  {
    label: 'fitness & outdoors',
    items: [
      { id: 'gym',              emoji: '🏋️', label: 'gym' },
      { id: 'running',          emoji: '🏃', label: 'running' },
      { id: 'yoga_pilates',     emoji: '🧘', label: 'yoga' },
      { id: 'hiking',           emoji: '🥾', label: 'hiking' },
      { id: 'wellness',         emoji: '🌿', label: 'wellness' },
      { id: 'sports',           emoji: '⚽', label: 'sports' },
      { id: 'nature',           emoji: '🌲', label: 'nature' },
    ],
  },
  {
    label: 'travel',
    items: [
      { id: 'travel',        emoji: '✈️', label: 'travel' },
      { id: 'solo_travel',   emoji: '🎒', label: 'solo travel' },
      { id: 'van_life',      emoji: '🚐', label: 'van life' },
      { id: 'city_guides',   emoji: '🗺️', label: 'city guides' },
      { id: 'luxury_travel', emoji: '🏨', label: 'luxury travel' },
    ],
  },
  {
    label: 'home & style',
    items: [
      { id: 'interior_design',     emoji: '🛋️', label: 'interior design' },
      { id: 'plants',              emoji: '🪴', label: 'plants' },
      { id: 'diy',                 emoji: '🔨', label: 'diy' },
      { id: 'minimalism',          emoji: '⬜', label: 'minimalism' },
      { id: 'fashion',             emoji: '👗', label: 'fashion' },
      { id: 'vintage_fashion',     emoji: '🧥', label: 'vintage' },
      { id: 'sustainable_fashion', emoji: '♻️', label: 'slow fashion' },
      { id: 'beauty_makeup',       emoji: '💄', label: 'beauty' },
      { id: 'skincare',            emoji: '✨', label: 'skincare' },
    ],
  },
  {
    label: 'arts & culture',
    items: [
      { id: 'film',            emoji: '🎬', label: 'film' },
      { id: 'tv_series',       emoji: '📺', label: 'tv' },
      { id: 'books',           emoji: '📚', label: 'books' },
      { id: 'music',           emoji: '🎵', label: 'music' },
      { id: 'live_music',      emoji: '🎤', label: 'live music' },
      { id: 'vinyl',           emoji: '💿', label: 'vinyl' },
      { id: 'art',             emoji: '🎨', label: 'art' },
      { id: 'photography',     emoji: '📷', label: 'photography' },
      { id: 'film_photography',emoji: '🎞️', label: 'film photo' },
      { id: 'poetry_writing',  emoji: '✍️', label: 'writing' },
      { id: 'indie_music',     emoji: '🎸', label: 'indie' },
      { id: 'hip_hop',         emoji: '🎧', label: 'hip hop' },
    ],
  },
  {
    label: 'humor & vibes',
    items: [
      { id: 'dry_humor',  emoji: '😶', label: 'dry humor' },
      { id: 'dark_humor', emoji: '💀', label: 'dark humor' },
      { id: 'memes',      emoji: '😭', label: 'memes' },
      { id: 'absurdist',  emoji: '🌀', label: 'absurdist' },
    ],
  },
  {
    label: 'tech & ideas',
    items: [
      { id: 'coding',          emoji: '💻', label: 'coding' },
      { id: 'tech',            emoji: '📱', label: 'tech' },
      { id: 'ai_tools',        emoji: '🤖', label: 'AI' },
      { id: 'entrepreneurship',emoji: '🚀', label: 'startups' },
      { id: 'productivity',    emoji: '⚡', label: 'productivity' },
      { id: 'finance',         emoji: '📈', label: 'finance' },
    ],
  },
  {
    label: 'life',
    items: [
      { id: 'dogs',             emoji: '🐶', label: 'dogs' },
      { id: 'cats',             emoji: '🐱', label: 'cats' },
      { id: 'sustainability',   emoji: '🌍', label: 'sustainability' },
      { id: 'stargazing',       emoji: '🔭', label: 'stargazing' },
      { id: 'self_love',        emoji: '💛', label: 'self care' },
      { id: 'friendship',       emoji: '🫂', label: 'friendship' },
      { id: 'culture',          emoji: '🌐', label: 'culture' },
      { id: 'history',          emoji: '🏛️', label: 'history' },
      { id: 'social_commentary',emoji: '💬', label: 'hot takes' },
    ],
  },
]

const DIMENSION_ORDER = [
  'cooking','baking','chaotic_cooking','coffee_culture','cocktails','healthy_eating','food_travel','restaurant',
  'gym','running','yoga_pilates','sports','wellness','fitness_motivation','travel','hiking','luxury_travel',
  'solo_travel','van_life','city_guides','interior_design','diy','minimalism','cottagecore','plants','organization',
  'fashion','vintage_fashion','streetwear','luxury_fashion','sustainable_fashion','beauty_makeup','skincare',
  'film','tv_series','anime','true_crime','books','music','music_production','live_music','vinyl','hip_hop',
  'indie_music','art','digital_art','photography','film_photography','poetry_writing','dry_humor','dark_humor',
  'memes','skits','absurdist','ai_tools','tech','coding','crypto_web3','dogs','cats','wildlife','nature',
  'sustainability','stargazing','entrepreneurship','productivity','finance','student_life','dating','friendship',
  'self_love','culture','history','social_commentary',
]

export default function InterestsPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleSave() {
    if (selected.size < 3 || saving) return
    setSaving(true)
    try {
      const session = await getSession()
      if (!session) return

      const scores: Record<string, number> = {}
      for (const cat of selected) scores[cat] = 1.0
      const vector = DIMENSION_ORDER.map(dim => scores[dim] ?? 0)

      await supabase.from('taste_fingerprints').upsert({
        user_id: session.user.id,
        vector,
        last_updated: new Date().toISOString(),
      })

      router.replace('/profile?fingerprint=1')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <button onClick={() => router.back()} className="text-sm text-white/50 hover:text-white transition">← back</button>
          <span className="font-serif italic text-xl text-white">your vibe</span>
          <span className="text-xs text-white/40 tabular-nums">{selected.size} picked</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-6 pb-32 flex flex-col gap-8">
        <div>
          <p className="text-sm text-white/70 leading-relaxed">
            Pick at least 3 things that feel like you. This builds your 74-point Taste Fingerprint — what powers your match score.
          </p>
        </div>

        {GROUPS.map(group => (
          <section key={group.label}>
            <p className="text-[10px] uppercase tracking-widest text-white/35 mb-3">{group.label}</p>
            <div className="flex flex-wrap gap-2">
              {group.items.map(({ id, emoji, label }) => {
                const on = selected.has(id)
                return (
                  <button
                    key={id}
                    onClick={() => toggle(id)}
                    className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition-all ${
                      on
                        ? 'border-white/60 bg-white/20 text-white shadow-[0_0_12px_rgba(255,255,255,0.12)]'
                        : 'border-white/10 bg-white/5 text-white/60 hover:border-white/30 hover:text-white/90'
                    }`}
                  >
                    <span className="text-base leading-none">{emoji}</span>
                    <span>{label}</span>
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </main>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 inset-x-0 border-t border-white/10 bg-black/60 backdrop-blur-xl px-6 py-4 z-20">
        <div className="mx-auto max-w-2xl">
          <button
            onClick={handleSave}
            disabled={selected.size < 3 || saving}
            className="w-full rounded-full py-3.5 text-sm font-medium transition-all disabled:cursor-not-allowed"
            style={{
              background: selected.size >= 3 ? '#ffffff' : 'rgba(255,255,255,0.08)',
              color: selected.size >= 3 ? '#000000' : 'rgba(255,255,255,0.25)',
            }}
          >
            {saving ? 'saving…' : selected.size < 3 ? `pick ${3 - selected.size} more` : `save my vibe (${selected.size} interests)`}
          </button>
        </div>
      </div>
    </div>
  )
}
