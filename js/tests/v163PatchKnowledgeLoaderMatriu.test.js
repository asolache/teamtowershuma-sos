// =============================================================================
// TEAMTOWERS SOS V11 — v163.2 · Matriu Patch v0.1 · integració completa
//
// Adapta knowledgeLoaderMatriu.test.js del patch al runtime Node (sense fetch
// nativ navegador). Mockegem fetch sobre el filesystem real del repo
// (knowledge/matriu/* · config/agentPermissions.yaml) i validem · 24+ asserts.
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

// ─── fetch shim · serveix fitxers del repo per a /knowledge/* i /config/* ───
globalThis.fetch = async function (url) {
    const u = String(url);
    let local = null;
    if (u.startsWith('/knowledge/')) {
        local = path.join(ROOT, u.slice(1));
    } else if (u.startsWith('/config/')) {
        local = path.join(ROOT, u.slice(1));
    } else if (u.startsWith('/private/')) {
        local = path.join(ROOT, u.slice(1));
    } else {
        return { ok: false, status: 404, text: async () => '' };
    }
    if (!fs.existsSync(local)) return { ok: false, status: 404, text: async () => '' };
    const text = fs.readFileSync(local, 'utf8');
    return { ok: true, status: 200, text: async () => text };
};

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }
async function throws(fn, label) {
    try { await fn(); fail++; console.log('✗', label, '(no llança)'); }
    catch (e) { pass++; console.log('✓', label, '· (', e.message.slice(0, 50), ')'); }
}

console.log('=== v163.2 · Matriu patch · integració ===\n');

const { KnowledgeLoader } = await import(path.join(ROOT, 'js/core/KnowledgeLoader.js'));

// ─── A · getMatriuDomain ───────────────────────────────────────────────
console.log('— A · getMatriuDomain');
const d02 = await KnowledgeLoader.getMatriuDomain('d02-value-mapping');
ok('A · d02 carregat',                              d02 !== null);
ok('A · frontmatter.id correcte',                    d02 && d02.frontmatter?.id === 'd02-value-mapping');
ok('A · mode = linear',                              d02 && d02.frontmatter?.mode === 'linear');
ok('A · body té contingut',                          d02 && d02.body && d02.body.length > 100);

const d00 = await KnowledgeLoader.getMatriuDomain('d00-inner-work');
ok('A · d00 transversal carregat',                   d00 !== null);
ok('A · d00 mode = transversal',                     d00 && d00.frontmatter?.mode === 'transversal');

// ─── B · getMatriuCompetency ──────────────────────────────────────────
console.log('\n— B · getMatriuCompetency');
const c021 = await KnowledgeLoader.getMatriuCompetency('c-02.1-identify-vna-roles');
ok('B · c-02.1 carregada',                          c021 !== null);
ok('B · domain_ref correcte',                        c021 && c021.frontmatter?.domain_ref === 'd02-value-mapping');

// ─── C · getMatriuSkillSeed ──────────────────────────────────────────
console.log('\n— C · getMatriuSkillSeed');
const s1 = await KnowledgeLoader.getMatriuSkillSeed('s-vna-role-extractor');
ok('C · s-vna-role-extractor carregada',             s1 !== null);
ok('C · té agent_ref',                                s1 && s1.frontmatter?.agent_ref);

// ─── D · listMatriuDomains ───────────────────────────────────────────
console.log('\n— D · listMatriuDomains');
const allDomains = await KnowledgeLoader.listMatriuDomains();
ok('D · 11 dominis llistats',                        allDomains.length === 11);
const drafts = allDomains.filter(d => d.status === 'draft');
ok('D · té dominis amb status draft',                drafts.length > 0);
ok('D · alias slug presents',                         allDomains.every(d => d.slug));
ok('D · alias camelCase sosModule',                   allDomains.some(d => d.sosModule));

// ─── E · listMatriuCompetenciesByDomain ───────────────────────────────
console.log('\n— E · listMatriuCompetenciesByDomain');
const comps02 = await KnowledgeLoader.listMatriuCompetenciesByDomain('d02-value-mapping');
ok('E · D-02 té 5 competències',                     comps02.length === 5);
const comps00 = await KnowledgeLoader.listMatriuCompetenciesByDomain('d00-inner-work');
ok('E · D-00 té 5 competències',                     comps00.length === 5);

