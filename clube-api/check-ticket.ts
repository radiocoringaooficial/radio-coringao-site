const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const cols = await prisma.$queryRawUnsafe("SELECT column_name FROM information_schema.columns WHERE table_name = 'Match' AND column_name = 'ticketUrl'");
  console.log('ticketUrl column:', JSON.stringify(cols));
  const sample = await prisma.match.findFirst({ select: { id: true, ticketUrl: true, venue: true }, orderBy: { date: 'desc' } });
  console.log('Sample match:', JSON.stringify(sample));
}
main().catch(console.error).finally(() => prisma.$disconnect());
