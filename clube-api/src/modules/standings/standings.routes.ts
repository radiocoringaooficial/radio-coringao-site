// src/modules/standings/standings.routes.ts
import type { FastifyInstance } from 'fastify';
import { prisma } from '../../shared/database/prisma';
import { requireAdminAuth } from '../../shared/plugins/admin-auth.plugin';
import { createUploadHandler } from '../../shared/plugins/upload.plugin';
import { Validator, VALID_ZONES } from '../../shared/validation';

const uploadTeamLogo = createUploadHandler('logos');

function withGoalDifference<T extends { goalsFor: number; goalsAgainst: number }>(row: T) {
  return { ...row, goalDifference: row.goalsFor - row.goalsAgainst };
}

function validateStandingRow(
  row: any,
  index?: number,
): { errors: { field: string; message: string; row?: number }[] } {
  const prefix = index !== undefined ? `[${index}].` : '';
  const v = new Validator();

  v.required(`${prefix}teamName`, row?.teamName, 'nome do time')
    .string(`${prefix}teamName`, row?.teamName, { min: 1, max: 100, label: 'nome do time' })
    .required(`${prefix}position`, row?.position, 'posição')
    .integer(`${prefix}position`, row?.position, { min: 1, max: 999, label: 'posição' })
    .integer(`${prefix}played`, row?.played, { min: 0, label: 'jogos' })
    .integer(`${prefix}won`, row?.won, { min: 0, label: 'vitórias' })
    .integer(`${prefix}lost`, row?.lost, { min: 0, label: 'derrotas' })
    .integer(`${prefix}goalsFor`, row?.goalsFor, { min: 0, label: 'gols marcados' })
    .integer(`${prefix}goalsAgainst`, row?.goalsAgainst, { min: 0, label: 'gols sofridos' })
    .oneOf(`${prefix}zone`, row?.zone, VALID_ZONES, 'zona')
    .standingForm(`${prefix}form`, row?.form)
    .boolean(`${prefix}isOwnTeam`, row?.isOwnTeam, 'time do clube');

  // Consistência jogos (V + E + D = J)
  if (
    row?.won !== undefined &&
    row?.drawn !== undefined &&
    row?.lost !== undefined &&
    row?.played !== undefined
  ) {
    const sum = Number(row.won) + Number(row.drawn) + Number(row.lost);
    if (sum !== Number(row.played)) {
      v.addError(
        `${prefix}played`,
        `Inconsistência: vitórias (${row.won}) + empates (${row.drawn}) + derrotas (${row.lost}) = ${sum}, mas jogos = ${row.played}.`,
      );
    }
  }

  return { errors: v.getErrors() };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function isUuid(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

export async function standingsPublicRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/standings — classificação da primeira competição ativa
  app.get('/classificacoes', async (_request, reply) => {
    const competition = await prisma.competition.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true },
    });

    if (!competition) {
      return reply.send([]);
    }

    const table = await prisma.standingEntry.findMany({
      where: { competitionId: competition.id },
      orderBy: { position: 'asc' },
    });
    return reply.send(table.map(withGoalDifference));
  });

  // GET /api/standings/category/:categorySlug — todas as tabelas de uma categoria
  // Retorna array de { competition: { id, name, season }, standings: [...] }
  app.get('/classificacoes/category/:categorySlug', async (request, reply) => {
    const { categorySlug } = request.params as { categorySlug: string };

    const category = await prisma.category.findUnique({
      where: { slug: categorySlug },
      select: { id: true, name: true },
    });

    if (!category) {
      return reply.code(404).send({
        error: `Categoria com slug "${categorySlug}" não encontrada.`,
        hint: 'Use GET /api/categories para listar as categorias disponíveis.',
      });
    }

    const competitions = await prisma.competition.findMany({
      where: { categoryId: category.id, isActive: true, tableFormat: { not: 'friendly' } },
      orderBy: { createdAt: 'desc' },
    });

    if (competitions.length === 0) {
      return reply.send({ category: category.name, tables: [] });
    }

    const competitionIds = competitions.map((c) => c.id);

    const allStandings = await prisma.standingEntry.findMany({
      where: { competitionId: { in: competitionIds } },
      orderBy: { position: 'asc' },
    });

    const tables = competitions.map((comp) => ({
      competition: {
        id: comp.id,
        name: comp.name,
        season: comp.season,
        slug: slugify(comp.name),
        status: comp.status,
        isParticipating: comp.isParticipating,
      },
      standings: allStandings
        .filter((s) => s.competitionId === comp.id)
        .map(withGoalDifference),
    }));

    return reply.send({ category: category.name, tables });
  });

  // GET /api/standings/:competition — por UUID ou slug
  app.get('/classificacoes/:competition', async (request, reply) => {
    const { competition: competitionParam } = request.params as { competition: string };

    let competition;
    if (isUuid(competitionParam)) {
      competition = await prisma.competition.findUnique({
        where: { id: competitionParam },
        select: { id: true, name: true },
      });
    } else {
      const allCompetitions = await prisma.competition.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
      });
      competition = allCompetitions.find((c) => slugify(c.name) === competitionParam);
    }

    if (!competition) {
      return reply.code(404).send({
        error: `Competição "${competitionParam}" não encontrada.`,
        hint: 'Use GET /api/competitions para listar as competições disponíveis.',
      });
    }

    const table = await prisma.standingEntry.findMany({
      where: { competitionId: competition.id },
      orderBy: { position: 'asc' },
    });
    return reply.send(table.map(withGoalDifference));
  });
}

