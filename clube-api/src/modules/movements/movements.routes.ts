// src/modules/movements/movements.routes.ts
import type { FastifyInstance } from 'fastify';
import { prisma } from '../../shared/database/prisma';
import { requireAdminAuth } from '../../shared/plugins/admin-auth.plugin';
import { Validator, sanitizePagination, VALID_MOVEMENT_TYPES } from '../../shared/validation';
import type { MovementType } from '@prisma/client';

const movementInclude = {
  squadMember: {
    select: {
      id: true,
      name: true,
      photoUrl: true,
      shirtNumber: true,
      category: { select: { id: true, name: true, slug: true, gender: true, modality: true } },
    },
  },
  category: { select: { id: true, name: true, slug: true, gender: true, modality: true } },
  club: { select: { id: true, name: true, logoUrl: true } },
  opponent: { select: { id: true, name: true, shortName: true, logoUrl: true } },
} as const;

// Tipos cujo clube de origem/destino faz sentido
const TYPES_WITH_CLUB: MovementType[] = ['ARRIVAL', 'DEPARTURE', 'LOAN_OUT', 'LOAN_IN'];
// Tipos que representam receita (entrada de caixa)
const INCOME_TYPES: MovementType[] = ['DEPARTURE', 'LOAN_OUT'];

export async function movementsPublicRoutes(app: FastifyInstance): Promise<void> {
  app.get('/movimentacoes/recent', async (request, reply) => {
    const { limit, type, category, archived } = request.query as { limit?: string; type?: string; category?: string; archived?: string };

    if (type) {
      new Validator()
        .oneOf('type', type, VALID_MOVEMENT_TYPES, 'tipo de movimentação')
        .throw();
    }

    const take = limit ? Math.min(Math.max(Number(limit) || 10, 1), 500) : 10;

    const where: any = {};
    if (type) where.type = type;
    if (archived === 'true') {
      where.isArchived = true;
    } else if (archived !== 'all') {
      where.isArchived = false;
    }
    if (category) {
      where.OR = [
        { category: { slug: category } },
        { squadMember: { category: { slug: category } } },
      ];
    }

    const movements = await prisma.playerMovement.findMany({
      where,
      include: movementInclude,
      orderBy: { date: 'desc' },
      take,
    });
    return reply.send(movements);
  });

  app.get('/elenco/:squadMemberId/movimentacoes', async (request, reply) => {
    const { squadMemberId } = request.params as { squadMemberId: string };

    // Verifica se o jogador existe antes de retornar lista vazia silenciosamente
    const player = await prisma.squadMember.findUnique({
      where: { id: squadMemberId },
      select: { id: true, name: true },
    });
    if (!player) {
      return reply.code(404).send({
        error: `Jogador com ID "${squadMemberId}" não encontrado.`,
        hint: 'Use GET /api/squad?category=<slug> para listar os jogadores disponíveis.',
      });
    }

    const movements = await prisma.playerMovement.findMany({
      where: { squadMemberId },
      include: movementInclude,
      orderBy: { date: 'desc' },
    });
    return reply.send(movements);
  });
}

