"use client"

import { Download, Search, Trash2, Upload } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { CategoryBadge } from "@/components/category-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatDate, formatNaira, listMonths, monthKey, monthLabel, toCsv } from "@/lib/analytics"
import { useTransactions } from "@/lib/store"
import { CATEGORIES, type Category } from "@/lib/types"
import { cn } from "@/lib/utils"

type TypeFilter = "all" | "income" | "expense"

export function TransactionsView() {
  const { transactions, updateCategory, deleteTransaction, clearAll } = useTransactions()
  const [query, setQuery] = useState("")
  const [month, setMonth] = useState("all")
  const [type, setType] = useState<TypeFilter>("all")
  const [category, setCategory] = useState<string>("all")

  const months = useMemo(() => listMonths(transactions), [transactions])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return transactions.filter((t) => {
      if (month !== "all" && monthKey(t.date) !== month) return false
      if (type !== "all" && t.type !== type) return false
      if (category !== "all" && t.category !== category) return false
      if (q && !t.description.toLowerCase().includes(q)) return false
      return true
    })
  }, [transactions, query, month, type, category])

  function handleExport() {
    const csv = toCsv(filtered)
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "opay-transactions.csv"
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${filtered.length} transactions`)
  }

  function handleClear() {
    if (confirm("Delete ALL transactions? This cannot be undone.")) {
      clearAll()
      toast.success("All data cleared")
    }
  }

  if (transactions.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <p className="text-lg font-medium">No transactions yet</p>
            <p className="max-w-sm text-muted-foreground">Upload a statement to see your transactions here.</p>
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
          <p className="mt-1 text-muted-foreground">
            {filtered.length} of {transactions.length} transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="size-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="size-4" />
            Clear all
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative flex-1 sm:min-w-[220px]">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search description..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="sm:w-40">
              <SelectValue placeholder="Month" />
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
          <Select value={type} onValueChange={(v) => setType(v as TypeFilter)}>
            <SelectTrigger className="sm:w-36">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="sm:w-44">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">No transactions match your filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Description</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 text-right font-medium">Amount</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatDate(t.date)}</td>
                      <td className="max-w-[240px] truncate px-4 py-3 font-medium">{t.description}</td>
                      <td className="px-4 py-3">
                        <Select
                          value={t.category}
                          onValueChange={(v) => updateCategory(t.id, v as Category)}
                        >
                          <SelectTrigger className="h-8 w-auto gap-1 border-0 bg-transparent p-0 shadow-none hover:opacity-80 focus:ring-0">
                            <CategoryBadge category={t.category} />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td
                        className={cn(
                          "whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums",
                          t.type === "income" ? "text-primary" : "text-foreground",
                        )}
                      >
                        {t.type === "income" ? "+" : "-"}
                        {formatNaira(t.amount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteTransaction(t.id)}
                          aria-label="Delete transaction"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
