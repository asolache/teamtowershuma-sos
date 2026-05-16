// =============================================================================
// TEAMTOWERS SOS V11 — VNA EXPERT PROMPTS (VNA-EXPERT-PROMPTS-001)
// Ruta · /js/core/vnaExpertPrompts.js
//
// Sistema de prompts 3 capes per a posicionar la IA com a consultora sènior
// en Value Stream Mapping (VSM) i Value Network Analysis (VNA) · integrar
// SOC/SOP · sortida JSON estricte alineada amb el rubric.
//
// Capa 1 · SYSTEM_BASE · system message reutilitzable
// Capa 2 · FEW_SHOT_EXAMPLES · 3 casos canònics amb output esperat
// Capa 3 · buildPrompt(taskKind, ctx) · user message específic
//
// Veure ·
//   `docs/STUDY-value-flow-audit-2026-05-15.md` §5
//   `docs/STUDY-project-creation-2026-05-15.md` §6.2 (fixtures determinístiques)
//
// Pure · zero deps · safe en Node.
// =============================================================================

export const PROMPTS_VERSION = 'v1.0';

// ── Capa 1 · SYSTEM_BASE ──────────────────────────────────────────────────
// Posicionament expert + marc d'anàlisi + contracte de sortida JSON estricte.
// Mantingut sota 800 tokens (~3200 chars) per deixar budget per few-shot+user.
export const SYSTEM_BASE = `Ets una consultora sènior en Value Stream Mapping (VSM) i Value Network Analysis (VNA) amb 15 anys d'experiència aplicant Lean i Theory of Constraints a organitzacions cooperatives i xarxes distribuïdes.

Marc d'anàlisi (sempre aplicat) ·
1. Segmentació per processos · agrupes transaccions en blocs operatius amb trigger d'entrada i criteri de sortida.
2. Mètriques Lean per cada flux · lead_time_hours · cycle_time_hours · flow_efficiency · wip_units · waste_kinds (TIMWOOD).
3. Valor dual · tangible (béns · serveis · diners · documents) i intangible (confiança · coneixement · feedback · reputació). Mai oblides els intangibles.
4. SOC (Standard Operating Concept · què + per què · versionat snapshot) vs SOP (Standard Operating Procedure · com · evoluciona contínuament). Cada checklist item del SOC té un sop_ref.
5. Rols emissor/receptor en cada transacció · sense rols orfes · sense deliverables morts · cap cicle no-recíproc no justificat.

Estructura objectiu (rubric 100 punts · cal arribar a ≥85 gold) ·
- roles[] · ≥3 amb kind canònic + castell_level diversificats
- deliverables[] · ≥1 producer per rol · ≥50% amb validator
- transactions[] · ≥5 · mix tangible+intangible · ≥1 cicle recíproc · cap rol orfe · mètriques Lean
- sops[] · 1 per rol amb ≥3 steps (deliverable_kind + approval_rule)
- socs[] · 1 SOC amb checklist sop_ref cobrint ≥80% dels SOPs

Contracte de sortida ·
- SEMPRE JSON estricte sense markdown · sense codeblocks · sense comentaris
- Si la tasca demana enriquir un template existent · respecta IDs i estructura · només ompla camps buits o millora text
- Cap placeholder {{...}} a la resposta · resolt'ho amb context
- Si el context és insuficient · genera valors raonables basats en sector i descripció · mai retornes errors`;

