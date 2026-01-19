# Known issues & practical fixes (Common Copilot problems)

This document lists common issues users encounter when using Copilot with Excel and practical fixes or workarounds.

1. Feature not visible / Copilot pane isn't available
- Symptom: The Copilot button or sidebar does not appear in Excel.
- Fixes:
  - Confirm you have a Copilot-enabled Office subscription and the correct Office channel.
  - Ensure Excel desktop is updated to the latest version.
  - Check IT/tenant settings (admins may need to enable Copilot).
  - Try signing out/in of Office and restarting Excel.

2. Copilot returns vague or non-actionable responses
- Symptom: Answers are high-level or not specific to the workbook.
- Fixes:
  - Provide more context in the prompt: reference sheet names, cell ranges, and examples.
  - Use stepwise prompts (ask for concrete formulas or steps).
  - Show Copilot the relevant table by selecting it first.

3. Copilot uses the wrong range or table in its answer
- Symptom: Copilot writes formulas that use an unrelated range.
- Fixes:
  - Explicitly name the range or convert the data to an Excel Table and reference the table name.
  - In the prompt, include the exact range (e.g., A2:E200) or table name (SalesData).
  - Where possible, create a small reproducible example worksheet.

4. Generated formula returns #VALUE!, #REF! or incorrect results
- Symptom: Copilot output causes Excel errors.
- Fixes:
  - Inspect the suggested formula and validate range sizes and data types.
  - Test with a small subset of rows first.
  - Use Evaluate Formula (Formulas > Evaluate Formula) to step through and identify the failure point.

5. Copilot suggests deprecated functions or wrong regional separators
- Symptom: Formula uses functions not available in the user's Excel version or uses commas/semicolons incorrectly.
- Fixes:
  - Specify Excel version or regional settings in the prompt.
  - Replace deprecated functions with supported equivalents (e.g., SWITCH fallback).
  - Verify list separator in Excel settings and adjust generated formulas accordingly.

6. Copilot modifies or overwrites existing workbook content unexpectedly
- Symptom: Suggested actions overwrite formulas or data.
- Fixes:
  - Work on a copy of the workbook when running exploratory prompts.
  - Use "Undo" immediately if an unwanted change is applied.
  - Request dry-run or pseudo-code instead of direct edits.

7. Large datasets cause slow responses or timeouts
- Symptom: Copilot is slow or times out on big sheets.
- Fixes:
  - Provide a reduced sample slice of the data in the prompt.
  - Summarize dataset characteristics (columns, number of rows) instead of pasting everything.
  - Pre-aggregate or sample data into a smaller table for analysis.

8. Copilot misinterprets business terms or column names
- Symptom: Copilot maps columns incorrectly (e.g., treating "CloseDate" as a text field).
- Fixes:
  - Rename columns to clearer labels or include a short schema in the prompt (column: type).
  - Give examples of expected input and output formats.

9. Conflicting instructions or multiple-step tasks produce inconsistent outputs
- Symptom: When asked to perform many transformations, Copilot misses steps or mixes outputs.
- Fixes:
  - Break complex tasks into smaller, numbered steps.
  - Confirm intermediate outputs before asking for the next transformation.
  - Ask Copilot to return a summary of steps it will take before executing.

10. Security/privacy concerns with sensitive or proprietary data
- Symptom: Concern over sending sensitive data to cloud-based Copilot.
- Fixes:
  - Remove or pseudonymize sensitive data before using Copilot.
  - Use local-only automation or on-prem solutions where available.
  - Consult organizational policy and IT before sharing proprietary datasets.

If you encounter an issue not listed here:
- Open an issue in this repository with a reproducible example (redacted if needed).
- Include Excel version, Copilot availability, and a small sample workbook if possible.
