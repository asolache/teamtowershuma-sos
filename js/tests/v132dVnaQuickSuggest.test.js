// =============================================================================
// TEAMTOWERS SOS V11 — v132d · vnaQuickSuggest unificat /map ↔ chain · TDD
// Ruta · /js/tests/v132dVnaQuickSuggest.test.js
//
// Verifica · quickSuggestMap (single-call slim) + fullExpertChain (re-export)
// + determineMode + escalation post-IA + mode completar via existingMap +
// lessons doc template.
// =============================================================================

import fs from 'node:fs';
import {
    VNA_QUICK_VERSION,
    quickSuggestMap, fullExpertChain, determineMode,
} from '../core/vnaQuickSuggest.js';

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }
async function asyncThrows(label, fn) { try { await fn(); fail++; console.log('✗', label, '(no llançà)'); } catch (_) { pass++; console.log('✓', label); } }

console.log('=== v132d · VNA QUICK SUGGEST · unificat /map ↔ chain ===\n');

// ─── A · exports + version ─────────────────────────────────────────────
console.log('— A · API surface');
ok('A · VNA_QUICK_VERSION exposat',                  typeof VNA_QUICK_VERSION === 'string' && VNA_QUICK_VERSION.startsWith('v'));
ok('A · quickSuggestMap és async function',          typeof quickSuggestMap === 'function');
ok('A · fullExpertChain és async function',          typeof fullExpertChain === 'function');
ok('A · determineMode és function',                  typeof determineMode === 'function');

// ─── B · determineMode · routing intel·ligent ──────────────────────────
console.log('\n— B · determineMode · auto-eleccio quick vs full');
ok('B · sense existingMap → full (bootstrap)',       determineMode({ existingMap: null }) === 'full');
ok('B · existingMap buit → full',                    determineMode({ existingMap: { roles: [], transactions: [] } }) === 'full');
ok('B · existingMap amb roles → quick (enrich)',     determineMode({ existingMap: { roles: [{id:'a'}] } }) === 'quick');
ok('B · existingMap amb transactions → quick',       determineMode({ existingMap: { transactions: [{from:'a',to:'b'}] } }) === 'quick');
ok('B · requestType="quick" forçat',                  determineMode({ requestType: 'quick' }) === 'quick');
ok('B · requestType="full" forçat',                   determineMode({ existingMap: { roles: [{id:'a'}] }, requestType: 'full' }) === 'full');

// ─── C · quickSuggestMap · validacions input ──────────────────────────
console.log('\n— C · quickSuggestMap · validacions');
{
    const r = await quickSuggestMap({ context: {} });
    ok('C · sense name/description · ok=false + error',  r.ok === false && r.error.includes('required'));
}

// ─── D · quickSuggestMap · mock provider · happy path slim ────────────
console.log('\n— D · quickSuggestMap · mock provider · happy path');
{
    const calls = [];
    const mockProvider = async (model, opts) => {
        calls.push({ system: opts.systemPrompt.slice(0, 40), userLen: opts.userPrompt.length });
        return { text: JSON.stringify({
            roles: [
                { id: 'r1', castell_level: 'pom_de_dalt' }, { id: 'r2', castell_level: 'tronc' },
                { id: 'r3', castell_level: 'pinya' }, { id: 'r4', castell_level: 'laterals' },
                { id: 'r5', castell_level: 'mans' }, { id: 'r6', castell_level: 'baixos' },
            ],
            transactions: [
                { from: 'r1', to: 'r2', type: 'tangible' }, { from: 'r2', to: 'r1', type: 'intangible' },
                { from: 'r3', to: 'r4', type: 'tangible' }, { from: 'r4', to: 'r5', type: 'intangible' },
            ],
            deliverables: [
                { kind: 'intangible', name: 'Confiança vestuari professional' },
                { kind: 'tangible', name: 'Alineació partit setmanal' },
            ],
        }), usage: { inputTokens: 1400, outputTokens: 400 } };
    };

    const r = await quickSuggestMap({
        context: { name: 'FC Lleida', description: 'Equip futbol', sector: 'R', vna_zoom: 'mid' },
        provider: mockProvider,
        generateWithProvider: mockProvider,
    });
    ok('D · ok=true',                                    r.ok === true);
    ok('D · map.roles ≥ 6',                              r.map.roles.length >= 6);
    ok('D · map.transactions ≥ 4',                        r.map.transactions.length >= 4);
    ok('D · score present amb valor ≥ 80 (output ric)',   r.score && r.score.score >= 80);
    ok('D · slim=true default',                           r.slim === true);
    ok('D · escalatedToFull=false (score alt · sense escalation)', r.escalatedToFull === false);
    ok('D · 1 sola crida (sense escalation)',             calls.length === 1);
    ok('D · ms >= 0',                                      r.ms >= 0);
    ok('D · tokens > 0 (prompt count)',                   r.tokens > 0);
}

