/**
 * Backfill: associa opponents sem categoria à categoria raiz "Futebol".
 * Rodar com: npx tsx scripts/backfill-opponent-categories.ts [--apply]
 * Sem --apply = dry-run (só mostra o que seria alterado).
 */
import { PrismaClient } from '@prisma/client';

const FUTEBOL_ROOT_ID = '7755b046-5379-46f5-8fa0-f06cb143f78b';
const apply = process.argv.includes('--apply');

async function main() {
  const prisma = new PrismaClient();

  // Find opponents with NO categories
  const opponentsWithoutCategories = await prisma.opponent.findMany({
    where: {
      categories: { none: {} },
    },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });

  // Find opponents that already have categories (for reference)
  const opponentsWithCategories = await prisma.opponent.findMany({
    where: {
      categories: { some: {} },
    },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      categories: { select: { categoryId: true } },
    },
  });

  console.log(`\n=== BACKFILL OPPONENT CATEGORIES ===`);
  console.log(`Categoria alvo: Futebol (root) — ID: ${FUTEBOL_ROOT_ID}`);
  console.log(`Modo: ${apply ? 'APLICAR' : 'DRY-RUN (sem alterações)'}\n`);

  console.log(`Opponents SEM categoria: ${opponentsWithoutCategories.length}`);
  console.log(`Opponents COM categoria: ${opponentsWithCategories.length}\n`);

  if (opponentsWithCategories.length > 0) {
    console.log(`--- Já têm categoria (não serão alterados): ---`);
    for (const o of opponentsWithCategories) {
      const catIds = o.categories.map((c) => c.categoryId).join(', ');
      console.log(`  ${o.name} → [${catIds}]`);
    }
    console.log('');
  }

  console.log(`--- Serão associados a "Futebol": ---`);
  for (const o of opponentsWithoutCategories) {
    console.log(`  ${o.name} (${o.id})`);
  }

  if (!apply) {
    console.log(`\n⚠️  DRY-RUN: nenhuma alteração feita. Rode com --apply pra aplicar.`);
    await prisma.$disconnect();
    return;
  }

  // Apply: create OpponentCategory records
  console.log(`\nAplicando backfill...`);
  let count = 0;
  for (const o of opponentsWithoutCategories) {
    await prisma.opponentCategory.create({
      data: {
        opponentId: o.id,
        categoryId: FUTEBOL_ROOT_ID,
      },
    });
    count++;
  }
  console.log(`✅ ${count} opponents associados à categoria "Futebol".`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
