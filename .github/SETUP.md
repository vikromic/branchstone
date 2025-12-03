# GitHub Actions Setup Guide

This guide walks you through configuring GitHub Actions for the Branchstone portfolio.

## Prerequisites

- GitHub repository with admin access
- Repository contains the workflow files in `.github/workflows/`

## Step 1: Enable GitHub Actions

1. Go to **Settings** > **Actions** > **General**
2. Under "Actions permissions":
   - Select: **Allow all actions and reusable workflows**
3. Under "Workflow permissions":
   - Select: **Read and write permissions**
   - Check: **Allow GitHub Actions to create and approve pull requests**
4. Click **Save**

## Step 2: Configure GitHub Pages

1. Go to **Settings** > **Pages**
2. Under "Build and deployment":
   - **Source**: Select **GitHub Actions**
   - (Not "Deploy from a branch")
3. Click **Save**

The Pages section should now show:
```
Your site is live at https://username.github.io/branchstone/
```

## Step 3: Update README Badges

Replace `username` in the badge URLs with your actual GitHub username:

```markdown
[![CI Pipeline](https://github.com/YOUR_USERNAME/branchstone/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/branchstone/actions/workflows/ci.yml)
[![Deploy](https://github.com/YOUR_USERNAME/branchstone/actions/workflows/deploy.yml/badge.svg)](https://github.com/YOUR_USERNAME/branchstone/actions/workflows/deploy.yml)
```

## Step 4: Set Up Codecov (Optional)

For coverage reporting with badges:

1. Sign up at [codecov.io](https://codecov.io) with your GitHub account
2. Add your repository
3. Copy the upload token
4. Add to GitHub Secrets:
   - Go to **Settings** > **Secrets and variables** > **Actions**
   - Click **New repository secret**
   - Name: `CODECOV_TOKEN`
   - Value: [paste your token]
5. Update README badge:
   ```markdown
   [![codecov](https://codecov.io/gh/YOUR_USERNAME/branchstone/branch/main/graph/badge.svg?token=YOUR_TOKEN)](https://codecov.io/gh/YOUR_USERNAME/branchstone)
   ```

**Note**: Codecov is optional. Tests will run and generate coverage reports locally without it.

## Step 5: Configure Branch Protection (Recommended)

Protect your main branch with required status checks:

1. Go to **Settings** > **Branches**
2. Click **Add rule** or edit existing rule
3. Branch name pattern: `main`
4. Check the following:
   - ✅ **Require status checks to pass before merging**
     - Search and add these required checks:
       - `CI Pipeline Success`
       - `Lint & Format Check`
       - `Test (Node 18)`
       - `Test (Node 20)`
       - `Build Validation`
   - ✅ **Require branches to be up to date before merging**
   - ✅ **Require linear history**
   - ✅ **Include administrators** (optional but recommended)
5. Click **Create** or **Save changes**

## Step 6: Test the Pipelines

### Test CI Pipeline

1. Create a new branch:
   ```bash
   git checkout -b test-ci
   ```

2. Make a small change (e.g., add a comment to a file)

3. Commit and push:
   ```bash
   git add .
   git commit -m "test: verify CI pipeline"
   git push origin test-ci
   ```

4. Create a Pull Request

5. Watch the CI pipeline run:
   - Go to **Actions** tab
   - You should see "CI Pipeline" running
   - All checks should pass (green checkmarks)

### Test Deployment Pipeline

1. Merge your test PR to main:
   ```bash
   git checkout main
   git merge test-ci
   git push origin main
   ```

2. Watch the deployment:
   - Go to **Actions** tab
   - You should see both "CI Pipeline" and "Deploy to GitHub Pages" running
   - Wait for deployment to complete (~5-10 minutes)

3. Verify your site:
   - Go to **Settings** > **Pages**
   - Click the site URL
   - Your site should be live!

## Step 7: Verify Everything Works

Run this checklist:

- [ ] CI pipeline runs on pull requests
- [ ] CI pipeline runs on push to main
- [ ] All test jobs pass (Node 18 and 20)
- [ ] Linting passes
- [ ] Build validation passes
- [ ] Deployment runs on push to main
- [ ] Site deploys successfully
- [ ] Site is accessible at the GitHub Pages URL
- [ ] Coverage reports are generated
- [ ] Status badges show in README

## Troubleshooting

### Issue: Workflows don't run

**Solution**: Check that Actions are enabled (Step 1)

### Issue: Deployment fails with "permissions" error

**Solution**:
1. Check workflow permissions are "Read and write" (Step 1)
2. Verify Pages source is "GitHub Actions" (Step 2)

### Issue: Tests fail in CI but pass locally

**Solution**:
```bash
# Clear and reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Clear Jest cache
npm test -- --clearCache

# Run tests in CI mode locally
npm run test:ci
```

### Issue: Coverage threshold not met

**Solution**:
```bash
# Run coverage locally to see details
npm run test:coverage
open coverage/index.html

# Adjust thresholds in jest.config.js if needed (temporarily)
```

### Issue: Deployment succeeds but site shows 404

**Solution**:
1. Wait 5-10 minutes (DNS propagation)
2. Check that `docs/` folder contains `index.html`
3. Verify Pages settings (Step 2)
4. Check deployment logs for errors

### Issue: Badge shows "unknown" or error

**Solution**:
1. Wait for first workflow run to complete
2. Verify URLs use your actual username
3. Check repository visibility (public repos work best)

## Environment Variables

Currently, no environment variables are required for basic operation.

Optional variables you can add:

| Variable | Purpose | Where to Add |
|----------|---------|--------------|
| `CODECOV_TOKEN` | Coverage reporting | Repository Secrets |
| `SLACK_WEBHOOK` | Deployment notifications | Repository Secrets |
| `SENTRY_DSN` | Error tracking | Repository Secrets |

## Monitoring Your Pipelines

### View Workflow Runs
- Go to **Actions** tab
- Click on a workflow name (CI Pipeline or Deploy)
- View run history and logs

### Monitor Usage
- Go to **Settings** > **Billing** > **Plans and usage**
- View "Actions minutes used"
- Public repos get 2,000 free minutes/month

### Set Up Notifications
- Go to **Settings** > **Notifications**
- Enable: "Actions workflow runs"
- Choose: Email, Web, or Mobile

## Next Steps

After basic setup:

1. **Enable Dependabot**:
   - Go to **Settings** > **Security** > **Code security and analysis**
   - Enable "Dependabot alerts" and "Dependabot security updates"

2. **Add CODEOWNERS** (optional):
   ```
   # .github/CODEOWNERS
   * @your-username
   docs/js/ @your-username
   ```

3. **Set up Issue Templates**:
   - Create `.github/ISSUE_TEMPLATE/bug_report.md`
   - Create `.github/ISSUE_TEMPLATE/feature_request.md`

4. **Add Pull Request Template**:
   - Create `.github/pull_request_template.md`

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches)
- [Codecov GitHub Integration](https://docs.codecov.com/docs/github-integration)

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review workflow logs in the Actions tab
3. Consult `.github/CICD.md` for detailed pipeline documentation
4. Open an issue in the repository
