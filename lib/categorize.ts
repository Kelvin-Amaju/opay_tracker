import type { Category, TransactionType } from "./types"

interface Rule {
  category: Category
  keywords: string[]
}

// Rule-based classification ordered by priority.
const RULES: Rule[] = [
  {
    category: "Airtime & Data",
    keywords: ["airtime", "data", "recharge", "mtn", "glo", "airtel", "9mobile", "etisalat", "topup", "top up", "vtu"],
  },
  {
    category: "Food & Dining",
    keywords: ["restaurant", "food", "eatery", "kfc", "dominos", "chicken", "kitchen", "cafe", "buka", "jevinik", "chowdeck", "glovo"],
  },
  {
    category: "Transport",
    keywords: ["uber", "bolt", "taxi", "transport", "fuel", "petrol", "filling station", "ride", "fare", "brt", "lagride"],
  },
  {
    category: "Shopping",
    keywords: ["jumia", "konga", "shop", "store", "mall", "market", "supermarket", "spar", "shoprite", "purchase", "pos"],
  },
  {
    category: "Bills & Utilities",
    keywords: ["electricity", "ikedc", "ekedc", "phcn", "nepa", "water", "dstv", "gotv", "startimes", "subscription", "bill", "internet", "wifi", "rent"],
  },
  {
    category: "Entertainment",
    keywords: ["netflix", "spotify", "showmax", "cinema", "game", "bet", "betting", "sportybet", "bet9ja", "movie"],
  },
  {
    category: "Savings & Investment",
    keywords: ["save", "savings", "owealth", "invest", "fixed", "target", "vault", "cowrywise", "piggyvest"],
  },
  {
    category: "Cash Withdrawal",
    keywords: ["withdraw", "withdrawal", "atm", "cash out", "cashout"],
  },
  {
    category: "Fees & Charges",
    keywords: ["fee", "charge", "vat", "stamp", "levy", "commission", "maintenance"],
  },
  {
    category: "Transfer",
    keywords: ["transfer", "sent to", "received from", "to ", "from ", "trf", "payment to", "bank"],
  },
]

export function categorize(description: string, type: TransactionType): Category {
  if (type === "income") {
    // Still allow specific income-side detection, otherwise generic Income.
    const lower = description.toLowerCase()
    if (lower.includes("save") || lower.includes("owealth") || lower.includes("interest")) {
      return "Savings & Investment"
    }
    return "Income"
  }

  const lower = description.toLowerCase()
  for (const rule of RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return rule.category
    }
  }
  return "Other"
}
