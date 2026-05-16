// V84 · test que confirma que el projecte SOS apareix al kanban backlog
// Veure `docs/backlog.json` · project_id = 'sos-dev-internal'

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { _setCacheForTests, queryWos, getStats, getCachedBacklog } from '../core/agentBacklogLoader.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== V84 · SOS project visible al kanban backlog ===\n');

// Carrega backlog real des de fitxer · injecta a la cache
const backlog = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'docs/backlog.json'), 'utf8'));
_setCacheForTests(backlog);

// ─── A · projecte SOS present al backlog ─────────────────────────────────
eq(backlog.project_id, 'sos-dev-internal',               'A · backlog.project_id és sos-dev-internal');
const sosWOs = queryWos({ projectId: 'sos-dev-internal' });
t(sosWOs.length >= 30,                                   'A · ≥30 WOs del projecte SOS (got ' + sosWOs.length + ')');

// ─── B · stats globals · projecte SOS és el cor ─────────────────────────
const stats = getStats();
t(stats && typeof stats === 'object',                    'B · getStats() retorna estadístiques');
eq(stats.total, sosWOs.length,                           'B · stats.total = total WOs SOS');
t(stats.counts && typeof stats.counts.pending === 'number', 'B · stats.counts amb tots els statuses');
t(typeof stats.totalEstimatedEur === 'number',           'B · stats.totalEstimatedEur present');

// ─── C · KanbanView · simula query del kanban ────────────────────────────
// El kanban filtra per status · backlog (status=pending) ha de tenir entrades
const pending = queryWos({ status: 'pending', projectId: 'sos-dev-internal' });
t(pending.length >= 10,                                  'C · ≥10 WOs pending (backlog del kanban · got ' + pending.length + ')');
const inProgress = queryWos({ status: 'in-progress', projectId: 'sos-dev-internal' });
t(inProgress.length >= 1,                                'C · ≥1 WO in-progress (columna kanban · got ' + inProgress.length + ')');
const done = queryWos({ status: 'done', projectId: 'sos-dev-internal' });
t(done.length >= 10,                                     'C · ≥10 WOs done (columna kanban · got ' + done.length + ')');

// ─── D · WOs del sprint V2-EVOL visibles al backlog ──────────────────────
const v2Evol = queryWos({ tag: 'batch-7-v2-evol', projectId: 'sos-dev-internal' });
t(v2Evol.length >= 5,                                    'D · ≥5 WOs batch-7-v2-evol (sprint actual · got ' + v2Evol.length + ')');
const critical = queryWos({ tag: 'pre-alpha' });
t(critical.some(w => w.priority === 'critical'),         'D · WOs critical pre-alpha presents');

// ─── E · les 5 WOs noves d'aquest sprint son al backlog ─────────────────
const expectedNewIds = [
    'wo-quality-view-v2-integration-001',
    'wo-creation-completeness-guarantee-001',
    'wo-roles-casteller-categorization-001',
    'wo-value-flow-soc-sequencing-001',
    'wo-ia-context-audit-001',
];
const allIds = new Set(backlog.work_orders.map(w => w.id));
for (const id of expectedNewIds) {
    t(allIds.has(id),                                    'E · ' + id + ' present');
}

// ─── F · cap WO sense projecte SOS · cap fora del scope ─────────────────
const orphans = backlog.work_orders.filter(w => w.project_id !== 'sos-dev-internal');
eq(orphans.length, 0,                                    'F · cap WO òrfena · totes al projecte SOS');

// ─── G · WOs critical pendents per a alfa (prioritat per al kanban) ─────
const criticalPending = queryWos({ status: 'pending' }).filter(w => w.priority === 'critical');
t(criticalPending.length >= 3,                           'G · ≥3 WOs critical pendents (focus alfa · got ' + criticalPending.length + ')');
console.log('  → Critical pending:');
for (const w of criticalPending.slice(0, 8)) {
    console.log('    [' + w.priority + ' · ' + w.complexity + '] ' + w.id + ' · ' + w.title.slice(0, 75));
}

// ─── H · cache invalidation works ────────────────────────────────────────
const cached = getCachedBacklog();
t(cached && cached.work_orders.length === backlog.work_orders.length, 'H · cache populated correctly');

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