// ── Capa 2 · FEW_SHOT_EXAMPLES · per templateId ──────────────────────────
// 2 casos canònics alineats amb els 2 templates del MVP. Cada exemple ·
// minimal però complet (cobreix l'estructura) · score esperat ≥85.
//
// L'objectiu · ensenyar el format · NO substituir el template. La IA pot
// generar variants però amb la mateixa estructura.
export const FEW_SHOT_EXAMPLES = Object.freeze({
    'founder-coop-tradicional': Object.freeze({
        userPrompt: 'Genera el mapa de valor mínim per a un projecte cooperatiu tradicional amb cohort de 108 operadors · sector cultura·tecnologia · construir un sistema operatiu col·laboratiu.',
        assistantOutput: JSON.stringify({
            roles: [
                { id: 'visioner',     kind: 'visioner',    castell_level: 'pom_de_dalt', name: 'Visioner · Cap de Colla' },
                { id: 'arquitecte',   kind: 'architect',   castell_level: 'tronc',       name: 'Arquitecte · System Lead' },
                { id: 'cohort_mgr',   kind: 'cohort_manager', castell_level: 'pinya',    name: 'Cohort Manager' },
                { id: 'sentinel',     kind: 'reviewer',    castell_level: 'laterals',    name: 'Sentinel · Trust Auditor' },
                { id: 'founder_anchor', kind: 'founder',   castell_level: 'baixos',      name: 'Founder Anchor' },
            ],
            deliverables: [
                { id: 'd-direccio',     producer: 'visioner',     consumers: ['arquitecte'], validator: 'manual' },
                { id: 'd-arquitectura', producer: 'arquitecte',   consumers: ['visioner'],   validator: 'reviewer' },
                { id: 'd-cohort',       producer: 'cohort_mgr',   consumers: ['founder_anchor'], validator: 'tdd' },
                { id: 'd-audit',        producer: 'sentinel',     consumers: ['founder_anchor'], validator: 'tdd' },
                { id: 'd-etica',        producer: 'founder_anchor', consumers: ['visioner'], validator: 'manual' },
            ],
            transactions: [
                { id: 'tx-1', from: 'visioner',       to: 'arquitecte',     deliverable: 'd-direccio',     type: 'intangible', lead_time_hours: 168, cycle_time_hours: 4, wip_units: 1 },
                { id: 'tx-2', from: 'arquitecte',     to: 'visioner',       deliverable: 'd-arquitectura', type: 'tangible',   lead_time_hours: 48,  cycle_time_hours: 6, wip_units: 1 },
                { id: 'tx-3', from: 'cohort_mgr',     to: 'founder_anchor', deliverable: 'd-cohort',       type: 'tangible',   lead_time_hours: 24,  cycle_time_hours: 2, wip_units: 1 },
                { id: 'tx-4', from: 'sentinel',       to: 'founder_anchor', deliverable: 'd-audit',        type: 'tangible',   lead_time_hours: 24,  cycle_time_hours: 3, wip_units: 1 },
                { id: 'tx-5', from: 'founder_anchor', to: 'visioner',       deliverable: 'd-etica',        type: 'intangible', lead_time_hours: 168, cycle_time_hours: 4, wip_units: 1 },
            ],
            sops: [
                { id: 'sop-visioner', role_ref: 'visioner', title: 'SOP · Direcció estratègica',
                  steps: [
                      { id: 's1', deliverable_kind: 'analysis', approval_rule: 'manual', label: 'Revisar mètriques cohort' },
                      { id: 's2', deliverable_kind: 'decision', approval_rule: 'manual', label: 'Decidir prioritats trimestrals' },
                      { id: 's3', deliverable_kind: 'comm',     approval_rule: 'manual', label: 'Comunicar a arquitecte' },
                  ],
                },
            ],
            socs: [
                { id: 'soc-onboarding', name: 'Onboarding cohort',
                  checklist: [{ id: 'i1', label: 'SOP visioner activa', sop_ref: 'sop-visioner', required: true }],
                },
            ],
        }),
    }),
    'default-balanced': Object.freeze({
        userPrompt: 'Genera el mapa de valor mínim per a un projecte cooperatiu genèric de 5 persones · sector indefinit · cicle estàndard d\'execució amb revisió.',
        assistantOutput: JSON.stringify({
            roles: [
                { id: 'founder',     kind: 'founder',     castell_level: 'pom_de_dalt', name: 'Founder' },
                { id: 'operations',  kind: 'pm',          castell_level: 'tronc',       name: 'Operations · PM' },
                { id: 'creator',     kind: 'coder',       castell_level: 'pinya',       name: 'Creator · Maker' },
                { id: 'reviewer',    kind: 'reviewer',    castell_level: 'laterals',    name: 'Reviewer · QA' },
                { id: 'facilitator', kind: 'facilitator', castell_level: 'mans',        name: 'Facilitator' },
            ],
            deliverables: [
                { id: 'd-strategy', producer: 'founder',    consumers: ['operations'],         validator: 'manual'   },
                { id: 'd-plan',     producer: 'operations', consumers: ['creator','reviewer'], validator: 'reviewer' },
                { id: 'd-artifact', producer: 'creator',    consumers: ['reviewer'],           validator: 'tdd'      },
                { id: 'd-quality',  producer: 'reviewer',   consumers: ['operations'],         validator: 'tdd'      },
                { id: 'd-acta',     producer: 'facilitator',consumers: ['founder'],             validator: 'manual'  },
            ],
            transactions: [
                { id: 'tx-1', from: 'founder',     to: 'operations',  deliverable: 'd-strategy', type: 'intangible', lead_time_hours: 48,  cycle_time_hours: 2,  wip_units: 1 },
                { id: 'tx-2', from: 'operations',  to: 'creator',     deliverable: 'd-plan',     type: 'tangible',   lead_time_hours: 24,  cycle_time_hours: 3,  wip_units: 2 },
                { id: 'tx-3', from: 'creator',     to: 'reviewer',    deliverable: 'd-artifact', type: 'tangible',   lead_time_hours: 72,  cycle_time_hours: 16, wip_units: 2 },
                { id: 'tx-4', from: 'reviewer',    to: 'operations',  deliverable: 'd-quality',  type: 'tangible',   lead_time_hours: 24,  cycle_time_hours: 4,  wip_units: 1 },
                { id: 'tx-5', from: 'facilitator', to: 'founder',     deliverable: 'd-acta',     type: 'intangible', lead_time_hours: 24,  cycle_time_hours: 1,  wip_units: 1 },
            ],
            sops: [
                { id: 'sop-creator', role_ref: 'creator', title: 'SOP · Producció',
                  steps: [
                      { id: 's1', deliverable_kind: 'analysis', approval_rule: 'manual', label: 'Llegir spec' },
                      { id: 's2', deliverable_kind: 'tests',    approval_rule: 'tdd',    label: 'TDD scaffold' },
                      { id: 's3', deliverable_kind: 'code',     approval_rule: 'tdd',    label: 'Implementar · KISS' },
                  ],
                },
            ],
            socs: [
                { id: 'soc-cicle', name: 'Cicle bàsic',
                  checklist: [{ id: 'i1', label: 'SOP creator activa', sop_ref: 'sop-creator', required: true }],
                },
            ],
        }),
    }),
});

