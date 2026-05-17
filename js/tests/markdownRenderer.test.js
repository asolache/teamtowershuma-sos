// =============================================================================
// TEAMTOWERS SOS V11 — MARKDOWN RENDERER · TDD
// Ruta · /js/tests/markdownRenderer.test.js
// =============================================================================

import { renderMarkdown, parseFrontmatter, renderKnowledgeDoc, MD_RENDERER_VERSION } from '../core/markdownRenderer.js';

let pass = 0, fail = 0;
function ok(label, cond, expected = '', got = '') {
    if (cond) { pass++; console.log('✓', label); }
    else {
        fail++;
        const detail = (expected !== '' || got !== '') ? ` (expected ${JSON.stringify(expected)}, got ${JSON.stringify(got)})` : '';
        console.log('✗', label + detail);
    }
}

console.log('=== MARKDOWN-RENDERER · TDD ===\n');

// ─── A · headers ─────────────────────────────────────────────────────────
console.log('— A · headers # ## ###');
ok('A · h1', renderMarkdown('# Title').includes('<h1>Title</h1>'));
ok('A · h2', renderMarkdown('## Sub').includes('<h2>Sub</h2>'));
ok('A · h3', renderMarkdown('### Three').includes('<h3>Three</h3>'));
ok('A · h6', renderMarkdown('###### Six').includes('<h6>Six</h6>'));
ok('A · no header sense espai', !renderMarkdown('#NoEspai').includes('<h1>'));

// ─── B · bold + italic + code ───────────────────────────────────────────
console.log('\n— B · inline · bold · italic · code · links');
ok('B · bold **text**',         renderMarkdown('Hola **mundo**').includes('<strong>mundo</strong>'));
ok('B · italic *text*',         renderMarkdown('text *italic* aqui').includes('<em>italic</em>'));
ok('B · inline code `x`',       renderMarkdown('valor `code` x').includes('<code>code</code>'));
ok('B · link [text](url)',      renderMarkdown('see [docs](https://example.com)').includes('<a href="https://example.com"'));
ok('B · link interna /n/x',     renderMarkdown('see [link](/foo)').includes('<a href="/foo"'));
ok('B · bloca javascript: url', !renderMarkdown('mal [bad](javascript:alert(1))').includes('javascript:'));

// ─── C · llistes ─────────────────────────────────────────────────────────
console.log('\n— C · llistes ul + ol');
const ul = renderMarkdown('- one\n- two\n- three');
ok('C · ul obre/tanca',         ul.includes('<ul>') && ul.includes('</ul>'));
ok('C · ul · 3 items',          (ul.match(/<li>/g) || []).length === 3);
const ol = renderMarkdown('1. first\n2. second');
ok('C · ol obre/tanca',         ol.includes('<ol>') && ol.includes('</ol>'));
ok('C · ol · 2 items',          (ol.match(/<li>/g) || []).length === 2);

// ─── D · code block fence ───────────────────────────────────────────────
console.log('\n— D · code blocks ```');
const code = renderMarkdown('```js\nconst x = 1;\n```');
ok('D · <pre><code>',           code.includes('<pre><code'));
ok('D · class="lang-js"',       code.includes('lang-js'));
ok('D · contingut escapat',     code.includes('const x = 1;'));

// ─── E · blockquote + hr ────────────────────────────────────────────────
console.log('\n— E · blockquote + hr');
ok('E · blockquote',            renderMarkdown('> cita').includes('<blockquote>cita</blockquote>'));
ok('E · hr ---',                renderMarkdown('---').includes('<hr/>'));
ok('E · hr ***',                renderMarkdown('***').includes('<hr/>'));

// ─── F · paràgrafs múltiples ────────────────────────────────────────────
console.log('\n— F · paràgrafs');
const para = renderMarkdown('Primera frase.\nContinuació.\n\nNou paràgraf.');
ok('F · 2 paràgrafs',           (para.match(/<p>/g) || []).length === 2);

