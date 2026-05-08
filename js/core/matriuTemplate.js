// =============================================================================
// TEAMTOWERS SOS V11 — MATRIU COHORT 0 TEMPLATE (MAT-002-A)
// Ruta: /js/core/matriuTemplate.js
//
// Builder puro del paquete fundacional Matriu Cohort 0 · genera un
// proyecto SOS preconfigurado con:
//   - 1 nodo `project` (sector Q · scope:internal · cohort:0 tags)
//   - 1 nodo `soc` matriu-tokenomic con las 4 reglas Fair Fractal
//   - 6 nodos `sop` (uno por cada perk fundacional del Cohort 0)
//   - 1 nodo `wallet` con 2.000 crèdits (perk #3) · operator-friendly
//   - tags taxonómicos + folksonómicos consistentes con UX-002.
//
// PURO · sin LLM · sin IndexedDB · testeable. El consumidor (DashboardView)
// hace los KB.upsert + store dispatch tras llamar al builder.
// =============================================================================

import { taxonomicTagsForProject, taxonomicTagsForRole, mergeTags } from './semanticTagger.js';

// ─── Constantes Matriu Cohort 0 (alineadas con Matriu_Landing_standalone.html)
export const MATRIU_COHORT_0 = Object.freeze({
    cohort:       0,
    capacity:     100,
    multiplier:   1.5,
    initialCredits: 2000,
    cohortWeeks:  10,
    sectorTT:     'Q',          // Educación / Formación reglada (educación superior + cohort)
    docsBaseUrl:  'https://matriu.coop',
});

export const MATRIU_PERKS = Object.freeze([
    { id: 'multiplicador',   icon: '✓', label: 'Multiplicador ×1.5 fundacional', description: 'De por vida sobre cada repartiment del proyecto' },
    { id: 'hat-tf-eco',      icon: '✓', label: 'Hat TF + ECO de governança',     description: 'Vot ponderat a totes les rondes FICE futures' },
    { id: 'credits',         icon: '✓', label: '2.000 crèdits de plataforma',    description: 'IA · attestations · mints · auditoria' },
    { id: 'cohort-10sem',    icon: '✓', label: 'Cohort intensiva 10 setmanes',   description: 'Mètode SOS + IA + facilitació humana' },
    { id: 'llinatge',        icon: '✓', label: 'Llinatge visible a la cadena',   description: 'El teu nom queda als orígens fundacionals' },
    { id: 'cops-permanents', icon: '✓', label: 'Accés permanent a CoPs',         description: 'Comunitats de pràctica · sense renovació' },
]);

export const MATRIU_FAIR_FRACTAL_RULES = Object.freeze([
    { id: 'fair',      title: 'Fair',      summary: 'Cada aportació té un preu acordat ex-ante. Mai es renegocia després.' },
    { id: 'fractal',   title: 'Fractal',   summary: 'Mateixa estructura per a un hort o una empresa de software. Composable.' },
    { id: 'escalable', title: 'Escalable', summary: 'Local-first → permaweb → blockchain. Funciona offline.' },
    { id: 'automatic', title: 'Automàtic', summary: 'Smart contracts assignen recompenses sense reunió, sense mediadors.' },
]);

// 4 tipus de valor que el sistema reconeix (Value Mapping Engine)
export const MATRIU_VALUE_KINDS = Object.freeze([
    { id: 'producte-fisic',     label: 'Producte físic',         icon: '①', example: '3 cistelles/mes durant 24 mesos' },
    { id: 'equity-composable',  label: 'Equity composable',      icon: '②', example: '12 SHARES · 0.7% si ronda' },
    { id: 'drets-us',           label: "Drets d'ús i accés",     icon: '③', example: '1 seient cohort 1 + lab CNC' },
    { id: 'credits-reputacio',  label: 'Crèdits & reputació',    icon: '④', example: '800 crèdits + +1 hat TF' },
]);

