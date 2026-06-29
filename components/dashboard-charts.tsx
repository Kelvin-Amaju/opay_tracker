"use client"

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { formatNaira } from "@/lib/analytics"
import type { CategoryPoint, MonthlyPoint } from "@/lib/analytics"

const CATEGORY_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "oklch(0.6 0.12 320)",
  "oklch(0.65 0.14 230)",
  "oklch(0.7 0.13 110)",
  "oklch(0.6 0.1 40)",
  "oklch(0.55 0.05 160)",
  "oklch(0.7 0.15 350)",
  "oklch(0.6 0.02 160)",
]

function compactNaira(n: number): string {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}m`
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}k`
  return `₦${n}`
}

function TooltipBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">{children}</div>
  )
}

export function MonthlyChart({ data }: { data: MonthlyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }} barGap={4}>
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
        />
        <YAxis
          tickFormatter={compactNaira}
          tickLine={false}
          axisLine={false}
          width={48}
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)", opacity: 0.4 }}
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null
            return (
              <TooltipBox>
                <p className="mb-1 font-medium text-foreground">{label}</p>
                {payload.map((p) => (
                  <p key={p.name} className="flex items-center justify-between gap-4">
                    <span className="capitalize text-muted-foreground">{p.name}</span>
                    <span className="font-medium tabular-nums text-foreground">
                      {formatNaira(Number(p.value))}
                    </span>
                  </p>
                ))}
              </TooltipBox>
            )
          }}
        />
        <Bar dataKey="income" name="income" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Bar dataKey="expenses" name="expenses" fill="var(--chart-5)" radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function CategoryChart({ data }: { data: CategoryPoint[] }) {
  const total = data.reduce((s, d) => s + d.amount, 0)
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <ResponsiveContainer width="100%" height={220} className="max-w-[220px]">
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="category"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
            stroke="var(--background)"
            strokeWidth={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const p = payload[0]
              const pct = total > 0 ? ((Number(p.value) / total) * 100).toFixed(0) : "0"
              return (
                <TooltipBox>
                  <p className="font-medium text-foreground">{p.name}</p>
                  <p className="text-muted-foreground">
                    {formatNaira(Number(p.value))} · {pct}%
                  </p>
                </TooltipBox>
              )
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <ul className="grid w-full flex-1 grid-cols-1 gap-2">
        {data.slice(0, 6).map((d, i) => {
          const pct = total > 0 ? Math.round((d.amount / total) * 100) : 0
          return (
            <li key={d.category} className="flex items-center justify-between gap-2 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                />
                <span className="truncate">{d.category}</span>
              </span>
              <span className="shrink-0 tabular-nums text-muted-foreground">{pct}%</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
