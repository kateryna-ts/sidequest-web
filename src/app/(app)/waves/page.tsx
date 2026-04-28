'use client'

import { useEffect, useState } from 'react'
import { getSession, fetchWaves, formatScheduledTime, QUEST_TYPE_LABELS, DbWave } from '@/lib/api'
import { AIInsightBlock } from '@/components/ui/ai-insight-block'
import Link from 'next/link'

export default function WavesPage() {
  const [waves, setWaves] = useState<DbWave[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const session = await getSession()
      if (!session) { setLoading(false); return }
      setWaves(await fetchWaves(session.user.id))
      setLoading(false)
    })()
  }, [])

  return (
    <div className="min-h-screen bg-parchment dark:bg-ink">
      <header className="sticky top-0 z-10 border-b border-chalk bg-parchment/80 backdrop-blur dark:border-graphite dark:bg-ink/80">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <span className="font-serif italic text-xl text-ink dark:text-parchment">waves</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <p className="text-sm text-graphite dark:text-chalk">loading…</p>
          </div>
        ) : waves.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3 text-center">
            <p className="text-sm text-graphite dark:text-chalk">
              no waves yet.<br />post a quest to get the ball rolling.
            </p>
            <Link href="/compose" className="mt-4 rounded-full border border-chalk px-6 py-2 text-sm text-graphite hover:border-graphite hover:text-ink transition dark:border-graphite dark:text-chalk">
              post a quest
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <p className="text-xs uppercase tracking-widest text-graphite dark:text-chalk">waves you got</p>
            {waves.map((w) => <WaveCard key={w.id} wave={w} />)}
          </div>
        )}
      </main>
    </div>
  )
}

function WaveCard({ wave }: { wave: DbWave }) {
  const name = wave.sender?.display_name ?? 'someone'
  const label = wave.quest?.quest_type ? QUEST_TYPE_LABELS[wave.quest.quest_type] : 'quest'
  const time = wave.quest?.scheduled_time ? formatScheduledTime(wave.quest.scheduled_time) : ''

  return (
    <div className="rounded-2xl border border-chalk bg-white p-5 flex flex-col gap-4 dark:bg-obsidian dark:border-graphite">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linen border border-chalk text-xs font-medium text-graphite dark:bg-soot dark:border-graphite dark:text-chalk">
          {name[0]?.toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-ink dark:text-parchment">{name}</p>
            {!wave.seen && <span className="h-1.5 w-1.5 rounded-full bg-sq-blue" />}
          </div>
          <p className="text-xs text-graphite dark:text-chalk">{label} · {time}</p>
        </div>
      </div>

      {wave.icebreaker
        ? <AIInsightBlock insight={wave.icebreaker} />
        : <p className="text-xs italic text-graphite dark:text-chalk">generating icebreaker…</p>}

      <div className="flex gap-3">
        <button className="flex-1 rounded-full bg-sq-blue py-2.5 text-sm font-medium text-white hover:bg-sq-blue/85 transition">
          wave back
        </button>
        <button className="flex-1 rounded-full border border-chalk py-2.5 text-sm font-medium text-graphite hover:border-graphite hover:text-ink transition dark:border-graphite dark:text-chalk">
          not this time
        </button>
      </div>
    </div>
  )
}
