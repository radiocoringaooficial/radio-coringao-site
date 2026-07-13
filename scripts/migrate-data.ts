/**
 * Migra dados local → produção (Neon).
 * Uso: npx tsx scripts/migrate-data.ts sports-news | clube
 */

import { Client } from 'pg';

const PROJECT = process.argv[2] as 'sports-news' | 'clube';

const URLS = {
  'sports-news': {
    src: 'postgresql://postgres:postgres@localhost:5440/sports_news',
    dst: 'postgresql://neondb_owner:npg_tSja7ud1IiRF@ep-solitary-unit-acurdoty-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require',
  },
  clube: {
    src: 'postgresql://postgres:postgres@localhost:5441/clube_db',
    dst: 'postgresql://neondb_owner:npg_ae1wiN6nqjOf@ep-damp-dream-accpghkf-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require',
  },
};

interface TableDef {
  table: string;
  uniqueKey?: string;
  fks?: { col: string; ref: string; refKey: string; selfRef?: boolean; refValueCol?: string }[];
  /** Colunas extras pra ORDER BY antes de insert (pra resolver self-refs) */
  orderBy?: string;
}

const SN_TABLES: TableDef[] = [
  { table: 'users', uniqueKey: 'email' },
  { table: 'categories', uniqueKey: 'name', orderBy: 'parent_id', fks: [{ col: 'parent_id', ref: 'categories', refKey: 'name', selfRef: true }] },
  { table: 'tags', uniqueKey: 'name' },
  { table: 'banners' },
  { table: 'site_settings' },
  { table: 'footer_links' },
  { table: 'sponsors' },
  { table: 'events', uniqueKey: 'slug' },
  { table: 'newsletter_subscribers', uniqueKey: 'email' },
  { table: 'articles', uniqueKey: 'slug', fks: [
    { col: 'authorId', ref: 'users', refKey: 'email' },
    { col: 'categoryId', ref: 'categories', refKey: 'name' },
  ]},
  { table: 'article_images', fks: [{ col: 'articleId', ref: 'articles', refKey: 'slug' }] },
  { table: 'article_views', fks: [{ col: 'articleId', ref: 'articles', refKey: 'slug' }] },
  { table: 'article_tags', uniqueKey: null, fks: [
    { col: 'articleId', ref: 'articles', refKey: 'slug' },
    { col: 'tagId', ref: 'tags', refKey: 'name' },
  ]},
  { table: 'menu_items', orderBy: 'parentId', fks: [{ col: 'parentId', ref: 'menu_items', refKey: 'label', selfRef: true }] },
  { table: 'event_images', fks: [{ col: 'eventId', ref: 'events', refKey: 'slug' }] },
  { table: 'event_categories' },
  { table: 'event_items', fks: [{ col: 'eventCategoryId', ref: 'event_categories', refKey: 'name', selfRef: true }] },
  { table: 'comments', fks: [{ col: 'articleId', ref: 'articles', refKey: 'slug' }] },
  { table: 'refresh_tokens', fks: [{ col: 'userId', ref: 'users', refKey: 'email' }] },
];

const CL_TABLES: TableDef[] = [
  { table: 'team' },
  { table: 'categories', uniqueKey: 'name', orderBy: 'parentId' },
  { table: 'opponents', uniqueKey: 'name' },
  { table: 'transfer_clubs', uniqueKey: 'name' },
  { table: 'competitions', fks: [{ col: 'categoryId', ref: 'categories', refKey: 'name' }] },
  { table: 'squad_members', fks: [{ col: 'categoryId', ref: 'categories', refKey: 'name' }] },
  { table: 'opponent_categories', fks: [
    { col: 'opponentId', ref: 'opponents', refKey: 'name' },
    { col: 'categoryId', ref: 'categories', refKey: 'name' },
  ]},
  { table: 'matches', fks: [
    { col: 'competitionId', ref: 'competitions', refKey: 'id' },
    { col: 'opponentId', ref: 'opponents', refKey: 'name' },
  ]},
  { table: 'player_movements', fks: [
    { col: 'squadMemberId', ref: 'squad_members', refKey: 'id' },
    { col: 'categoryId', ref: 'categories', refKey: 'name' },
    { col: 'clubId', ref: 'transfer_clubs', refKey: 'name' },
    { col: 'opponentId', ref: 'opponents', refKey: 'name' },
  ]},
  { table: 'standing_entries', fks: [
    { col: 'competitionId', ref: 'competitions', refKey: 'id' },
    { col: 'opponentId', ref: 'opponents', refKey: 'name' },
  ]},
];

