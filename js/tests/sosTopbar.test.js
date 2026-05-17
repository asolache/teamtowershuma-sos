// =============================================================================
// TEAMTOWERS SOS V11 — SOS TOPBAR · STANDARDIZATION · TDD (v125)
// Ruta · /js/tests/sosTopbar.test.js
//
// Sprint B · helper canònic per a topbars de view. Opt-in · co-existeix amb
// els 14 topbars actuals fins que es migrin.
// =============================================================================

import { renderViewTopbar, projectContextLinks, ensureTopbarStyle, SOS_TOPBAR_VERSION } from '../core/sosTopbar.js';

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== SOS TOPBAR · v125 ===\n');

// ─── A · renderViewTopbar shape ────────────────────────────────────────
console.log('— A · renderViewTopbar · structure');
{
    const html = renderViewTopbar({ icon: '💰', title: 'Wallet', subtitle: 'proj-x' });
    ok('A · role=banner per a11y',           html.includes('role="banner"'));
    ok('A · class sos-view-topbar',          html.includes('sos-view-topbar"'));
    ok('A · icon 💰 inclós',                  html.includes('💰'));
    ok('A · title "Wallet" inclós',          html.includes('Wallet'));
    ok('A · subtitle "proj-x" inclós',       html.includes('proj-x'));
    ok('A · spacer present (push links right)', html.includes('sos-view-topbar-spacer'));
}

// ─── B · contextLinks · primary · accent · data-link ──────────────────
console.log('\n— B · contextLinks · variants');
{
    const html = renderViewTopbar({
        icon: '📜', title: 'Pacte',
        contextLinks: [
            { href: '/wallet?project=p1', icon: '💰', label: 'Wallet' },
            { href: '/value-accounting?project=p1', icon: '🥧', label: 'Tarta', accent: true },
            { href: '/notarize', icon: '🌐', label: 'Notaritzar', primary: true },
            { href: 'https://external.com', icon: '↗', label: 'Extern', dataLink: false },
        ],
    });
    ok('B · 4 links renderitzats',           (html.match(/sos-view-topbar-link/g) || []).length >= 4);
    ok('B · primary modifier · CTA principal', html.includes('sos-view-topbar-link-primary'));
    ok('B · accent modifier',                 html.includes('sos-view-topbar-link-accent'));
    ok('B · dataLink:false NO posa data-link', !/external\.com[^>]*data-link/.test(html));
    ok('B · dataLink default true posa data-link', /\/wallet[^>]*data-link/.test(html));
}

// ─── C · escapatge · XSS protection ────────────────────────────────────
console.log('\n— C · escapatge HTML');
{
    const html = renderViewTopbar({ icon: '🔥', title: '<script>x</script>', subtitle: '"quote"' });
    ok('C · <script> escapat',                !html.includes('<script>x</script>'));
    ok('C · &lt;script&gt; output',           html.includes('&lt;script&gt;'));
    ok('C · doble cometa escapada',           html.includes('&quot;quote&quot;'));
}

// ─── D · projectContextLinks helper ────────────────────────────────────
console.log('\n— D · projectContextLinks · helper KISS');
{
    const links = projectContextLinks({ projectId: 'proj-abc', current: 'wallet' });
    ok('D · retorna array',                   Array.isArray(links));
    ok('D · exclou current (wallet)',         !links.some(l => l.id === 'wallet'));
    ok('D · 5 links restants (hub/map/pact/tarta/kanban)', links.length === 5);
    ok('D · href properly url-encoded',       links[0].href.includes('proj-abc'));
    const noProject = projectContextLinks({ projectId: null });
    ok('D · sense projectId · array buit',    Array.isArray(noProject) && noProject.length === 0);
}

// ─── E · ensureTopbarStyle · idempotent ────────────────────────────────
console.log('\n— E · ensureTopbarStyle · CSS injection');
// Mock document
const mockHead = { children: [], appendChild(el) { this.children.push(el); } };
const originalDoc = globalThis.document;
globalThis.document = { getElementById: (id) => mockHead.children.find(c => c.id === id) || null, createElement: () => ({ id: '', textContent: '' }), head: mockHead };
ensureTopbarStyle();
ensureTopbarStyle();   // call twice · should be idempotent
ok('E · CSS injectat un sol cop',             mockHead.children.length === 1);
ok('E · style id correcte',                   mockHead.children[0].id === 'sos-view-topbar-style');
ok('E · CSS inclou .sos-view-topbar class',   mockHead.children[0].textContent.includes('.sos-view-topbar'));
ok('E · CSS responsive media query',          mockHead.children[0].textContent.includes('@media (max-width: 720px)'));
globalThis.document = originalDoc;

// ─── F · SOS_TOPBAR_VERSION exposat ────────────────────────────────────
console.log('\n— F · API surface');
ok('F · SOS_TOPBAR_VERSION exposat',          typeof SOS_TOPBAR_VERSION === 'string' && SOS_TOPBAR_VERSION.startsWith('v'));

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
