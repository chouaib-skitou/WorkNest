-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "documents" TEXT[],
ADD COLUMN     "image" TEXT;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "images" TEXT[];
