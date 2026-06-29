import { categorize } from "./categorize"
import type { Transaction, TransactionType } from "./types"
import type { ParseResult } from "./parse-csv"

// Set up the PDF.js GlobalWorkerOptions using a dynamic import of the library.
// Since PDF.js operates in the browser, we run it conditionally.
let pdfjsLib: any = null;

async function initPdfjs() {
  if (pdfjsLib) return pdfjsLib;
  if (typeof window === "undefined") return null;

  try {
    // Dynamically import pdfjs-dist
    pdfjsLib = await import("pdfjs-dist");
    
    // Configure worker CDN matching the pdfjs-dist version using jsDelivr
    const version = pdfjsLib.version || "6.1.200";
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
    
    return pdfjsLib;
  } catch (error) {
    console.error("Failed to initialize PDF.js:", error);
    throw new Error("Could not initialize PDF parser. Please try again.");
  }
}

interface TextItem {
  str: string
  x: number
  y: number
  width: number
  height: number
}

function parseAmount(raw: string): number {
  if (!raw) return NaN
  // Remove currency symbols, commas, spaces and parentheses
  const cleaned = raw.replace(/[₦$,\s]/g, "").replace(/[()]/g, "")
  return Number.parseFloat(cleaned)
}

function parsePdfDate(raw: string): string | null {
  if (!raw) return null
  const cleaned = raw.trim()
  
  // Try direct Date constructor
  let d = new Date(cleaned)
  if (!Number.isNaN(d.getTime())) return d.toISOString()

  // Match DD/MM/YYYY or DD-MM-YYYY
  const m = cleaned.match(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/)
  if (m) {
    let [, dd, mm, yyyy] = m
    if (yyyy.length === 2) yyyy = "20" + yyyy
    d = new Date(Number(yyyy), Number(mm) - 1, Number(dd))
    if (!Number.isNaN(d.getTime())) return d.toISOString()
  }
  return null
}

