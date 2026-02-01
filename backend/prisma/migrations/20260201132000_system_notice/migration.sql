-- Create table for dashboard notice banner
CREATE TABLE "SystemNotice" (
  "id" TEXT PRIMARY KEY DEFAULT 'system_notice',
  "message" TEXT NOT NULL DEFAULT '',
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Ensure updatedAt reflects last modification
CREATE OR REPLACE FUNCTION update_updatedat_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER system_notice_set_updated_at
BEFORE UPDATE ON "SystemNotice"
FOR EACH ROW
EXECUTE PROCEDURE update_updatedat_column();
