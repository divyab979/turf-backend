/*
  Warnings:

  - You are about to drop the column `pricePerHour` on the `Turf` table. All the data in the column will be lost.
  - Added the required column `duration` to the `Slot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `Slot` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Slot" ADD COLUMN     "duration" INTEGER NOT NULL,
ADD COLUMN     "price" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Turf" DROP COLUMN "pricePerHour",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "TurfImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "turfId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TurfImage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TurfImage" ADD CONSTRAINT "TurfImage_turfId_fkey" FOREIGN KEY ("turfId") REFERENCES "Turf"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
