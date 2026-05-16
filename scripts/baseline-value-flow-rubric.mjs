#!/usr/bin/env node
// Baseline · executa el rubric contra el projecte MAX/founder existent ·
// dóna l'score actual sense canviar res. Útil per veure el delta real
// post-implementació del flow legendary.

import { buildMaxQualityProject } from '../js/core/maxProjectBootstrap.js';
import {
    evaluateRubric, fromProject, RUBRIC, RUBRIC_THRESHOLDS,
} from '../js/core/valueFlowRubricService.js';

const result = buildMaxQualityProject({
    creatorHandle: 'baseline-runner',
    projectName:   'Baseline test cas Castellers',
});

const project = result.project;
const sops    = result.sops    || [];
const socs    = result.socs    || [];
const roles   = result.roles   || [];

if (!project) {
    console.error('No project trobat al output de buildMaxQualityProject');
    process.exit(1);
}

// MAX posa vna_roles i vna_transactions al top-level del project · ja és el
// que fromProject espera. Passem els SOPs i els role nodes separats des de
// result perquè enriqueixin els vna_roles amb castell_level.
const input = fromProject(project, { sops, socs, roles });

// Si el project no porta deliverables explícits, fromProject els deriva de
// les transactions. Però MAX pot tenir-ne · els busquem dins project.content
// o result.deliverables si existeix.
if (result.deliverables && Array.isArray(result.deliverables)) {
    input.deliverables = result.deliverables.slice();
}

const evalResult = evaluateRubric(input);

console.log('\n=== BASELINE · MAX bootstrap vs rubric v' + RUBRIC.version + ' ===\n');
console.log('Project · ' + project.id);
console.log('Bootstrap output keys · ' + Object.keys(result).join(', '));
console.log('  · roles · '         + (input.roles.length));
console.log('  · deliverables · '  + (input.deliverables.length));
console.log('  · transactions · '  + (input.transactions.length));
console.log('  · sops · '          + (input.sops.length));
console.log('  · socs · '          + (input.socs.length));
console.log('');

console.log('┌─────┬────────┬───────┬───────┬──────────────────────────────────────┐');
console.log('│ ID  │ Weight │ Score │ Pass  │ Label                                │');
console.log('├─────┼────────┼───────┼───────┼──────────────────────────────────────┤');
for (const c of RUBRIC.criteria) {
    const r = evalResult.byCriterion[c.id];
    const mark = r.passed ? '✓ pass' : '✘ fail';
    const label = (r.label || '').padEnd(36).slice(0, 36);
    console.log(
        '│ ' + c.id.padEnd(3) + ' │ ' + String(c.weight).padStart(6)
        + ' │ ' + String(r.score).padStart(5)
        + ' │ ' + mark.padEnd(5) + ' │ ' + label + ' │'
    );
}
console.log('└─────┴────────┴───────┴───────┴──────────────────────────────────────┘');
console.log('');
console.log('TOTAL · ' + evalResult.total + '/100 · status · ' + evalResult.status.toUpperCase());
console.log('Llindars · gold≥' + RUBRIC_THRESHOLDS.gold + ' · silver≥' + RUBRIC_THRESHOLDS.silver + ' · bronze≥' + RUBRIC_THRESHOLDS.bronze);
console.log('');
if (evalResult.missing.length > 0) {
    console.log('Forats detectats:');
    for (const m of evalResult.missing) {
        console.log('  · [' + m.criterion + '] ' + m.label + ' → ' + m.fix);
    }
}
