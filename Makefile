.PHONY: help dev build lint lint-fix lint-all format format-check type-check \
        sonar sonar-scan sonar-check-token sonar-coverage docker-build docker-run clean

VERSION := $(shell cat VERSION 2>/dev/null || echo "dev")
IMAGE_NAME := stuartshay/otel-data-ui

ifneq (,$(wildcard .env.local))
include .env.local
export
endif

SONAR_HOST_URL ?= https://sonar.lab.informationcart.com
SONAR_PROJECT_KEY ?= otel-data-ui
SONAR_PROJECT_NAME ?= otel-data-ui
SONAR_SOURCES ?= src
SONAR_TESTS ?= src
SONAR_TEST_INCLUSIONS ?= **/*.test.ts,**/*.test.tsx
SONAR_EXCLUSIONS ?= src/__generated__/**,node_modules/**,dist/**,coverage/**,e2e/**
SONAR_COVERAGE_REPORT ?= coverage/lcov.info

help: ## Show this help
	@grep -hE '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

dev: ## Start development server
	npm run dev

build: ## Build for production
	npm run build

lint: ## Run ESLint
	npm run lint

lint-fix: ## Run ESLint with auto-fix
	npm run lint:fix

lint-all: ## Run all linters
	npm run lint:all

format: ## Format code with Prettier
	npm run format

format-check: ## Check formatting
	npm run format:check

type-check: ## Run TypeScript type checking
	npm run type-check

sonar: sonar-scan ## Run SonarQube analysis

sonar-check-token: ## Validate SonarQube token configuration
	@if [ -z "$${SONAR_TOKEN:-}" ]; then \
		echo "SONAR_TOKEN is required. Add it to .env.local or export it before running make sonar."; \
		exit 1; \
	fi

sonar-coverage: ## Generate coverage for SonarQube
	npm run test:coverage

sonar-scan: sonar-check-token sonar-coverage ## Run SonarQube scanner CLI
	npx sonar \
		-Dsonar.host.url="$(SONAR_HOST_URL)" \
		-Dsonar.token="$${SONAR_TOKEN}" \
		-Dsonar.projectKey="$(SONAR_PROJECT_KEY)" \
		-Dsonar.projectName="$(SONAR_PROJECT_NAME)" \
		-Dsonar.sources="$(SONAR_SOURCES)" \
		-Dsonar.tests="$(SONAR_TESTS)" \
		-Dsonar.test.inclusions="$(SONAR_TEST_INCLUSIONS)" \
		-Dsonar.exclusions="$(SONAR_EXCLUSIONS)" \
		-Dsonar.javascript.lcov.reportPaths="$(SONAR_COVERAGE_REPORT)"

docker-build: ## Build Docker image
	docker build --build-arg APP_VERSION=$(VERSION) -t $(IMAGE_NAME):$(VERSION) .

docker-run: ## Run Docker container locally
	docker run -p 8080:80 $(IMAGE_NAME):$(VERSION)

clean: ## Remove build artifacts
	rm -rf dist node_modules/.tmp
