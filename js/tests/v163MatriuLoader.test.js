// =============================================================================
// TEAMTOWERS SOS V11 — v163 · Matriu currículum loader · additivitat
// Verifica · cap mètode legacy modificat · 6 mètodes nous additius · vista
// + ruta registrades · submodule present.
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== v163 · Matriu currículum · additivitat & integració ===\n');

// ─── A · KnowledgeLoader · signatures legacy intactes ──────────────
console.log('— A · KnowledgeLoader · legacy methods NO modificats');
const kl = fs.readFileSync(path.join(ROOT, 'js/core/KnowledgeLoader.js'), 'utf8');

const LEGACY_SIGNATURES = [
    'static async loadFile(path) {',
    'static async parseFile(path) {',
    'static async getSectorSeed(sectorId) {',
    'static async getClientSeed(clientId) {',
    'static async buildContext(options = {}) {',
    'static _parseMarkdownWithFrontmatter(raw) {',
    'static _parseYaml(yamlStr) {',
    'static _parseScalar(val) {',
    'static _resolveSectorPath(sectorId) {',
    'static _patternsToContext(patterns) {',
];
LEGACY_SIGNATURES.forEach(sig => {
    ok('A · signature intacte · ' + sig.slice(0, 50), kl.includes(sig));
});

// ─── B · 6 mètodes nous additius ──────────────────────────────────
console.log('\n— B · nous mètodes (additius)');
ok('B · MATRIU_DOMAINS Object.freeze',           kl.includes('static MATRIU_DOMAINS = Object.freeze(['));
ok('B · loadMatriuFile(relpath)',                 kl.includes('static async loadMatriuFile(relpath)'));
ok('B · parseMatriuFile(relpath)',                kl.includes('static async parseMatriuFile(relpath)'));
ok('B · listMatriuDomains()',                     kl.includes('static async listMatriuDomains()'));
ok('B · getMatriuDomain(domainId)',               kl.includes('static async getMatriuDomain(domainId)'));
ok('B · getMatriuCompetency(competencyId)',       kl.includes('static async getMatriuCompetency(competencyId)'));
ok('B · getMatriuBySosModule(sosModule)',         kl.includes('static async getMatriuBySosModule(sosModule)'));
ok('B · reusa loadFile (no duplica fetch)',       /loadMatriuFile[\s\S]{0,200}this\.loadFile\(/.test(kl));
ok('B · reusa parseFile (no duplica parser)',     /parseMatriuFile[\s\S]{0,200}this\.parseFile\(/.test(kl));

// ─── C · submodule present + commit pin ────────────────────────────
console.log('\n— C · submodule knowledge/matriu');
ok('C · .gitmodules existeix',                    fs.existsSync(path.join(ROOT, '.gitmodules')));
const gm = fs.existsSync(path.join(ROOT, '.gitmodules')) ? fs.readFileSync(path.join(ROOT, '.gitmodules'), 'utf8') : '';
ok('C · .gitmodules apunta a knowledge/matriu',   /path = knowledge\/matriu/.test(gm));
ok('C · .gitmodules apunta a repo upstream',      /teamtowers-matriu/.test(gm));
ok('C · knowledge/matriu/ directori existeix',    fs.existsSync(path.join(ROOT, 'knowledge/matriu/_index.md')));
ok('C · 11 dominis presents',                      (fs.readdirSync(path.join(ROOT, 'knowledge/matriu/domains')).filter(f => f.endsWith('.md')).length) === 11);
ok('C · D-02 té frontmatter id correcte',         /id: d02-value-mapping/.test(fs.readFileSync(path.join(ROOT, 'knowledge/matriu/domains/d02-value-mapping.md'), 'utf8')));

// ─── D · parseYaml legacy funciona amb frontmatter matriu ──────────
console.log('\n— D · parser legacy compatible amb frontmatter matriu');
const { KnowledgeLoader } = await import(path.join(ROOT, 'js/core/KnowledgeLoader.js'));
const d02raw = fs.readFileSync(path.join(ROOT, 'knowledge/matriu/domains/d02-value-mapping.md'), 'utf8');
const parsed = KnowledgeLoader._parseMarkdownWithFrontmatter(d02raw);
ok('D · frontmatter parsejat (no buit)',           parsed && parsed.frontmatter && Object.keys(parsed.frontmatter).length > 5);
ok('D · id correctament extret',                   parsed.frontmatter.id === 'd02-value-mapping');
ok('D · type=domain',                              parsed.frontmatter.type === 'domain');
ok('D · sos_module="VNA Mapper"',                  parsed.frontmatter.sos_module === 'VNA Mapper');
// Legacy parser no captura llistes string plain (per design · es deprecarà);
// el post-processing additiu de parseMatriuFile sí.
const stringLists = KnowledgeLoader._extractMatriuStringLists(d02raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)[1]);
ok('D · _extractMatriuStringLists · competencies (5 items)',
   Array.isArray(stringLists.competencies) && stringLists.competencies.length === 5);
ok('D · _extractMatriuStringLists · c-02.1 capturada',
   (stringLists.competencies || []).includes('c-02.1-identify-vna-roles'));
ok('D · _extractMatriuStringLists · prerequisites capturat',
   Array.isArray(stringLists.prerequisites) && stringLists.prerequisites.includes('d01-project-definition'));
ok('D · MATRIU_DOMAINS exposat amb 11 ids',       Array.isArray(KnowledgeLoader.MATRIU_DOMAINS) && KnowledgeLoader.MATRIU_DOMAINS.length === 11);
ok('D · d02-value-mapping al llistat',             KnowledgeLoader.MATRIU_DOMAINS.includes('d02-value-mapping'));

// ─── E · vista + ruta registrades ───────────────────────────────────
console.log('\n— E · vista + ruta');
const router = fs.readFileSync(path.join(ROOT, 'js/router.js'), 'utf8');
ok('E · ruta /matriu-curriculum registrada',       router.includes("path: '/matriu-curriculum'") && router.includes('MatriuCurriculumView'));
ok('E · MatriuCurriculumView.js existeix',         fs.existsSync(path.join(ROOT, 'js/views/MatriuCurriculumView.js')));
const view = fs.readFileSync(path.join(ROOT, 'js/views/MatriuCurriculumView.js'), 'utf8');
ok('E · vista importa KnowledgeLoader',            view.includes("from '../core/KnowledgeLoader.js'"));
ok('E · vista crida listMatriuDomains',             view.includes('listMatriuDomains'));
ok('E · vista crida getMatriuDomain',                view.includes('getMatriuDomain'));
ok('E · vista crida getMatriuCompetency',           view.includes('getMatriuCompetency'));

// ─── F · els 11 dominis llestos a llistar ─────────────────────────
console.log('\n— F · contingut matriu · sanity check');
const domainsDir = path.join(ROOT, 'knowledge/matriu/domains');
const allDomains = fs.readdirSync(domainsDir).filter(f => f.endsWith('.md')).map(f => f.replace('.md', ''));
for (const id of KnowledgeLoader.MATRIU_DOMAINS) {
    ok('F · domini ' + id + ' present al submodule', allDomains.includes(id));
}

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
