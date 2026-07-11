import 'dotenv/config';
import { PrismaClient, MatchStatus, Gender, Modality, MovementType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed completo — Clube API (Corinthians)\n');

  // ─── 1. TEAM ────────────────────────────────────────────────
  const team = await prisma.team.upsert({
    where: { id: 'main' },
    update: { logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Corinthians_simbolo.png' },
    create: {
      id: 'main',
      name: 'Sport Club Corinthians Paulista',
      shortName: 'Corinthians',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Corinthians_simbolo.png',
      foundedYear: 1910,
      stadium: 'Neo Química Arena',
      city: 'São Paulo',
      website: 'https://www.corinthians.com.br',
    },
  });
  console.log(`✅ Team: ${team.name}`);

  // ─── 2. CATEGORIES ──────────────────────────────────────────
  const catFutebol = await prisma.category.upsert({
    where: { slug: 'futebol-masculino' },
    update: {},
    create: { name: 'Futebol Masculino', slug: 'futebol-masculino', gender: Gender.MALE, modality: Modality.FOOTBALL, order: 1 },
  });
  const catFutsal = await prisma.category.upsert({
    where: { slug: 'futsal-masculino' },
    update: {},
    create: { name: 'Futsal Masculino', slug: 'futsal-masculino', gender: Gender.MALE, modality: Modality.FUTSAL, order: 2 },
  });
  const catBasquete = await prisma.category.upsert({
    where: { slug: 'basquete-masculino' },
    update: {},
    create: { name: 'Basquete Masculino', slug: 'basquete-masculino', gender: Gender.MALE, modality: Modality.BASKETBALL, order: 3 },
  });
  console.log('✅ Categorias: Futebol, Futsal, Basquete');

  // ─── 3. OPPONENTS ───────────────────────────────────────────
  const opponentsData = [
    { name: 'Palmeiras', shortName: 'PAL', color: '#006437', city: 'São Paulo', stadium: 'Allianz Parque', foundedYear: 1914 },
    { name: 'São Paulo FC', shortName: 'SPF', color: '#D4171E', city: 'São Paulo', stadium: 'Morumbi', foundedYear: 1930 },
    { name: 'Santos FC', shortName: 'SAN', color: '#000000', city: 'Santos', stadium: 'Vila Belmiro', foundedYear: 1912 },
    { name: 'Flamengo', shortName: 'FLA', color: '#E31D1D', city: 'Rio de Janeiro', stadium: 'Maracanã', foundedYear: 1895 },
    { name: 'Fluminense', shortName: 'FLU', color: '#8B0023', city: 'Rio de Janeiro', stadium: 'Maracanã', foundedYear: 1902 },
    { name: 'Botafogo', shortName: 'BOT', color: '#000000', city: 'Rio de Janeiro', stadium: 'Engenhão', foundedYear: 1904 },
    { name: 'Vasco da Gama', shortName: 'VAS', color: '#000000', city: 'Rio de Janeiro', stadium: 'São Januário', foundedYear: 1898 },
    { name: 'Grêmio', shortName: 'GRE', color: '#0068AB', city: 'Porto Alegre', stadium: 'Arena do Grêmio', foundedYear: 1903 },
    { name: 'Internacional', shortName: 'INT', color: '#D41B1B', city: 'Porto Alegre', stadium: 'Beira-Rio', foundedYear: 1909 },
    { name: 'Cruzeiro', shortName: 'CRU', color: '#003DA5', city: 'Belo Horizonte', stadium: 'Mineirão', foundedYear: 1921 },
    { name: 'Atlético Mineiro', shortName: 'CAM', color: '#000000', city: 'Belo Horizonte', stadium: 'Arena Independência', foundedYear: 1908 },
    { name: 'Athletico Paranaense', shortName: 'CAP', color: '#D4171E', city: 'Curitiba', stadium: 'Arena da Baixada', foundedYear: 1924 },
    { name: 'Fortaleza', shortName: 'FOR', color: '#003DA5', city: 'Fortaleza', stadium: 'Castelão', foundedYear: 1913 },
    { name: 'Bahia', shortName: 'BAH', color: '#003DA5', city: 'Salvador', stadium: 'Arena Fonte Nova', foundedYear: 1931 },
    { name: 'Mirassol', shortName: 'MIR', color: '#00843D', city: 'Mirassol', stadium: 'Estádio José Maria de Campos Maia', foundedYear: 1925 },
    { name: 'Novorizontino', shortName: 'NOV', color: '#006633', city: 'Novorizonte', stadium: 'Jorge Isidoro', foundedYear: 2010 },
    { name: 'Inter de Limeira', shortName: 'IEL', color: '#0000CC', city: 'Limeira', stadium: 'Estádio Limeirão', foundedYear: 1913 },
    { name: 'São José EC', shortName: 'SJE', color: '#000000', city: 'São José dos Campos', stadium: 'Castor de Henrique', foundedYear: 2005 },
    { name: 'AC Milan', shortName: 'MIL', color: '#FB090B', city: 'Milão', stadium: 'San Siro', foundedYear: 1899 },
    { name: 'RB Bragantino', shortName: 'RBB', color: '#006633', city: 'Bragança Paulista', stadium: 'Nabi Abi Chedid', foundedYear: 1928 },
    { name: 'River Plate', shortName: 'RIV', color: '#D4171E', city: 'Buenos Aires', stadium: 'Monumental', foundedYear: 1901 },
    { name: 'Boca Juniors', shortName: 'BOC', color: '#003DA5', city: 'Buenos Aires', stadium: 'La Bombonera', foundedYear: 1905 },
  ];

  const opponents: Record<string, any> = {};
  for (const o of opponentsData) {
    opponents[o.name] = await prisma.opponent.upsert({
      where: { name: o.name },
      update: {},
      create: o,
    });
    await prisma.opponentCategory.upsert({
      where: { opponentId_categoryId: { opponentId: opponents[o.name].id, categoryId: catFutebol.id } },
      update: {},
      create: { opponentId: opponents[o.name].id, categoryId: catFutebol.id },
    });
  }
  console.log(`✅ ${Object.keys(opponents).length} adversários criados`);

  // ─── 4. COMPETITIONS ────────────────────────────────────────
  const Brasileirao = await prisma.competition.upsert({
    where: { categoryId_name_season: { categoryId: catFutebol.id, name: 'Brasileirão Série A', season: '2026' } },
    update: {},
    create: { name: 'Brasileirão Série A', season: '2026', categoryId: catFutebol.id, slug: 'brasileirao-serie-a', status: 'Em andamento', tableFormat: 'single' },
  });
  const CopaDoBrasil = await prisma.competition.upsert({
    where: { categoryId_name_season: { categoryId: catFutebol.id, name: 'Copa do Brasil', season: '2026' } },
    update: {},
    create: { name: 'Copa do Brasil', season: '2026', categoryId: catFutebol.id, slug: 'copa-do-brasil', status: 'Em andamento', tableFormat: 'single' },
  });
  const Libertadores = await prisma.competition.upsert({
    where: { categoryId_name_season: { categoryId: catFutebol.id, name: 'Copa Libertadores', season: '2026' } },
    update: {},
    create: { name: 'Copa Libertadores', season: '2026', categoryId: catFutebol.id, slug: 'copa-libertadores', status: 'Em andamento', tableFormat: 'single' },
  });
  const CopaPaulista = await prisma.competition.upsert({
    where: { categoryId_name_season: { categoryId: catFutebol.id, name: 'Copa São Paulo', season: '2026' } },
    update: {},
    create: { name: 'Copa São Paulo', season: '2026', categoryId: catFutebol.id, slug: 'copa-sao-paulo', status: 'Em andamento', tableFormat: 'single' },
  });
  console.log('✅ 4 competições criadas');

  // ─── 5. SQUAD MEMBERS ──────────────────────────────────────
  const playersData = [
    { name: 'Hugo Souza', position: 'Goleiro', shirtNumber: 1 },
    { name: 'Matheus Donelli', position: 'Goleiro', shirtNumber: 12 },
    { name: 'Félix Torres', position: 'Zagueiro', shirtNumber: 3 },
    { name: 'Cacá', position: 'Zagueiro', shirtNumber: 4 },
    { name: 'Gustavo Henrique', position: 'Zagueiro', shirtNumber: 5 },
    { name: 'Bruno Méndez', position: 'Zagueiro', shirtNumber: 2 },
    { name: 'Matheus Bidu', position: 'Lateral Esquerdo', shirtNumber: 6 },
    { name: 'Fagner', position: 'Lateral Direito', shirtNumber: 23 },
    { name: 'Léo Maná', position: 'Lateral Direito', shirtNumber: 33 },
    { name: 'Raniele', position: 'Volante', shirtNumber: 7 },
    { name: 'Charles Souza', position: 'Volante', shirtNumber: 8 },
    { name: 'Maycon', position: 'Meia', shirtNumber: 11 },
    { name: 'Coronado', position: 'Meia', shirtNumber: 10 },
    { name: 'Alex Trashorras', position: 'Meia', shirtNumber: 14 },
    { name: 'Breno Bidon', position: 'Meia', shirtNumber: 37 },
    { name: 'Yuri Alberto', position: 'Atacante', shirtNumber: 9 },
    { name: 'Pedro Raul', position: 'Atacante', shirtNumber: 19 },
    { name: 'Memphis Depay', position: 'Atacante', shirtNumber: 16 },
    { name: 'Wesley', position: 'Atacante', shirtNumber: 28 },
    { name: 'Garçal', position: 'Atacante', shirtNumber: 21 },
    { name: 'Igor Correia', position: 'Zagueiro', shirtNumber: 32 },
    { name: 'Ryan Gustavo', position: 'Volante', shirtNumber: 27 },
  ];

  const squadMembers: Record<string, any> = {};
  for (const p of playersData) {
    const member = await prisma.squadMember.upsert({
      where: { id: `squad-${p.shirtNumber}` },
      update: {},
      create: { id: `squad-${p.shirtNumber}`, categoryId: catFutebol.id, name: p.name, position: p.position, shirtNumber: p.shirtNumber, isActive: true },
    });
    squadMembers[p.name] = member;
  }
  console.log(`✅ ${playersData.length} jogadores no elenco`);

  // ─── 6. TRANSFER CLUBS ──────────────────────────────────────
  const clubsData = ['São Paulo FC', 'Palmeiras', 'Flamengo', 'FC Barcelona', 'Botafogo', 'Chelsea', 'Manchester City', 'River Plate', 'Boca Juniors', 'AC Milan', 'Cruzeiro', 'Fortaleza', 'Santos FC', 'Grêmio'];
  const transferClubs: Record<string, any> = {};
  for (const c of clubsData) {
    transferClubs[c] = await prisma.transferClub.upsert({
      where: { name: c },
      update: {},
      create: { name: c },
    });
  }
  console.log(`✅ ${clubsData.length} clubes de transferência`);

  // ─── 7. PLAYER MOVEMENTS ───────────────────────────────────
  const movementsData = [
    { playerName: 'Memphis Depay', type: MovementType.ARRIVAL, clubName: 'FC Barcelona', date: new Date('2026-01-15'), valueCents: 500000000n, notes: 'Contratação definitiva. Contrato até dez/2027.' },
    { playerName: 'Pedro Raul', type: MovementType.ARRIVAL, clubName: 'Botafogo', date: new Date('2026-01-20'), valueCents: 300000000n, notes: 'Contratação definitiva para reforço do ataque.' },
    { playerName: 'Alex Trashorras', type: MovementType.ARRIVAL, clubName: 'River Plate', date: new Date('2026-02-01'), valueCents: 250000000n, notes: 'Meia criativo. Contrato até dez/2027.' },
    { playerName: 'Garçal', type: MovementType.ARRIVAL, clubName: 'Fortaleza', date: new Date('2026-01-10'), valueCents: 150000000n, notes: 'Atacante. Resgate de 50% do passe.' },
    { playerName: 'Wesley', type: MovementType.ARRIVAL, clubName: 'Palmeiras', date: new Date('2026-02-05'), valueCents: 400000000n, notes: 'Atacante jovem. Contrato até dez/2029.' },
    { playerName: 'Ryan Gustavo', type: MovementType.LOAN_IN, clubName: 'Cruzeiro', date: new Date('2026-01-25'), isFreeLoan: false, paysSalary: true, returnDate: new Date('2026-12-31'), notes: 'Empréstimo até dez/2026 com opção de compra.' },
    { playerName: 'Roger Guedes', type: MovementType.DEPARTURE, clubName: 'Al-Qadsiah', date: new Date('2026-01-05'), valueCents: 800000000n, notes: 'Venda para o futebol saudita.' },
    { name: 'Adson', type: MovementType.DEPARTURE, clubName: 'São Paulo FC', date: new Date('2026-01-12'), valueCents: 120000000n, notes: 'Fim de contrato. Saída livre.' },
    { playerName: 'Renato Augusto', type: MovementType.DEPARTURE, clubName: 'Flamengo', date: new Date('2026-01-08'), notes: 'Aposentadoria. Fim de contrato.' },
    { playerName: 'Mateus Vital', type: MovementType.LOAN_OUT, clubName: 'Grêmio', date: new Date('2026-02-10'), isFreeLoan: false, paysSalary: false, returnDate: new Date('2026-12-31'), notes: 'Empréstimo até dez/2026.' },
    { playerName: 'Cassio Ramos', type: MovementType.DEPARTURE, clubName: 'Fortaleza', date: new Date('2026-01-03'), notes: 'Empréstimo do goleiro para cobertura.' },
  ];

  let movementsCreated = 0;
  for (const m of movementsData) {
    const club = m.clubName ? transferClubs[m.clubName] : null;
    const squadMember = m.playerName ? squadMembers[m.playerName] : null;
    try {
      await prisma.playerMovement.create({
        data: {
          squadMemberId: squadMember?.id || null,
          type: m.type,
          date: m.date,
          playerName: m.playerName || m.name,
          clubId: club?.id || null,
          categoryId: catFutebol.id,
          valueCents: m.valueCents || null,
          isFreeLoan: m.isFreeLoan || false,
          paysSalary: m.paysSalary || false,
          returnDate: m.returnDate || null,
          notes: m.notes || null,
          season: '2026',
        },
      });
      movementsCreated++;
    } catch (e: any) {
      if (e.code === 'P2002') continue;
      throw e;
    }
  }
  console.log(`✅ ${movementsCreated} movimentações de elenco`);

  // ─── 8. MATCHES ─────────────────────────────────────────────
  const matchesData = [
    // Brasileirão - jogos finalizados
    { comp: Brasileirao, opp: 'Palmeiras', date: new Date('2026-04-13T16:00:00Z'), home: true, status: MatchStatus.FINISHED, hs: 2, as: 1, round: 'Rodada 3', hPoss: 54, aPoss: 46, hShots: 15, aShots: 10, hOnTarget: 6, aOnTarget: 3, hCorners: 7, aCorners: 4 },
    { comp: Brasileirao, opp: 'São Paulo FC', date: new Date('2026-04-20T20:00:00Z'), home: false, status: MatchStatus.FINISHED, hs: 1, as: 1, round: 'Rodada 4', hPoss: 48, aPoss: 52, hShots: 12, aShots: 14, hOnTarget: 4, aOnTarget: 5, hCorners: 5, aCorners: 6 },
    { comp: Brasileirao, opp: 'Flamengo', date: new Date('2026-05-04T16:00:00Z'), home: true, status: MatchStatus.FINISHED, hs: 3, as: 2, round: 'Rodada 6', hPoss: 51, aPoss: 49, hShots: 18, aShots: 13, hOnTarget: 7, aOnTarget: 5, hCorners: 8, aCorners: 5 },
    { comp: Brasileirao, opp: 'Botafogo', date: new Date('2026-05-11T18:30:00Z'), home: false, status: MatchStatus.FINISHED, hs: 0, as: 2, round: 'Rodada 7', hPoss: 44, aPoss: 56, hShots: 8, aShots: 16, hOnTarget: 2, aOnTarget: 7, hCorners: 3, aCorners: 9 },
    { comp: Brasileirao, opp: 'Fluminense', date: new Date('2026-05-18T16:00:00Z'), home: true, status: MatchStatus.FINISHED, hs: 1, as: 0, round: 'Rodada 8', hPoss: 62, aPoss: 38, hShots: 20, aShots: 7, hOnTarget: 8, aOnTarget: 2, hCorners: 10, aCorners: 2 },
    { comp: Brasileirao, opp: 'Grêmio', date: new Date('2026-05-25T20:00:00Z'), home: false, status: MatchStatus.FINISHED, hs: 2, as: 2, round: 'Rodada 9', hPoss: 47, aPoss: 53, hShots: 11, aShots: 15, hOnTarget: 4, aOnTarget: 6, hCorners: 4, aCorners: 7 },
    { comp: Brasileirao, opp: 'Vasco da Gama', date: new Date('2026-06-01T16:00:00Z'), home: true, status: MatchStatus.FINISHED, hs: 4, as: 0, round: 'Rodada 10', hPoss: 65, aPoss: 35, hShots: 22, aShots: 6, hOnTarget: 9, aOnTarget: 1, hCorners: 11, aCorners: 1 },
    { comp: Brasileirao, opp: 'Cruzeiro', date: new Date('2026-06-08T18:30:00Z'), home: false, status: MatchStatus.FINISHED, hs: 1, as: 3, round: 'Rodada 11', hPoss: 42, aPoss: 58, hShots: 9, aShots: 17, hOnTarget: 3, aOnTarget: 8, hCorners: 4, aCorners: 8 },
    { comp: Brasileirao, opp: 'Atlético Mineiro', date: new Date('2026-06-15T16:00:00Z'), home: true, status: MatchStatus.FINISHED, hs: 2, as: 1, round: 'Rodada 12', hPoss: 55, aPoss: 45, hShots: 16, aShots: 11, hOnTarget: 6, aOnTarget: 4, hCorners: 7, aCorners: 5 },
    { comp: Brasileirao, opp: 'Santos FC', date: new Date('2026-06-22T20:00:00Z'), home: false, status: MatchStatus.FINISHED, hs: 0, as: 1, round: 'Rodada 13', hPoss: 40, aPoss: 60, hShots: 7, aShots: 19, hOnTarget: 1, aOnTarget: 8, hCorners: 2, aCorners: 10 },
    { comp: Brasileirao, opp: 'Bahia', date: new Date('2026-06-29T16:00:00Z'), home: true, status: MatchStatus.FINISHED, hs: 3, as: 1, round: 'Rodada 14', hPoss: 58, aPoss: 42, hShots: 17, aShots: 9, hOnTarget: 7, aOnTarget: 3, hCorners: 8, aCorners: 3 },

    // Brasileirão - jogos futuros
    { comp: Brasileirao, opp: 'Athletico Paranaense', date: new Date('2026-07-13T16:00:00Z'), home: false, status: MatchStatus.SCHEDULED, round: 'Rodada 15' },
    { comp: Brasileirao, opp: 'Fortaleza', date: new Date('2026-07-20T18:30:00Z'), home: true, status: MatchStatus.SCHEDULED, round: 'Rodada 16' },
    { comp: Brasileirao, opp: 'Mirassol', date: new Date('2026-07-27T16:00:00Z'), home: false, status: MatchStatus.SCHEDULED, round: 'Rodada 17' },
    { comp: Brasileirao, opp: 'Palmeiras', date: new Date('2026-08-03T16:00:00Z'), home: false, status: MatchStatus.SCHEDULED, round: 'Rodada 18' },
    { comp: Brasileirao, opp: 'Novorizontino', date: new Date('2026-08-10T18:30:00Z'), home: true, status: MatchStatus.SCHEDULED, round: 'Rodada 19' },
    { comp: Brasileirao, opp: 'São Paulo FC', date: new Date('2026-08-17T16:00:00Z'), home: true, status: MatchStatus.SCHEDULED, round: 'Rodada 20' },
    { comp: Brasileirao, opp: 'Internacional', date: new Date('2026-08-24T20:00:00Z'), home: false, status: MatchStatus.SCHEDULED, round: 'Rodada 21' },

    // Copa do Brasil
    { comp: CopaDoBrasil, opp: 'Inter de Limeira', date: new Date('2026-04-30T20:00:00Z'), home: true, status: MatchStatus.FINISHED, hs: 5, as: 0, round: 'Terceira Fase', hPoss: 70, aPoss: 30, hShots: 25, aShots: 5, hOnTarget: 10, aOnTarget: 1, hCorners: 12, aCorners: 1 },
    { comp: CopaDoBrasil, opp: 'São José EC', date: new Date('2026-05-22T20:00:00Z'), home: false, status: MatchStatus.FINISHED, hs: 0, as: 2, round: 'Quartas de Final - Ida', hPoss: 38, aPoss: 62, hShots: 6, aShots: 18, hOnTarget: 1, aOnTarget: 7, hCorners: 2, aCorners: 9 },
    { comp: CopaDoBrasil, opp: 'São José EC', date: new Date('2026-05-29T20:00:00Z'), home: true, status: MatchStatus.FINISHED, hs: 3, as: 0, round: 'Quartas de Final - Volta', hPoss: 63, aPoss: 37, hShots: 20, aShots: 8, hOnTarget: 8, aOnTarget: 2, hCorners: 9, aCorners: 3 },
    { comp: CopaDoBrasil, opp: 'Flamengo', date: new Date('2026-07-16T20:00:00Z'), home: true, status: MatchStatus.SCHEDULED, round: 'Semifinal - Ida' },
    { comp: CopaDoBrasil, opp: 'Flamengo', date: new Date('2026-07-23T20:00:00Z'), home: false, status: MatchStatus.SCHEDULED, round: 'Semifinal - Volta' },

    // Libertadores
    { comp: Libertadores, opp: 'Botafogo', date: new Date('2026-04-09T19:00:00Z'), home: false, status: MatchStatus.FINISHED, hs: 2, as: 1, round: 'Grupos - Jogo 1', hPoss: 45, aPoss: 55, hShots: 10, aShots: 14, hOnTarget: 4, aOnTarget: 6, hCorners: 4, aCorners: 6 },
    { comp: Libertadores, opp: 'River Plate', date: new Date('2026-04-23T19:00:00Z'), home: true, status: MatchStatus.FINISHED, hs: 1, as: 1, round: 'Grupos - Jogo 2', hPoss: 52, aPoss: 48, hShots: 13, aShots: 11, hOnTarget: 5, aOnTarget: 4, hCorners: 6, aCorners: 5 },
    { comp: Libertadores, opp: 'Boca Juniors', date: new Date('2026-05-07T19:00:00Z'), home: false, status: MatchStatus.FINISHED, hs: 1, as: 0, round: 'Grupos - Jogo 3', hPoss: 41, aPoss: 59, hShots: 8, aShots: 17, hOnTarget: 3, aOnTarget: 7, hCorners: 3, aCorners: 8 },
    { comp: Libertadores, opp: 'Boca Juniors', date: new Date('2026-05-15T19:00:00Z'), home: true, status: MatchStatus.FINISHED, hs: 2, as: 0, round: 'Grupos - Jogo 4', hPoss: 57, aPoss: 43, hShots: 16, aShots: 9, hOnTarget: 7, aOnTarget: 3, hCorners: 8, aCorners: 3 },
    { comp: Libertadores, opp: 'AC Milan', date: new Date('2026-07-17T21:00:00Z'), home: true, status: MatchStatus.SCHEDULED, round: 'Oitavas de Final - Ida' },
    { comp: Libertadores, opp: 'AC Milan', date: new Date('2026-07-24T21:00:00Z'), home: false, status: MatchStatus.SCHEDULED, round: 'Oitavas de Final - Volta' },

    // Copa São Paulo
    { comp: CopaPaulista, opp: 'Inter de Limeira', date: new Date('2026-03-10T15:00:00Z'), home: true, status: MatchStatus.FINISHED, hs: 3, as: 1, round: 'Primeira Fase' },
    { comp: CopaPaulista, opp: 'São José EC', date: new Date('2026-03-17T15:00:00Z'), home: false, status: MatchStatus.FINISHED, hs: 1, as: 2, round: 'Primeira Fase' },
    { comp: CopaPaulista, opp: 'Santos FC', date: new Date('2026-03-24T15:00:00Z'), home: true, status: MatchStatus.FINISHED, hs: 2, as: 2, round: 'Primeira Fase' },
  ];

  let matchesCreated = 0;
  for (const m of matchesData) {
    const opp = opponents[m.opp];
    if (!opp) {
      console.log(`⚠️  Oponente não encontrado: ${m.opp} — pulando partida.`);
      continue;
    }
    try {
      await prisma.match.create({
        data: {
          competitionId: m.comp.id,
          opponentId: opp.id,
          date: m.date,
          venue: m.home ? 'Neo Química Arena' : opp.stadium,
          isHome: m.home,
          status: m.status,
          homeScore: m.hs ?? null,
          awayScore: m.as ?? null,
          round: m.round,
          homePossession: m.hPoss ?? null,
          awayPossession: m.aPoss ?? null,
          homeShots: m.hShots ?? null,
          awayShots: m.aShots ?? null,
          homeOnTarget: m.hOnTarget ?? null,
          awayOnTarget: m.aOnTarget ?? null,
          homeCorners: m.hCorners ?? null,
          awayCorners: m.aCorners ?? null,
          season: '2026',
        },
      });
      matchesCreated++;
    } catch (e: any) {
      if (e.code === 'P2002') continue;
      throw e;
    }
  }
  console.log(`✅ ${matchesCreated} partidas criadas`);

  // ─── 9. STANDINGS (Brasileirão) ────────────────────────────
  const standingsData = [
    { pos: 1, name: 'Flamengo', played: 14, won: 10, drawn: 2, lost: 2, gf: 28, ga: 10, pts: 32, form: 'V-V-E-V-V', zone: 'TITLE' },
    { pos: 2, name: 'Palmeiras', played: 14, won: 9, drawn: 3, lost: 2, gf: 25, ga: 9, pts: 30, form: 'V-E-V-V-E', zone: 'LIBERTADORES' },
    { pos: 3, name: 'Botafogo', played: 14, won: 9, drawn: 2, lost: 3, gf: 24, ga: 12, pts: 29, form: 'V-V-D-V-E', zone: 'LIBERTADORES' },
    { pos: 4, name: 'Corinthians', played: 14, won: 8, drawn: 3, lost: 3, gf: 23, ga: 11, pts: 27, form: 'V-E-V-D-V', isOwnTeam: true, zone: 'LIBERTADORES' },
    { pos: 5, name: 'Fortaleza', played: 14, won: 8, drawn: 2, lost: 4, gf: 21, ga: 14, pts: 26, form: 'E-V-V-D-V', zone: 'LIBERTADORES_PRELIMINARY' },
    { pos: 6, name: 'São Paulo FC', played: 14, won: 7, drawn: 3, lost: 4, gf: 20, ga: 15, pts: 24, form: 'E-V-D-V-E', zone: 'SULAMERICANA' },
    { pos: 7, name: 'Bahia', played: 14, won: 7, drawn: 2, lost: 5, gf: 19, ga: 16, pts: 23, form: 'V-D-V-V-D', zone: 'SULAMERICANA' },
    { pos: 8, name: 'Atlético Mineiro', played: 14, won: 6, drawn: 4, lost: 4, gf: 18, ga: 14, pts: 22, form: 'E-V-D-V-E', zone: 'SULAMERICANA' },
    { pos: 9, name: 'Grêmio', played: 14, won: 6, drawn: 3, lost: 5, gf: 17, ga: 15, pts: 21, form: 'D-V-E-V-D' },
    { pos: 10, name: 'Cruzeiro', played: 14, won: 6, drawn: 2, lost: 6, gf: 16, ga: 18, pts: 20, form: 'V-D-D-V-V' },
    { pos: 11, name: 'Fluminense', played: 14, won: 5, drawn: 4, lost: 5, gf: 15, ga: 16, pts: 19, form: 'E-D-V-E-D' },
    { pos: 12, name: 'Santos FC', played: 14, won: 5, drawn: 3, lost: 6, gf: 14, ga: 17, pts: 18, form: 'D-V-E-D-V' },
    { pos: 13, name: 'Athletico Paranaense', played: 14, won: 5, drawn: 2, lost: 7, gf: 13, ga: 19, pts: 17, form: 'D-D-V-D-V' },
    { pos: 14, name: 'Vasco da Gama', played: 14, won: 4, drawn: 3, lost: 7, gf: 12, ga: 21, pts: 15, form: 'D-V-D-D-E' },
    { pos: 15, name: 'Mirassol', played: 14, won: 4, drawn: 2, lost: 8, gf: 11, ga: 20, pts: 14, form: 'D-D-V-D-D' },
    { pos: 16, name: 'Internacional', played: 14, won: 3, drawn: 4, lost: 7, gf: 10, ga: 19, pts: 13, form: 'D-E-D-V-D', zone: 'RELEGATION' },
    { pos: 17, name: 'Novorizontino', played: 14, won: 3, drawn: 3, lost: 8, gf: 9, ga: 22, pts: 12, form: 'D-D-E-D-D', zone: 'RELEGATION' },
    { pos: 18, name: 'Inter de Limeira', played: 14, won: 2, drawn: 4, lost: 8, gf: 8, ga: 23, pts: 10, form: 'E-D-D-E-D', zone: 'RELEGATION' },
    { pos: 19, name: 'São José EC', played: 14, won: 2, drawn: 3, lost: 9, gf: 7, ga: 25, pts: 9, form: 'D-E-D-D-D', zone: 'RELEGATION' },
    { pos: 20, name: 'RB Bragantino', played: 14, won: 1, drawn: 2, lost: 11, gf: 6, ga: 28, pts: 5, form: 'D-D-D-D-E', zone: 'RELEGATION' },
  ];

  let standingsCreated = 0;
  for (const s of standingsData) {
    try {
      await prisma.standingEntry.create({
        data: {
          competitionId: Brasileirao.id,
          position: s.pos,
          teamName: s.name,
          isOwnTeam: s.isOwnTeam || false,
          played: s.played,
          won: s.won,
          drawn: s.drawn,
          lost: s.lost,
          goalsFor: s.gf,
          goalsAgainst: s.ga,
          goalDifference: s.gf - s.ga,
          points: s.pts,
          form: s.form,
          zone: s.zone || 'NONE',
        },
      });
      standingsCreated++;
    } catch (e: any) {
      if (e.code === 'P2002') continue;
      throw e;
    }
  }
  console.log(`✅ ${standingsCreated} classificações do Brasileirão`);

  console.log('\n🎉 Seed completo do Clube API finalizado!');
  console.log('━'.repeat(50));
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
