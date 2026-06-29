"use client"

import { CheckCircle2, FileText, Sparkles, UploadCloud, X } from "lucide-react"
import { useRef, useState } from "react"
import { toast } from "sonner"
import { CategoryBadge } from "@/components/category-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate, formatNaira } from "@/lib/analytics"
import { parseCsv, type ParseResult } from "@/lib/parse-csv"
import { SAMPLE_CSV } from "@/lib/sample"
import { useTransactions } from "@/lib/store"
import { cn } from "@/lib/utils"

export function UploadView() {
  const { addTransactions } = useTransactions()
  const [dragging, setDragging] = useState(false)
  const [result, setResult] = useState<ParseResult | null>(null)
  const [fileName, setFileName] = useState<string>("")
  const inputRef = useRef<HTMLInputElement>(null)

  function handleText(text: string, name: string) {
    const parsed = parseCsv(text)
    setResult(parsed)
    setFileName(name)
    if (parsed.transactions.length > 0) {
      toast.success(`Parsed ${parsed.transactions.length} transactions`)
    } else if (parsed.errors.length > 0) {
      toast.error(parsed.errors[0])
    }
  }

  function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please upload a CSV file. (PDF support is coming soon.)")
      return
    }
    const reader = new FileReader()
    reader.onload = () => handleText(String(reader.result ?? ""), file.name)
    reader.onerror = () => toast.error("Could not read the file.")
    reader.readAsText(file)
  }

  function handleSave() {
    if (!result || result.transactions.length === 0) return
    const added = addTransactions(result.transactions)
    if (added === 0) {
      toast.info("These transactions were already imported.")
    } else {
      toast.success(`Saved ${added} new transactions to your browser`)
    }
    setResult(null)
    setFileName("")
  }

  function loadSample() {
    handleText(SAMPLE_CSV, "sample-opay-statement.csv")
  }

  const preview = result?.transactions.slice(0, 8) ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-balance">Upload statement</h1>
        <p className="mt-1 text-muted-foreground">
          Import your OPay transaction history as a CSV file. Everything stays in your browser.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              const file = e.dataTransfer.files?.[0]
              if (file) handleFile(file)
            }}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors",
              dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/40",
            )}
          >
            <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UploadCloud className="size-7" />
            </span>
            <p className="mt-4 font-medium">Drag &amp; drop your CSV here</p>
            <p className="text-sm text-muted-foreground">or click to browse your files</p>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
                e.target.value = ""
              }}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Need a file to test with? Try the sample statement.
            </p>
            <Button variant="outline" size="sm" onClick={loadSample}>
              <Sparkles className="size-4" />
              Load sample data
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && result.transactions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileText className="size-5 text-muted-foreground" />
                <div>
                  <CardTitle className="text-base">{fileName}</CardTitle>
                  <CardDescription>
                    {result.transactions.length} transactions detected
                    {result.skipped > 0 ? ` · ${result.skipped} rows skipped` : ""}
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setResult(null)
                  setFileName("")
                }}
                aria-label="Discard preview"
              >
                <X className="size-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Description</th>
                    <th className="hidden px-3 py-2 font-medium sm:table-cell">Category</th>
                    <th className="px-3 py-2 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((t) => (
                    <tr key={t.id} className="border-t border-border">
                      <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{formatDate(t.date)}</td>
                      <td className="max-w-[180px] truncate px-3 py-2">{t.description}</td>
                      <td className="hidden px-3 py-2 sm:table-cell">
                        <CategoryBadge category={t.category} />
                      </td>
                      <td
                        className={cn(
                          "whitespace-nowrap px-3 py-2 text-right font-medium tabular-nums",
                          t.type === "income" ? "text-primary" : "text-foreground",
                        )}
                      >
                        {t.type === "income" ? "+" : "-"}
                        {formatNaira(t.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {result.transactions.length > preview.length && (
                <p className="border-t border-border bg-muted/30 px-3 py-2 text-center text-xs text-muted-foreground">
                  + {result.transactions.length - preview.length} more
                </p>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <Button onClick={handleSave}>
                <CheckCircle2 className="size-4" />
                Save transactions
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {result && result.transactions.length === 0 && result.errors.length > 0 && (
        <Card className="border-destructive/40">
          <CardContent className="pt-6">
            <p className="font-medium text-destructive">Couldn&apos;t parse that file</p>
            <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
              {result.errors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Expected format</CardTitle>
          <CardDescription>
            We auto-detect common OPay/bank export columns. A date column and an amount (or debit/credit) column are
            required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs text-muted-foreground">
{`Date, Description, Type, Amount
2024-06-01, Salary payment, Credit, 250000
2024-06-02, Airtime recharge, Debit, 2000`}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
