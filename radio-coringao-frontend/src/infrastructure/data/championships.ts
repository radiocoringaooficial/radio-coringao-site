export interface StandingEntry {
  pos: number;
  time: string;
  j: number;
  v: number;
  d: number;
  ppro: number;
  pcon: number;
  sld: number;
  logoUrl?: string | null;
}

export interface ChampionshipGroup {
  groupName: string | null;
  entries: StandingEntry[];
}

export interface ChampionshipData {
  name: string;
  slug: string;
  description: string;
  groups: ChampionshipGroup[];
  hasTable: boolean;
  lastMatch?: { home: string; away: string; score: string; date: string; competition: string };
  nextMatch?: { home: string; away: string; date: string; time: string; venue: string; competition: string };
  elimination?: string;
  status: string;
}

export const championshipsData: Record<string, ChampionshipData> = {
  brasileirao: {
    name: "Brasileirão Masculino 2026 - Tabela",
    slug: "brasileirao",
    description: "Classificação do Campeonato Brasileiro Série A.",
    status: "Em andamento",
    hasTable: true,
    groups: [{ groupName: null, entries: [
      { pos: 1, time: "Corinthians", j: 20, v: 13, d: 4, ppro: 35, pcon: 16, sld: 19 },
      { pos: 2, time: "Palmeiras", j: 20, v: 12, d: 4, ppro: 32, pcon: 14, sld: 18 },
      { pos: 3, time: "Flamengo", j: 20, v: 11, d: 4, ppro: 30, pcon: 15, sld: 15 },
      { pos: 4, time: "Botafogo", j: 20, v: 11, d: 5, ppro: 28, pcon: 17, sld: 11 },
      { pos: 5, time: "São Paulo", j: 20, v: 10, d: 5, ppro: 26, pcon: 18, sld: 8 },
      { pos: 6, time: "Grêmio", j: 20, v: 9, d: 5, ppro: 24, pcon: 17, sld: 7 },
      { pos: 7, time: "Internacional", j: 20, v: 9, d: 6, ppro: 22, pcon: 18, sld: 4 },
      { pos: 8, time: "Bahia", j: 20, v: 8, d: 5, ppro: 21, pcon: 16, sld: 5 },
      { pos: 9, time: "Cruzeiro", j: 20, v: 8, d: 6, ppro: 23, pcon: 20, sld: 3 },
      { pos: 10, time: "Santos", j: 20, v: 8, d: 7, ppro: 20, pcon: 19, sld: 1 },
      { pos: 11, time: "Fluminense", j: 20, v: 7, d: 6, ppro: 19, pcon: 18, sld: 1 },
      { pos: 12, time: "Athletico-PR", j: 20, v: 7, d: 7, ppro: 18, pcon: 19, sld: -1 },
      { pos: 13, time: "Vasco", j: 20, v: 7, d: 8, ppro: 17, pcon: 20, sld: -3 },
      { pos: 14, time: "Fortaleza", j: 20, v: 6, d: 7, ppro: 16, pcon: 18, sld: -2 },
      { pos: 15, time: "Juventude", j: 20, v: 6, d: 8, ppro: 15, pcon: 19, sld: -4 },
      { pos: 16, time: "Ceará", j: 20, v: 6, d: 9, ppro: 14, pcon: 20, sld: -6 },
      { pos: 17, time: "Vitória", j: 20, v: 5, d: 8, ppro: 13, pcon: 19, sld: -6 },
      { pos: 18, time: "Criciúma", j: 20, v: 5, d: 10, ppro: 12, pcon: 22, sld: -10 },
      { pos: 19, time: "Atlético-GO", j: 20, v: 4, d: 10, ppro: 11, pcon: 23, sld: -12 },
      { pos: 20, time: "Sport", j: 20, v: 3, d: 10, ppro: 10, pcon: 24, sld: -14 },
    ]}],
    lastMatch: { home: "Corinthians", away: "Santos", score: "2 x 1", date: "Dom, 15/06", competition: "Brasileirão" },
    nextMatch: { home: "Corinthians", away: "Palmeiras", date: "Dom, 22/06", time: "16:00", venue: "Neo Química Arena", competition: "Brasileirão" },
  },
  libertadores: {
    name: "Libertadores",
    slug: "libertadores",
    description: "Classificação do Corinthians na Copa Libertadores da América.",
    status: "Fase de Grupos",
    hasTable: true,
    groups: [{ groupName: null, entries: [
      { pos: 1, time: "Corinthians", j: 6, v: 4, d: 2, ppro: 12, pcon: 6, sld: 6 },
      { pos: 2, time: "River Plate", j: 6, v: 3, d: 2, ppro: 10, pcon: 8, sld: 2 },
      { pos: 3, time: "Emelec", j: 6, v: 2, d: 3, ppro: 8, pcon: 10, sld: -2 },
      { pos: 4, time: "Always Ready", j: 6, v: 1, d: 4, ppro: 5, pcon: 11, sld: -6 },
    ]}],
    lastMatch: { home: "Corinthians", away: "River Plate", score: "3 x 1", date: "Qua, 18/06", competition: "Libertadores" },
    nextMatch: { home: "Emelec", away: "Corinthians", date: "Ter, 24/06", time: "21:00", venue: "Estádio George Capwell", competition: "Libertadores" },
  },
  "sul-americana": {
    name: "Sul-Americana",
    slug: "sul-americana",
    description: "Classificação do Corinthians na Copa Sul-Americana.",
    status: "Não participa",
    hasTable: false,
    groups: [],
    elimination: "Corinthians não está participando da Copa Sul-Americana 2026.",
  },
  "copa-do-brasil": {
    name: "Copa do Brasil",
    slug: "copa-do-brasil",
    description: "Classificação do Corinthians na Copa do Brasil.",
    status: "Oitavas de Final",
    hasTable: false,
    groups: [],
    lastMatch: { home: "Corinthians", away: "Athletico-PR", score: "2 x 0", date: "Qua, 11/06", competition: "Copa do Brasil" },
    nextMatch: { home: "Corinthians", away: "Flamengo", date: "Qua, 25/06", time: "21:30", venue: "Neo Química Arena", competition: "Copa do Brasil" },
  },
  paulistao: {
    name: "Paulistão",
    slug: "paulistao",
    description: "Classificação do Corinthians no Campeonato Paulista.",
    status: "Campeão",
    hasTable: true,
    groups: [{ groupName: null, entries: [
      { pos: 1, time: "Corinthians", j: 12, v: 8, d: 3, ppro: 22, pcon: 10, sld: 12 },
      { pos: 2, time: "São Paulo", j: 12, v: 7, d: 3, ppro: 18, pcon: 12, sld: 6 },
      { pos: 3, time: "Palmeiras", j: 12, v: 6, d: 3, ppro: 16, pcon: 11, sld: 5 },
      { pos: 4, time: "Santos", j: 12, v: 5, d: 4, ppro: 14, pcon: 13, sld: 1 },
      { pos: 5, time: "Botafogo-SP", j: 12, v: 4, d: 5, ppro: 12, pcon: 14, sld: -2 },
      { pos: 6, time: "Inter de Limeira", j: 12, v: 3, d: 6, ppro: 10, pcon: 16, sld: -6 },
    ]}],
    lastMatch: { home: "Corinthians", away: "São Paulo", score: "3 x 1", date: "Sáb, 05/04", competition: "Final Paulistão" },
  },
  copinha: {
    name: "Copinha",
    slug: "copinha",
    description: "Classificação do Corinthians na Copa São Paulo de Futebol Júnior.",
    status: "Quartas de Final",
    hasTable: true,
    groups: [{ groupName: null, entries: [
      { pos: 1, time: "Corinthians", j: 5, v: 5, d: 0, ppro: 14, pcon: 3, sld: 11 },
      { pos: 2, time: "Palmeiras", j: 5, v: 4, d: 1, ppro: 10, pcon: 4, sld: 6 },
      { pos: 3, time: "São Paulo", j: 5, v: 3, d: 1, ppro: 8, pcon: 5, sld: 3 },
      { pos: 4, time: "Santos", j: 5, v: 2, d: 1, ppro: 7, pcon: 5, sld: 2 },
    ]}],
    lastMatch: { home: "Corinthians", away: "Santos", score: "4 x 0", date: "Dom, 19/01", competition: "Oitavas Copinha" },
    nextMatch: { home: "Corinthians", away: "Palmeiras", date: "Qua, 22/01", time: "15:00", venue: "Estádio Novelli Júnior", competition: "Copinha" },
  },
};

export const championshipSlugs = ["brasileirao", "libertadores", "sul-americana", "copa-do-brasil", "paulistao", "copinha"];
