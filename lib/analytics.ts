import type { Category, Transaction } from "./types"

export function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function monthKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

export function monthLabel(key: string): string {
  const [y, m] = key.split("-")
  const d = new Date(Number(y), Number(m) - 1, 1)
  return d.toLocaleDateString("en-NG", { month: "short", year: "numeric" })
}

export interface Summary {
  income: number
  expenses: number
  balance: number
  count: number
}

export function summarize(transactions: Transaction[]): Summary {
  let income = 0
  let expenses = 0
  for (const t of transactions) {
    if (t.type === "income") income += t.amount
    else expenses += t.amount
  }
  return { income, expenses, balance: income - expenses, count: transactions.length }
}

export function listMonths(transactions: Transaction[]): string[] {
  const set = new Set(transactions.map((t) => monthKey(t.date)))
  return Array.from(set).sort((a, b) => b.localeCompare(a))
}

export interface MonthlyPoint {
  key: string
  label: string
  income: number
  expenses: number
}

export function monthlyBreakdown(transactions: Transaction[]): MonthlyPoint[] {
  const map = new Map<string, MonthlyPoint>()
  for (const t of transactions) {
    const key = monthKey(t.date)
    if (!map.has(key)) {
      map.set(key, { key, label: monthLabel(key), income: 0, expenses: 0 })
    }
    const point = map.get(key)!
    if (t.type === "income") point.income += t.amount
    else point.expenses += t.amount
  }
  return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key))
}

export interface CategoryPoint {
  category: Category
  amount: number
}

export function categoryBreakdown(transactions: Transaction[]): CategoryPoint[] {
  const map = new Map<Category, number>()
  for (const t of transactions) {
    if (t.type !== "expense") continue
    map.set(t.category, (map.get(t.category) ?? 0) + t.amount)
  }
  return Array.from(map.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
}

export interface DailyPoint {
  date: string
  label: string
  spending: number
}

export function dailySpending(transactions: Transaction[]): DailyPoint[] {
  const map = new Map<string, number>()
  for (const t of transactions) {
    if (t.type !== "expense") continue
    const d = new Date(t.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    map.set(key, (map.get(key) ?? 0) + t.amount)
  }
  return Array.from(map.entries())
    .map(([date, spending]) => ({
      date,
      label: new Date(date).toLocaleDateString("en-NG", { day: "2-digit", month: "short" }),
      spending,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function toCsv(transactions: Transaction[]): string {
  const header = "Date,Description,Type,Category,Amount"
  const rows = transactions.map((t) =>
    [
      new Date(t.date).toISOString().slice(0, 10),
      `"${t.description.replace(/"/g, '""')}"`,
      t.type,
      `"${t.category}"`,
      t.amount,
    ].join(","),
  )
  return [header, ...rows].join("\n")
}
