# Branch Protection Setup

To lock the repository so only you can make changes, follow these steps:

## Enable Branch Protection Rules

1. Go to your repository on GitHub: https://github.com/VoxForgeHQ/excel-copilot-demo-pack
2. Click **Settings** tab
3. In the left sidebar, click **Branches**
4. Under "Branch protection rules", click **Add rule**
5. In "Branch name pattern", enter: `main`
6. Select the following options:
   - ✅ **Require a pull request before merging**
     - ✅ Require approvals (set to 1)
     - ✅ Dismiss stale pull request approvals when new commits are pushed
     - ✅ Require review from Code Owners
   - ✅ **Require status checks to pass before merging**
   - ✅ **Require branches to be up to date before merging**
   - ✅ **Require conversation resolution before merging**
   - ✅ **Include administrators** (important: this means even admins need reviews)
   - ✅ **Restrict who can push to matching branches**
     - Add your username: @VoxForgeHQ
7. Click **Create** or **Save changes**

## Enable GitHub Pages

1. In the same **Settings** tab
2. Scroll down to **Pages** in the left sidebar
3. Under "Build and deployment":
   - Source: Select **GitHub Actions**
4. Save the settings

Your site will be live at: **https://voxforgehq.github.io/excel-copilot-demo-pack/**

## CODEOWNERS File

A `.github/CODEOWNERS` file has been added to require your approval for all changes.

## Note

With these settings, all changes to the `main` branch will require:
- Your approval as code owner
- Pull request workflow (no direct pushes)
- All checks to pass

This ensures complete control over repository changes.
