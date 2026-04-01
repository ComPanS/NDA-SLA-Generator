-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "jurisdictionCountry" TEXT NOT NULL DEFAULT 'RU',
ADD COLUMN     "outputLanguage" TEXT NOT NULL DEFAULT 'ru';

-- AlterTable
ALTER TABLE "Template" ADD COLUMN     "defaultCountryCode" TEXT;
