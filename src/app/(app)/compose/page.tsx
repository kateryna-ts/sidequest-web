'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { getSession, signInAnonymously, ensureUserRecord, postQuest, QuestType } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Slider } from '@/components/ui/slider'

// ─── Grouped quest categories ─────────────────────────────────────────────
const CATEGORIES: { name: string; items: { id: QuestType; label: string; emoji: string }[] }[] = [
  {
    name: 'Food & Drink',
    items: [
      { id: 'coffee',        label: 'coffee',    emoji: '☕' },
      { id: 'brunch',        label: 'brunch',    emoji: '🥞' },
      { id: 'lunch',         label: 'lunch',     emoji: '🥗' },
      { id: 'dinner',        label: 'dinner',    emoji: '🍽️' },
      { id: 'wine_shop',     label: 'wine shop', emoji: '🍷' },
    ]
  },
  {
    name: 'Shopping',
    items: [
      { id: 'farmers_market',label: 'market',    emoji: '🌿' },
      { id: 'bookstore',     label: 'bookstore', emoji: '📚' },
      { id: 'thrift',        label: 'thrift',    emoji: '🧥' },
      { id: 'record_store',  label: 'records',   emoji: '🎵' },
      { id: 'plant_nursery', label: 'plants',    emoji: '🌱' },
    ]
  },
  {
    name: 'Active',
    items: [
      { id: 'gym',           label: 'gym',       emoji: '🏋️' },
      { id: 'yoga',          label: 'yoga',      emoji: '🧘' },
      { id: 'hike',          label: 'hike',      emoji: '🥾' },
    ]
  },
  {
    name: 'Culture',
    items: [
      { id: 'museum',        label: 'museum',    emoji: '🏛️' },
      { id: 'cinema',        label: 'cinema',    emoji: '🎬' },
      { id: 'trivia',        label: 'trivia',    emoji: '🎯' },
    ]
  },
  {
    name: 'Misc',
    items: [
      { id: 'other',         label: 'other',     emoji: '✦' },
    ]
  }
]

// ─── Time slots ───────────────────────────────────────────────────────────────
const TIME_SLOTS: { label: string; hour: number; minute: number }[] = []
for (let h = 6; h <= 22; h++) {
  TIME_SLOTS.push({ label: `${h === 12 ? 12 : h > 12 ? h - 12 : h}:00 ${h < 12 ? 'AM' : 'PM'}`, hour: h, minute: 0 })
  if (h < 22) TIME_SLOTS.push({ label: `${h === 12 ? 12 : h > 12 ? h - 12 : h}:30 ${h < 12 ? 'AM' : 'PM'}`, hour: h, minute: 30 })
}
const TICK_INTERVAL = 4

type DayMode = 'today' | 'tomorrow' | 'this_week' | 'custom'

function buildScheduledTime(mode: DayMode, customDate: string, slotHour: number, slotMinute: number): Date {
  const date = mode === 'custom' && customDate
    ? new Date(customDate + 'T00:00:00')
    : new Date()
  if (mode === 'tomorrow') date.setDate(date.getDate() + 1)
  else if (mode === 'this_week') {
    const daysUntilSat = (6 - date.getDay() + 7) % 7 || 7
    date.setDate(date.getDate() + daysUntilSat)
  }
  date.setHours(slotHour, slotMinute, 0, 0)
  return date
}

