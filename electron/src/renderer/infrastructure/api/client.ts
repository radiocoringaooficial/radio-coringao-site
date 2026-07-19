const SPORTS_NEWS = 'https://radiocoringao-news.vercel.app/api';
const CLUBE = 'https://radiocoringao-clube.vercel.app/api';

let tokenCache: string | null = null;

export function setAuthToken(token: string) { tokenCache = token; }
export function clearAuthToken() { tokenCache = null; }

function getAuthHeaders(): Record<string, string> {
  const h: Record<string, string> = {};
  if (tokenCache) h['Authorization'] = `Bearer ${tokenCache}`;
  return h;
}

function buildErrorMessage(res: any, err: any): string {
  const base = err.message || err.error || `Erro ${res.status}`;
  const hint = err.hint ? `\n${err.hint}` : '';
  const field = err.field ? ` (${err.field})` : '';
  return `${base}${field}${hint}`;
}

async function handleResponse(res: Response): Promise<any> {
  if (res.status === 401) {
    clearAuthToken();
    window.location.href = '/login';
    throw new Error('Sessão expirada. Faça login novamente.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(buildErrorMessage(res, data));
  }
  return data;
}

async function apiGet(base: string, path: string): Promise<any> {
  try {
    const res = await fetch(`${base}${path}`, { headers: getAuthHeaders(), cache: 'no-store' });
    return await handleResponse(res);
  } catch (e: any) {
    if (e.name === 'TypeError' && e.message.includes('fetch')) {
      throw new Error('Não foi possível conectar ao servidor. Verifique se a API está rodando.');
    }
    throw e;
  }
}

async function apiPost(base: string, path: string, body: FormData | object): Promise<any> {
  const isForm = body instanceof FormData;
  const headers = { ...getAuthHeaders(), ...(!isForm ? { 'Content-Type': 'application/json' } : {}) };
  try {
    const res = await fetch(`${base}${path}`, { method: 'POST', headers, body: isForm ? body : JSON.stringify(body) });
    return await handleResponse(res);
  } catch (e: any) {
    if (e.name === 'TypeError' && e.message.includes('fetch')) {
      throw new Error('Não foi possível conectar ao servidor. Verifique se a API está rodando.');
    }
    throw e;
  }
}

async function apiPatch(base: string, path: string, body?: FormData | object): Promise<any> {
  const isForm = body instanceof FormData;
  const hasBody = body !== undefined && body !== null;
  const headers = { ...getAuthHeaders(), ...(hasBody && !isForm ? { 'Content-Type': 'application/json' } : {}) };
  try {
    const res = await fetch(`${base}${path}`, { method: 'PATCH', headers, body: isForm ? body : hasBody ? JSON.stringify(body) : undefined });
    return await handleResponse(res);
  } catch (e: any) {
    if (e.name === 'TypeError' && e.message.includes('fetch')) {
      throw new Error('Não foi possível conectar ao servidor. Verifique se a API está rodando.');
    }
    throw e;
  }
}

async function apiPut(base: string, path: string, body: FormData | object): Promise<any> {
  const isForm = body instanceof FormData;
  const headers = { ...getAuthHeaders(), ...(!isForm ? { 'Content-Type': 'application/json' } : {}) };
  try {
    const res = await fetch(`${base}${path}`, { method: 'PUT', headers, body: isForm ? body : JSON.stringify(body) });
    return await handleResponse(res);
  } catch (e: any) {
    if (e.name === 'TypeError' && e.message.includes('fetch')) {
      throw new Error('Não foi possível conectar ao servidor. Verifique se a API está rodando.');
    }
    throw e;
  }
}

async function apiDelete(base: string, path: string): Promise<void> {
  try {
    const res = await fetch(`${base}${path}`, { method: 'DELETE', headers: getAuthHeaders() });
    await handleResponse(res);
  } catch (e: any) {
    if (e.name === 'TypeError' && e.message.includes('fetch')) {
      throw new Error('Não foi possível conectar ao servidor. Verifique se a API está rodando.');
    }
    throw e;
  }
}

export const newsApi = {
  get: (path: string) => apiGet(SPORTS_NEWS, path),
  post: (path: string, body: any) => apiPost(SPORTS_NEWS, path, body),
  put: (path: string, body: any) => apiPut(SPORTS_NEWS, path, body),
  patch: (path: string, body: any) => apiPatch(SPORTS_NEWS, path, body),
  delete: (path: string) => apiDelete(SPORTS_NEWS, path),
};

export const clubeApi = {
  get: (path: string) => apiGet(CLUBE, path),
  post: (path: string, body: any) => apiPost(CLUBE, path, body),
  put: (path: string, body: any) => apiPut(CLUBE, path, body),
  patch: (path: string, body: any) => apiPatch(CLUBE, path, body),
  delete: (path: string) => apiDelete(CLUBE, path),
};

export { SPORTS_NEWS, CLUBE };
