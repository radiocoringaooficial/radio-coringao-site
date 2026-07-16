/**
 * Backfill: corrige movimentações com categoryId nulo.
 *
 * Rodar com: npx tsx scripts/backfill-movement-category.ts [--dry-run]
 * Sem --dry-run = aplica as correções.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const dryRun = process.argv.includes('--dry-run');

async function main() {
  console.log(`\n=== BACKFILL: Corrigir categoryId em movimentações ===`);
  console.log(`Modo: ${dryRun ? 'DRY-RUN (sem alterações)' : 'APLICAR ALTERAÇÕES'}\n`);

  // Busca movimentações com categoryId nulo
  const movementsWithNullCategory = await prisma.playerMovement.findMany({
    where: { categoryId: null },
    select: {
      id: true,
      playerName: true,
      squadMemberId: true,
      type: true,
      date: true,
      squadMember: {
        select: {
          id: true,
          name: true,
          categoryId: true,
        },
      },
    },
    orderBy: { date: 'desc' },
  });

  console.log(`Movimentações com categoryId nulo: ${movementsWithNullCategory.length}\n`);

  if (movementsWithNullCategory.length === 0) {
    console.log('Nada a corrigir.');
    await prisma.$disconnect();
    return;
  }

  let fixed = 0;
  let skipped = 0;

  for (const m of movementsWithNullCategory) {
    const squadCategoryId = m.squadMember?.categoryId;

    if (squadCategoryId) {
      console.log(`  [CORRIGIR] ${m.playerName || '(sem nome)'} | tipo=${m.type} | data=${m.date.toISOString().slice(0, 10)} | squadMemberId=${m.squadMemberId} → categoryId=${squadCategoryId}`);
      if (!dryRun) {
        await prisma.playerMovement.update({
          where: { id: m.id },
          data: { categoryId: squadCategoryId },
        });
      }
      fixed++;
    } else {
      console.log(`  [PULAR]   ${m.playerName || '(sem nome)'} | tipo=${m.type} | data=${m.date.toISOString().slice(0, 10)} | squadMemberId=${m.squadMemberId} → squadMember sem categoria`);
      skipped++;
    }
  }

  console.log(`\n=== RESULTADO ===`);
  console.log(`Corrigidos: ${fixed}`);
  console.log(`Pulados (squadMember sem categoria): ${skipped}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
