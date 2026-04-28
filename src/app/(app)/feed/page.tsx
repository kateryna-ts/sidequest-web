'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  getSession, fetchFeedQuests, fetchMatchedQuests, ensureUserRecord,
  formatScheduledTime, DbQuest, MatchedQuest, QuestType,
} from '@/lib/api'

// Simplified filter set matching the compose categories
const FILTERS: { label: string; type: QuestType | undefined }[] = [
  { label: 'all', type: undefined },
  { label: '☕ coffee', type: 'coffee' },
  { label: '🥞 brunch', type: 'brunch' },
  { label: '🥗 lunch', type: 'lunch' },
  { label: '🍽️ dinner', type: 'dinner' },
  { label: '🌿 market', type: 'farmers_market' },
  { label: '📚 bookstore', type: 'bookstore' },
  { label: '🧥 thrift', type: 'thrift' },
  { label: '🎵 records', type: 'record_store' },
  { label: '🍷 wine', type: 'wine_shop' },
  { label: '🌱 plants', type: 'plant_nursery' },
  { label: '🏋️ gym', type: 'gym' },
  { label: '🧘 yoga', type: 'yoga' },
  { label: '🥾 hike', type: 'hike' },
  { label: '🏛️ museum', type: 'museum' },
  { label: '🎬 cinema', type: 'cinema' },
  { label: '🎯 trivia', type: 'trivia' },
  { label: '✦ other', type: 'other' },
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
function QuestCard({ quest }: { quest: FeedQuest }) {
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
    <div className="rounded-2xl border border-chalk/60 bg-white overflow-hidden dark:border-graphite dark:bg-obsidian">
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
            <span className="flex items-center gap-1.5 rounded-full bg-linen px-3 py-1 text-xs font-medium text-graphite dark:bg-soot dark:text-chalk">
              <span>{emoji}</span>
              <span>{label}</span>
            </span>
            {soon && (
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                going soon
              </span>
            )}
          </div>
          {matchPercent != null && (
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-16 rounded-full bg-chalk dark:bg-graphite overflow-hidden">
                <div className="h-full rounded-full bg-ink dark:bg-parchment transition-all" style={{ width: `${matchPercent}%` }} />
              </div>
              <span className="text-xs font-semibold text-ink dark:text-parchment">{matchPercent}%</span>
            </div>
          )}
        </div>

        {/* User row */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full overflow-hidden border border-chalk dark:border-graphite">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-linen text-sm font-medium text-graphite dark:bg-soot dark:text-chalk">
                {initial}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-ink dark:text-parchment truncate">{name}</p>
            <p className="text-xs text-graphite dark:text-chalk truncate">
              {quest.location_label ?? 'nearby'}
              {distanceMiles != null ? ` · ${distanceMiles} mi` : ''}
              {' · '}{formatScheduledTime(quest.scheduled_time)}
            </p>
          </div>
        </div>

        {/* Blurb */}
        {blurb && (
          <p className="text-xs italic text-graphite dark:text-chalk line-clamp-2 font-serif mb-3 leading-relaxed">{blurb}</p>
        )}

        {/* Note */}
        {quest.note && (
          <p className="text-xs text-graphite dark:text-chalk bg-linen/60 dark:bg-soot/40 rounded-xl px-3 py-2 mb-3 leading-relaxed">
            "{quest.note}"
          </p>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 4).map(t => (
              <span key={t} className="rounded-full bg-dune/30 px-2.5 py-0.5 text-[10px] font-medium text-graphite dark:text-chalk">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main feed ────────────────────────────────────────────────────────────────
export default function FeedPage() {
  const [quests, setQuests] = useState<FeedQuest[]>([])
  const [filter, setFilter] = useState<QuestType | undefined>(undefined)
  const [filterLabel, setFilterLabel] = useState('all')
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
    <div className="min-h-screen bg-parchment dark:bg-ink">

      <header className="sticky top-0 z-10 border-b border-chalk bg-parchment/90 backdrop-blur dark:border-graphite/60 dark:bg-ink/90">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <span className="font-serif italic text-xl text-ink dark:text-parchment">side quest</span>
          <Link href="/compose"
            className="rounded-full bg-ink px-4 py-2 text-xs font-medium text-parchment transition hover:bg-graphite dark:bg-parchment dark:text-ink dark:hover:bg-chalk">
            + post a quest
          </Link>
        </div>

        {/* Filter bar */}
        <div className="flex gap-2 overflow-x-auto px-6 pb-3 scrollbar-none">
          {FILTERS.map(({ label, type }) => (
            <button key={label} onClick={() => handleFilter(label, type)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition whitespace-nowrap ${
                filterLabel === label
                  ? 'border-ink bg-ink text-parchment dark:border-parchment dark:bg-parchment dark:text-ink'
                  : 'border-chalk bg-white text-graphite hover:border-graphite dark:border-graphite dark:bg-obsidian dark:text-chalk'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-6">

        {!userCoords && !loading && (
          <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-700 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-400">
            enable location for personalised match scores
          </p>
        )}

        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 rounded-2xl border border-chalk bg-white animate-pulse dark:border-graphite dark:bg-obsidian" />
            ))}
          </div>
        ) : quests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-5 text-center">
            <span className="text-5xl">✦</span>
            <div>
              <p className="text-sm font-medium text-ink dark:text-parchment mb-1">
                no quests near you yet.
              </p>
              <p className="text-xs text-graphite dark:text-chalk">
                be the first to post one.
              </p>
            </div>
            <Link href="/compose"
              className="rounded-full border border-ink px-6 py-2.5 text-sm font-medium text-ink transition hover:bg-ink hover:text-parchment dark:border-parchment dark:text-parchment dark:hover:bg-parchment dark:hover:text-ink">
              post a quest
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {soonQuests.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-xs uppercase tracking-widest text-amber-600 dark:text-amber-400">going soon</p>
                {soonQuests.map(q => <QuestCard key={q.id} quest={q} />)}
              </div>
            )}
            {restQuests.length > 0 && (
              <div className="flex flex-col gap-4">
                {soonQuests.length > 0 && (
                  <p className="text-xs uppercase tracking-widest text-graphite dark:text-chalk">all quests</p>
                )}
                <p className="text-xs text-graphite dark:text-chalk">
                  {quests.length} quest{quests.length !== 1 ? 's' : ''} near you
                </p>
                {restQuests.map(q => <QuestCard key={q.id} quest={q} />)}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
