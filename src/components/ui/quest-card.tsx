import { cn } from "@/lib/utils"

interface QuestCardProps {
  name: string
  questType: string
  matchPercent: number
  neighborhood: string
  time: string
  interests: string[]
  aiInsight: string
  avatarInitials?: string
  onClick?: () => void
}

export function QuestCard({
  name,
  questType,
  matchPercent,
  neighborhood,
  time,
  interests,
  aiInsight,
  avatarInitials,
  onClick,
}: QuestCardProps) {
  return (
    <article
      onClick={onClick}
      className={cn(
        "group relative rounded-2xl border border-chalk bg-white p-5 transition-all duration-150 cursor-pointer",
        "hover:border-graphite hover:shadow-md active:scale-[0.99]",
        "dark:bg-obsidian dark:border-graphite dark:hover:border-chalk"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="rounded-full border border-chalk bg-linen px-3 py-1 text-xs font-medium text-graphite dark:border-graphite dark:bg-soot dark:text-chalk">
          {questType}
        </span>
        <span className="text-xs font-semibold tabular-nums text-graphite dark:text-chalk">
          {matchPercent}%
        </span>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-chalk bg-linen text-xs font-medium text-graphite dark:border-graphite dark:bg-soot dark:text-chalk">
          {avatarInitials ?? name[0]}
        </div>
        <div>
          <p className="text-sm font-medium text-ink dark:text-parchment">{name}</p>
          <p className="text-xs text-graphite dark:text-chalk">{neighborhood} · {time}</p>
        </div>
      </div>

      <p className="mb-3 line-clamp-1 font-serif italic text-sm text-graphite dark:text-chalk">
        {aiInsight}
      </p>

      <div className="flex flex-wrap gap-1.5">
        {interests.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-dune px-2.5 py-0.5 text-xs text-ink dark:bg-soot dark:text-parchment"
          >
            {tag}
          </span>
        ))}
      </div>
    </article>
  )
}
