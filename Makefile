.PHONY: help dev build lint lint-fix lint-all format format-check type-check \
        docker-build docker-run clean

VERSION := $(shell cat VERSION 2>/dev/null || echo "dev")
IMAGE_NAME := stuartshay/otel-data-ui

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
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

docker-build: ## Build Docker image
	docker build --build-arg APP_VERSION=$(VERSION) -t $(IMAGE_NAME):$(VERSION) .

docker-run: ## Run Docker container locally
	docker run -p 8080:80 $(IMAGE_NAME):$(VERSION)

clean: ## Remove build artifacts
	rm -rf dist node_modules/.tmp