export async function movementsAdminRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAdminAuth);

  // GET /admin/movements/finance — resumo financeiro consolidado (filtro por temporada)
  app.get('/movimentacoes/finance', async (request, reply) => {
    const { season } = request.query as { season?: string };

    const where: any = {};
    if (season) where.season = season;

    const movements = await prisma.playerMovement.findMany({
      where,
      select: {
        type: true,
        valueCents: true,
        loanValueCents: true,
        isFreeLoan: true,
        paysSalary: true,
        corinthiansPercentage: true,
        soldPercentage: true,
        playerPercentage: true,
      },
    });

    const revenue = movements
      .filter((m) => m.type === 'DEPARTURE')
      .reduce((sum, m) => sum + (m.valueCents ? Number(m.valueCents) : 0), 0);

    const expenses = movements
      .filter((m) => m.type === 'ARRIVAL')
      .reduce((sum, m) => sum + (m.valueCents ? Number(m.valueCents) : 0), 0);

    const loanInValue = movements
      .filter((m) => m.type === 'LOAN_IN')
      .reduce((sum, m) => sum + (m.loanValueCents ? Number(m.loanValueCents) : 0), 0);

    const loanOutValue = movements
      .filter((m) => m.type === 'LOAN_OUT')
      .reduce((sum, m) => sum + (m.loanValueCents ? Number(m.loanValueCents) : 0), 0);

    const freeLoansCount = movements.filter((m) => m.type === 'LOAN_OUT' && m.isFreeLoan).length;
    const paidLoansCount = movements.filter((m) => m.type === 'LOAN_OUT' && !m.isFreeLoan).length;
    const salaryPayersCount = movements.filter((m) => m.paysSalary).length;

    const totalDepartures = movements.filter((m) => m.type === 'DEPARTURE').length;
    const totalArrivals = movements.filter((m) => m.type === 'ARRIVAL').length;
    const totalLoanOut = movements.filter((m) => m.type === 'LOAN_OUT').length;
    const totalLoanIn = movements.filter((m) => m.type === 'LOAN_IN').length;
    const totalReturns = movements.filter((m) => m.type === 'RETURN').length;

    return reply.send({
      revenue,
      expenses,
      netRevenue: revenue - expenses,
      loanInValue,
      loanOutValue,
      freeLoansCount,
      paidLoansCount,
      salaryPayersCount,
      totalDepartures,
      totalArrivals,
      totalLoanOut,
      totalLoanIn,
      totalReturns,
      totalMovements: movements.length,
    });
  });

  app.get('/movimentacoes', async (request, reply) => {
    const { page, limit, squadMemberId, archived, category, season, search } = request.query as {
      page?: string; limit?: string; squadMemberId?: string; archived?: string; category?: string; season?: string; search?: string;
    };

    const { skip, take, page: p } = sanitizePagination(page, limit, 100);

    const where: any = {};
    if (squadMemberId) where.squadMemberId = squadMemberId;
    if (season) where.season = season;
    if (archived === 'true') {
      where.isArchived = true;
    } else if (archived !== 'all') {
      where.isArchived = false;
    }
    if (category) {
      where.category = { slug: category };
    }
    if (search && search.trim() !== '') {
      where.playerName = { contains: search.trim(), mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      prisma.playerMovement.findMany({
        where,
        include: movementInclude,
        orderBy: { date: 'desc' },
        skip,
        take,
      }),
      prisma.playerMovement.count({ where }),
    ]);
    return reply.send({ data, total, page: p, limit: take, totalPages: Math.ceil(total / take) });
  });

  app.post('/movimentacoes', async (request, reply) => {
    const body = request.body as any;

    new Validator()
      .required('squadMemberId', body?.squadMemberId, 'jogador')
      .required('type', body?.type, 'tipo')
      .oneOf('type', body?.type, VALID_MOVEMENT_TYPES, 'tipo')
      .required('date', body?.date, 'data')
      .isoDate('date', body?.date, 'data')
      .string('notes', body?.notes, { max: 500, label: 'observações' })
      .currencyCode('currency', body?.currency)
      .throw();

    // Valor financeiro — opcional, mas se enviado deve ser centavos positivos
    if (body.valueCents !== undefined && body.valueCents !== null) {
      new Validator().centValue('valueCents', body.valueCents, 'valor em centavos').throw();
    }

    // RETURN normalmente não tem clube nem valor
    const type = body.type as MovementType;
    if (type === 'RETURN' && body.clubId) {
      return reply.code(422).send({
        error: 'Movimentações do tipo RETURN não devem ter clube associado.',
        hint: 'O campo "clubId" deve ser omitido ou nulo em retornos de empréstimo.',
        field: 'clubId',
      });
    }

    // Clube obrigatório para tipos que representam negociação
    if (TYPES_WITH_CLUB.includes(type) && !body.clubId && !body.opponentId) {
      return reply.code(422).send({
        error: `Movimentações do tipo "${type}" devem ter um clube associado.`,
        field: 'clubId',
        hint: 'Use GET /api/transfer-clubs para listar os clubes ou crie um novo em POST /api/admin/transfer-clubs.',
      });
    }

    // Verifica existência do jogador
    const player = await prisma.squadMember.findUnique({
      where: { id: body.squadMemberId },
      select: { id: true, name: true, isActive: true, photoUrl: true, categoryId: true },
    });
    if (!player) {
      return reply.code(422).send({
        error: `Jogador com ID "${body.squadMemberId}" não encontrado.`,
        field: 'squadMemberId',
        hint: 'Use GET /api/admin/squad para listar os jogadores.',
      });
    }

    // Alerta se jogador estiver inativo (não bloqueia — pode ser movimento de saída)
    const warnings: string[] = [];
    if (!player.isActive && type === 'ARRIVAL') {
      warnings.push(`O jogador "${player.name}" está marcado como inativo. Considere reativá-lo após registrar a chegada.`);
    }

    // Verifica existência do clube de transferência se informado
    if (body.clubId) {
      const club = await prisma.transferClub.findUnique({ where: { id: body.clubId } });
      if (!club) {
        return reply.code(422).send({
          error: `Clube de transferência com ID "${body.clubId}" não encontrado.`,
          field: 'clubId',
          hint: 'Use GET /api/transfer-clubs para listar os clubes ou POST /api/admin/transfer-clubs para criar.',
        });
      }
    }

    // Evita registrar a mesma movimentação duas vezes (ex: duplo clique
    // no "salvar"). Cobre também o caso clubId nulo, que o @@unique do
    // banco não bloqueia (NULL nunca colide com NULL no Postgres).
    const duplicate = await prisma.playerMovement.findFirst({
      where: {
        squadMemberId: body.squadMemberId,
        type: body.type as MovementType,
        date: new Date(body.date),
        AND: [
          { clubId: body.clubId ?? null },
          { opponentId: body.opponentId ?? null },
        ],
      },
      select: { id: true },
    });
    if (duplicate) {
      return reply.code(409).send({
        error: 'Já existe uma movimentação igual cadastrada para este jogador (mesmo tipo, data, clube e adversário).',
        conflictId: duplicate.id,
        hint: 'Se for um caso legítimo de duplicidade (raro), edite a movimentação existente em vez de criar outra.',
      });
    }

    const movement = await prisma.playerMovement.create({
      data: {
        squadMemberId: body.squadMemberId,
        playerName: player.name,
        playerPhotoUrl: player.photoUrl ?? null,
        categoryId: player.categoryId ?? body.categoryId ?? null,
        type: body.type as MovementType,
        date: new Date(body.date),
        clubId: body.clubId ?? null,
        opponentId: body.opponentId ?? null,
        notes: body.notes?.trim() ?? null,
        season: body.season || String(new Date(body.date).getFullYear()),
        ...(body.valueCents !== undefined && body.valueCents !== null && {
          valueCents: BigInt(String(body.valueCents)),
        }),
        ...(body.currency && { currency: body.currency.toUpperCase() }),
        ...(body.isFreeLoan !== undefined && { isFreeLoan: Boolean(body.isFreeLoan) }),
        ...(body.paysSalary !== undefined && { paysSalary: Boolean(body.paysSalary) }),
        ...(body.loanValueCents !== undefined && body.loanValueCents !== null && {
          loanValueCents: BigInt(String(body.loanValueCents)),
        }),
        ...(body.returnDate && { returnDate: new Date(body.returnDate) }),
        ...(body.corinthiansPercentage !== undefined && { corinthiansPercentage: body.corinthiansPercentage !== null ? Number(body.corinthiansPercentage) : null }),
        ...(body.soldPercentage !== undefined && { soldPercentage: body.soldPercentage !== null ? Number(body.soldPercentage) : null }),
        ...(body.playerPercentage !== undefined && { playerPercentage: body.playerPercentage !== null ? Number(body.playerPercentage) : null }),
      },
      include: movementInclude,
    });

    // ── Efeito colateral: alterar status do elenco ──
    // DEPARTURE = venda → jogador é removido do elenco
    // LOAN_OUT = empréstimo → jogador fica inativo
    // RETURN = retorno → jogador é reativado
    const movementType = body.type as MovementType;
    if (movementType === 'DEPARTURE') {
      await prisma.squadMember.delete({ where: { id: body.squadMemberId } }).catch(() => {});
    } else if (movementType === 'LOAN_OUT') {
      await prisma.squadMember.update({ where: { id: body.squadMemberId }, data: { isActive: false } }).catch(() => {});
    } else if (movementType === 'RETURN') {
      await prisma.squadMember.update({ where: { id: body.squadMemberId }, data: { isActive: true } }).catch(() => {});
    }

    return reply.code(201).send(warnings.length > 0 ? { ...movement, warnings } : movement);
  });

  app.patch('/movimentacoes/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;

    if (!body || Object.keys(body).length === 0) {
      return reply.code(422).send({
        error: 'Nenhum campo enviado para atualização.',
        hint: 'Envie ao menos um campo: type, date, clubId, notes, valueCents ou currency.',
      });
    }

    new Validator()
      .oneOf('type', body.type, VALID_MOVEMENT_TYPES, 'tipo')
      .isoDate('date', body.date, 'data')
      .string('notes', body.notes, { max: 500, label: 'observações' })
      .currencyCode('currency', body.currency)
      .throw();

    if (body.valueCents !== undefined && body.valueCents !== null) {
      new Validator().centValue('valueCents', body.valueCents, 'valor em centavos').throw();
    }

    // Se clube foi fornecido, verifica existência
    if (body.clubId) {
      const club = await prisma.transferClub.findUnique({ where: { id: body.clubId } });
      if (!club) {
        return reply.code(422).send({
          error: `Clube de transferência com ID "${body.clubId}" não encontrado.`,
          field: 'clubId',
        });
      }
    }

    const movement = await prisma.playerMovement.update({
      where: { id },
      data: {
        ...(body.type && { type: body.type as MovementType }),
        ...(body.date && { date: new Date(body.date) }),
        ...(body.clubId !== undefined && { clubId: body.clubId }),
        ...(body.opponentId !== undefined && { opponentId: body.opponentId }),
        ...(body.notes !== undefined && { notes: body.notes?.trim() ?? null }),
        ...(body.season !== undefined && { season: body.season }),
        ...(body.valueCents !== undefined && {
          valueCents: body.valueCents === null ? null : BigInt(String(body.valueCents)),
        }),
        ...(body.currency && { currency: body.currency.toUpperCase() }),
        ...(body.isFreeLoan !== undefined && { isFreeLoan: Boolean(body.isFreeLoan) }),
        ...(body.paysSalary !== undefined && { paysSalary: Boolean(body.paysSalary) }),
        ...(body.loanValueCents !== undefined && {
          loanValueCents: body.loanValueCents === null ? null : BigInt(String(body.loanValueCents)),
        }),
        ...(body.returnDate !== undefined && { returnDate: body.returnDate ? new Date(body.returnDate) : null }),
        ...(body.corinthiansPercentage !== undefined && { corinthiansPercentage: body.corinthiansPercentage !== null ? Number(body.corinthiansPercentage) : null }),
        ...(body.soldPercentage !== undefined && { soldPercentage: body.soldPercentage !== null ? Number(body.soldPercentage) : null }),
        ...(body.playerPercentage !== undefined && { playerPercentage: body.playerPercentage !== null ? Number(body.playerPercentage) : null }),
      },
      include: movementInclude,
    });

    // ── Efeito colateral: alterar status do elenco ao editar ──
    if (body.type) {
      const type = body.type as MovementType;
      const member = await prisma.squadMember.findUnique({ where: { id: movement.squadMemberId } });
      if (member) {
        if (type === 'DEPARTURE') {
          await prisma.squadMember.delete({ where: { id: movement.squadMemberId } }).catch(() => {});
        } else if (type === 'LOAN_OUT') {
          await prisma.squadMember.update({ where: { id: movement.squadMemberId }, data: { isActive: false } }).catch(() => {});
        } else if (type === 'RETURN') {
          await prisma.squadMember.update({ where: { id: movement.squadMemberId }, data: { isActive: true } }).catch(() => {});
        }
      }
    }

    return reply.send(movement);
  });

  app.delete('/movimentacoes/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    await prisma.playerMovement.delete({ where: { id } });
    return reply.send({ message: 'Movimentação deletada com sucesso.' });
  });

  app.patch('/movimentacoes/:id/archive', async (request, reply) => {
    const { id } = request.params as { id: string };
    const movement = await prisma.playerMovement.findUnique({ where: { id } });
    if (!movement) {
      return reply.code(404).send({ error: 'Movimentação não encontrada.' });
    }
    const updated = await prisma.playerMovement.update({
      where: { id },
      data: { isArchived: true },
      include: movementInclude,
    });
    return reply.send(updated);
  });

  app.patch('/movimentacoes/:id/unarchive', async (request, reply) => {
    const { id } = request.params as { id: string };
    const movement = await prisma.playerMovement.findUnique({ where: { id } });
    if (!movement) {
      return reply.code(404).send({ error: 'Movimentação não encontrada.' });
    }
    const updated = await prisma.playerMovement.update({
      where: { id },
      data: { isArchived: false },
      include: movementInclude,
    });
    return reply.send(updated);
  });
}