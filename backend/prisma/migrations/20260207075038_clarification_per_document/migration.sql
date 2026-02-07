-- CreateTable
CREATE TABLE "ClarificationUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClarificationUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClarificationUsage_userId_periodStart_idx" ON "ClarificationUsage"("userId", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "ClarificationUsage_userId_documentId_periodStart_key" ON "ClarificationUsage"("userId", "documentId", "periodStart");

-- AddForeignKey
ALTER TABLE "ClarificationUsage" ADD CONSTRAINT "ClarificationUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClarificationUsage" ADD CONSTRAINT "ClarificationUsage_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
