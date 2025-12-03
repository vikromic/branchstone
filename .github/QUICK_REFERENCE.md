# CI/CD Quick Reference Card

## Common Commands

### Local Development
```bash
npm install              # Install dependencies
npm run serve           # Start local server (port 8000)
npm test                # Run tests
npm run test:coverage   # Run tests with coverage
npm run test:watch      # Run tests in watch mode
```

### Code Quality
```bash
npm run lint            # Check code quality
npm run lint:fix        # Fix linting issues
npm run format          # Format code
npm run format:check    # Check formatting
npm run validate        # Run full CI checks locally
```

### Build
```bash
npm run build:css       # Build CSS bundle
npm run optimize-images # Optimize images (in scripts/)
```

## Pipeline Triggers

| Event | CI Pipeline | Deploy Pipeline |
|-------|-------------|-----------------|
| Push to main | ✅ Runs | ✅ Runs |
| Push to other branch | ✅ Runs | ❌ No |
| Pull Request | ✅ Runs | ❌ No |
| Manual trigger | ❌ No | ✅ Available |

## Pipeline Duration

| Pipeline | Typical Duration | Timeout |
|----------|------------------|---------|
| CI (all jobs) | 8-12 minutes | 15 min/job |
| Deployment | 5-7 minutes | 10 min/job |
| Total (main push) | 13-19 minutes | - |

## Required Status Checks

Before merging to main, these must pass:
- ✅ Lint & Format Check
- ✅ Test (Node 18)
- ✅ Test (Node 20)
- ✅ Build Validation
- ✅ CI Pipeline Success

## Coverage Requirements

All metrics must be ≥70%:
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

## Emergency Rollback

```bash
# Quick rollback (recommended)
git revert HEAD
git push origin main

# Force rollback (use with caution)
git reset --hard <commit-sha>
git push origin main --force

# Estimated time: <5 minutes
```

## File Size Thresholds

| Asset | Warning Threshold | Current |
|-------|-------------------|---------|
| CSS Bundle | 100 KB | Check in CI |
| JS Files | Monitor only | - |
| Images | Monitor only | - |

## Artifacts

### CI Pipeline Generates:
- Coverage reports (7 days retention)
- Security audit JSON (30 days retention)

### Viewing Artifacts:
1. Go to Actions tab
2. Click on workflow run
3. Scroll to "Artifacts" section
4. Download desired artifact

## Badge URLs

Replace `username` with your GitHub username:

```markdown
[![CI Pipeline](https://github.com/username/branchstone/actions/workflows/ci.yml/badge.svg)](https://github.com/username/branchstone/actions/workflows/ci.yml)

[![Deploy](https://github.com/username/branchstone/actions/workflows/deploy.yml/badge.svg)](https://github.com/username/branchstone/actions/workflows/deploy.yml)

[![codecov](https://codecov.io/gh/username/branchstone/branch/main/graph/badge.svg)](https://codecov.io/gh/username/branchstone)
```

## Secrets (Optional)

| Secret Name | Purpose | Required |
|-------------|---------|----------|
| CODECOV_TOKEN | Coverage reporting | No |

Add in: Settings > Secrets and variables > Actions

## Monitoring URLs

- **Actions**: `https://github.com/username/branchstone/actions`
- **GitHub Pages**: Settings > Pages
- **Codecov**: `https://codecov.io/gh/username/branchstone`

## Cost Estimate

### GitHub Actions (Public Repo)
- Free tier: 2,000 minutes/month
- Estimated usage: ~15 min/push
- Typical monthly usage: ~300 minutes (15%)

## Troubleshooting Quick Fixes

### Tests fail locally
```bash
rm -rf node_modules package-lock.json
npm install
npm test -- --clearCache
```

### Linting errors
```bash
npm run lint:fix
```

### Deployment fails
Check: Settings > Pages > Source = "GitHub Actions"

### Coverage too low
```bash
npm run test:coverage
open coverage/index.html
```

## Node Version Support

| Version | Status | CI Testing |
|---------|--------|------------|
| 18.x | ✅ Supported | ✅ Yes |
| 20.x | ✅ Supported | ✅ Yes |
| <18 | ❌ Not supported | ❌ No |

## Key Files

| File | Purpose |
|------|---------|
| `.github/workflows/ci.yml` | CI pipeline configuration |
| `.github/workflows/deploy.yml` | Deployment configuration |
| `jest.config.js` | Test configuration |
| `babel.config.js` | Babel configuration |
| `.eslintrc.json` | Linting rules |
| `.prettierrc.json` | Formatting rules |
| `package.json` | Dependencies and scripts |

## Support Resources

- **Pipeline Docs**: `.github/CICD.md`
- **Setup Guide**: `.github/SETUP.md`
- **GitHub Actions**: https://docs.github.com/actions
- **Jest Docs**: https://jestjs.io/

## Pre-Push Checklist

Before pushing code:
```bash
# Run full validation
npm run validate

# Or individually:
npm run lint          # ✅ Must pass
npm run format:check  # ✅ Must pass
npm run test          # ✅ Must pass
npm run build:css     # ✅ Must succeed
```

## Post-Deploy Checklist

After deployment completes:
- [ ] Check Actions tab - deployment succeeded
- [ ] Visit site URL - loads correctly
- [ ] Check browser console - no errors
- [ ] Test key functionality - gallery, lightbox, forms
- [ ] Verify mobile responsiveness

## Performance Targets (DORA)

| Metric | Target | Current |
|--------|--------|---------|
| Deploy Frequency | Daily | On merge |
| Lead Time | <1 hour | ~15 min |
| Change Failure Rate | <5% | Monitor |
| MTTR | <1 hour | <5 min |

---

**Last Updated**: 2025-12-02
**Version**: 1.0
