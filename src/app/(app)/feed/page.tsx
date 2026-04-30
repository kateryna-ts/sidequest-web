'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  getSession, fetchFeedQuests, fetchMatchedQuests, ensureUserRecord,
  formatScheduledTime, DbQuest, MatchedQuest, QuestType, sendWave
} from '@/lib/api'

// Simplified filter set grouped by category
const CATEGORIES: { name: string; items: { label: string; type: QuestType | undefined }[] }[] = [
  {
    name: 'All',
    items: [
      { label: 'all', type: undefined },
    ]
  },
  {
    name: 'Food & Drink',
    items: [
      { label: '☕ coffee', type: 'coffee' },
      { label: '🥞 brunch', type: 'brunch' },
      { label: '🥗 lunch', type: 'lunch' },
      { label: '🍽️ dinner', type: 'dinner' },
      { label: '🍷 wine shop', type: 'wine_shop' },
    ]
  },
  {
    name: 'Shopping',
    items: [
      { label: '🌿 market', type: 'farmers_market' },
      { label: '📚 bookstore', type: 'bookstore' },
      { label: '🧥 thrift', type: 'thrift' },
      { label: '🎵 records', type: 'record_store' },
      { label: '🌱 plants', type: 'plant_nursery' },
    ]
  },
  {
    name: 'Active',
    items: [
      { label: '🏋️ gym', type: 'gym' },
      { label: '🧘 yoga', type: 'yoga' },
      { label: '🥾 hike', type: 'hike' },
    ]
  },
  {
    name: 'Culture',
    items: [
      { label: '🏛️ museum', type: 'museum' },
      { label: '🎬 cinema', type: 'cinema' },
      { label: '🎯 trivia', type: 'trivia' },
    ]
  },
  {
    name: 'Misc',
    items: [
      { label: '✦ other', type: 'other' },
    ]
  }
]

const EMOJI_MAP: Partial<Record<QuestType, string>> = {
  coffee: '☕', brunch: '🥞', lunch: '🥗', dinner: '🍽️', farmers_market: '🌿',
  bookstore: '📚', thrift: '🧥', record_store: '🎵', wine_shop: '🍷', plant_nursery: '🌱',
  gym: '🏋️', yoga: '🧘', hike: '🥾', run: '🏃', museum: '🏛️', gallery: '🖼️',
  cinema: '🎬', trivia: '🎯', other: '✦', grocery: '🛒', ikea: '🟡',
}

type FeedQuest = DbQuest | MatchedQuest

function isMatchedQuest(q: FeedQuest): q is MatchedQuest {
  return 'match_percent' in q
}

function isGoingSoon(scheduledTime: string): boolean {
  const diff = new Date(scheduledTime).getTime() - Date.now()
  return diff > 0 && diff < 2 * 60 * 60 * 1000
}

