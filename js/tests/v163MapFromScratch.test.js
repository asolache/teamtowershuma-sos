// =============================================================================
// SOS V11 · v163.6 · /map IA · name+description → mapa de qualitat (E2E)
//
// Aquest test simula tot el pipeline · quickSuggestMap rep name+description ·
// crida un provider mockejat que retorna JSON VNA realista · verifica que
// el resultat passa l'avaluació de shape (roles ≥ 3 · transactions ≥ 3 ·
// score d'avaluador alt) i té estructura usable per /map.
//
// Sense crides de xarxa · sense vista DOM · sense API key.
// =============================================================================

import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== v163.6 · /map IA · pipeline name+description → mapa ===\n');

const { quickSuggestMap } = await import(path.join(ROOT, 'js/core/vnaQuickSuggest.js'));

// ─── MOCK · provider retorna VNA realista per a una consultoria tech ──────
const mockMapJson = {
    roles: [
        { id: 'consultor',    name: 'Consultor sènior',    kind: 'creator',   description: 'Lidera el projecte' },
        { id: 'analista',     name: 'Analista de dades',    kind: 'creator',   description: 'Extreu insights' },
        { id: 'client',       name: 'Client',                kind: 'beneficiary', description: 'Encarrega projecte' },
        { id: 'patrocinador', name: 'Patrocinador',          kind: 'enabler',   description: 'Aprova pressupost' },
        { id: 'comunitat',    name: 'Comunitat tècnica',     kind: 'reviewer',  description: 'Valida propostes' },
    ],
    transactions: [
        { id: 'tx1', from: 'consultor',    to: 'client',       deliverable: 'Informe inicial', type: 'tangible',   is_must: true,  frequency: 'unica' },
        { id: 'tx2', from: 'client',       to: 'consultor',    deliverable: 'Pagament fee',     type: 'tangible',   is_must: true,  frequency: 'mensual' },
        { id: 'tx3', from: 'analista',     to: 'consultor',    deliverable: 'Dataset processat', type: 'tangible',  is_must: true,  frequency: 'setmanal' },
        { id: 'tx4', from: 'patrocinador', to: 'consultor',    deliverable: 'Confiança política', type: 'intangible', is_must: false, frequency: 'puntual' },
        { id: 'tx5', from: 'consultor',    to: 'patrocinador', deliverable: 'Reputació externa',  type: 'intangible', is_must: false, frequency: 'puntual' },
        { id: 'tx6', from: 'comunitat',    to: 'analista',     deliverable: 'Best practices',     type: 'tangible',   is_must: false, frequency: 'continua' },
        { id: 'tx7', from: 'analista',     to: 'comunitat',    deliverable: 'Estudi de cas',      type: 'tangible',   is_must: false, frequency: 'trimestral' },
    ],
    deliverables: [
        { id: 'd-informe', name: 'Informe inicial' },
        { id: 'd-fee',     name: 'Pagament fee' },
        { id: 'd-dataset', name: 'Dataset processat' },
        { id: 'd-trust',   name: 'Confiança política' },
        { id: 'd-rep',     name: 'Reputació externa' },
    ],
};

let providerCalls = 0;
const mockProvider = async (modelKey, opts) => {
    providerCalls++;
    return {
        text: JSON.stringify(mockMapJson),
        usage: { inputTokens: 1200, outputTokens: 600 },
        modelKey,
    };
};

// ─── A · pipeline · només name + description ──────────────────────────────
console.log('— A · pipeline · només name + description');
const result = await quickSuggestMap({
    context: {
        name:        'PimeData',
        description: 'Consultoria de dades per a pimes catalanes · 2-5 persones · acompanyem amb dashboards i workshops trimestrals',
    },
    slim: true,
    qualityThreshold: 60,
    generateWithProvider: mockProvider,
});
ok('A · result.ok = true',                          result.ok === true);
ok('A · 5 rols parsejats',                          result.map?.roles?.length === 5);
ok('A · 7 transaccions parsejades',                 result.map?.transactions?.length === 7);
ok('A · score retornat (objecte)',                  result.score && typeof result.score.score === 'number');
ok('A · provider cridat 1 cop (sense escalation)',  providerCalls === 1);

// ─── B · sortida té forma usable per a /map (shape eval) ─────────────────
console.log('\n— B · shape evaluation');
const { evaluateValueMapShape } = await import(path.join(ROOT, 'js/core/vnaShapeEvaluators.js'));
const shape = evaluateValueMapShape(result.map);
ok('B · evaluateValueMapShape · ok=true',           shape.ok === true);
ok('B · score >= 70',                                shape.score >= 70);

// ─── C · qualitat dels intangibles · % entre 25-50% ──────────────────────
console.log('\n— C · qualitat · intangibles + reciprocity');
const txs = result.map.transactions || [];
const intang = txs.filter(t => t.type === 'intangible').length;
const pct = intang / txs.length;
ok('C · intangibles dins range [25%, 50%]',         pct >= 0.25 && pct <= 0.50);
// reciprocitat · almenys un parell (from→to) i (to→from)
const pairs = new Set();
let recip = 0;
for (const t of txs) {
    const k1 = t.from + '|' + t.to;
    const k2 = t.to + '|' + t.from;
    if (pairs.has(k2)) recip++;
    pairs.add(k1);
}
ok('C · té almenys 1 cicle recíproc',                recip >= 1);

// ─── D · sense crash si description és curta ─────────────────────────────
console.log('\n— D · description curta · degrade graceful');
providerCalls = 0;
const r2 = await quickSuggestMap({
    context: { name: 'X', description: 'Una pime nova de barri' },
    slim: true,
    generateWithProvider: mockProvider,
});
ok('D · description curta · ok=true (no crash)',     r2.ok === true);
ok('D · provider rebut name+description curts',      providerCalls >= 1);

// ─── E · sense name ni description · degrade clar (no infinite spinner) ──
console.log('\n— E · sense input · error clar (no infinite spinner)');
const r3 = await quickSuggestMap({
    context: {},
    slim: true,
    generateWithProvider: mockProvider,
});
ok('E · ok=false amb mensaje útil',                  r3.ok === false && /name|description/i.test(r3.error || ''));

// ─── F · health score per al mapa generat (Matriu c-02.4) ────────────────
console.log('\n— F · health score · roles del mapa generat');
const { analyzeMapHealth } = await import(path.join(ROOT, 'js/core/vnaRoleHealth.js'));
const health = analyzeMapHealth(result.map);
ok('F · health · 5 rols puntuats',                   health.roles.length === 5);
ok('F · health · avg >= 40 (mapa decent · target 70-80 spec)', health.avg >= 40);
ok('F · health · spec ref matriu c-02.4',            health.spec === 'matriu/c-02.4-analyze-role-health');

// ─── G · Orchestrator ANTHROPIC_MODEL apunta al sonnet 4.6 ───────────────
console.log('\n— G · Orchestrator model ID actualizat');
const fs = await import('node:fs');
const orchSrc = fs.readFileSync(path.join(ROOT, 'js/core/Orchestrator.js'), 'utf8');
ok('G · Orchestrator usa claude-sonnet-4-6 (no model vell)',
   /ANTHROPIC_MODEL\s*=\s*['"]claude-sonnet-4-6['"]/.test(orchSrc));
ok('G · NO conté la string vella claude-sonnet-4-20250514',
   !/claude-sonnet-4-20250514/.test(orchSrc));

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
