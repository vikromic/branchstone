# Claude Development Guidelines

## Core Principles

1. **Agent-First Approach**: Delegate work to specialized agents based on their expertise
2. **Parallel Execution**: Run independent tasks concurrently across multiple agents
3. **Documentation Before Implementation**: Always create comprehensive plans using engineering-lead before coding
4. **Docker-Only Development**: All development, testing, and validation must happen in Docker containers
5. **Continuous Deployment**: Deploy changes immediately after validation to maintain latest environment
6. **Git-Driven Workflow**: Commit and push every meaningful change to preserve work
7. **MCP Tools**: Leverage MCP (Model Context Protocol) tools for all operations
8. **No Fake Data**: Never create test/placeholder data as workarounds - implement proper solutions

## Agent Workflow Pattern

### 1. Requirements Analysis & Planning
**Agent**: `engineering-lead`
- Analyze requirements and create comprehensive task breakdown
- Document in `/docs/tasks/` with dependencies and acceptance criteria
- Create architecture decisions (ADRs) for significant technical choices
- Identify risks and mitigation strategies
- Define clear interfaces between components
- **Scale decision**: Determine if multiple agents of same type are needed for large workloads

### 2. Design Phase
**Parallel Execution**:
- **UI/UX**: `ui-ux-designer` → Create wireframes, mockups, design system components
- **API Design**: `backend-developer` → Define API contracts, data models, endpoints
- **Database Schema**: `database-architect` → Design schema, indexes, relationships
- **Infrastructure**: `devops-architect` → Plan deployment architecture, container orchestration

### 3. Implementation Phase
**Parallel Execution**:
- **Frontend**: `frontend-developer` → Implement UI components, state management, API integration
- **Backend**: `backend-developer` → Build APIs, business logic, data processing
- **Database**: `database-architect` → Create migrations, optimize queries, setup replication
- **Infrastructure**: `devops-architect` → Configure CI/CD, container orchestration, monitoring

**For Each Implementation**:
```
a. Code changes in specific agent's domain
b. Test in Docker → Use MCP Docker tools to verify functionality (NO local testing)
c. Security review → infosec-engineer validates security aspects
d. Update documentation → technical-writer creates/updates relevant docs
e. Push changes immediately → git commit && git push
f. Update CHANGELOG.md with brief entry
g. Deploy to environment → devops-architect orchestrates deployment
```

### 4. Quality Assurance
**Agent**: `qa-automation`
- Write automated tests (unit, integration, E2E)
- Execute test suites in Docker containers
- Validate performance benchmarks
- Generate test coverage reports
- Test in Docker → Use MCP Docker tools to verify functionality (NO local testing)
- Push test code immediately

### 5. Security Validation
**Agent**: `infosec-engineer`
- Security code review
- Vulnerability scanning
- Penetration testing in Docker environment
- Compliance validation
- Document security findings and remediation

### 6. Stress Testing & Chaos Engineering
**Agent**: `chaos-engineer`
- Load testing in Docker containers
- Fault injection and resilience testing
- Performance bottleneck identification
- Breaking point analysis
- Test in Docker → Use MCP Docker tools (NO local testing)

### 7. Documentation
**Agent**: `technical-writer`
- API documentation (OpenAPI/Swagger)
- User guides and tutorials
- Architecture documentation
- Runbooks and SOPs
- Update CHANGELOG.md briefly

### 8. Deployment
**Agent**: `devops-architect`
- Deploy to staging/production environments
- Configure monitoring and alerting
- Verify deployment health
- Update infrastructure documentation
- Push infrastructure changes immediately
- Update CHANGELOG.md with deployment entry

### 9. Incident Response
**Agent**: `root-cause-analyst`
- Investigate production issues
- Conduct root cause analysis
- Create RCA reports with corrective actions
- Coordinate fixes across agents

## Scaling Agents for Large Tasks

When `engineering-lead` identifies large workloads, spawn multiple agent instances:

### Example: Large Migration Project
```
PLAN (engineering-lead decision):
- 15 microservices need API updates
- Split work across 3 backend-developer agents

EXECUTE (parallel):
├─ backend-developer-1: Services 1-5 (auth, users, payments, orders, inventory)
├─ backend-developer-2: Services 6-10 (shipping, notifications, analytics, search, reviews)
└─ backend-developer-3: Services 11-15 (admin, reports, webhooks, integrations, logs)

COORDINATE (engineering-lead):
- Monitor progress across all agents
- Resolve conflicts and dependencies
- Ensure consistent patterns across agents
```

### Example: Multi-Region Infrastructure
```
PLAN (engineering-lead decision):
- Deploy to 4 regions simultaneously
- Assign 2 devops-architect agents

EXECUTE (parallel):
├─ devops-architect-1: US-East, US-West regions
└─ devops-architect-2: EU-Central, APAC-Southeast regions

COORDINATE (engineering-lead):
- Ensure configuration consistency
- Validate cross-region replication
- Monitor deployment health across regions
```

### Scaling Decision Criteria
**Use multiple agents when:**
- Task can be split into independent subtasks (no shared state)
- Work volume exceeds 3+ days for single agent
- Parallel execution significantly reduces timeline
- Clear ownership boundaries exist

**Agent types that scale well:**
- `backend-developer` → Multiple microservices/modules
- `frontend-developer` → Multiple pages/features
- `qa-automation` → Test suites across different domains
- `devops-architect` → Multiple environments/regions
- `infosec-engineer` → Different security domains (web, API, infrastructure)

## File Management Rules

### Editing vs Creating
- **PREFER**: Edit existing files to add/modify functionality
- **AVOID**: Creating new files unless absolutely necessary
- **CONSOLIDATE**: Merge duplicate code into reusable components
- **REFERENCE**: Always specify exact file paths in suggestions

### Example Decision Tree
```
Need to add new API endpoint?
├─ Does controller file exist? → YES: Edit existing controller
└─ Does controller file exist? → NO: Create new controller only if it's a new domain

Need to add validation logic?
├─ Does validation module exist? → YES: Add validation function to existing module
└─ Does validation module exist? → NO: Extend existing validation, don't create new file
```

### MCP Docker Tools Usage
- Use MCP tools to interact with Docker containers
- Execute tests inside containers via MCP
- Build and run containers through MCP commands
- Validate functionality in containerized environment

### Prohibited Local Development
- ❌ Running `npm install` locally
- ❌ Running `pip install` locally
- ❌ Testing outside Docker containers
- ❌ Running development servers on host machine
- ✅ All operations via `docker-compose` and MCP tools

## Git Workflow

### Commit Frequency
```bash
# After EVERY meaningful change:
git add .
git commit -m "feat(component): brief description"
git push origin <branch>

# Examples of "meaningful change":
- Implemented API endpoint
- Fixed bug in authentication
- Updated database schema
- Added test coverage
- Updated documentation
```

### Commit Message Format
```
<type>(<scope>): <description>

Types: feat, fix, docs, style, refactor, test, chore
Scope: component/module name
Description: Brief summary (max 72 chars)

Example:
feat(auth): implement JWT refresh token logic
fix(api): resolve race condition in payment processing
docs(readme): update installation instructions
test(user): add integration tests for user registration
```

### Branch Strategy
- `main` → Production-ready code
- `develop` → Integration branch
- `feature/<name>` → Feature development
- `fix/<name>` → Bug fixes
- `hotfix/<name>` → Emergency production fixes

## CHANGELOG.md Updates

### Format
```markdown
# Changelog

## [Unreleased]

## [1.2.0] - 2024-11-19

### Added
- JWT refresh token mechanism (auth module)
- Docker Compose multi-stage builds (infra)

### Changed
- Updated PostgreSQL from 14 to 16 (database)
- Migrated frontend to Vite from Webpack (frontend)

### Fixed
- Race condition in payment processing (backend)
- Memory leak in WebSocket connections (backend)

### Security
- Patched SQL injection vulnerability in search (security)
```

