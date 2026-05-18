// =============================================================================
// TEAMTOWERS SOS V11 — KANBAN VIEW (H7.1)
// Ruta: /js/views/KanbanView.js
//
// Cierra el lazo SOS = Swarm Operative System: SOP → Work Order → Ledger.
// Cuatro columnas:
//   📥 Backlog       · WO creada, sin empezar
//   ⚙️  En curso      · WO aceptada por su assignee (humano|IA)
//   ✅ Finalizadas   · WO producida, pendiente de aprobación (manual o TDD-auto)
//   💶 Contabilizadas · WO aprobada → genera ledger_entry firmado
//
// Cada WO tiene:
//   - assignee {kind: human|ai, id, engine?}
//   - approvalRule: manual | tdd-auto
//   - tracking de coste estimado vs real (humano: horas × FMV; IA: tokens × precio)
//   - cálculo de ahorro (humanCostEstimado - aiCostReal) cuando aplique
//
// Persistencia: nodos `type: 'work_order'` en KB Mind-as-Graph.
// Al pasar a "Contabilizadas", se dispatcha LEDGER_UPDATE con el coste real.
// =============================================================================

import { store }           from '../core/store.js';
import { KB }              from '../core/kb.js';
import { KnowledgeLoader } from '../core/KnowledgeLoader.js';
import { linkifyMultiline } from '../core/linkifyService.js';
import { taxonomicTagsForWo, mergeTags } from '../core/semanticTagger.js';
import { renderNavLinksHtml, renderNavGroupedHtml, ensureNavGroupStyle, bindNavGroupDropdowns } from '../core/navService.js';
import { visibleProjects } from '../core/projectFilter.js';
import { renderExplainerBadge, bindExplainerBadges, ensureExplainerStyle } from '../core/didacticService.js';

// Orchestrator se importa dinámicamente con cache-bust en _executeAi
// (ver BUG-002/003) para que fixes del parser se apliquen sin requerir
// purga de caché del navegador.

// ─── Configuración ──────────────────────────────────────────────────────────
const COLUMNS = [
    { id: 'backlog',  label: 'Backlog',       color: '#94a3b8', emoji: '📥' },
    { id: 'doing',    label: 'En curso',      color: '#6366f1', emoji: '⚙️'  },
    { id: 'done',     label: 'Finalizadas',   color: '#22c55e', emoji: '✅' },
    { id: 'ledgered', label: 'Contabilizadas', color: '#16a34a', emoji: '💶' },
];

// Tarifas IA por 1M tokens (en USD aprox EUR). Source: Orchestrator BASE_PRICING.
const AI_PRICING = {
    anthropic: { input: 3.00,  output: 15.00 },
    openai:    { input: 2.50,  output: 10.00 },
    deepseek:  { input: 0.14,  output: 0.28  },
    gemini:    { input: 0.075, output: 0.30  },
};
const FMV_HUMAN_DEFAULT = 50;   // €/h por defecto (editable por WO)
const MARKUP            = 1.30; // 30% markup sobre coste IA bruto

const DEFAULT_ENGINE = 'anthropic';

function uid() { return 'wo-' + Math.random().toString(36).slice(2, 9) + '-' + Date.now().toString(36); }

function fmtEur(n) {
    if (n == null || isNaN(n)) return '—';
    return Number(n).toFixed(2) + ' €';
}

function colMeta(id) { return COLUMNS.find(c => c.id === id) || COLUMNS[0]; }

// ─── H7.3 · Generador puro de Work Orders desde steps[] de un SOP ──────────
// Toma un array de steps (cada uno con role_kind, role_profile, label,
// duration_minutes, approval_rule, priority, deliverable_kind, id) y devuelve
// un array de WOs listos para insertar. Ver knowledge/vision/sop-to-wo-model.md.
// Pública para test.
export function generateWosFromSop(sopSlug, steps, options = {}) {
    if (!Array.isArray(steps)) return [];
    const {
        workshopId   = null,
        projectId    = null,
        socRefs      = ['soc-teamtowers-brand'],
        fmvPerHour   = 50,
        idPrefix     = '',
    } = options;
    const baseId = idPrefix || sopSlug.replace(/[^\w-]/g, '').slice(0, 24);
    const ts     = Date.now().toString(36);
    return steps.map((step, i) => {
        const kind = step.role_kind === 'ai' ? 'ai' : 'human';
        const stepId = step.id || ('step-' + i);
        const sopRef = 'sop-' + sopSlug;
        const node = {
            id:        'wo-' + baseId + '-' + stepId.slice(0, 24) + '-' + ts + '-' + i,
            type:      'work_order',
            projectId,
            content: {
                title:           step.label || ('Paso ' + (i + 1)),
                description:     '',
                workshopId,
                sopRef,
                stepRef:         stepId,
                socRefs:         Array.isArray(socRefs) ? socRefs.slice() : ['soc-teamtowers-brand'],
                assignee: {
                    kind,
                    id:     kind === 'ai' ? (step.role_profile || 'agente_anthropic') : (step.role_profile || 'pending'),
                    engine: kind === 'ai' ? 'anthropic' : null,
                },
                approvalRule:    step.approval_rule || 'manual',
                priority:        step.priority || 'med',
                estimatedHours:  (Number(step.duration_minutes) || 30) / 60,
                fmvPerHour,
                actualHours:     null,
                tokensIn:        null,
                tokensOut:       null,
                deliverableKind: step.deliverable_kind || null,
                status:          'backlog',
                tags:            [],
            },
            keywords: ['work_order', kind, sopRef, stepId],
        };
        // UX-002 · auto-tagging taxonómico al generar
        const tax = taxonomicTagsForWo(node, sopRef, step);
        node.content.tags = mergeTags(tax, []);
        node.keywords     = Array.from(new Set([...(node.keywords || []), ...node.content.tags]));
        return node;
    });
}

// ─── Builder del userPrompt para auto-ejecución IA (H7.2) ───────────────────
// Pública para test. Construye el userPrompt que se enviará al LLM cuando
// el operador pulse "▶ Ejecutar con IA" en una WO de tipo IA.
//
// v155 · refactor · port de Sprint's 6-section structured prompt approach
// (audit Sprint vs Kanban v154 · "el que millora qualitat entregable").
// L'estructura clara de seccions força el LLM a output complet · validable
// per humà en < 5 min · sense parts buides.
export function buildExecutionPrompt(wo) {
    const c = wo.content || {};
    const ass = c.assignee || {};
    const kind = _detectWoKind(c);

    const lines = [
        '# TASCA · Executa aquesta Work Order del SOS V11',
        '',
        'Genera l\'entregable corresponent en MARKDOWN ESTRUCTURAT seguint EXACTAMENT les 5 seccions de sortida descrites més avall. Cap secció pot quedar buida. Català o castellà segons descripció.',
        '',
        '## CONTEXT WO',
        '- **id**: `' + (wo.id || c.id || '(sense id)') + '`',
        '- **título**: ' + (c.title || '(sense títol)'),
        '- **descripció**: ' + (c.description || '(sense descripció)'),
        c.sopRef     ? '- **SOP referència**: `' + c.sopRef + '`'             : null,
        c.stepRef    ? '- **Pas del SOP**: `' + c.stepRef + '`'                : null,
        c.workshopId ? '- **Workshop associat**: ' + c.workshopId              : null,
        c.priority   ? '- **prioritat**: ' + c.priority                         : null,
        '- **engine**: ' + (ass.engine || 'anthropic'),
        '- **aprovació**: ' + (c.approvalRule || 'manual'),
        '- **kind inferit**: ' + kind,
        '',
        '## REGLES IRRENUNCIABLES (compliance · REGLAS IRRENUNCIABLES)',
        '1. Respecta el SOC raíz / soc-teamtowers-brand i els SOCs específics que reps al context system.',
        '2. NO inventis dades · NO inventes datos. Si falta info, marca `[pendent — l\'operador ha d\'afegir context]`.',
        '3. NO incloguis preus · NO incluyas precios · usa `[VER CATÀLEG]` o `[VER CATÁLOGO]` com a placeholder.',
        '4. Cita textualment del SOP quan apliqui (entre cometes).',
        '5. Output autocontingut · revisable en < 5 min per humà.',
    ];
    if (c.approvalRule === 'tdd-auto' && c.tddCheck) {
        lines.push('6. **TDD check · test booleano** · el output ha d\'estar construït per passar aquest test booleà · `' + c.tddCheck + '`. Dissenya l\'estructura perquè evalui `true`.');
    }

    // v155 · 5 seccions estructurades · adaptades al kind de WO
    lines.push('', '## 📦 ENTREGABLE · 5 seccions OBLIGATÒRIES (no n\'ometis cap)');
    if (kind === 'code' || kind === 'engineering') {
        lines.push(
            '### 1. Resum executiu (3-4 línies)',
            'Què aporta aquest entregable · per què val la pena · valor diferencial al projecte.',
            '',
            '### 2. Pla d\'implementació',
            'Llistat dels fitxers/components a crear o modificar · 1 línia descripció per cada un · ordre seqüencial.',
            '',
            '### 3. API surface / contracte',
            'Exports principals · signatures · format input/output · sense implementació interna.',
            '',
            '### 4. Test plan + riscos',
            '- Tests · llistat grups (A · B · C…) + què verifica cada un.',
            '- Riscos · 2-3 identificats + mitigació concreta.',
            '',
            '### 5. Aplicació + verificació',
            'Pasos exactes per a aplicar manualment · comanda terminal si cal · verificació booleana (com saps que ha funcionat).',
        );
    } else if (kind === 'content' || kind === 'copy' || kind === 'pitch' || kind === 'doc') {
        lines.push(
            '### 1. Resum executiu (3-4 línies)',
            'Què aporta · per a qui · diferencial.',
            '',
            '### 2. Outline · estructura del document',
            'Llistat de seccions amb 1 línia descripció per cada una.',
            '',
            '### 3. Cos del document (draft complet)',
            'Tot el contingut · llest per publicar · sense placeholders genèrics (excepte els marcats [VER CATÀLEG]).',
            '',
            '### 4. CTAs + següents passos',
            'Crides a l\'acció · 1 primària + 2 secundàries · enllaços relatius si apliquen.',
            '',
            '### 5. Riscos + revisió suggerida',
            'Què revisar · 2-3 punts crítics per al humà · checklist booleà.',
        );
    } else {
        // Generic kind · default 5 sections (procediment · audit · comm · etc)
        lines.push(
            '### 1. Resum executiu (3-4 línies)',
            'Què aporta aquest entregable · per què · valor diferencial.',
            '',
            '### 2. Output principal',
            'El contingut canonical demanat · estructura clara · sense parts buides.',
            '',
            '### 3. Decisions preses + alternatives descartades',
            'Per cada decisió no òbvia · 1 línia rationale · 1 línia alternativa descartada + per què.',
            '',
            '### 4. Test/verificació booleana',
            'Com saps que aquest output ha funcionat · check explícit (humà o automàtic) · format · "Aquesta sortida és vàlida si X · Y · Z".',
            '',
            '### 5. Riscos + següents passos',
            'Riscos detectats · mitigació · 2-3 next steps concrets.',
        );
    }
    lines.push(
        '',
        'IMPORTANT · les 5 seccions han d\'estar TOTES presents · titulades exactament com indicat · cap "TBD" o "pendent" excepte als placeholders permesos.',
    );
    return lines.filter(Boolean).join('\n');
}

