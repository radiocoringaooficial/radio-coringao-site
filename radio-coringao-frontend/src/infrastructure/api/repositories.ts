import {
  NewsArticle,
  NextMatch,
  Comment,
  Columnist,
  TableEntry,
  MatchResult,
  NewsletterSubscriber,
} from "@/domain/entities";
import {
  INewsRepository,
  IMatchRepository,
  ITableRepository,
  IColumnistRepository,
  ICommentRepository,
  INewsletterRepository,
} from "@/domain/repositories";
import { httpClient, clubeClient } from "@/infrastructure/api/http-client";

// Transform API article to match expected format
function transformArticle(apiArticle: any): NewsArticle {
  return {
    ...apiArticle,
    category: apiArticle.category?.name || apiArticle.category || '',
    categorySlug: apiArticle.category?.slug || apiArticle.categorySlug || '',
    author: apiArticle.author?.name || apiArticle.author || '',
    authorAvatar: apiArticle.author?.avatar || apiArticle.authorAvatar || '',
    authorPosition: apiArticle.author?.position || apiArticle.authorRole || '',
    imageUrl: apiArticle.coverImage || apiArticle.imageUrl || null,
    imageAlt: apiArticle.coverImageAlt || apiArticle.imageAlt || '',
  };
}

// Transform API match to match expected format
const CORINTHIANS_LOGO = 'https://res.cloudinary.com/def661xyl/image/upload/v1782685173/club-corinthians/logos/ulkyawaln1damxiqbpep.png';

function transformMatch(apiMatch: any): any {
  if (!apiMatch) return null;
  
  const matchDate = apiMatch.date ? new Date(apiMatch.date) : null;
  const dateStr = matchDate ? matchDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', timeZone: 'America/Sao_Paulo' }) : '';
  const timeStr = matchDate ? matchDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }) : '';
  
  const opponent = apiMatch.opponent || {};
  const opponentName = typeof opponent === 'string' ? opponent : opponent.name || 'TBD';
  const opponentLogo = typeof opponent === 'object' ? opponent.logoUrl : null;
  
  return {
    homeTeam: apiMatch.isHome ? 'Corinthians' : opponentName,
    awayTeam: apiMatch.isHome ? opponentName : 'Corinthians',
    homeTeamLogo: apiMatch.isHome ? CORINTHIANS_LOGO : opponentLogo,
    awayTeamLogo: apiMatch.isHome ? opponentLogo : CORINTHIANS_LOGO,
    date: dateStr,
    time: timeStr,
    venue: apiMatch.venue || '',
    competition: apiMatch.competition?.name || apiMatch.competition || '',
    category: apiMatch.competition?.category?.slug || '',
    hasTickets: false,
    status: apiMatch.status,
    homeScore: apiMatch.homeScore,
    awayScore: apiMatch.awayScore,
    round: apiMatch.round || null,
  };
}

export class ApiNewsRepository implements INewsRepository {
  async getEditorialNews(): Promise<NewsArticle[]> {
    const res = await httpClient.get<any>("/noticias/editorial");
    const articles = Array.isArray(res) ? res : res?.data || [];
    return articles.map(transformArticle);
  }

  async getLatestNews(): Promise<NewsArticle[]> {
    const res = await httpClient.get<any>("/noticias/latest");
    const articles = Array.isArray(res) ? res : res?.data || [];
    return articles.map(transformArticle);
  }

  async getArticleBySlug(slug: string): Promise<NewsArticle | null> {
    try {
      const res = await httpClient.get<any>(`/noticias/${slug}`);
      return res ? transformArticle(res) : null;
    } catch {
      return null;
    }
  }

  async getArticlesByCategory(category: string): Promise<NewsArticle[]> {
    const res = await httpClient.get<any>("/news", {
      params: { category },
      revalidate: 60,
    });
    const articles = Array.isArray(res) ? res : res?.data || [];
    return articles.map(transformArticle);
  }

  async searchArticles(query: string): Promise<NewsArticle[]> {
    const res = await httpClient.get<any>("/noticias/search", {
      params: { q: query },
    });
    const articles = Array.isArray(res) ? res : res?.data || [];
    return articles.map(transformArticle);
  }

  async getArticlesByPage(page: number, limit: number): Promise<{ articles: NewsArticle[]; total: number }> {
    const res = await httpClient.get<any>("/news", {
      params: { page: String(page), limit: String(limit) },
    });
    const articles = Array.isArray(res) ? res : res?.data || [];
    return {
      articles: articles.map(transformArticle),
      total: res?.total || 0,
    };
  }
}

