/*
  Warnings:

  - You are about to drop the `_ProjectToStage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_ProjectToStage" DROP CONSTRAINT "_ProjectToStage_A_fkey";

-- DropForeignKey
ALTER TABLE "_ProjectToStage" DROP CONSTRAINT "_ProjectToStage_B_fkey";

-- DropTable
DROP TABLE "_ProjectToStage";

-- AddForeignKey
ALTER TABLE "Stage" ADD CONSTRAINT "Stage_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
