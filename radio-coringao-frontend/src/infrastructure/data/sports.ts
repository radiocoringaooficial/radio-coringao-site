import { NewsArticle, NextMatch, MatchResult, TableEntry } from "@/domain/entities";

const placeholderImg =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCh5rWYWHh2ILCnOZuge7OeXQOKkvhBoXWWT-b9AYqyw9pZt__tGOOpylCVqYgyPvW7AXbw30lvcYaxovQExTo7M1W0l6OxQrWeL1KhgcAXQIUGpp_ZbPBS0XIJr883Dk0-Np7cQXTlFIjsIatMo1VTSGPytM31Hgw5agrY1Id_B_Xo1VhdehqJkGf0kYND39ZapobUQdS-W_QnZgeI6k8nkJQAOuZFjB7rnZ-lWJpwP5UuImNT_1WecNELu_hRA0xyRAlXa-EqY-I";

export interface SportTable {
  name: string;
  standings: TableEntry[];
}

export interface SportData {
  name: string;
  slug: string;
  icon: string;
  heroTitle: string;
  heroDescription: string;
  nextMatch: NextMatch;
  recentResults: MatchResult[];
  standings: TableEntry[];
  tables?: SportTable[];
  latestNews: NewsArticle[];
  weekHighlights: NewsArticle[];
  transfers: { player: string; image: string; type: "entrada" | "saída"; from?: string; to?: string }[];
}

const futebolStandings: TableEntry[] = [
  { pos: 1, time: "Corinthians", pts: 42, j: 20, v: 13, e: 3, d: 4, gp: 35, gc: 16 },
  { pos: 2, time: "Palmeiras", pts: 40, j: 20, v: 12, e: 4, d: 4, gp: 32, gc: 14 },
  { pos: 3, time: "Flamengo", pts: 38, j: 20, v: 11, e: 5, d: 4, gp: 30, gc: 15 },
  { pos: 4, time: "Botafogo", pts: 37, j: 20, v: 11, e: 4, d: 5, gp: 28, gc: 17 },
  { pos: 5, time: "São Paulo", pts: 35, j: 20, v: 10, e: 5, d: 5, gp: 26, gc: 18 },
  { pos: 6, time: "Grêmio", pts: 33, j: 20, v: 9, e: 6, d: 5, gp: 24, gc: 17 },
  { pos: 7, time: "Internacional", pts: 32, j: 20, v: 9, e: 5, d: 6, gp: 22, gc: 18 },
  { pos: 8, time: "Bahia", pts: 31, j: 20, v: 8, e: 7, d: 5, gp: 21, gc: 16 },
  { pos: 9, time: "Cruzeiro", pts: 30, j: 20, v: 8, e: 6, d: 6, gp: 23, gc: 20 },
  { pos: 10, time: "Santos", pts: 29, j: 20, v: 8, e: 5, d: 7, gp: 20, gc: 19 },
  { pos: 11, time: "Fluminense", pts: 28, j: 20, v: 7, e: 7, d: 6, gp: 19, gc: 18 },
  { pos: 12, time: "Athletico-PR", pts: 27, j: 20, v: 7, e: 6, d: 7, gp: 18, gc: 19 },
  { pos: 13, time: "Vasco", pts: 26, j: 20, v: 7, e: 5, d: 8, gp: 17, gc: 20 },
  { pos: 14, time: "Fortaleza", pts: 25, j: 20, v: 6, e: 7, d: 7, gp: 16, gc: 18 },
  { pos: 15, time: "Juventude", pts: 24, j: 20, v: 6, e: 6, d: 8, gp: 15, gc: 19 },
  { pos: 16, time: "Ceará", pts: 23, j: 20, v: 6, e: 5, d: 9, gp: 14, gc: 20 },
  { pos: 17, time: "Vitória", pts: 22, j: 20, v: 5, e: 7, d: 8, gp: 13, gc: 19 },
  { pos: 18, time: "Criciúma", pts: 20, j: 20, v: 5, e: 5, d: 10, gp: 12, gc: 22 },
  { pos: 19, time: "Atlético-GO", pts: 18, j: 20, v: 4, e: 6, d: 10, gp: 11, gc: 23 },
  { pos: 20, time: "Sport", pts: 16, j: 20, v: 3, e: 7, d: 10, gp: 10, gc: 24 },
];

