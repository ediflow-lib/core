#!/bin/sh
#
# Git Pre-Commit Hook
# Prevents commits with TypeScript errors or failing tests
#
# Installation:
#   chmod +x .git/hooks/pre-commit
#   cp scripts/pre-commit-check.sh .git/hooks/pre-commit

echo "🔍 Running pre-commit checks..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if on develop or main (should NEVER commit directly)
BRANCH=$(git symbolic-ref HEAD 2>/dev/null | cut -d"/" -f 3)
if [ "$BRANCH" = "develop" ] || [ "$BRANCH" = "main" ]; then
  echo "${RED}❌ FATAL: Direct commit to $BRANCH is not allowed!${NC}"
  echo "${YELLOW}👉 Create a feature branch: git checkout -b feature/usX.X-name${NC}"
  exit 1
fi

# 1. Check TypeScript compilation
echo "1️⃣  Checking TypeScript..."
npm run typecheck > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "${RED}❌ TypeScript errors found!${NC}"
  echo "${YELLOW}👉 Fix errors in WebStorm (Bottom panel → Problems)${NC}"
  echo "${YELLOW}👉 Or run: npm run typecheck${NC}"
  exit 1
fi
echo "${GREEN}✅ TypeScript OK${NC}"

# 2. Run tests
echo "2️⃣  Running tests..."
npm test -- --run > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "${RED}❌ Tests failed!${NC}"
  echo "${YELLOW}👉 Run: npm test${NC}"
  exit 1
fi
echo "${GREEN}✅ Tests OK${NC}"

# 3. Check for console.log (warning only)
echo "3️⃣  Checking for console.log..."
if git diff --cached --name-only | grep -E '\.(ts|js)$' | xargs grep -n "console\.log" > /dev/null 2>&1; then
  echo "${YELLOW}⚠️  Warning: console.log() found in staged files${NC}"
  echo "${YELLOW}👉 Remove debug statements before committing${NC}"
  # Don't exit, just warn
fi

# 4. Check for TODO without ticket (warning only)
echo "4️⃣  Checking for unlinked TODOs..."
if git diff --cached --name-only | grep -E '\.(ts|js)$' | xargs grep -n "TODO:" | grep -v "TODO: #" > /dev/null 2>&1; then
  echo "${YELLOW}⚠️  Warning: TODO without ticket number found${NC}"
  echo "${YELLOW}👉 Link TODOs to issues: TODO: #123${NC}"
  # Don't exit, just warn
fi

echo ""
echo "${GREEN}✅ All checks passed! Committing...${NC}"
echo ""
exit 0