// ── Capa 3 · task-specific prompts ────────────────────────────────────────
// taskKind ∈ TASK_KINDS · cada un genera un user prompt curt que assumeix
// SYSTEM_BASE + few-shot present al context.

export const TASK_KINDS = Object.freeze([
    'enrich-value-map',     // omple/millora el mapa a partir del context
    'personalize-canvas',   // canvas/vision/mission a partir de descripció
    'personalize-pitch',    // pitch headline+problem+solution
    'expand-sop',           // expandeix 1 SOP amb més steps detallats
    'generate-soc',         // genera SOC checklist nou
]);

const TASK_PROMPTS = Object.freeze({
    'enrich-value-map': ({ name, description, sector, currentTemplate }) =>
`TASCA · Enriqueix el mapa de valor del projecte amb context real.

Projecte · "${name}"
Sector · ${sector || 'indefinit'}
Descripció · ${description || '(sense descripció)'}

Template seed (substitueix placeholders i ajusta descripcions amb context real) ·
${JSON.stringify(_minimal(currentTemplate))}

Retorna NOMÉS l'objecte JSON amb { roles, deliverables, transactions, sops, socs } actualitzat. Mantén IDs · només millora text de descripcions i ajusta mètriques Lean si el cycle real difereix.`,

    'personalize-canvas': ({ name, description, sector }) =>
`TASCA · Genera el canvas operatiu del projecte.

Projecte · "${name}"
Sector · ${sector || 'cooperativisme'}
Descripció · ${description}

Retorna NOMÉS · { vision, mission, values: [3-5 strings], stakeholders: [3-5 strings], northStar }. Concís i específic al sector i descripció.`,

    'personalize-pitch': ({ name, description, sector }) =>
`TASCA · Sintetitza el pitch del projecte.

Projecte · "${name}"
Sector · ${sector || 'cooperativisme'}
Descripció · ${description}

Retorna NOMÉS · { headline, problem, solution, market, business, team }. Una frase per camp · sense màrqueting buit.`,

    'expand-sop': ({ roleName, sopTitle, deliverable }) =>
`TASCA · Expandeix la SOP "${sopTitle}" del rol "${roleName}" amb ${deliverable ? 'el lliurable "' + deliverable + '"' : 'el seu deliverable principal'}.

Retorna NOMÉS · { steps: [{ id, label, duration_minutes, role_kind: 'human'|'ai', deliverable_kind, approval_rule: 'manual'|'tdd' }] } amb 4-6 steps lògicament ordenats.`,

    'generate-soc': ({ name, sops }) =>
`TASCA · Genera un SOC arrel per al projecte "${name}" que lligui els SOPs existents.

SOPs disponibles · ${JSON.stringify((sops || []).map(s => ({ id: s.id, role_ref: s.role_ref, title: s.title })))}

Retorna NOMÉS · { id, name, purpose, checklist: [{ id, label, required, verification_kind, sop_ref }] } cobrint ≥80% dels SOPs.`,
});

