export interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  category: string;
  categorySlug: string;
  author: string;
  authorAvatar?: string;
  authorPosition?: string;
  authorNameSnapshot?: string;
  imageUrl: string;
  imageAlt: string;
  coverImageCredit?: string;
  publishedAt: string;
  updatedAt?: string;
  slug: string;
  isBreaking: boolean;
  isLive: boolean;
  viewCount: number;
}

export interface NextMatch {
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo?: string | null;
  awayTeamLogo?: string | null;
  date: string;
  time: string;
  venue: string;
  competition: string;
  hasTickets: boolean;
  ticketUrl?: string | null;
  round?: string | null;
}

export interface Comment {
  id: string;
  name: string;
  content: string;
  articleSlug: string;
  createdAt: string;
}

export interface Columnist {
  name: string;
  role: string;
  description: string;
}

export interface TableEntry {
  pos: number;
  time: string;
  pts: number;
  j: number;
  v: number;
  e: number;
  d: number;
  gp: number;
  gc: number;
}

export interface MatchResult {
  home: string;
  away: string;
  score: string;
}

export interface NewsletterSubscriber {
  name: string;
  email: string;
}