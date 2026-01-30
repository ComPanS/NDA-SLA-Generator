# Makefile для упрощения команд разработки

.PHONY: help install dev build start stop clean logs test

# Цвета для вывода
GREEN  := $(shell tput -Txterm setaf 2)
YELLOW := $(shell tput -Txterm setaf 3)
WHITE  := $(shell tput -Txterm setaf 7)
RESET  := $(shell tput -Txterm sgr0)

help: ## Показать эту справку
	@echo ''
	@echo 'Usage:'
	@echo '  ${YELLOW}make${RESET} ${GREEN}<target>${RESET}'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  ${YELLOW}%-15s${GREEN}%s${RESET}\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Установить все зависимости
	@echo "${GREEN}Installing backend dependencies...${RESET}"
	cd backend && npm install
	@echo "${GREEN}Installing frontend dependencies...${RESET}"
	cd frontend && npm install
	@echo "${GREEN}Done!${RESET}"

dev: ## Запустить dev окружение
	@echo "${GREEN}Starting dev servers...${RESET}"
	@echo "${YELLOW}Backend: http://localhost:8001${RESET}"
	@echo "${YELLOW}Frontend: http://localhost:5173${RESET}"
	@$(MAKE) -j2 dev-backend dev-frontend

dev-backend: ## Запустить только backend
	cd backend && npm run dev

dev-frontend: ## Запустить только frontend
	cd frontend && npm run dev

build: ## Собрать проекты для production
	@echo "${GREEN}Building projects...${RESET}"
	cd backend && npm run build
	cd frontend && npm run build
	@echo "${GREEN}Build complete!${RESET}"

docker-build: ## Собрать Docker образы
	@echo "${GREEN}Building Docker images...${RESET}"
	docker-compose build
	@echo "${GREEN}Done!${RESET}"

docker-up: ## Запустить все сервисы в Docker
	@echo "${GREEN}Starting Docker services...${RESET}"
	docker-compose up -d
	@echo "${YELLOW}Backend: http://localhost:8001${RESET}"
	@echo "${YELLOW}Frontend: http://localhost:5173${RESET}"
	@echo "${YELLOW}PostgreSQL: localhost:5432${RESET}"

docker-down: ## Остановить все Docker сервисы
	@echo "${GREEN}Stopping Docker services...${RESET}"
	docker-compose down

docker-logs: ## Показать логи Docker контейнеров
	docker-compose logs -f

docker-clean: ## Удалить все Docker контейнеры и volumes
	@echo "${YELLOW}Warning: This will remove all containers and volumes!${RESET}"
	docker-compose down -v
	docker system prune -f

db-migrate: ## Применить миграции базы данных
	@echo "${GREEN}Running database migrations...${RESET}"
	cd backend && npx prisma migrate dev

db-reset: ## Сбросить базу данных
	@echo "${YELLOW}Warning: This will delete all data!${RESET}"
	cd backend && npx prisma migrate reset

db-studio: ## Открыть Prisma Studio
	@echo "${GREEN}Opening Prisma Studio...${RESET}"
	cd backend && npx prisma studio

test: ## Запустить все тесты
	@echo "${GREEN}Running tests...${RESET}"
	cd backend && npm test
	cd frontend && npm test

test-backend: ## Запустить backend тесты
	cd backend && npm test

test-frontend: ## Запустить frontend тесты
	cd frontend && npm test

lint: ## Проверить код линтером
	@echo "${GREEN}Linting...${RESET}"
	cd backend && npm run lint
	cd frontend && npm run lint

format: ## Форматировать код
	@echo "${GREEN}Formatting code...${RESET}"
	cd backend && npm run format || true
	cd frontend && npm run format

clean: ## Очистить node_modules и build файлы
	@echo "${GREEN}Cleaning...${RESET}"
	rm -rf backend/node_modules backend/dist
	rm -rf frontend/node_modules frontend/dist
	@echo "${GREEN}Done!${RESET}"

logs-backend: ## Показать логи backend (если используется PM2)
	pm2 logs nda-backend

logs-frontend: ## Показать логи frontend dev сервера
	cd frontend && npm run dev

setup: install db-migrate ## Первичная настройка проекта
	@echo "${GREEN}Setup complete!${RESET}"
	@echo "${YELLOW}Run 'make dev' to start development servers${RESET}"

production: build ## Подготовить к production запуску
	@echo "${GREEN}Production build ready!${RESET}"
	@echo "${YELLOW}Deploy the dist folders to your server${RESET}"
