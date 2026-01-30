-- CreateEnum
CREATE TYPE "TemplateFieldType" AS ENUM ('text');

-- CreateTable
CREATE TABLE "TemplateGroup" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemplateGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateField" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "type" "TemplateFieldType" NOT NULL DEFAULT 'text',
    "defaultValue" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemplateField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractField" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "templateFieldId" TEXT,
    "groupLabel" TEXT NOT NULL,
    "groupOrder" INTEGER NOT NULL DEFAULT 0,
    "label" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractField_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TemplateField_templateId_key_key" ON "TemplateField"("templateId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "ContractField_documentId_key_key" ON "ContractField"("documentId", "key");

-- AddForeignKey
ALTER TABLE "TemplateGroup" ADD CONSTRAINT "TemplateGroup_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateField" ADD CONSTRAINT "TemplateField_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateField" ADD CONSTRAINT "TemplateField_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "TemplateGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractField" ADD CONSTRAINT "ContractField_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractField" ADD CONSTRAINT "ContractField_templateFieldId_fkey" FOREIGN KEY ("templateFieldId") REFERENCES "TemplateField"("id") ON DELETE SET NULL ON UPDATE CASCADE;
