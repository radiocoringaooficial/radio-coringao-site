-- CreateTable
CREATE TABLE "job_titles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_titles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "job_titles_name_key" ON "job_titles"("name");

-- Seed: insert default job titles
INSERT INTO "job_titles" ("name") VALUES ('Jornalista');
INSERT INTO "job_titles" ("name") VALUES ('Radialista');
INSERT INTO "job_titles" ("name") VALUES ('Redator');
