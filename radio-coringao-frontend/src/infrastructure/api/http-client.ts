const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://radiocoringao-news.vercel.app/api";

const CLUBE_API_URL =
  process.env.NEXT_PUBLIC_CLUBE_API_URL || "https://radiocoringao-clube.vercel.app/api";

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  params?: Record<string, string>;
  revalidate?: number;
  retries?: number;
}

class HttpClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private buildUrl(path: string, params?: Record<string, string>): string {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    return url.toString();
  }

  private async fetchWithRetry<T>(
    url: string,
    options: RequestInit,
    retries: number = 3
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await fetch(url, options);

        if (!response.ok) {
          throw new ApiError(response.status, `HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        lastError = error as Error;

        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          throw error;
        }

        if (attempt < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    throw lastError;
  }

  async get<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = this.buildUrl(path, options.params);

    return this.fetchWithRetry<T>(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      next: options.revalidate
        ? { revalidate: options.revalidate }
        : undefined,
    }, options.retries);
  }

  async post<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = this.buildUrl(path, options.params);

    return this.fetchWithRetry<T>(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(options.body),
    }, options.retries);
  }

  async put<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = this.buildUrl(path, options.params);

    return this.fetchWithRetry<T>(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(options.body),
    }, options.retries);
  }

  async delete<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = this.buildUrl(path, options.params);

    return this.fetchWithRetry<T>(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    }, options.retries);
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const httpClient = new HttpClient(API_BASE_URL);
export const clubeClient = new HttpClient(CLUBE_API_URL);
