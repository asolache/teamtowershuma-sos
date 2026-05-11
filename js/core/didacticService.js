// TEAMTOWERS SOS V11 — DIDACTIC SERVICE (UX-EDU-001 sprint A)
//
// Capas UX didácticas · "aprender haciendo" para el programa Matriu Cohort 0.
// Los conceptos teóricos (VNA · contabilidad triple-entry · slicing pie ·
// smart contracts · econom-IA) viven como popovers contextuales en la UI ·
// NO en prompts LLM ni en docs externos.
//
// Coste tokens: 0 · todo offline · estático.
//
// Sprints:
//   A · catálogo + render + integración /map y /savings (este módulo)
//   B · cobertura de /wallet /kanban /folders /identity /efficiency /market
//   C · vista /learn glosario navegable + persistencia "ya leído"
//   D · enlaces cruzados a SOPs/SOCs reales del proyecto activo

// ── Catálogo canónico ───────────────────────────────────────────────
// Cada concepto: { id, headline (≤80 chars), body (≤220 chars), linkRef? }

export const EDU_CONCEPTS = Object.freeze({
    'vna': Object.freeze({
        id: 'vna',
        icon: '🌐',
        headline: 'Value Network Analysis',
        body: 'Modela un sistema como red de roles que intercambian transacciones tangibles e intangibles. Verna Allee 2008. Raíz teórica del mapa de SOS.',
        linkRef: 'https://www.valuenetworksandcollaboration.com/',
    }),
    'value-network-analysis': Object.freeze({
        id: 'value-network-analysis',
        icon: '🌐',
        headline: 'Value Network Analysis',
        body: 'Modela un sistema como red de roles que intercambian transacciones tangibles e intangibles. Verna Allee 2008. Raíz teórica del mapa de SOS.',
        linkRef: 'https://www.valuenetworksandcollaboration.com/',
    }),
    'triple-entry-accounting': Object.freeze({
        id: 'triple-entry-accounting',
        icon: '📒',
        headline: 'Contabilidad triple-entry',
        body: 'Cada transacción se registra en 2 libros (cargo + abono) más 1 firma criptográfica auditada por tercero. Base del ahorro de SOS vs notaría/contable.',
        linkRef: null,
    }),
    'slicing-pie': Object.freeze({
        id: 'slicing-pie',
        icon: '🥧',
        headline: 'Slicing Pie · equity dinámico',
        body: 'Reparte equity proporcional a aportaciones reales (tiempo · dinero · activos). Mike Moyer. Base del cobro y multiplicadores en Matriu.',
        linkRef: 'https://slicingpie.com/',
    }),
    'fair-fractal-tokenomics': Object.freeze({
        id: 'fair-fractal-tokenomics',
        icon: '🧬',
        headline: 'Fair Fractal Tokenomics',
        body: '4 reglas Matriu · Fair (precio ex-ante) · Fractal (composable) · Escalable · Automàtic. Fundamento del Cohort 0 y multiplicador ×1.5.',
        linkRef: null,
    }),
    'soc': Object.freeze({
        id: 'soc',
        icon: '📐',
        headline: 'SOC · Standard Operating Concept',
        body: 'El "qué + por qué" del proyecto. Define el modelo conceptual antes que los procedimientos. Padre lógico de los SOPs.',
        linkRef: null,
    }),
    'sop': Object.freeze({
        id: 'sop',
        icon: '📜',
        headline: 'SOP · Standard Operating Procedure',
        body: 'El "cómo" paso a paso. Cada SOP en SOS lleva DTD (Deliverable Test Driven) y se ejecuta como Work Order al desplegarse.',
        linkRef: null,
    }),
    'dtd': Object.freeze({
        id: 'dtd',
        icon: '✅',
        headline: 'DTD · Deliverable Test Driven',
        body: 'Cada deliverable lleva un test booleano. Si lo verifica IA → automatización. Si lo verifica humano → revisión. TDD aplicado a procesos.',
        linkRef: null,
    }),
    'antigravity-engine': Object.freeze({
        id: 'antigravity-engine',
        icon: '🚀',
        headline: 'Antigravity Engine',
        body: 'Ciclo automatizado SOP → Work Order → Ledger. Cada procedimiento ejecutado genera trabajo y registro contable sin intervención manual extra.',
        linkRef: null,
    }),
    'context-pruning': Object.freeze({
        id: 'context-pruning',
        icon: '✂️',
        headline: 'Context Pruning · ROI tokens',
        body: 'Scorer 4 señales (tagOverlap 50% · recency 20% · typeBoost 20% · priority 10%) selecciona los nodos KB más relevantes para cada llamada LLM.',
        linkRef: null,
    }),
    'folksonomy': Object.freeze({
        id: 'folksonomy',
        icon: '🏷',
        headline: 'Folksonomía · tags libres',
        body: 'Etiquetas creadas por el operador, sin esquema impuesto. Permiten búsqueda emergente. Conviven con la taxonomía canónica del sistema.',
        linkRef: null,
    }),
    'taxonomy': Object.freeze({
        id: 'taxonomy',
        icon: '🗂',
        headline: 'Taxonomía canónica',
        body: 'Tags estructurados con prefijo (`type:` `phase:` `cohort:`) que el sistema entiende y filtra. Garantizan interoperabilidad entre vistas.',
        linkRef: null,
    }),
    'smart-contract': Object.freeze({
        id: 'smart-contract',
        icon: '🤝',
        headline: 'Smart contract',
        body: 'Acuerdo auto-ejecutable en blockchain. Cláusulas codificadas en Solidity / Vyper. Reduce coste de registro vs notaría tradicional.',
        linkRef: null,
    }),
    'sbt': Object.freeze({
        id: 'sbt',
        icon: '🎖',
        headline: 'SBT · Soulbound Token',
        body: 'Token no transferible que prueba pertenencia o reputación. Base de la identidad descentralizada de Cohort 0 (1 SBT por plaza fundacional).',
        linkRef: null,
    }),
    'cohort-0': Object.freeze({
        id: 'cohort-0',
        icon: '🎓',
        headline: 'Cohort 0 · 100 plazas fundacionales',
        body: 'Primer grupo Matriu · 100 plazas (número Dunbar). Multiplicador ×1.5 fundacional · 2.000 crèdits seed · 10 semanas de programa.',
        linkRef: null,
    }),
    'econom-ia': Object.freeze({
        id: 'econom-ia',
        icon: '🧠',
        headline: 'Econom-IA',
        body: 'Economía colaborativa potenciada por IA · automatización de flujos de valor + reducción de costes de registro + amplificación del trabajo humano.',
        linkRef: null,
    }),
    'did': Object.freeze({
        id: 'did',
        icon: '🆔',
        headline: 'DID · Decentralized Identifier',
        body: 'Identificador único auto-soberano (W3C). En SOS se usa `did:sos:{32hex}` derivado de la clave pública ECDSA P-256 del dispositivo.',
        linkRef: null,
    }),
});

