// AGENT-BRIDGE-001 sprint A · tests stand-alone per agentBridgeSchema.
// Ús · node js/tests/agentBridge.test.js

import {
    validateWorkOrder, validateAgent, validateBacklog,
    matchAgentToWo, rankCandidates,
    claimWo, startWo, completeWo, blockWo,
    computeBacklogStats,
    AGENT_BRIDGE_VERSION, WO_STATUS, ASSIGNEE_KIND, AGENT_CAPABILITIES, DELIVERABLE_KIND,
} from '../core/agentBridgeSchema.js';

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== AGENT-BRIDGE-001 sprint A · agentBridgeSchema ===\n');

// 1 · Constants
t(typeof AGENT_BRIDGE_VERSION === 'string',            'A · version present');
t(WO_STATUS.includes('pending') && WO_STATUS.includes('done'), 'A · WO_STATUS pending+done');
t(ASSIGNEE_KIND.includes('ai-any') && ASSIGNEE_KIND.includes('human'), 'A · assignee kinds');
t(AGENT_CAPABILITIES.includes('code-write'),           'A · capabilities · code-write');
t(DELIVERABLE_KIND.includes('test-suite'),             'A · deliverable kinds');

// 2 · validateWorkOrder · happy path
const woOk = {
    id: 'wo-001',
    title: 'Implement schema',
    priority: 'critical',
    complexity: 'M',
    assignee_kind: 'ai-any',
    required_capabilities: ['code-write', 'test-run'],
    deliverable_test: { kind: 'test-suite', command: 'node test.js', expect: 'all-pass' },
    estimated_cost_eur: 0.05,
};
const r1 = validateWorkOrder(woOk);
eq(r1.ok, true,                                        'B · WO vàlid · ok');
eq(r1.errors.length, 0,                                'B · sense errors');
t(r1.normalized && r1.normalized.id === 'wo-001',     'B · normalized retornat');
eq(r1.normalized.status, 'pending',                    'B · default status · pending');
eq(r1.normalized.project_id, 'sos-dev-internal',       'B · default project_id');

// 3 · validateWorkOrder · errors
const r2 = validateWorkOrder({ title: 'no id' });
eq(r2.ok, false,                                       'B · sense id · fail');
t(r2.errors.some(e => e.includes('id')),               'B · error mentions id');

const r3 = validateWorkOrder({ id: 'wo-002', title: 'bad cap', required_capabilities: ['code-write', 'inventat'] });
eq(r3.ok, false,                                       'B · capability inexistent · fail');
t(r3.errors.some(e => e.includes('inventat')),         'B · error mentions inventat');

const r4 = validateWorkOrder({ id: 'wo-003', title: 'neg cost', estimated_cost_eur: -5 });
eq(r4.ok, false,                                       'B · cost negatiu · fail');

const r5 = validateWorkOrder({ id: 'wo-004', title: 'bad status', status: 'inventat' });
eq(r5.ok, false,                                       'B · status invàlid · fail');

// 4 · validateAgent
const agentOk = {
    id: 'agent-claude-code',
    name: 'Claude Code',
    kind: 'ai-claude',
    capabilities: ['code-write', 'test-run', 'git-commit', 'github-pr'],
    cost_per_hour_eur: 8,
};
const ar1 = validateAgent(agentOk);
eq(ar1.ok, true,                                       'C · agent vàlid · ok');
eq(ar1.normalized.active, true,                        'C · default active true');

const ar2 = validateAgent({ name: 'no id', kind: 'ai-claude', capabilities: [] });
eq(ar2.ok, false,                                      'C · agent sense id · fail');

// 5 · matchAgentToWo
const claudeAgent = ar1.normalized;
const gptAgent = validateAgent({
    id: 'agent-gpt', name: 'GPT', kind: 'ai-gpt',
    capabilities: ['text-generate', 'classify'],
}).normalized;

const woAiAny = validateWorkOrder({ id: 'wo-a', title: 'a', assignee_kind: 'ai-any', required_capabilities: ['code-write'] }).normalized;
eq(matchAgentToWo(claudeAgent, woAiAny), true,         'D · claude has code-write · matches ai-any');
eq(matchAgentToWo(gptAgent, woAiAny), false,           'D · gpt sense code-write · no match');

const woClaudeOnly = validateWorkOrder({ id: 'wo-b', title: 'b', assignee_kind: 'ai-claude', required_capabilities: [] }).normalized;
eq(matchAgentToWo(claudeAgent, woClaudeOnly), true,    'D · claude pot agafar ai-claude WO');
eq(matchAgentToWo(gptAgent, woClaudeOnly), false,      'D · gpt no pot agafar ai-claude WO');

const woSpecific = validateWorkOrder({ id: 'wo-c', title: 'c', assignee_kind: 'specific' }).normalized;
woSpecific.specific_agent_id = 'agent-gpt';
eq(matchAgentToWo(claudeAgent, woSpecific), false,     'D · specific agent · no match · diferent id');
eq(matchAgentToWo(gptAgent, woSpecific), true,         'D · specific agent · match · same id');

