# Release Process - EDIFlow

This document describes the complete release process for EDIFlow packages.

---

## 📋 Overview

EDIFlow uses a **monorepo with 5 separate NPM packages**. Each package can be versioned and released independently.

**Packages:**
- `@ediflow/core` - Core library
- `@ediflow/edifact-d96a` - D.96A standard
- `@ediflow/edifact-d01b` - D.01B standard
- `@ediflow/edifact-d20b` - D.20B standard
- `@ediflow/edifact-d12a` - D.12A standard

---

## 🎯 Release Types

### Alpha Release (0.x.x-alpha)
- Early testing
- Breaking changes possible
- Tagged with `@alpha` on NPM

### Beta Release (0.x.x-beta)
- Feature complete
- API stabilizing
- Tagged with `@beta` on NPM

### Production Release (1.x.x)
- Stable API
- Production-ready
- Tagged with `@latest` on NPM

---

## ✅ Pre-Release Checklist

### 1. Quality Checks

```bash
# Run all tests
npm test

# Check TypeScript compilation
npx tsc --noEmit

# Run build
npm run build

# Check for lint issues (if configured)
npm run lint
```

**All checks must pass before proceeding!**

### 2. Version Numbers

Update version in relevant `package.json` files:

```bash
# For core package
cd packages/core
npm version patch  # or minor, major

# For standard packages
cd packages/edifact-d20b
npm version patch
```

**Semantic Versioning Rules:**
- **MAJOR** (1.0.0 → 2.0.0) - Breaking changes
- **MINOR** (1.0.0 → 1.1.0) - New features (backward compatible)
- **PATCH** (1.0.0 → 1.0.1) - Bug fixes

### 3. Update CHANGELOG.md

Add changes to `CHANGELOG.md`:

```markdown
## [0.2.0] - 2026-02-15

### Added
- New feature X
- Support for Y

### Changed
- Improved performance of Z

### Fixed
- Fixed bug in parser

### Breaking Changes
- None
```

### 4. Update Documentation

- [ ] Update README.md (if needed)
- [ ] Update package READMEs (if needed)
- [ ] Update QUICK_START.md (if API changed)
- [ ] Update ARCHITECTURE.md (if structure changed)

### 5. Commit Changes

```bash
git add .
git commit -m "chore(release): prepare v0.2.0

- Updated package versions
- Updated CHANGELOG.md
- Updated documentation

Release: v0.2.0
Tests: 590 passing
Quality: 0 TypeScript errors"
```

---

## 🚀 Release Phase

### 1. Create Git Tag

```bash
# Create annotated tag
git tag -a v0.2.0 -m "Release v0.2.0"

# Push tag to GitHub
git push origin v0.2.0

# Push changes
git push origin develop
```

### 2. NPM Publish - Dry Run

**Test publish WITHOUT actually publishing:**

```bash
# Test core package
cd packages/core
npm publish --dry-run

# Review output - check:
# - Files included/excluded
# - Package size
# - No test files
# - No source files (only dist/)

# Test standard packages
cd packages/edifact-d20b
npm publish --dry-run
```

### 3. NPM Publish - Actual Release

**Recommended: CI via npm Trusted Publishing (no token).** Push a tag `<package-dir>-v<version>` (must match the version in `package.json`); `.github/workflows/publish.yml` tests, builds and publishes that package:

```bash
git tag core-v0.3.2 && git push origin core-v0.3.2
git tag x12-004010-v0.3.1 && git push origin x12-004010-v0.3.1
```

Each package needs a Trusted Publisher configured once on npmjs.com (package → Settings): GitHub Actions, organization `ediflow-lib`, repository `core`, workflow `publish.yml`.

**Manual fallback (local, requires 2FA OTP):**

**For production release:**

```bash
# Login to NPM (if not already)
npm whoami  # Check current user
npm login   # Login if needed

# Publish core package
cd packages/core
npm publish --access public

# Publish standard packages
cd ../edifact-d96a
npm publish --access public

cd ../edifact-d01b
npm publish --access public

cd ../edifact-d20b
npm publish --access public

cd ../edifact-d12a
npm publish --access public
```

**For alpha/beta release:**

