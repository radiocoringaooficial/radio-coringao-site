import type { NewsRepository } from '@/domain/repositories/news-repository';
import type { ClubeRepository } from '@/domain/repositories/clube-repository';
import { ApiNewsRepository } from './repositories/news-repository-api';
import { ApiClubeRepository } from './repositories/clube-repository-api';
import { initHttpClients, getNewsClient } from './api/http-client';

const NEWS_API_URL = 'https://radiocoringao-news.vercel.app/api';
const CLUBE_API_URL = 'https://radiocoringao-clube.vercel.app/api';

let initialized = false;
function ensureInit() {
  if (!initialized) {
    initHttpClients(NEWS_API_URL, CLUBE_API_URL);
    initialized = true;
  }
}

export const container: {
  newsRepo: NewsRepository;
  clubeRepo: ClubeRepository;
} = {
  get newsRepo() { ensureInit(); return new ApiNewsRepository(); },
  get clubeRepo() { ensureInit(); return new ApiClubeRepository(); },
};

export const apiConfig = {
  USE_API: import.meta.env.VITE_USE_API !== 'false',
  NEWS_API_URL,
  CLUBE_API_URL,
  get newsHttpClient() { ensureInit(); return getNewsClient(); },
};
