// prisma/seed-full.ts
// Seed completo para o portal Rádio Coringão
// Execute com: npx tsx prisma/seed-full.ts

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🏟️  Rádio Coringão — Seed Completo\n');
  console.log('━'.repeat(55));

  // ═══════════════════════════════════════════════════════════════
  // 1. CONFIGURAÇÕES DO SITE
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📌 1. Configurações do site...');

  await prisma.siteSettings.upsert({
    where: { id: 'main' },
    update: {},
    create: {
      id: 'main',
      siteName: 'Rádio Coringão',
      siteDescription:
        'O maior portal de notícias do Corinthians. Cobertura completa do Timão — futebol, basquete, vôlei e todas as modalidades com foco na torcida corintiana.',
      logoUrl: 'https://res.cloudinary.com/radio-coringao/image/upload/v1/logo-radio-coringao.png',
      faviconUrl: 'https://res.cloudinary.com/radio-coringao/image/upload/v1/favicon.ico',
      primaryColor: '#000000',
      socialFacebook: 'https://www.facebook.com/radiocoringao',
      socialInstagram: 'https://www.instagram.com/radiocoringao',
      socialTwitter: 'https://twitter.com/radiocoringao',
      socialYoutube: 'https://www.youtube.com/@radiocoringao',
      socialTiktok: 'https://www.tiktok.com/@radiocoringao',
      googleAnalytics: 'G-XXXXXXXXXX',
      footerText:
        'Rádio Coringão — O portal da torcida corintiana. Notícias, análises, entrevistas e cobertura ao vivo de todos os jogos do Timão.',
      copyrightText:
        '© 2026 Rádio Coringão. Todos os direitos reservados. Corinthians® é marca registrada do Sport Club Corinthians Paulista.',
      biography:
        'A Rádio Coringão nasceu da paixão de torcedores que queriam uma cobertura mais próxima e autêntica do Sport Club Corinthians Paulista. Desde 2020, somos referência em notícias corintianas, com jornalistas apaixonados pelo clube que trazem tudo o que o torcedor precisa saber — do primeiro ao último lance.',
    },
  });
  console.log('   ✅ SiteSettings atualizado com dados da Rádio Coringão');

  // ═══════════════════════════════════════════════════════════════
  // 2. USUÁRIOS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n👤 2. Criando usuários...');

  const defaultPassword = await bcrypt.hash('Corinthians@2026', 12);

  const users = [
    {
      name: 'Carlos Eduardo Silva',
      email: 'carlos@radiocoringao.com.br',
      password: defaultPassword,
      role: 'SUPER_ADMIN' as const,
      avatar: 'https://res.cloudinary.com/radio-coringao/image/upload/v1/avatars/carlos-eduardo.jpg',
      bio: 'Fundador e administrador da Rádio Coringão. Torcedor corintiano desde 1985, jornalista com mais de 20 anos de experiência na cobertura esportiva paulistana.',
      position: 'Diretor Geral',
    },
    {
      name: 'Fernanda Oliveira',
      email: 'fernanda@radiocoringao.com.br',
      password: defaultPassword,
      role: 'EDITOR_CHEFE' as const,
      avatar: 'https://res.cloudinary.com/radio-coringao/image/upload/v1/avatars/fernanda-oliveira.jpg',
      bio: 'Editora-chefe da Rádio Coringão. Especialista em cobertura de transferências e mercado da bola. Apaixonada pelo Timão desde a infância.',
      position: 'Editora-Chefe',
    },
    {
      name: 'Marcos Vinícius Costa',
      email: 'marcos@radiocoringao.com.br',
      password: defaultPassword,
      role: 'EDITOR_CHEFE' as const,
      avatar: 'https://res.cloudinary.com/radio-coringao/image/upload/v1/avatars/marcos-vinicius.jpg',
      bio: 'Editor-chefe responsável pela cobertura ao vivo e transmissões. Ex-redator de portais esportivos nacionais.',
      position: 'Editor-Chefe',
    },
    {
      name: 'Ana Beatriz Santos',
      email: 'ana@radiocoringao.com.br',
      password: defaultPassword,
      role: 'JORNALISTA' as const,
      avatar: 'https://res.cloudinary.com/radio-coringao/image/upload/v1/avatars/ana-beatriz.jpg',
      bio: 'Jornalista esportiva cobrindo o Corinthians desde 2022. Presente em todos os jogos do Timão em casa e fora.',
      position: 'Repórter',
    },
    {
      name: 'Ricardo Mendes',
      email: 'ricardo@radiocoringao.com.br',
      password: defaultPassword,
      role: 'COLUNISTA' as const,
      avatar: 'https://res.cloudinary.com/radio-coringao/image/upload/v1/avatars/ricardo-mendes.jpg',
      bio: 'Colunista da Rádio Coringão. Ex-jogador de base do Corinthians e comentarista esportivo. Coluna "Ponto de Vista Corintiano".',
      position: 'Colunista',
    },
  ];

  const createdUsers: Record<string, string> = {};

  for (const user of users) {
    const result = await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, bio: user.bio, position: user.position },
      create: user,
    });
    createdUsers[user.role] = result.id;
    console.log(`   ✅ ${user.role}: ${user.name}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // 3. CATEGORIAS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📂 3. Criando categorias...');

  const categories = [
    { name: 'Futebol', slug: 'futebol', description: 'Notícias do futebol profissional, base e seleções com foco no Corinthians.', color: '#1DB954', icon: 'football', order: 1 },
    { name: 'Basquete', slug: 'basquete', description: 'Cobertura do Corinthians Basquete e do basquete nacional.', color: '#E63946', icon: 'basketball', order: 2 },
    { name: 'Tênis', slug: 'tenis', description: 'Grand Slams, ATP, WTA e destaque para tenistas brasileiros.', color: '#F4A261', icon: 'tennis', order: 3 },
    { name: 'MMA', slug: 'mma', description: 'UFC, Bellator e artes marciais mistas. Destaque para atletas brasileiros.', color: '#9B2335', icon: 'mma', order: 4 },
    { name: 'Natação', slug: 'natacao', description: 'Competições de natação, Open de natação e preparação olímpica.', color: '#2196F3', icon: 'swimming', order: 5 },
    { name: 'Automobilismo', slug: 'automobilismo', description: 'Fórmula 1, Stock Car, Fórmula Truck e automobilismo brasileiro.', color: '#FF5722', icon: 'racing', order: 6 },
  ];

  const categoryIds: Record<string, string> = {};

  for (const cat of categories) {
    const result = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { description: cat.description, color: cat.color },
      create: cat,
    });
    categoryIds[cat.slug] = result.id;
    console.log(`   ✅ ${cat.name}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // 4. TAGS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n🏷️  4. Criando tags...');

  const tags = [
    { name: 'Corinthians', slug: 'corinthians' },
    { name: 'Timão', slug: 'timao' },
    { name: 'Brasileirão', slug: 'brasileirao' },
    { name: 'Libertadores', slug: 'libertadores' },
    { name: 'Copa do Brasil', slug: 'copa-do-brasil' },
    { name: 'Paulistão', slug: 'paulistao' },
    { name: 'Neo Química Arena', slug: 'neo-quimica-arena' },
    { name: 'Transferências', slug: 'transferencias' },
    { name: 'Mercado da Bola', slug: 'mercado-da-bola' },
    { name: 'Jogos do Timão', slug: 'jogos-do-timao' },
    { name: 'Base', slug: 'base' },
    { name: 'Torcida', slug: 'torcida' },
    { name: 'Seleção Brasileira', slug: 'selecao-brasileira' },
    { name: 'Copa do Mundo 2026', slug: 'copa-do-mundo-2026' },
    { name: 'Opinião', slug: 'opiniao' },
    { name: 'Entrevista', slug: 'entrevista' },
    { name: 'Análise Tática', slug: 'analise-tatica' },
    { name: 'Brasileirão Feminino', slug: 'brasileirao-feminino' },
  ];

  const tagIds: Record<string, string> = {};

  for (const tag of tags) {
    const result = await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: tag,
    });
    tagIds[tag.slug] = result.id;
    console.log(`   ✅ ${tag.name}`);
  }

  // ═══════════════════════════════════════════════════════════════
  // 5. ARTIGOS (20+ artigos publicados sobre o Corinthians)
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📰 5. Criando artigos...');

  const articlesData = [
    // --- Artigo 1: NOTÍCIA principal ---
    {
      title: 'Corinthians goleia o São Paulo na Neo Química Arena e assume liderança do Paulistão',
      subtitle: 'Timão aplicou 4x1 no clássico e encorapinha rumo à semifinal do campeonato paulista',
      slug: 'corinthians-goleia-sao-paulo-paulistao-2026',
      content: `<p>O Corinthians fez uma apresentação magnética neste domingo na Neo Química Arena e goleou o São Paulo por 4 a 1, na partida válida pela 12ª rodada do Paulistão 2026.</p>
<p>Com gols de Yuri Alberto (2), Renato Augusto e Memphis Depay, o Timão dominou de cabo a rabo e assume a liderança isolada do campeonato paulista, com 32 pontos — cinco à frente do Palmeiras.</p>
<p>O primeiro gol saiu aos 12 minutos do primeiro tempo, quando Yuri Alberto aproveitou um cruzamento perfeito de Caio Paulista para cabecear no canto esquerdo do goleiro.Calleri não teve chances. aos 28 minutos, Renato Augusto ampliou após bela jogada individual pela direita.</p>
<p>No segundo tempo, Memphis Depay marcou o terceiro aos 12 minutos com cobrança de falta de fora da área, e Yuri Alberto fechou o placar aos 38 minutos em contra-ataque rápido.</p>
<p>O São Paulo descontou com Luciano aos 45 do segundo tempo, mas foi apenas para amenizar o placar.</p>`,
      excerpt: 'Timão aplicou 4x1 no clássico e assume liderança isolada do Paulistão 2026 com 32 pontos.',
      status: 'PUBLISHED' as const,
      type: 'NEWS' as const,
      isFeatured: true,
      isBreaking: true,
      isPinned: true,
      order: 1,
      coverImage: 'https://res.cloudinary.com/radio-coringao/image/upload/v1/articles/goleada-sp-2026.jpg',
      coverImageAlt: 'Yemem celebra gol na Neo Química Arena contra o São Paulo',
      coverImageCredit: 'Foto: Marcelo Ribas / Radio Coringão',
      quotes: JSON.stringify([
        { author: 'Ramón Díaz', text: 'Esse é o Corinthians que a torcida merece. Time unido, com identidade e muita raça. Vamos lutar por tudo esse ano.' },
        { author: 'Yuri Alberto', text: 'Gol do Yuri Alberto na comemoração. Quando a torcida está assim, o time joga com uma energia diferente. Queremos o título.' }
      ]),
      authorId: createdUsers['JORNALISTA'],
      categoryId: categoryIds['futebol'],
      metaTitle: 'Corinthians goleia São Paulo 4x1 e lidera o Paulistão 2026 | Rádio Coringão',
      metaDescription: 'Timão aplicou goleada histórica no clássico e assume liderança isolada do Paulistão 2026. Confira os detalhes do jogo.',
      viewCount: 1245,
      publishedAt: new Date('2026-07-06T14:30:00Z'),
    },
    // --- Artigo 2: ANÁLISE ---
    {
      title: 'Análise tática: como o Corinthians neutralizou o meio-campo do São Paulo',
      subtitle: 'Pressão alta e marcação por zona foram as armas de Ramón Díaz no clássico',
      slug: 'analise-tatica-corinthians-sao-paulo-paulistao',
      content: `<p>A goleada do Corinthians sobre o São Paulo não foi apenas resultado de qualidade individual — foi um trabalho tático impecável de Ramón Díaz.</p>
<p>O treinador argentino montou um 4-2-3-1 com pressão alta, fechando os corredores centrais e forçando o São Paulo a jogar pelas laterais, onde a defesa corintiana estava bem posicionada.</p>
<p>Charles e Roni formaram a dupla de volantes que destruiu as jogadas do São Paulo antes que chegassem ao ataque. Os dois cobriram 12,3 km em média, acima da média da temporada.</p>
<p>Pela direita, Maycon e Wagner Explorer criaram superioridade numérica constantemente,孤立ando Wellington na marcação. Foi por ali que veio o segundo gol de Renato Augusto.</p>`,
      excerpt: 'Pressão alta e marcação por zona foram as armas de Ramón Díaz na vitória de 4x1 sobre o São Paulo.',
      status: 'PUBLISHED' as const,
      type: 'ANALYSIS' as const,
      isFeatured: true,
      isBreaking: false,
      isPinned: false,
      order: 2,
      coverImage: 'https://res.cloudinary.com/radio-coringao/image/upload/v1/articles/analise-tatica-sp.jpg',
      coverImageAlt: 'Análise tática do Corinthians vs São Paulo',
      coverImageCredit: 'Foto: Reprodução TV',
      authorId: createdUsers['EDITOR_CHEFE'],
      categoryId: categoryIds['futebol'],
      metaTitle: 'Análise tática: Corinthians 4x1 São Paulo | Tática de Ramón Díaz | Rádio Coringão',
      metaDescription: 'Análise completa da tática usada pelo Corinthians para golear o São Paulo no Paulistão 2026.',
      viewCount: 876,
      publishedAt: new Date('2026-07-07T09:00:00Z'),
    },
    // --- Artigo 3: ENTREVISTA ---
    {
      title: 'Memphis Depay: "O Corinthians é a maior paixão do Brasil, quero fazer história aqui"',
      subtitle: 'Atacante holandês concedeu entrevista exclusiva à Rádio Coringão e falou sobre sua rotina no Timão',
      slug: 'memphis-depay-entrevista-exclusiva-radiocoringao',
      content: `<p><strong>Rádio Coringão — Entrevista Exclusiva</strong></p>
<p>Memphis Depay, atacante holandês do Corinthians, concedeu entrevista exclusiva à Rádio Coringão e falou sobre sua adaptação ao futebol brasileiro e a paixão da torcida corintiana.</p>
<p><strong>Rádio Coringão:</strong> Memphis, como está sua adaptação ao Brasil?</p>
<p><strong>Memphis:</strong> Estou me sentindo em casa. O Corinthians é uma paixão enorme, a torcida é incrível. Quando entro na Arena e vejo aquela massa preta e branca, falo: esse é o meu clube. O Brasil tem o futebol mais bonito do mundo, e o Corinthians representa isso de forma pura.</p>
<p><strong>Rádio Coringão:</strong> Como é a relação com os companheiros de equipe?</p>
<p><strong>Memphis:</strong> Sou muito próximo do Yuri Alberto e do Renato Augusto. A gente treina junto todos os dias, troca ideias. No vestiário tem muita união, e isso se reflete em campo. Quando o time é unido fora dele, dentro ele é imparável.</p>
<p><strong>Rádio Coringão:</strong> Quais são seus objetivos nessa temporada?</p>
<p><strong>Memphis:</strong> Ganhar o Paulistão, chegar longo na Copa do Brasil e na Libertadores. Quero deixar minha marca no Corinthians. Quero ser lembrado como um jogador que fez a diferença, que deu alegria à torcida. Esse é o meu objetivo.</p>`,
      excerpt: 'Atacante holandês falou sobre adaptação ao Brasil e objetivos no Timão na temporada 2026.',
      status: 'PUBLISHED' as const,
      type: 'INTERVIEW' as const,
      isFeatured: false,
      isBreaking: false,
      isPinned: false,
      order: 3,
      coverImage: 'https://res.cloudinary.com/radio-coringao/image/upload/v1/articles/memphis-entrevista.jpg',
      coverImageAlt: 'Memphis Depay em entrevista exclusiva à Rádio Coringão',
      coverImageCredit: 'Foto: Vinícius Vieira / Rádio Coringão',
      quotes: JSON.stringify([
        { author: 'Memphis Depay', text: 'O Corinthians é a maior paixão do Brasil, quero fazer história aqui.' }
      ]),
      authorId: createdUsers['SUPER_ADMIN'],
      categoryId: categoryIds['futebol'],
      metaTitle: 'Memphis Depay: "O Corinthians é a maior paixão do Brasil" | Rádio Coringão',
      metaDescription: 'Entrevista exclusiva com Memphis Depay, atacante do Corinthians, sobre sua carreira e objetivos no Timão.',
      viewCount: 1480,
      publishedAt: new Date('2026-07-05T16:00:00Z'),
    },
    // --- Artigo 4: NOTÍCIA ---
    {
      title: 'Corinthians anuncia renovação de contrato com Yuri Alberto até 2029',
      subtitle: 'Goleador do Timão acerta novo vínculo com multa cláusula de R$ 500 milhões',
      slug: 'corinthians-renovacao-yuri-alberto-2029',
      content: `<p>O Corinthians anunciou oficialmente a renovação de contrato com o atacante Yuri Alberto até dezembro de 2029. O jogador, que é o artilheiro do Paulistão 2026 com 14 gols, acertou as novas condições financeiras e terá cláusula de extraterritorialidade fixada em R$ 500 milhões.</p>
<p>A renovação era uma das prioridades da diretoria corintiana, que via no jogador um dos principais ativos do clube. Yuri Alberto, que chegou ao Timão em 2023, se consolidou como titular absoluto e um dos melhores atacantes do futebol brasileiro.</p>
<p>"O Corinthians é minha casa. Quero conquistar títulos aqui e ser lembrado como um grande jogador deste clube", disse Yuri Alberto durante a coletiva de imprensa realizada na Neo Química Arena.</p>
<p>O presidente duílio Alves destacou a importância da renovação: "Yuri é peça fundamental para o nosso projeto. Manter um jogador dessa qualidade é sinal de que o Corinthians está no caminho certo."</p>`,
      excerpt: 'Artilheiro do Paulistão renova com o Timão até 2029 com cláusula de R$ 500 milhões.',
      status: 'PUBLISHED' as const,
      type: 'NEWS' as const,
      isFeatured: true,
      isBreaking: true,
      isPinned: false,
      order: 4,
      coverImage: 'https://res.cloudinary.com/radio-coringao/image/upload/v1/articles/yuri-renovacao.jpg',
      coverImageAlt: 'Yuri Alberto assina renovação com o Corinthians',
      coverImageCredit: 'Foto: Divulgação Corinthians',
      authorId: createdUsers['JORNALISTA'],
      categoryId: categoryIds['futebol'],
      metaTitle: 'Corinthians renova com Yuri Alberto até 2029 | Rádio Coringão',
      metaDescription: 'Yuri Alberto renova contrato com o Corinthians até 2029 com cláusula de R$ 500 milhões.',
      viewCount: 1120,
      publishedAt: new Date('2026-07-04T11:00:00Z'),
    },
    // --- Artigo 5: ANÁLISE colunista ---
    {
      title: 'Por que o Corinthians é o maior candidato ao hexa do Paulistão',
      subtitle: 'Colunista Ricardo Mendes analisa os pontos fortes do Timão na temporada 2026',
      slug: 'corinthians-maior-candidato-hexa-paulistao',
      content: `<p><em>Coluna: Ponto de Vista Corintiano — por Ricardo Mendes</em></p>
<p>Desde que o Paulistão adotou o formato atual, ninguém conquistou o hexacampeonato. Mas se existe um time preparado para quebrar essa barreira em 2026, é o Corinthians de Ramón Díaz.</p>
<p>O Timão apresenta uma combinação perfeita de experiência e juventude. No ataque, Yuri Alberto está em fase electra, com 14 gols em 12 jogos. No meio-campo, Renato Augusto e Maycon dirigem as jogadas com a inteligência de veteranos que já viveram grandes momentos. Na defesa, Cássio, apesar dos 43 anos, continua sendo um dos goleiros mais consistentes do Brasil.</p>
<p>Mas o que mais me impressiona é a solidez tática. Ramón Díaz encontrou o sistema ideal para este elenco: um 4-2-3-1 que se transforma em 4-4-2 na marcação. O time funciona como uma máquina, onde cada peça sabe exatamente o seu papel.</p>
<p>Outro fator decisivo é a torcida. A massa corintiana tem empurrado o time em todos os jogos, criando uma atmosfera intimidadora na Neo Química Arena. Nenhum visitante sai de lá ileso.</p>
<p>Se o Corinthians manter essa regularidade, não apenas conquista o hexa — pode fazer uma campanha histórica na Copa do Brasil e na Libertadores. Este é, sem dúvida, o melhor momento do Timão nos últimos 10 anos.</p>`,
      excerpt: 'Colunista analisa por que o Corinthians é o favorito ao hexacampeonato paulista em 2026.',
      status: 'PUBLISHED' as const,
      type: 'ANALYSIS' as const,
      isFeatured: false,
      isBreaking: false,
      isPinned: false,
      order: 5,
      coverImage: 'https://res.cloudinary.com/radio-coringao/image/upload/v1/articles/hexa-paulistao.jpg',
      coverImageAlt: 'Corinthians candidato ao hexa do Paulistão',
      coverImageCredit: 'Foto: Marcelo Ribas / Rádio Coringão',
      authorId: createdUsers['COLUNISTA'],
      categoryId: categoryIds['futebol'],
      metaTitle: 'Por que o Corinthians é o maior candidato ao hexa do Paulistão | Rádio Coringão',
      metaDescription: 'Colunista Ricardo Mendes analisa a campanha do Corinthians no Paulistão 2026.',
      viewCount: 750,
      publishedAt: new Date('2026-07-03T08:00:00Z'),
    },
    // --- Artigo 6: LIVE ---
    {
      title: 'AO VIVO: Corinthians x Palmeiras — Derby Paulista pelo Brasileirão 2026',
      subtitle: 'Acompanhe em tempo real todos os lances do clássico mais grande do futebol brasileiro',
      slug: 'ao-vivo-corinthians-palmeiras-brasileirao-2026',
      content: `<p><strong>🔴 COBERTURA AO VIVO — Rádio Coringão</strong></p>
<p><strong>Brasileirão 2026 — Rodada 8</strong><br/>Corinthians x Palmeiras<br/>Neo Química Arena — São Paulo, SP<br/>Data: 10/07/2026 — 21h30 (horário de Brasília)</p>
<hr/>
<p><strong>21h45 — GOOOOOL DO CORINTHIANS!</strong><br/>Yuri Alberto abre o placar! Cabeceio certeiro após escanteio de Maycon. 1x0 Timão!</p>
<p><strong>21h50 — Jogada perigosa do Palmeiras</strong><br/>Rony arriscou de fora da área e Cássio fez defesaça. O goleiro corintiano continua imparável.</p>
<p><strong>22h00 — Intervalo</strong><br/>Corinthians 1 x 0 Palmeiras. Time do Díaz superior no primeiro tempo. Renato Augusto é o destaque com 94% de passes corretos.</p>
<p><strong>22h15 — Segundo tempo começa</strong><br/>Palmeiras entra mais ofensivo com substituição: Gabriel Menino entra no lugar de Zé Rafael.</p>
<p><strong>22h32 — GOOOOOL DO PALMEIRAS!</strong><br/>Artur marca o empate após rebate da defesa. 1x1 no placar.</p>
<p><strong>22h45 — CARTÃO VERMELHO!</strong><br/>Gustavo Gómez é expulso por falta violenta em Memphis Depay. Palmeiras com 10 jogadores.</p>
<p><strong>22h58 — GOOOOOL DO CORINTHIANS!</strong><br/>Memphis Depay cobra falta bonita e marca o gol da virada! 2x1 Timão!</p>
<p><strong>23h10 — FIM DE JOGO! Corinthians 2 x 1 Palmeiras!</strong><br/>Timão vence o Derby e se consolida na liderança do Brasileirão!</p>`,
      excerpt: 'Acompanhe em tempo real todos os lances do Derby Paulista pelo Brasileirão 2026.',
      status: 'PUBLISHED' as const,
      type: 'LIVE' as const,
      isFeatured: true,
      isBreaking: false,
      isPinned: false,
      order: 6,
      coverImage: 'https://res.cloudinary.com/radio-coringao/image/upload/v1/articles/derby-live.jpg',
      coverImageAlt: 'Derby Paulista Corinthians x Palmeiras ao vivo',
      coverImageCredit: 'Foto: Rádio Coringão',
      authorId: createdUsers['EDITOR_CHEFE'],
      categoryId: categoryIds['futebol'],
      metaTitle: 'AO VIVO: Corinthians x Palmeiras — Derby pelo Brasileirão 2026 | Rádio Coringão',
      metaDescription: 'Cobertura ao vivo do Derby Paulista entre Corinthians e Palmeiras pelo Brasileirão 2026.',
      viewCount: 1500,
      publishedAt: new Date('2026-07-10T21:00:00Z'),
    },
    // --- Artigo 7: NOTÍCIA transferências ---
    {
      title: 'Corinthians negocia contratação de meia argentino do River Plate',
      subtitle: 'Time corintiano busca reforço para o meio-campo visando a segunda metade da temporada',
      slug: 'corinthians-negocia-meia-argentino-river-plate',
      content: `<p>O Corinthians está muito próximo de fechar a contratação do meia argentino Pablo Solari, do River Plate. As negociações estão em fase avançada e a expectativa é que o jogador chegue a São Paulo nos próximos dias para realizar os exames médicos.</p>
<p>Solari, de 23 anos, é um meia criativo com perfil ofensivo que agradou a comissão técnica de Ramón Díaz. O treinador argentino conhece bem o jogador, que se destacou nas categorias de base da Argentina e no River Plate.</p>
<p>De acordo com fontes próximas ao clube, o empréstimo será até o final da temporada, com opção de compra fixada em euros. O Corinthians pagará parte do salário do jogador.</p>
<p>"Solari é um jogador que pode fazer a diferença no meio-campo corintiano. Ele tem visão de jogo, qualidade na bola parada e muita disposição", disse uma fonte interna ao site.</p>`,
      excerpt: 'Corinthians negocia meia argentino do River Plate para reforçar o meio-campo na segunda metade da temporada.',
      status: 'PUBLISHED' as const,
      type: 'NEWS' as const,
      isFeatured: false,
      isBreaking: true,
      isPinned: false,
      order: 7,
      coverImage: 'https://res.cloudinary.com/radio-coringao/image/upload/v1/articles/solari-river.jpg',
      coverImageAlt: 'Pablo Solari, meia argentino do River Plate',
      coverImageCredit: 'Foto: Divulgação River Plate',
      authorId: createdUsers['JORNALISTA'],
      categoryId: categoryIds['futebol'],
      metaTitle: 'Corinthians negocia meia argentino do River Plate | Rádio Coringão',
      metaDescription: 'Time corintiano busca reforço para o meio-campo visando a segunda metade da temporada 2026.',
      viewCount: 920,
      publishedAt: new Date('2026-07-08T15:30:00Z'),
    },
    // --- Artigo 8: NOTÍCIA ---
    {
      title: 'Ramón Díaz é eleito melhor treinador do Paulistão 2026 pela imprensa',
      subtitle: 'Argentino conduz o Timão à melhor campanha da história do clube no estadual',
      slug: 'ramon-diaz-melhor-treinador-paulistao-2026',
      content: `<p>O treinador argentino Ramón Díaz foi eleito o melhor técnico do Paulistão 2026 pela Associação Paulista de Futebol (APF). O técnico do Corinthians recebeu o prêmio em cerimônia realizada no Palácio dos Bandeirantes.</p>
<p>Díaz conduziu o Timão a uma campanha histórica no estadual, com 11 vitórias, 1 empate e nenhuma derrota em 12 jogos, marcando 35 gols e sofreu apenas 6. É a melhor campanha da história do Corinthians no Paulistão.</p>
<p>"Esse prêmio é do meu trabalho, mas principalmente dos jogadores e da torcida. Sem eles, nada seria possível. O Corinthians é um clube especial, e ser reconhecido aqui é uma honra enorme", disse Díaz emocionado.</p>
<p>O argentino chegou ao Corinthians em janeiro de 2025 e desde então transformou o time em uma máquina de vencer. Sob seu comando, o Timão conquistou o Paulistão 2025 e agora mira o hexa.</p>`,
      excerpt: 'Ramón Díaz é eleito melhor treinador do Paulistão 2026 pela imprensa paulista.',
      status: 'PUBLISHED' as const,
      type: 'NEWS' as const,
      isFeatured: false,
      isBreaking: false,
      isPinned: false,
      order: 8,
      coverImage: 'https://res.cloudinary.com/radio-coringao/image/upload/v1/articles/ramon-diaz-premio.jpg',
      coverImageAlt: 'Ramón Díaz recebe prêmio de melhor treinador',
      coverImageCredit: 'Foto: Divulgação Corinthians',
      authorId: createdUsers['JORNALISTA'],
      categoryId: categoryIds['futebol'],
      metaTitle: 'Ramón Díaz eleito melhor treinador do Paulistão 2026 | Rádio Coringão',
      metaDescription: 'Ramón Díaz é reconhecido como melhor técnico do Paulistão 2026.',
      viewCount: 680,
      publishedAt: new Date('2026-07-02T18:00:00Z'),
    },
    // --- Artigo 9: ANÁLISE tática ---
    {
      title: 'A evolução tática do Corinthians: de 4-3-3 ao 4-2-3-1 de Ramón Díaz',
      subtitle: 'Como o treinador argentino transformou o sistema de jogo do Timão em uma temporada',
      slug: 'evolucao-tatica-corinthians-ramon-diaz',
      content: `<p><strong>Análise Tática — Rádio Coringão</strong></p>
<p>Quando Ramón Díaz chegou ao Corinthians em janeiro de 2025, o time jogava em um sistema 4-3-3 que não aproveitava ao máximo as qualidades do elenco. Aos poucos, o argentino implementou um 4-2-3-1 que se tornou a marca registrada do Timão.</p>
<p>A mudança principal foi na saída de bola. Antes, o Corinthians tentava jogadas longas, perdendo muitas bolas no meio-campo. Agora, com Charles e Roni como volantes, o time constrói jogadas curtas e rápidas, aproveitando a movimentação dos meias.</p>
<p>No ataque, Memphis Depay se tornou o camisa 10 ideal para esse sistema. Com liberdade para circular entre as linhas, o holandês criou 23 oportunidades de gol nos últimos 10 jogos — o melhor número do Brasileirão.</p>
<p>Pela direita, Wagner Explorer tem surpreendido com suas subidas constantes, criando superioridade numérica. Pela esquerda, Caio Paulista é mais contido, garantindo equilíbrio defensivo.</p>
<p>O resultado? O Corinthians passou de 8º lugar no Brasileirão 2025 para líder invicto em 2026. Uma transformação completa em apenas uma temporada.</p>`,
      excerpt: 'Como Ramón Díaz transformou o sistema tático do Corinthians em uma temporada.',
      status: 'PUBLISHED' as const,
      type: 'ANALYSIS' as const,
      isFeatured: false,
      isBreaking: false,
      isPinned: false,
      order: 9,
      coverImage: 'https://res.cloudinary.com/radio-coringao/image/upload/v1/articles/evolucao-tatica.jpg',
      coverImageAlt: 'Evolução tática do Corinthians sob comando de Ramón Díaz',
      coverImageCredit: 'Foto: Reprodução TV',
      authorId: createdUsers['COLUNISTA'],
      categoryId: categoryIds['futebol'],
      metaTitle: 'A evolução tática do Corinthians de Ramón Díaz | Rádio Coringão',
      metaDescription: 'Análise completa da evolução tática do Corinthians sob comando de Ramón Díaz.',
      viewCount: 540,
      publishedAt: new Date('2026-07-01T10:00:00Z'),
    },
    // --- Artigo 10: NOTÍCIA Copa do Brasil ---
    {
      title: 'Corinthians avança para semifinal da Copa do Brasil após goleada sobre o Flamengo',
      subtitle: 'Timão goleou por 3x0 no Maracanã e garantiu vaga com folga',
      slug: 'corinthians-avancou-semifinal-copa-do-brasil-flamengo',
      content: `<p>O Corinthians fez uma noite histórica no Maracanã e goleou o Flamengo por 3 a 0, na partida de volta das quartas de final da Copa do Brasil 2026. Com o placar agregado de 4 a 1 (vitória por 1x1 no primeiro jogo em São Paulo), o Timão está classificado para a semifinal.</p>
<p>Memphis Depay abriu o placar aos 18 minutos do primeiro tempo com um golaço de fora da área. Renato Augusto ampliou aos 35 minutos em jogada trabalhada, e Yuri Alberto fechou o placar aos 62 minutos em contra-ataque.</p>
<p>O Flamengo, que precisava de pelo menos três gols para empatar o agregado, não conseguiu criar perigo real contra uma defesa corintiana bem organizada. Cássio fez duas defesas importantes no primeiro tempo para manter o placar zero.</p>
<p>Na semifinal, o Corinthians enfrentará o Internacional, que eliminou o Botafogo. Os dois jogos serão definidos em sorteio da CBF.</p>`,
      excerpt: 'Timão goleou o Flamengo no Maracanã e avança para semifinal da Copa do Brasil 2026.',
      status: 'PUBLISHED' as const,
      type: 'NEWS' as const,
      isFeatured: true,
      isBreaking: true,
      isPinned: false,
      order: 10,
      coverImage: 'https://res.cloudinary.com/radio-coringao/image/upload/v1/articles/copa-brasil-flamengo.jpg',
      coverImageAlt: 'Corinthians comemora classificação no Maracanã',
      coverImageCredit: 'Foto: Marcelo Ribas / Rádio Coringão',
      quotes: JSON.stringify([
        { author: 'Ramón Díaz', text: 'Vencer no Maracanã com essa atuação é muito especial. Os jogadores foram incríveis, a torcida que viajou foi incrível. Estamos na semifinal e vamos lutar pelo título.' }
      ]),
      authorId: createdUsers['JORNALISTA'],
      categoryId: categoryIds['futebol'],
      metaTitle: 'Corinthians goleia Flamengo e avança na Copa do Brasil 2026 | Rádio Coringão',
      metaDescription: 'Timão goleou o Flamengo no Maracanã por 3x0 e avança para semifinal da Copa do Brasil.',
      viewCount: 1380,
      publishedAt: new Date('2026-07-09T22:00:00Z'),
    },
    // --- Artigo 11: NOTÍCIA base ---
    {
      title: 'Garoto da base do Corinthians, João Pedro, é convocado paraSeleção Sub-20',
      subtitle: 'Meia de 19 anos se destaca no Brasileirão Sub-20 e chamou atenção da CBF',
      slug: 'joao-pedro-base-corinthians-convocado-selecao-sub20',
      content: `<p>O meia João Pedro, de 19 anos, da base do Corinthians, foi convocado pela Seleção Brasileira Sub-20 para os amistosos contra Argentina e Uruguai, que acontecerão em agosto.</p>
<p>João Pedro se destacou no Brasileirão Sub-20, onde é o maior artilheiro do campeonato com 9 gols em 11 jogos. O jogador chama atenção pela visão de jogo, habilidade na bola parada e capacidade de marcação — qualidades raras em meias年轻.</p>
<p>O técnico da Seleção Sub-20, Roberto Fonseca, destacou as qualidades do jogador: "João Pedro é um meia moderno, que sabe jogar nas duas frentes. Ele tem qualidade técnica, inteligência tática e muita raça. É um jogador que pode fazer história."</p>
<p>O Corinthians liberou o jogador para a concentração da Seleção, que começará em 25 de julho no CT da CBF, em Teresópolis.</p>`,
      excerpt: 'Meia de 19 anos da base corintiana é convocado para Seleção Sub-20 após destaque no campeonato brasileiro da categoria.',
      status: 'PUBLISHED' as const,
      type: 'NEWS' as const,
      isFeatured: false,
      isBreaking: false,
      isPinned: false,
      order: 11,
      coverImage: 'https://res.cloudinary.com/radio-coringao/image/upload/v1/articles/joao-pedro-base.jpg',
      coverImageAlt: 'João Pedro, meia da base do Corinthians',
      coverImageCredit: 'Foto: Divulgação Corinthians',
      authorId: createdUsers['JORNALISTA'],
      categoryId: categoryIds['futebol'],
      metaTitle: 'Garoto da base do Corinthians é convocado para Seleção Sub-20 | Rádio Coringão',
      metaDescription: 'João Pedro, meia de 19 anos, é convocado para Seleção Sub-20 após destaque na base do Corinthians.',
      viewCount: 430,
      publishedAt: new Date('2026-07-08T12:00:00Z'),
    },
    // --- Artigo 12: NOTÍCIA estádio ---
    {
      title: 'Neo Química Arena recebe reforma de R$ 45 milhões para a Copa do Mundo 2026',
      subtitle: 'Obras incluem novos acessos, aumentos da capacidade e modernização dos sistemas de segurança',
      slug: 'neo-quimica-arena-reforma-copa-do-mundo-2026',
      content: `<p>A Neo Química Arena, casa do Corinthians, iniciou obras de reforma que custarão R$ 45 milhões para adequar o estádio à Copa do Mundo FIFA 2026, que terá partidas em São Paulo.</p>
<p>As obras incluem a construção de novos acessos para o público, ampliação da capacidade de 49.205 para 52.000 torcedores, modernização dos sistemas de segurança e instalação de novos painéis de LED.</p>
<p>O presidente do Corinthians, Duílio Alves, destacou a importância das obras: "A Neo Química Arena é um dos estádios mais modernos do Brasil, e essas reformas vão colocá-la no nível dos melhores estádios do mundo para a Copa do Mundo."</p>
<p>As obras devem ser concluídas até dezembro de 2025, garantindo tempo para os testes necessários antes da Copa do Mundo, que começa em junho de 2026.</p>`,
      excerpt: 'Neo Química Arena recebe reforma de R$ 45 milhões para a Copa do Mundo 2026.',
      status: 'PUBLISHED' as const,
      type: 'NEWS' as const,
      isFeatured: false,
      isBreaking: false,
      isPinned: false,
      order: 12,
      coverImage: 'https://res.cloudinary.com/radio-coringao/image/upload/v1/articles/arena-reforma.jpg',
      coverImageAlt: 'Neo Química Arena em obras para a Copa do Mundo',
      coverImageCredit: 'Foto: Divulgação Corinthians',
      authorId: createdUsers['JORNALISTA'],
      categoryId: categoryIds['futebol'],
      metaTitle: 'Neo Química Arena recebe reforma para Copa do Mundo 2026 | Rádio Coringão',
      metaDescription: 'Estádio do Corinthians será reformado por R$ 45 milhões para a Copa do Mundo 2026.',
      viewCount: 890,
      publishedAt: new Date('2026-07-06T09:00:00Z'),
    },
    // --- Artigo 13: ANÁLISE Brasileirão ---
    {
      title: 'Classificação do Brasileirão 2026: Corinthians lidera com sete pontos de vantagem',
      subtitle: 'Veja a tabela atualizada e a análise da Rádio Coringão sobre a disputa pelo título',
      slug: 'classificacao-brasileirao-2026-corinthians-lider',
      content: `<p><strong>Brasileirão Série A — Atualização da 8ª rodada</strong></p>
<p>O Corinthians consolidou a liderança do Brasileirão 2026 após a vitória no Derby sobre o Palmeiras. Com 22 pontos em 8 jogos (7 vitórias, 1 empate), o Timão tem sete pontos de vantagem sobre o segundo colocado, o Botafogo.</p>
<p><strong>Classificação Parcial:</strong></p>
<ol>
<li>Corinthians — 22 pts</li>
<li>Botafogo — 15 pts</li>
<li>Palmeiras — 14 pts</li>
<li>Flamengo — 13 pts</li>
<li>São Paulo — 12 pts</li>
<li>Internacional — 11 pts</li>
</ol>
<p>A Rádio Coringão analisa: o Corinthians tem o melhor ataque (18 gols marcados) e a melhor defesa (4 gols sofridos) do campeonato. O time de Ramón Díaz é o mais consistente, com vitórias contra todos os rivais diretos.</p>
<p>Na próxima rodada, o Timão recebe o Vasco na Neo Química Arena, enquanto o Botafogo visita o Palmeiras. Uma vitória corintiana praticamente garante a liderança até o final do primeiro turno.</p>`,
      excerpt: 'Corinthians lidera o Brasileirão 2026 com sete pontos de vantagem. Veja a classificação completa.',
      status: 'PUBLISHED' as const,
      type: 'ANALYSIS' as const,
      isFeatured: false,
      isBreaking: false,
      isPinned: false,
      order: 13,
      coverImage: 'https://res.cloudinary.com/radio-coringao/image/upload/v1/articles/classificacao-brasileirao.jpg',
      coverImageAlt: 'Classificação do Brasileirão 2026',
      coverImageCredit: 'Foto: Rádio Coringão',
      authorId: createdUsers['EDITOR_CHEFE'],
      categoryId: categoryIds['futebol'],
      metaTitle: 'Classificação do Brasileirão 2026 — Corinthians lidera | Rádio Coringão',
      metaDescription: 'Corinthians lidera o Brasileirão 2026 com 22 pontos em 8 jogos.',
      viewCount: 1050,
      publishedAt: new Date('2026-07-11T08:00:00Z'),
    },
    // --- Artigo 14: NOTÍCIA feminino ---
    {
      title: 'Corinthians Feminino goleia o Palmeiras e avança para final do Paulistão',
      subtitle: 'Time feminino do Timão aplicou 5x1 no clássico e encaminha bicampeonato consecutivo',
      slug: 'corinthians-feminino-goleia-palmeiras-paulistao',
      content: `<p>O Corinthians Feminino fez uma apresentação brilhante e goleou o Palmeiras por 5 a 1, na semifinal do Paulistão Feminino 2026. Com o resultado, o time feminino do Timão está na final e mira o bicampeonato consecutivo.</p>
<p>Tamires abriu o placar aos 10 minutos, Grazielle ampliou aos 25, e Kerolin fez o terceiro aos 38. No segundo tempo, Duda Sampaio marcou o quarto aos 15 minutos, e Gabi Zanotti fechou o placar aos 40. O Palmeiras descontou com Byanca aos 45 do segundo tempo.</p>
<p>O técnico Arthur Elias comemorou a classificação: "As meninas jogaram muito bem. Estamos focadas no título, que é o nosso objetivo principal. Queremos dar alegria para a torcida corintiana."</p>
<p>A final será contra o Ferroviária, que eliminou o São Paulo. Os jogos serão disputados em 15 e 22 de julho.</p>`,
      excerpt: 'Time feminino do Corinthians goleia o Palmeiras por 5x1 e avança para final do Paulistão Feminino.',
      status: 'PUBLISHED' as const,
      type: 'NEWS' as const,
      isFeatured: false,
      isBreaking: false,
      isPinned: false,
      order: 14,
      coverImage: 'https://res.cloudinary.com/radio-coringao/image/upload/v1/articles/corinthians-feminino.jpg',
      coverImageAlt: 'Corinthians Feminino comemora gol contra o Palmeiras',
      coverImageCredit: 'Foto: Divulgação Corinthians',
      authorId: createdUsers['JORNALISTA'],
      categoryId: categoryIds['futebol'],
      metaTitle: 'Corinthians Feminino goleia Palmeiras e vai à final | Rádio Coringão',
      metaDescription: 'Time feminino do Corinthians goleia o Palmeiras por 5x1 na semifinal do Paulistão Feminino.',
      viewCount: 650,
      publishedAt: new Date('2026-07-07T19:00:00Z'),
    },
    // --- Artigo 15: NOTÍCIA Libertadores ---
    {
      title: 'Corinthians enfrenta o Peñarol na Libertadores: tudo sobre a classificação',
      subtitle: 'Timão mede forças com o gigante do Uruguai nas oitavas de final da Copa Libertadores',
      slug: 'corinthians-vs-penarol-libertadores-oitavas',
      content: `<p>O Corinthians descobriu seu rival nas oitavas de final da Copa Libertadores 2026: o Peñarol, do Uruguai. Os primeiros jogos serão disputados em 23 e 30 de julho.</p>
<p>O Peñarol se classificou como segundo do Grupo C, atrás do Fluminense, e é um time tradicional do futebol sul-americano, com duas Copas do Mundo de Clubes e cinco títulos da Libertadores.</p>
<p>O Corinthians, que liderou o Grupo A com 16 pontos em 6 jogos (5 vitórias e 1 empate), chega ao confronto como favorito, mas respeita a tradição do rival.</p>
<p>Ramón Díaz analisou o adversário: "O Peñarol é um time muito bem organizado, com jogadores experientes e uma torcida apaixonante. Vamos precisar jogar no nosso máximo nível para avançar."</p>
<p>O primeiro jogo será na Neo Química Arena, e o segundo no Estádio Campeón del Siglo, em Montevidéu.</p>`,
      excerpt: 'Corinthians mede forças com o Peñarol nas oitavas de final da Copa Libertadores 2026.',
      status: 'PUBLISHED' as const,
      type: 'NEWS' as const,
      isFeatured: false,
      isBreaking: false,
      isPinned: false,
      order: 15,
      coverImage: 'https://res.cloudinary.com/radio-coringao/image/upload/v1/articles/libertadores-penarol.jpg',
      coverImageAlt: 'Corinthians na Copa Libertadores 2026',
      coverImageCredit: 'Foto: Divulgação CONMEBOL',
      authorId: createdUsers['JORNALISTA'],
      categoryId: categoryIds['futebol'],
      metaTitle: 'Corinthians x Peñarol — Libertadores 2026 | Rádio Coringão',
      metaDescription: 'Corinthians enfrenta o Peñarol nas oitavas de final da Copa Libertadores 2026.',
      viewCount: 780,
      publishedAt: new Date('2026-07-10T10:00:00Z'),
    },
    // --- Artigo 16: NOTÍCIA Copa do Mundo ---
    {
      title: 'Copa do Mundo 2026: Corinthians terá três jogos na Neo Química Arena',
      subtitle: 'FIFA confirma que o estádio corintiano será sede de partidas da primeira fase da Copa',
      slug: 'copa-do-mundo-2026-neo-quimica-arena',
      content: `<p>A FIFA confirmou oficialmente que a Neo Química Arena, casa do Corinthians, será uma das sedes da Copa do Mundo FIFA 2026, que será disputada conjuntamente entre Estados Unidos, México e Canadá.</p>
<p>O estádio receberá seis jogos da primeira fase: três da primeira rodada, dois da segunda rodada e um da terceira rodada das grupos. Além disso, há a possibilidade de receber uma partida das oitavas de final, dependendo do desempenho da Seleção Brasileira.</p>
<p>O Corinthians se beneficiará diretamente da Copa do Mundo, pois o estádio receberá investimentos significativos em infraestrutura. As reformas, que já começaram, incluem a instalação de novos painéis de LED, melhoria nos camarotes e ampliação da capacidade.</p>
<p>O presidente Duílio Alves comemorou: "A Neo Química Arena é um dos estádios mais modernos do Brasil, e ser sede da Copa do Mundo é uma honra enorme para o Corinthians e para a torcida corintiana."</p>`,
      excerpt: 'FIFA confirma que a Neo Química Arena será sede de seis jogos da Copa do Mundo 2026.',
      status: 'PUBLISHED' as const,
      type: 'NEWS' as const,
      isFeatured: false,
      isBreaking: true,
      isPinned: false,
      order: 16,
      coverImage: 'https://res.cloudinary.com/radio-coringao/image/upload/v1/articles/copa-do-mundo-arena.jpg',
      coverImageAlt: 'Neo Química Arena como sede da Copa do Mundo 2026',
      coverImageCredit: 'Foto: Divulgação FIFA',
      authorId: createdUsers['JORNALISTA'],
      categoryId: categoryIds['futebol'],
      metaTitle: 'Copa do Mundo 2026: Neo Química Arena será sede | Rádio Coringão',
      metaDescription: 'FIFA confirma Neo Química Arena como sede de seis jogos da Copa do Mundo 2026.',
      viewCount: 1200,
      publishedAt: new Date('2026-07-05T14:00:00Z'),
    },
    // --- Artigo 17: NOTÍCIA basquete ---
    {
      title: 'Corinthians Basquete vence o Franca e se classifica para playoff do NBB',
      subtitle: 'Time de basquete do Timão garantiu vaga com antecedência e mira o título do NBB',
      slug: 'corinthians-basquete-vence-franca-nbb',
      content: `<p>O Corinthians Basquete venceu o Franca por 85 a 78, na partida válida pela 20ª rodada do NBB (Novo Basquete Brasil) 2026. Com a vitória, o time corintiano se classificou oficialmente para os playoffs do campeonato.</p>
<p>O destaque da noite foi o pivô Lucas Mariano, que marcou 22 pontos e capturou 11 rebounds. O armador Yago Matos somou 18 pontos e 7 assistências, enquanto o ala-pivô Dédé贡献ou 15 pontos e 8 rebounds.</p>
<p>O técnico Léo Figueiró comemorou a classificação: "Estamos trabalhando muito bem em treinamento, e os resultados estão aparecendo. O objetivo agora é chegar ao playoff em boa fase e disputar o título."</p>
<p>O Corinthians Basquete está em 4º lugar no NBB com 15 vitórias e 5 derrotas, e enfrentará o Bauru na primeira rodada dos playoffs.</p>`,
      excerpt: 'Corinthians Basquete vence o Franca e se classifica para playoff do NBB 2026.',
      status: 'PUBLISHED' as const,
      type: 'NEWS' as const,
      isFeatured: false,
      isBreaking: false,
      isPinned: false,
      order: 17,
      coverImage: 'https://res.cloudinary.com/radio-coringao/image/upload/v1/articles/corinthians-basquete.jpg',
      coverImageAlt: 'Corinthians Basquete comemora vitória sobre o Franca',
      coverImageCredit: 'Foto: Divulgação NBB',
      authorId: createdUsers['JORNALISTA'],
      categoryId: categoryIds['basquete'],
      metaTitle: 'Corinthians Basquete vence Franca e se classifica para playoff | Rádio Coringão',
      metaDescription: 'Time de basquete do Corinthians garante vaga nos playoffs do NBB 2026.',
      viewCount: 310,
      publishedAt: new Date('2026-07-09T20:00:00Z'),
    },
    // --- Artigo 18: NOTÍCIA MMA ---
    {
      title: 'Luta do século: Charles Oliveira enfrenta Islam Makhachev no UFC 312',
      subtitle: 'Ex-campeão do UFC se prepara para o maior duelo da categoria dos leves',
      slug: 'charles-oliveira-vs-islam-makhachev-ufc-312',
      content: `<p>O ex-campeão dos leves do UFC, Charles Oliveira, confirmou que enfrentará o atual campeão Islam Makhachev no UFC 312, previsto para 13 de setembro de 2026, em Las Vegas.</p>
<p>A luta será a revanche do duelo ocorrido no UFC 280, em outubro de 2022, quando Makhachev venceu Oliveira por finalização no segundo round. Desde então, Oliveira conquistou três vitórias consecutivas e se tornou o desafiante número 1 da categoria.</p>
<p>Oliveira, que é torcedor do Corinthians, declarou: "Essa é a luta da minha vida. Quero recuperar meu cinturão e dedicar a vitória ao Corinthians e à torcida corintiana. Vou entrar no Octógono com tudo."</p>
<p>O UFC 312 será transmitido ao vivo pelo pay-per-view, e a Rádio Coringão fará cobertura especial da luta.</p>`,
      excerpt: 'Charles Oliveira enfrenta Islam Makhachev na revanche pelo cinturão dos leves no UFC 312.',
      status: 'PUBLISHED' as const,
      type: 'NEWS' as const,
      isFeatured: false,
      isBreaking: false,
      isPinned: false,
      order: 18,
      coverImage: 'https://res.cloudinary.com/radio-coringao/image/upload/v1/articles/charles-ufc312.jpg',
      coverImageAlt: 'Charles Oliveira se prepara para UFC 312',
      coverImageCredit: 'Foto: Divulgação UFC',
      authorId: createdUsers['JORNALISTA'],
      categoryId: categoryIds['mma'],
      metaTitle: 'Charles Oliveira vs Islam Makhachev no UFC 312 | Rádio Coringão',
      metaDescription: 'Ex-campeão Charles Oliveira enfrenta Islam Makhachev na revanche pelo cinturão dos leves.',
      viewCount: 520,
      publishedAt: new Date('2026-07-04T16:00:00Z'),
    },
    // --- Artigo 19: NOTÍCIA automobilismo ---
    {
      title: 'Stock Car: Thiago Camilo vence a etapa de Interlagos e surpreende o pelotão',
      subtitle: 'Veterano piloto fez pole position e conquistou vitória emocionante na pista de São Paulo',
      slug: 'thiago-camilo-vence-stock-car-interlagos-2026',
      content: `<p>O veterano piloto Thiago Camilo, que é torcedor declarado do Corinthians, conquistou uma vitória emocionante na etapa de Interlagos da Stock Car 2026. O piloto fez a pole position e liderou de ponta a ponta, vencendo por 2,3 segundos sobre o segundo colocado, Cacá Bueno.</p>
<p>"Essa vitória é muito especial. Vencer em Interlagos, na minha terra, com a camisa do Corinthians... É um dia que vou lembrar para sempre", declarou Camilo na zona de采访.</p>
<p>Camilo, que compete pela RB Competições, está em 3º lugar no campeonato, com 180 pontos, 30 pontos atrás do líder Gabriel Casagrande.</p>
<p>A próxima etapa da Stock Car será em 24 de julho, no Autódromo de Curitiba.</p>`,
      excerpt: 'Thiago Camilo conquista vitória na Stock Car em Interlagos e surpreende o pelotão.',
      status: 'PUBLISHED' as const,
      type: 'NEWS' as const,
      isFeatured: false,
      isBreaking: false,
      isPinned: false,
      order: 19,
      coverImage: 'https://res.cloudinary.com/radio-coringao/image/upload/v1/articles/stock-car-interlagos.jpg',
      coverImageAlt: 'Thiago Camilo comemora vitória na Stock Car em Interlagos',
      coverImageCredit: 'Foto: Divulgação Stock Car',
      authorId: createdUsers['JORNALISTA'],
      categoryId: categoryIds['automobilismo'],
      metaTitle: 'Thiago Camilo vence Stock Car em Interlagos | Rádio Coringão',
      metaDescription: 'Veterano piloto conquista vitória na etapa de Interlagos da Stock Car 2026.',
      viewCount: 380,
      publishedAt: new Date('2026-07-03T20:00:00Z'),
    },
    // --- Artigo 20: NOTÍCIA tênis ---
    {
      title: 'Thiago Monteiro chega à semifinal do ATP 250 de Bastad e busca o primeiro título',
      subtitle: 'Tenista brasileiro venceu o cabeça de chave nas quartas e mira final inédita',
      slug: 'thiago-monteiro-atp-bastad-semifinal-2026',
      content: `<p>O tenista brasileiro Thiago Monteiro, que é torcedor do Corinthians, conquistou uma vitória histórica nas quartas de final do ATP 250 de Bastad, na Suécia, ao vencer o cabeza de chave Alexander Bublik por 6-4, 3-6, 7-5.</p>
<p>Monteiro, que está em 68º do ranking mundial, disputará a semifinal contra o francés Arthur Fils, 26º do mundo. Será o primeiro confronto direto entre os dois.</p>
<p>"Joguei muito bem hoje. Me senti confinto em quadra, e a torcida que veio me apoiar fez toda a diferença. Estou buscando meu primeiro título ATP, e acredito que posso conquistá-lo", disse Monteiro.</p>
<p>A semifinal será disputada neste sábado, às 15h (horário de Brasília), e será transmitida ao vivo pelo canal SporTV.</p>`,
      excerpt: 'Tenista brasileiro chega à semifinal do ATP 250 de Bastad e busca primeiro título da carreira.',
      status: 'PUBLISHED' as const,
      type: 'NEWS' as const,
      isFeatured: false,
      isBreaking: false,
      isPinned: false,
      order: 20,
      coverImage: 'https://res.cloudinary.com/radio-coringao/image/upload/v1/articles/thiago-monteiro-tenis.jpg',
      coverImageAlt: 'Thiago Monteiro em partida do ATP de Bastad',
      coverImageCredit: 'Foto: Divulgação ATP',
      authorId: createdUsers['JORNALISTA'],
      categoryId: categoryIds['tenis'],
      metaTitle: 'Thiago Monteiro na semifinal do ATP 250 de Bastad | Rádio Coringão',
      metaDescription: 'Tenista brasileiro chega à semifinal e busca primeiro título ATP da carreira.',
      viewCount: 290,
      publishedAt: new Date('2026-07-11T12:00:00Z'),
    },
    // --- Artigo 21: NOTÍCIA natação ---
    {
      title: 'César Cielo abre clínica de natação em São Paulo e convida torcedores do Corinthians',
      subtitle: 'Ex-campeão olímpico abre escola de natação para crianças e adultos na capital paulista',
      slug: 'cesar-cielo-clinica-natacao-sao-paulo',
      content: `<p>O ex-campeão olímpico de natação César Cielo, que é torcedor declarado do Corinthians, abriu uma clínica de natação em São Paulo. A escola, batizada de "Cielo Swim", oferece aulas para crianças e adultos, com foco em aprendizado, condicionamento físico e preparação competitiva.</p>
<p>"Essa é um sonho que eu tinha há muito tempo. Quero transmitir o amor pela natação para as crianças paulistanas. E claro, convido todos os torcedores do Corinthians para nadar comigo", disse Cielo.</p>
<p>A clínica está localizada na zona sul de São Paulo e conta com piscina olímpica de 50 metros, academia equipada e equipe de professores qualificados.</p>
<p>César Cielo conquistou a medalha de ouro nos 50m livres nas Olimpíadas de Pequim 2008 e é considerado um dos maiores nadadores da história do Brasil.</p>`,
      excerpt: 'Ex-campeão olímpico abre clínica de natação em São Paulo e convida torcedores do Corinthians.',
      status: 'PUBLISHED' as const,
      type: 'NEWS' as const,
      isFeatured: false,
      isBreaking: false,
      isPinned: false,
      order: 21,
      coverImage: 'https://res.cloudinary.com/radio-coringao/image/upload/v1/articles/cesar-cielo-natacao.jpg',
      coverImageAlt: 'César Cielo abre clínica de natação em São Paulo',
      coverImageCredit: 'Foto: Divulgação Pessoal',
      authorId: createdUsers['JORNALISTA'],
      categoryId: categoryIds['natacao'],
      metaTitle: 'César Cielo abre clínica de natação em São Paulo | Rádio Coringão',
      metaDescription: 'Ex-campeão olímpico abre escola de natação para crianças e adultos em São Paulo.',
      viewCount: 220,
      publishedAt: new Date('2026-07-02T14:00:00Z'),
    },
    // --- Artigo 22: ANÁLISE Corinthians no exterior ---
    {
      title: 'Como está o Corinthians do exterior: ranking de torcidas internacionais',
      subtitle: 'Pesquisa revela que o Timão tem mais de 15 milhões de torcedores fora do Brasil',
      slug: 'corinthians-torcedores-internacionais-ranking',
      content: `<p><strong>Análise — Rádio Coringão</strong></p>
<p>Uma pesquisa recente da empresa DataSport revelou que o Corinthians possui mais de 15 milhões de torcedores fora do Brasil, o que o coloca como o terceiro clube brasileiro com maior torcida internacional, atrás apenas do Flamengo e do Palmeiras.</p>
<p>Os países com maior número de torcedores corintianos são: Portugal (2,3 milhões), Estados Unidos (1,8 milhão), Japão (1,2 milhão), Angola (800 mil) e Alemanha (650 mil).</p>
<p>O crescimento da torcida internacional do Corinthians está ligado à contratação de Memphis Depay, que atraiu torcedores holandeses e europeus para o clube. Além disso, a participação do Timão na Copa do Mundo de Clubes 2025 ampliou a visibilidade do time no exterior.</p>
<p>A Rádio Coringão analisa: a expansão internacional do Corinthians é um fator estratégico para o clube. Mais torcida significa mais receita com comercialização, mais visibilidade para patrocinadores e mais poder de negociação no mercado de transferências.</p>`,
      excerpt: 'Pesquisa revela que o Corinthians tem mais de 15 milhões de torcedores fora do Brasil.',
      status: 'PUBLISHED' as const,
      type: 'ANALYSIS' as const,
      isFeatured: false,
      isBreaking: false,
      isPinned: false,
      order: 22,
      coverImage: 'https://res.cloudinary.com/radio-coringao/image/upload/v1/articles/torcedores-internacionais.jpg',
      coverImageAlt: 'Torcedores corintianos no exterior',
      coverImageCredit: 'Foto: Divulgação Corinthians',
      authorId: createdUsers['COLUNISTA'],
      categoryId: categoryIds['futebol'],
      metaTitle: 'Corinthians: ranking de torcidas internacionais | Rádio Coringão',
      metaDescription: 'Pesquisa revela que o Corinthians tem mais de 15 milhões de torcedores fora do Brasil.',
      viewCount: 470,
      publishedAt: new Date('2026-07-01T15:00:00Z'),
    },
  ];

  const createdArticleIds: string[] = [];

  for (let i = 0; i < articlesData.length; i++) {
    const article = articlesData[i];
    const result = await prisma.article.upsert({
      where: { slug: article.slug },
      update: { title: article.title, excerpt: article.excerpt, viewCount: article.viewCount },
      create: article,
    });
    createdArticleIds.push(result.id);
    console.log(`   ✅ [${i + 1}/${articlesData.length}] ${article.title.substring(0, 60)}...`);
  }

  // ═══════════════════════════════════════════════════════════════
  // 6. ARTIGO-TAGS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n🏷️  6. Criando relações artigo-tag...');

  const articleTagMap: Record<number, string[]> = {
    0: ['corinthians', 'timao', 'paulistao', 'jogos-do-timao', 'neo-quimica-arena'],
    1: ['corinthians', 'analise-tatica', 'paulistao'],
    2: ['corinthians', 'entrevista', 'transferencias'],
    3: ['corinthians', 'timao', 'transferencias'],
    4: ['corinthians', 'opiniao', 'paulistao'],
    5: ['corinthians', 'brasileirao', 'jogos-do-timao', 'neo-quimica-arena'],
    6: ['corinthians', 'transferencias', 'mercado-da-bola'],
    7: ['corinthians', 'paulistao'],
    8: ['corinthians', 'analise-tatica'],
    9: ['corinthians', 'copa-do-brasil', 'jogos-do-timao'],
    10: ['corinthians', 'base', 'selecao-brasileira'],
    11: ['corinthians', 'neo-quimica-arena', 'copa-do-mundo-2026'],
    12: ['corinthians', 'brasileirao'],
    13: ['corinthians', 'brasileirao-feminino', 'paulistao'],
    14: ['corinthians', 'libertadores'],
    15: ['corinthians', 'neo-quimica-arena', 'copa-do-mundo-2026'],
    16: ['corinthians', 'base'],
    17: ['corinthians', 'copa-do-mundo-2026'],
    18: ['corinthians', 'torcida'],
    19: ['corinthians', 'torcida'],
  };

  let tagCount = 0;
  for (const [articleIdx, tagSlugs] of Object.entries(articleTagMap)) {
    const articleId = createdArticleIds[Number(articleIdx)];
    for (const tagSlug of tagSlugs) {
      if (!tagIds[tagSlug]) continue;
      await prisma.articleTag.upsert({
        where: { articleId_tagId: { articleId, tagId: tagIds[tagSlug] } },
        update: {},
        create: { articleId, tagId: tagIds[tagSlug] },
      });
      tagCount++;
    }
  }
  console.log(`   ✅ ${tagCount} relações artigo-tag criadas`);

  // ═══════════════════════════════════════════════════════════════
  // 7. MENU ITEMS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 7. Criando itens de menu...');

  const menuItems = [
    { label: 'Home', url: '/', order: 1, parentId: null, categoryId: null },
    { label: 'Notícias', url: '/noticias', order: 2, parentId: null, categoryId: categoryIds['futebol'] },
    { label: 'Esportes', url: '/esportes', order: 3, parentId: null, categoryId: null },
    { label: 'Classificações', url: '/classificacoes', order: 4, parentId: null, categoryId: null },
    { label: 'Jogos', url: '/jogos', order: 5, parentId: null, categoryId: null },
    { label: 'Eventos', url: '/eventos', order: 6, parentId: null, categoryId: null },
    { label: 'Colunas', url: '/colunas', order: 7, parentId: null, categoryId: null },
    { label: 'Patrocinadores', url: '/patrocinadores', order: 8, parentId: null, categoryId: null },
    { label: 'Contato', url: '/contato', order: 9, parentId: null, categoryId: null },
    { label: 'Quem Somos', url: '/quem-somos', order: 10, parentId: null, categoryId: null },
    { label: 'Anuncie', url: '/anuncie', order: 11, parentId: null, categoryId: null },
  ];

  let menuCount = 0;
  for (const item of menuItems) {
    const existing = await prisma.menuItem.findFirst({
      where: { label: item.label, parentId: item.parentId },
    });
    if (!existing) {
      await prisma.menuItem.create({ data: item });
      menuCount++;
    }
  }
  console.log(`   ✅ ${menuCount} itens de menu criados`);

  // ═══════════════════════════════════════════════════════════════
  // 8. BANNERS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n🖼️  8. Criando banners...');

  const banners = [
    {
      title: 'Corinthians x Palmeiras — Derby ao Vivo',
      subtitle: 'Acompanhe todos os lances na Rádio Coringão',
      imageUrl: 'https://res.cloudinary.com/radio-coringao/image/upload/v1/banners/derby-banner.jpg',
      linkUrl: '/ao-vivo/corinthians-palmeiras',
      position: 'home-top',
      isActive: true,
      order: 1,
      startsAt: new Date('2026-07-10T00:00:00Z'),
      endsAt: new Date('2026-07-11T23:59:59Z'),
    },
    {
      title: 'Assine a Newsletter da Rádio Coringão',
      subtitle: 'Receba as principais notícias do Timão no seu e-mail',
      imageUrl: 'https://res.cloudinary.com/radio-coringao/image/upload/v1/banners/newsletter-banner.jpg',
      linkUrl: '/newsletter',
      position: 'home-mid',
      isActive: true,
      order: 2,
      startsAt: new Date('2026-01-01T00:00:00Z'),
      endsAt: new Date('2026-12-31T23:59:59Z'),
    },
    {
      title: 'Copa do Mundo 2026 — Neo Química Arena',
      subtitle: 'O Corinthians é sede da Copa do Mundo FIFA 2026',
      imageUrl: 'https://res.cloudinary.com/radio-coringao/image/upload/v1/banners/copa-mundo-banner.jpg',
      linkUrl: '/copa-do-mundo-2026',
      position: 'sidebar',
      isActive: true,
      order: 3,
      startsAt: new Date('2026-06-01T00:00:00Z'),
      endsAt: new Date('2026-07-19T23:59:59Z'),
    },
  ];

  let bannerCount = 0;
  for (const banner of banners) {
    const existing = await prisma.banner.findFirst({ where: { title: banner.title } });
    if (!existing) {
      await prisma.banner.create({ data: banner });
      bannerCount++;
    }
  }
  console.log(`   ✅ ${bannerCount} banners criados`);

  // ═══════════════════════════════════════════════════════════════
  // 9. FOOTER LINKS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n🔗 9. Criando links do footer...');

  const footerLinks = [
    { label: 'Termos de Uso', href: '/termos-de-uso', description: 'Leia nossos termos e condições de uso do site.', type: 'link', order: 1, isActive: true },
    { label: 'Política de Privacidade', href: '/politica-de-privacidade', description: 'Saiba como tratamos seus dados pessoais conforme a LGPD.', type: 'link', order: 2, isActive: true },
    { label: 'Quem Somos', href: '/quem-somos', description: 'Conheça a equipe por trás da Rádio Coringão.', type: 'link', order: 3, isActive: true },
    { label: 'Anuncie Conosco', href: '/anuncie', description: 'Divulgue sua marca no maior portal de notícias do Corinthians.', type: 'link', order: 4, isActive: true },
    { label: 'Facebook', href: 'https://www.facebook.com/radiocoringao', description: 'Siga-nos no Facebook', type: 'social', order: 5, isActive: true },
    { label: 'Instagram', href: 'https://www.instagram.com/radiocoringao', description: 'Siga-nos no Instagram', type: 'social', order: 6, isActive: true },
  ];

  let footerCount = 0;
  for (const link of footerLinks) {
    const existing = await prisma.footerLink.findFirst({ where: { label: link.label } });
    if (!existing) {
      await prisma.footerLink.create({ data: link });
      footerCount++;
    }
  }
  console.log(`   ✅ ${footerCount} links do footer criados`);

  // ═══════════════════════════════════════════════════════════════
  // 10. PATROCINADORES
  // ═══════════════════════════════════════════════════════════════
  console.log('\n💼 10. Criando patrocinadores...');

  const sponsors = [
    {
      name: 'Nike',
      logoUrl: 'https://res.cloudinary.com/radio-coringao/image/upload/v1/sponsors/nike-logo.png',
      websiteUrl: 'https://www.nike.com',
      description: 'Fornecedor oficial de material esportivo do Corinthians. A Nike veste o Timão desde 2019 com contratos que incluem camisas de jogo, treino e lifestyle.',
      isActive: true,
      order: 1,
    },
    {
      name: 'MRV',
      logoUrl: 'https://res.cloudinary.com/radio-coringao/image/upload/v1/sponsors/mrv-logo.png',
      websiteUrl: 'https://www.mrv.com.br',
      description: 'Construtora patrocinadora master do Corinthians. A MRV é uma das maiores empresas de construção civil do Brasil, com presença em todo o território nacional.',
      isActive: true,
      order: 2,
    },
    {
      name: 'Petrobras',
      logoUrl: 'https://res.cloudinary.com/radio-coringao/image/upload/v1/sponsors/petrobras-logo.png',
      websiteUrl: 'https://www.petrobras.com.br',
      description: 'Empresa estatal brasileira e patrocinadora do Corinthians. A Petrobras apoiou o clube em diversos projetos sociais e esportivos.',
      isActive: true,
      order: 3,
    },
    {
      name: 'Brahma',
      logoUrl: 'https://res.cloudinary.com/radio-coringao/image/upload/v1/sponsors/brahma-logo.png',
      websiteUrl: 'https://www.brahma.com.br',
      description: 'Cervejaria oficial do Corinthians. A Brahma é uma das marcas mais tradicionais do futebol brasileiro e acompanha o Timão em todas as conquistas.',
      isActive: true,
      order: 4,
    },
  ];

  let sponsorCount = 0;
  for (const sponsor of sponsors) {
    const existing = await prisma.sponsor.findFirst({ where: { name: sponsor.name } });
    if (!existing) {
      await prisma.sponsor.create({ data: sponsor });
      sponsorCount++;
    }
  }
  console.log(`   ✅ ${sponsorCount} patrocinadores criados`);

  // ═══════════════════════════════════════════════════════════════
  // 11. EVENTOS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📅 11. Criando eventos...');

  // Evento 1: Torcida Corinthiana — Encontro Anual
  const event1 = await prisma.event.upsert({
    where: { slug: 'encontro-torcida-corinthiana-2026' },
    update: {},
    create: {
      title: 'Encontro da Torcida Corinthiana 2026',
      slug: 'encontro-torcida-corinthiana-2026',
      description: 'O maior encontro de torcedores corintianos do Brasil. Acontecerá na Neo Química Arena com shows, palestras de ex-jogadores, exposição de troféus e muita celebração.',
      location: 'Neo Química Arena — São Paulo, SP',
      startsAt: new Date('2026-08-15T10:00:00Z'),
      endsAt: new Date('2026-08-15T22:00:00Z'),
      coverImage: 'https://res.cloudinary.com/radio-coringao/image/upload/v1/events/encontro-torcida-2026.jpg',
      isActive: true,
    },
  });

  const event1Cat1 = await prisma.eventCategory.create({
    data: { name: 'Programação', order: 1, eventId: event1.id },
  });

  const event1Cat2 = await prisma.eventCategory.create({
    data: { name: 'Atrações', order: 2, eventId: event1.id },
  });

  await prisma.eventItem.createMany({
    data: [
      { title: 'Abertura Oficial', description: 'Cerimônia de abertura com hino do Corinthians e discurso do presidente Duílio Alves.', date: 'Sáb, 15/08', time: '10:00', venue: 'Arena — Setor Leste', status: 'agendado', order: 1, eventCategoryId: event1Cat1.id },
      { title: 'Painel: "A história do Corinthians nos títulos"', description: 'Ex-jogadores contam as histórias por trás dos maiores títulos do clube. Participam: Cássio, Roberto Carlos e Sócrates (via homenagem).', date: 'Sáb, 15/08', time: '11:30', venue: 'Arena — Salão de Eventos', status: 'agendado', order: 2, eventCategoryId: event1Cat1.id },
      { title: 'Show de Sertanejo', description: 'Apresentação dupla sertaneja com música corintiana. Abertura para público geral.', date: 'Sáb, 15/08', time: '14:00', venue: 'Arena — Campo Central', status: 'agendado', order: 3, eventCategoryId: event1Cat1.id },
      { title: 'Partida Amistosa: Veteranos do Corinthians x Torcida Selecionada', description: 'Jogo amistoso com ex-jogadores e torcedores sorteados. IngressosLimitados.', date: 'Sáb, 15/08', time: '16:00', venue: 'Neo Química Arena — Gramado', status: 'agendado', order: 4, eventCategoryId: event1Cat1.id },
      { title: 'Cássio — Bate-papo ao vivo', description: 'O maior goleiro da história do Corinthians em bate-papo exclusivo com a torcida.', date: 'Sáb, 15/08', time: '11:30', venue: 'Arena — Salão de Eventos', status: 'agendado', order: 1, eventCategoryId: event1Cat2.id },
      { title: 'Roberto Carlos — Exposição de troféus', description: 'Exposição com todos os troféus conquistados por Roberto Carlos no Corinthians e na Seleção.', date: 'Sáb, 15/08', time: '10:00–18:00', venue: 'Arena — Hall Principal', status: 'agendado', order: 2, eventCategoryId: event1Cat2.id },
    ],
  });

  console.log('   ✅ Evento: Encontro da Torcida Corinthiana 2026');

  // Evento 2: Congresso de Jornalismo Esportivo
  const event2 = await prisma.event.upsert({
    where: { slug: 'congresso-jornalismo-esportivo-2026' },
    update: {},
    create: {
      title: 'Congresso Brasileiro de Jornalismo Esportivo 2026',
      slug: 'congresso-jornalismo-esportivo-2026',
      description: 'O maior evento de jornalismo esportivo do Brasil. Palestras, workshops e networking com profissionais de todo o país. Tema central: "O futuro da cobertura esportiva na era digital".',
      location: 'Centro de Convenções São Paulo — São Paulo, SP',
      startsAt: new Date('2026-09-10T09:00:00Z'),
      endsAt: new Date('2026-09-12T18:00:00Z'),
      coverImage: 'https://res.cloudinary.com/radio-coringao/image/upload/v1/events/congresso-jornalismo-2026.jpg',
      isActive: true,
    },
  });

  const event2Cat1 = await prisma.eventCategory.create({
    data: { name: 'Workshops', order: 1, eventId: event2.id },
  });

  const event2Cat2 = await prisma.eventCategory.create({
    data: { name: 'Conferências', order: 2, eventId: event2.id },
  });

  await prisma.eventItem.createMany({
    data: [
      { title: 'Workshop: Cobertura ao vivo no digital', description: 'Aprenda técnicas de transmissão ao vivo para plataformas digitais. Vagas limitadas.', date: 'Qui, 10/09', time: '09:00–12:00', venue: 'Sala 1', status: 'agendado', order: 1, eventCategoryId: event2Cat1.id },
      { title: 'Worksheet: storytelling esportivo', description: 'Como contar histórias envolventes sobre atletas e clubes. Prática com cases reais.', date: 'Qui, 10/09', time: '14:00–17:00', venue: 'Sala 2', status: 'agendado', order: 2, eventCategoryId: event2Cat1.id },
      { title: 'Workshop: Análise de dados no futebol', description: 'Uso de estatísticas avançadas para criar análises táticas para o público.', date: 'Sex, 11/09', time: '09:00–12:00', venue: 'Sala 1', status: 'agendado', order: 3, eventCategoryId: event2Cat1.id },
      { title: 'Conferência Magna: "O jornalista esportivo na era da IA"', description: 'Como a inteligência artificial está transformando a cobertura esportiva. Painelista: Carlos Eduardo Silva (Rádio Coringão).', date: 'Sex, 11/09', time: '14:00–16:00', venue: 'Auditório Principal', status: 'agendado', order: 1, eventCategoryId: event2Cat2.id },
      { title: 'Painel: "Futebol feminino: a nova fronteira do jornalismo"', description: 'Discussão sobre a cobertura do futebol feminino e como ampliar a visibilidade.', date: 'Sáb, 12/09', time: '09:00–11:00', venue: 'Auditório Principal', status: 'agendado', order: 2, eventCategoryId: event2Cat2.id },
    ],
  });

  console.log('   ✅ Evento: Congresso Brasileiro de Jornalismo Esportivo 2026');

  // ═══════════════════════════════════════════════════════════════
  // 12. COMENTÁRIOS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n💬 12. Criando comentários...');

  const comments = [
    { name: 'Roberto Almeida', content: 'Melhor jogo do Corinthians na temporada! Essa goleada no São Paulo vai entrar para a história. Yemem está voando esse ano!', articleId: createdArticleIds[0] },
    { name: 'Patrícia Lima', content: 'Memphis Depay é craque demais! Que jogador, meu Deus. O Corinthians contratacada sensacional. Vamos ganhar tudo!', articleId: createdArticleIds[2] },
    { name: 'Fernando Santos', content: 'Artigo muito bom, parabéns à equipe! A análise tática está impecável. Corinthians joga muito bola esse ano.', articleId: createdArticleIds[1] },
    { name: 'Camila Rodrigues', content: 'Achei o derby emocionante! Quase tive um infarto aqui em casa. Parabéns ao Time, agora é confiança para o resto da temporada.', articleId: createdArticleIds[5] },
    { name: 'Lucas Pereira', content: 'Renovação merecida! Yuri Alberto é o melhor atacante do Brasil. Com ele, o Timão vai conquistar o hexa do Paulistão.', articleId: createdArticleIds[3] },
  ];

  let commentCount = 0;
  for (const comment of comments) {
    const existing = await prisma.comment.findFirst({ where: { name: comment.name, articleId: comment.articleId } });
    if (!existing) {
      await prisma.comment.create({ data: comment });
      commentCount++;
    }
  }
  console.log(`   ✅ ${commentCount} comentários criados`);

  // ═══════════════════════════════════════════════════════════════
  // 13. NEWSLETTER SUBSCRIBERS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📧 13. Criando inscritos da newsletter...');

  const subscribers = [
    { name: 'Anderson Souza', email: 'anderson.souza@email.com.br' },
    { name: 'Juliana Ferreira', email: 'juliana.ferreira@email.com.br' },
    { name: 'Paulo Henrique', email: 'paulo.henrique@email.com.br' },
    { name: 'Mariana Costa', email: 'mariana.costa@email.com.br' },
    { name: 'Ricardo Oliveira', email: 'ricardo.oliveira@email.com.br' },
    { name: 'Fernanda Lima', email: 'fernanda.lima@email.com.br' },
    { name: 'Bruno Nascimento', email: 'bruno.nascimento@email.com.br' },
    { name: 'Ana Paula Santos', email: 'ana.paula@email.com.br' },
    { name: 'Carlos Eduardo', email: 'carlos.eduardo@email.com.br' },
    { name: 'Mariana Alves', email: 'mariana.alves@email.com.br' },
  ];

  let subscriberCount = 0;
  for (const sub of subscribers) {
    const existing = await prisma.newsletterSubscriber.findUnique({ where: { email: sub.email } });
    if (!existing) {
      await prisma.newsletterSubscriber.create({ data: sub });
      subscriberCount++;
    }
  }
  console.log(`   ✅ ${subscriberCount} inscritos da newsletter criados`);

  // ═══════════════════════════════════════════════════════════════
  // RESUMO FINAL
  // ═══════════════════════════════════════════════════════════════
  console.log('\n' + '━'.repeat(55));
  console.log('🎉 SEED COMPLETO — Rádio Coringão\n');
  console.log('📊 Resumo:');
  console.log(`   ✅ SiteSettings atualizado`);
  console.log(`   ✅ 5 usuários criados`);
  console.log(`   ✅ 6 categorias criadas`);
  console.log(`   ✅ 18 tags criadas`);
  console.log(`   ✅ 22 artigos publicados`);
  console.log(`   ✅ ${tagCount} relações artigo-tag`);
  console.log(`   ✅ ${menuCount} itens de menu`);
  console.log(`   ✅ ${bannerCount} banners`);
  console.log(`   ✅ ${footerCount} links do footer`);
  console.log(`   ✅ ${sponsorCount} patrocinadores`);
  console.log(`   ✅ 2 eventos com categorias e itens`);
  console.log(`   ✅ ${commentCount} comentários`);
  console.log(`   ✅ ${subscriberCount} inscritos da newsletter`);
  console.log('━'.repeat(55));
  console.log('\n🔑 Credenciais de todos os usuários:');
  console.log('   Senha padrão: Corinthians@2026\n');
  console.log('   carlos@radiocoringao.com.br  (SUPER_ADMIN)');
  console.log('   fernanda@radiocoringao.com.br (EDITOR_CHEFE)');
  console.log('   marcos@radiocoringao.com.br   (EDITOR_CHEFE)');
  console.log('   ana@radiocoringao.com.br      (JORNALISTA)');
  console.log('   ricardo@radiocoringao.com.br  (COLUNISTA)');
  console.log('━'.repeat(55));
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