// v155 · _detectWoKind · pure · infereix tipus WO per adaptar seccions del prompt
function _detectWoKind(c) {
    if (!c) return 'generic';
    const txt = ((c.title || '') + ' ' + (c.description || '') + ' ' + (c.sopRef || '')).toLowerCase();
    if (/code|implement|refactor|engineer|test|api|backend|frontend|component|module|library/i.test(txt)) return 'code';
    if (/content|copy|landing|pitch|blog|article|doc|writeup|post/i.test(txt)) return 'content';
    return 'generic';
}

// ─── Cálculo de coste de una WO ─────────────────────────────────────────────
// Devuelve { humanCostEur, aiCostEur, savingEur, slices }.
// Pública para test.
export function computeWOCost(wo) {
    const c = wo.content || {};
    const fmv = c.fmvPerHour || FMV_HUMAN_DEFAULT;
    const estHours = Number(c.estimatedHours || 0);
    const realHours = c.actualHours != null ? Number(c.actualHours) : null;

    const humanCostEstimated = estHours * fmv;
    const humanCostReal      = realHours != null ? realHours * fmv : null;

    let aiCostReal = null;
    if (c.assignee?.kind === 'ai' && c.tokensIn != null && c.tokensOut != null) {
        const eng = c.assignee.engine || DEFAULT_ENGINE;
        const p = AI_PRICING[eng] || AI_PRICING[DEFAULT_ENGINE];
        const raw = (Number(c.tokensIn) / 1e6) * p.input + (Number(c.tokensOut) / 1e6) * p.output;
        aiCostReal = raw * MARKUP;
    }

    // Coste real de la WO según quien la haya ejecutado
    const realCost = c.assignee?.kind === 'ai' ? aiCostReal : humanCostReal;

    // Ahorro de automatización: lo que habría costado al humano vs lo que costó la IA
    const savingEur = (c.assignee?.kind === 'ai' && aiCostReal != null)
        ? Math.max(0, humanCostEstimated - aiCostReal)
        : null;

    return {
        humanCostEstimated: Number(humanCostEstimated.toFixed(2)),
        humanCostReal: humanCostReal != null ? Number(humanCostReal.toFixed(2)) : null,
        aiCostReal:    aiCostReal    != null ? Number(aiCostReal.toFixed(4))    : null,
        realCost:      realCost      != null ? Number(realCost.toFixed(4))      : 0,
        savingEur:     savingEur     != null ? Number(savingEur.toFixed(2))     : null,
    };
}

// =============================================================================
export default class KanbanView {

    constructor() {
        document.title = 'Kanban · SOS V11';
        this.workOrders = [];
        this.workshops  = [];
        this.projects   = [];
        // H7.5 · filtro por proyecto. null = "todos".
        // Se inicializa desde URL ?project=... en afterRender().
        // UX-NAV-001 · leer ?project= ya en el constructor para que la
        // topbar pueda renderizar los nav links con contexto desde el primer paint.
        try {
            const u = new URL(window.location.href);
            this.projectFilter = u.searchParams.get('project') || null;
        } catch (_) { this.projectFilter = null; }
    }

    async getHtml() {
        return `
        <style>
            .kb-shell      { height:100dvh; background:var(--bg-dark); color:var(--text-main); font-family:var(--font-base); display:flex; flex-direction:column; overflow:hidden; }
            .kb-topbar     { display:flex; align-items:center; gap:1rem; padding:0.85rem 1.5rem; border-bottom:1px solid var(--border-default); background:var(--bg-panel); flex-shrink:0; }
            .kb-logo       { font-weight:700; color:var(--text-main); text-decoration:none; font-size:1.05rem; }
            .kb-logo span  { color:var(--accent-indigo); }
            .kb-title      { color:var(--text-secondary); font-weight:600; letter-spacing:0.05em; text-transform:uppercase; font-size:0.8rem; }
            .kb-spacer     { flex:1; }
            .kb-btn        { background:var(--bg-elevated); color:var(--text-main); border:1px solid var(--border-default); padding:0.5rem 1rem; border-radius:var(--radius-md); cursor:pointer; font-size:0.85rem; font-family:var(--font-base); transition:all var(--dur-fast); }
            .kb-btn:hover  { background:var(--glass-hover); border-color:var(--border-strong); }
            .kb-btn-primary{ background:var(--accent-indigo); border-color:var(--accent-indigo); color:#fff; }
            .kb-btn-primary:hover { filter:brightness(1.08); }
            .kb-link       { color:var(--accent-indigo); text-decoration:none; }

            .kb-main       { padding:1.5rem; max-width:1600px; margin:0 auto; flex:1; overflow-y:auto; overflow-x:hidden; width:100%; }
            .kb-stats      { display:flex; gap:1rem; margin-bottom:1.5rem; flex-wrap:wrap; }
            .kb-stat       { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:var(--radius-md); padding:0.85rem 1.1rem; min-width:140px; box-shadow:var(--shadow-sm); }
            .kb-stat-num   { font-size:1.4rem; font-weight:700; color:var(--text-main); line-height:1; }
            .kb-stat-lbl   { color:var(--text-muted); font-size:0.72rem; text-transform:uppercase; letter-spacing:0.08em; margin-top:0.4rem; font-weight:600; }

            .kb-board      { display:grid; grid-template-columns:repeat(4, 1fr); gap:1rem; min-height:60vh; }
            @media (max-width: 1100px) { .kb-board { grid-template-columns:repeat(2, 1fr); } }
            @media (max-width: 700px)  { .kb-board { grid-template-columns:1fr; } }

            /* mobile-first responsive · UX-MOBILE-D continuation */
            @media (max-width: 768px) {
                .kb-topbar { padding:0.6rem 0.8rem; gap:0.5rem; flex-wrap:wrap; }
                .kb-title { display:none; }
                .kb-spacer { display:none; }
                .kb-btn { padding:0.45rem 0.7rem; font-size:0.78rem; }
                .kb-main { padding:0.8rem; }
                .kb-stats { gap:0.5rem; }
                .kb-stat { min-width:0; flex:1 1 130px; padding:0.6rem 0.8rem; }
                .kb-stat-num { font-size:1.15rem; }
                #kbSwarmToggle { font-size:0.72rem !important; padding:5px 8px !important; }
            }

            .kb-col        { background:var(--bg-panel); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:0.85rem; display:flex; flex-direction:column; gap:0.7rem; }
            .kb-col-h      { color:var(--text-secondary); font-size:0.78rem; text-transform:uppercase; letter-spacing:0.1em; font-weight:700; display:flex; align-items:center; gap:0.5rem; padding-bottom:0.5rem; border-bottom:2px solid var(--accent,var(--accent-indigo)); }
            .kb-col-h .pill{ background:var(--bg-elevated); padding:1px 8px; border-radius:10px; font-size:0.7rem; color:var(--text-secondary); }

            .kb-card       { background:var(--bg-elevated); border:1px solid var(--border-subtle); border-left:3px solid var(--accent,var(--accent-indigo)); border-radius:var(--radius-sm); padding:0.7rem; cursor:pointer; transition:background var(--dur-fast), border-color var(--dur-fast); }
            .kb-card:hover { background:var(--glass-hover); border-color:var(--border-default); }
            .kb-card h5    { margin:0 0 0.4rem 0; color:var(--text-main); font-size:0.88rem; line-height:1.3; font-weight:700; }
            .kb-card .meta { color:var(--text-muted); font-size:0.72rem; line-height:1.5; }
            .kb-card .badges { display:flex; gap:0.3rem; flex-wrap:wrap; margin-top:0.4rem; }
            .kb-badge      { font-size:0.68rem; padding:1px 6px; border-radius:8px; background:var(--bg-elevated); color:var(--text-secondary); }
            .kb-badge.ai   { background:rgba(99,102,241,0.18); color:var(--accent-indigo); }
            .kb-badge.human{ background:rgba(16,185,129,0.18); color:var(--accent-green); }
            .kb-badge.tdd  { background:rgba(212,168,83,0.18); color:var(--accent-orchestrator); }
            .kb-badge.high { background:rgba(239,68,68,0.18); color:var(--accent-red); }
            .kb-badge.med  { background:rgba(99,102,241,0.18); color:var(--accent-indigo); }
            .kb-badge.cost { background:rgba(16,185,129,0.18); color:var(--accent-green); font-family:var(--font-mono); }
            .kb-badge.save { background:rgba(212,168,83,0.18); color:var(--accent-orchestrator); font-family:var(--font-mono); }

            .kb-empty      { text-align:center; color:var(--text-muted); font-size:0.85rem; padding:1rem; border:1px dashed var(--border-default); border-radius:var(--radius-sm); }

            .kb-modal      { position:fixed; inset:0; background:var(--bg-overlay); display:flex; align-items:flex-start; justify-content:center; z-index:var(--z-modal); padding:2rem 1rem; overflow-y:auto; }
            .kb-modal-inner{ background:var(--bg-panel); border:1px solid var(--border-default); border-radius:var(--radius-lg); padding:1.5rem; width:100%; max-width:560px; max-height:90vh; overflow-y:auto; box-shadow:var(--shadow-lg); color:var(--text-main); }
            .kb-modal h3   { margin:0 0 1rem 0; color:var(--text-main); }
            .kb-modal label{ display:block; color:var(--text-secondary); font-size:0.8rem; margin-top:0.7rem; margin-bottom:0.25rem; font-weight:600; }
            .kb-modal input, .kb-modal select, .kb-modal textarea { width:100%; box-sizing:border-box; background:var(--bg-elevated); color:var(--text-main); border:1px solid var(--border-default); border-radius:var(--radius-sm); padding:0.55rem 0.7rem; font-size:0.9rem; font-family:inherit; outline:none; transition:border-color var(--dur-fast); }
            .kb-modal input:focus, .kb-modal select:focus, .kb-modal textarea:focus { border-color:var(--accent-indigo); box-shadow:var(--shadow-focus); }
            .kb-modal textarea { min-height:60px; resize:vertical; }
            .kb-modal .row { display:grid; grid-template-columns:1fr 1fr; gap:0.7rem; }
            .kb-modal .actions { display:flex; gap:0.5rem; justify-content:flex-end; margin-top:1.2rem; flex-wrap:wrap; }
            .kb-modal .actions .danger { background:rgba(239,68,68,0.12); border-color:rgba(239,68,68,0.30); color:var(--accent-red); }
        </style>

        <div class="kb-shell">
            <div class="kb-topbar">
                <a href="/" data-link class="kb-logo">🗼 Team<span>Towers</span></a>
                <span class="kb-title">Kanban · Work Orders · Antigravity Engine ${renderExplainerBadge('antigravity-engine', { size: 'xs' })}</span>
                <div class="kb-spacer"></div>
                
                <select id="kbProjectFilter" class="kb-btn" style="background:#1a1a22;border-color:#2a2a35;cursor:pointer;font-family:inherit;">
                    <option value="">📁 Todos los proyectos</option>
                </select>
                <button class="kb-btn" id="kbBtnFromSop">📋 Desde SOP</button>
                <button class="kb-btn kb-btn-primary" id="kbBtnNew">＋ Nueva WO</button>
                <label id="kbSwarmToggle" style="display:flex;align-items:center;gap:6px;padding:6px 10px;border-radius:4px;background:rgba(168,85,247,0.10);border:1px solid rgba(168,85,247,0.30);font-size:0.78rem;cursor:pointer;color:#a8b2ff;user-select:none;" title="Mode swarm · cada WO té botó auto-run amb agent IA · llegeix de docs/backlog.yaml">
                    <input type="checkbox" id="kbSwarmCheckbox" style="width:14px;height:14px;cursor:pointer;accent-color:#a855f7;">
                    🐝 Swarm mode
                </label>
            </div>

            <div class="kb-main">
                <div class="kb-stats" id="kbStats"></div>
                <div class="kb-board" id="kbBoard"></div>
            </div>

            <div id="kbModalRoot"></div>
        </div>
        `;
    }