export async function standingsAdminRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdminAuth);

  // POST /api/admin/standings — upsert por posição
  app.post('/classificacoes', async (request, reply) => {
    const body = request.body as any;

    new Validator()
      .required('competitionId', body?.competitionId, 'competição')
      .throw();

    const { errors } = validateStandingRow(body);
    if (errors.length > 0) {
      return reply.code(422).send({ error: 'Dados inválidos.', details: errors });
    }

    // Verifica existência da competição
    const competition = await prisma.competition.findUnique({ where: { id: body.competitionId } });
    if (!competition) {
      return reply.code(422).send({
        error: `Competição com ID "${body.competitionId}" não encontrada.`,
        field: 'competitionId',
      });
    }

    const data = {
      teamName: body.teamName.trim(),
      logoUrl: body.logoUrl ?? null,
      teamId: body.teamId ?? null,
      opponentId: body.opponentId ?? null,
      points: body.points ?? 0,
      played: body.played ?? 0,
      won: body.won ?? 0,
      drawn: body.drawn ?? 0,
      lost: body.lost ?? 0,
      goalsFor: body.goalsFor ?? 0,
      goalsAgainst: body.goalsAgainst ?? 0,
      isOwnTeam: Boolean(body.isOwnTeam),
      form: body.form ?? null,
      zone: body.zone ?? 'NONE',
    };

    const groupName = body.groupName ?? null;

    const entry = await prisma.standingEntry.upsert({
      where: {
        competitionId_position_groupName: {
          competitionId: body.competitionId,
          position: Number(body.position),
          groupName,
        },
      },
      update: data,
      create: { competitionId: body.competitionId, position: Number(body.position), groupName, ...data },
    });
    return reply.code(201).send(withGoalDifference(entry));
  });

  // PUT /api/admin/standings/:competitionId/bulk
  app.put('/classificacoes/:competitionId/bulk', async (request, reply) => {
    const { competitionId } = request.params as { competitionId: string };
    const rows = request.body as any[];

    if (!Array.isArray(rows)) {
      return reply.code(422).send({
        error: 'O corpo da requisição deve ser um array de linhas da tabela.',
        hint: 'Envie um JSON array: [{ position, teamName, points, ... }, ...]',
      });
    }

    if (rows.length === 0) {
      return reply.code(422).send({ error: 'O array não pode ser vazio.' });
    }

    if (rows.length > 64) {
      return reply.code(422).send({
        error: `O array contém ${rows.length} linhas. O máximo permitido é 64.`,
      });
    }

    // Verifica existência da competição
    const competition = await prisma.competition.findUnique({ where: { id: competitionId } });
    if (!competition) {
      return reply.code(404).send({
        error: `Competição com ID "${competitionId}" não encontrada.`,
      });
    }

    // Valida todas as linhas e acumula erros
    const allErrors: { field: string; message: string; row: number }[] = [];
    for (let i = 0; i < rows.length; i++) {
      const { errors } = validateStandingRow(rows[i], i);
      allErrors.push(...errors.map((e) => ({ ...e, row: i })));
    }

    if (allErrors.length > 0) {
      return reply.code(422).send({
        error: `${allErrors.length} erro(s) de validação encontrado(s) nas linhas da tabela.`,
        details: allErrors,
      });
    }

    // Verifica posições duplicadas (por grupo se grouped, senão global)
    if (competition.tableFormat === 'grouped') {
      const groupPosMap: Record<string, number[]> = {};
      for (const r of rows) {
        const g = r.groupName || '_ungrouped';
        if (!groupPosMap[g]) groupPosMap[g] = [];
        groupPosMap[g].push(Number(r.position));
      }
      for (const [g, positions] of Object.entries(groupPosMap)) {
        const dupes = positions.filter((p, i) => positions.indexOf(p) !== i);
        if (dupes.length > 0) {
          return reply.code(422).send({
            error: `Posições duplicadas no grupo "${g}": ${[...new Set(dupes)].join(', ')}.`,
          });
        }
      }
    } else {
      const positions = rows.map((r) => Number(r.position));
      const duplicates = positions.filter((p, i) => positions.indexOf(p) !== i);
      if (duplicates.length > 0) {
        return reply.code(422).send({
          error: `Posições duplicadas encontradas no payload: ${[...new Set(duplicates)].join(', ')}.`,
          hint: 'Cada posição deve ser única na tabela.',
        });
      }
    }

    // Verifica isOwnTeam — apenas um registro pode ter true
    const ownTeamCount = rows.filter((r) => Boolean(r.isOwnTeam)).length;
    if (ownTeamCount > 1) {
      return reply.code(422).send({
        error: `Apenas uma linha pode ter "isOwnTeam: true". Encontrado: ${ownTeamCount}.`,
      });
    }

    // Verifica limite de times por grupo (máx 10)
    if (competition.tableFormat === 'grouped') {
      const groupCounts: Record<string, number> = {};
      for (const r of rows) {
        const g = r.groupName || '_none';
        groupCounts[g] = (groupCounts[g] || 0) + 1;
      }
      for (const [g, count] of Object.entries(groupCounts)) {
        if (count > 10) {
          return reply.code(422).send({
            error: `O grupo "${g}" tem ${count} times. O máximo permitido é 10 por grupo.`,
          });
        }
      }
    }

    // Auto-cria adversários para times manuais (sem opponentId)
    const enrichedRows = await Promise.all(rows.map(async (r) => {
      if (r.opponentId || !r.teamName?.trim()) return r;
      const existing = await prisma.opponent.findFirst({ where: { name: r.teamName.trim() } });
      if (existing) return { ...r, opponentId: existing.id, logoUrl: r.logoUrl || existing.logoUrl };
      const newOpp = await prisma.opponent.create({ data: { name: r.teamName.trim(), logoUrl: r.logoUrl ?? null } });
      return { ...r, opponentId: newOpp.id };
    }));

    const result = await prisma.$transaction(async (tx) => {
      await tx.standingEntry.deleteMany({ where: { competitionId } });
      return tx.standingEntry.createMany({
        data: enrichedRows.map((r) => ({
          competitionId,
          position: Number(r.position),
          teamName: String(r.teamName).trim(),
          logoUrl: r.logoUrl ?? null,
          teamId: r.teamId ?? null,
          opponentId: r.opponentId ?? null,
          points: r.points ?? 0,
          played: r.played ?? 0,
          won: r.won ?? 0,
          drawn: r.drawn ?? 0,
          lost: r.lost ?? 0,
          goalsFor: r.goalsFor ?? 0,
          goalsAgainst: r.goalsAgainst ?? 0,
          isOwnTeam: Boolean(r.isOwnTeam),
          form: r.form ?? null,
          zone: r.zone ?? 'NONE',
          groupName: r.groupName ?? null,
        })),
      });
    });

    return reply.send({
      message: `Tabela da competição "${competition.name}" atualizada com ${result.count} linhas.`,
      count: result.count,
    });
  });

  app.delete('/classificacoes/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    await prisma.standingEntry.delete({ where: { id } });
    return reply.send({ message: 'Linha da tabela deletada com sucesso.' });
  });

  // POST /api/admin/standings/logo — upload de logo do time para classificação
  app.post('/classificacoes/logo', { preHandler: [uploadTeamLogo] }, async (request, reply) => {
    if (!request.uploadedFile) return reply.code(400).send({ error: 'Nenhuma imagem enviada.' });
    return reply.send({ logoUrl: request.uploadedFile.path });
  });
}