/**
 * Una base SQLite de verdad con las migraciones del repositorio, para probar el
 * código REAL del Worker.
 *
 * No es un simulacro de D1: las consultas, los disparadores, las restricciones y
 * las llaves foráneas son las que corren en producción (D1 es SQLite). Solo la
 * envoltura `prepare/bind/all/first/run` es un adaptador mínimo.
 *
 * Vive fuera de `*.test.ts` para poder compartirse, y fuera del tipado del Worker
 * (`tsconfig.worker.json` lo excluye) porque usa `node:sqlite`.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const MIGRACIONES = new URL('../../migraciones/', import.meta.url).pathname;

/** El adaptador mínimo de D1 sobre `node:sqlite`. */
export function d1(db: DatabaseSync): D1Database {
  const adaptado = {
    prepare(sql: string) {
      let parametros: unknown[] = [];
      const sentencia = {
        bind(...valores: unknown[]) {
          parametros = valores;
          return sentencia;
        },
        async all() {
          return { results: db.prepare(sql).all(...(parametros as never[])) };
        },
        async first() {
          return db.prepare(sql).get(...(parametros as never[])) ?? null;
        },
        async run() {
          const r = db.prepare(sql).run(...(parametros as never[]));
          return { meta: { changes: Number(r.changes) } };
        },
      };
      return sentencia;
    },
  };
  return adaptado as unknown as D1Database;
}

/** Una base nueva, en memoria, con todas las migraciones aplicadas. */
export function baseNueva(): { db: DatabaseSync; base: D1Database } {
  const db = new DatabaseSync(':memory:');
  for (const archivo of readdirSync(MIGRACIONES).filter((f) => f.endsWith('.sql')).sort()) {
    db.exec(readFileSync(join(MIGRACIONES, archivo), 'utf8'));
  }
  return { db, base: d1(db) };
}

export const peticion = (cuerpo: unknown): Request =>
  new Request('http://hub.prueba/', { method: 'POST', body: JSON.stringify(cuerpo) });