// ── Pure helpers ────────────────────────────────────────────────────

export function getConcept(conceptId) {
    if (typeof conceptId !== 'string' || !conceptId) return null;
    return EDU_CONCEPTS[conceptId] || null;
}

export function listConcepts() {
    return Object.values(EDU_CONCEPTS);
}

function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
}

// renderExplainerBadge(conceptId, options) → HTML del badge accesible.
// options: { className?, size? ('xs'|'sm'|'md'), showLabel? }
export function renderExplainerBadge(conceptId, options = {}) {
    const concept = getConcept(conceptId);
    if (!concept) return '';
    const cls   = options.className || 'sos-edu-badge';
    const size  = options.size || 'sm';
    const showLabel = options.showLabel === true;
    const tooltipId = `sos-edu-tip-${escapeHtml(concept.id)}`;
    const headlineSafe = escapeHtml(concept.headline);
    const bodySafe     = escapeHtml(concept.body);
    const iconSafe     = escapeHtml(concept.icon || '?');
    const linkHtml = concept.linkRef
        ? `<a href="${escapeHtml(concept.linkRef)}" target="_blank" rel="noopener noreferrer" class="sos-edu-tip-link">+ saber más ↗</a>`
        : '';
    const labelHtml = showLabel ? `<span class="sos-edu-badge-label">${headlineSafe}</span>` : '';
    return [
        `<span class="${cls} sos-edu-size-${escapeHtml(size)}" data-edu-concept="${escapeHtml(concept.id)}" tabindex="0" role="button" aria-haspopup="true" aria-describedby="${tooltipId}" aria-label="Saber más sobre ${headlineSafe}">`,
            `<span class="sos-edu-badge-icon" aria-hidden="true">${iconSafe}</span>`,
            labelHtml,
            `<span class="sos-edu-tip" id="${tooltipId}" role="tooltip" hidden>`,
                `<span class="sos-edu-tip-headline">${headlineSafe}</span>`,
                `<span class="sos-edu-tip-body">${bodySafe}</span>`,
                linkHtml,
            `</span>`,
        `</span>`,
    ].join('');
}

