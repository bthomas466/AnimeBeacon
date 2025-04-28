-- First add the columns with default values
ALTER TABLE "WatchList" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "WatchList" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Then remove the defaults
ALTER TABLE "WatchList" ALTER COLUMN "createdAt" DROP DEFAULT;
ALTER TABLE "WatchList" ALTER COLUMN "updatedAt" DROP DEFAULT; 