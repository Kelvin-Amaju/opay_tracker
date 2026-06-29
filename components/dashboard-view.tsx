"use client"

import { ArrowDownLeft, ArrowUpRight, Receipt, TrendingDown, TrendingUp, Upload, Wallet } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"
import { CategoryBadge } from "@/components/category-badge"
import { CategoryChart, MonthlyChart } from "@/components/dashboard-charts"
import { StatCard } from "@/components/stat-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  categoryBreakdown,
  formatDate,
  formatNaira,
  listMonths,
  monthKey,
  monthLabel,
  monthlyBreakdown,
  summarize,
} from "@/lib/analytics"
import { useTransactions } from "@/lib/store"
import { cn } from "@/lib/utils"

export function DashboardView() {
  const { transactions } = useTransactions()
  const [month, setMonth] = useState<string>("all")

  const months = useMemo(() => listMonths(transactions), [transactions])
  const monthly = useMemo(() => monthlyBreakdown(transactions), [transactions])

  const filtered = useMemo(
    () => (month === "all" ? transactions : transactions.filter((t) => monthKey(t.date) === month)),
    [transactions, month],
  )

  const summary = useMemo(() => summarize(filtered), [filtered])
  const categories = useMemo(() => categoryBreakdown(filtered), [filtered])
  const recent = filtered.slice(0, 6)

  if (transactions.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-balance">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Your spending insights will appear here.</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Wallet className="size-8" />
            </span>
            <div>
              <p className="text-lg font-medium">No transactions yet</p>
              <p className="mt-1 max-w-sm text-muted-foreground">
                Upload your OPay statement to start tracking your income, expenses, and spending habits.
              </p>
            </div>
            <Button nativeButton={false} render={<Link href="/upload" />}>
              <Upload className="size-4" />
              Upload statement
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-balance">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            {month === "all" ? "All-time overview" : `Overview for ${monthLabel(month)}`}
          </p>
        </div>
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All months</SelectItem>
            {months.map((m) => (
              <SelectItem key={m} value={m}>
                {monthLabel(m)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Balance"
          value={formatNaira(summary.balance)}
          icon={Wallet}
          accent={summary.balance >= 0 ? "primary" : "destructive"}
        />
        <StatCard label="Income" value={formatNaira(summary.income)} icon={TrendingUp} accent="primary" />
        <StatCard label="Expenses" value={formatNaira(summary.expenses)} icon={TrendingDown} accent="destructive" />
        <StatCard label="Transactions" value={String(summary.count)} icon={Receipt} accent="muted" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Monthly income vs expenses</CardTitle>
            <CardDescription>Across all imported months</CardDescription>
          </CardHeader>
          <CardContent>
            {monthly.length > 0 ? (
              <MonthlyChart data={monthly} />
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">Not enough data.</p>
            )}
            <div className="mt-3 flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: "var(--chart-1)" }} />
                Income
              </span>
              <span className="flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: "var(--chart-5)" }} />
                Expenses
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Spending by category</CardTitle>
            <CardDescription>{month === "all" ? "All time" : monthLabel(month)}</CardDescription>
          </CardHeader>
          <CardContent>
            {categories.length > 0 ? (
              <CategoryChart data={categories} />
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">No expenses in this period.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent transactions</CardTitle>
              <CardDescription>Latest activity{month !== "all" ? ` in ${monthLabel(month)}` : ""}</CardDescription>
            </div>
            <Button nativeButton={false} render={<Link href="/transactions" />} variant="ghost" size="sm">
              View all
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <ul className="divide-y divide-border">
            {recent.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-2 py-3">
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full",
                    t.type === "income" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                  )}
                >
                  {t.type === "income" ? (
                    <ArrowDownLeft className="size-4" />
                  ) : (
                    <ArrowUpRight className="size-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.description}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(t.date)}</p>
                </div>
                <CategoryBadge category={t.category} className="hidden sm:inline-flex" />
                <span
                  className={cn(
                    "shrink-0 text-sm font-medium tabular-nums",
                    t.type === "income" ? "text-primary" : "text-foreground",
                  )}
                >
                  {t.type === "income" ? "+" : "-"}
                  {formatNaira(t.amount)}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
