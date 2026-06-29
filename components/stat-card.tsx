import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  sub,
}: {
  label: string
  value: string
  icon: LucideIcon
  accent?: "primary" | "destructive" | "muted"
  sub?: string
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p
            className={cn(
              "mt-1 truncate text-2xl font-semibold tabular-nums tracking-tight",
              accent === "primary" && "text-primary",
              accent === "destructive" && "text-destructive",
            )}
          >
            {value}
          </p>
          {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
        </div>
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            accent === "primary" && "bg-primary/10 text-primary",
            accent === "destructive" && "bg-destructive/10 text-destructive",
            (!accent || accent === "muted") && "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="size-5" />
        </span>
      </CardContent>
    </Card>
  )
}