// ─── Quest card ───────────────────────────────────────────────────────────────
function QuestCard({ quest, currentUserId }: { quest: FeedQuest; currentUserId: string | null }) {
  const [expanded, setExpanded] = useState(false)
  const [icebreaker, setIcebreaker] = useState('')
  const [waving, setWaving] = useState(false)
  const [waved, setWaved] = useState(false)

  async function handleWave(e: React.MouseEvent | React.KeyboardEvent) {
    e.stopPropagation()
    if (!currentUserId || waved || waving) return
    setWaving(true)
    try {
      await sendWave(currentUserId, quest.user_id, quest.id, icebreaker.trim())
      setWaved(true)
      setTimeout(() => setExpanded(false), 2000)
    } catch (err) {
      console.error(err)
    } finally {
      setWaving(false)
    }
  }
  const name = quest.users?.display_name ?? 'someone'
  const blurb = quest.users?.personality_data?.personalityBlurb
  const tags = quest.users?.personality_data?.interestTags ?? []
  const matchPercent = isMatchedQuest(quest) ? quest.match_percent : null
  const distanceMiles = isMatchedQuest(quest) ? quest.distance_miles : null
  const photos: string[] = (quest as DbQuest & { photo_urls?: string[] }).photo_urls ?? []
  const emoji = EMOJI_MAP[quest.quest_type] ?? '✦'
  const label = quest.quest_type.replace(/_/g, ' ')
  const avatarUrl = quest.users?.avatar_url
  const initial = name[0]?.toUpperCase()
  const soon = isGoingSoon(quest.scheduled_time)

  return (
    <div 
      onClick={() => setExpanded(!expanded)}
      className="rounded-2xl border border-white/20 bg-black/60 backdrop-blur-xl overflow-hidden cursor-pointer transition hover:border-white/30"
      style={{ boxShadow: '0 8px 32px -8px rgba(0,0,0,0.8)' }}
    >
      {/* Photos */}
      {photos.length > 0 && (
        <div className={`flex gap-0.5 ${photos.length === 1 ? 'h-52' : 'h-40'}`}>
          {photos.slice(0, 3).map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={url} alt="" className={`object-cover ${photos.length === 1 ? 'w-full' : 'flex-1'}`} />
          ))}
        </div>
      )}

      <div className="p-5">
        {/* Top row: type pill + match + soon badge */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
              <span>{emoji}</span>
              <span>{label}</span>
            </span>
            {soon && (
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
                going soon
              </span>
            )}
          </div>
          {matchPercent != null && (
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-16 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${matchPercent}%` }} />
              </div>
              <span className="text-xs font-semibold text-emerald-400">{matchPercent}%</span>
            </div>
          )}
        </div>

        {/* User row */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full overflow-hidden border border-white/20 bg-black/40">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-medium text-white/50">
                {initial}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{name}</p>
            <p className="text-xs text-white/80 truncate">
              {quest.location_label ?? 'nearby'}
              {distanceMiles != null ? ` · ${distanceMiles} mi` : ''}
              {' · '}{formatScheduledTime(quest.scheduled_time)}
            </p>
          </div>
        </div>

        {/* Blurb */}
        {blurb && (
          <p className="text-xs italic text-white/90 line-clamp-2 font-serif mb-3 leading-relaxed">{blurb}</p>
        )}

        {/* Note */}
        {quest.note && (
          <p className="text-xs text-white bg-white/10 rounded-xl px-3 py-2 mb-3 leading-relaxed border border-white/10">
            "{quest.note}"
          </p>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tags.slice(0, 4).map(t => (
              <span key={t} className="rounded-full bg-white/10 border border-white/20 px-2.5 py-0.5 text-[10px] font-medium text-white/90">
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Wave Action */}
        <div className="mt-4 pt-4 border-t border-white/10" onClick={e => e.stopPropagation()}>
          {waved ? (
            <div className="flex items-center justify-center gap-2 py-2 text-sm text-emerald-400 font-medium">
              <span>✓</span> wave sent
            </div>
          ) : expanded ? (
            <div className="flex flex-col gap-3">
              <input
                type="text"
                autoFocus
                placeholder="add an icebreaker (optional)..."
                value={icebreaker}
                onChange={e => setIcebreaker(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleWave(e)}
                className="w-full rounded-xl border border-white/20 bg-black/40 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-white focus:outline-none transition"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setExpanded(false)}
                  className="flex-1 rounded-full border border-white/20 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  cancel
                </button>
                <button
                  onClick={handleWave}
                  disabled={waving || !currentUserId}
                  className="flex-1 rounded-full bg-white py-2.5 text-sm font-medium text-black transition hover:bg-white/80 disabled:opacity-50"
                >
                  {waving ? 'sending...' : 'send wave 👋'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setExpanded(true)
              }}
              className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
            >
              wave 👋
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main feed ────────────────────────────────────────────────────────────────
export default function FeedPage() {
  const [quests, setQuests] = useState<FeedQuest[]>([])
  const [filter, setFilter] = useState<QuestType | undefined>(undefined)
  const [filterLabel, setFilterLabel] = useState('all')
  const [activeParent, setActiveParent] = useState<string>('All')
  const [loading, setLoading] = useState(true)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const load = useCallback(async (uid: string, coords: { lat: number; lng: number } | null, questType?: QuestType) => {
    setLoading(true)
    try {
      if (coords) {
        setQuests(await fetchMatchedQuests(uid, coords.lat, coords.lng, questType))
      } else {
        const data = await fetchFeedQuests(uid)
        setQuests(questType ? data.filter(q => q.quest_type === questType) : data)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let coords: { lat: number; lng: number } | null = null;
    (async () => {
      const session = await getSession()
      if (!session) { setLoading(false); return }
      await ensureUserRecord(session.user.id)
      setUserId(session.user.id)

      await new Promise<void>(resolve => {
        if (!('geolocation' in navigator)) { resolve(); return }
        navigator.geolocation.getCurrentPosition(
          pos => { coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }; setUserCoords(coords); resolve() },
          () => resolve(),
          { timeout: 5000 },
        )
      })

      await load(session.user.id, coords)
    })()
  }, [load])

  function handleFilter(label: string, type: QuestType | undefined) {
    setFilterLabel(label)
    setFilter(type)
    if (userId) load(userId, userCoords, type)
  }

  const soonQuests = quests.filter(q => isGoingSoon(q.scheduled_time))
  const restQuests = quests.filter(q => !isGoingSoon(q.scheduled_time))

  return (
    <div className="min-h-screen">

      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <span className="font-serif italic text-xl text-white">side quest</span>
          <Link href="/compose"
            className="rounded-full border border-white/30 bg-white/5 px-4 py-2 text-xs font-medium text-white transition hover:bg-white/10">
            + post a quest
          </Link>
        </div>

        {/* Filter bar - Parent Categories */}
        <div className="flex gap-2 overflow-x-auto px-6 pt-2 pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button key={cat.name} onClick={() => {
              setActiveParent(cat.name)
              if (cat.name === 'All') handleFilter('all', undefined)
              else if (cat.items.length > 0) handleFilter(cat.items[0].label, cat.items[0].type)
            }}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition whitespace-nowrap ${
                activeParent === cat.name
                  ? 'border-white bg-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                  : 'border-white/10 bg-white/5 text-white/60 hover:text-white/90 hover:bg-white/10'
              }`}>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Subcategories (if not All) */}
        {activeParent !== 'All' && (
          <div className="flex gap-2 overflow-x-auto px-6 pb-3 scrollbar-none">
            {CATEGORIES.find(c => c.name === activeParent)?.items.map(({ label, type }) => (
              <button key={label} onClick={() => handleFilter(label, type)}
                className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium transition whitespace-nowrap ${
                  filterLabel === label
                    ? 'border-white/60 bg-white/15 text-white'
                    : 'border-white/5 bg-white/5 text-white/60 hover:text-white/90'
                }`}>
                {label}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="mx-auto max-w-2xl px-6 py-6">

        {!userCoords && !loading && (
          <p className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-300 backdrop-blur-sm">
            enable location for personalised match scores
          </p>
        )}

        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : quests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-5 text-center">
            <span className="text-5xl text-white/20">✦</span>
            <div>
              <p className="text-sm font-medium text-white mb-1">
                no quests near you yet.
              </p>
              <p className="text-xs text-white/50">
                be the first to post one.
              </p>
            </div>
            <Link href="/compose"
              className="rounded-full border border-white/30 bg-white/5 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-white/10">
              post a quest
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {soonQuests.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-xs uppercase tracking-widest text-emerald-400">going soon</p>
                {soonQuests.map(q => <QuestCard key={q.id} quest={q} currentUserId={userId} />)}
              </div>
            )}
            {restQuests.length > 0 && (
              <div className="flex flex-col gap-4">
                {soonQuests.length > 0 && (
                  <p className="text-xs uppercase tracking-widest text-white/50">all quests</p>
                )}
                <p className="text-xs text-white/50">
                  {quests.length} quest{quests.length !== 1 ? 's' : ''} near you
                </p>
                {restQuests.map(q => <QuestCard key={q.id} quest={q} currentUserId={userId} />)}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
