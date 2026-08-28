-- Remove @unique on Patient.phone (families can share a phone number)
DROP INDEX IF EXISTS "Patient_phone_key";
-- Keep the plain index for search
CREATE INDEX IF NOT EXISTS "Patient_phone_idx" ON "Patient"("phone");

-- Anti-replay TOTP : store hash of used codes for ~60s window
CREATE TABLE "UsedTotpCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsedTotpCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UsedTotpCode_userId_codeHash_key" ON "UsedTotpCode"("userId", "codeHash");
CREATE INDEX "UsedTotpCode_expiresAt_idx" ON "UsedTotpCode"("expiresAt");
