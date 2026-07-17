/**
 * Backfill: associa opponents sem categoria à categoria raiz "Futebol".
 * Rodar com: npx tsx scripts/backfill-opponent-categories.ts [--apply]
 * Sem --apply = dry-run (só mostra o que seria alterado).
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const apply = process.argv.includes('--apply');

async function getCategoryBySlug(slug: string) {
  const cat = await prisma.category.findUnique({ where: { slug } });
  if (!cat) throw new Error(`Categoria com slug "${slug}" não encontrada no banco.`);
  return cat;
}

async function main() {
  const futebol = await getCategoryBySlug('futebol');

  const opponentsWithoutCategories = await prisma.opponent.findMany({
    where: {
      categories: { none: {} },
    },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });

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
  console.log(`Categoria alvo: Futebol (root) — ID: ${futebol.id}`);
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

  console.log(`\nAplicando backfill...`);
  let count = 0;
  for (const o of opponentsWithoutCategories) {
    await prisma.opponentCategory.create({
      data: {
        opponentId: o.id,
        categoryId: futebol.id,
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
