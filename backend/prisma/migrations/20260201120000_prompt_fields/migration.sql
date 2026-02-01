-- Add main prompt to templates
ALTER TABLE "Template"
ADD COLUMN IF NOT EXISTS "mainPrompt" TEXT NOT NULL DEFAULT '';

-- Add default and current prompt to documents
ALTER TABLE "Document"
ADD COLUMN IF NOT EXISTS "defaultPrompt" TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS "prompt" TEXT NOT NULL DEFAULT '';
