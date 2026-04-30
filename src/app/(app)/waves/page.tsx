'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSession, fetchWaves, formatScheduledTime, QUEST_TYPE_LABELS, DbWave, acceptWave } from '@/lib/api'
import { AIInsightBlock } from '@/components/ui/ai-insight-block'

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
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <span className="font-serif italic text-xl text-white">waves</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-6">
        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : waves.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-5 text-center">
            <span className="text-5xl text-white/20">〜</span>
            <div>
              <p className="text-sm font-medium text-white mb-1">no waves yet.</p>
              <p className="text-xs text-white/50">post a quest to get the ball rolling.</p>
            </div>
            <Link href="/compose"
              className="rounded-full border border-white/30 bg-white/5 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-white/10">
              post a quest
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-xs uppercase tracking-widest text-white/50">waves you got</p>
            {waves.map(w => (
              <WaveCard key={w.id} wave={w} onWaveBack={(id) =>
                setWaves(ws => ws.map(w => w.id === id ? { ...w, matched: true } : w))
              } />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function WaveCard({ wave, onWaveBack }: { wave: DbWave; onWaveBack: (id: string) => void }) {
  const [accepting, setAccepting] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const name = wave.sender?.display_name ?? 'someone'
  const avatarUrl = wave.sender?.avatar_url
  const initial = name[0]?.toUpperCase()
  const label = wave.quest?.quest_type ? QUEST_TYPE_LABELS[wave.quest.quest_type] : 'quest'
  const time = wave.quest?.scheduled_time ? formatScheduledTime(wave.quest.scheduled_time) : ''
  const location = wave.quest?.location_label

  async function handleWaveBack() {
    setAccepting(true)
    try {
      await acceptWave(wave.id)
      onWaveBack(wave.id)
    } catch {
      // silently fail — wave back still shows as sent optimistically
      onWaveBack(wave.id)
    } finally {
      setAccepting(false)
    }
  }

  if (dismissed) return null

  return (
    <div
      className="rounded-2xl border border-white/20 bg-black/60 backdrop-blur-xl overflow-hidden"
      style={{ boxShadow: '0 8px 32px -8px rgba(0,0,0,0.8)' }}
    >
      <div className="p-5 flex flex-col gap-4">
        {/* Sender row */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full overflow-hidden border border-white/20 bg-black/40">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-medium text-white/50">{initial}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-white truncate">{name}</p>
              {!wave.seen && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
              )}
            </div>
            <p className="text-xs text-white/50 truncate">
              {label}
              {location ? ` · ${location}` : ''}
              {time ? ` · ${time}` : ''}
            </p>
          </div>
        </div>

        {/* Icebreaker */}
        {wave.icebreaker
          ? <AIInsightBlock insight={wave.icebreaker} />
          : (
            <p className="text-xs italic text-white/40 font-serif leading-relaxed">
              generating icebreaker…
            </p>
          )
        }

        {/* Actions */}
        {wave.matched ? (
          <div className="flex items-center justify-center gap-2 py-2 text-sm text-emerald-400 font-medium">
            <span>✓</span> matched — go on that quest together
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleWaveBack}
              disabled={accepting}
              className="flex-1 rounded-full bg-white py-2.5 text-sm font-medium text-black transition hover:bg-white/85 disabled:opacity-50"
            >
              {accepting ? 'sending…' : 'wave back 👋'}
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="flex-1 rounded-full border border-white/20 py-2.5 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white/80 transition"
            >
              not this time
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
