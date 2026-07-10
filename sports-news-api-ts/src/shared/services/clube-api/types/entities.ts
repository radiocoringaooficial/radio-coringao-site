// Entity types from clube-api
export interface Team {
  id: string;
  name: string;
  logoUrl?: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  gender?: string;
  modality?: string;
  parentId?: string | null;
}

export interface CompetitionWithCategory {
  id: string;
  name: string;
  season: string;
  categoryId: string;
  category?: Category;
  status?: string;
  isParticipating?: boolean;
}

export interface Opponent {
  id: string;
  name: string;
  shortName?: string;
  logoUrl?: string | null;
}

export interface Match {
  id: string;
  competitionId: string;
  date: string;
  venue?: string;
  status: string;
  homeScore?: number;
  awayScore?: number;
  round?: string;
}

export interface MatchWithRelations extends Match {
  opponent?: Opponent;
  competition?: CompetitionWithCategory;
}

export interface StandingEntryWithGoalDifference {
  id: string;
  competitionId: string;
  position: number;
  teamName: string;
  logoUrl?: string;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  groupName?: string;
  zone?: string;
  isOwnTeam?: boolean;
}

export interface SquadMember {
  id: string;
  name: string;
  categoryId: string;
  category?: Category;
  shirtNumber?: number;
  photoUrl?: string;
  position?: string;
  isActive: boolean;
}

export interface PlayerMovementWithSquadMember {
  id: string;
  type: string;
  date: string;
  squadMemberId?: string;
  squadMember?: SquadMember;
  playerName?: string;
  playerPhotoUrl?: string;
  clubId?: string;
  club?: { id: string; name: string; logoUrl?: string };
  opponentId?: string;
  opponent?: { id: string; name: string; logoUrl?: string };
  valueCents?: bigint;
  currency?: string;
  season?: string;
  notes?: string;
  isArchived?: boolean;
}

export interface TransferClub {
  id: string;
  name: string;
  logoUrl?: string;
}
