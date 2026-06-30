# Finance Tracker (OPay Expense Tracker)

A privacy-focused, client-side web application that helps you track your expenses and visualize your spending habits by importing your OPay and other bank statements.

## Features

- **100% Private**: All parsing, processing, and data storage happens entirely in your browser using local storage. No data is ever sent to a remote server.
- **Multiple Formats**: Import your statements as CSV, Excel (.xlsx, .xls), or PDF documents.
- **Smart Categorization**: Automatically categorizes your transactions based on descriptions (e.g., Food & Dining, Transfer, Airtime & Data, Bills & Utilities).
- **Interactive Dashboard**: Visualizes your monthly income vs. expenses, category breakdowns, and balance trends using beautiful Recharts graphics.
- **Transaction Management**: View, filter, edit categories, and delete specific transactions.
- **Export**: Export your filtered transactions back to a CSV file.

## Tech Stack

- [Next.js](https://nextjs.org/) (App Router)
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/) (styled components)
- [Recharts](https://recharts.org/) (Data visualization)
- [SheetJS (xlsx)](https://sheetjs.com/) (Excel parsing)
- [PDF.js](https://mozilla.github.io/pdf.js/) (PDF table extraction)

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open the app:**
   Open [http://localhost:3000](http://localhost:3000) with your browser.

## How it Works

### PDF Parsing
The application extracts transaction tables directly from PDF files on the client-side. It groups text elements vertically by their Y-coordinates to form rows, and sorts them horizontally by X-coordinates to form columns, allowing it to seamlessly reconstruct the original statement layout and extract the date, amount, and description.

### Excel Parsing
Excel documents are parsed client-side using SheetJS. The first worksheet is converted to a CSV format and then passed through the existing CSV parsing engine.