export const sportsData: Record<string, SportData> = {
  futebol: {
    name: "Futebol",
    slug: "futebol",
    icon: "⚽",
    heroTitle: "Futebol Masculino Profissional",
    heroDescription: "Acompanhe tudo sobre o Timão no Brasileirão, Copa do Brasil e Libertadores.",
    nextMatch: {
      homeTeam: "Corinthians",
      awayTeam: "Palmeiras",
      date: "Dom, 22/06",
      time: "16:00",
      venue: "Neo Química Arena",
      competition: "Brasileirão Série A",
      hasTickets: true,
    },
    recentResults: [
      { home: "Corinthians", away: "Santos", score: "2 x 1" },
      { home: "Flamengo", away: "Corinthians", score: "0 x 2" },
      { home: "Corinthians", away: "Grêmio", score: "3 x 0" },
      { home: "São Paulo", away: "Corinthians", score: "1 x 1" },
      { home: "Corinthians", away: "Botafogo", score: "2 x 0" },
    ],
    standings: futebolStandings,
    latestNews: [
      { id: "1", title: "Garro renova e é o novo camisa 10", excerpt: "Meia argentino se compromete por mais 3 anos.", category: "Mercado", categorySlug: "mercado", author: "João Fiel", authorAvatar: "", imageUrl: placeholderImg, imageAlt: "Garro", publishedAt: "Há 1 dia", slug: "garro-renova-10", isBreaking: false, isLive: false, viewCount: 11000 },
      { id: "2", title: "Yuri Alberto lidera artilharia do Brasileirão", excerpt: "Atacante marcou 8 gols em 5 jogos.", category: "Destaques", categorySlug: "destaques", author: "Pedro Silva", authorAvatar: "", imageUrl: placeholderImg, imageAlt: "Yuri Alberto", publishedAt: "Há 2 dias", slug: "yuri-artilharia", isBreaking: false, isLive: false, viewCount: 9500 },
      { id: "3", title: "Ramón Díaz elogia compromisso do elenco", excerpt: "Técnico destaca motivação para o clássico.", category: "Futebol", categorySlug: "futebol", author: "Maria Clara", authorAvatar: "", imageUrl: placeholderImg, imageAlt: "Ramón Díaz", publishedAt: "Há 3 dias", slug: "ramon-diaz-elogia", isBreaking: false, isLive: false, viewCount: 7200 },
      { id: "4", title: "Fiel prepara mosaico histórico", excerpt: "Torcidas se unem para criar bandeirão.", category: "Torcida", categorySlug: "torcida", author: "Ana Fiel", authorAvatar: "", imageUrl: placeholderImg, imageAlt: "Torcida", publishedAt: "Há 4 dias", slug: "fiel-mosaico", isBreaking: false, isLive: false, viewCount: 6500 },
      { id: "5", title: "Ingressos do clássico esgotam em 2 horas", excerpt: "Fiel lota a Neo Química Arena.", category: "Jogos", categorySlug: "jogos", author: "João Fiel", authorAvatar: "", imageUrl: placeholderImg, imageAlt: "Arena", publishedAt: "Há 5 dias", slug: "ingressos-esgotados", isBreaking: false, isLive: false, viewCount: 5800 },
      { id: "6", title: "Base goleia e avança na Copinha", excerpt: "Timãozinho vence por 4x0.", category: "Base", categorySlug: "base", author: "Maria Clara", authorAvatar: "", imageUrl: placeholderImg, imageAlt: "Base", publishedAt: "Há 6 dias", slug: "base-copinha", isBreaking: false, isLive: false, viewCount: 4200 },
    ],
    weekHighlights: [
      { id: "w1", title: "Corinthians é campeão do Torneio Rio-São Paulo", excerpt: "Timão conquista título inédito.", category: "Títulos", categorySlug: "titulos", author: "João Fiel", authorAvatar: "", imageUrl: placeholderImg, imageAlt: "Campeão", publishedAt: "Há 1 semana", slug: "campeao-rio-sao-paulo", isBreaking: false, isLive: false, viewCount: 15000 },
      { id: "w2", title: "Yuri Alberto é eleito craque do mês", excerpt: "Atacante brilhou em 5 jogos.", category: "Destaques", categorySlug: "destaques", author: "Pedro Silva", authorAvatar: "", imageUrl: placeholderImg, imageAlt: "Craque", publishedAt: "Há 1 semana", slug: "yuri-craque-mes", isBreaking: false, isLive: false, viewCount: 12000 },
      { id: "w3", title: "Feminino vence clássico e lidera Libertadores", excerpt: "Timão Feminino segue invicto.", category: "Feminino", categorySlug: "feminino", author: "Maria Clara", authorAvatar: "", imageUrl: placeholderImg, imageAlt: "Feminino", publishedAt: "Há 1 semana", slug: "feminino-libertadores", isBreaking: false, isLive: false, viewCount: 9800 },
      { id: "w4", title: "Novo patrocinador injeta R$ 50 milhões", excerpt: "Acordo histórico para o clube.", category: "Política", categorySlug: "politica", author: "Ana Fiel", authorAvatar: "", imageUrl: placeholderImg, imageAlt: "Patrocinador", publishedAt: "Há 1 semana", slug: "novo-patrocinador", isBreaking: false, isLive: false, viewCount: 8500 },
    ],
    transfers: [
      { player: "Garro", image: placeholderImg, type: "entrada", from: "Argentinos Juniors" },
      { player: "Pedro Raul", image: placeholderImg, type: "entrada", from: "Vasco" },
      { player: "Yuri Alberto", image: placeholderImg, type: "saída", to: "Zenit" },
      { player: "Fabián Bustos", image: placeholderImg, type: "saída", to: "Boca Juniors" },
    ],
  },
  basquete: {
    name: "Basquete",
    slug: "basquete",
    icon: "🏀",
    heroTitle: "Basquete Masculino Profissional",
    heroDescription: "Corinthians no NBB e competições de basquete.",
    nextMatch: {
      homeTeam: "Corinthians",
      awayTeam: "Flamengo",
      date: "Ter, 24/06",
      time: "20:00",
      venue: "Ginásio Wlamir Marques",
      competition: "NBB",
      hasTickets: true,
    },
    recentResults: [
      { home: "Corinthians", away: "Franca", score: "85 x 78" },
      { home: "São Paulo", away: "Corinthians", score: "72 x 80" },
      { home: "Corinthians", away: "Minas", score: "90 x 82" },
    ],
    standings: [
      { pos: 1, time: "Corinthians", pts: 28, j: 15, v: 14, e: 0, d: 1, gp: 1250, gc: 1100 },
      { pos: 2, time: "Flamengo", pts: 26, j: 15, v: 13, e: 0, d: 2, gp: 1200, gc: 1080 },
      { pos: 3, time: "Franca", pts: 24, j: 15, v: 12, e: 0, d: 3, gp: 1180, gc: 1120 },
      { pos: 4, time: "São Paulo", pts: 22, j: 15, v: 11, e: 0, d: 4, gp: 1150, gc: 1100 },
      { pos: 5, time: "Minas", pts: 20, j: 15, v: 10, e: 0, d: 5, gp: 1100, gc: 1050 },
      { pos: 6, time: "Bento", pts: 18, j: 15, v: 9, e: 0, d: 6, gp: 1080, gc: 1060 },
      { pos: 7, time: "Pato", pts: 16, j: 15, v: 8, e: 0, d: 7, gp: 1050, gc: 1080 },
      { pos: 8, time: "Mogi", pts: 14, j: 15, v: 7, e: 0, d: 8, gp: 1020, gc: 1100 },
    ],
    latestNews: [
      { id: "1", title: "Corinthians vence Flamengo no NBB", excerpt: "Timão supera rival em jogo eletrizante.", category: "Basquete", categorySlug: "basquete", author: "João Fiel", authorAvatar: "", imageUrl: placeholderImg, imageAlt: "Basquete", publishedAt: "Há 1 dia", slug: "corinthians-vence-flamengo", isBreaking: false, isLive: false, viewCount: 8000 },
      { id: "2", title: "Base do basquete brilha em torneio", excerpt: "Categorias de base mostram futebol de primeira.", category: "Base", categorySlug: "base", author: "Maria Clara", authorAvatar: "", imageUrl: placeholderImg, imageAlt: "Base basquete", publishedAt: "Há 3 dias", slug: "base-basquete-brilha", isBreaking: false, isLive: false, viewCount: 5000 },
      { id: "3", title: "Corinthians contrata Ala para o NBB", excerpt: "Time reforça elenco para playoffs.", category: "Mercado", categorySlug: "mercado", author: "Pedro Silva", authorAvatar: "", imageUrl: placeholderImg, imageAlt: "Contratação", publishedAt: "Há 5 dias", slug: "corinthians-contrata-ala", isBreaking: false, isLive: false, viewCount: 4200 },
      { id: "4", title: "Ginásio preparado para clássico", excerpt: "Wlamir Marques recebe Flamengo.", category: "Jogos", categorySlug: "jogos", author: "Ana Fiel", authorAvatar: "", imageUrl: placeholderImg, imageAlt: "Ginásio", publishedAt: "Há 6 dias", slug: "ginasio-preparado", isBreaking: false, isLive: false, viewCount: 3800 },
    ],
    weekHighlights: [
      { id: "w1", title: "Corinthians goleia Franca no NBB", excerpt: "Timão vence por 85x78.", category: "Basquete", categorySlug: "basquete", author: "João Fiel", authorAvatar: "", imageUrl: placeholderImg, imageAlt: "Goleada", publishedAt: "Há 1 semana", slug: "corinthians-goleia-franca", isBreaking: false, isLive: false, viewCount: 7500 },
      { id: "w2", title: "Base do basquete conquista torneio", excerpt: "Meninos são campeões estaduais.", category: "Base", categorySlug: "base", author: "Maria Clara", authorAvatar: "", imageUrl: placeholderImg, imageAlt: "Base campeã", publishedAt: "Há 1 semana", slug: "base-campeã", isBreaking: false, isLive: false, viewCount: 5200 },
    ],
    transfers: [
      { player: "Alex Garcia", image: placeholderImg, type: "entrada", from: "Flamengo" },
      { player: "Leo Meindl", image: placeholderImg, type: "saída", to: "Franca" },
    ],
  },
  futsal: {
    name: "Futsal",
    slug: "futsal",
    icon: "⚽",
    heroTitle: "Futsal Masculino Profissional",
    heroDescription: "Corinthians no Campeonato Paulista de Futsal.",
    nextMatch: {
      homeTeam: "Corinthians",
      awayTeam: "Pato Futsal",
      date: "Qua, 25/06",
      time: "19:00",
      venue: "Ginásio Wlamir Marques",
      competition: "Paulistão de Futsal",
      hasTickets: true,
    },
    recentResults: [
      { home: "Corinthians", away: "Carlos Drummond", score: "5 x 2" },
      { home: "São Paulo", away: "Corinthians", score: "3 x 4" },
      { home: "Corinthians", away: "Magnus", score: "2 x 2" },
    ],
    standings: [
      { pos: 1, time: "Corinthians", pts: 22, j: 10, v: 7, e: 1, d: 2, gp: 35, gc: 18 },
      { pos: 2, time: "Carlos Drummond", pts: 20, j: 10, v: 6, e: 2, d: 2, gp: 30, gc: 20 },
      { pos: 3, time: "Magnus", pts: 18, j: 10, v: 5, e: 3, d: 2, gp: 28, gc: 22 },
      { pos: 4, time: "São Paulo", pts: 16, j: 10, v: 5, e: 1, d: 4, gp: 25, gc: 24 },
      { pos: 5, time: "Pato Futsal", pts: 14, j: 10, v: 4, e: 2, d: 4, gp: 22, gc: 23 },
      { pos: 6, time: "Joaçaba", pts: 12, j: 10, v: 3, e: 3, d: 4, gp: 20, gc: 22 },
      { pos: 7, time: "Atlântico", pts: 10, j: 10, v: 3, e: 1, d: 6, gp: 18, gc: 25 },
      { pos: 8, time: "Cascavel", pts: 8, j: 10, v: 2, e: 2, d: 6, gp: 15, gc: 28 },
    ],
    latestNews: [
      { id: "1", title: "Futsal goleia Carlos Drummond", excerpt: "Timão vence por 5x2 e lidera o grupo.", category: "Futsal", categorySlug: "futsal", author: "Pedro Silva", authorAvatar: "", imageUrl: placeholderImg, imageAlt: "Futsal", publishedAt: "Há 1 dia", slug: "futsal-goleia", isBreaking: false, isLive: false, viewCount: 4500 },
      { id: "2", title: "Futsal vence São Paulo no Paulistão", excerpt: "Timão supera rival por 4x3.", category: "Futsal", categorySlug: "futsal", author: "João Fiel", authorAvatar: "", imageUrl: placeholderImg, imageAlt: "Futsal vence", publishedAt: "Há 3 dias", slug: "futsal-vence-sao-paulo", isBreaking: false, isLive: false, viewCount: 3800 },
      { id: "3", title: "Futsal empatou com Magnus", excerpt: "Jogo equilibrado termina 2x2.", category: "Futsal", categorySlug: "futsal", author: "Maria Clara", authorAvatar: "", imageUrl: placeholderImg, imageAlt: "Empate", publishedAt: "Há 5 dias", slug: "futsal-empata-magnus", isBreaking: false, isLive: false, viewCount: 3200 },
      { id: "4", title: "Técnico do futsal elogia elenco", excerpt: "Time mostra evolução tática.", category: "Futsal", categorySlug: "futsal", author: "Ana Fiel", authorAvatar: "", imageUrl: placeholderImg, imageAlt: "Técnico", publishedAt: "Há 6 dias", slug: "tecnico-elogia", isBreaking: false, isLive: false, viewCount: 2800 },
    ],
    weekHighlights: [
      { id: "w1", title: "Futsal é líder do Paulistão", excerpt: "Timão soma 22 pontos em 10 jogos.", category: "Futsal", categorySlug: "futsal", author: "João Fiel", authorAvatar: "", imageUrl: placeholderImg, imageAlt: "Líder", publishedAt: "Há 1 semana", slug: "futsal-lider", isBreaking: false, isLive: false, viewCount: 5500 },
      { id: "w2", title: "Futsal goleia Carlos Drummond", excerpt: "Timão vence por 5x2.", category: "Futsal", categorySlug: "futsal", author: "Pedro Silva", authorAvatar: "", imageUrl: placeholderImg, imageAlt: "Goleada", publishedAt: "Há 1 semana", slug: "futsal-goleia-dr", isBreaking: false, isLive: false, viewCount: 4800 },
    ],
    transfers: [],
  },
  "futebol-feminino": {
    name: "Futebol Feminino",
    slug: "futebol-feminino",
    icon: "⚽",
    heroTitle: "Futebol Feminino Profissional",
    heroDescription: "Acompanhe tudo sobre o Timão Feminino na Libertadores e no Brasileirão.",
    nextMatch: {
      homeTeam: "Corinthians",
      awayTeam: "Ferroviária",
      date: "Sáb, 28/06",
      time: "15:00",
      venue: "Neo Química Arena",
      competition: "Libertadores Feminina",
      hasTickets: true,
    },
    recentResults: [
      { home: "Corinthians", away: "São Paulo", score: "3 x 0" },
      { home: "Ferroviária", away: "Corinthians", score: "1 x 2" },
      { home: "Corinthians", away: "Santos", score: "4 x 1" },
    ],
    standings: [
      { pos: 1, time: "Corinthians", pts: 18, j: 6, v: 6, e: 0, d: 0, gp: 18, gc: 4 },
      { pos: 2, time: "Ferroviária", pts: 15, j: 6, v: 5, e: 0, d: 1, gp: 14, gc: 6 },
      { pos: 3, time: "São Paulo", pts: 12, j: 6, v: 4, e: 0, d: 2, gp: 12, gc: 8 },
      { pos: 4, time: "Santos", pts: 9, j: 6, v: 3, e: 0, d: 3, gp: 10, gc: 10 },
      { pos: 5, time: "Palmeiras", pts: 6, j: 6, v: 2, e: 0, d: 4, gp: 8, gc: 12 },
      { pos: 6, time: "Flamengo", pts: 3, j: 6, v: 1, e: 0, d: 5, gp: 5, gc: 15 },
    ],
    tables: [
      { name: "Brasileirão Feminino", standings: [
        { pos: 1, time: "Corinthians", pts: 28, j: 12, v: 9, e: 1, d: 2, gp: 26, gc: 8 },
        { pos: 2, time: "Palmeiras", pts: 25, j: 12, v: 8, e: 1, d: 3, gp: 22, gc: 10 },
        { pos: 3, time: "São Paulo", pts: 22, j: 12, v: 7, e: 1, d: 4, gp: 20, gc: 14 },
        { pos: 4, time: "Ferroviária", pts: 20, j: 12, v: 6, e: 2, d: 4, gp: 18, gc: 15 },
        { pos: 5, time: "Santos", pts: 18, j: 12, v: 5, e: 3, d: 4, gp: 16, gc: 16 },
        { pos: 6, time: "Flamengo", pts: 15, j: 12, v: 4, e: 3, d: 5, gp: 14, gc: 18 },
      ]},
      { name: "Libertadores Feminina", standings: [
        { pos: 1, time: "Corinthians", pts: 18, j: 6, v: 6, e: 0, d: 0, gp: 18, gc: 4 },
        { pos: 2, time: "River Plate", pts: 12, j: 6, v: 4, e: 0, d: 2, gp: 12, gc: 8 },
        { pos: 3, time: "Colón", pts: 9, j: 6, v: 3, e: 0, d: 3, gp: 10, gc: 10 },
        { pos: 4, time: "Sporting", pts: 3, j: 6, v: 1, e: 0, d: 5, gp: 5, gc: 15 },
      ]},
      { name: "Copa do Brasil Feminina", standings: [
        { pos: 1, time: "Corinthians", pts: 0, j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0 },
        { pos: 2, time: "Ferroviária", pts: 0, j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0 },
      ]},
      { name: "Paulistão Feminino", standings: [
        { pos: 1, time: "Corinthians", pts: 30, j: 14, v: 10, e: 0, d: 4, gp: 28, gc: 12 },
        { pos: 2, time: "São Paulo", pts: 26, j: 14, v: 8, e: 2, d: 4, gp: 22, gc: 14 },
        { pos: 3, time: "Santos", pts: 22, j: 14, v: 7, e: 1, d: 6, gp: 18, gc: 16 },
      ]},
      { name: "Copa Libertadores Feminina", standings: [
        { pos: 1, time: "Corinthians", pts: 18, j: 6, v: 6, e: 0, d: 0, gp: 18, gc: 4 },
        { pos: 2, time: "River Plate", pts: 12, j: 6, v: 4, e: 0, d: 2, gp: 12, gc: 8 },
      ]},
    ],
    latestNews: [
      { id: "1", title: "Feminino goleia São Paulo na Libertadores", excerpt: "Timão vence por 3x0 e segue invicto.", category: "Feminino", categorySlug: "feminino", author: "Maria Clara", authorAvatar: "", imageUrl: placeholderImg, imageAlt: "Feminino", publishedAt: "Há 1 dia", slug: "feminino-goleia-sao-paulo", isBreaking: false, isLive: false, viewCount: 8500 },
      { id: "2", title: "Tamires é eleita craque da rodada", excerpt: "Zagueira brilhou na Libertadores.", category: "Destaques", categorySlug: "destaques", author: "Ana Fiel", authorAvatar: "", imageUrl: placeholderImg, imageAlt: "Tamires", publishedAt: "Há 3 dias", slug: "tamires-craque", isBreaking: false, isLive: false, viewCount: 6200 },
      { id: "3", title: "Feminino vence Ferroviária fora", excerpt: "Timão supera rival por 2x1.", category: "Feminino", categorySlug: "feminino", author: "Pedro Silva", authorAvatar: "", imageUrl: placeholderImg, imageAlt: "Vitória", publishedAt: "Há 5 dias", slug: "feminino-vence-ferroviaria", isBreaking: false, isLive: false, viewCount: 5100 },
      { id: "4", title: "Técnica do feminino comenta elenco", excerpt: "Time mostra evolução tática.", category: "Feminino", categorySlug: "feminino", author: "João Fiel", authorAvatar: "", imageUrl: placeholderImg, imageAlt: "Técnica", publishedAt: "Há 7 dias", slug: "tecnica-comenta", isBreaking: false, isLive: false, viewCount: 4200 },
    ],
    weekHighlights: [
      { id: "w1", title: "Feminino líder da Libertadores", excerpt: "Timão soma 18 pontos em 6 jogos.", category: "Feminino", categorySlug: "feminino", author: "Maria Clara", authorAvatar: "", imageUrl: placeholderImg, imageAlt: "Líder", publishedAt: "Há 1 semana", slug: "feminino-lider", isBreaking: false, isLive: false, viewCount: 7800 },
      { id: "w2", title: "Feminino goleia Santos por 4x1", excerpt: "Timão vence com autoridade.", category: "Feminino", categorySlug: "feminino", author: "Ana Fiel", authorAvatar: "", imageUrl: placeholderImg, imageAlt: "Goleada", publishedAt: "Há 1 semana", slug: "feminino-goleia-santos", isBreaking: false, isLive: false, viewCount: 6500 },
    ],
    transfers: [],
  },
  "sub-20": {
    name: "Sub-20",
    slug: "sub-20",
    icon: "⚽",
    heroTitle: "Futebol Sub-20",
    heroDescription: "Acompanhe a base do Timão no Campeonato Paulista Sub-20.",
    nextMatch: {
      homeTeam: "Corinthians",
      awayTeam: "São Paulo",
      date: "Qua, 25/06",
      time: "14:00",
      venue: "CT Joaquim Grava",
      competition: "Paulistão Sub-20",
      hasTickets: false,
    },
    recentResults: [
      { home: "Corinthians", away: "Palmeiras", score: "1 x 1" },
      { home: "Santos", away: "Corinthians", score: "0 x 2" },
      { home: "Corinthians", away: "São Paulo", score: "3 x 1" },
    ],
    standings: [
      { pos: 1, time: "Corinthians", pts: 22, j: 8, v: 7, e: 1, d: 0, gp: 18, gc: 5 },
      { pos: 2, time: "Palmeiras", pts: 18, j: 8, v: 5, e: 3, d: 0, gp: 14, gc: 7 },
      { pos: 3, time: "São Paulo", pts: 15, j: 8, v: 4, e: 3, d: 1, gp: 12, gc: 8 },
      { pos: 4, time: "Santos", pts: 12, j: 8, v: 3, e: 3, d: 2, gp: 10, gc: 9 },
      { pos: 5, time: "Flamengo", pts: 9, j: 8, v: 2, e: 3, d: 3, gp: 8, gc: 10 },
      { pos: 6, time: "Botafogo", pts: 6, j: 8, v: 1, e: 3, d: 4, gp: 6, gc: 12 },
    ],
    tables: [
      { name: "Paulistão Sub-20", standings: [
        { pos: 1, time: "Corinthians", pts: 22, j: 8, v: 7, e: 1, d: 0, gp: 18, gc: 5 },
        { pos: 2, time: "Palmeiras", pts: 18, j: 8, v: 5, e: 3, d: 0, gp: 14, gc: 7 },
        { pos: 3, time: "São Paulo", pts: 15, j: 8, v: 4, e: 3, d: 1, gp: 12, gc: 8 },
        { pos: 4, time: "Santos", pts: 12, j: 8, v: 3, e: 3, d: 2, gp: 10, gc: 9 },
        { pos: 5, time: "Flamengo", pts: 9, j: 8, v: 2, e: 3, d: 3, gp: 8, gc: 10 },
        { pos: 6, time: "Botafogo", pts: 6, j: 8, v: 1, e: 3, d: 4, gp: 6, gc: 12 },
      ]},
    ],
    latestNews: [
      { id: "1", title: "Sub-20 vence Palmeiras no clássico", excerpt: "Base goleia rival por 2x0.", category: "Base", categorySlug: "base", author: "Maria Clara", authorAvatar: "", imageUrl: placeholderImg, imageAlt: "Sub-20", publishedAt: "Há 1 dia", slug: "sub20-vence-palmeiras", isBreaking: false, isLive: false, viewCount: 4500 },
      { id: "2", title: "Garçal é destaque do Sub-20", excerpt: "Meia brilha nas categorias de base.", category: "Destaques", categorySlug: "destaques", author: "Pedro Silva", authorAvatar: "", imageUrl: placeholderImg, imageAlt: "Garçal", publishedAt: "Há 4 dias", slug: "garcal-destaque", isBreaking: false, isLive: false, viewCount: 3800 },
      { id: "3", title: "Sub-20 goleia Santos", excerpt: "Timão vence por 2x0.", category: "Base", categorySlug: "base", author: "João Fiel", authorAvatar: "", imageUrl: placeholderImg, imageAlt: "Goleada", publishedAt: "Há 6 dias", slug: "sub20-goleia-santos", isBreaking: false, isLive: false, viewCount: 3200 },
      { id: "4", title: "Base do Corinthians é destaque", excerpt: "Categorias de base mostram futebol de primeira.", category: "Base", categorySlug: "base", author: "Ana Fiel", authorAvatar: "", imageUrl: placeholderImg, imageAlt: "Base", publishedAt: "Há 8 dias", slug: "base-destaque", isBreaking: false, isLive: false, viewCount: 2800 },
    ],
    weekHighlights: [
      { id: "w1", title: "Sub-20 líder do Paulistão", excerpt: "Timão soma 22 pontos em 8 jogos.", category: "Base", categorySlug: "base", author: "Maria Clara", authorAvatar: "", imageUrl: placeholderImg, imageAlt: "Líder", publishedAt: "Há 1 semana", slug: "sub20-lider", isBreaking: false, isLive: false, viewCount: 5200 },
      { id: "w2", title: "Sub-20 vence Palmeiras", excerpt: "Base goleia rival.", category: "Base", categorySlug: "base", author: "Pedro Silva", authorAvatar: "", imageUrl: placeholderImg, imageAlt: "Vitória", publishedAt: "Há 1 semana", slug: "sub20-vence-palmeiras-semana", isBreaking: false, isLive: false, viewCount: 4500 },
    ],
    transfers: [],
  },
  "sub-17": {
    name: "Sub-17",
    slug: "sub-17",
    icon: "⚽",
    heroTitle: "Futebol Sub-17",
    heroDescription: "Acompanhe a base do Timão no Campeonato Paulista Sub-17.",
    nextMatch: {
      homeTeam: "Corinthians",
      awayTeam: "Botafogo",
      date: "Qui, 26/06",
      time: "10:00",
      venue: "CT Joaquim Grava",
      competition: "Paulistão Sub-17",
      hasTickets: false,
    },
    recentResults: [
      { home: "Corinthians", away: "Santos", score: "4 x 2" },
      { home: "Palmeiras", away: "Corinthians", score: "1 x 3" },
      { home: "Corinthians", away: "São Paulo", score: "2 x 0" },
    ],
    standings: [
      { pos: 1, time: "Corinthians", pts: 25, j: 9, v: 8, e: 1, d: 0, gp: 22, gc: 6 },
      { pos: 2, time: "Palmeiras", pts: 20, j: 9, v: 6, e: 2, d: 1, gp: 16, gc: 8 },
      { pos: 3, time: "São Paulo", pts: 17, j: 9, v: 5, e: 2, d: 2, gp: 14, gc: 10 },
      { pos: 4, time: "Santos", pts: 14, j: 9, v: 4, e: 2, d: 3, gp: 12, gc: 11 },
      { pos: 5, time: "Flamengo", pts: 11, j: 9, v: 3, e: 2, d: 4, gp: 10, gc: 13 },
      { pos: 6, time: "Botafogo", pts: 8, j: 9, v: 2, e: 2, d: 5, gp: 8, gc: 15 },
    ],
    tables: [
      { name: "Paulistão Sub-17", standings: [
        { pos: 1, time: "Corinthians", pts: 25, j: 9, v: 8, e: 1, d: 0, gp: 22, gc: 6 },
        { pos: 2, time: "Palmeiras", pts: 20, j: 9, v: 6, e: 2, d: 1, gp: 16, gc: 8 },
        { pos: 3, time: "São Paulo", pts: 17, j: 9, v: 5, e: 2, d: 2, gp: 14, gc: 10 },
        { pos: 4, time: "Santos", pts: 14, j: 9, v: 4, e: 2, d: 3, gp: 12, gc: 11 },
        { pos: 5, time: "Flamengo", pts: 11, j: 9, v: 3, e: 2, d: 4, gp: 10, gc: 13 },
        { pos: 6, time: "Botafogo", pts: 8, j: 9, v: 2, e: 2, d: 5, gp: 8, gc: 15 },
      ]},
    ],
    latestNews: [
      { id: "1", title: "Sub-17 goleia Santos no clássico", excerpt: "Base vence por 4x2.", category: "Base", categorySlug: "base", author: "Maria Clara", authorAvatar: "", imageUrl: placeholderImg, imageAlt: "Sub-17", publishedAt: "Há 1 dia", slug: "sub17-goleia-santos", isBreaking: false, isLive: false, viewCount: 3800 },
      { id: "2", title: "Sub-17 vence Palmeiras fora", excerpt: "Timão supera rival por 3x1.", category: "Base", categorySlug: "base", author: "João Fiel", authorAvatar: "", imageUrl: placeholderImg, imageAlt: "Vitória", publishedAt: "Há 4 dias", slug: "sub17-vence-palmeiras", isBreaking: false, isLive: false, viewCount: 3200 },
      { id: "3", title: "Base Sub-17 é destaque", excerpt: "Meninos mostram futebol de primeira.", category: "Base", categorySlug: "base", author: "Pedro Silva", authorAvatar: "", imageUrl: placeholderImg, imageAlt: "Destaque", publishedAt: "Há 6 dias", slug: "sub17-destaque", isBreaking: false, isLive: false, viewCount: 2800 },
      { id: "4", title: "Sub-17 goleia São Paulo", excerpt: "Timão vence por 2x0.", category: "Base", categorySlug: "base", author: "Ana Fiel", authorAvatar: "", imageUrl: placeholderImg, imageAlt: "Goleada", publishedAt: "Há 8 dias", slug: "sub17-goleia-sp", isBreaking: false, isLive: false, viewCount: 2400 },
    ],
    weekHighlights: [
      { id: "w1", title: "Sub-17 líder do Paulistão", excerpt: "Timão soma 25 pontos em 9 jogos.", category: "Base", categorySlug: "base", author: "Maria Clara", authorAvatar: "", imageUrl: placeholderImg, imageAlt: "Líder", publishedAt: "Há 1 semana", slug: "sub17-lider", isBreaking: false, isLive: false, viewCount: 4500 },
      { id: "w2", title: "Sub-17 goleia Santos", excerpt: "Base vence por 4x2.", category: "Base", categorySlug: "base", author: "João Fiel", authorAvatar: "", imageUrl: placeholderImg, imageAlt: "Goleada", publishedAt: "Há 1 semana", slug: "sub17-goleia-santos-semana", isBreaking: false, isLive: false, viewCount: 3800 },
    ],
    transfers: [],
  },
};

export const sportSlugs = ["futebol", "basquete", "futsal", "futebol-feminino", "sub-20", "sub-17"];
