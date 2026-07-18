-- AlterTable: Adicionar campos de "Anuncie Conosco" ao SiteSettings
ALTER TABLE "site_settings" ADD COLUMN "advertiseIntro" TEXT;
ALTER TABLE "site_settings" ADD COLUMN "advertiseBullets" TEXT[] DEFAULT '{}';
ALTER TABLE "site_settings" ADD COLUMN "advertiseEmail" TEXT;
ALTER TABLE "site_settings" ADD COLUMN "advertisePhone" TEXT;