// ─── Builder · proyecto Matriu Cohort 0 ────────────────────────────────────
// Devuelve un objeto con TODO lo que el caller debe persistir:
//   { project, kbNodes: [soc, ...sops, wallet], navigateTo }
// project · payload para CREATE_PROJECT del store.
// kbNodes · array de nodos para KB_UPSERT (orden: SOC primero · luego SOPs · luego wallet).
// navigateTo · ruta sugerida tras crear (`/project/{id}`).
export function buildMatriuCohortProject({
    operatorName    = '',
    operatorHandle  = '',
    projectIdea     = '',
    projectId       = null,           // override opcional · normalmente lo genera el caller
} = {}) {
    if (!operatorName) throw new Error('buildMatriuCohortProject: operatorName requerido');
    if (!projectIdea)  throw new Error('buildMatriuCohortProject: projectIdea requerido');

    const ts   = Date.now();
    const safeName = operatorName.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'operator';
    const pId  = projectId || ('proj-matriu-' + safeName + '-' + ts.toString(36).slice(-5));

    // Tags taxonómicos comunes a todos los nodos del proyecto Matriu
    const baseTaxonomic = [
        'cohort:0',
        'kind:matriu-cohort-project',
        'scope:internal',
        'sector:' + MATRIU_COHORT_0.sectorTT.toLowerCase(),
        'project:' + pId,
    ];
    const baseFolksonomy = ['matriu', 'cohort-0', 'incoopadora', 'fundacional', 'fair-fractal'];

    // 1) Project payload (para store CREATE_PROJECT)
    const project = {
        id:               pId,
        nombre:           operatorName + ' · Matriu Cohort 0',
        sector_id:        MATRIU_COHORT_0.sectorTT,
        based_on_sector:  MATRIU_COHORT_0.sectorTT,
        vna_roles:        [],
        vna_transactions: [],
        cloneStatus:      'active',
        readinessAtClone: 'solid',
        matriuCohort:     0,
        matriuMultiplier: MATRIU_COHORT_0.multiplier,
        operatorName,
        operatorHandle,
        projectIdea,
        createdAt:        ts,
        updatedAt:        ts,
    };

    // 2) SOC seed · matriu-tokenomic (4 reglas)
    const socId = 'soc-matriu-tokenomic-' + pId;
    const soc = {
        id:        socId,
        type:      'soc',
        projectId: pId,
        content: {
            name:      'SOC Matriu Tokenomic · Fair Fractal',
            slug:      'matriu-tokenomic',
            kind:      'matriu-soc',
            summary:   'Quatre regles que no canvien · model fractal aplicable a un hort, una empresa o una xarxa de cures · repartiment automàtic per smart contracts.',
            rules:     MATRIU_FAIR_FRACTAL_RULES.map(r => ({ ...r })),
            valueKinds: MATRIU_VALUE_KINDS.map(v => ({ ...v })),
            cohort:    0,
            tags:      mergeTags([
                'kind:soc', 'scope:public',
                'project:' + pId,
                'matriu-soc:tokenomic',
            ], ['matriu', 'tokenomic', 'fair-fractal', 'incoopadora']),
            createdAt: ts,
        },
        keywords: ['soc', 'matriu', 'tokenomic', 'fair-fractal', 'cohort-0', 'project:' + pId],
    };

    // 3) 6 SOP seeds · uno por cada perk fundacional
    const sops = MATRIU_PERKS.map((perk, i) => {
        const sopId = 'sop-matriu-perk-' + perk.id + '-' + pId;
        const stepCount = perk.id === 'cohort-10sem' ? 10 : 3;       // los 10 sprints semanales para cohort
        const steps = Array.from({ length: stepCount }, (_, k) => ({
            id:               'step-' + (k + 1),
            label:            (perk.id === 'cohort-10sem' ? 'Setmana ' : 'Pas ') + (k + 1) + ' · ' + perk.label,
            duration_minutes: perk.id === 'cohort-10sem' ? 60 * 5 : 30,
            role_kind:        k % 2 === 0 ? 'human' : 'ai',
            role_profile:     k % 2 === 0 ? 'cohort-member' : 'agente_anthropic',
            deliverable_kind: perk.id === 'credits' ? 'credits-reputacio' : (perk.id === 'multiplicador' ? 'equity-composable' : 'drets-us'),
            approval_rule:    'manual',
            priority:         i < 2 ? 'high' : 'med',
        }));
        return {
            id:        sopId,
            type:      'sop',
            projectId: pId,
            content: {
                name:        'SOP · ' + perk.label,
                slug:        'matriu-perk-' + perk.id,
                kind:        'matriu-perk-sop',
                soc_ref:     socId,
                role_ref:    'cohort-member',
                project_ref: pId,
                summary:     perk.description + ' · perk fundacional ' + (i + 1) + '/6 del paquet Cohort 0.',
                steps,
                duration_minutes: steps.reduce((a, s) => a + s.duration_minutes, 0),
                audience:    ['cohort-member', 'matriu-facilitator'],
                deliverables: [perk.label],
                readiness:   'solid',
                generatedAt: ts,
                tags:        mergeTags([
                    'kind:matriu-perk-sop', 'kind:sop',
                    'soc-ref:' + socId, 'project:' + pId,
                    'cohort:0',
                ], ['matriu', 'cohort-0', perk.id, 'fundacional']),
            },
            keywords: ['sop', 'matriu-perk-sop', perk.id, 'cohort-0', 'project:' + pId],
        };
    });

    // 4) Wallet inicial con 2.000 crèdits (perk #3)
    const walletId = 'wallet-' + pId;
    const wallet = {
        id:        walletId,
        type:      'wallet',
        projectId: pId,
        content: {
            projectId:   pId,
            balanceEur:  MATRIU_COHORT_0.initialCredits,
            currency:    'EUR',
            movements:   [{
                id:        'mv-matriu-seed-' + ts.toString(36),
                ts,
                kind:      'topup',
                amountEur: MATRIU_COHORT_0.initialCredits,
                ref:       'matriu-cohort-0-seed',
                source:    'matriu-cohort-0',
                note:      'Seed inicial fundacional Cohort 0 · 2.000 crèdits de plataforma',
                balanceAfter: MATRIU_COHORT_0.initialCredits,
            }],
            createdAt:   ts,
            lastUpdatedAt: ts,
            tags:        mergeTags([
                'kind:wallet', 'project:' + pId, 'cohort:0',
            ], ['matriu', 'fundacional']),
        },
        keywords: ['wallet', 'matriu', 'cohort-0', 'project:' + pId],
    };

    return {
        project,
        kbNodes:    [soc, ...sops, wallet],
        navigateTo: '/project/' + encodeURIComponent(pId),
    };
}
