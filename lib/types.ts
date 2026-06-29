export type TransactionType = "income" | "expense"

export type Category =
  | "Airtime & Data"
  | "Transfer"
  | "Food & Dining"
  | "Shopping"
  | "Bills & Utilities"
  | "Transport"
  | "Entertainment"
  | "Savings & Investment"
  | "Cash Withdrawal"
  | "Fees & Charges"
  | "Income"
  | "Other"

export interface Transaction {
  id: string
  date: string // ISO string
  description: string
  amount: number // always positive
  type: TransactionType
  category: Category
}

export const CATEGORIES: Category[] = [
  "Airtime & Data",
  "Transfer",
  "Food & Dining",
  "Shopping",
  "Bills & Utilities",
  "Transport",
  "Entertainment",
  "Savings & Investment",
  "Cash Withdrawal",
  "Fees & Charges",
  "Income",
  "Other",
]
