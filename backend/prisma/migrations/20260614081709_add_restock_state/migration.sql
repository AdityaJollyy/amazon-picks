-- CreateEnum
CREATE TYPE "RestockStatus" AS ENUM ('ACTIVE', 'PAUSED');

-- CreateTable
CREATE TABLE "RestockState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "lastOrderedAt" TIMESTAMP(3) NOT NULL,
    "intervalDays" DOUBLE PRECISION NOT NULL,
    "snoozedUntil" TIMESTAMP(3),
    "status" "RestockStatus" NOT NULL DEFAULT 'ACTIVE',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RestockState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RestockState_userId_idx" ON "RestockState"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RestockState_userId_productId_key" ON "RestockState"("userId", "productId");

-- AddForeignKey
ALTER TABLE "RestockState" ADD CONSTRAINT "RestockState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestockState" ADD CONSTRAINT "RestockState_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
