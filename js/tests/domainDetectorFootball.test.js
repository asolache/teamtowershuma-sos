// =============================================================================
// TEAMTOWERS SOS V11 — DOMAIN DETECTOR · FOOTBALL TEAM · TDD (v126)
// Ruta · /js/tests/domainDetectorFootball.test.js
//
// Bug @alvaro · "equip de futbol" amb sector R donava rols d'Arts (director
// artístic · productor · intèrpret) en comptes de rols esportius reals.
// Fix v126 · domainDetector infereix sub-domini (sports-team) i injecta
// arquetip específic al prompt design-value-map-rich.
// =============================================================================

import {
    DOMAIN_PACKS, DOMAIN_IDS,
    detectDomain, listDomains, getDomainPack, formatArchetypesForPrompt,
} from '../core/domainDetector.js';
import { buildPrompt } from '../core/vnaExpertPrompts.js';
import fs from 'node:fs';

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== DOMAIN DETECTOR · FOOTBALL TEAM (v126) ===\n');

// ─── A · catàleg de dominis ────────────────────────────────────────────
console.log('— A · catàleg DOMAIN_PACKS');
ok('A · DOMAIN_IDS ≥ 4',                       DOMAIN_IDS.length >= 4);
ok('A · sports-team present',                  DOMAIN_PACKS['sports-team'] != null);
ok('A · arts-performance present',             DOMAIN_PACKS['arts-performance'] != null);
ok('A · coop-cares present',                   DOMAIN_PACKS['coop-cares'] != null);
ok('A · edu-formation present',                DOMAIN_PACKS['edu-formation'] != null);
ok('A · sports-team té ≥ 8 arquetip',          DOMAIN_PACKS['sports-team'].archetypes.length >= 8);
ok('A · sports-team conté Primer Entrenador',  DOMAIN_PACKS['sports-team'].archetypes.some(a => a.name.includes('Entrenador')));
ok('A · sports-team conté Director Esportiu',  DOMAIN_PACKS['sports-team'].archetypes.some(a => a.name.includes('Director Esportiu')));
ok('A · sports-team conté Ojeador',            DOMAIN_PACKS['sports-team'].archetypes.some(a => a.name.includes('Ojeador')));
ok('A · sports-team conté Patrocinador',       DOMAIN_PACKS['sports-team'].archetypes.some(a => a.name.includes('Patrocinador')));
ok('A · sports-team conté Afició',             DOMAIN_PACKS['sports-team'].archetypes.some(a => a.name.includes('Afició')));
ok('A · sports-team conté Federació',          DOMAIN_PACKS['sports-team'].archetypes.some(a => a.name.includes('Federació')));

// ─── B · detectDomain · el cas @alvaro ────────────────────────────────
console.log('\n— B · detecció · "equip de futbol"');
const d1 = detectDomain({
    name: 'Lleida FC',
    description: 'Equip de futbol semiprofessional a Lleida · pugem a tercera divisió aquest any',
    sector: 'R',
});
ok('B · detectat algun domini',                  !!d1);
ok('B · domain = sports-team',                   d1?.domain === 'sports-team');
ok('B · confidence > 0.3',                       d1?.confidence > 0.3);
ok('B · matchCount ≥ 1 (keywords detectats)',    d1?.matchCount >= 1);
ok('B · archetypes inclou Primer Entrenador',    d1?.archetypes?.some(a => a.name.includes('Entrenador')));
ok('B · intangibles inclou identitat club',      d1?.intangibles?.some(s => /identitat/i.test(s)));
ok('B · patterns inclou cicle entrenador',       d1?.patterns?.some(s => /entrenador/i.test(s)));

// ─── C · detectDomain · altres dominis ────────────────────────────────
console.log('\n— C · detecció · companyia teatre');
const d2 = detectDomain({ name: 'Companyia La Calòrica', description: 'Companyia de teatre amateur amb gira anual · 3 obres', sector: 'R' });
ok('C · arts-performance detectat',              d2?.domain === 'arts-performance');

const d3 = detectDomain({ name: 'Cooperativa Cures Vall', description: 'Cooperativa de cuidadores · SAD i residència', sector: 'Q' });
ok('C · coop-cares detectat',                    d3?.domain === 'coop-cares');

const d4 = detectDomain({ name: 'Escola Bressol Tres Pins', description: 'Escola lliure cooperativa amb mestres acompanyants', sector: 'P' });
ok('C · edu-formation detectat',                 d4?.domain === 'edu-formation');