```bash
# Publish with tag
npm publish --access public --tag alpha
# OR
npm publish --access public --tag beta
```

### 4. Verify NPM Packages

Check packages on NPM:

```bash
# View package info
npm view @ediflow/core
npm view @ediflow/edifact-d20b

# Check version
npm view @ediflow/core version

# Check files
npm view @ediflow/core files
```

Visit package pages:
- https://www.npmjs.com/package/@ediflow/core
- https://www.npmjs.com/package/@ediflow/edifact-d20b
- etc.

### 5. Create GitHub Release

1. Go to: https://github.com/ediflow-lib/core/releases
2. Click "Create new release"
3. Configure release:
   - **Tag:** v0.2.0 (select existing tag)
   - **Title:** v0.2.0 - Short description
   - **Description:** Copy from CHANGELOG.md

Example release notes:

```markdown
# EDIFlow v0.2.0

## 🎉 What's New

- New feature X
- Support for Y
- Improved performance of Z

## 📦 Packages Released

- `@ediflow/core@0.2.0`
- `@ediflow/edifact-d96a@0.2.0`
- `@ediflow/edifact-d01b@0.2.0`
- `@ediflow/edifact-d20b@0.2.0`
- `@ediflow/edifact-d12a@0.2.0`

## 📝 Full Changelog

See [CHANGELOG.md](CHANGELOG.md) for complete details.

## 🐛 Bug Fixes

- Fixed bug in parser
- Fixed validation issue

## ⚠️ Breaking Changes

None

## 📚 Documentation

- [Quick Start Guide](docs/QUICK_START.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Developer Guide](docs/DEVELOPER_GUIDE.md)

## 🙏 Contributors

Thank you to all contributors who made this release possible!
```

4. Mark as "pre-release" if alpha/beta
5. Click "Publish release"

---

## ✅ Post-Release Checklist

### 1. Verify Installation

Test installation in a separate project:

```bash
# Create test project
mkdir test-ediflow-install
cd test-ediflow-install
npm init -y

# Install packages
npm install @ediflow/core
npm install @ediflow/edifact-d20b

# Verify installation
ls node_modules/@ediflow/

# Test imports
cat > test.js << 'EOF'
const { DIContainer } = require('@ediflow/core');
console.log('✅ Import successful!');
EOF

node test.js
```

### 2. Test TypeScript Types

```typescript
// test.ts
import { DIContainer, EDIMessage } from '@ediflow/core';

const container = DIContainer.getInstance();
const parseUseCase = container.resolve('ParseEDIUseCase');

// TypeScript should recognize types
const result = parseUseCase.execute({
  message: '...',
  standard: 'EDIFACT'
});

console.log(result.message); // Types work!
```

### 3. Test CJS/ESM Builds

```bash
# Test CommonJS
node -e "const x = require('@ediflow/core'); console.log('CJS:', !!x)"

# Test ESM
node --input-type=module -e "import('@ediflow/core').then(x => console.log('ESM:', !!x))"
```

### 4. Monitor NPM Stats

- Check download stats: https://npm-stat.com/charts.html?package=@ediflow/core
- Monitor for issues: https://github.com/ediflow-lib/core/issues

### 5. Announce Release (Optional)

- Twitter/X: Announce new release
- LinkedIn: Share update
- Dev.to: Write blog post
- GitHub Discussions: Announcement post

---

## 🔄 Rollback Procedure

### If Something Goes Wrong

#### Option 1: Unpublish (within 72 hours)

```bash
# Unpublish specific version
npm unpublish @ediflow/core@0.2.0

# ⚠️ Warning: Can only unpublish within 72 hours
# ⚠️ Warning: Cannot republish the same version
```

#### Option 2: Deprecate Version

```bash
# Deprecate problematic version
npm deprecate @ediflow/core@0.2.0 "This version has issues, use 0.2.1 instead"

# Users will see warning when installing
```

#### Option 3: Publish Hotfix

```bash
# Fix the issue
# Bump version: 0.2.0 → 0.2.1
npm version patch

# Publish hotfix
npm publish --access public

# Update GitHub release notes
# Communicate to users
```

### Emergency Rollback Steps

