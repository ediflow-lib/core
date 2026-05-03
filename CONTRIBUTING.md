# Contributing to EDIFlow

Thank you for your interest in contributing to EDIFlow! 🎉

## 🚀 Quick Start

```bash
git clone https://github.com/ediflow-lib/core.git
cd core
npm install
npm test          # all 857 tests must pass
```

## 🌿 Branch Workflow

- Branch from `develop`: `git checkout -b feature/short-name`
- Naming: `feature/us-X.Y-short-name` (lowercase, kebab-case)
- Never commit directly to `main` or `develop`

## ✅ Before Every Pull Request

1. `npm run build` — 0 errors, 0 warnings
2. `npm test` — all tests green
3. Every new function / class has at least one unit test
4. Every bug fix has a regression test
5. No `any`, no `@ts-ignore`, no `console.log` in production code

## 📝 Commit Convention

[Conventional Commits](https://www.conventionalcommits.org):

```
feat(parser): add X12 envelope validation
fix(cli): handle missing --standard flag gracefully
docs(examples): add EANCOM parse-desadv example
test(x12): add roundtrip test for 850
```

Types: `feat` · `fix` · `refactor` · `test` · `docs` · `chore` · `perf`

## 🏗️ Architecture

Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) before contributing.  
Dependency rule: `Domain ← Application ← Infrastructure ← Presentation`

## 💬 Get Help

- [GitHub Issues](https://github.com/ediflow-lib/core/issues) — bugs & feature requests
- [GitHub Discussions](https://github.com/ediflow-lib/core/discussions) — questions & ideas
- Email: hello.ediflow@gmail.com

## 📄 License

By contributing, you agree your contributions will be licensed under the MIT License.
