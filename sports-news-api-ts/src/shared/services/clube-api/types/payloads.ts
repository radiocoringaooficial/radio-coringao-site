// Payload types for clube-api admin operations
export interface UpdateTeamPayload {
  name?: string;
  logoUrl?: string;
}

export interface CreateCategoryPayload {
  name: string;
  slug: string;
  gender?: string;
  modality?: string;
  parentId?: string;
}

export interface UpdateCategoryPayload {
  name?: string;
  slug?: string;
  gender?: string;
  modality?: string;
  parentId?: string;
}

export interface CreateCompetitionPayload {
  name: string;
  season: string;
  categoryId: string;
  status?: string;
  isParticipating?: boolean;
}

export interface UpdateCompetitionPayload {
  name?: string;
  season?: string;
  categoryId?: string;
  status?: string;
  isParticipating?: boolean;
}

export interface CreateOpponentPayload {
  name: string;
  shortName?: string;
  logoUrl?: string;
}

export interface UpdateOpponentPayload {
  name?: string;
  shortName?: string;
  logoUrl?: string;
}

export interface CreateMatchPayload {
  competitionId: string;
  date: string;
  venue?: string;
  opponentId?: string;
  isHome?: boolean;
  status?: string;
  homeScore?: number;
  awayScore?: number;
  round?: string;
}

export interface UpdateMatchPayload {
  date?: string;
  venue?: string;
  opponentId?: string;
  isHome?: boolean;
  status?: string;
  homeScore?: number;
  awayScore?: number;
  round?: string;
}

export interface UpsertStandingRowPayload {
  competitionId: string;
  position: number;
  teamName: string;
  logoUrl?: string;
  teamId?: string;
  opponentId?: string;
  groupName?: string;
  points?: number;
  played?: number;
  won?: number;
  drawn?: number;
  lost?: number;
  goalsFor?: number;
  goalsAgainst?: number;
  isOwnTeam?: boolean;
  form?: string;
  zone?: string;
}

export interface BulkStandingRow {
  position: number;
  teamName: string;
  logoUrl?: string;
  teamId?: string;
  groupName?: string;
  points?: number;
  played?: number;
  won?: number;
  drawn?: number;
  lost?: number;
  goalsFor?: number;
  goalsAgainst?: number;
  isOwnTeam?: boolean;
}

export interface CreateSquadMemberPayload {
  name: string;
  categoryId: string;
  shirtNumber?: number;
  photoUrl?: string;
  position?: string;
}

export interface UpdateSquadMemberPayload {
  name?: string;
  categoryId?: string;
  shirtNumber?: number;
  photoUrl?: string;
  position?: string;
  isActive?: boolean;
}

export interface CreatePlayerMovementPayload {
  squadMemberId: string;
  type: string;
  date: string;
  clubId?: string;
  opponentId?: string;
  valueCents?: string;
  currency?: string;
  loanValueCents?: string;
  isFreeLoan?: boolean;
  paysSalary?: boolean;
  returnDate?: string;
  notes?: string;
  season?: string;
}

export interface UpdatePlayerMovementPayload {
  type?: string;
  date?: string;
  clubId?: string;
  opponentId?: string;
  valueCents?: string;
  currency?: string;
  loanValueCents?: string;
  isFreeLoan?: boolean;
  paysSalary?: boolean;
  returnDate?: string;
  notes?: string;
  season?: string;
}

export interface CreateTransferClubPayload {
  name: string;
  logoUrl?: string;
}

export interface UpdateTransferClubPayload {
  name?: string;
  logoUrl?: string;
}