export async function parsePdf(arrayBuffer: ArrayBuffer): Promise<ParseResult> {
  const errors: string[] = []
  const transactions: Transaction[] = []
  let skipped = 0

  const pdfjs = await initPdfjs()
  if (!pdfjs) {
    return { transactions, errors: ["PDF parser can only be run in the browser."], skipped: 0 }
  }

  try {
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise

    let colXMap: {
      date?: number
      desc?: number
      amount?: number
      debit?: number
      credit?: number
      balance?: number
      ref?: number
    } = {}

    let activeTx: Transaction | null = null

    // Process page by page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      
      const items = textContent.items as any[]
      const textItems: TextItem[] = items
        .filter((item) => typeof item.str === "string" && item.str.trim() !== "")
        .map((item) => ({
          str: item.str,
          x: item.transform[4],
          y: item.transform[5],
          width: item.width,
          height: item.height,
        }))

      if (textItems.length === 0) continue

      // Group text items into rows by Y coordinate with a tolerance of 4px
      const rows: TextItem[][] = []
      for (const item of textItems) {
        let added = false
        for (const row of rows) {
          if (Math.abs(row[0].y - item.y) < 4) {
            row.push(item)
            added = true
            break
          }
        }
        if (!added) {
          rows.push([item])
        }
      }

      // Sort rows top-to-bottom (Y descending)
      rows.sort((a, b) => b[0].y - a[0].y)

      // Sort items within each row left-to-right (X ascending)
      for (const row of rows) {
        row.sort((a, b) => a.x - b.x)
      }

      // Scan rows to detect headers and parse transactions
      for (const row of rows) {
        const rowStr = row.map((item) => item.str.toLowerCase()).join(" ")

        // 1. Check if this looks like a header row
        const hasDate = row.some((item) => {
          const s = item.str.toLowerCase()
          return s.includes("date") || s.includes("time")
        })
        const hasDesc = row.some((item) => {
          const s = item.str.toLowerCase()
          return s.includes("description") || s.includes("narration") || s.includes("particulars") || s.includes("remark") || s.includes("details")
        })
        const hasAmount = row.some((item) => {
          const s = item.str.toLowerCase()
          return s.includes("amount") || s.includes("value") || s.includes("debit") || s.includes("credit") || s.includes("money")
        })
        const hasBalance = row.some((item) => {
          const s = item.str.toLowerCase()
          return s.includes("balance")
        })

        if ((hasDate && hasDesc && hasAmount) || (hasDate && hasAmount && hasBalance)) {
          // Identify/update coordinates of headers
          row.forEach((item) => {
            const s = item.str.toLowerCase()
            if (s.includes("date") || s.includes("time")) {
              colXMap.date = item.x
            } else if (s.includes("description") || s.includes("narration") || s.includes("particulars") || s.includes("remark") || s.includes("details")) {
              colXMap.desc = item.x
            } else if (s.includes("balance")) {
              colXMap.balance = item.x
            } else if (s.includes("debit")) {
              colXMap.debit = item.x
            } else if (s.includes("credit")) {
              colXMap.credit = item.x
            } else if (s.includes("amount") || s.includes("value")) {
              colXMap.amount = item.x
            } else if (s.includes("reference") || s.includes("ref") || s.includes("trans id") || s.includes("transaction id")) {
              colXMap.ref = item.x
            }
          })
          continue // skip header row itself
        }

        // 2. Parse table rows if headers have been located
        if (colXMap.date || colXMap.amount || colXMap.debit || colXMap.credit) {
          // Group items in this row by closest header X coordinate
          const getColumnKey = (x: number) => {
            let closestKey = ""
            let minDiff = Infinity
            for (const [key, colX] of Object.entries(colXMap)) {
              if (colX === undefined) continue
              const diff = Math.abs(x - colX)
              if (diff < minDiff) {
                minDiff = diff
                closestKey = key
              }
            }
            // Allow matching only if reasonably aligned (within 160px)
            return minDiff < 160 ? closestKey : ""
          }

          const colValues: Record<string, string[]> = {}
          for (const item of row) {
            const colKey = getColumnKey(item.x)
            if (colKey) {
              if (!colValues[colKey]) colValues[colKey] = []
              colValues[colKey].push(item.str)
            }
          }

          const dateVal = (colValues.date || []).join(" ").trim()
          const descVal = (colValues.desc || []).join(" ").trim()
          const amountVal = (colValues.amount || []).join(" ").trim()
          const debitVal = (colValues.debit || []).join(" ").trim()
          const creditVal = (colValues.credit || []).join(" ").trim()

          const parsedDate = parsePdfDate(dateVal)

          if (parsedDate) {
            // New transaction row detected
            let amount = NaN
            let type: TransactionType = "expense"

            if (debitVal || creditVal) {
              const debit = parseAmount(debitVal)
              const credit = parseAmount(creditVal)
              if (!Number.isNaN(credit) && credit > 0) {
                amount = credit
                type = "income"
              } else if (!Number.isNaN(debit) && debit > 0) {
                amount = debit
                type = "expense"
              }
            } else if (amountVal) {
              amount = parseAmount(amountVal)
              // Guess type based on negative sign or color/prefix, default to expense
              const isNegative = amountVal.startsWith("-") || amountVal.includes("-")
              const isPositive = amountVal.startsWith("+") || amountVal.includes("+")
              if (isPositive) {
                type = "income"
              } else if (isNegative) {
                type = "expense"
              } else {
                // If unsigned, look at description or fallback to expense
                type = amount >= 0 ? "income" : "expense"
              }
            }

            if (!Number.isNaN(amount) && amount !== 0) {
              const cleanAmount = Math.abs(amount)
              const finalType = type
              const finalDesc = descVal || "Transaction"
              const category = categorize(finalDesc, finalType)

              activeTx = {
                id: `${parsedDate}-${transactions.length}-${Math.random().toString(36).slice(2, 8)}`,
                date: parsedDate,
                description: finalDesc,
                amount: cleanAmount,
                type: finalType,
                category,
              }
              transactions.push(activeTx)
            } else {
              skipped++
            }
          } else {
            // No valid date found. If we have activeTx and some description text, append to activeTx
            if (activeTx && descVal) {
              activeTx.description += " " + descVal
              activeTx.category = categorize(activeTx.description, activeTx.type)
            } else {
              skipped++
            }
          }
        } else {
          // Fallback line regex matching for unstructured pages or non-detected headers
          // Match standard date: YYYY-MM-DD or DD/MM/YYYY
          const dateMatch = rowStr.match(/(\d{4}-\d{2}-\d{2})|(\d{1,2}\/\d{1,2}\/\d{2,4})/)
          if (dateMatch) {
            const dateStr = dateMatch[0]
            const parsedDate = parsePdfDate(dateStr)
            if (parsedDate) {
              // Try to find amounts. Filter out date numbers, find decimal numbers
              const rowNumbers = rowStr
                .replace(dateStr, "")
                .match(/-?\d{1,3}(,\d{3})*(\.\d{2})?/g) || []
              
              let amount = NaN
              let type: TransactionType = "expense"

              for (const numStr of rowNumbers) {
                const num = parseAmount(numStr)
                if (!Number.isNaN(num) && num !== 0 && Math.abs(num) < 10000000) {
                  // Usually amount is first or second, ignore transaction IDs (no decimals or very large)
                  if (!numStr.includes(".") && Math.abs(num) > 100000) continue
                  amount = num
                  if (numStr.startsWith("-")) {
                    type = "expense"
                  } else if (numStr.startsWith("+")) {
                    type = "income"
                  }
                  break
                }
              }

              if (!Number.isNaN(amount)) {
                // Description is anything remaining that isn't date or numbers
                let description = row.map(item => item.str).join(" ")
                description = description.replace(dateStr, "").replace(amount.toString(), "").trim()
                if (description.length < 2) description = "Transaction"

                const cleanAmount = Math.abs(amount)
                const category = categorize(description, type)
                
                activeTx = {
                  id: `${parsedDate}-${transactions.length}-${Math.random().toString(36).slice(2, 8)}`,
                  date: parsedDate,
                  description,
                  amount: cleanAmount,
                  type,
                  category,
                }
                transactions.push(activeTx)
              } else {
                skipped++
              }
            } else {
              skipped++
            }
          } else {
            skipped++
          }
        }
      }
    }
  } catch (err: any) {
    console.error("PDF Parsing error:", err)
    errors.push(`Error parsing PDF: ${err.message || String(err)}`)
  }

  // Final check
  if (transactions.length === 0 && skipped > 0) {
    errors.push("Could not extract any transactions from the PDF statement. Check the document layout.")
  }

  return { transactions, errors, skipped }
}