// ─── E · quickSuggestMap · escalation per qualitat ────────────────────
console.log('\n— E · quickSuggestMap · escalation slim → FULL si score baix');
{
    let callCount = 0;
    const mockEscalation = async (model, opts) => {
        callCount++;
        if (callCount === 1) {
            // First call · slim · output pobre (score < 60)
            return { text: JSON.stringify({
                roles: [{ id: 'r1' }, { id: 'r2' }],
                transactions: [{ from: 'r1', to: 'r2' }],
                deliverables: [],
            }), usage: { inputTokens: 1400, outputTokens: 100 } };
        }
        // Second call · FULL · output millor
        return { text: JSON.stringify({
            roles: [
                { id: 'r1', castell_level: 'pom_de_dalt' }, { id: 'r2', castell_level: 'tronc' },
                { id: 'r3', castell_level: 'pinya' }, { id: 'r4', castell_level: 'laterals' },
                { id: 'r5', castell_level: 'mans' }, { id: 'r6', castell_level: 'baixos' },
            ],
            transactions: [
                { from: 'r1', to: 'r2', type: 'tangible' }, { from: 'r2', to: 'r1', type: 'intangible' },
                { from: 'r3', to: 'r4', type: 'tangible' },
            ],
            deliverables: [
                { kind: 'intangible', name: 'Identitat institucional ferma' },
            ],
        }), usage: { inputTokens: 2400, outputTokens: 400 } };
    };

    const r = await quickSuggestMap({
        context: { name: 'Forn Vall', description: 'Forn artesà', sector: 'C', vna_zoom: 'mid' },
        generateWithProvider: mockEscalation,
        slim: true,
        qualityThreshold: 60,
    });
    ok('E · 2 crides (escalation activada)',              callCount === 2);
    ok('E · escalatedToFull = true',                       r.escalatedToFull === true);
    ok('E · output final té millor score',                 r.score && r.score.score > 60);
    ok('E · output final té 6 roles (escalation rescue)', r.map.roles.length === 6);
}

// ─── F · quickSuggestMap · mode completar (existingMap) ───────────────
console.log('\n— F · quickSuggestMap · mode completar');
{
    let capturedUserPrompt = '';
    const mockProvider = async (model, opts) => {
        capturedUserPrompt = opts.userPrompt;
        return { text: JSON.stringify({
            roles: [{ id: 'rNew', castell_level: 'baixos' }],
            transactions: [],
            deliverables: [],
        }), usage: { inputTokens: 1500, outputTokens: 100 } };
    };

    const existing = {
        roles: [{ id: 'rExist1', name: 'Primer Entrenador', castell_level: 'tronc' }],
        transactions: [{ from: 'rExist1', to: 'rExist2', deliverable: 'instrucció' }],
    };
    const r = await quickSuggestMap({
        context: { name: 'FC Lleida', description: 'Equip futbol', sector: 'R' },
        existingMap: existing,
        generateWithProvider: mockProvider,
    });
    ok('F · prompt inclou "MODE COMPLETAR"',              capturedUserPrompt.includes('MODE COMPLETAR'));
    ok('F · prompt llista rols existents',                capturedUserPrompt.includes('Primer Entrenador'));
    ok('F · prompt instrueix NO repetir',                  capturedUserPrompt.includes('NO repeteixis els existents'));
    ok('F · ok=true · suggereix solo rols nous',          r.ok === true && r.map.roles.length === 1);
}

// ─── G · quickSuggestMap · parse failure handled ─────────────────────
console.log('\n— G · quickSuggestMap · output no parsejable');
{
    const mockBad = async () => ({ text: 'not valid json · pure garbage' });
    const r = await quickSuggestMap({
        context: { name: 'X', description: 'Y' },
        generateWithProvider: mockBad,
    });
    ok('G · ok=false · error parse-failed',                r.ok === false && r.error.includes('parse-failed'));
    ok('G · rawOutput conservat per debug',                r.rawOutput && r.rawOutput.length > 0);
}

// ─── H · quickSuggestMap · provider error handled ────────────────────
console.log('\n— H · quickSuggestMap · provider error');
{
    const mockFail = async () => { throw new Error('network down'); };
    const r = await quickSuggestMap({
        context: { name: 'X', description: 'Y' },
        generateWithProvider: mockFail,
    });
    ok('H · ok=false · error first-call-failed',           r.ok === false && r.error.includes('first-call-failed'));
}

// ─── I · PROMPT-EFFICIENCY-LESSONS.md template ────────────────────────
console.log('\n— I · docs/PROMPT-EFFICIENCY-LESSONS.md');
const lessonsExists = fs.existsSync(new URL('../../docs/PROMPT-EFFICIENCY-LESSONS.md', import.meta.url));
ok('I · doc lessons existeix',                             lessonsExists);
if (lessonsExists) {
    const lessons = fs.readFileSync(new URL('../../docs/PROMPT-EFFICIENCY-LESSONS.md', import.meta.url), 'utf8');
    ok('I · resum executiu amb 9 mètriques',               (lessons.match(/\| TBD \|/g) || []).length >= 9);
    ok('I · 20 casos benchmark taula',                     lessons.includes('case-sports-football') && lessons.includes('case-housing-coop'));
    ok('I · 5 hipòtesis a validar (H1-H5)',                lessons.includes('H1 ·') && lessons.includes('H5 ·'));
    ok('I · procediment execució CLI + UI + manual',        lessons.includes('Execució (CLI') && lessons.includes('Execució (UI'));
    ok('I · decisions post-benchmark · taula',              lessons.includes('Decisions a prendre post-benchmark'));
    ok('I · aprenentatges acumulats v132b/c/d',             lessons.includes('v132b') && lessons.includes('v132c') && lessons.includes('v132d'));
    ok('I · roadmap iteració post-benchmark',               lessons.includes('Roadmap d\'iteració'));
}

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
