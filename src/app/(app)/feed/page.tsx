'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  getSession, fetchFeedQuests, fetchMatchedQuests, ensureUserRecord,
  formatScheduledTime, DbQuest, MatchedQuest, QuestType,
} from '@/lib/api'

// All 28 types grouped for the filter bar
const FILTER_GROUPS = [
  { label: 'all', type: undefined },
  { label: 'grocery', type: 'grocery' },
  { label: 'farmers market', type: 'farmers_market' },
  { label: 'coffee', type: 'coffee' },
  { label: 'bookstore', type: 'bookstore' },
  { label: 'thrift', type: 'thrift' },
  { label: 'ikea', type: 'ikea' },
  { label: 'brunch', type: 'brunch' },
  { label: 'lunch', type: 'lunch' },
  { label: 'tea', type: 'tea' },
  { label: 'boba', type: 'boba' },
  { label: 'ice cream', type: 'ice_cream' },
  { label: 'food market', type: 'food_market' },
  { label: 'gym', type: 'gym' },
  { label: 'yoga', type: 'yoga' },
  { label: 'run', type: 'run' },
  { label: 'hike', type: 'hike' },
  { label: 'museum', type: 'museum' },
  { label: 'gallery', type: 'gallery' },
  { label: 'cinema', type: 'cinema' },
  { label: 'trivia', type: 'trivia' },
  { label: 'hardware', type: 'hardware' },
  { label: 'pharmacy', type: 'pharmacy' },
  { label: 'record store', type: 'record_store' },
  { label: 'plant nursery', type: 'plant_nursery' },
  { label: 'wine shop', type: 'wine_shop' },
  { label: 'art supply', type: 'art_supply' },
  { label: 'pet store', type: 'pet_store' },
  { label: 'post office', type: 'post_office' },
  { label: 'other', type: 'other' },
] as { label: string; type: QuestType | undefined }[]

type FeedQuest = DbQuest | MatchedQuest

function isMatchedQuest(q: FeedQuest): q is MatchedQuest {
  return 'match_percent' in q
}

function isGoingSoon(scheduledTime: string): boolean {
  const diff = new Date(scheduledTime).getTime() - Date.now()
  return diff > 0 && diff < 2 * 60 * 60 * 1000 // within 2 hours
}

