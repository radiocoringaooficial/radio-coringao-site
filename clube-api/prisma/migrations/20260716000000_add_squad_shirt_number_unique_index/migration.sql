-- Partial unique index: shirtNumber must be unique per category, but only for active players.
-- NULL shirtNumbers are excluded (multiple players without a number are allowed).
-- This index is NOT managed by Prisma Client — it was created manually because
-- Prisma does not support partial indexes in schema.prisma.
-- See: https://www.prisma.io/docs/orm/prisma-schema/data-model/indexes#partial-indexes
CREATE UNIQUE INDEX IF NOT EXISTS squad_members_category_shirt_active_unique
ON squad_members ("categoryId", "shirtNumber")
WHERE "isActive" = true AND "shirtNumber" IS NOT NULL;
