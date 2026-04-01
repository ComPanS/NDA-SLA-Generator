
cd /var/www/dogovorai

# Зависимости: в репозитории два Node-проекта (`backend/`, `frontend/`), у каждого свой `package-lock.json`.
# Команды `npm audit` / `npm audit fix` нужно запускать из этих каталогов, не из корня репозитория (иначе npm 10 выдаст ENOLOCK).
# После `git pull` на сервере достаточно `npm ci` в `backend` и `frontend` — исправления уязвимостей должны быть уже в закоммиченных lockfile.

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
npm run build
cd ..

# вернуть стэш при необходимости
# git stash pop

# перезапуск процессов
pm2 restart nda-backend --update-env
