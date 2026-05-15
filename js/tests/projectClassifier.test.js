// C1 · sprint analysis & design · tests stand-alone per projectClassifierService.
// Ús · node js/tests/projectClassifier.test.js
//
// Cobertura · heurística pura + validació · NO testegem la crida IA real
// (sense API key · es testarà amb integration tests més endavant).

import {
    classifyByHeuristic, validateClassification, needsConfirmation,
    applyConfirmedClassification, classifyProject,
    LIFECYCLE_STAGES, PROJECT_SCALES, DEPENDENCY_TYPES, CLASSIFIER_VERSION,
} from '../core/projectClassifierService.js';
import { PROJECT_TYPES } from '../core/critical108Roles.js';

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== C1 · projectClassifierService ===\n');

// 1 · Constants exportats
t(typeof CLASSIFIER_VERSION === 'string',         'A · version exportada');
t(Array.isArray(LIFECYCLE_STAGES) && LIFECYCLE_STAGES.length === 6, 'A · 6 lifecycle stages');
t(Array.isArray(PROJECT_SCALES) && PROJECT_SCALES.length === 3,     'A · 3 scales');
t(Array.isArray(DEPENDENCY_TYPES) && DEPENDENCY_TYPES.length === 5, 'A · 5 dependency types');

// 2 · Heurística · cas clar · DAO web3
const daoCase = classifyByHeuristic({
    name: 'RegenDAO',
    description: 'DAO Web3 amb governance on-chain · ReFi · tokens de governança',
    sector: 'tech-coop',
});
eq(daoCase.project_type, 'dao-web3',              'B · DAO · classifica dao-web3');
t(daoCase.confidence > 0,                         `B · DAO · confidence numèric · ${daoCase.confidence}`);

// 3 · Heurística · cas clar · coop cures
const curesCase = classifyByHeuristic({
    name: 'Cuidem-nos',
    description: 'Cooperativa de cures a gent gran · acompanyament a final de vida',
    sector: 'cures',
});
eq(curesCase.project_type, 'cooperativa-cures',   'B · cures · classifica cooperativa-cures');

// 4 · Heurística · cas clar · plataforma cooperativa
const platCase = classifyByHeuristic({
    name: 'CycleCoop',
    description: 'Plataforma cooperativa digital alternativa a Uber · alternativa uber',
    sector: 'tech',
});
eq(platCase.project_type, 'plataforma-cooperativa', 'B · platform · classifica plataforma-cooperativa');

// 5 · Lifecycle stage · idea
const ideaCase = classifyByHeuristic({
    name: 'Idea pendent',
    description: 'És una idea que estem pensant · concept · volem fer',
});
eq(ideaCase.lifecycle_stage, 'idea',              'C · idea · lifecycle idea');

// 6 · Lifecycle stage · maturity
const matureCase = classifyByHeuristic({
    name: 'Coop establerta',
    description: 'Cooperativa multi-stakeholder consolidada · operativa estable · cash positiu',
    sector: 'cooperativa',
});
eq(matureCase.lifecycle_stage, 'maturity',        'C · mature · lifecycle maturity');

// 7 · Scale · local
const localCase = classifyByHeuristic({
    name: 'Ateneu de barri',
    description: 'Ateneu autogestionat de barri · comunitat propera · vilatge',
});
eq(localCase.scale, 'local',                      'D · local · scale local');

// 8 · Scale · global
const globalCase = classifyByHeuristic({
    name: 'Global Network',
    description: 'Plataforma cooperativa internacional · multi-país · mundial',
});
eq(globalCase.scale, 'global',                    'D · global · scale global');

// 9 · Dependency type · standalone (default sense parent)
eq(daoCase.dependency_type, 'standalone',         'E · sense parent · standalone');

// 10 · Dependency type · subproject (amb parent)
const subCase = classifyByHeuristic({
    name: 'Mòdul mobile',
    description: 'Subprojecte de RegenDAO',
    parentProjectName: 'RegenDAO',
});
eq(subCase.dependency_type, 'subproject',         'E · amb parent · subproject');

// 11 · Validation
const validResult = {
    project_type: 'dao-web3',
    lifecycle_stage: 'mvp',
    scale: 'global',
    dependency_type: 'standalone',
    confidence: 0.9,
};
eq(validateClassification(validResult).ok, true,  'F · classificació vàlida · ok');

const invalidResult = { project_type: 'inventat', lifecycle_stage: 'mvp', scale: 'global', dependency_type: 'standalone', confidence: 0.9 };
eq(validateClassification(invalidResult).ok, false, 'F · type invàlid · fail');
t(validateClassification(invalidResult).errors.length > 0, 'F · errors poblats');

eq(validateClassification(null).ok, false,        'F · null · fail');
eq(validateClassification({ ...validResult, confidence: 1.5 }).ok, false, 'F · confidence > 1 · fail');
eq(validateClassification({ ...validResult, confidence: -0.1 }).ok, false, 'F · confidence < 0 · fail');

// 12 · needsConfirmation
eq(needsConfirmation({ confidence: 0.9 }), false, 'G · confidence 0.9 · no confirm');
eq(needsConfirmation({ confidence: 0.65 }), true, 'G · confidence 0.65 · confirm');
eq(needsConfirmation(null), true,                 'G · null · confirm');

// 13 · applyConfirmedClassification
const project = { id: 'proj-1', type: 'project', name: 'Test', updatedAt: 0 };
const applied  = applyConfirmedClassification(project, validResult, { ts: 1700000000000 });
t(applied.aiClassification,                       'H · aiClassification anclat al projecte');
eq(applied.aiClassification.project_type, 'dao-web3', 'H · project_type anclat');
eq(applied.aiClassification.classifiedAt, 1700000000000, 'H · timestamp anclat');
eq(applied.updatedAt, 1700000000000,              'H · projecte updatedAt actualitzat');

try {
    applyConfirmedClassification(project, invalidResult);
    t(false, 'H · classificació invàlida · throws');
} catch (_) { t(true, 'H · classificació invàlida · throws'); }

// 14 · classifyProject · curt-circuit amb heurística confiada (sense IA)
// El cas DAO clar hauria de tornar amb high confidence i NOT need confirmation
// si supera 0.85. Si no · provarà IA · sense API key tornarà error i caurà
// a heurística amb needsConfirmation:true.
const out = await classifyProject({
    name: 'RegenDAO',
    description: 'DAO Web3 ReFi · token governance on-chain blockchain dao web3',
});
t(out && typeof out === 'object',                 'I · classifyProject retorna objecte');
t(typeof out.needsConfirmation === 'boolean',     'I · té flag needsConfirmation');
t(PROJECT_TYPES.find(p => p.id === out.project_type), 'I · project_type vàlid');

// 15 · Signals presents
t(daoCase.signals && typeof daoCase.signals === 'object', 'J · signals al resultat heurístic');
t(daoCase.signals.typeScores,                     'J · signals.typeScores present');

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
