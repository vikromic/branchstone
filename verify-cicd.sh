#!/bin/bash
# CI/CD Installation Verification Script

echo "========================================"
echo "CI/CD Pipeline Verification"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✓${NC} $1"
    return 0
  else
    echo -e "${RED}✗${NC} $1 (MISSING)"
    return 1
  fi
}

check_dir() {
  if [ -d "$1" ]; then
    echo -e "${GREEN}✓${NC} $1/"
    return 0
  else
    echo -e "${RED}✗${NC} $1/ (MISSING)"
    return 1
  fi
}

ERRORS=0

echo "Checking GitHub Actions workflows..."
check_file ".github/workflows/ci.yml" || ((ERRORS++))
check_file ".github/workflows/deploy.yml" || ((ERRORS++))
echo ""

echo "Checking documentation..."
check_file ".github/CICD.md" || ((ERRORS++))
check_file ".github/SETUP.md" || ((ERRORS++))
check_file ".github/QUICK_REFERENCE.md" || ((ERRORS++))
check_file "CICD_IMPLEMENTATION_SUMMARY.md" || ((ERRORS++))
echo ""

echo "Checking configuration files..."
check_file "package.json" || ((ERRORS++))
check_file "jest.config.js" || ((ERRORS++))
check_file "babel.config.js" || ((ERRORS++))
check_file ".prettierrc.json" || ((ERRORS++))
check_file ".prettierignore" || ((ERRORS++))
check_file ".gitignore" || ((ERRORS++))
echo ""

echo "Checking test infrastructure..."
check_dir "tests" || ((ERRORS++))
check_file "tests/setup.js" || ((ERRORS++))
check_file "tests/utils/config.test.js" || ((ERRORS++))
echo ""

echo "Checking package.json scripts..."
if grep -q "\"test:ci\"" package.json; then
  echo -e "${GREEN}✓${NC} test:ci script"
else
  echo -e "${RED}✗${NC} test:ci script (MISSING)"
  ((ERRORS++))
fi

if grep -q "\"lint\"" package.json; then
  echo -e "${GREEN}✓${NC} lint script"
else
  echo -e "${RED}✗${NC} lint script (MISSING)"
  ((ERRORS++))
fi

if grep -q "\"validate\"" package.json; then
  echo -e "${GREEN}✓${NC} validate script"
else
  echo -e "${RED}✗${NC} validate script (MISSING)"
  ((ERRORS++))
fi
echo ""

echo "Checking dependencies..."
if [ -f "package.json" ]; then
  if grep -q "\"jest\"" package.json; then
    echo -e "${GREEN}✓${NC} Jest dependency"
  else
    echo -e "${RED}✗${NC} Jest dependency (MISSING)"
    ((ERRORS++))
  fi

  if grep -q "\"eslint\"" package.json; then
    echo -e "${GREEN}✓${NC} ESLint dependency"
  else
    echo -e "${RED}✗${NC} ESLint dependency (MISSING)"
    ((ERRORS++))
  fi

  if grep -q "\"prettier\"" package.json; then
    echo -e "${GREEN}✓${NC} Prettier dependency"
  else
    echo -e "${RED}✗${NC} Prettier dependency (MISSING)"
    ((ERRORS++))
  fi
fi
echo ""

echo "========================================"
if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}✓ All checks passed!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Install dependencies: npm install"
  echo "2. Run tests locally: npm test"
  echo "3. Run full validation: npm run validate"
  echo "4. Push to GitHub to trigger CI/CD"
  echo "5. Follow .github/SETUP.md for GitHub configuration"
  exit 0
else
  echo -e "${RED}✗ Found $ERRORS errors${NC}"
  echo ""
  echo "Please check the missing files above."
  exit 1
fi