export class ApiMatchRepository implements IMatchRepository {
  async getNextMatch(): Promise<NextMatch> {
    const res = await clubeClient.get<any>("/partidas/next");
    const match = Array.isArray(res) ? res[0] || null : res;
    return transformMatch(match);
  }

  async getNextMatchFeminino(): Promise<NextMatch> {
    const res = await clubeClient.get<any>("/partidas/next-feminino");
    const match = Array.isArray(res) ? res[0] || null : res;
    return transformMatch(match);
  }

  async getNextMatchBasquete(): Promise<NextMatch> {
    const res = await clubeClient.get<any>("/partidas/next-basquete");
    const match = Array.isArray(res) ? res[0] || null : res;
    return transformMatch(match);
  }

  async getRecentResults(): Promise<MatchResult[]> {
    const res = await clubeClient.get<any>("/partidas/recent");
    const matches = Array.isArray(res) ? res : res?.data || [];
    return matches.map(transformMatch);
  }

  async getMatchById(id: string): Promise<NextMatch | null> {
    try {
      const res = await clubeClient.get<any>(`/partidas/${id}`);
      return transformMatch(res);
    } catch {
      return null;
    }
  }

  async getMatchesByCompetition(competition: string): Promise<MatchResult[]> {
    const res = await clubeClient.get<any>("/partidas", {
      params: { competition },
    });
    const matches = Array.isArray(res) ? res : res?.data || [];
    return matches.map(transformMatch);
  }

  async getScheduledMatches(): Promise<MatchResult[]> {
    const res = await clubeClient.get<any>("/partidas", {
      params: { status: "SCHEDULED", limit: "10" },
    });
    const matches = Array.isArray(res) ? res : res?.data || [];
    console.log("[DEBUG] getScheduledMatches raw:", JSON.stringify(matches[0]));
    const transformed = matches.map(transformMatch);
    console.log("[DEBUG] transformMatch result:", JSON.stringify(transformed[0]));
    return transformed;
  }
}

export class ApiTableRepository implements ITableRepository {
  async getStandings(): Promise<TableEntry[]> {
    const res = await clubeClient.get<any>("/classificacao");
    const data = Array.isArray(res) ? res : res?.data || [];
    return data.map((row: any) => ({
      pos: row.position,
      time: row.teamName,
      pts: row.points,
      j: row.played,
      v: row.won,
      e: row.drawn,
      d: row.lost,
      gp: row.goalsFor,
      gc: row.goalsAgainst,
    }));
  }

  async getStandingsByCompetition(competition: string): Promise<TableEntry[]> {
    const res = await clubeClient.get<any>(`/classificacoes/${competition}`);
    const data = Array.isArray(res) ? res : res?.data || [];
    return data.map((row: any) => ({
      pos: row.position,
      time: row.teamName,
      pts: row.points,
      j: row.played,
      v: row.won,
      e: row.drawn,
      d: row.lost,
      gp: row.goalsFor,
      gc: row.goalsAgainst,
    }));
  }
}

export class ApiColumnistRepository implements IColumnistRepository {
  async getColumnists(): Promise<Columnist[]> {
    const res = await httpClient.get<any>("/cronistas");
    return Array.isArray(res) ? res : res?.data || [];
  }

  async getColumnistBySlug(slug: string): Promise<Columnist | null> {
    try {
      return await httpClient.get<Columnist>(`/cronistas/${slug}`);
    } catch {
      return null;
    }
  }
}

export class ApiCommentRepository implements ICommentRepository {
  async getCommentsByArticle(slug: string): Promise<Comment[]> {
    const res = await httpClient.get<any>(`/noticias/${slug}/comments`);
    return Array.isArray(res) ? res : res?.data || [];
  }

  async addComment(
    comment: Omit<Comment, "id" | "createdAt">
  ): Promise<Comment> {
    return httpClient.post<Comment>(`/noticias/${comment.articleSlug}/comments`, {
      body: { name: comment.name, content: comment.content },
    });
  }
}

export class ApiNewsletterRepository implements INewsletterRepository {
  async subscribe(subscriber: NewsletterSubscriber): Promise<void> {
    await httpClient.post<void>("/newsletter/inscrever", {
      body: subscriber,
    });
  }
}