// ─── F · buildMatriuContext ──────────────────────────────────────────
console.log('\n— F · buildMatriuContext');
const ctxD02 = await KnowledgeLoader.buildMatriuContext({ domain: 'd02-value-mapping' });
ok('F · context D-02 generat',                       ctxD02.systemPrompt && ctxD02.systemPrompt.length > 500);
ok('F · context inclou marca MATRIU',                 ctxD02.systemPrompt.includes('MATRIU'));
ok('F · té sources',                                  Array.isArray(ctxD02.sources) && ctxD02.sources.length > 0);

const ctxMode = await KnowledgeLoader.buildMatriuContext({ mode: 'transversal' });
ok('F · mode transversal funciona',
   ctxMode.systemPrompt.includes('transversal') || ctxMode.systemPrompt.includes('TRANSVERSAL'));

// ─── G · _assertReservoirOnly ─────────────────────────────────────────
console.log('\n— G · _assertReservoirOnly · guard private/');
await throws(() => KnowledgeLoader.getMatriuDomain('../../private/biography/intim'),
              'G · accés private/ via traversal bloquejat');

// ─── H · canAgentRead ────────────────────────────────────────────────
console.log('\n— H · canAgentRead · permisos');
KnowledgeLoader._permissionsCache = null; // força reload
const canVnaMatriu = await KnowledgeLoader.canAgentRead('agent_vna_mapper', 'knowledge/matriu/domains/d02-value-mapping.md');
ok('H · agent_vna_mapper pot llegir D-02',           canVnaMatriu === true);

const canVnaBio = await KnowledgeLoader.canAgentRead('agent_vna_mapper', 'private/biography/motivation.md');
ok('H · agent_vna_mapper NO pot llegir biography',  canVnaBio === false);

const canOrchBio = await KnowledgeLoader.canAgentRead('agent_swarm_orchestrator', 'private/biography/anything.md');
ok('H · ni orchestrator pot llegir biography',       canOrchBio === false);

const canMirrorD02 = await KnowledgeLoader.canAgentRead('agent_introspection_mirror', 'knowledge/matriu/domains/d02-value-mapping.md');
ok('H · introspection_mirror NO pot llegir D-02',    canMirrorD02 === false);

const canMirrorD00 = await KnowledgeLoader.canAgentRead('agent_introspection_mirror', 'knowledge/matriu/domains/d00-inner-work.md');
ok('H · introspection_mirror SÍ pot llegir D-00',    canMirrorD00 === true);

// ─── I · getBiographyFile · requires userConsent ────────────────────
console.log('\n— I · getBiographyFile · userConsent guard');
await throws(() => KnowledgeLoader.getBiographyFile('motivation.md'),
              'I · sense userConsent llança error');
await throws(() => KnowledgeLoader.getBiographyFile('motivation.md', { userConsent: false }),
              'I · userConsent=false llança error');

// ─── J · permission YAML mini-parser ────────────────────────────────
console.log('\n— J · _parseAgentPermissionsYaml');
const perms = await KnowledgeLoader.loadAgentPermissions();
ok('J · 12 agents al YAML',                          Object.keys(perms.agents).length === 12);
ok('J · agent_vna_mapper té 9 patrons allowed',      perms.agents.agent_vna_mapper.allowed.length === 9);
ok('J · agent_introspection_mirror té 13 allowed',   perms.agents.agent_introspection_mirror.allowed.length === 13);

// ─── K · _matchPattern · glob ────────────────────────────────────────
console.log('\n— K · _matchPattern · glob simple');
ok('K · ** match qualsevol path',                    KnowledgeLoader._matchPattern('knowledge/**', 'knowledge/matriu/domains/d02-value-mapping.md'));
ok('K · single * NO travessa /',                     !KnowledgeLoader._matchPattern('knowledge/*', 'knowledge/matriu/domains/d02.md'));
ok('K · c-02.* matcheja c-02.1-...',                 KnowledgeLoader._matchPattern('knowledge/matriu/competencies/c-02.*', 'knowledge/matriu/competencies/c-02.1-identify-vna-roles'));

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
