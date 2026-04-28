import { cn } from "@/lib/utils"

interface AIInsightBlockProps {
  insight: string
  matchScore?: number
  sharedInterests?: string[]
  className?: string
}

export function AIInsightBlock({ insight, matchScore, sharedInterests, className }: AIInsightBlockProps) {
  return (
    <div className={cn(
      "rounded-xl border border-l-[3px] border-chalk border-l-dune bg-linen p-4",
      "dark:border-graphite dark:border-l-dune dark:bg-soot",
      className
    )}>
      <p className="mb-2 text-[10px] uppercase tracking-widest text-graphite dark:text-chalk">
        our read on them
      </p>
      <p className="font-serif italic text-sm leading-relaxed text-ink dark:text-parchment">
        {insight}
      </p>
      {sharedInterests && sharedInterests.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {sharedInterests.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-dune px-2.5 py-0.5 text-xs text-ink dark:bg-obsidian dark:text-parchment"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
