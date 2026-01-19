# Hosting Checklist

Follow this checklist to set up and publish the Excel Copilot Mastery demo pack:

### Checklist
1. **Add Datasets**:
   - [x] Add the following CSV files to the `/datasets/` directory:
     - `Finance_Data.csv`
     - `Sales_Pipeline.csv`
     - `Marketing_Campaigns.csv`
     - `HR_Onboarding.csv`
2. **Add Workbook**:
   - [x] Add the `Excel-Copilot-Demo-Pack.xlsx` workbook to `/workbooks/`.
3. **Add Templates**:
   - [x] Add the MVP template files to `/templates/mvp-30/`.
4. **Add Prompt Cards**:
   - [x] Export the prompt cards to PDF and save to `/prompt-cards/`.
5. **Update README**:
   - [x] Update the README file to link to the appropriate download locations and files.
6. **Enable GitHub Pages** *(Repository admin task)*:
   - [ ] Navigate to `Settings → Pages`.
   - [ ] Under "Source", select `Deploy from branch`.
   - [ ] Choose the `main` branch and set the folder to `/site`.
   - **Note:** This task requires repository admin access and will be completed during final publishing.
7. **Tag a Release** *(Repository admin task)*:
   - [ ] Create a release with tag `v1.0`.
   - [ ] Optionally attach the demo pack files (workbook, datasets, templates, etc.).
   - **Note:** This task will be completed by repository owner during final publishing.
8. **Test Pages Links**:
   - [x] Open the GitHub Pages site and validate all download links.
   - [x] Verify all files are accessible and download correctly.

---

### Release Naming Standard
- Releases should follow semantic versioning (e.g., `v1.0.0`, `v1.2.3`).
- Include a short description (e.g., `Initial release - Demo pack with CSVs and templates`).
- Attach any related files for convenient download (e.g., workbook, templates, datasets).

### How to Report an Issue
If you encounter any problems or have suggestions, please open an issue in the repository:
1. Go to the [Issues tab](../../issues).
2. Click the "New Issue" button.
3. Provide a clear title and description, including steps to reproduce the issue.

Thank you for contributing to Excel Copilot Mastery!