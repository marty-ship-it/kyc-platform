# Git Branching Strategy

## Branch Structure

```
main (production)
  └── dev (development/integration)
       ├── feature/feature-name
       ├── fix/bug-description
       └── enhancement/improvement-name
```

## Branches

### `main` - Production Branch
- **Protected**: Stable, production-ready code
- **Deployments**: Railway production environment
- **Merges from**: `dev` branch only (via PR)
- **Never commit directly** to this branch

### `dev` - Development Branch
- **Current working branch**: ✅ Active development happens here
- **Deployments**: Can deploy to Railway staging environment
- **Merges from**: Feature branches, fixes, enhancements
- **Merges to**: `main` (when ready for production release)

### Feature Branches
- **Naming**: `feature/entity-import`, `feature/advanced-screening`
- **Created from**: `dev`
- **Merged to**: `dev` (via PR or direct merge)
- **Delete after**: Merge completion

## Workflow

### Starting New Feature Development

```bash
# Ensure you're on dev and up to date
git checkout dev
git pull origin dev

# Create feature branch
git checkout -b feature/your-feature-name

# Work on your feature...
git add .
git commit -m "feat: implement your feature"

# Push to remote
git push -u origin feature/your-feature-name
```

### Merging Feature to Dev

```bash
# Update dev first
git checkout dev
git pull origin dev

# Merge feature (or create PR on GitHub)
git merge feature/your-feature-name

# Push to remote
git push origin dev

# Delete feature branch (optional)
git branch -d feature/your-feature-name
git push origin --delete feature/your-feature-name
```

### Releasing to Production

```bash
# When dev is stable and ready for production
git checkout main
git pull origin main

# Merge dev into main
git merge dev

# Push to production
git push origin main

# Tag the release (optional but recommended)
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

### Quick Fixes on Dev

```bash
# Already on dev
git checkout dev

# Make fix
git add .
git commit -m "fix: resolve database connection issue"
git push origin dev
```

## Current Status

✅ **You are now on**: `dev` branch
- All feature development should happen here or in feature branches
- `main` remains clean for production deployments
- Both branches are synced with the latest CLAUDE.md documentation

## Commit Message Convention

Use conventional commits for clarity:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Build tasks, dependencies
- `perf:` - Performance improvements

Example:
```bash
git commit -m "feat: add entity bulk import endpoint"
git commit -m "fix: correct KYC reuse calculation for HIGH risk entities"
git commit -m "docs: update API documentation for screening endpoints"
```

## Railway Deployment Notes

### Current Setup
- **Production (main)**: Deploys automatically on push to `main`
- **Development (dev)**: Can be configured for staging environment

### Adding Staging Environment (Optional)

If you want automatic deployments for the `dev` branch:

1. Create a new Railway service for staging
2. Connect it to the `dev` branch
3. Use separate DATABASE_URL for staging
4. Set NEXTAUTH_URL to staging domain

## Quick Reference

```bash
# Check current branch
git branch

# Switch to dev
git checkout dev

# Switch to main
git checkout main

# Create new feature branch from dev
git checkout dev
git checkout -b feature/new-feature

# View all branches
git branch -a

# Delete local branch
git branch -d branch-name

# Delete remote branch
git push origin --delete branch-name
```
