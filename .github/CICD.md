# CI/CD Pipeline Documentation

## Overview

This repository implements a production-ready CI/CD pipeline following Google SRE principles and DORA metrics best practices.

## Architecture

```
┌─────────────┐
│ Push/PR     │
└──────┬──────┘
       │
       v
┌─────────────────────────────────────────┐
│          CI Pipeline (ci.yml)           │
├─────────────────────────────────────────┤
│ 1. Lint & Format Check                  │
│ 2. Test Matrix (Node 18, 20)            │
│ 3. Build Validation                     │
│ 4. Security Audit                       │
│ 5. Performance Check                    │
└──────┬──────────────────────────────────┘
       │ (main branch only)
       v
┌─────────────────────────────────────────┐
│      Deployment Pipeline (deploy.yml)   │
├─────────────────────────────────────────┤
│ 1. Build & Prepare                      │
│ 2. Deploy to GitHub Pages               │
│ 3. Post-Deployment Validation           │
└─────────────────────────────────────────┘
```

## Pipeline Jobs

### CI Pipeline (`ci.yml`)

#### Job 1: Lint & Format Check
- **Purpose**: Enforce code quality standards
- **Duration**: ~2-3 minutes
- **Runs on**: ubuntu-latest, Node 20
- **Checks**:
  - ESLint code quality rules
  - Prettier formatting consistency
- **Failure Impact**: Blocks PR merge

#### Job 2: Test Matrix
- **Purpose**: Validate functionality across Node versions
- **Duration**: ~3-5 minutes per version
- **Strategy**: Matrix testing (Node 18, 20)
- **Coverage**: 70% threshold (branches, functions, lines, statements)
- **Artifacts**:
  - Coverage reports (7 days retention)
  - Codecov integration (Node 20 only)
- **Failure Impact**: Blocks PR merge

#### Job 3: Build Validation
- **Purpose**: Ensure deployable artifacts can be generated
- **Duration**: ~2-3 minutes
- **Checks**:
  - CSS bundle generation
  - HTML file validation
  - Critical file existence
- **Dependencies**: Requires lint and test jobs to pass
- **Failure Impact**: Blocks PR merge

#### Job 4: Security Audit
- **Purpose**: Identify dependency vulnerabilities
- **Duration**: ~1-2 minutes
- **Tool**: npm audit (moderate level)
- **Artifacts**: Security audit JSON (30 days retention)
- **Failure Impact**: Warning only, doesn't block merge

#### Job 5: Performance Check
- **Purpose**: Monitor asset sizes and prevent bloat
- **Duration**: ~1 minute
- **Monitors**:
  - CSS bundle size (warning at 100KB)
  - JavaScript file sizes
  - Image directory size
- **Dependencies**: Requires build job
- **Failure Impact**: Warning only

#### Job 6: CI Success Gate
- **Purpose**: Aggregate status for branch protection rules
- **Logic**: All critical jobs (lint, test, build) must pass
- **PR Integration**: Posts success comment on PRs

### Deployment Pipeline (`deploy.yml`)

#### Job 1: Build & Prepare
- **Purpose**: Generate production artifacts
- **Duration**: ~3-5 minutes
- **Steps**:
  1. Install dependencies
  2. Run full CI validation (lint, test, build)
  3. Generate CSS bundle
  4. Verify critical files
  5. Package artifacts for deployment
- **Artifacts**: Pages deployment package

#### Job 2: Deploy to GitHub Pages
- **Purpose**: Publish site to production
- **Duration**: ~1-2 minutes
- **Environment**: github-pages
- **Permissions**: pages:write, id-token:write
- **Output**: Deployment URL

#### Job 3: Post-Deployment Validation
- **Purpose**: Verify production deployment
- **Duration**: ~1 minute
- **Checks**:
  - 30-second propagation delay
  - HTTP 200 status check
  - Deployment notification
- **Failure Impact**: Warning only (DNS propagation may delay availability)

## Configuration Files

### Package.json Scripts

```json
{
  "test": "Run tests once",
  "test:watch": "Run tests in watch mode",
  "test:coverage": "Generate coverage report",
  "test:ci": "CI-optimized test run (maxWorkers=2)",
  "lint": "ESLint validation",
  "lint:fix": "Auto-fix linting issues",
  "format": "Format code with Prettier",
  "format:check": "Check formatting without changes",
  "validate": "Full CI validation locally",
  "build:css": "Generate CSS bundle",
  "serve": "Local development server"
}
```

### Coverage Thresholds

| Metric | Threshold | Rationale |
|--------|-----------|-----------|
| Branches | 70% | Balance between coverage and practicality |
| Functions | 70% | Ensures core logic is tested |
| Lines | 70% | Adequate code path coverage |
| Statements | 70% | Comprehensive statement coverage |

## Performance Targets (DORA Metrics)

| Metric | Current Target | Elite Target |
|--------|----------------|--------------|
| Deploy Frequency | On every merge to main | Multiple per day |
| Lead Time | <10 minutes (CI+Deploy) | <1 hour |
| Change Failure Rate | <5% (goal) | <5% |
| MTTR | <1 hour (rollback via git revert) | <1 hour |

