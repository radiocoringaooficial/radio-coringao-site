// Query and response types for clube-api
export interface ListAdminMatchesParams {
  page?: number;
  limit?: number;
  competitionId?: string;
  status?: string;
}

export interface ListAdminSquadParams {
  categoryId?: string;
  isActive?: boolean;
}

export interface ListAdminMovementsParams {
  page?: number;
  limit?: number;
  squadMemberId?: string;
  archived?: string;
  season?: string;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MessageResponse {
  message: string;
}

export interface BulkReplaceResponse {
  message: string;
  count: number;
}
