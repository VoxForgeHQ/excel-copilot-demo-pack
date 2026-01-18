DEMO PACK — Build Instructions

Follow these numbered steps to build Excel-Copilot-Demo-Pack.xlsx from the CSV files included in /Datasets/.

1) Create a new workbook
- Open Excel and create a new .xlsx file. Save it as Excel-Copilot-Demo-Pack.xlsx.

2) Import CSV files (one sheet per CSV)
For each CSV, import into its own worksheet and give the sheet a clear name:
  a) Finance_Data → create sheet named Finance_Data, import CSV, then convert to a table named FinanceTable.
  b) Sales_Pipeline → create sheet named Sales_Pipeline, import CSV, then convert to a table named PipelineTable.
  c) Marketing_Campaigns → create sheet named Marketing_Campaigns, import CSV, then convert to a table named MarketingTable.
  d) HR_Onboarding → create sheet named HR_Onboarding, import CSV, then convert to a table named HRTable.

3) Convert ranges to Excel Tables and rename
- Select the imported data range (Ctrl+A inside the data), press Ctrl+T to convert to an Excel Table.
- In Table Design (or Table Tools) set the Table Name exactly as listed above (FinanceTable, PipelineTable, MarketingTable, HRTable).
- Confirm the checkbox "My table has headers" is selected and ensure header names match the column names used in the book examples. If a header differs, rename the column header to match the book.

4) Add helper columns (structured references preferred)
Add the following helper columns inside each table so formulas fill automatically for new rows.

  Sales (PipelineTable)
  - Column name: WeightedValue
  - Formula (structured reference): =[@DealValue]*[@Probability]
  - If using column letters: =C2*D2 (adjust to your sheet).

  Marketing (MarketingTable)
  - Column name: CAC
  - Formula (safe divide): =IFERROR([@TotalSpend]/[@Leads],"")
  - Column name: ROAS
  - Formula (safe divide): =IFERROR([@Revenue]/[@TotalSpend],"")
  - Notes: If you prefer numeric zero instead of blank on error, replace "" with 0.

  HR (HRTable)
  - Column name: DaysLate
  - Formula (example when columns are DueDate and CompletionDate): =IF([@CompletionDate]="","",IF([@CompletionDate]>[@DueDate],[@CompletionDate]-[@DueDate],0))
  - Notes: Adjust date column names to match your headers; ensure date columns are formatted as dates.

  Finance (FinanceTable)
  - Add any book-specific helper columns as described in the chapter; use structured references like =[@Amount]*0.02 where helpful.

5) Verify data types and formats
- Set currency columns to the appropriate currency format (Home → Number → Currency).
- Set percentage columns (e.g., Probability) to Percentage with one decimal place.
- Set date columns to a consistent short date format.

6) Formatting steps for screenshot-ready sheets
- Apply a clean table style (Table Design → Table Styles) with light borders for readability.
- Autofit columns: double-click column edges or Home → Format → AutoFit Column Width.
- Freeze header row: View → Freeze Panes → Freeze Top Row.
- Set number formats and font sizes to be consistent across sheets (e.g., 11pt, Segoe UI or system font).
- Apply conditional formatting for emphasis where helpful (e.g., color scale on WeightedValue or Data Bars for ROAS).
- Hide gridlines for presentation screenshots: View → uncheck Gridlines (optional).
- Zoom: set to 100% for consistent screenshots.
- Hide unused columns or helper technical columns that are not part of the narrative.
- Ensure column headers are visible in the screenshot area; consider adjusting column widths so headings wrap cleanly.

7) Save and test
- Save the workbook.
- Test sample prompts from the book on each sheet to ensure Copilot detects table names and headers correctly (Copilot often requires cloud-synced files—see README/SECURITY for guidance).

Troubleshooting
1) Copilot doesn’t detect the table or columns
- Confirm the range is an Excel Table (Ctrl+T) and the Table Name matches (Table Design → Table Name).
- Ensure headers are in the first row of the table and contain no merged cells.

2) Formulas return #DIV/0! or errors
- Use IFERROR or IF to guard divides (examples above). Verify denominator columns are nonblank and numeric.

3) Dates appearing as numbers
- Confirm the column format is Date and that date values were parsed correctly during CSV import (use Text to Columns to re-parse if needed).

4) Percentages not recognized
- Make sure the Probability column is numeric and formatted as Percentage. If values are in decimal (0.25), apply Percentage formatting, or if values are '25', divide by 100 in a helper column.

5) Table names revert after edits or copy/paste
- Avoid copying raw ranges over a table; paste values only (Paste Special → Values) or reassign the table name in Table Design.

6) Large files cause slowness
- Work with a filtered subset while building and test on small samples before scaling up. Remove unnecessary volatile formulas (INDIRECT, OFFSET, volatile array formulas) during testing.

7) Missing columns in imported CSVs
- Compare CSV headers with the expected headers from the book. If column names differ, either rename headers in Excel or update the book sample references.

Notes and best practices
- Use structured references in tables ([@ColumnName]) for clearer formulas and automatic fill-down behavior.
- Keep a master copy of the raw CSVs and a separate working .xlsx file saved to OneDrive for Copilot interactions when needed.
- Redact any sensitive or private data before sharing workbooks publicly.
