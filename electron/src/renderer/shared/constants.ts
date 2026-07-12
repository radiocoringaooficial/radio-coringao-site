export const API_URLS = {
  sportsNews: 'https://radiocoringao-news.vercel.app/api',
  clube: 'https://radiocoringao-clube.vercel.app/api',
};

export const ARTICLE_STATUSES = ['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED'] as const;
export const ARTICLE_TYPES = ['NEWS', 'ANALYSIS', 'INTERVIEW', 'LIVE', 'GALLERY'] as const;
export const MATCH_STATUSES = ['SCHEDULED', 'IN_PLAY', 'FINISHED', 'POSTPONED', 'CANCELLED'] as const;
export const MOVEMENT_TYPES = ['ARRIVAL', 'DEPARTURE', 'LOAN_OUT', 'LOAN_IN', 'RETURN'] as const;
export const USER_ROLES = ['SUPER_ADMIN', 'EDITOR_CHEFE', 'EDITOR', 'JORNALISTA', 'COLUNISTA', 'SOCIAL_MEDIA', 'MODERADOR', 'SEO_MANAGER'] as const;
export const GENDERS = ['MALE', 'FEMALE'] as const;
export const MODALITIES = ['FOOTBALL', 'FUTSAL', 'BASKETBALL'] as const;

export const COMPETITION_STATUSES = [
  'Em andamento',
  'Fase de Grupos',
  'Oitavas de Final',
  'Quartas de Final',
  'Semifinal',
  'Final',
  'Campeão',
  'Vice-campeão',
  'Classificado',
  'Eliminado',
  'Não participa',
  'Adiado',
  'Cancelado',
  'Encerrado',
] as const;

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Rascunho', REVIEW: 'Revisão', PUBLISHED: 'Publicado', ARCHIVED: 'Arquivado',
  SCHEDULED: 'Agendado', IN_PLAY: 'Ao vivo', FINISHED: 'Finalizado', POSTPONED: 'Adiado', CANCELLED: 'Cancelado',
};

export const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700', REVIEW: 'bg-gray-200 text-gray-600',
  PUBLISHED: 'bg-primary text-white', ARCHIVED: 'bg-gray-100 text-gray-500',
  SCHEDULED: 'bg-gray-100 text-gray-700', IN_PLAY: 'bg-gray-800 text-white', FINISHED: 'bg-gray-200 text-gray-700',
};

export const GENDER_LABELS: Record<string, string> = { MALE: 'Masculino', FEMALE: 'Feminino' };
export const MODALITY_LABELS: Record<string, string> = { FOOTBALL: 'Futebol', FUTSAL: 'Futsal', BASKETBALL: 'Basquete' };
export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin', EDITOR_CHEFE: 'Editor-Chefe', EDITOR: 'Editor',
  JORNALISTA: 'Jornalista', COLUNISTA: 'Colunista', SOCIAL_MEDIA: 'Social Media',
  MODERADOR: 'Moderador', SEO_MANAGER: 'SEO Manager',
};
export const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  ARRIVAL: 'Contratação', DEPARTURE: 'Saída', LOAN_OUT: 'Empréstimo (Saída)', LOAN_IN: 'Empréstimo (Entrada)', RETURN: 'Retorno',
};

export const ARTICLE_TYPE_LABELS: Record<string, string> = {
  NEWS: 'Notícia', ANALYSIS: 'Análise', INTERVIEW: 'Entrevista', LIVE: 'Cobertura ao Vivo', GALLERY: 'Galeria de Fotos',
};