// ─── Photo upload ─────────────────────────────────────────────────────────────
function PhotoUpload({ photos, onChange }: { photos: string[]; onChange: (urls: string[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFiles(files: FileList | null) {
    if (!files || photos.length >= 3) return
    const toUpload = Array.from(files).slice(0, 3 - photos.length)
    setUploading(true)
    try {
      const urls: string[] = []
      for (const file of toUpload) {
        const ext = file.name.split('.').pop() ?? 'jpg'
        const path = `${crypto.randomUUID()}.${ext}`
        const { error } = await supabase.storage.from('quest-photos').upload(path, file, { upsert: false })
        if (!error) {
          const { data } = supabase.storage.from('quest-photos').getPublicUrl(path)
          urls.push(data.publicUrl)
        }
      }
      onChange([...photos, ...urls])
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      {photos.map((url, i) => (
        <div key={url} className="relative h-16 w-16 rounded-xl overflow-hidden border border-parchment/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="h-full w-full object-cover" />
          <button onClick={() => onChange(photos.filter((_, j) => j !== i))}
            className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white text-xs">×</button>
        </div>
      ))}
      {photos.length < 3 && (
        <button onClick={() => inputRef.current?.click()} disabled={uploading}
          className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-parchment/20 text-parchment/30 transition hover:border-parchment/40 hover:text-parchment/60 disabled:opacity-50">
          {uploading
            ? <span className="text-[10px]">uploading…</span>
            : <><span className="text-xl leading-none">+</span><span className="text-[10px]">photo</span></>
          }
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
    </div>
  )
}

const inputCls = "w-full bg-parchment/5 border border-parchment/15 rounded-2xl py-3.5 px-5 text-sm text-parchment placeholder:text-parchment/25 focus:outline-none focus:border-parchment/35 transition"
const sectionLabel = "mb-3 text-xs uppercase tracking-widest text-parchment/40"

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ComposePage() {
  const router = useRouter()
  const [selectedType, setSelectedType] = useState<QuestType | null>(null)
  const [otherLabel, setOtherLabel] = useState('')
  const [dayMode, setDayMode] = useState<DayMode>('today')
  const [customDate, setCustomDate] = useState('')
  const [sliderIndex, setSliderIndex] = useState(8)
  const [locationLabel, setLocationLabel] = useState('')
  const [note, setNote] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')

  const selectedSlot = TIME_SLOTS[sliderIndex]
  const canPost = selectedType && (selectedType !== 'other' || otherLabel.trim()) &&
    (dayMode !== 'custom' || customDate)

  const dayLabels: Record<DayMode, string> = {
    today: 'Today', tomorrow: 'Tomorrow', this_week: 'This Weekend',
    custom: customDate
      ? new Date(customDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : 'Pick date',
  }
  const timePreview = `${dayLabels[dayMode]} · ${selectedSlot.label}`

  async function handlePost() {
    if (!canPost || posting) return
    setPosting(true)
    setError('')
    try {
      let session = await getSession()
      if (!session) session = await signInAnonymously()
      if (!session) throw new Error('not signed in')
      await ensureUserRecord(session.user.id)

      let lat = 40.7128, lon = -74.006, label = locationLabel.trim() || 'nearby'
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        await new Promise<void>(resolve => {
          navigator.geolocation.getCurrentPosition(
            pos => { lat = pos.coords.latitude; lon = pos.coords.longitude; resolve() },
            () => resolve(), { timeout: 6000 },
          )
        })
      }

      const quest = await postQuest({
        userId: session.user.id,
        questType: selectedType!,
        latitude: lat, longitude: lon,
        locationLabel: label,
        scheduledTime: buildScheduledTime(dayMode, customDate, selectedSlot.hour, selectedSlot.minute),
        note: selectedType === 'other' && otherLabel.trim()
          ? `${otherLabel.trim()}${note ? ' — ' + note : ''}`
          : note,
      })

      if (photos.length > 0 && quest?.id) {
        await supabase.from('quests').update({ photo_urls: photos }).eq('id', quest.id)
      }
      router.push('/feed')
    } catch {
      setError('could not post. try again.')
      setPosting(false)
    }
  }

  return (
    <div className="min-h-screen text-white">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <button onClick={() => router.back()} className="text-sm text-white/50 transition hover:text-white">← back</button>
          <span className="font-serif italic text-xl text-white">post a quest</span>
          <div className="w-16" />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8 flex flex-col gap-10">

        {/* ── What ─────────────────────────────────────────────────────── */}
        <section>
          <p className={sectionLabel}>what are you doing?</p>
          <div className="flex flex-col gap-6">
            {CATEGORIES.map(category => (
              <div key={category.name}>
                <p className="text-[10px] uppercase tracking-widest text-white/30 mb-3">{category.name}</p>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                  {category.items.map(({ id, label, emoji }) => (
                    <button key={id} onClick={() => setSelectedType(id)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 rounded-2xl border py-3 px-2 text-center transition-all',
                        selectedType === id
                          ? 'border-white/60 bg-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.15)]'
                          : 'border-white/10 bg-white/5 text-white/50 hover:border-white/30 hover:text-white/80',
                      )}>
                      <span className="text-xl leading-none">{emoji}</span>
                      <span className="text-[10px] leading-tight">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {selectedType === 'other' && (
            <div className="mt-3">
              <input autoFocus type="text"
                value={otherLabel} onChange={e => setOtherLabel(e.target.value.slice(0, 50))}
                placeholder="what is it? e.g. ceramics class, vintage fair…"
                className={inputCls} />
            </div>
          )}
        </section>

        {/* ── When ─────────────────────────────────────────────────────── */}
        <section>
          <p className={sectionLabel}>when?</p>

          <div className="grid grid-cols-2 gap-2 mb-4 sm:grid-cols-4">
            {(['today', 'tomorrow', 'this_week'] as DayMode[]).map(mode => (
              <button key={mode} onClick={() => setDayMode(mode)}
                className={cn(
                  'rounded-full border py-2.5 text-sm transition-all',
                  dayMode === mode
                    ? 'border-parchment/60 bg-parchment/10 text-parchment'
                    : 'border-parchment/15 text-parchment/40 hover:border-parchment/30 hover:text-parchment/70',
                )}>
                {mode === 'today' ? 'Today' : mode === 'tomorrow' ? 'Tomorrow' : 'This Weekend'}
              </button>
            ))}
            <button onClick={() => setDayMode('custom')}
              className={cn(
                'rounded-full border py-2.5 text-sm transition-all',
                dayMode === 'custom'
                  ? 'border-parchment/60 bg-parchment/10 text-parchment'
                  : 'border-parchment/15 text-parchment/40 hover:border-parchment/30 hover:text-parchment/70',
              )}>
              {dayMode === 'custom' && customDate
                ? new Date(customDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : '📅 pick date'}
            </button>
          </div>

          {dayMode === 'custom' && (
            <div className="mb-4">
              <input type="date" value={customDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setCustomDate(e.target.value)}
                className={inputCls} />
            </div>
          )}

          <div className="px-1">
            <Slider min={0} max={TIME_SLOTS.length - 1} step={1}
              value={[sliderIndex]} onValueChange={([v]) => setSliderIndex(v)}
              showTooltip tooltipContent={v => TIME_SLOTS[v]?.label ?? ''}
              aria-label="Select time" />
            <div className="mt-3 flex w-full items-start justify-between px-2.5 text-[10px] text-parchment/25">
              {TIME_SLOTS.map((slot, i) => (
                <span key={i} className="flex w-0 flex-col items-center gap-1.5">
                  <span className={cn('w-px bg-parchment/15', i % TICK_INTERVAL === 0 ? 'h-2' : 'h-1')} />
                  <span className={cn(i % TICK_INTERVAL !== 0 && 'opacity-0')}>
                    {slot.hour % 12 === 0 ? 12 : slot.hour % 12}{slot.minute === 0 ? '' : ':30'}{slot.hour < 12 ? 'a' : 'p'}
                  </span>
                </span>
              ))}
            </div>
          </div>
          <p className="mt-3 text-center text-sm text-parchment/70">{timePreview}</p>
        </section>

        {/* ── Where ────────────────────────────────────────────────────── */}
        <section>
          <p className={sectionLabel}>where? <span className="normal-case opacity-60">(optional)</span></p>
          <input type="text" value={locationLabel} onChange={e => setLocationLabel(e.target.value)}
            placeholder="neighbourhood, area, or specific spot…"
            className={inputCls} />
        </section>

        {/* ── Note ─────────────────────────────────────────────────────── */}
        <section>
          <p className={sectionLabel}>add a note? <span className="normal-case opacity-60">(optional)</span></p>
          <div className="relative">
            <textarea value={note} onChange={e => setNote(e.target.value.slice(0, 120))}
              placeholder="e.g. need a bookshelf, will definitely leave with a plant…"
              rows={3}
              className="w-full resize-none bg-parchment/5 border border-parchment/15 rounded-2xl px-5 py-3.5 text-sm text-parchment placeholder:text-parchment/25 focus:outline-none focus:border-parchment/35 transition leading-relaxed" />
            <span className="absolute bottom-3 right-4 text-xs text-parchment/20 tabular-nums">{note.length}/120</span>
          </div>
        </section>

        {/* ── Photos ───────────────────────────────────────────────────── */}
        <section>
          <p className={sectionLabel}>photos <span className="normal-case opacity-60">(optional, up to 3)</span></p>
          <PhotoUpload photos={photos} onChange={setPhotos} />
        </section>

        {error && <p className="text-sm text-red-400 text-center">{error}</p>}

        {/* ── Post button ──────────────────────────────────────────────── */}
        <button onClick={handlePost} disabled={!canPost || posting}
          className={cn(
            'w-full rounded-full py-4 text-sm font-medium transition-all',
            canPost && !posting
              ? 'bg-parchment text-ink hover:bg-parchment/90'
              : 'bg-parchment/10 text-parchment/30 cursor-not-allowed',
          )}>
          {posting ? 'posting…' : 'post the quest'}
        </button>

        <div className="h-8" />
      </main>
    </div>
  )
}