1. **Identify issue** - Determine severity
2. **Communicate** - Post GitHub issue immediately
3. **Deprecate** - Deprecate bad version on NPM
4. **Fix** - Create hotfix branch
5. **Test** - Verify fix works
6. **Publish** - Release hotfix version
7. **Verify** - Test hotfix installation
8. **Announce** - Update users

---

## 🐛 Troubleshooting

### Problem: "Package already exists"

**Cause:** Version number already published

**Solution:**
```bash
# Bump version
npm version patch

# Try again
npm publish
```

### Problem: "Permission denied"

**Cause:** Not logged in or no access rights

**Solution:**
```bash
# Check login
npm whoami

# Login if needed
npm login

# Verify org access
npm org ls @ediflow
```

### Problem: "Package size too large"

**Cause:** Including unnecessary files

**Solution:**
```bash
# Check what will be published
npm publish --dry-run

# Review .npmignore
# Ensure src/, test/, docs/ are excluded
# Only dist/ should be included
```

### Problem: "Build fails on publish"

**Cause:** Build script in prepublishOnly

**Solution:**
```bash
# Build manually first
npm run build

# Then publish
npm publish
```

### Problem: "Types not working"

**Cause:** Missing or incorrect TypeScript definitions

**Solution:**
```bash
# Check package.json
{
  "types": "./dist/index.d.ts",  // Must point to .d.ts file
  "exports": {
    ".": {
      "types": "./dist/index.d.ts"  // Also here
    }
  }
}

# Verify dist/ contains .d.ts files
ls dist/*.d.ts
```

---

## 📊 Release Metrics

### Track After Each Release

- **Downloads:** Check npm-stat.com
- **GitHub Stars:** Monitor growth
- **Issues Opened:** Track bug reports
- **GitHub Discussions:** Community questions
- **Install Success Rate:** Via telemetry (if implemented)

### Release Cadence

- **Patches:** As needed (bug fixes)
- **Minor:** Every 2-4 weeks (new features)
- **Major:** Every 3-6 months (breaking changes)

---

## 📝 Release Checklist Template

Copy this for each release:

```markdown
## Release Checklist - v0.X.X

### Pre-Release
- [ ] All tests passing
- [ ] Build successful
- [ ] 0 TypeScript errors
- [ ] Version numbers updated
- [ ] CHANGELOG.md updated
- [ ] Documentation updated
- [ ] Changes committed

### Release
- [ ] Git tag created
- [ ] Tag pushed to GitHub
- [ ] npm publish --dry-run successful (all packages)
- [ ] npm publish successful (all packages)
- [ ] Packages visible on NPM
- [ ] GitHub Release created

### Post-Release
- [ ] Test installation in separate project
- [ ] Verify imports work
- [ ] Verify TypeScript types work
- [ ] Verify CJS/ESM builds work
- [ ] Monitor for issues (24 hours)
- [ ] Announce release (optional)

### Verification
- [ ] @ediflow/core@X.X.X - https://npmjs.com/package/@ediflow/core
- [ ] @ediflow/edifact-d96a@X.X.X
- [ ] @ediflow/edifact-d01b@X.X.X
- [ ] @ediflow/edifact-d20b@X.X.X
- [ ] @ediflow/edifact-d12a@X.X.X
```

---

## 🎯 Best Practices

### ✅ DO

- Test thoroughly before publishing
- Use semantic versioning correctly
- Update CHANGELOG.md for every release
- Create GitHub releases with detailed notes
- Test installation after publishing
- Monitor for issues post-release
- Communicate breaking changes clearly

### ❌ DON'T

- Publish without running tests
- Skip version bumping
- Forget to update CHANGELOG
- Publish from local machine without reviewing
- Make breaking changes in patch/minor releases
- Ignore post-release issues

---

## 📚 Additional Resources

- **NPM Publishing Guide:** https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry
- **Semantic Versioning:** https://semver.org/
- **Keep a Changelog:** https://keepachangelog.com/
- **Conventional Commits:** https://www.conventionalcommits.org/

---

## 🤝 Questions?

- **GitHub Discussions:** [Ask questions](https://github.com/ediflow-lib/core/discussions)
- **Email:** hello.ediflow@gmail.com

---

**Next:** Ready to release? Follow the checklist step by step! 🚀
