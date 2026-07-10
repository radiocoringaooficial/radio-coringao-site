import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildApp } from '../src/app';

let app: Awaited<ReturnType<typeof buildApp>> | null = null;

async function getApp() {
  if (!app) {
    app = await buildApp();
  }
  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const fastify = await getApp();

    const result = await fastify.inject({
      method: req.method as any,
      url: req.url || '/',
      headers: req.headers as Record<string, string>,
      body: req.body,
      query: req.query as Record<string, string>,
    });

    res.status(result.statusCode);
    Object.entries(result.headers).forEach(([key, value]) => {
      if (value) res.setHeader(key, value);
    });
    res.send(result.payload);
  } catch (err: any) {
    console.error('Function error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}
