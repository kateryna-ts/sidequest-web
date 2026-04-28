'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { getSession, signInAnonymously, ensureUserRecord, postQuest, QuestType } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Slider } from '@/components/ui/slider'
import { LiquidButton } from '@/components/ui/liquid-glass-button'

// ─── Quest type definitions ──────────────────────────────────────────────────
const QUEST_GROUPS: { label: string; items: { id: QuestType; label: string; emoji: string }[] }[] = [
  {
    label: 'Shopping',
    items: [
      { id: 'grocery', label: 'Grocery', emoji: '🛒' },
      { id: 'farmers_market', label: 'Farmers Market', emoji: '🌿' },
      { id: 'bookstore', label: 'Bookstore', emoji: '📚' },
      { id: 'ikea', label: 'IKEA', emoji: '🟡' },
      { id: 'thrift', label: 'Thrift Store', emoji: '🧥' },
      { id: 'hardware', label: 'Hardware', emoji: '🔧' },
      { id: 'pharmacy', label: 'Pharmacy', emoji: '💊' },
      { id: 'record_store', label: 'Record Store', emoji: '🎵' },
      { id: 'plant_nursery', label: 'Plant Nursery', emoji: '🌱' },
      { id: 'wine_shop', label: 'Wine Shop', emoji: '🍷' },
      { id: 'art_supply', label: 'Art Supply', emoji: '🎨' },
      { id: 'pet_store', label: 'Pet Store', emoji: '🐾' },
    ],
  },
  {
    label: 'Food & Drink',
    items: [
      { id: 'coffee', label: 'Coffee', emoji: '☕' },
      { id: 'tea', label: 'Tea', emoji: '🍵' },
      { id: 'brunch', label: 'Brunch', emoji: '🥞' },
      { id: 'lunch', label: 'Lunch', emoji: '🥗' },
      { id: 'dinner', label: 'Dinner', emoji: '🍽️' },
      { id: 'happy_hour', label: 'Happy Hour', emoji: '🍸' },
      { id: 'food_market', label: 'Food Market', emoji: '🏪' },
      { id: 'boba', label: 'Boba', emoji: '🧋' },
      { id: 'ice_cream', label: 'Ice Cream', emoji: '🍦' },
    ],
  },
  {
    label: 'Social',
    items: [
      { id: 'party', label: 'Party', emoji: '🎉' },
      { id: 'trivia', label: 'Trivia Night', emoji: '🎯' },
    ],
  },
  {
    label: 'Wellness',
    items: [
      { id: 'gym', label: 'Gym', emoji: '🏋️' },
      { id: 'yoga', label: 'Yoga', emoji: '🧘' },
      { id: 'run', label: 'Run', emoji: '🏃' },
      { id: 'hike', label: 'Hike', emoji: '🥾' },
    ],
  },
  {
    label: 'Culture',
    items: [
      { id: 'museum', label: 'Museum', emoji: '🏛️' },
      { id: 'gallery', label: 'Gallery', emoji: '🖼️' },
      { id: 'cinema', label: 'Cinema', emoji: '🎬' },
    ],
  },
  {
    label: 'Errands',
    items: [
      { id: 'post_office', label: 'Post Office', emoji: '📬' },
      { id: 'other', label: 'Other', emoji: '✦' },
    ],
  },
]

// ─── Time data ───────────────────────────────────────────────────────────────
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
        <div key={url} className="relative h-16 w-16 rounded-xl overflow-hidden border border-chalk dark:border-graphite">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="h-full w-full object-cover" />
          <button onClick={() => onChange(photos.filter((_, j) => j !== i))}
            className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white text-xs">×</button>
        </div>
      ))}
      {photos.length < 3 && (
        <button onClick={() => inputRef.current?.click()} disabled={uploading}
          className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-chalk text-chalk transition hover:border-graphite hover:text-graphite dark:border-graphite dark:text-graphite dark:hover:border-chalk dark:hover:text-chalk disabled:opacity-50">
          {uploading ? <span className="text-[10px]">uploading…</span> : <><span className="text-xl leading-none">+</span><span className="text-[10px]">photo</span></>}
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
    </div>
  )
}