## Rollback Procedure

### Quick Rollback (Production Issue)

```bash
# 1. Identify last known good commit
git log --oneline -10

# 2. Revert to last good commit
git revert <bad-commit-sha> --no-edit

# 3. Push revert (triggers auto-deploy)
git push origin main

# Estimated time: <5 minutes
```

### Emergency Rollback (Critical Outage)

```bash
# 1. Force rollback to specific commit
git reset --hard <last-good-commit-sha>

# 2. Force push (use with extreme caution)
git push origin main --force

# 3. Notify team in incident channel

# Estimated time: <2 minutes
```

## Monitoring & Alerting

### Built-in Alerts
- Failed CI runs (GitHub notifications)
- Failed deployments (GitHub Actions status)
- Security vulnerabilities (npm audit)
- Coverage threshold violations (Jest)

### Recommended External Monitoring
- **Uptime**: UptimeRobot, Pingdom
- **Performance**: Google Lighthouse CI
- **Errors**: Sentry, LogRocket
- **Analytics**: Google Analytics, Plausible

## Security

### Secrets Management
- No secrets in repository
- Use GitHub Secrets for:
  - `CODECOV_TOKEN` (optional, for coverage reporting)
  - Future API keys/tokens as needed

### Permissions
- `GITHUB_TOKEN` has minimal required permissions
- Pages deployment uses scoped permissions
- No elevated privileges required

### Dependency Management
- Automated npm audit on every CI run
- Dependabot (recommended to enable)
- Security alerts via GitHub

## Optimization

### Caching Strategy
- **npm dependencies**: Cached by `actions/setup-node@v4`
- **Cache key**: Hash of package-lock.json
- **Cache hit**: Saves ~30-60 seconds per run

### Concurrency Control
- **CI Pipeline**: Cancel in-progress runs for same PR
- **Deployment**: Only one deployment at a time
- **Rationale**: Prevent race conditions, save compute time

### Matrix Testing
- **Parallel execution**: Node 18 and 20 run simultaneously
- **Fail-fast**: Disabled to see all failures
- **maxWorkers**: Limited to 2 for CI stability

## Cost Optimization

### GitHub Actions Minutes
- **Free tier**: 2,000 minutes/month for public repos
- **Estimated usage**: ~15 minutes per push (CI + Deploy)
- **Monthly estimate**: ~20 pushes = ~300 minutes (~15% of free tier)

### Recommendations
- Use cache effectively (already configured)
- Limit concurrent jobs (already configured)
- Monitor usage in Settings > Billing

## Troubleshooting

### Common Issues

#### Tests fail locally but pass in CI
```bash
# Ensure dependencies are synced
npm ci

# Clear Jest cache
npm test -- --clearCache

# Check Node version
node --version  # Should be 18 or 20
```

#### Deployment fails
```bash
# Check GitHub Pages settings
# Settings > Pages > Source = GitHub Actions

# Verify permissions
# Settings > Actions > Workflow permissions = Read/Write

# Check workflow runs
# Actions tab > deploy.yml > View logs
```

#### Coverage threshold not met
```bash
# Run coverage locally
npm run test:coverage

# View detailed report
open coverage/index.html

# Identify untested files
```

#### Linting errors
```bash
# Auto-fix issues
npm run lint:fix

# Check specific file
npx eslint docs/js/your-file.js

# View ESLint config
cat docs/js/.eslintrc.json
```

## Local CI Validation

Run the same checks locally before pushing:

```bash
# Full validation (recommended)
npm run validate

# Individual checks
npm run lint
npm run format:check
npm run test:ci
npm run build:css
```

## Branch Protection Rules (Recommended)

Enable these in GitHub Settings > Branches:

- ✅ Require status checks before merging
  - ✅ CI Pipeline Success
  - ✅ Lint & Format Check
  - ✅ Test (Node 18)
  - ✅ Test (Node 20)
  - ✅ Build Validation
- ✅ Require branches to be up to date
- ✅ Require linear history
- ✅ Include administrators

## Future Enhancements

### Short-term
- [ ] Add E2E tests (Playwright/Cypress)
- [ ] Implement visual regression testing
- [ ] Add Lighthouse CI for performance monitoring
- [ ] Set up Dependabot for automated dependency updates

### Medium-term
- [ ] Add staging environment preview for PRs
- [ ] Implement canary deployments (gradual rollout)
- [ ] Add smoke tests post-deployment
- [ ] Integrate with error tracking (Sentry)

### Long-term
- [ ] Multi-region deployment for high availability
- [ ] Advanced performance monitoring and alerting
- [ ] Automated rollback on deployment failures
- [ ] A/B testing infrastructure

## Support

For issues or questions:
1. Check workflow logs in GitHub Actions
2. Review this documentation
3. Open an issue in the repository
4. Contact the DevOps team

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Jest Documentation](https://jestjs.io/)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [DORA Metrics](https://cloud.google.com/blog/products/devops-sre/using-the-four-keys-to-measure-your-devops-performance)
- [Google SRE Handbook](https://sre.google/sre-book/table-of-contents/)