### Update Rules
- Update CHANGELOG.md with EVERY deployment
- Keep entries brief (one line per change)
- Group by category (Added/Changed/Fixed/Security)
- Include component/agent responsible in parentheses
- Push CHANGELOG.md with related changes

## Continuous Deployment

### Deployment Trigger Points
```
Code merged to develop → Deploy to staging
Code merged to main → Deploy to production
Hotfix branch created → Deploy to production after validation
```

### Deployment Checklist
```bash
1. All tests pass in Docker ✓
2. Security scan complete ✓
3. Performance benchmarks met ✓
4. Documentation updated ✓
5. CHANGELOG.md updated ✓
6. Git changes pushed ✓
7. Deploy via devops-architect agent ✓
8. Verify deployment health ✓
9. Monitor for errors (15 min) ✓
```

## Parallel Agent Execution Examples

### Feature: User Authentication
```
START (parallel):
├─ engineering-lead: Create task breakdown
│
AFTER PLANNING (parallel):
├─ backend-developer: Implement JWT auth endpoints
├─ frontend-developer: Build login/register UI
├─ database-architect: Design user/session tables
└─ devops-architect: Setup Redis for sessions

AFTER IMPLEMENTATION (parallel):
├─ qa-automation: Write auth integration tests
├─ infosec-engineer: Security review of auth flow
└─ technical-writer: Document auth API endpoints

FINAL (sequential):
└─ devops-architect: Deploy to staging → production
```

### Feature: Payment Processing
```
START (parallel):
├─ engineering-lead: Analyze requirements & risks
│
AFTER PLANNING (parallel):
├─ backend-developer: Integrate Stripe API
├─ database-architect: Design payment/transaction schema
├─ frontend-developer: Build checkout UI
└─ infosec-engineer: PCI compliance review

AFTER IMPLEMENTATION (parallel):
├─ qa-automation: Write payment flow tests
├─ chaos-engineer: Test payment under load/failures
└─ technical-writer: Document payment API

FINAL (sequential):
├─ devops-architect: Deploy with feature flag
└─ root-cause-analyst: Monitor for issues
```

## Quality Gates

### Before Merge
- [ ] All Docker-based tests passing
- [ ] Security scan passed (infosec-engineer)
- [ ] Code review approved
- [ ] Documentation updated
- [ ] CHANGELOG.md updated

### Before Deploy
- [ ] Staging deployment successful
- [ ] Integration tests passing in Docker
- [ ] Performance benchmarks met
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured

## Anti-Patterns to Avoid

### ❌ Don't Do This
- Creating mock/fake data to bypass missing functionality
- Testing on local machine outside Docker
- Skipping git push "until feature is complete"
- Creating new files when existing ones can be extended
- Deploying without updating CHANGELOG.md
- Working locally with npm/pip instead of Docker

### ✅ Do This Instead
- Implement proper data generation/seeding in Docker
- Always test in containerized environment via MCP
- Push after every logical unit of work
- Edit existing files to add related functionality
- Update CHANGELOG.md with every deployment
- Use docker-compose exec for all development tasks

## Agent Handoff Protocol

When handing work between agents:
```markdown
FROM: engineering-lead
TO: backend-developer, database-architect

TASK: Implement user analytics feature
CONTEXT: See /docs/tasks/ANALYTICS-001-task-breakdown.md
DEPENDENCIES: 
  - Requires database schema (database-architect task #002)
  - Frontend components ready (frontend-developer task #003)
ACCEPTANCE CRITERIA:
  - API endpoints documented in OpenAPI
  - Tests passing in Docker
  - Changes pushed to git
  - CHANGELOG.md updated
```

---

**Remember**: Plan with engineering-lead → Execute in parallel → Test in Docker → Push immediately → Deploy continuously