const TABLES = PROJECT === 'sports-news' ? SN_TABLES : CL_TABLES;
const urls = URLS[PROJECT];

async function tableExists(c: Client, t: string) {
  return (await c.query(`SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1)`, [t])).rows[0]?.exists ?? false;
}
async function getCount(c: Client, t: string) {
  return Number((await c.query(`SELECT COUNT(*) as c FROM "${t}"`)).rows[0]?.c ?? 0);
}
async function getColumns(c: Client, t: string) {
  return (await c.query(`SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`, [t])).rows.map((x: any) => x.column_name);
}
async function getAllRows(c: Client, t: string, orderBy?: string) {
  const order = orderBy ? ` ORDER BY "${orderBy}" NULLS FIRST` : '';
  return (await c.query(`SELECT * FROM "${t}"${order}`)).rows;
}
async function findTargetId(target: Client, table: string, uniqueCol: string, value: any): Promise<string | null> {
  if (value === null || value === undefined) return null;
  const r = await target.query(`SELECT id FROM "${table}" WHERE "${uniqueCol}" = $1 LIMIT 1`, [String(value)]);
  return r.rows[0]?.id ?? null;
}

async function main() {
  console.log(`\n🔄 Migrando: ${PROJECT}\n`);
  const source = new Client({ connectionString: urls.src });
  const target = new Client({ connectionString: urls.dst });
  await source.connect(); console.log('✅ Local');
  await target.connect(); console.log('✅ Produção\n');

  const idMaps: Record<string, Map<string, string>> = {};
  const srcIdCache: Record<string, Map<string, any>> = {};
  const summary: { table: string; local: number; migrated: number }[] = [];

  for (const td of TABLES) {
    const { table, uniqueKey, fks, orderBy } = td;
    if (!(await tableExists(source, table))) { console.log(`⏭️  ${table}: não existe`); continue; }
    const localCount = await getCount(source, table);
    if (localCount === 0) { console.log(`⏭️  ${table}: 0 registros`); summary.push({ table, local: 0, migrated: 0 }); continue; }

    const srcCols = await getColumns(source, table);
    const rows = await getAllRows(source, table, orderBy);

    // ── Resolve FKs ──
    if (fks?.length) {
      for (const row of rows) {
        for (const fk of fks) {
          if (!srcCols.includes(fk.col)) continue;
          const localFkVal = row[fk.col];
          if (!localFkVal) continue;

          let lookupVal = localFkVal;
          if (fk.selfRef) {
            const parentRow = rows.find((r) => r.id === localFkVal);
            lookupVal = parentRow?.[fk.refKey] || localFkVal;
          } else if (fk.refKey !== 'id') {
            // FK value is an ID but we need the refKey value (email/name/slug)
            const cacheKey = `${fk.ref}:${fk.refKey}`;
            if (!srcIdCache[cacheKey]) {
              srcIdCache[cacheKey] = new Map();
              const refCols = await getColumns(source, fk.ref);
              if (refCols.includes('id') && refCols.includes(fk.refKey)) {
                const refRows = await source.query(`SELECT id, "${fk.refKey}" FROM "${fk.ref}"`);
                for (const rr of refRows.rows) srcIdCache[cacheKey].set(String(rr.id), rr[fk.refKey]);
              }
            }
            lookupVal = srcIdCache[cacheKey].get(String(localFkVal)) || localFkVal;
          }

          const refMap = idMaps[fk.ref];
          if (refMap) {
            let targetId = refMap.get(String(lookupVal));
            if (!targetId && fk.refKey !== 'id') {
              targetId = await findTargetId(target, fk.ref, fk.refKey, lookupVal);
            }
            if (targetId) row[fk.col] = targetId;
          } else if (fk.selfRef && fk.refKey !== 'id') {
            // Self-ref before idMap is built: query target directly
            const targetId = await findTargetId(target, fk.ref, fk.refKey, lookupVal);
            if (targetId) row[fk.col] = targetId;
          }
        }
      }
    }

    // ── Insert ──
    const hasId = srcCols.includes('id');
    let conflictCols: string;
    if (hasId) {
      const conflictCol = uniqueKey || 'id';
      conflictCols = srcCols.includes(conflictCol) ? `("${conflictCol}")` : '("id")';
    } else {
      // Composite PK or no PK: find unique constraint
      const uqRes = await target.query(
        `SELECT a.attname AS col_name
         FROM pg_constraint c JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=ANY(c.conkey)
         WHERE c.conrelid=$1::regclass AND c.contype='p'
         ORDER BY array_position(c.conkey, a.attnum)`, [table]);
      if (uqRes.rows.length > 0) {
        conflictCols = `(${uqRes.rows.map((r: any) => `"${r.col_name}"`).join(', ')})`;
      } else {
        conflictCols = `("${srcCols[0]}")`;
      }
    }
    const colList = srcCols.map((c) => `"${c}"`).join(', ');
    const conflictColNames = conflictCols.replace(/[()"]/g, '').split(', ');
    const updateCols = srcCols.filter((c) => !conflictColNames.includes(c));
    const doUpdate = updateCols.length > 0
      ? `DO UPDATE SET ${updateCols.map((c) => `"${c}" = EXCLUDED."${c}"`).join(', ')}`
      : 'DO NOTHING';

    console.log(`📥 ${table}: ${localCount} registros`);

    let inserted = 0;
    const BATCH = 50;
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      const allVals: any[] = [];
      const phs: string[] = [];
      for (const row of batch) {
        const vals = srcCols.map((c) => {
          let v = row[c];
          if (v === undefined || v === null) return null;
          if (typeof v === 'object') return JSON.stringify(v);
          return v;
        });
        allVals.push(...vals);
        phs.push(`(${vals.map((_, j) => `$${allVals.length - vals.length + j + 1}`).join(', ')})`);
      }
      try {
        await target.query(`INSERT INTO "${table}" (${colList}) VALUES ${phs.join(', ')} ON CONFLICT ${conflictCols} ${doUpdate}`, allVals);
        inserted += batch.length;
      } catch {
        for (const row of batch) {
          try {
            const vals = srcCols.map((c) => {
              let v = row[c];
              if (v === undefined || v === null) return null;
              if (typeof v === 'object') return JSON.stringify(v);
              return v;
            });
            const ph = vals.map((_, j) => `$${j + 1}`).join(', ');
            await target.query(`INSERT INTO "${table}" (${colList}) VALUES (${ph}) ON CONFLICT ${conflictCols} ${doUpdate}`, vals);
            inserted++;
          } catch { /* skip */ }
        }
      }
    }

    // ── Build ID map ──
    if (uniqueKey && inserted > 0) {
      idMaps[table] = new Map();
      for (const row of rows) {
        const uv = row[uniqueKey];
        if (uv) {
          const tid = await findTargetId(target, table, uniqueKey, uv);
          if (tid) idMaps[table].set(String(uv), tid);
        }
      }
    } else if (inserted > 0) {
      idMaps[table] = new Map();
      for (const row of rows) {
        if (row.id) idMaps[table].set(String(row.id), String(row.id));
      }
    }

    console.log(`   ${inserted === localCount ? '✅' : '⚠️'} ${inserted}/${localCount}\n`);
    summary.push({ table, local: localCount, migrated: inserted });
  }

  console.log('━'.repeat(50));
  console.log('📊 RESUMO');
  console.log('━'.repeat(50));
  let tl = 0, tm = 0;
  for (const s of summary) {
    console.log(`   ${s.migrated === s.local ? '✅' : '⚠️'} ${s.table}: ${s.migrated}/${s.local}`);
    tl += s.local; tm += s.migrated;
  }
  console.log('━'.repeat(50));
  console.log(`   Total: ${tm}/${tl}`);
  console.log('━'.repeat(50));

  await source.end(); await target.end();
}

main().catch((err) => { console.error('❌', err); process.exit(1); });
