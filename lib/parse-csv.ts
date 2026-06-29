import { categorize } from "./categorize"
import type { Transaction, TransactionType } from "./types"

export interface ParseResult {
  transactions: Transaction[]
  errors: string[]
  skipped: number
}

// Parse a single line of CSV respecting quoted fields.
function parseLine(line: string): string[] {
  const result: string[] = []
  let cur = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cur += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ",") {
      result.push(cur.trim())
      cur = ""
    } else {
      cur += ch
    }
  }
  result.push(cur.trim())
  return result
}

function findColumn(headers: string[], candidates: string[]): number {
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].toLowerCase().replace(/[^a-z0-9]/g, "")
    for (const c of candidates) {
      if (h.includes(c)) return i
    }
  }
  return -1
}

function parseAmount(raw: string): number {
  if (!raw) return NaN
  const cleaned = raw.replace(/[₦$,\s]/g, "").replace(/[()]/g, "")
  return Number.parseFloat(cleaned)
}

function parseDate(raw: string): string | null {
  if (!raw) return null
  let d = new Date(raw)
  if (!Number.isNaN(d.getTime())) return d.toISOString()

  // Try DD/MM/YYYY or DD-MM-YYYY
  const m = raw.match(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/)
  if (m) {
    let [, dd, mm, yyyy] = m
    if (yyyy.length === 2) yyyy = "20" + yyyy
    d = new Date(Number(yyyy), Number(mm) - 1, Number(dd))
    if (!Number.isNaN(d.getTime())) return d.toISOString()
  }
  return null
}

export function parseCsv(text: string): ParseResult {
  const errors: string[] = []
  const transactions: Transaction[] = []
  let skipped = 0

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  if (lines.length < 2) {
    return { transactions, errors: ["File appears to be empty or has no data rows."], skipped: 0 }
  }

  const headers = parseLine(lines[0])

  const dateCol = findColumn(headers, ["date", "transactiondate", "time", "datetime"])
  const descCol = findColumn(headers, ["description", "narration", "remark", "details", "particulars", "memo", "reference"])
  const amountCol = findColumn(headers, ["amount", "value"])
  const typeCol = findColumn(headers, ["type", "drcr", "transactiontype", "category"])
  const debitCol = findColumn(headers, ["debit", "moneyout", "withdrawal", "outflow"])
  const creditCol = findColumn(headers, ["credit", "moneyin", "deposit", "inflow"])

  if (dateCol === -1 || (amountCol === -1 && debitCol === -1 && creditCol === -1)) {
    return {
      transactions,
      errors: [
        "Could not detect required columns. Make sure your CSV has a date column and an amount (or debit/credit) column.",
      ],
      skipped: 0,
    }
  }

  for (let i = 1; i < lines.length; i++) {
    const cells = parseLine(lines[i])
    const dateRaw = dateCol >= 0 ? cells[dateCol] : ""
    const iso = parseDate(dateRaw)
    if (!iso) {
      skipped++
      continue
    }

    const description = descCol >= 0 ? cells[descCol] || "Transaction" : "Transaction"

    let amount = NaN
    let type: TransactionType = "expense"

    if (debitCol >= 0 || creditCol >= 0) {
      const debit = debitCol >= 0 ? parseAmount(cells[debitCol]) : NaN
      const credit = creditCol >= 0 ? parseAmount(cells[creditCol]) : NaN
      if (!Number.isNaN(credit) && credit > 0) {
        amount = credit
        type = "income"
      } else if (!Number.isNaN(debit) && debit > 0) {
        amount = debit
        type = "expense"
      }
    } else {
      const raw = cells[amountCol]
      amount = parseAmount(raw)
      // Determine type from sign, parentheses, or a type column.
      const negative = /^-/.test(raw?.trim() ?? "") || /\(.*\)/.test(raw ?? "")
      if (typeCol >= 0) {
        const t = (cells[typeCol] || "").toLowerCase()
        if (t.includes("credit") || t.includes("cr") || t.includes("in") || t.includes("income") || t.includes("deposit")) {
          type = "income"
        } else {
          type = "expense"
        }
      } else {
        type = negative ? "expense" : amount >= 0 ? "income" : "expense"
      }
    }

    if (Number.isNaN(amount) || amount === 0) {
      skipped++
      continue
    }

    amount = Math.abs(amount)
    const category = categorize(description, type)

    transactions.push({
      id: `${iso}-${i}-${Math.random().toString(36).slice(2, 8)}`,
      date: iso,
      description,
      amount,
      type,
      category,
    })
  }

  if (transactions.length === 0 && skipped > 0) {
    errors.push("No valid transactions found. Please check the file format.")
  }

  return { transactions, errors, skipped }
}