    async afterRender() {
        // UX-EDU-001 sprint B · activar badges didácticos
        ensureExplainerStyle();
        bindExplainerBadges(document);

        // H7.5 · leer ?project= de la URL (filtro persistente)
        try {
            const url = new URL(window.location.href);
            this.projectFilter = url.searchParams.get('project') || null;
        } catch (_) { this.projectFilter = null; }

        await this._load();
        this._populateProjectFilter();
        this._render();
        document.getElementById('kbBtnNew').addEventListener('click',     () => this._openCreateModal());
        document.getElementById('kbBtnFromSop').addEventListener('click', () => this._openFromSopModal());

        // SWARM-RELOC-001 · swarm mode toggle · persisteix a localStorage per
        // projecte · si actiu · cada WO té botó "🐝 Auto-run" amb agent IA
        try {
            const swarmCheckbox = document.getElementById('kbSwarmCheckbox');
            if (swarmCheckbox) {
                const lsKey = 'sos_kanban_swarm_mode_' + (this.projectFilter || 'global');
                const stored = localStorage.getItem(lsKey);
                swarmCheckbox.checked = stored === 'true';
                this._swarmMode = swarmCheckbox.checked;
                if (this._swarmMode) {
                    document.getElementById('kbSwarmToggle')?.classList.add('swarm-active');
                }
                swarmCheckbox.addEventListener('change', () => {
                    this._swarmMode = swarmCheckbox.checked;
                    try { localStorage.setItem(lsKey, String(this._swarmMode)); } catch (_) {}
                    this._render();
                    try {
                        const { toast } = require('../core/uxComponents.js');
                        toast({
                            kind: this._swarmMode ? 'success' : 'info',
                            text: this._swarmMode
                                ? '🐝 Swarm mode actiu · WOs amb botó Auto-run'
                                : 'Swarm mode desactivat',
                            ttl: 3000,
                        });
                    } catch (_) {
                        import('../core/uxComponents.js').then(m => m.toast({
                            kind: this._swarmMode ? 'success' : 'info',
                            text: this._swarmMode
                                ? '🐝 Swarm mode actiu · WOs amb botó Auto-run'
                                : 'Swarm mode desactivat',
                            ttl: 3000,
                        })).catch(() => {});
                    }
                });
            }
        } catch (_) {}

        // H7.5 · listener del selector de proyecto
        const sel = document.getElementById('kbProjectFilter');
        sel.addEventListener('change', () => {
            this.projectFilter = sel.value || null;
            // Persistir en URL sin recargar
            try {
                const url = new URL(window.location.href);
                if (this.projectFilter) url.searchParams.set('project', this.projectFilter);
                else url.searchParams.delete('project');
                window.history.replaceState(null, '', url.toString());
            } catch (_) {}
            this._render();
        });
    }

    // H7.5 · llena el <select> con los proyectos del store + opción "Todos"
    _populateProjectFilter() {
        const sel = document.getElementById('kbProjectFilter');
        if (!sel) return;
        const opts = ['<option value="">📁 Todos los proyectos</option>']
            .concat(this.projects.map(p =>
                `<option value="${p.id}" ${p.id === this.projectFilter ? 'selected' : ''}>${this._esc(p.nombre || p.id)}</option>`
            ));
        sel.innerHTML = opts.join('');
    }

    // H7.5 · filtra workOrders por proyecto activo (null = todas)
    _filteredWOs() {
        if (!this.projectFilter) return this.workOrders;
        return this.workOrders.filter(w => (w.projectId || w.content?.projectId) === this.projectFilter);
    }

    destroy() {}

