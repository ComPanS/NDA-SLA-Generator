-- CreateTable
CREATE TABLE "TemplateSection" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemplateSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractSection" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "templateSectionId" TEXT,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractSection_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TemplateSection" ADD CONSTRAINT "TemplateSection_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractSection" ADD CONSTRAINT "ContractSection_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractSection" ADD CONSTRAINT "ContractSection_templateSectionId_fkey" FOREIGN KEY ("templateSectionId") REFERENCES "TemplateSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
