#!/bin/bash
# =============================================================================
# otel-data-ui Development Environment Setup
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}=================================${NC}"
echo -e "${GREEN}otel-data-ui Setup${NC}"
echo -e "${GREEN}=================================${NC}"
echo ""

REQUIRED_NODE_VERSION="22"

# Step 1: Check git
echo -e "${BLUE}Step 1: Checking git...${NC}"
if ! command -v git &> /dev/null; then
    echo -e "${RED}Error: git is not installed${NC}"
    exit 1
fi
GIT_VERSION=$(git --version)
echo -e "${GREEN}✓ ${GIT_VERSION}${NC}"
echo ""

# Step 2: Check nvm / Node.js
echo -e "${BLUE}Step 2: Checking Node.js...${NC}"
if [ -s "$HOME/.nvm/nvm.sh" ]; then
    export NVM_DIR="$HOME/.nvm"
    # shellcheck source=/dev/null
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    echo -e "${GREEN}✓ nvm found${NC}"

    if ! nvm use --delete-prefix ${REQUIRED_NODE_VERSION} &>/dev/null; then
        echo -e "${YELLOW}Installing Node.js ${REQUIRED_NODE_VERSION}...${NC}"
        nvm install ${REQUIRED_NODE_VERSION}
        nvm use --delete-prefix ${REQUIRED_NODE_VERSION}
    else
        echo -e "${GREEN}✓ Node.js ${REQUIRED_NODE_VERSION} already installed${NC}"
        nvm use --delete-prefix ${REQUIRED_NODE_VERSION}
    fi
else
    echo -e "${YELLOW}⚠ nvm not found, checking system Node.js...${NC}"
    if ! command -v node &> /dev/null; then
        echo -e "${RED}Error: Node.js is not installed${NC}"
        echo "Install nvm: https://github.com/nvm-sh/nvm"
        exit 1
    fi
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✓ Node.js ${NODE_VERSION}${NC}"

NODE_MAJOR=$(node --version | cut -d. -f1 | sed 's/v//')
if [ "$NODE_MAJOR" -lt "$REQUIRED_NODE_VERSION" ]; then
    echo -e "${RED}Error: Node.js ${REQUIRED_NODE_VERSION}.x or higher is required${NC}"
    exit 1
fi

NPM_VERSION=$(npm --version)
echo -e "${GREEN}✓ npm ${NPM_VERSION}${NC}"
echo ""

# Step 3: Install dependencies
echo -e "${BLUE}Step 3: Installing npm dependencies...${NC}"
if npm install; then
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${RED}Error: Failed to install npm dependencies${NC}"
    exit 1
fi
echo ""

# Step 4: Setup Husky git hooks
echo -e "${BLUE}Step 4: Setting up Husky git hooks...${NC}"
if [ -d ".git" ]; then
    if npm run prepare &>/dev/null; then
        echo -e "${GREEN}✓ Husky initialized${NC}"
        if [ -f .husky/pre-commit ]; then
            chmod +x .husky/pre-commit
            echo -e "${GREEN}✓ Pre-commit hook configured (runs lint-staged)${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ Husky initialization failed${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Not a git repository - skipping Husky setup${NC}"
fi
echo ""

# Step 5: Check Docker
echo -e "${BLUE}Step 5: Checking Docker...${NC}"
if command -v docker &> /dev/null; then
    if docker info &> /dev/null 2>&1; then
        DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | tr -d ',')
        echo -e "${GREEN}✓ Docker ${DOCKER_VERSION} is running${NC}"
    else
        echo -e "${YELLOW}⚠ Docker installed but not running${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Docker not installed (optional)${NC}"
fi
echo ""

# Step 6: Create .env.local template
echo -e "${BLUE}Step 6: Checking environment configuration...${NC}"
if [ ! -f ".env.local" ]; then
    cat > .env.local << 'EOF'
# otel-data-ui configuration
VITE_GRAPHQL_URL=https://gateway.lab.informationcart.com
VITE_COGNITO_DOMAIN=homelab-auth.auth.us-east-1.amazoncognito.com
VITE_COGNITO_CLIENT_ID=5j475mtdcm4qevh7q115qf1sfj
VITE_COGNITO_REDIRECT_URI=http://localhost:5173/callback
VITE_COGNITO_ISSUER=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_ZL7M5Qa7K
EOF
    echo -e "${GREEN}✓ Template .env.local created${NC}"
else
    echo -e "${YELLOW}.env.local already exists${NC}"
fi
echo ""

# Step 7: Build validation
echo -e "${BLUE}Step 7: Validating build...${NC}"
if npm run type-check; then
    echo -e "${GREEN}✓ TypeScript check passed${NC}"
else
    echo -e "${RED}TypeScript check failed${NC}"
    exit 1
fi

if npm run build; then
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${RED}Build failed${NC}"
    exit 1
fi
echo ""

# Summary
echo -e "${GREEN}=================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${GREEN}=================================${NC}"
echo ""
echo "Pre-commit hooks are active. On every commit, lint-staged will:"
echo "  • ESLint + Prettier on *.ts, *.tsx files"
echo "  • Prettier on *.json, *.css files"
echo "  • markdownlint + Prettier on *.md files"
echo ""
echo "Next steps:"
echo "  1. Review .env.local configuration"
echo "  2. Run dev server:  npm run dev"
echo "  3. Open browser:    http://localhost:5173"
echo ""
echo "Commands:"
echo "  make dev           - Start development server"
echo "  make lint-all      - Run all linters"
echo "  make format        - Format code with Prettier"
echo "  make type-check    - TypeScript type checking"
echo "  make build         - Production build"
echo "  make docker-build  - Build Docker image"
echo ""