// ─── G · parseFrontmatter ───────────────────────────────────────────────
console.log('\n— G · frontmatter parser');
const fmDoc = `---
id: soc-test
type: soc
version: v1
status: live
keywords: [vna, castellers, test]
purpose: "Test purpose"
---

# Body comença aquí

Contingut`;
const { frontmatter, body } = parseFrontmatter(fmDoc);
ok('G · id',                    frontmatter.id === 'soc-test');
ok('G · type',                  frontmatter.type === 'soc');
ok('G · keywords array',        Array.isArray(frontmatter.keywords) && frontmatter.keywords.length === 3);
ok('G · purpose strip quotes',  frontmatter.purpose === 'Test purpose');
ok('G · body separat',          body.startsWith('\n# Body'));

// ─── H · llistes YAML multiline ─────────────────────────────────────────
console.log('\n— H · YAML llistes multiline');
const yml2 = `---
outcomes:
  - "Outcome 1"
  - "Outcome 2"
  - "Outcome 3"
---

body`;
const fm2 = parseFrontmatter(yml2).frontmatter;
ok('H · outcomes array',        Array.isArray(fm2.outcomes) && fm2.outcomes.length === 3);
ok('H · outcomes[0]',           fm2.outcomes[0] === 'Outcome 1');

// ─── I · renderKnowledgeDoc · combinació + githubUrl ───────────────────
console.log('\n— I · renderKnowledgeDoc · combinació + GitHub link');
const doc = `---
id: soc-x
purpose: Hola
---

# Title

Body **text**.`;
const r = renderKnowledgeDoc(doc, { relpath: 'socs/x.md', githubBase: 'https://github.com/foo/bar/blob/main' });
ok('I · frontmatter.id',        r.frontmatter.id === 'soc-x');
ok('I · bodyHtml conté h1',     r.bodyHtml.includes('<h1>Title</h1>'));
ok('I · bodyHtml conté bold',   r.bodyHtml.includes('<strong>text</strong>'));
ok('I · githubUrl correcte',    r.githubUrl === 'https://github.com/foo/bar/blob/main/knowledge/socs/x.md');

// ─── J · cas real · fitxer typical de knowledge/socs ───────────────────
console.log('\n— J · cas real socs/la-colla.md style');
const real = `---
id: soc-la-colla
type: soc
version: v1
status: live
purpose: "Procés VNA · consultoria multi-sessió per a clients corporatius."
keywords: [la-colla, vna, consultoria]
sos_context: critical
---

# La Colla · proces VNA

> Verna Allee Pantheon Work · adaptat a TeamTowers

## Per què existeix

Les organitzacions tenen ** xarxes de valor** ocultes (intercanvis intangibles · presència · feedback · reputació) que NO es veuen al organigrama.

## Outcomes

- Mapa VNA del client signat per ECDSA
- Llista de 10-30 intercanvis intangibles identificats
- 3-5 recomanacions accionables

\`\`\`mermaid
graph LR
  A --> B
\`\`\`
`;
const rendered = renderKnowledgeDoc(real, { relpath: 'socs/la-colla.md', githubBase: 'https://example.com/blob/main' });
ok('J · sos_context critical', rendered.frontmatter.sos_context === 'critical');
ok('J · h1 present', rendered.bodyHtml.includes('<h1>La Colla'));
ok('J · h2 present', rendered.bodyHtml.includes('<h2>Per què existeix</h2>'));
ok('J · blockquote', rendered.bodyHtml.includes('<blockquote>'));
ok('J · ul · 3 items', (rendered.bodyHtml.match(/<li>/g) || []).length === 3);
ok('J · pre code mermaid', rendered.bodyHtml.includes('lang-mermaid') && rendered.bodyHtml.includes('<pre>'));
ok('J · githubUrl format', rendered.githubUrl.endsWith('socs/la-colla.md'));

// ─── K · safety · escape XSS ────────────────────────────────────────────
console.log('\n— K · safety · escape XSS');
const xss = '# <script>alert(1)</script>';
const safe = renderMarkdown(xss);
ok('K · script escapat (no inline tag)', !safe.includes('<script>'));
ok('K · text visible', safe.includes('&lt;script&gt;'));

// ─── L · version exportat ──────────────────────────────────────────────
ok('L · MD_RENDERER_VERSION exportat', typeof MD_RENDERER_VERSION === 'string' && MD_RENDERER_VERSION.length > 0);

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
