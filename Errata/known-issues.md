Known issues and workarounds

1) Copilot features not visible
- Symptom: Copilot pane or actions not available.
- Fix: Ensure you have an eligible Excel build and Copilot access; features roll out by account and region.

2) Workbook needs OneDrive/AutoSave
- Symptom: Example prompts require AutoSave and a cloud workbook.
- Fix: Store the workbook in OneDrive or SharePoint and enable AutoSave.

3) Table formatting not recognized
- Symptom: Copilot doesn't detect table columns.
- Fix: Convert ranges to Excel Tables (Ctrl+T) and use clear header names.

4) Pivot refresh issues
- Symptom: Pivot tables don't update with Copilot actions.
- Fix: Refresh pivots after source changes; use named ranges or tables.

5) Large datasets lag or timeout
- Symptom: Operations are slow or time out.
- Fix: Use smaller samples or filtered subsets; remove volatile formulas and unnecessary links.

6) Formula differences across Excel editions
- Symptom: New functions missing in some editions.
- Fix: Document function availability; provide backward-compatible formula alternatives.

7) Copilot misinterprets ambiguous prompts
- Symptom: Results don't match intent.
- Fix: Make prompts explicit, include desired output format and sample rows.

8) Missing external data connections
- Symptom: Power Query steps or queries fail.
- Fix: Ensure credentials and sources are available; provide offline CSV alternatives.

9) Localization and CSV delimiters
- Symptom: CSV parsing or number formats incorrect.
- Fix: Provide locale-aware CSVs or specify explicit delimiters and formats.

10) Macro/VBA security warnings
- Symptom: Macros are disabled on open.
- Fix: Sign macros, instruct users to enable content only for trusted files, and provide non-macro variants when possible.