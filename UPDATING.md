
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
npm run build
cd ..

# вернуть стэш при необходимости
# git stash pop

# перезапуск процессов
pm2 restart nda-backend --update-env
