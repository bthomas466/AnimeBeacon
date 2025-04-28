-- AlterTable
ALTER TABLE "Show" ADD COLUMN     "avgRating" DOUBLE PRECISION,
ADD COLUMN     "genres" TEXT[],
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "synopsis" TEXT;