// 6 · rankCandidates · ordre per fitting
const woNeedsCode = validateWorkOrder({ id: 'wo-d', title: 'd', assignee_kind: 'ai-any', required_capabilities: ['code-write', 'test-run'] }).normalized;
const cheap = validateAgent({ id: 'a-cheap', name: 'Cheap', kind: 'ai-gpt', capabilities: ['code-write', 'test-run'], cost_per_hour_eur: 1 }).normalized;
const expensive = validateAgent({ id: 'a-exp', name: 'Exp', kind: 'ai-claude', capabilities: ['code-write', 'test-run'], cost_per_hour_eur: 100 }).normalized;
const ranked = rankCandidates(woNeedsCode, [cheap, expensive]);
eq(ranked.length, 2,                                   'E · 2 candidats vàlids');
t(ranked[0].score >= ranked[1].score,                  'E · score descendent');

// 7 · claimWo lifecycle
const woFresh = validateWorkOrder({ id: 'wo-life', title: 'lifecycle test', assignee_kind: 'ai-any' }).normalized;
const cl1 = claimWo(woFresh, 'agent-claude-code', { ts: 1700000000000 });
eq(cl1.ok, true,                                       'F · claim · ok');
eq(cl1.wo.status, 'claimed',                           'F · status → claimed');
eq(cl1.wo.claimed_by, 'agent-claude-code',             'F · claimed_by set');
eq(cl1.wo.claimed_at, 1700000000000,                   'F · claimed_at set');

const cl2 = claimWo(cl1.wo, 'other-agent');
eq(cl2.ok, false,                                      'F · re-claim · fails (no longer pending)');

const st1 = startWo(cl1.wo);
eq(st1.ok, true,                                       'F · start · ok');
eq(st1.wo.status, 'in-progress',                       'F · status → in-progress');

const comp = completeWo(st1.wo, { deliverable_uri: 'sha:abc', cost_actual_eur: 0.03, signature: 'ecdsa-xyz', ts: 1700000900000 });
eq(comp.ok, true,                                      'F · complete · ok');
eq(comp.wo.status, 'done',                             'F · status → done');
eq(comp.wo.deliverable_uri, 'sha:abc',                 'F · deliverable_uri set');
eq(comp.wo.cost_actual_eur, 0.03,                      'F · cost_actual_eur set');

const blk = blockWo(woFresh, 'depèn de WO-X');
eq(blk.wo.status, 'blocked',                           'F · block · ok');
t(blk.wo.notes.includes('BLOCKED'),                    'F · notes amb BLOCKED');

// 8 · validateBacklog · happy path
const backlogOk = {
    version: AGENT_BRIDGE_VERSION,
    work_orders: [
        { id: 'wo-1', title: 'Test 1', assignee_kind: 'ai-any' },
        { id: 'wo-2', title: 'Test 2', assignee_kind: 'ai-claude' },
    ],
    agents: [
        { id: 'agent-1', name: 'Claude', kind: 'ai-claude', capabilities: ['code-write'] },
    ],
};
const bl1 = validateBacklog(backlogOk);
eq(bl1.ok, true,                                       'G · backlog vàlid · ok');
eq(bl1.normalized.work_orders.length, 2,               'G · 2 WOs');
eq(bl1.normalized.agents.length, 1,                    'G · 1 agent');

// 9 · validateBacklog · duplicates
const dupBacklog = {
    version: 'v1.0',
    work_orders: [
        { id: 'wo-dup', title: 'A' },
        { id: 'wo-dup', title: 'B' },
    ],
};
const bl2 = validateBacklog(dupBacklog);
eq(bl2.ok, false,                                      'G · duplicate IDs · fail');
t(bl2.errors.some(e => e.includes('duplicate')),       'G · error mentions duplicate');

// 10 · computeBacklogStats
const statsBacklog = {
    version: 'v1.0',
    work_orders: [
        { id: 'a', title: 'A', status: 'pending',     estimated_cost_eur: 0.10 },
        { id: 'b', title: 'B', status: 'in-progress', estimated_cost_eur: 0.05 },
        { id: 'c', title: 'C', status: 'done',        estimated_cost_eur: 0.02, cost_actual_eur: 0.025 },
        { id: 'd', title: 'D', status: 'done',        estimated_cost_eur: 0.03, cost_actual_eur: 0.04 },
    ],
};
const stats = computeBacklogStats(statsBacklog);
eq(stats.total, 4,                                     'H · stats · total 4');
eq(stats.counts.pending, 1,                            'H · 1 pending');
eq(stats.counts.done, 2,                               'H · 2 done');
eq(stats.totalEstimatedEur, 0.20,                      'H · estimated · 0.20');
eq(stats.totalActualEur, 0.065,                        'H · actual · 0.065');

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
