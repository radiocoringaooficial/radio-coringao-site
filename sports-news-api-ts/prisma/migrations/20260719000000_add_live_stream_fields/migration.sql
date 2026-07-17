-- AlterTable: Adicionar campos de transmissão ao vivo
ALTER TABLE "site_settings" ADD COLUMN "liveStreamUrl" TEXT;
ALTER TABLE "site_settings" ADD COLUMN "liveStreamActive" BOOLEAN NOT NULL DEFAULT false;