// ── DOM-bound helpers (no-ops in node) ──────────────────────────────

let _eduStyleInjected = false;

export function ensureExplainerStyle() {
    if (typeof document === 'undefined') return;
    if (_eduStyleInjected) return;
    if (document.getElementById('sos-edu-style')) { _eduStyleInjected = true; return; }
    const css = `
.sos-edu-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    position: relative;
    cursor: help;
    padding: 2px 6px;
    border-radius: 999px;
    background: rgba(192, 132, 252, 0.10);
    border: 1px solid rgba(192, 132, 252, 0.35);
    color: var(--accent-purple);
    font-size: 11px;
    font-weight: 600;
    line-height: 1;
    user-select: none;
    transition: background 0.15s, border-color 0.15s;
}
.sos-edu-badge:hover, .sos-edu-badge:focus, .sos-edu-badge.is-open {
    background: rgba(192, 132, 252, 0.18);
    border-color: rgba(192, 132, 252, 0.6);
    outline: none;
}
.sos-edu-badge-icon { font-size: 12px; }
.sos-edu-badge-label { font-size: 10px; letter-spacing: 0.3px; text-transform: uppercase; }
.sos-edu-size-xs { padding: 1px 4px; font-size: 9px; }
.sos-edu-size-md { padding: 4px 10px; font-size: 13px; }
.sos-edu-tip {
    display: none;
    position: absolute;
    z-index: 9999;
    bottom: calc(100% + 8px);
    left: 0;
    width: 280px;
    max-width: 80vw;
    padding: 12px 14px;
    background: #0f0f15;
    border: 1px solid rgba(192, 132, 252, 0.5);
    border-radius: 10px;
    color: #e8e8f0;
    font-weight: 400;
    text-transform: none;
    letter-spacing: 0;
    text-align: left;
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.55);
    cursor: default;
}
.sos-edu-badge.is-open .sos-edu-tip { display: block; }
.sos-edu-tip-headline {
    display: block;
    font-size: 13px;
    font-weight: 800;
    color: var(--accent-purple);
    margin-bottom: 6px;
    line-height: 1.3;
}
.sos-edu-tip-body {
    display: block;
    font-size: 12px;
    line-height: 1.55;
    color: #c8c8d4;
}
.sos-edu-tip-link {
    display: inline-block;
    margin-top: 8px;
    font-size: 11px;
    color: var(--accent-purple);
    text-decoration: none;
}
.sos-edu-tip-link:hover { text-decoration: underline; }
@media (max-width: 720px) {
    .sos-edu-tip { left: 50%; transform: translateX(-50%); width: 240px; }
}
`;
    const style = document.createElement('style');
    style.id = 'sos-edu-style';
    style.textContent = css;
    document.head.appendChild(style);
    _eduStyleInjected = true;
}

let _eduGlobalBound = false;

export function bindExplainerBadges(rootEl) {
    if (typeof document === 'undefined') return;
    ensureExplainerStyle();
    const root = rootEl || document;
    const badges = root.querySelectorAll('.sos-edu-badge:not([data-edu-bound])');
    badges.forEach(badge => {
        badge.setAttribute('data-edu-bound', '1');
        const close = () => badge.classList.remove('is-open');
        const toggle = () => badge.classList.toggle('is-open');
        badge.addEventListener('mouseenter', () => badge.classList.add('is-open'));
        badge.addEventListener('mouseleave', close);
        badge.addEventListener('focus', () => badge.classList.add('is-open'));
        badge.addEventListener('blur', close);
        badge.addEventListener('click', (e) => {
            e.stopPropagation();
            toggle();
        });
        badge.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') close();
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggle();
            }
        });
    });
    if (!_eduGlobalBound) {
        _eduGlobalBound = true;
        document.addEventListener('click', (e) => {
            const inside = e.target.closest && e.target.closest('.sos-edu-badge');
            if (!inside) {
                document.querySelectorAll('.sos-edu-badge.is-open').forEach(el => el.classList.remove('is-open'));
            }
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.sos-edu-badge.is-open').forEach(el => el.classList.remove('is-open'));
            }
        });
    }
}
