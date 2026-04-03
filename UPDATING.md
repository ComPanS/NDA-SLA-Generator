
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

## Тарифы и отображение валют

- **Списание (YooKassa)** задаётся только полями `price` и `firstMonthPrice` в рублях в [`backend/src/config/subscriptions.ts`](backend/src/config/subscriptions.ts).
- **Цены в интерфейсе** (RUB, USD, EUR, GBP, THB) задаются в `pricesByCurrency` per plan; клиент не пересчитывает тарифы по курсу ЦБ.
- При изменении цифр соблюдайте правило: эквивалент в ₽ по курсу проверки (см. [`backend/src/config/subscriptionDisplayValidation.ts`](backend/src/config/subscriptionDisplayValidation.ts)) не должен быть **ниже** рублёвой цены тарифа. После правок прогоните `cd backend && npm test` (есть тест на конфиг и фикстурные курсы).
- Докупка одного договора: `SINGLE_CONTRACT_PRICES_BY_CURRENCY` в том же файле; списание — `SINGLE_CONTRACT_PRICES_BY_CURRENCY.RUB`.