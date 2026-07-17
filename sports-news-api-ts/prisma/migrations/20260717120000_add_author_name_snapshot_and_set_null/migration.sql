-- AlterTable: Tornar authorId opcional e adicionar authorNameSnapshot
ALTER TABLE "articles" ALTER COLUMN "authorId" DROP NOT NULL;

-- AlterTable: Adicionar campo de snapshot do nome do autor
ALTER TABLE "articles" ADD COLUMN "authorNameSnapshot" TEXT;

-- AlterForeignKey: Mudar onDelete para SetNull (artigos sobrevivem à exclusão do autor)
ALTER TABLE "articles" DROP CONSTRAINT "articles_authorId_fkey",
    ADD CONSTRAINT "articles_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
