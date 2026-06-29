import type { Category } from "@/lib/types"
import { cn } from "@/lib/utils"

const COLORS: Record<Category, string> = {
  "Airtime & Data": "bg-sky-500/12 text-sky-700 dark:text-sky-300",
  Transfer: "bg-violet-500/12 text-violet-700 dark:text-violet-300",
  "Food & Dining": "bg-amber-500/12 text-amber-700 dark:text-amber-300",
  Shopping: "bg-pink-500/12 text-pink-700 dark:text-pink-300",
  "Bills & Utilities": "bg-orange-500/12 text-orange-700 dark:text-orange-300",
  Transport: "bg-teal-500/12 text-teal-700 dark:text-teal-300",
  Entertainment: "bg-fuchsia-500/12 text-fuchsia-700 dark:text-fuchsia-300",
  "Savings & Investment": "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  "Cash Withdrawal": "bg-rose-500/12 text-rose-700 dark:text-rose-300",
  "Fees & Charges": "bg-red-500/12 text-red-700 dark:text-red-300",
  Income: "bg-primary/12 text-primary",
  Other: "bg-muted text-muted-foreground",
}

export function CategoryBadge({ category, className }: { category: Category; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium",
        COLORS[category],
        className,
      )}
    >
      {category}
    </span>
  )
}
