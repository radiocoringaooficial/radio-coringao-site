-- AlterTable: Add cargos array to User and authorCargo to Article
ALTER TABLE "users" ADD COLUMN "cargos" TEXT[] DEFAULT '{}';

ALTER TABLE "articles" ADD COLUMN "authorCargo" TEXT;
