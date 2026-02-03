-- Store legal risk assessments per document version
CREATE TABLE "RiskAssessment" (
  "id" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "documentVersionId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RiskAssessment_pkey" PRIMARY KEY ("id")
);
-- Enforce one assessment per version
CREATE UNIQUE INDEX "RiskAssessment_documentVersionId_key" ON "RiskAssessment"("documentVersionId");
-- Link to document versions, cascade on delete/update
ALTER TABLE "RiskAssessment"
ADD CONSTRAINT "RiskAssessment_documentVersionId_fkey" FOREIGN KEY ("documentVersionId") REFERENCES "DocumentVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;