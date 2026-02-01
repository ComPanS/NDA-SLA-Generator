-- Add Yandex OAuth fields and allow passwordless accounts
ALTER TABLE "User"
  ADD COLUMN "yandexId" TEXT,
  ADD COLUMN "displayName" TEXT,
  ADD COLUMN "avatarUrl" TEXT,
  ALTER COLUMN "hashedPassword" DROP NOT NULL;

CREATE UNIQUE INDEX "User_yandexId_key" ON "User"("yandexId");
