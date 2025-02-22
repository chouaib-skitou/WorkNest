/*
  Warnings:

  - You are about to drop the column `projectId` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `stageId` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the `_ProjectToTask` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_StageToTask` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[title,project_id]` on the table `Task` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `project_id` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stage_id` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_ProjectToTask" DROP CONSTRAINT "_ProjectToTask_A_fkey";

-- DropForeignKey
ALTER TABLE "_ProjectToTask" DROP CONSTRAINT "_ProjectToTask_B_fkey";

-- DropForeignKey
ALTER TABLE "_StageToTask" DROP CONSTRAINT "_StageToTask_A_fkey";

-- DropForeignKey
ALTER TABLE "_StageToTask" DROP CONSTRAINT "_StageToTask_B_fkey";

-- DropIndex
DROP INDEX "Task_title_projectId_key";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "projectId",
DROP COLUMN "stageId",
ADD COLUMN     "project_id" TEXT NOT NULL,
ADD COLUMN     "stage_id" TEXT NOT NULL;

-- DropTable
DROP TABLE "_ProjectToTask";

-- DropTable
DROP TABLE "_StageToTask";

-- CreateIndex
CREATE UNIQUE INDEX "Task_title_project_id_key" ON "Task"("title", "project_id");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "Stage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
