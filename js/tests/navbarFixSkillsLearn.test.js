// =============================================================================
// TEAMTOWERS SOS V11 — NAVBAR FIX + SKILLS A LEARN + AGENTS DOC · TDD (PR-P)
// Ruta · /js/tests/navbarFixSkillsLearn.test.js
// =============================================================================

import { renderGlobalNavHtml, renderBreadcrumbHtml, NAV_DESTINATIONS } from '../core/navService.js';
import fs from 'node:fs';

let pass = 0, fail = 0;
function ok(label, cond, expected = '', got = '') {
    if (cond) { pass++; console.log('✓', label); }
    else {
        fail++;
        const detail = (expected !== '' || got !== '') ? ` (expected ${JSON.stringify(expected)}, got ${JSON.stringify(got)})` : '';
        console.log('✗', label + detail);
    }
}

console.log('=== NAVBAR FIX + SKILLS A LEARN + AGENTS DOC (PR-P) ===\n');

// ─── A · Navbar SENSE search · té pills Messages + Wallet ────────────
console.log('— A · Navbar net · pills nous · search fora');
const navHtml = renderGlobalNavHtml({ pathname: '/home' });
ok('A · navbar NO té sos-global-search', !navHtml.includes('sos-global-search'));
ok('A · navbar TÉ pill Messages',         navHtml.includes('sos-global-nav-msg'));
ok('A · pill messages enllaça a /inbox',  navHtml.includes('href="/inbox"'));
ok('A · navbar TÉ pill Wallet',           navHtml.includes('sos-global-nav-wallet'));
ok('A · pill wallet enllaça a /wallet',   navHtml.includes('href="/wallet"'));
ok('A · pill wallet té sos-global-wallet-balance id', navHtml.includes('id="sos-global-wallet-balance"'));

// ─── B · Breadcrumb · search ELIMINAT (v121-fix · conflicte ID amb palette) ─
console.log('\n— B · Breadcrumb sense search · palette viu a globalSearch.js');
const bcHtml = renderBreadcrumbHtml({ items: [{ label: 'Home', href: '/' }] });
ok('B · breadcrumb NO té sos-global-search input', !bcHtml.includes('id="sos-global-search"'));
ok('B · breadcrumb NO té sos-bc-search-wrap',      !bcHtml.includes('sos-bc-search-wrap'));
ok('B · sos-bc-trail present per a crumbs',        bcHtml.includes('sos-bc-trail'));

// ─── C · Skills tab ELIMINAT del hub /learn (v128) ──────────────────────
// v128 · /learn?tab=skills eliminat per redundància · era un landing duplicat
// de /skills. Skills viuen ara només a la pàgina pròpia /skills.
console.log('\n— C · /learn?tab=skills ELIMINAT (v128)');
const learnSrc = fs.readFileSync(new URL('../views/LearnView.js', import.meta.url), 'utf8');
ok('C · VALID_MODES NO inclou "skills" (v128)',     !/'skills'/.test(learnSrc.match(/VALID_MODES = Object\.freeze\(\[[^\]]+\]/)?.[0] || ''));
ok('C · NO hi ha tab button data-mode="skills"',    !learnSrc.includes('data-mode="skills"'));
ok('C · _renderSkillsTab method ELIMINAT',          !/\b_renderSkillsTab\(\) \{/.test(learnSrc));
ok('C · documenta v128 a un comentari',             /v128.*skills.*elimin|elimin.*skills.*v128/i.test(learnSrc));

// ─── D · NavService · entrada Skills mantinguda · learn-skills opcional ──
console.log('\n— D · navService Skills · catàleg directe a /skills');
const skillsEntry = NAV_DESTINATIONS.find(d => d.id === 'skills');
ok('D · entrada skills (catàleg complet) mantinguda', !!skillsEntry);
ok('D · skills href = /skills', skillsEntry?.href === '/skills');

// ─── E · Mobile · pill labels ocultes ────────────────────────────────
console.log('\n— E · CSS mobile · pill labels ocultes');
const navSrc = fs.readFileSync(new URL('../core/navService.js', import.meta.url), 'utf8');
ok('E · @media 720px oculta pill-label', navSrc.includes('sos-global-nav-pill-label') && navSrc.includes('display: none') && navSrc.includes('720px'));
ok('E · breadcrumb search wrapper ELIMINAT (v121-fix)', !navSrc.includes('sos-bc-search-wrap input'));

// ─── F · Docs AGENTS-pattern.md present ──────────────────────────────
console.log('\n— F · Docs AGENT.md + MCP pattern');
const agentsDocExists = fs.existsSync(new URL('../../docs/AGENTS-pattern.md', import.meta.url));
ok('F · docs/AGENTS-pattern.md creat',  agentsDocExists);
if (agentsDocExists) {
    const docSrc = fs.readFileSync(new URL('../../docs/AGENTS-pattern.md', import.meta.url), 'utf8');
    ok('F · doc menciona AGENT.md convention', docSrc.includes('AGENT.md convention'));
    ok('F · doc menciona MCP (Model Context Protocol)', docSrc.includes('Model Context Protocol'));
    ok('F · doc menciona "agnostic IA"', docSrc.includes('Agnostic') || docSrc.includes('agnostic'));
    ok('F · doc té estructura proposada (frontmatter YAML)', docSrc.includes('---') && docSrc.includes('model_tier'));
    ok('F · doc té plan implementació · 4 fases', docSrc.includes('Fase 1') && docSrc.includes('Fase 4'));
}

// ─── G · Backlog · 8 WOs nous sprint v120 ────────────────────────────
console.log('\n— G · Backlog actualitzat · 8 WOs v120');
const backlogSrc = fs.readFileSync(new URL('../../docs/backlog.md', import.meta.url), 'utf8');
for (const woId of ['wo-agent-md-pattern', 'wo-skills-ecosystem', 'wo-llm-local-train', 'wo-permaweb-skills-share', 'wo-wallet-redesign', 'wo-orchestrator-expert-chain', 'wo-prompt-router-by-tier', 'wo-prompt-eval-loop']) {
    ok('G · backlog.md té WO ' + woId, backlogSrc.includes(woId));
}

const backlogYaml = fs.readFileSync(new URL('../../docs/backlog.yaml', import.meta.url), 'utf8');
ok('G · backlog.yaml té wo-agent-md-pattern',  backlogYaml.includes('wo-agent-md-pattern'));
ok('G · backlog.yaml té wo-skills-ecosystem',  backlogYaml.includes('wo-skills-ecosystem'));
ok('G · backlog.yaml té wo-wallet-redesign',  backlogYaml.includes('wo-wallet-redesign'));
ok('G · backlog.yaml WOs marcats sprint-v120', backlogYaml.includes('sprint-v120'));

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