    // ─── data ──────────────────────────────────────────────────────────────
    async _load() {
        await KB.init();
        await store.init();
        this.workOrders = await KB.query({ type: 'work_order' });
        this.workshops  = await KB.query({ type: 'workshop' });
        this.projects   = visibleProjects(store.getState().projects);
        // WO-ASSIGN-001 · plazas Matriu disponibles (todas · type cohort_seat)
        this.cohortSeats = await KB.query({ type: 'cohort_seat' });
        this.workOrders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    async _save(node) {
        await store.dispatch({ type: 'KB_UPSERT', payload: { node } });
        await this._load();
        this._render();
    }

    async _delete(id) {
        if (!confirm('¿Borrar esta Work Order? Si ya está contabilizada, su entrada en Ledger NO se borra.')) return;
        await store.dispatch({ type: 'KB_DELETE', payload: { id } });
        await this._load();
        this._render();
    }

    async _move(id, newStatus, extras = {}) {
        const wo = this.workOrders.find(x => x.id === id);
        if (!wo) return;
        const updated = {
            ...wo,
            content: { ...wo.content, ...extras, status: newStatus },
        };
        await this._save(updated);
    }

    // Transición a 'ledgered': calcula coste y dispatcha LEDGER_UPDATE.
    // Si el assignee es IA, también acumula el ahorro de automatización.
    async _ledgerize(id, extras = {}) {
        const wo = this.workOrders.find(x => x.id === id);
        if (!wo) return;
        const prevContent = { ...wo.content, ...extras };
        const cost = computeWOCost({ ...wo, content: prevContent });

        // Determinar projectId destino. Si el WO no tiene proyecto,
        // se asocia al workshop si existe; si no, queda como '_freeform'.
        let projectId = wo.projectId;
        if (!projectId && prevContent.workshopId) {
            const ws = this.workshops.find(w => w.id === prevContent.workshopId);
            projectId = ws?.projectId || null;
        }
        // Si no hay project, usamos un proyecto ficticio para el ledger
        // que el usuario podrá reasignar más adelante.
        const ledgerProjectId = projectId || '_ws-freeform';

        const ledgerPayload = {
            projectId:        ledgerProjectId,
            workOrderId:      wo.id,
            agentId:          prevContent.assignee?.id || 'pending',
            assigneeKind:     prevContent.assignee?.kind || 'human',
            engine:           prevContent.assignee?.engine || null,
            realHours:        Number(prevContent.actualHours || 0),
            fmv:              Number(prevContent.fmvPerHour || FMV_HUMAN_DEFAULT),
            multiplier:       1,
            tokensIn:         prevContent.tokensIn || null,
            tokensOut:        prevContent.tokensOut || null,
            humanCostEstimated: cost.humanCostEstimated,
            humanCostReal:      cost.humanCostReal,
            aiCostReal:         cost.aiCostReal,
            savingEur:          cost.savingEur,
        };
        await store.dispatch({ type: 'LEDGER_UPDATE', payload: ledgerPayload });

        // Actualizar la WO con la referencia al ledger entry
        const finalContent = {
            ...prevContent,
            status:         'ledgered',
            ledgeredAt:     Date.now(),
            humanCostEur:   cost.humanCostReal != null ? cost.humanCostReal : cost.humanCostEstimated,
            aiCostEur:      cost.aiCostReal,
            savingEur:      cost.savingEur,
            ledgerProjectId,
        };
        await this._save({ ...wo, content: finalContent });
    }

    // ─── H7.2 · Auto-ejecución de WO por IA ─────────────────────────────────
    // Construye contexto via KnowledgeLoader (SOCs + SOP + projectId) →
    // llama Orchestrator.callLLM → captura tokens reales → actualiza WO →
    // si approvalRule='tdd-auto' y tddCheck pasa, transiciona a ledgered.
    async _executeAi(woId, extras = {}) {
        const wo = this.workOrders.find(x => x.id === woId);
        if (!wo) return;
        const c = { ...wo.content, ...extras };

        // Resolver SOCs/SOPs a inyectar
        const socs = Array.isArray(c.socRefs) && c.socRefs.length
            ? c.socRefs.map(s => s.replace(/^soc-/, ''))
            : ['teamtowers-brand'];
        const sops = c.sopRef ? [c.sopRef.replace(/^sop-/, '')] : [];

        this._openExecutionModal(wo, { state: 'loading' });
        const startedAt = Date.now();

        try {
            const ctx = await KnowledgeLoader.buildContext({
                socs,
                sops,
                projectId:   c.workshopId ? null : (wo.projectId || null),
                taskContext: 'Ejecutar Work Order: ' + (c.title || woId),
            });

            // KANBAN-IA-SOS sprint A · pre-pend SOS-branded WO context bundle
            // (principis canònics · sector · subtype · roles · transactions ·
            // accounting hints) ABANS del context KnowledgeLoader.
            let sosHeader = '';
            try {
                const { buildWoContext } = await import('../core/woContextBuilder.js');
                const project = (this.projects || []).find(p => p && p.id === wo.projectId) || null;
                const roleNodes = project?.roles || project?.vna_roles || [];
                const txNodes   = project?.vna_transactions || project?.transactions || [];
                const woCtx = buildWoContext({
                    wo:           { ...wo, content: c },
                    project,
                    roles:        roleNodes,
                    transactions: txNodes,
                });
                sosHeader = woCtx.systemPrompt;
            } catch (e) {
                console.warn('[kanban] buildWoContext failed · fallback al base context', e?.message);
            }

            // v155 · escalation chain 5 providers (com Sprint via runSprintItem) ·
            // robustesa · si Anthropic té credit baix · automàticament salta a
            // OpenAI → Gemini → DeepSeek → Minimax. Fallback final · Orchestrator
            // legacy directe (per a edge cases de runEscalation no disponible).
            const systemPromptCombined = sosHeader ? (sosHeader + '\n\n---\n\n' + ctx.systemPrompt) : ctx.systemPrompt;
            const userPrompt = buildExecutionPrompt({ ...wo, content: c });
            let aiOutput = '', tokens = {}, latencyMs = 0, attempts = null, modelKey = null;
            try {
                const { generateWithProvider } = await import('../core/aiProviderService.js');
                const { runEscalation }        = await import('../core/aiRouterService.js');
                const generate = (mk) => generateWithProvider(mk, {
                    systemPrompt:    systemPromptCombined,
                    userPrompt,
                    maxOutputTokens: 1800,
                    temperature:     0.3,
                });
                const r = await runEscalation({
                    taskKind:         'creative-narrative',   // mateixa que Sprint draft
                    generate,
                    preferredProvider: c.assignee?.engine || null,
                });
                aiOutput = r.output?.text || '';
                tokens   = { prompt_tokens: r.output?.usage?.inputTokens || 0, completion_tokens: r.output?.usage?.outputTokens || 0 };
                latencyMs = Date.now() - startedAt;
                attempts = r.attempts || null;
                modelKey = r.modelKey || r.output?.modelKey || null;
            } catch (escErr) {
                // Fallback · si runEscalation no disponible (cas edge) · usa Orchestrator legacy
                console.warn('[kanban] runEscalation failed · fallback Orchestrator · ' + (escErr?.message || ''));
                const { Orchestrator } = await import('../core/Orchestrator.js?v=' + Date.now());
                const result = await Orchestrator.callLLM({
                    preferredEngine: c.assignee?.engine || 'anthropic',
                    systemPrompt:    systemPromptCombined,
                    userPrompt,
                    responseFormat:  'text',
                    temperature:     0.3,
                });
                aiOutput = (typeof result.content === 'string')
                    ? result.content
                    : (result.content?.raw || JSON.stringify(result.content, null, 2));
                tokens = result.telemetry?.tokens || {};
                latencyMs = result.telemetry?.latencyMs || (Date.now() - startedAt);
            }

            // Actualizar WO con tokens y output. status='done' (lista para aprobar).
            // v155 · trace escalation · aiAttempts + aiModelKey · UX failover visible
            const updated = {
                ...wo,
                content: {
                    ...c,
                    aiOutput,
                    tokensIn:  tokens.prompt_tokens     || 0,
                    tokensOut: tokens.completion_tokens || 0,
                    actualHours: Math.max(0, latencyMs / 3600000),  // h equiv (anecdótico)
                    aiLatencyMs: latencyMs,
                    aiSources: ctx.sources,
                    aiAttempts: attempts,                            // v155 · failover trace
                    aiModelKey: modelKey,                            // v155 · model real que ha respost
                    status:    'done',
                },
            };
            await this._save(updated);

            // TDD-auto: si pasa el check, transiciona a ledgered automáticamente.
            if (c.approvalRule === 'tdd-auto' && c.tddCheck) {
                const passed = this._evalTdd(c.tddCheck, aiOutput);
                if (passed) {
                    await this._ledgerize(woId, {});
                    this._openExecutionModal({ ...updated, content: { ...updated.content, status: 'ledgered' } }, {
                        state: 'tdd-passed',
                        text:  aiOutput,
                        tokens, latencyMs, sources: ctx.sources,
                    });
                    return;
                } else {
                    // TDD falló: vuelve a backlog para revisión humana.
                    const failed = { ...updated, content: { ...updated.content, status: 'backlog', tddFailed: true } };
                    await this._save(failed);
                    this._openExecutionModal(failed, {
                        state: 'tdd-failed',
                        text:  aiOutput,
                        tokens, latencyMs, sources: ctx.sources,
                    });
                    return;
                }
            }

            this._openExecutionModal(updated, {
                state: 'ready',
                text:  aiOutput,
                tokens, latencyMs,
                sources: ctx.sources,
            });
        } catch (err) {
            console.error('[H7.2] Error ejecutando WO con IA:', err);
            this._openExecutionModal(wo, {
                state: 'error',
                msg: err.message + '\n\nVerifica tu API key en /settings y que netlify dev esté corriendo.',
            });
        }
    }

    // Evaluación segura del tddCheck. Por ahora soporta:
    //   - "contains:texto"   → output incluye literal "texto"
    //   - "minLen:N"         → output con ≥ N caracteres
    //   - "h2Count:N"        → output con ≥ N encabezados ## en MD
    //   - "regex:/.../flags" → match del regex
    // No usamos eval() para evitar XSS. H7.4 ampliará el sandbox.
    _evalTdd(check, output) {
        if (!check || typeof check !== 'string') return false;
        const trimmed = String(output || '');
        const m = check.match(/^(\w+):(.+)$/);
        if (!m) return false;
        const [, kind, val] = m;
        try {
            switch (kind) {
                case 'contains': return trimmed.includes(val);
                case 'minLen':   return trimmed.length >= parseInt(val, 10);
                case 'h2Count':  return (trimmed.match(/^##\s/gm) || []).length >= parseInt(val, 10);
                case 'regex': {
                    const r = val.match(/^\/(.+)\/(\w*)$/);
                    if (!r) return false;
                    return new RegExp(r[1], r[2]).test(trimmed);
                }
                default: return false;
            }
        } catch (_) { return false; }
    }

    _openExecutionModal(wo, payload) {
        const root = document.getElementById('kbModalRoot');
        if (!root) return;
        const close = () => { root.innerHTML = ''; };

        let body;
        if (payload.state === 'loading') {
            body = `
                <p style="color:#aaa;">🤖 Ejecutando con ${this._esc(wo.content?.assignee?.engine || 'anthropic')}…</p>
                <p style="color:#666;font-size:0.78rem;">Construyendo contexto SOC+SOP, llamando al LLM. 5-25 s típico.</p>`;
        } else if (payload.state === 'error') {
            body = `<p style="color:#ff5252;">Error:</p><pre style="background:#050507;padding:0.6rem;border-radius:5px;color:#aaa;white-space:pre-wrap;font-size:0.78rem;">${this._esc(payload.msg)}</pre>`;
        } else {
            const meta = `Tokens: ${(payload.tokens?.prompt_tokens || 0)} in / ${(payload.tokens?.completion_tokens || 0)} out · Latencia: ${payload.latencyMs} ms · Fuentes: ${payload.sources?.length || 0}`;
            const banner = payload.state === 'tdd-passed'
                ? `<p style="color:var(--accent-green);font-size:0.85rem;">✅ TDD-auto pasó — la WO se contabilizó automáticamente.</p>`
                : payload.state === 'tdd-failed'
                ? `<p style="color:var(--accent-red);font-size:0.85rem;">⚠ TDD-auto falló — la WO volvió a Backlog para revisión humana.</p>`
                : `<p style="color:var(--accent-green);font-size:0.85rem;">✅ Ejecución completada — pendiente de aprobación manual.</p>`;
            body = `
                ${banner}
                <p style="color:#888;font-size:0.75rem;">${this._esc(meta)}</p>
                <textarea readonly style="width:100%;min-height:280px;background:#050507;color:#e6e6e6;border:1px solid #2a2a35;border-radius:5px;padding:0.6rem;font-family:monospace;font-size:0.78rem;">${this._esc(payload.text || '')}</textarea>`;
        }

        root.innerHTML = `
            <div class="kb-modal" id="kbExecBg">
                <div class="kb-modal-inner" style="max-width:780px;">
                    <h3>🤖 Ejecución IA · ${this._esc(wo.content?.title || '')}</h3>
                    ${body}
                    <div class="actions">
                        <button class="kb-btn" id="kbExecClose">Cerrar</button>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('kbExecClose').addEventListener('click', close);
        document.getElementById('kbExecBg').addEventListener('click', e => { if (e.target.id === 'kbExecBg') close(); });
    }

    // ─── render ─────────────────────────────────────────────────────────────
    _render() {
        this._renderStats();
        this._renderBoard();
        // SWARM-RELOC-001 · bind dels botons "🐝 Auto-run" si swarm mode actiu
        if (this._swarmMode) this._bindSwarmButtons();
    }

    _bindSwarmButtons() {
        document.querySelectorAll('[data-swarm-wo]').forEach(btn => {
            // Stop propagation perquè el card click (open detail) no es dispari
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const woId = btn.getAttribute('data-swarm-wo');
                if (!woId) return;
                const wo = (this.workOrders || []).find(w => w.id === woId);
                if (!wo) return;
                btn.disabled = true;
                btn.textContent = '⏳ Llançant swarm loop...';
                try {
                    const { toast } = await import('../core/uxComponents.js');
                    toast({
                        kind: 'info',
                        text: '🐝 Swarm autonomous loop · veure /sprint per a status',
                        ttl: 4000,
                    });
                    // Per a alfa · redirigim a /sprint amb el WO pre-seleccionat
                    setTimeout(() => {
                        window.location.href = '/sprint?wo=' + encodeURIComponent(woId);
                    }, 1500);
                } catch (e) {
                    btn.disabled = false;
                    btn.textContent = '🐝 Auto-run amb agent IA';
                }
            });
        });
    }

    _renderStats() {
        const root = document.getElementById('kbStats');
        if (!root) return;
        const filtered = this._filteredWOs();
        const counts = COLUMNS.map(col => ({
            ...col,
            count: filtered.filter(w => (w.content?.status || 'backlog') === col.id).length,
        }));
        const totals = filtered.reduce((acc, w) => {
            const c = w.content || {};
            if (c.status === 'ledgered') {
                acc.spent += (c.assignee?.kind === 'ai' ? (c.aiCostEur || 0) : (c.humanCostEur || 0));
                acc.saved += (c.savingEur || 0);
                acc.aiCount += c.assignee?.kind === 'ai' ? 1 : 0;
            }
            return acc;
        }, { spent: 0, saved: 0, aiCount: 0 });

        root.innerHTML = counts.map(c => `
            <div class="kb-stat" style="border-left:3px solid ${c.color};">
                <div class="kb-stat-num">${c.count}</div>
                <div class="kb-stat-lbl">${c.emoji} ${c.label}</div>
            </div>
        `).join('') + `
            <div class="kb-stat" style="border-left:3px solid #facc15;">
                <div class="kb-stat-num">${fmtEur(totals.spent)}</div>
                <div class="kb-stat-lbl">💸 Coste contabilizado</div>
            </div>
            <div class="kb-stat" style="border-left:3px solid #d4a853;">
                <div class="kb-stat-num">${fmtEur(totals.saved)}</div>
                <div class="kb-stat-lbl">✨ Ahorro automatización</div>
            </div>
            <div class="kb-stat" style="border-left:3px solid #a5b4fc;">
                <div class="kb-stat-num">${totals.aiCount}</div>
                <div class="kb-stat-lbl">🤖 WOs ejecutadas por IA</div>
            </div>
        `;
    }

    _renderBoard() {
        const root = document.getElementById('kbBoard');
        if (!root) return;
        const filtered = this._filteredWOs();
        root.innerHTML = COLUMNS.map(col => {
            const items = filtered.filter(w => (w.content?.status || 'backlog') === col.id);
            return `
                <div class="kb-col" style="--accent:${col.color};">
                    <div class="kb-col-h">
                        ${col.emoji} ${col.label} <span class="pill">${items.length}</span>
                    </div>
                    ${items.length === 0
                        ? `<div class="kb-empty">Sin WOs aquí</div>`
                        : items.map(w => this._cardHtml(w)).join('')}
                </div>
            `;
        }).join('');
        root.querySelectorAll('[data-wo]').forEach(card => {
            card.addEventListener('click', () => this._openDetailModal(card.dataset.wo));
        });
    }

    _cardHtml(w) {
        const c = w.content || {};
        const ass = c.assignee || {};
        const cost = computeWOCost(w);
        // WO-ASSIGN-001 · si hay plaza Matriu assignada, prioritzar-la sobre l'assignee legacy
        let assigneeBadge;
        if (c.assignedToSeatId) {
            const seat = (this.cohortSeats || []).find(s => s.id === c.assignedToSeatId);
            const name = (seat?.content?.displayName || c.assignedToSeatId.slice(-12));
            assigneeBadge = `<span class="kb-badge human" style="background:rgba(192,132,252,0.15);color:var(--accent-purple);border-color:rgba(192,132,252,0.4);" title="Plaza Matriu · ${this._esc(c.assignedToSeatId)}">🐝 ${this._esc(name)}</span>`;
        } else if (ass.kind === 'ai') {
            assigneeBadge = `<span class="kb-badge ai">🤖 ${this._esc(ass.engine || '?')}</span>`;
        } else {
            assigneeBadge = `<span class="kb-badge human">👤 ${this._esc(ass.id || 'pending')}</span>`;
        }
        const tddBadge = c.approvalRule === 'tdd-auto' ? `<span class="kb-badge tdd">TDD</span>` : '';
        const prioBadge = c.priority && c.priority !== 'low'
            ? `<span class="kb-badge ${c.priority}">${this._esc(c.priority)}</span>`
            : '';
        const sopBadge = c.sopRef ? `<span class="kb-badge">${this._esc(c.sopRef)}</span>` : '';
        const isLedgered = c.status === 'ledgered';
        const costBadge = isLedgered
            ? `<span class="kb-badge cost">${fmtEur(c.assignee?.kind === 'ai' ? c.aiCostEur : c.humanCostEur)}</span>`
            : '';
        const saveBadge = isLedgered && c.savingEur != null && c.savingEur > 0
            ? `<span class="kb-badge save">+${fmtEur(c.savingEur)}</span>`
            : '';
        const swarmBtn = this._swarmMode
            ? `<button class="kb-swarm-btn" data-swarm-wo="${this._esc(w.id)}" title="Llança autonomous loop agent IA sobre aquesta WO" style="margin-top:6px;padding:4px 10px;border-radius:4px;background:linear-gradient(135deg,#a855f7,#6366f1);color:#fff;border:0;font-size:0.7rem;font-weight:700;cursor:pointer;width:100%;">🐝 Auto-run amb agent IA</button>`
            : '';
        return `
            <div class="kb-card" data-wo="${w.id}">
                <h5>${this._esc(c.title || '(sin título)')}</h5>
                <div class="meta">
                    ${c.estimatedHours ? `${c.estimatedHours} h est.` : '— h'}
                    ${c.actualHours != null ? ` · ${c.actualHours} h reales` : ''}
                </div>
                <div class="badges">
                    ${assigneeBadge}
                    ${tddBadge}
                    ${prioBadge}
                    ${sopBadge}
                    ${costBadge}
                    ${saveBadge}
                </div>
                ${swarmBtn}
            </div>
        `;
    }

    _esc(str) {
        return String(str ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
    }

    // ─── H7.3 · Modal Generar WOs desde SOP ─────────────────────────────────
    async _openFromSopModal() {
        const root = document.getElementById('kbModalRoot');
        if (!root) return;
        const close = () => { root.innerHTML = ''; };

        // H1.10.3 · Fuente adaptativa según filtro de proyecto
        // - Si hay filtro proyecto activo → SOPs DEL PROYECTO (KB.query type='sop' projectId=...).
        //   Tienen sentido aquí porque son los productos/servicios reales del cliente.
        // - Sin filtro o "Todos los proyectos" → SOPs públicos de TeamTowers
        //   (los servicios que TT ofrece, gestión interna).
        const projectActive = !!this.projectFilter;
        const projectName = projectActive
            ? ((this.projects.find(p => p.id === this.projectFilter) || {}).nombre || this.projectFilter)
            : null;

        let sopOptions = [];
        let modeLabel  = '';
        let modeHint   = '';
        let emptyHtml  = '';

        if (projectActive) {
            modeLabel = '📁 SOPs del proyecto · ' + projectName;
            modeHint  = 'Estos son los SOPs propios del cliente — sus productos/servicios reales. Las WOs generadas heredan el projectId automáticamente.';
            const sopNodes = await KB.query({ type: 'sop', projectId: this.projectFilter });
            sopOptions = sopNodes.map(n => ({
                kind:       'project',
                value:      n.id,
                label:      (n.content?.name || n.id) + ' · rol ' + (n.content?.role_ref || '?'),
                steps:      Array.isArray(n.content?.steps) ? n.content.steps : [],
                slugForRef: 'project-' + (n.content?.role_ref || n.id),
            }));
            if (!sopOptions.length) {
                emptyHtml = `
                    <p style="color:var(--accent-red);font-size:0.85rem;margin:1rem 0 0.5rem 0;">
                        Este proyecto aún no tiene SOPs propios.
                    </p>
                    <p style="color:#aaa;font-size:0.78rem;">
                        Genera los SOPs del cliente antes de crear WOs:
                        <a href="/sops?project=${this.projectFilter}" data-link class="kb-link">📋 SOPs del proyecto</a>
                        (botón "🤖 Generar todos los SOPs" para hacerlo en bulk).
                    </p>
                `;
            }
        } else {
            modeLabel = '🏛 SOPs públicos · TeamTowers';
            modeHint  = 'Estos son los SOPs canónicos de TeamTowers (los servicios que ofrecemos). Selecciona un proyecto en el filtro de arriba para ver los SOPs propios de ese cliente.';
            const list = await KnowledgeLoader.listSops();
            sopOptions = list.map(s => ({
                kind:       'public',
                value:      s.slug,
                label:      s.slug,
                slugForRef: s.slug,
            }));
            if (!sopOptions.length) {
                emptyHtml = `<p style="color:var(--accent-red);font-size:0.85rem;">No hay SOPs públicos en _index.md.</p>`;
            }
        }

        const wsOptions = this.workshops.map(w =>
            `<option value="${w.id}">${this._esc((w.content?.clientName || w.id) + ' · ' + (w.content?.type || ''))}</option>`
        ).join('');
        const sopSelectHtml = sopOptions.map(o =>
            `<option value="${this._esc(o.value)}">${this._esc(o.label)}</option>`
        ).join('');

        root.innerHTML = `
            <div class="kb-modal" id="kbFromSopBg">
                <div class="kb-modal-inner">
                    <h3>📋 Generar WOs desde SOP</h3>
                    <p style="background:rgba(99,102,241,0.1);border-left:2px solid #6366f1;padding:0.5rem;border-radius:3px;margin:0.5rem 0;color:var(--accent-indigo);font-size:0.78rem;">
                        <strong>${this._esc(modeLabel)}</strong><br>
                        <span style="color:#aaa;">${modeHint}</span>
                    </p>

                    ${emptyHtml || `
                        <div class="row" style="margin-top:0.8rem;">
                            <div>
                                <label>SOP</label>
                                <select id="kbsfSop">${sopSelectHtml}</select>
                            </div>
                            <div>
                                <label>Workshop asociado (opcional)</label>
                                <select id="kbsfWs">
                                    <option value="">— ninguno —</option>
                                    ${wsOptions}
                                </select>
                            </div>
                        </div>

                        <div class="row">
                            <div>
                                <label>FMV humano (€/h)</label>
                                <input id="kbsfFmv" type="number" step="5" min="0" value="50">
                            </div>
                            <div>
                                <label style="visibility:hidden;">_</label>
                                <button class="kb-btn" id="kbsfPreview">🔍 Previsualizar</button>
                            </div>
                        </div>

                        <div id="kbsfPreviewArea" style="margin-top:0.8rem; max-height:300px; overflow-y:auto;"></div>
                    `}

                    <div class="actions">
                        <button class="kb-btn" id="kbsfCancel">Cancelar</button>
                        ${emptyHtml ? '' : '<button class="kb-btn kb-btn-primary" id="kbsfCreate">Crear N WOs en Backlog</button>'}
                    </div>
                </div>
            </div>
        `;

        document.getElementById('kbsfCancel').addEventListener('click', close);
        document.getElementById('kbFromSopBg').addEventListener('click', e => { if (e.target.id === 'kbFromSopBg') close(); });

        if (emptyHtml) return;

        let pendingWOs = [];
        const previewBtn = document.getElementById('kbsfPreview');
        const createBtn  = document.getElementById('kbsfCreate');
        const area       = document.getElementById('kbsfPreviewArea');

        previewBtn.addEventListener('click', async () => {
            try {
                const value = document.getElementById('kbsfSop').value;
                const wsId  = document.getElementById('kbsfWs').value || null;
                const fmv   = parseFloat(document.getElementById('kbsfFmv').value) || 50;
                console.log('[H1.10.3] Preview · sopValue=', value);
                const selected = sopOptions.find(o => o.value === value);
                if (!selected) {
                    area.innerHTML = `<p style="color:var(--accent-red);font-size:0.8rem;">Selecciona un SOP del desplegable.</p>`;
                    pendingWOs = [];
                    return;
                }

                // Resolver steps según fuente
                let steps;
                if (selected.kind === 'project') {
                    steps = selected.steps || [];
                } else {
                    steps = await KnowledgeLoader.getSopSteps(selected.value);
                }
                console.log('[H1.10.3] Preview · steps:', steps.length);
                if (!steps.length) {
                    area.innerHTML = `<p style="color:var(--accent-red);font-size:0.8rem;">El SOP seleccionado no tiene <code>steps:</code>. Añádelos al .md o regenera el SOP del proyecto.</p>`;
                    pendingWOs = [];
                    return;
                }

                pendingWOs = generateWosFromSop(selected.slugForRef, steps, {
                    workshopId: wsId,
                    projectId:  projectActive ? this.projectFilter : null,
                    fmvPerHour: fmv,
                    socRefs:    ['soc-teamtowers-brand'],
                });
                console.log('[H1.10.3] Preview · pendingWOs generadas:', pendingWOs.length);
                area.innerHTML = `
                    <p style="color:var(--accent-green);font-size:0.8rem;">Se crearán <b>${pendingWOs.length} WOs</b> en Backlog${projectActive ? ' (con projectId=' + this._esc(this.projectFilter) + ')' : ''}:</p>
                    <ul style="font-size:0.78rem;color:#bbb;padding-left:1.2rem;">
                        ${pendingWOs.map(w => `
                            <li style="margin-bottom:0.3rem;">
                                <span style="color:${w.content.assignee.kind === 'ai' ? '#a5b4fc' : '#86efac'};">${w.content.assignee.kind === 'ai' ? '🤖' : '👤'}</span>
                                ${this._esc(w.content.title)}
                                <span style="color:#666;">· ${w.content.estimatedHours.toFixed(2)}h · ${this._esc(w.content.priority)}</span>
                            </li>
                        `).join('')}
                    </ul>
                `;
            } catch (err) {
                console.error('[H1.10.3] Preview error:', err);
                area.innerHTML = `<p style="color:var(--accent-red);font-size:0.8rem;">Error en preview: ${this._esc(err.message)}</p>`;
                pendingWOs = [];
            }
        });

        createBtn.addEventListener('click', async () => {
            console.log('[H1.10.3] Create WOs click · pendingWOs:', pendingWOs.length);
            if (!pendingWOs.length) {
                alert('Pulsa primero "🔍 Previsualizar" para generar las WOs antes de crearlas.');
                return;
            }
            try {
                close();
                for (const wo of pendingWOs) {
                    await store.dispatch({ type: 'KB_UPSERT', payload: { node: wo } });
                }
                await this._load();
                this._render();
                console.log('[H1.10.3] WOs creadas OK:', pendingWOs.length);
            } catch (err) {
                console.error('[H1.10.3] Error creando WOs:', err);
                alert('Error creando WOs: ' + err.message);
            }
        });
    }

    // ─── modal de creación ──────────────────────────────────────────────────
    async _openCreateModal() {
        const root = document.getElementById('kbModalRoot');
        if (!root) return;
        const close = () => { root.innerHTML = ''; };
        const wsOptions = this.workshops.map(w =>
            `<option value="${w.id}">${this._esc((w.content?.clientName || w.id) + ' · ' + (w.content?.type || ''))}</option>`
        ).join('');

        // H1.10.8 · cargar default provider para preselección del dropdown engine
        let defaultEngine = DEFAULT_ENGINE;
        try {
            const { Orchestrator } = await import('../core/Orchestrator.js?v=' + Date.now());
            defaultEngine = await Orchestrator.getDefaultProvider() || DEFAULT_ENGINE;
        } catch (_) { /* fallback DEFAULT_ENGINE */ }

        // KANBAN-ASSIGNEE-001 · carregar usuaris reals del KB (user_identity)
        // + matriu seats si hi ha projecte actiu. Substitueix el placeholder
        // hardcoded "@alvaro" per autocomplete real i dropdown amb tothom.
        let knownAssignees = [];   // [{ handle, label, kind: 'identity'|'seat' }]
        try {
            const identities = await KB.query({ type: 'user_identity' });
            for (const ide of (identities || [])) {
                const h = ide?.content?.handle;
                if (h) {
                    const name = ide.content?.displayName || h;
                    knownAssignees.push({ handle: '@' + String(h).replace(/^@/, ''), label: '👤 ' + name + ' (@' + h + ')', kind: 'identity' });
                }
            }
            if (this.projectFilter && Array.isArray(this.seats)) {
                for (const s of this.seats) {
                    const name = s?.content?.name || s?.id;
                    if (name) knownAssignees.push({ handle: s.id, label: '🪑 ' + name + ' · seat', kind: 'seat' });
                }
            }
        } catch (_) { /* sense identities · fallback input lliure */ }
        const _myHandle = (knownAssignees.find(a => a.kind === 'identity')?.handle) || '';

        // H1.10.6 · SOP de referencia → dropdown de SOPs del proyecto activo.
        // Si hay projectFilter → carga SOPs del proyecto y renderiza <select>.
        // Si no hay proyecto → conserva <input type="text"> libre.
        let sopFieldHtml;
        if (this.projectFilter) {
            const projSops = await KB.query({ type: 'sop', projectId: this.projectFilter });
            const sopOpts = projSops.map(s => {
                const slug = 'project-' + (s.content?.role_ref || s.id);
                const label = (s.content?.name || s.id) + ' · rol ' + (s.content?.role_ref || '?');
                return `<option value="${this._esc(slug)}">${this._esc(label)}</option>`;
            }).join('');
            sopFieldHtml = `
                <label>SOP de referencia (opcional)</label>
                <select id="kbfSop">
                    <option value="">— ninguno —</option>
                    ${sopOpts}
                </select>
                ${projSops.length === 0 ? '<small style="color:var(--accent-red);">Este proyecto aún no tiene SOPs propios. <a href="/sops?project=' + this._esc(this.projectFilter) + '" data-link class="kb-link">Generar SOPs</a></small>' : ''}
            `;
        } else {
            sopFieldHtml = `
                <label>SOP de referencia (opcional)</label>
                <input id="kbfSop" type="text" placeholder="sop-fent-pinya-taller">
                <small style="color:#888;">Sin proyecto activo. Selecciona un proyecto en el filtro para elegir SOP del dropdown.</small>
            `;
        }

        root.innerHTML = `
            <div class="kb-modal" id="kbCreateBg">
                <div class="kb-modal-inner">
                    <h3>＋ Nueva Work Order</h3>
                    <label>Título</label>
                    <input id="kbfTitle" type="text" placeholder="Ej. Generar propuesta IKEA · cosecha VNA fase 6">
                    <label>Descripción</label>
                    <textarea id="kbfDesc" placeholder="Detalle del entregable que produce esta WO"></textarea>

                    <div class="row">
                        <div>
                            <label>Proyecto (H7.5)</label>
                            <select id="kbfProject">
                                <option value="">— sin proyecto —</option>
                                ${this.projects.map(p =>
                                    `<option value="${p.id}" ${p.id === this.projectFilter ? 'selected' : ''}>${this._esc(p.nombre || p.id)}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div>
                            <label>Workshop asociado (opcional)</label>
                            <select id="kbfWs">
                                <option value="">— ninguno —</option>
                                ${wsOptions}
                            </select>
                        </div>
                        <div>
                            ${sopFieldHtml}
                        </div>
                    </div>

                    <div class="row">
                        <div>
                            <label>Assignee · tipo</label>
                            <select id="kbfAssKind">
                                <option value="human">👤 Humano</option>
                                <option value="ai">🤖 IA</option>
                            </select>
                        </div>
                        <div>
                            <label>Assignee · ID / engine</label>
                            <div id="kbfAssIdWrap">
                                <input id="kbfAssId" type="text" placeholder="@alvaro · ej. asignar humano">
                            </div>
                        </div>
                    </div>

                    <div class="row">
                        <div>
                            <label>Aprobación</label>
                            <select id="kbfAppr">
                                <option value="manual">Manual</option>
                                <option value="tdd-auto">TDD-auto</option>
                            </select>
                        </div>
                        <div>
                            <label>Prioridad</label>
                            <select id="kbfPrio">
                                <option value="low">low</option>
                                <option value="med" selected>med</option>
                                <option value="high">high</option>
                            </select>
                        </div>
                    </div>

                    <div class="row">
                        <div>
                            <label>Horas estimadas</label>
                            <input id="kbfEstHrs" type="number" step="0.25" min="0" value="1">
                        </div>
                        <div>
                            <label>FMV humano (€/h)</label>
                            <input id="kbfFmv" type="number" step="5" min="0" value="${FMV_HUMAN_DEFAULT}">
                        </div>
                    </div>

                    <div class="actions">
                        <button class="kb-btn" id="kbfCancel">Cancelar</button>
                        <button class="kb-btn kb-btn-primary" id="kbfSave">Crear en Backlog</button>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('kbfCancel').addEventListener('click', close);
        document.getElementById('kbCreateBg').addEventListener('click', e => { if (e.target.id === 'kbCreateBg') close(); });

        // H1.10.8 · alternar input/select del campo assignee según el tipo
        // KANBAN-ASSIGNEE-001 · si tenim usuaris reals al KB · select; si no · input lliure
        const ENGINE_OPTIONS = ['anthropic', 'openai', 'deepseek', 'gemini', 'minimax', 'custom'];
        const renderAssigneeField = (kind) => {
            const wrap = document.getElementById('kbfAssIdWrap');
            if (!wrap) return;
            if (kind === 'ai') {
                const opts = ENGINE_OPTIONS.map(e =>
                    `<option value="${e}" ${e === defaultEngine ? 'selected' : ''}>${e}${e === defaultEngine ? ' (por defecto)' : ''}</option>`
                ).join('');
                wrap.innerHTML = `<select id="kbfAssId">${opts}</select>`;
                return;
            }
            // Humano · si hi ha known assignees · select amb datalist; sinó · input lliure
            if (knownAssignees.length > 0) {
                const opts = knownAssignees.map(a => {
                    const sel = a.handle === _myHandle ? ' selected' : '';
                    return `<option value="${this._esc(a.handle)}"${sel}>${this._esc(a.label)}</option>`;
                }).join('');
                wrap.innerHTML = `
                    <select id="kbfAssId" style="margin-bottom:4px;">
                        ${opts}
                        <option value="">— altre · escriu handle manualment —</option>
                    </select>
                `;
            } else {
                const ph = _myHandle || '@handle · ex. @alvaro';
                wrap.innerHTML = `<input id="kbfAssId" type="text" placeholder="${this._esc(ph)}" value="${this._esc(_myHandle)}">`;
            }
        };
        document.getElementById('kbfAssKind').addEventListener('change', e => renderAssigneeField(e.target.value));

        document.getElementById('kbfSave').addEventListener('click', async () => {
            const kind = document.getElementById('kbfAssKind').value;
            const idVal = document.getElementById('kbfAssId').value.trim();
            const node = {
                id:        uid(),
                type:      'work_order',
                projectId: document.getElementById('kbfProject').value || null,
                content: {
                    title:        document.getElementById('kbfTitle').value.trim() || '(sin título)',
                    description:  document.getElementById('kbfDesc').value.trim(),
                    workshopId:   document.getElementById('kbfWs').value || null,
                    sopRef:       document.getElementById('kbfSop').value.trim() || null,
                    assignee: {
                        kind:   kind,
                        id:     kind === 'ai' ? (idVal || DEFAULT_ENGINE) : (idVal || 'pending'),
                        engine: kind === 'ai' ? (idVal || DEFAULT_ENGINE) : null,
                    },
                    approvalRule:    document.getElementById('kbfAppr').value,
                    priority:        document.getElementById('kbfPrio').value,
                    estimatedHours:  parseFloat(document.getElementById('kbfEstHrs').value) || 0,
                    fmvPerHour:      parseFloat(document.getElementById('kbfFmv').value) || FMV_HUMAN_DEFAULT,
                    actualHours:     null,
                    tokensIn:        null,
                    tokensOut:       null,
                    status:          'backlog',
                },
                keywords: ['work_order', kind, document.getElementById('kbfSop').value.trim() || ''],
            };
            // UX-002 · auto-tagging taxonómico
            node.content.tags = taxonomicTagsForWo(node);
            node.keywords     = Array.from(new Set([...(node.keywords || []), ...node.content.tags]));
            close();
            await this._save(node);
        });
    }

    // ─── modal de detalle / acciones ────────────────────────────────────────
    _openDetailModal(woId) {
        const w = this.workOrders.find(x => x.id === woId);
        if (!w) return;
        const c = w.content || {};
        const cost = computeWOCost(w);
        const root = document.getElementById('kbModalRoot');
        if (!root) return;
        const close = () => { root.innerHTML = ''; };

        const isAi = c.assignee?.kind === 'ai';
        const status = c.status || 'backlog';
        const colNext = {
            backlog:  { label: '▶ Iniciar (En curso)',          to: 'doing' },
            doing:    { label: '✓ Finalizar (pendiente aprob.)', to: 'done' },
            done:     { label: '💶 Aprobar y contabilizar',       to: 'ledgered' },
            ledgered: null,
        }[status];

        root.innerHTML = `
            <div class="kb-modal" id="kbDetailBg">
                <div class="kb-modal-inner">
                    <h3>${this._esc(c.title || '(sin título)')}</h3>
                    <p style="color:#888;font-size:0.78rem;margin:0;">
                        ${colMeta(status).emoji} ${colMeta(status).label}
                        · ${isAi ? 'IA · ' + this._esc(c.assignee?.engine || '?') : 'Humano · ' + this._esc(c.assignee?.id || 'pending')}
                        · aprobación ${this._esc(c.approvalRule || 'manual')}
                    </p>

                    ${c.description ? `<p style="color:#bbb;font-size:0.85rem;margin-top:0.7rem;">${linkifyMultiline(c.description)}</p>` : ''}

                    <div class="row" style="margin-top:0.5rem;">
                        <div>
                            <label>Horas estimadas</label>
                            <input id="kbdEstHrs" type="number" step="0.25" min="0" value="${c.estimatedHours || 0}">
                        </div>
                        <div>
                            <label>FMV (€/h)</label>
                            <input id="kbdFmv" type="number" step="5" min="0" value="${c.fmvPerHour || FMV_HUMAN_DEFAULT}">
                        </div>
                    </div>

                    <!-- WO-ASSIGN-001 · selector plaza Matriu -->
                    <label style="margin-top:0.7rem;">🐝 Assignat a (plaza Matriu / DID)</label>
                    <select id="kbdAssignedSeat" style="width:100%;">
                        <option value="">— sense assignar (legacy: ${this._esc(c.assignee?.id || 'pending')}) —</option>
                        ${(this.cohortSeats || []).map(s => {
                            const sel = (c.assignedToSeatId === s.id) ? 'selected' : '';
                            const name = s.content?.displayName || s.id;
                            const guard = s.content?.guardianOf ? ' · ' + s.content.guardianOf : '';
                            return `<option value="${this._esc(s.id)}" ${sel}>${this._esc(name)}${this._esc(guard)}</option>`;
                        }).join('')}
                    </select>
                    <p style="color:#666;font-size:0.7rem;margin-top:0.2rem;font-family:monospace;">
                        Quan WO passi a "ledgered" + horas reales, /value-accounting podrà importar-lo com a aportació time del party seleccionat.
                    </p>

                    ${status === 'doing' || status === 'done' ? `
                        <div class="row">
                            <div>
                                <label>Horas reales</label>
                                <input id="kbdActHrs" type="number" step="0.25" min="0" value="${c.actualHours ?? ''}" placeholder="${c.estimatedHours || ''}">
                            </div>
                            ${isAi ? `
                                <div>
                                    <label>Engine IA</label>
                                    <select id="kbdEngine">
                                        ${['anthropic','openai','deepseek','gemini'].map(e =>
                                            `<option value="${e}" ${e === (c.assignee?.engine || DEFAULT_ENGINE) ? 'selected' : ''}>${e}</option>`
                                        ).join('')}
                                    </select>
                                </div>
                            ` : ''}
                        </div>
                        ${isAi ? `
                            <div class="row">
                                <div>
                                    <label>Tokens entrada</label>
                                    <input id="kbdTokIn" type="number" min="0" value="${c.tokensIn ?? ''}" placeholder="ej. 8500">
                                </div>
                                <div>
                                    <label>Tokens salida</label>
                                    <input id="kbdTokOut" type="number" min="0" value="${c.tokensOut ?? ''}" placeholder="ej. 1200">
                                </div>
                            </div>
                        ` : ''}
                    ` : ''}

                    <div style="background:#050507;border:1px solid #1a1a22;border-radius:6px;padding:0.6rem;margin-top:0.8rem;font-size:0.78rem;color:#aaa;">
                        <div>Coste humano estimado: <b style="color:#fff;">${fmtEur(cost.humanCostEstimated)}</b></div>
                        ${cost.humanCostReal != null ? `<div>Coste humano real: <b style="color:#fff;">${fmtEur(cost.humanCostReal)}</b></div>` : ''}
                        ${cost.aiCostReal != null ? `<div>Coste IA real (incl. ${Math.round((MARKUP-1)*100)}% markup): <b style="color:#fff;">${fmtEur(cost.aiCostReal)}</b></div>` : ''}
                        ${cost.savingEur != null && cost.savingEur > 0 ? `<div>✨ Ahorro automatización: <b style="color:var(--accent-orange);">${fmtEur(cost.savingEur)}</b></div>` : ''}
                        ${status === 'ledgered' && c.ledgeredAt ? `<div style="color:var(--accent-green);margin-top:0.3rem;">✓ Contabilizada el ${new Date(c.ledgeredAt).toLocaleString('es-ES')}</div>` : ''}
                    </div>

                    ${c.aiOutput ? `
                        <label style="margin-top:0.8rem;">Output IA (editable antes de contabilizar)</label>
                        <textarea id="kbdAiOutput" style="min-height:160px;font-family:monospace;font-size:0.78rem;">${this._esc(c.aiOutput)}</textarea>
                    ` : ''}
                    ${c.tddFailed ? `<p style="color:var(--accent-red);font-size:0.78rem;margin-top:0.6rem;">⚠ Última auto-aprobación TDD falló. Revisa el output y promueve manualmente.</p>` : ''}

                    <div class="actions">
                        <button class="kb-btn danger" id="kbdDel">Borrar</button>
                        <button class="kb-btn" id="kbdClose">Cerrar</button>
                        ${!isAi ? `<button class="kb-btn" id="kbdAssistAi" style="border-color:rgba(99,102,241,0.4);color:var(--accent-indigo);">🤖 ${c.aiAssistDraft ? 'Ver / Regenerar asistencia IA' : 'Pedir asistencia IA con contexto'}</button>` : ''}
                        ${isAi && (status === 'backlog' || status === 'doing') ? `<button class="kb-btn" id="kbdExecAi">🤖 Ejecutar con IA</button>` : ''}
                        ${colNext ? `<button class="kb-btn kb-btn-primary" id="kbdNext">${colNext.label}</button>` : ''}
                    </div>
                </div>
            </div>
        `;

        document.getElementById('kbdClose').addEventListener('click', close);
        document.getElementById('kbDetailBg').addEventListener('click', e => { if (e.target.id === 'kbDetailBg') close(); });
        document.getElementById('kbdDel').addEventListener('click', async () => { close(); await this._delete(w.id); });

        // H7.6 · Asistencia IA con contexto a WO humana
        const assistBtn = document.getElementById('kbdAssistAi');
        if (assistBtn) {
            assistBtn.addEventListener('click', () => { close(); this._openWoAssistModal(w); });
        }

        // H7.2 · Ejecutar con IA
        const execBtn = document.getElementById('kbdExecAi');
        if (execBtn) {
            execBtn.addEventListener('click', async () => {
                const extras = {
                    estimatedHours: parseFloat(document.getElementById('kbdEstHrs').value) || c.estimatedHours,
                    fmvPerHour:     parseFloat(document.getElementById('kbdFmv').value)    || c.fmvPerHour,
                };
                const eng = document.getElementById('kbdEngine')?.value;
                if (eng) extras.assignee = { ...c.assignee, kind: 'ai', engine: eng };
                close();
                await this._executeAi(w.id, extras);
            });
        }

        // Si hay output IA en el modal, capturarlo en el siguiente save
        if (colNext) {
            document.getElementById('kbdNext').addEventListener('click', async () => {
                const extras = {
                    estimatedHours: parseFloat(document.getElementById('kbdEstHrs').value) || c.estimatedHours,
                    fmvPerHour:     parseFloat(document.getElementById('kbdFmv').value)    || c.fmvPerHour,
                };
                // WO-ASSIGN-001 · capturar plaza assignada (string buit = sense assignar)
                const seatSel = document.getElementById('kbdAssignedSeat');
                if (seatSel) {
                    const seatVal = seatSel.value || '';
                    extras.assignedToSeatId = seatVal || null;
                }
                // Capturar el aiOutput editado por el humano antes de aprobar
                const aiOutEdit = document.getElementById('kbdAiOutput');
                if (aiOutEdit) extras.aiOutput = aiOutEdit.value;
                if (status === 'doing' || status === 'done') {
                    const actHrs = document.getElementById('kbdActHrs')?.value;
                    if (actHrs !== '' && actHrs != null) extras.actualHours = parseFloat(actHrs);
                    if (isAi) {
                        const tin = document.getElementById('kbdTokIn')?.value;
                        const tout = document.getElementById('kbdTokOut')?.value;
                        if (tin !== '' && tin != null) extras.tokensIn = parseInt(tin, 10);
                        if (tout !== '' && tout != null) extras.tokensOut = parseInt(tout, 10);
                        const eng = document.getElementById('kbdEngine')?.value;
                        if (eng) extras.assignee = { ...c.assignee, kind: 'ai', engine: eng };
                    }
                }
                close();
                if (colNext.to === 'ledgered') {
                    await this._ledgerize(w.id, extras);
                } else {
                    await this._move(w.id, colNext.to, extras);
                }
            });
        }
    }

    // ─── H7.6 · Modal "Asistencia IA con contexto" para WOs humanas ─────────
    // Muestra: textarea con el draft previo (si existe), textarea con datos
    // brutos del humano, botón Generar, indicador 🧠 IA pensando, output MD
    // editable, botones Guardar / Copiar / Descargar.
    _openWoAssistModal(wo) {
        const root = document.getElementById('kbModalRoot');
        if (!root) return;
        const close = () => { root.innerHTML = ''; };
        const c = wo.content || {};
        const existingDraft = c.aiAssistDraft || '';
        const existingMeta  = c.aiAssistMeta  || null;
        const metaLine = existingMeta
            ? `${existingMeta.provider}/${existingMeta.model} · ${existingMeta.tokensIn || 0}+${existingMeta.tokensOut || 0} tokens · ${existingMeta.latencyMs || 0}ms · ${new Date(existingMeta.ts || Date.now()).toLocaleString('es-ES')}`
            : '';

        root.innerHTML = `
            <div class="kb-modal" id="kbAssistBg">
                <div class="kb-modal-inner" style="max-width:880px;">
                    <h3>🤖 Asistencia IA con contexto · ${this._esc(c.title || wo.id)}</h3>
                    <p style="background:rgba(99,102,241,0.1);border-left:2px solid #6366f1;padding:0.5rem;border-radius:3px;margin:0.5rem 0;color:var(--accent-indigo);font-size:0.78rem;">
                        La IA recibe SOC raíz + SOP de referencia + estado del proyecto + rol VNA + los datos
                        brutos que pegues abajo, y devuelve un informe MD con estructura SOS estándar
                        (8 secciones: Contexto · Síntesis · Diagnóstico · Plan · DTD · Intangibles ·
                        Mind-as-Graph · Tokens). Lo aprueba/edita el humano antes de guardar.
                    </p>

                    <label>Datos brutos aportados por el humano</label>
                    <textarea id="kbaInput" style="min-height:140px;font-family:var(--font-base);font-size:0.85rem;" placeholder="Pega aquí cualquier dato relevante: emails, notas, transcripciones, decisiones, contexto temporal, fotos descritas, datos del cliente. Cuanto más concreto, mejor el informe."></textarea>

                    <div class="actions" style="margin-top:0.6rem;">
                        <button class="kb-btn" id="kbaGenerate" style="border-color:rgba(99,102,241,0.4);color:var(--accent-indigo);">🧠 Generar informe IA con contexto</button>
                        <span id="kbaThinking" style="display:none;color:var(--accent-indigo);font-size:0.85rem;">🧠 IA pensando<span id="kbaDots">.</span></span>
                    </div>

                    <label style="margin-top:0.8rem;">Informe IA${metaLine ? ' · <span style="color:#888;font-size:0.7rem;font-weight:normal;">previo: ' + this._esc(metaLine) + '</span>' : ''}</label>
                    <textarea id="kbaOutput" style="min-height:280px;font-family:monospace;font-size:0.78rem;" placeholder="Aquí aparecerá el informe MD generado. Editable antes de guardar.">${this._esc(existingDraft)}</textarea>

                    <div class="actions">
                        <button class="kb-btn" id="kbaCancel">Cerrar</button>
                        <button class="kb-btn" id="kbaCopy">📋 Copiar</button>
                        <button class="kb-btn" id="kbaDownload">⬇ Descargar .md</button>
                        <button class="kb-btn kb-btn-primary" id="kbaSave">💾 Guardar como aiAssistDraft</button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('kbaCancel').addEventListener('click', close);
        document.getElementById('kbAssistBg').addEventListener('click', e => { if (e.target.id === 'kbAssistBg') close(); });

        // Animación dots "IA pensando"
        let dotsInterval = null;
        const startThinking = () => {
            const t = document.getElementById('kbaThinking');
            const d = document.getElementById('kbaDots');
            t.style.display = 'inline';
            let n = 1;
            dotsInterval = setInterval(() => { n = (n % 3) + 1; d.textContent = '.'.repeat(n); }, 400);
        };
        const stopThinking = () => {
            const t = document.getElementById('kbaThinking');
            t.style.display = 'none';
            if (dotsInterval) clearInterval(dotsInterval);
        };

        // Generar informe
        document.getElementById('kbaGenerate').addEventListener('click', async () => {
            const input = document.getElementById('kbaInput').value.trim();
            if (!input) {
                alert('Pega primero los datos brutos del humano antes de generar el informe.');
                return;
            }
            const btn = document.getElementById('kbaGenerate');
            const out = document.getElementById('kbaOutput');
            btn.disabled = true;
            startThinking();
            try {
                const { generateWoAssistReport } = await import('../core/woAssistant.js?v=' + Date.now());
                const result = await generateWoAssistReport({ wo, humanInput: input });
                out.value = result.markdown;
                // Cachear meta en data attrs para guardarlo al pulsar Guardar
                out.dataset.provider  = result.provider;
                out.dataset.model     = result.model;
                out.dataset.tokensIn  = result.tokens?.prompt_tokens || 0;
                out.dataset.tokensOut = result.tokens?.completion_tokens || 0;
                out.dataset.latencyMs = result.latencyMs;
                console.log('[H7.6] Informe IA generado · ' + result.provider + '/' + result.model + ' · ' + (result.tokens?.total_tokens || 0) + ' tokens');
            } catch (err) {
                console.error('[H7.6] Error generando informe IA:', err);
                alert('Error al generar informe IA: ' + err.message);
            } finally {
                stopThinking();
                btn.disabled = false;
            }
        });

        // Copiar al portapapeles
        document.getElementById('kbaCopy').addEventListener('click', async () => {
            const md = document.getElementById('kbaOutput').value;
            try { await navigator.clipboard.writeText(md); alert('Informe copiado al portapapeles.'); }
            catch (_) { alert('No se pudo copiar (permiso denegado).'); }
        });

        // Descargar .md
        document.getElementById('kbaDownload').addEventListener('click', () => {
            const md = document.getElementById('kbaOutput').value;
            const safeId = (wo.id || 'wo').replace(/[^\w-]/g, '');
            const blob = new Blob([md], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'wo-assist-' + safeId + '.md';
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });

        // Guardar como aiAssistDraft del WO
        document.getElementById('kbaSave').addEventListener('click', async () => {
            const out = document.getElementById('kbaOutput');
            const md = out.value.trim();
            if (!md) { alert('No hay informe para guardar.'); return; }
            const meta = {
                provider:  out.dataset.provider  || (existingMeta?.provider  || 'unknown'),
                model:     out.dataset.model     || (existingMeta?.model     || 'unknown'),
                tokensIn:  parseInt(out.dataset.tokensIn  || (existingMeta?.tokensIn  || 0), 10),
                tokensOut: parseInt(out.dataset.tokensOut || (existingMeta?.tokensOut || 0), 10),
                latencyMs: parseInt(out.dataset.latencyMs || (existingMeta?.latencyMs || 0), 10),
                ts:        Date.now(),
            };
            const updated = {
                ...wo,
                content: { ...c, aiAssistDraft: md, aiAssistMeta: meta },
            };
            await store.dispatch({ type: 'KB_UPSERT', payload: { node: updated } });
            await this._load();
            this._render();
            close();
            console.log('[H7.6] aiAssistDraft guardado · ' + md.length + ' chars · ' + meta.provider + '/' + meta.model);
        });
    }
}
