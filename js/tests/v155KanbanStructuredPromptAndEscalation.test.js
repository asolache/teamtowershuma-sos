// =============================================================================
// TEAMTOWERS SOS V11 — v155 · Kanban structured prompt (5 sections) + runEscalation · TDD
// Resol audit v154 · port de Sprint quality pattern cap a Kanban.
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildExecutionPrompt } from '../views/KanbanView.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== v155 · Kanban structured prompt + escalation chain · TDD ===\n');

// ─── A · buildExecutionPrompt · 5 seccions estructurades ───────────────
console.log('— A · buildExecutionPrompt · 5 seccions');
{
    const p = buildExecutionPrompt({
        id: 'wo-test', content: {
            title: 'Implementar nou component canvas',
            description: 'Refactor canvas component amb hooks · test coverage 80%',
            sopRef: 'sop-test', priority: 'high',
            assignee: { engine: 'anthropic' }, approvalRule: 'manual',
        },
    });
    ok('A · header "TASCA · Executa aquesta Work Order"',  p.includes('# TASCA · Executa aquesta Work Order'));
    ok('A · 5 seccions OBLIGATÒRIES menció explícita',     p.includes('5 seccions OBLIGATÒRIES'));
    ok('A · "Resum executiu" secció 1',                    p.includes('### 1. Resum executiu'));
    ok('A · "Pla d\'implementació" (code kind)',           p.includes('Pla d\'implementació'));
    ok('A · "API surface / contracte" (code kind)',        p.includes('API surface'));
    ok('A · "Test plan + riscos"',                          p.includes('Test plan + riscos'));
    ok('A · "Aplicació + verificació"',                    p.includes('Aplicació + verificació'));
    ok('A · "5 seccions han d\'estar TOTES presents"',     p.includes('TOTES presents'));
    ok('A · regles irrenunciables · 5 punts',              p.includes('1. Respecta el SOC raíz') &&
                                                            p.includes('5. Output autocontingut'));
}

// ─── B · content kind · seccions adaptades ─────────────────────────────
console.log('\n— B · content kind · diferents seccions');
{
    const p = buildExecutionPrompt({
        id: 'wo-pitch', content: {
            title: 'Pitch deck inversors v3',
            description: 'Generar pitch en castellà · 6 seccions · estil business plan',
            assignee: { engine: 'anthropic' },
        },
    });
    ok('B · "Outline · estructura del document" (content kind)', p.includes('Outline · estructura'));
    ok('B · "Cos del document (draft complet)"',                  p.includes('Cos del document'));
    ok('B · "CTAs + següents passos"',                            p.includes('CTAs + següents passos'));
    ok('B · NO inclou "API surface" (només code kind)',          !p.includes('API surface'));
}

// ─── C · generic kind · fallback default ───────────────────────────────
console.log('\n— C · generic kind · 5 default seccions');
{
    const p = buildExecutionPrompt({
        id: 'wo-misc', content: {
            title: 'Anàlisi del flux usuari',
            description: 'Audit del flow checkout',
            assignee: { engine: 'anthropic' },
        },
    });
    ok('C · "Output principal"',                          p.includes('Output principal'));
    ok('C · "Decisions preses + alternatives descartades"',p.includes('Decisions preses'));
    ok('C · "Test/verificació booleana"',                  p.includes('Test/verificació booleana'));
    ok('C · "Riscos + següents passos"',                  p.includes('Riscos + següents passos'));
    ok('C · NO API surface ni Outline',                   !p.includes('API surface') && !p.includes('Outline · estructura'));
}

// ─── D · TDD check incluit si approvalRule=tdd-auto ───────────────────
console.log('\n— D · TDD check booleà');
{
    const p = buildExecutionPrompt({
        id: 'wo-tdd', content: {
            title: 'Component test', description: 'Test refactor',
            approvalRule: 'tdd-auto', tddCheck: 'output.includes("pass")',
            assignee: { engine: 'anthropic' },
        },
    });
    ok('D · regla 6 · TDD check explícit',                 p.includes('TDD check') && p.includes('output.includes("pass")'));

    const pNo = buildExecutionPrompt({
        id: 'wo-notdd', content: {
            title: 'Manual review', description: 'Manual', approvalRule: 'manual',
            assignee: { engine: 'anthropic' },
        },
    });
    ok('D · sense tdd-auto · NO regla 6 TDD check',       !pNo.includes('TDD check'));
}

// ─── E · _executeAi · wire runEscalation (codi · NO runtime) ──────────
console.log('\n— E · _executeAi · escalation chain wired');
const src = fs.readFileSync(path.join(ROOT, 'js/views/KanbanView.js'), 'utf8');
ok('E · import generateWithProvider',                  src.includes("await import('../core/aiProviderService.js')"));
ok('E · import runEscalation',                          src.includes("await import('../core/aiRouterService.js')"));
ok('E · crida runEscalation amb taskKind creative-narrative',
                                                       src.includes('taskKind:') && src.includes("'creative-narrative'"));
ok('E · preferredProvider propagat des de assignee.engine',
                                                       src.includes('preferredProvider: c.assignee?.engine'));
ok('E · fallback Orchestrator si runEscalation falla', src.includes("'fallback Orchestrator'") ||
                                                       src.includes('runEscalation failed'));
ok('E · aiAttempts trace al WO updated',               src.includes('aiAttempts: attempts'));
ok('E · aiModelKey trace al WO updated',                src.includes('aiModelKey: modelKey'));

// ─── F · _detectWoKind · pure · detecció correcta ─────────────────────
console.log('\n— F · _detectWoKind heuristic');
{
    // Indirectament via buildExecutionPrompt · ja cobert per A-C
    const pCode = buildExecutionPrompt({ id:'x', content:{ title:'implement API', description:'backend service refactor' }});
    ok('F · "implement API + backend" → code kind',        pCode.includes('API surface'));
    const pContent = buildExecutionPrompt({ id:'x', content:{ title:'blog post', description:'article landing copy' }});
    ok('F · "blog + landing copy" → content kind',         pContent.includes('Cos del document'));
    const pGen = buildExecutionPrompt({ id:'x', content:{ title:'Reunió equip', description:'agenda setmanal' }});
    ok('F · genèric ("agenda · reunió") → generic kind',  pGen.includes('Output principal'));
}

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