// ─── Quest card ───────────────────────────────────────────────────────────────
function WebQuestCard({ quest, highlight }: { quest: FeedQuest; highlight?: boolean }) {
  const name = quest.users?.display_name ?? 'someone'
  const blurb = quest.users?.personality_data?.personalityBlurb
  const tags = quest.users?.personality_data?.interestTags ?? []
  const matchPercent = isMatchedQuest(quest) ? quest.match_percent : null
  const distanceMiles = isMatchedQuest(quest) ? quest.distance_miles : null
  const photos: string[] = (quest as DbQuest & { photo_urls?: string[] }).photo_urls ?? []
  const label = quest.quest_type.replace('_', ' ')
  const initial = name[0]?.toUpperCase()
  const avatarUrl = quest.users?.avatar_url

  return (
    <div className={`rounded-2xl border bg-white flex flex-col dark:bg-obsidian overflow-hidden transition ${
      highlight ? 'border-sq-blue/40' : 'border-chalk dark:border-graphite'
    }`}>
      {/* Photos */}
      {photos.length > 0 && (
        <div className={`flex gap-0.5 ${photos.length === 1 ? 'h-48' : 'h-36'}`}>
          {photos.slice(0, 3).map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={url}
              alt=""
              className={`object-cover ${photos.length === 1 ? 'w-full' : 'flex-1'}`}
            />
          ))}
        </div>
      )}

      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-chalk bg-linen px-3 py-1 text-xs font-medium text-graphite dark:border-graphite dark:bg-soot dark:text-chalk">
              {label}
            </span>
            {highlight && (
              <span className="rounded-full bg-sq-blue/10 px-2.5 py-1 text-[10px] font-semibold text-sq-blue">
                going soon
              </span>
            )}
          </div>
          {matchPercent != null && (
            <span className="rounded-full bg-dune/20 px-3 py-1 text-xs font-semibold text-graphite dark:text-chalk">
              {matchPercent}% match
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full overflow-hidden border border-chalk dark:border-graphite">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-linen text-xs font-medium text-graphite dark:bg-soot dark:text-chalk">
                {initial}
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-ink dark:text-parchment">{name}</p>
            <p className="text-xs text-graphite dark:text-chalk">
              {quest.location_label ?? 'nearby'}
              {distanceMiles != null ? ` · ${distanceMiles} mi` : ''}
              {' · '}{formatScheduledTime(quest.scheduled_time)}
            </p>
          </div>
        </div>

        {blurb && (
          <p className="text-xs italic text-graphite dark:text-chalk line-clamp-1 font-serif">{blurb}</p>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 3).map((t) => (
              <span key={t} className="rounded-full bg-dune/20 px-2.5 py-0.5 text-[10px] font-medium text-graphite dark:text-chalk">
                {t}
              </span>
            ))}
          </div>
        )}

        {quest.note && (
          <p className="text-xs text-graphite dark:text-chalk border-t border-chalk dark:border-graphite pt-3">
            {quest.note}
          </p>
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
      <header className="sticky top-0 z-10 border-b border-chalk bg-parchment/80 backdrop-blur dark:border-graphite dark:bg-ink/80">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <span className="font-serif italic text-xl text-ink dark:text-parchment">side quest</span>
          <Link href="/compose" className="rounded-full bg-sq-blue px-4 py-1.5 text-xs font-medium text-white transition hover:bg-sq-blue/85">
            + post a quest
          </Link>
        </div>
        {/* Filter bar */}
        <div className="flex gap-2 overflow-x-auto px-6 pb-3 pt-1 scrollbar-none">
          {FILTER_GROUPS.map(({ label, type }) => (
            <button
              key={label}
              onClick={() => handleFilter(label, type)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                filterLabel === label
                  ? 'border-sq-blue bg-sq-blue/10 text-sq-blue'
                  : 'border-chalk bg-white text-graphite hover:border-graphite hover:text-ink dark:border-graphite dark:bg-obsidian dark:text-chalk'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-6">
        {!userCoords && !loading && (
          <p className="mb-4 rounded-xl border border-dune/30 bg-dune/10 px-4 py-2.5 text-xs text-graphite dark:text-chalk">
            enable location for match scores
          </p>
        )}

        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 rounded-2xl border border-chalk bg-white animate-pulse dark:border-graphite dark:bg-obsidian" />
            ))}
          </div>
        ) : quests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
            <p className="text-4xl">✦</p>
            <p className="text-sm text-graphite dark:text-chalk">
              no {filterLabel !== 'all' ? filterLabel + ' ' : ''}quests nearby yet.<br />be the first to post one.
            </p>
            <Link href="/compose" className="mt-1 rounded-full border border-chalk px-6 py-2.5 text-sm text-graphite hover:border-graphite hover:text-ink transition dark:border-graphite dark:text-chalk">
              post a quest
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Going soon strip */}
            {soonQuests.length > 0 && (
              <div className="flex flex-col gap-3">
                <p className="text-xs uppercase tracking-widest text-sq-blue">going soon</p>
                {soonQuests.map(q => <WebQuestCard key={q.id} quest={q} highlight />)}
              </div>
            )}

            {/* Main feed */}
            {restQuests.length > 0 && (
              <div className="flex flex-col gap-4">
                {soonQuests.length > 0 && (
                  <p className="text-xs uppercase tracking-widest text-graphite dark:text-chalk">all quests</p>
                )}
                <p className="text-xs text-graphite dark:text-chalk">{quests.length} quest{quests.length !== 1 ? 's' : ''} near you</p>
                {restQuests.map(q => <WebQuestCard key={q.id} quest={q} />)}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
