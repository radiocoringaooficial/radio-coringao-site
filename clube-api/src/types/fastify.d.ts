import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    uploadedFile?: { path: string };
  }
}
