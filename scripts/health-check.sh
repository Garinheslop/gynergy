#!/bin/bash

# Gynergy Health Check Script
# Run this before each commit or deployment

set -e

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║               GYNERGY HEALTH CHECK                            ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS="${GREEN}✓${NC}"
FAIL="${RED}✗${NC}"
WARN="${YELLOW}⚠${NC}"

ERRORS=0

# 1. TypeScript Check
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. TypeScript Compilation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if npm run type-check > /dev/null 2>&1; then
    echo -e "   ${PASS} TypeScript compiles without errors"
else
    echo -e "   ${FAIL} TypeScript compilation failed"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 2. Unit Tests
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. Unit Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
TEST_OUTPUT=$(npm run test:unit 2>&1)
if echo "$TEST_OUTPUT" | grep -q "passed"; then
    TESTS_PASSED=$(echo "$TEST_OUTPUT" | grep -oE "[0-9]+ passed" | head -1)
    echo -e "   ${PASS} All tests passed (${TESTS_PASSED})"
else
    echo -e "   ${FAIL} Some tests failed"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 3. Build Check
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. Production Build"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if npm run build > /dev/null 2>&1; then
    echo -e "   ${PASS} Production build successful"
else
    echo -e "   ${FAIL} Production build failed"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 4. Security Audit (Warning only)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. Security Audit"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
AUDIT_OUTPUT=$(npm audit 2>&1 || true)
if echo "$AUDIT_OUTPUT" | grep -q "found 0 vulnerabilities"; then
    echo -e "   ${PASS} No vulnerabilities found"
elif echo "$AUDIT_OUTPUT" | grep -q "high\|critical"; then
    HIGH_COUNT=$(echo "$AUDIT_OUTPUT" | grep -oE "[0-9]+ high" || echo "0 high")
    CRITICAL_COUNT=$(echo "$AUDIT_OUTPUT" | grep -oE "[0-9]+ critical" || echo "0 critical")
    echo -e "   ${WARN} Vulnerabilities found: ${HIGH_COUNT}, ${CRITICAL_COUNT}"
else
    echo -e "   ${WARN} Some vulnerabilities found (low/moderate)"
fi
echo ""

# 5. Git Status
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. Git Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
BRANCH=$(git branch --show-current)
echo "   Branch: ${BRANCH}"

if git diff --quiet && git diff --staged --quiet; then
    echo -e "   ${PASS} Working directory clean"
else
    CHANGES=$(git status --short | wc -l | tr -d ' ')
    echo -e "   ${WARN} ${CHANGES} uncommitted changes"
fi

COMMITS_AHEAD=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo "0")
if [ "$COMMITS_AHEAD" -gt 0 ]; then
    echo -e "   ${WARN} ${COMMITS_AHEAD} commits ahead of origin/main"
fi
echo ""

# Summary
echo "═══════════════════════════════════════════════════════════════"
echo "                        SUMMARY"
echo "═══════════════════════════════════════════════════════════════"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}"
    echo "   ╔═══════════════════════════════════════╗"
    echo "   ║   ALL CHECKS PASSED                   ║"
    echo "   ║   Ready for deployment                ║"
    echo "   ╚═══════════════════════════════════════╝"
    echo -e "${NC}"
    exit 0
else
    echo -e "${RED}"
    echo "   ╔═══════════════════════════════════════╗"
    echo "   ║   ${ERRORS} CHECK(S) FAILED                   ║"
    echo "   ║   Fix issues before proceeding        ║"
    echo "   ╚═══════════════════════════════════════╝"
    echo -e "${NC}"
    exit 1
fi
