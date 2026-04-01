
cd /var/www/dogovorai

# обновиться
git pull 

# backend deps
cd backend
npm ci
npm run build
# если нужно применить миграции:
npx prisma migrate deploy
cd ..

# frontend deps + сборка
cd frontend
npm ci
# Chromium для post-build prerender лендинга (после смены версии Playwright — повторить)
npx playwright install chromium
# для корректных canonical/og в пререндере задайте URL прода (или пропишите в .env перед сборкой)
export VITE_SITE_URL=https://dogovarai.ru
npm run build
# быстрая сборка без пререндера (если нет браузера на сервере): npm run build:skip-prerender
cd ..

# вернуть стэш при необходимости
# git stash pop

# перезапуск процессов
pm2 restart nda-backend --update-env
