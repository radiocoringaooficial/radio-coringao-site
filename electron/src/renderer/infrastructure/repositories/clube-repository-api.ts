import type { ClubeRepository } from '@/domain/repositories/clube-repository';
import type { Team, ClubeCategory, Competition, Opponent, Match, StandingEntry, SquadMember, PlayerMovement, TransferClub } from '@/domain/entities/clube';
import { getClubeClient } from '../api/http-client';

export class ApiClubeRepository implements ClubeRepository {
  private get http() { return getClubeClient(); }

  // Team
  async getTeam(): Promise<Team> { return this.http.get('/team'); }
  async updateTeam(data: FormData): Promise<Team> { return this.http.patch('/admin/team', data); }

  // Categories
  async getCategories(): Promise<ClubeCategory[]> { return this.http.get('/categorias'); }
  async createCategory(data: Partial<ClubeCategory>): Promise<ClubeCategory> { return this.http.post('/admin/categorias', data); }
  async updateCategory(id: string, data: Partial<ClubeCategory>): Promise<ClubeCategory> { return this.http.patch(`/admin/categorias/${id}`, data); }
  async deleteCategory(id: string): Promise<void> { await this.http.delete(`/admin/categorias/${id}`); }

  // Competitions
  async getCompetitions(categoryId?: string): Promise<Competition[]> { return this.http.get('/competicoes', { params: categoryId ? { categoryId } : undefined }); }
  async createCompetition(data: Partial<Competition>): Promise<Competition> { return this.http.post('/admin/competicoes', data); }
  async updateCompetition(id: string, data: Partial<Competition>): Promise<Competition> { return this.http.patch(`/admin/competicoes/${id}`, data); }
  async deleteCompetition(id: string): Promise<void> { await this.http.delete(`/admin/competicoes/${id}`); }

  // Opponents
  async getOpponents(): Promise<Opponent[]> { return this.http.get('/adversarios'); }
  async createOpponent(data: FormData): Promise<Opponent> { return this.http.post('/admin/adversarios', data); }
  async updateOpponent(id: string, data: FormData): Promise<Opponent> { return this.http.patch(`/admin/adversarios/${id}`, data); }
  async deleteOpponent(id: string): Promise<void> { await this.http.delete(`/admin/adversarios/${id}`); }

  // Matches
  async getMatches(params?: { category?: string; status?: string; competitionId?: string }): Promise<Match[]> { return this.http.get('/partidas', { params: params as any }); }
  async createMatch(data: Partial<Match>): Promise<Match> { return this.http.post('/admin/partidas', data); }
  async updateMatch(id: string, data: Partial<Match>): Promise<Match> { return this.http.patch(`/admin/partidas/${id}`, data); }
  async deleteMatch(id: string): Promise<void> { await this.http.delete(`/admin/partidas/${id}`); }

  // Standings
  async getStandings(competitionId: string): Promise<StandingEntry[]> { return this.http.get(`/classificacoes/${competitionId}`); }
  async getStandingsByCategory(categorySlug: string): Promise<any> { return this.http.get(`/classificacoes/category/${categorySlug}`); }
  async upsertStandings(competitionId: string, rows: Partial<StandingEntry>[]): Promise<void> { await this.http.post('/admin/classificacoes', { competitionId, rows }); }
  async bulkStandings(competitionId: string, rows: Partial<StandingEntry>[]): Promise<void> { await this.http.put(`/admin/classificacoes/${competitionId}/bulk`, rows); }

  // Squad
  async getSquad(category?: string): Promise<SquadMember[]> { return this.http.get('/squad', { params: category ? { category } : undefined }); }
  async createSquadMember(data: FormData): Promise<SquadMember> { return this.http.post('/admin/elenco', data); }
  async updateSquadMember(id: string, data: FormData): Promise<SquadMember> { return this.http.patch(`/admin/elenco/${id}`, data); }
  async deleteSquadMember(id: string): Promise<void> { await this.http.delete(`/admin/elenco/${id}`); }

  // Movements
  async getMovements(params?: { type?: string; limit?: number }): Promise<PlayerMovement[]> { return this.http.get('/movements', { params: params as any }); }
  async createMovement(data: Partial<PlayerMovement>): Promise<PlayerMovement> { return this.http.post('/admin/movimentacoes', data); }
  async updateMovement(id: string, data: Partial<PlayerMovement>): Promise<PlayerMovement> { return this.http.patch(`/admin/movimentacoes/${id}`, data); }
  async deleteMovement(id: string): Promise<void> { await this.http.delete(`/admin/movimentacoes/${id}`); }

  // Transfer Clubs
  async getTransferClubs(): Promise<TransferClub[]> { return this.http.get('/transfer-clubs'); }
  async createTransferClub(data: FormData): Promise<TransferClub> { return this.http.post('/admin/transfer-clubs', data); }
  async updateTransferClub(id: string, data: FormData): Promise<TransferClub> { return this.http.patch(`/admin/transfer-clubs/${id}`, data); }
  async deleteTransferClub(id: string): Promise<void> { await this.http.delete(`/admin/transfer-clubs/${id}`); }
}