// ─── D · fallback · domini genèric ─────────────────────────────────────
console.log('\n— D · fallback · projecte business genèric');
const d5 = detectDomain({ name: 'SaaS dev tool', description: 'Plataforma de DevOps per a equips', sector: 'J' });
ok('D · projecte business · retorna null (sense match keywords)',  d5 === null);

const d6 = detectDomain({ name: '', description: '', sector: 'R' });
ok('D · empty input · retorna null',             d6 === null);

// ─── E · helpers · listDomains + getDomainPack ────────────────────────
console.log('\n— E · helpers UI');
const list = listDomains();
ok('E · listDomains té 4 entries',               list.length === 4);
ok('E · entries tenen archetypeCount',           list.every(l => l.archetypeCount > 0));
ok('E · getDomainPack(sports-team) retorna pack',
   getDomainPack('sports-team')?.archetypes?.length > 0);
ok('E · getDomainPack(invalid) retorna null',    getDomainPack('xxx') === null);

// ─── F · formatArchetypesForPrompt ────────────────────────────────────
console.log('\n— F · formatArchetypesForPrompt');
const formatted = formatArchetypesForPrompt(d1);
ok('F · output no buit',                          formatted.length > 100);
ok('F · cada línia comença amb "  · "',           /\n  · /.test(formatted));
ok('F · inclou castell_level entre []',           /\[pinya\]|\[tronc\]/i.test(formatted));

// ─── G · integració · buildPrompt rep domainDetection ─────────────────
console.log('\n— G · buildPrompt design-value-map-rich amb domainDetection');
const promptWithDomain = buildPrompt({
    taskKind: 'design-value-map-rich',
    context: {
        name: 'Lleida FC',
        description: 'Equip de futbol semiprofessional',
        sector: 'R',
        vna_zoom: 'mid',
        domainDetection: d1,
    },
});
ok('G · prompt esmenta "DOMINI DETECTAT"',         promptWithDomain.user.includes('DOMINI DETECTAT'));
ok('G · prompt esmenta el label real',             promptWithDomain.user.includes('Equip esportiu'));
ok('G · prompt inclou Primer Entrenador',          promptWithDomain.user.includes('Primer Entrenador'));
ok('G · prompt inclou Director Esportiu',          promptWithDomain.user.includes('Director Esportiu'));
ok('G · prompt instrueix "NO et limitis als 5 genèrics"', promptWithDomain.user.includes('NO et limitis'));
ok('G · prompt menciona equip esportiu MÍNIM 8 rols',     promptWithDomain.user.includes('MÍNIM 8'));

const promptWithoutDomain = buildPrompt({
    taskKind: 'design-value-map-rich',
    context: { name: 'SaaS X', description: 'Plataforma', sector: 'J', vna_zoom: 'mid' },
});
ok('G · sense domainDetection · NO inclou bloc "DOMINI DETECTAT"',
   !promptWithoutDomain.user.includes('DOMINI DETECTAT'));
ok('G · sense domainDetection · prompt invita a inferir',
   promptWithoutDomain.user.includes('infereix'));

// ─── H · paritat agent .md ─────────────────────────────────────────────
console.log('\n— H · agents/design-value-map-rich.md actualitzat');
const agentMd = fs.readFileSync(new URL('../../agents/design-value-map-rich.md', import.meta.url), 'utf8');
ok('H · agent .md menciona domainDetection',     agentMd.includes('domainDetection'));
ok('H · agent .md menciona sports-team',         agentMd.includes('sports-team'));
ok('H · agent .md instrueix superar zoom si cal', agentMd.includes('supera el rang'));

// ─── I · expert chain orchestrator wire-up ────────────────────────────
console.log('\n— I · expertChainOrchestrator integració');
const orchSrc = fs.readFileSync(new URL('../core/expertChainOrchestrator.js', import.meta.url), 'utf8');
ok('I · importa detectDomain',                   orchSrc.includes("import { detectDomain }"));
ok('I · executa detectDomain pre-loop',          orchSrc.includes('detectDomain({ name: context.name'));
ok('I · emit domain-detected event',             orchSrc.includes("emit('domain-detected'"));
ok('I · injecta context.domainDetection',         orchSrc.includes('context = { ...context, domainDetection }'));
ok('I · phaseCtx · passa domainDetection a fase 5', orchSrc.includes('c.domainDetection = baseCtx.domainDetection'));

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
