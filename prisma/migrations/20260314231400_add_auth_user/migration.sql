/*
  Warnings:

  - You are about to drop the column `score` on the `Analysis` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Analysis` table. All the data in the column will be lost.
  - Added the required column `description` to the `Analysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `documentType` to the `Analysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `forbiddenKeywordHits` to the `Analysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `label` to the `Analysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `matchedKeywords` to the `Analysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `metadata` to the `Analysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `missingRequiredKeywords` to the `Analysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product` to the `Analysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `riskLevel` to the `Analysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `riskScore` to the `Analysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `template` to the `Analysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Analysis` table without a default value. This is not possible if the table is not empty.
  - Made the column `summary` on table `Analysis` required. This step will fail if there are existing NULL values in that column.
  - Made the column `issues` on table `Analysis` required. This step will fail if there are existing NULL values in that column.
  - Made the column `deadlines` on table `Analysis` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Analysis" DROP CONSTRAINT "Analysis_userId_fkey";

-- AlterTable
ALTER TABLE "Analysis" DROP COLUMN "score",
DROP COLUMN "userId",
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "documentType" TEXT NOT NULL,
ADD COLUMN     "forbiddenKeywordHits" JSONB NOT NULL,
ADD COLUMN     "label" TEXT NOT NULL,
ADD COLUMN     "matchedKeywords" JSONB NOT NULL,
ADD COLUMN     "metadata" JSONB NOT NULL,
ADD COLUMN     "missingRequiredKeywords" JSONB NOT NULL,
ADD COLUMN     "product" TEXT NOT NULL,
ADD COLUMN     "riskLevel" TEXT NOT NULL,
ADD COLUMN     "riskScore" INTEGER NOT NULL,
ADD COLUMN     "template" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "summary" SET NOT NULL,
ALTER COLUMN "issues" SET NOT NULL,
ALTER COLUMN "deadlines" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "password" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
