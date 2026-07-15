/**
 * Lista todos os nomes duplicados no banco de opponents.
 * Rodar com: npx tsx scripts/find-duplicate-opponents.ts
 * Somente leitura — não altera nada.
 */
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();

  const allOpponents = await prisma.opponent.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      createdAt: true,
      _count: { select: { matches: true, movements: true, categories: true } },
    },
  });

  // Group by normalized name
  const byName = new Map<string, typeof allOpponents>();
  for (const o of allOpponents) {
    const key = o.name.trim().toLowerCase();
    const list = byName.get(key) || [];
    list.push(o);
    byName.set(key, list);
  }

  // Find duplicates
  const duplicates = Array.from(byName.entries()).filter(([_, list]) => list.length > 1);

  console.log(`\n=== OPPONENTS DUPLICADOS ===`);
  console.log(`Total de opponents: ${allOpponents.length}`);
  console.log(`Nomes únicos: ${byName.size}`);
  console.log(`Nomes duplicados: ${duplicates.length}\n`);

  if (duplicates.length === 0) {
    console.log('Nenhuma duplicata encontrada.');
    await prisma.$disconnect();
    return;
  }

  for (const [name, list] of duplicates) {
    console.log(`"${list[0].name}" (${list.length} cadastros):`);
    for (const o of list) {
      const date = o.createdAt.toISOString().split('T')[0];
      console.log(`  ID: ${o.id}`);
      console.log(`  Criado: ${date}`);
      console.log(`  Partidas: ${o._count.matches} | Movimentações: ${o._count.movements} | Categorias: ${o._count.categories}`);
    }
    console.log('');
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
