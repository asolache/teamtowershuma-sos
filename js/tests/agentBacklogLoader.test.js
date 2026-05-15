// AGENT-BRIDGE-001 sprint B · tests del loader · valida contra el JSON real
// Ús · node js/tests/agentBacklogLoader.test.js

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateBacklog, computeBacklogStats } from '../core/agentBridgeSchema.js';
import { _setCacheForTests, queryWos, queryAgents, getStats } from '../core/agentBacklogLoader.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const JSON_PATH = join(__dirname, '..', '..', 'docs', 'backlog.json');

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== AGENT-BRIDGE-001 sprint B · loader vs real backlog.json ===\n');

// 1 · Carrega backlog.json real (generat per scripts/backlog-yaml-to-json.js)
const raw = JSON.parse(readFileSync(JSON_PATH, 'utf8'));
t(raw && typeof raw === 'object',                       'A · backlog.json existeix i parsa');

// 2 · Validació estricte contra schema
const v = validateBacklog(raw);
eq(v.ok, true,                                          'A · validateBacklog(real) · ok');
if (!v.ok) console.error(v.errors);

// 3 · Stats coherents
const stats = computeBacklogStats(v.normalized);
t(stats.total >= 10,                                   `A · ≥10 WOs · ${stats.total}`);
t(stats.agentCount >= 3,                               `A · ≥3 agents · ${stats.agentCount}`);
t(typeof stats.totalEstimatedEur === 'number' && stats.totalEstimatedEur > 0, `A · cost estimat > 0 · ${stats.totalEstimatedEur}€`);

// 4 · Cada WO referencia un agent (si claimed) que existeix al catàleg
const agentIds = new Set(v.normalized.agents.map(a => a.id));
const orphanClaims = v.normalized.work_orders.filter(wo => wo.claimed_by && !agentIds.has(wo.claimed_by));
eq(orphanClaims.length, 0,                              'B · sense WO claimed per agent no-registrat');

// 5 · queryWos · filtres
_setCacheForTests(v.normalized);
const pending = queryWos({ status: 'pending' });
t(pending.length >= 1,                                  `C · queryWos · pending · ${pending.length}`);
const inProgress = queryWos({ status: 'in-progress' });
t(inProgress.length >= 1,                               `C · queryWos · in-progress (Sprint A actiu) · ${inProgress.length}`);
const claudeWos = queryWos({ assignee_kind: 'ai-claude' });
t(claudeWos.length >= 1,                                `C · queryWos · ai-claude · ${claudeWos.length}`);
const batch1Wos = queryWos({ tag: 'batch-1' });
t(batch1Wos.length >= 4,                                `C · queryWos · tag batch-1 · ${batch1Wos.length}`);

// 6 · queryAgents · active vs all
const activeAgents = queryAgents({});
t(activeAgents.length >= 2,                            `D · queryAgents · active · ${activeAgents.length}`);
const allAgents = queryAgents({ activeOnly: false });
eq(allAgents.length, v.normalized.agents.length,       'D · queryAgents activeOnly=false · tots');
const claudeAgents = queryAgents({ kind: 'ai-claude' });
t(claudeAgents.length >= 1,                            'D · queryAgents · kind ai-claude · ≥1');

// 7 · getStats sync
const cachedStats = getStats();
eq(cachedStats.total, stats.total,                      'E · getStats coincideix amb computeStats');

// 8 · Verificar el primer WO té forma correcta
const firstActive = v.normalized.work_orders.find(w => w.id === 'wo-agent-bridge-001-a');
t(firstActive,                                          'F · WO agent-bridge-001-a existeix');
eq(firstActive.status, 'in-progress',                   'F · marcat in-progress');
eq(firstActive.claimed_by, 'agent-claude-code',         'F · claimed_by · agent-claude-code');
t(firstActive.deliverable_test && firstActive.deliverable_test.kind === 'test-suite',
   'F · deliverable_test · test-suite');

// 9 · Tots els agents tenen capabilities array
const allHaveCaps = v.normalized.agents.every(a => Array.isArray(a.capabilities) && a.capabilities.length > 0);
t(allHaveCaps,                                          'G · tots agents amb capabilities');

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