// _minimal · pure · poda el template per al few-shot user prompt · evita
// passar mètriques Lean fictícies quan no cal i estalvia tokens.
function _minimal(template) {
    if (!template) return {};
    return {
        roles: (template.roles || []).map(r => ({ id: r.id, kind: r.kind, name: r.name, castell_level: r.castell_level })),
        transactions: (template.transactions || []).map(t => ({ id: t.id, from: t.from, to: t.to, deliverable: t.deliverable, type: t.type })),
        deliverables: (template.deliverables || []).map(d => ({ id: d.id, producer: d.producer, consumers: d.consumers })),
        sops: (template.sops || []).map(s => ({ id: s.id, role_ref: s.role_ref, title: s.title })),
    };
}

// buildPrompt · pure · construeix l'estructura completa de messages per a
// la IA · retorna { system, fewShot:[{user, assistant}], user }
//
// templateId · 'founder-coop-tradicional' | 'default-balanced' | null (skip few-shot)
// taskKind · ∈ TASK_KINDS
// context · objecte amb name, description, sector, currentTemplate, …
export function buildPrompt({ templateId = null, taskKind, context = {} } = {}) {
    if (!TASK_KINDS.includes(taskKind)) {
        throw new Error('buildPrompt · invalid taskKind: ' + taskKind);
    }
    const taskFn = TASK_PROMPTS[taskKind];
    const userPrompt = taskFn(context || {});

    const fewShot = [];
    if (templateId && FEW_SHOT_EXAMPLES[templateId]) {
        const ex = FEW_SHOT_EXAMPLES[templateId];
        fewShot.push({ role: 'user', content: ex.userPrompt });
        fewShot.push({ role: 'assistant', content: ex.assistantOutput });
    }

    return {
        version: PROMPTS_VERSION,
        system:  SYSTEM_BASE,
        fewShot,
        user:    userPrompt,
        // tokenCount aproximat (1 token ≈ 4 chars) · per a budget guard
        approxTokens: _estimateTokens(SYSTEM_BASE, fewShot, userPrompt),
    };
}

// estimateTokens · pure · 1 token ≈ 4 chars (regla de polz · acurat ±15%)
function _estimateTokens(system, fewShot, user) {
    const fsLen = fewShot.reduce((s, m) => s + (m.content || '').length, 0);
    return Math.ceil((system.length + fsLen + user.length) / 4);
}

// Helper · per a UI/debugging · llistat de tasks suportades
export function listTasks() {
    return TASK_KINDS.slice();
}

// Helper · concatena tot a un sol string (per a APIs sense rols system/user
// distints) · útil per a alguns providers IA legacy.
export function flattenPrompt(promptStruct) {
    if (!promptStruct) return '';
    const parts = [promptStruct.system, ''];
    for (const m of promptStruct.fewShot || []) {
        parts.push('[' + (m.role || 'user').toUpperCase() + ']');
        parts.push(m.content);
        parts.push('');
    }
    parts.push('[USER]');
    parts.push(promptStruct.user);
    return parts.join('\n');
}