// ─── Main compose page ────────────────────────────────────────────────────────
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
    custom: customDate ? new Date(customDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Pick date',
  }
  const timePreview = `${dayLabels[dayMode]} at ${selectedSlot.label}`

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
        note: selectedType === 'other' && otherLabel.trim() ? `${otherLabel.trim()}${note ? ' — ' + note : ''}` : note,
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
    <div className="min-h-screen bg-parchment dark:bg-ink">
      <header className="sticky top-0 z-10 border-b border-chalk bg-parchment/80 backdrop-blur dark:border-graphite dark:bg-ink/80">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <button onClick={() => router.back()} className="text-sm text-graphite transition hover:text-ink dark:text-chalk dark:hover:text-parchment">← back</button>
          <span className="font-serif italic text-xl text-ink dark:text-parchment">post a quest</span>
          <div className="w-10" />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8 flex flex-col gap-10">

        {/* ── Category ───────────────────────────────────────────────── */}
        <section>
          <p className="mb-4 text-xs uppercase tracking-widest text-graphite dark:text-chalk">what are you doing?</p>
          <div className="flex flex-col gap-6">
            {QUEST_GROUPS.map(group => (
              <div key={group.label}>
                <p className="mb-2 text-[10px] uppercase tracking-widest text-chalk dark:text-graphite">{group.label}</p>
                <div className="flex flex-wrap gap-2">
                  {group.items.map(({ id, label, emoji }) => (
                    <button key={id} onClick={() => setSelectedType(id)}
                      className={cn(
                        'flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-all',
                        selectedType === id
                          ? 'border-sq-blue bg-sq-blue/10 text-sq-blue'
                          : 'border-chalk bg-white text-graphite hover:border-graphite hover:text-ink dark:border-graphite dark:bg-obsidian dark:text-chalk',
                      )}>
                      <span>{emoji}</span><span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* "Other" description box */}
          {selectedType === 'other' && (
            <div className="mt-4">
              <input
                autoFocus
                type="text"
                value={otherLabel}
                onChange={e => setOtherLabel(e.target.value.slice(0, 50))}
                placeholder="what is it? (e.g. ceramics class, vintage fair…)"
                className="w-full rounded-xl border border-chalk bg-white px-4 py-3 text-sm text-ink placeholder:text-chalk focus:border-ink focus:outline-none dark:border-graphite dark:bg-obsidian dark:text-parchment dark:placeholder:text-graphite dark:focus:border-parchment"
              />
            </div>
          )}
        </section>

        {/* ── When ───────────────────────────────────────────────────── */}
        <section>
          <p className="mb-4 text-xs uppercase tracking-widest text-graphite dark:text-chalk">when?</p>

          {/* Day buttons + calendar */}
          <div className="grid grid-cols-2 gap-2 mb-2 sm:grid-cols-4">
            {(['today', 'tomorrow', 'this_week'] as DayMode[]).map(mode => (
              <button key={mode} onClick={() => setDayMode(mode)}
                className={cn(
                  'rounded-full border py-2.5 text-sm transition-all',
                  dayMode === mode
                    ? 'border-sq-blue bg-sq-blue/10 text-sq-blue'
                    : 'border-chalk bg-white text-graphite hover:border-graphite dark:border-graphite dark:bg-obsidian dark:text-chalk',
                )}>
                {mode === 'today' ? 'Today' : mode === 'tomorrow' ? 'Tomorrow' : 'This Weekend'}
              </button>
            ))}
            {/* Calendar picker */}
            <div className="relative">
              <button
                onClick={() => setDayMode('custom')}
                className={cn(
                  'w-full rounded-full border py-2.5 text-sm transition-all',
                  dayMode === 'custom'
                    ? 'border-sq-blue bg-sq-blue/10 text-sq-blue'
                    : 'border-chalk bg-white text-graphite hover:border-graphite dark:border-graphite dark:bg-obsidian dark:text-chalk',
                )}>
                {dayMode === 'custom' && customDate
                  ? new Date(customDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : '📅 Pick date'}
              </button>
            </div>
          </div>

          {/* Show date input when custom is selected */}
          {dayMode === 'custom' && (
            <div className="mb-4">
              <input
                type="date"
                value={customDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setCustomDate(e.target.value)}
                className="w-full rounded-xl border border-chalk bg-white px-4 py-3 text-sm text-ink focus:border-ink focus:outline-none dark:border-graphite dark:bg-obsidian dark:text-parchment dark:focus:border-parchment"
              />
            </div>
          )}

          {/* Time slider */}
          <div className="px-1 mt-4">
            <Slider
              min={0} max={TIME_SLOTS.length - 1} step={1}
              value={[sliderIndex]}
              onValueChange={([v]) => setSliderIndex(v)}
              showTooltip
              tooltipContent={v => TIME_SLOTS[v]?.label ?? ''}
              aria-label="Select time"
            />
            <div className="mt-3 flex w-full items-start justify-between px-2.5 text-[10px] text-graphite dark:text-chalk">
              {TIME_SLOTS.map((slot, i) => (
                <span key={i} className="flex w-0 flex-col items-center gap-1.5">
                  <span className={cn('w-px bg-chalk dark:bg-graphite', i % TICK_INTERVAL === 0 ? 'h-2' : 'h-1')} />
                  <span className={cn(i % TICK_INTERVAL !== 0 && 'opacity-0')}>
                    {slot.hour % 12 === 0 ? 12 : slot.hour % 12}{slot.minute === 0 ? '' : ':30'}{slot.hour < 12 ? 'a' : 'p'}
                  </span>
                </span>
              ))}
            </div>
          </div>

          <p className="mt-3 text-center text-sm font-medium text-ink dark:text-parchment">{timePreview}</p>
        </section>

        {/* ── Location ───────────────────────────────────────────────── */}
        <section>
          <p className="mb-4 text-xs uppercase tracking-widest text-graphite dark:text-chalk">where? <span className="normal-case">(optional)</span></p>
          <input type="text" value={locationLabel} onChange={e => setLocationLabel(e.target.value)}
            placeholder="e.g. East Village, Brooklyn, Capitol Hill…"
            className="w-full rounded-xl border border-chalk bg-white px-4 py-3 text-sm text-ink placeholder:text-chalk focus:border-graphite focus:outline-none dark:border-graphite dark:bg-obsidian dark:text-parchment dark:placeholder:text-graphite" />
        </section>

        {/* ── Note ───────────────────────────────────────────────────── */}
        <section>
          <p className="mb-4 text-xs uppercase tracking-widest text-graphite dark:text-chalk">anything to add? <span className="normal-case">(optional)</span></p>
          <div className="relative">
            <textarea value={note} onChange={e => setNote(e.target.value.slice(0, 120))}
              placeholder="need a bookshelf, will definitely leave with a plant…"
              rows={3}
              className="w-full resize-none rounded-xl border border-chalk bg-white px-4 py-3 text-sm text-ink placeholder:text-chalk focus:border-graphite focus:outline-none dark:border-graphite dark:bg-obsidian dark:text-parchment dark:placeholder:text-graphite" />
            <span className="absolute bottom-3 right-3 text-xs text-chalk dark:text-graphite tabular-nums">{note.length}/120</span>
          </div>
        </section>

        {/* ── Photos ─────────────────────────────────────────────────── */}
        <section>
          <p className="mb-4 text-xs uppercase tracking-widest text-graphite dark:text-chalk">photos <span className="normal-case">(optional, up to 3)</span></p>
          <PhotoUpload photos={photos} onChange={setPhotos} />
        </section>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {/* Liquid glass post button */}
        <div className="w-full">
          <LiquidButton
            size="xl"
            disabled={!canPost || posting}
            onClick={handlePost}
            className={cn(
              'w-full text-sm font-medium',
              canPost && !posting
                ? 'bg-sq-blue text-white hover:bg-sq-blue/85'
                : 'bg-chalk/50 text-graphite cursor-not-allowed dark:bg-soot/50 dark:text-graphite',
            )}
          >
            {posting ? 'posting…' : 'post the quest'}
          </LiquidButton>
        </div>
      </main>
    </div>
  )
}
