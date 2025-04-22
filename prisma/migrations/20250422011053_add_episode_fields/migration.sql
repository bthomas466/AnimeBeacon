/*
  Warnings:

  - The primary key for the `Episode` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `number` on the `Episode` table. All the data in the column will be lost.
  - The `id` column on the `Episode` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[showId,episodeNumber]` on the table `Episode` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `episodeNumber` to the `Episode` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Episode` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Episode" DROP CONSTRAINT "Episode_pkey",
DROP COLUMN "number",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "episodeNumber" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Episode_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "Episode_showId_episodeNumber_key" ON "Episode"("showId", "episodeNumber");
