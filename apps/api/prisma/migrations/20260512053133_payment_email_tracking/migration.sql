-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "emailSentAt" TIMESTAMP(3),
ADD COLUMN     "emailSentTo" TEXT;

-- CreateIndex
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");
