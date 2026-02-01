-- Adjust verification flow to store pending registrations by email
-- Drop old constraint/index
DROP INDEX IF EXISTS "EmailVerificationCode_userId_code_key";
ALTER TABLE "EmailVerificationCode" DROP CONSTRAINT IF EXISTS "EmailVerificationCode_userId_fkey";

-- Remove userId and add email/hashedPassword
ALTER TABLE "EmailVerificationCode"
  DROP COLUMN IF EXISTS "userId",
  ADD COLUMN     "email" TEXT NOT NULL,
  ADD COLUMN     "hashedPassword" TEXT NOT NULL;

-- Ensure single active record per email
CREATE UNIQUE INDEX "EmailVerificationCode_email_key" ON "EmailVerificationCode"("email");
