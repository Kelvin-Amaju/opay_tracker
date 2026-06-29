"use client"

import { useCallback, useSyncExternalStore } from "react"
import type { Transaction } from "./types"

const STORAGE_KEY = "opay-expense-tracker:transactions"
const EVENT = "opay-store-change"

let cache: Transaction[] | null = null

function read(): Transaction[] {
  if (cache) return cache
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    cache = raw ? (JSON.parse(raw) as Transaction[]) : []
  } catch {
    cache = []
  }
  return cache
}

function write(next: Transaction[]) {
  cache = next
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    window.dispatchEvent(new Event(EVENT))
  }
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {}
  const handler = () => callback()
  window.addEventListener(EVENT, handler)
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) {
      cache = null
      callback()
    }
  })
  return () => {
    window.removeEventListener(EVENT, handler)
  }
}

const EMPTY: Transaction[] = []

export function useTransactions() {
  const transactions = useSyncExternalStore(
    subscribe,
    () => read(),
    () => EMPTY,
  )

  const addTransactions = useCallback((incoming: Transaction[]) => {
    const current = read()
    // De-duplicate by date+description+amount+type to avoid double-importing the same statement.
    const seen = new Set(current.map((t) => `${t.date}|${t.description}|${t.amount}|${t.type}`))
    const merged = [...current]
    let added = 0
    for (const t of incoming) {
      const key = `${t.date}|${t.description}|${t.amount}|${t.type}`
      if (!seen.has(key)) {
        seen.add(key)
        merged.push(t)
        added++
      }
    }
    merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    write(merged)
    return added
  }, [])

  const updateCategory = useCallback((id: string, category: Transaction["category"]) => {
    const next = read().map((t) => (t.id === id ? { ...t, category } : t))
    write(next)
  }, [])

  const deleteTransaction = useCallback((id: string) => {
    write(read().filter((t) => t.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    write([])
  }, [])

  return { transactions, addTransactions, updateCategory, deleteTransaction, clearAll }
}
