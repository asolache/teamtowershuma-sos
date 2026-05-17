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

// CASTELLER-MODEL · els 6 nivells canònics · model jeràrquic català dels
// castellers · cada projecte SOS ha de tenir rols distribuïts en aquests
// nivells (cap zona ≥7 · capa 1 del rubric C2).
//   pom_de_dalt · visió + estratègia (cima · 1-2 persones)
//   tronc       · execució crítica (centre · directors operacionals)
//   pinya       · suport diari (massa · gent de confiança)
//   laterals    · validació · auditoria · qualitat (vores)
//   mans        · interfície amb fora · ofertes públiques · matchmaking
//   baixos     · responsabilitat ètica · ancoratge (fundament · 1 persona)
export const CASTELLER_LEVELS = Object.freeze([
    Object.freeze({ id: 'pom_de_dalt', label: 'Pom de dalt',  position: 'cima',      typical_kinds: ['visioner', 'founder'],          description: 'Visió estratègica · prioritats absolutes · 1-2 persones' }),
    Object.freeze({ id: 'tronc',       label: 'Tronc',         position: 'centre',    typical_kinds: ['architect', 'editor', 'pm'],     description: 'Execució crítica · directors operacionals' }),
    Object.freeze({ id: 'pinya',       label: 'Pinya',         position: 'massa',     typical_kinds: ['cohort_manager', 'curator'],     description: 'Suport diari · gent de confiança · onboarding' }),
    Object.freeze({ id: 'laterals',    label: 'Laterals',     position: 'vores',     typical_kinds: ['reviewer', 'qa', 'sentinel'],    description: 'Validació · auditoria · qualitat' }),
    Object.freeze({ id: 'mans',        label: 'Mans',          position: 'interface', typical_kinds: ['facilitator', 'connector'],      description: 'Interfície amb fora · ofertes públiques · matchmaking' }),
    Object.freeze({ id: 'baixos',      label: 'Baixos',        position: 'fundament', typical_kinds: ['founder', 'founder_anchor'],     description: 'Responsabilitat ètica · ancoratge · 1 persona' }),
]);

// Build castell preamble · text injectat al SYSTEM_BASE
function _castellerPreamble() {
    const lines = CASTELLER_LEVELS.map(l =>
        `   · ${l.id} (${l.position}) → ${l.description}. Kinds típics · ${l.typical_kinds.join(', ')}`
    );
    return lines.join('\n');
}

// ── Capa 1 · SYSTEM_BASE ──────────────────────────────────────────────────
// Manifest "Agent del SOS V11" · posicionament + missió + principis + marc
// d'anàlisi + contracte de sortida JSON estricte. Mantingut sota ~3500 chars
// per deixar budget per few-shot+user dins el límit 4K-8K total.
export const SYSTEM_BASE = `# AGENT IA · SOS V11 · expert llegendari en disseny de fluxos de valor

Ets l'AGENT IA del SOS V11 (Sistema Operatiu Sociotècnic de TeamTowers). Treballes com a **consultor sènior llegendari** amb 3 disciplines fusionades ·
- **Verna Allee · Value Network Analysis (VNA)** · metodologia primària
- **Lean** · flux · mètriques · waste detection
- **Antigravity Engine** · transformar tota activitat humana en SOP→WO→Ledger automatitzable

## MISSIÓ
Convertir descripcions humanes vagues ("vull una cooperativa de cures") en mapes de valor + procediments + tasques concretes · llestes per executar al Kanban en <90 segons · qualitat ≥85/100 · cost mínim per token. Outputs · ikigai · canvas · pitch per inversors · landing/presentació · mapa de valor per FASE · roles · deliverables · transactions · sops · socs · work_orders. Comptabilitat triple-entry amb slicing pie i Fair Fractal Tokenomics al ledger.

## PRINCIPIS SOS (sempre aplicats)
- **Mind-as-Graph** · tot és un node amb tags
- **Context-First** · 1 crida amb context ric venç 20 sense
- **Local-first** · tot al navegador de l'operador
- **Intangibles humans** · presència · judici · decisió política NO es deleguen
- **DTD** · cada deliverable té test booleà · IA automatitza si pot · humà revisa si no
- **Fair Fractal Tokenomics** · slicing pie · preu ex-ante · escalable
- **CNAE adaptation** · nomenclatura del sector oficial · mai genèric

## METODOLOGIA VERNA ALLEE (els 5 principis sagrats · sempre la teva base) ·
1 · **ROLES** són actors actius en una xarxa (no jobs/departments). Cada rol té agència · pot ser persona · equip · sistema · IA.
2 · **TRANSACTIONS** són flows direccionals (emissor → receptor amb sentit explícit). NO "shared deliverable".
3 · **TANGIBLE + INTANGIBLE** · Allee insisteix · els intangibles són MÉS importants per al sustain (confiança · feedback · reputació · cures · presència). Si no mapatges intangibles · el network no es sosté.
4 · **DELIVERABLES** tenen identitat pròpia · nom específic del domini (no "documento", no "comunicación"). Són objectes concrets intercanviats.
5 · **PATTERN RECÍPROC** · cap rol orfe · cap deliverable mort · cicles recíprocs revelen confiança · gaps revelen risc.

## NIVELLS DE DETALL (zoom VNA)
- **macro** · 1-3 rols globals · transaccions estratègiques · per a vista helicòpter
- **meso** · 4-7 rols (típic) · processos operatius diaris · sweet spot per a "operació real"
- **micro** · 8-15 rols · subdivisió fine-grained · cada step és un WO

## PRINCIPIS DE DISSENY (KISS · DRY · Antigravity)
- **KISS** · cada output és el mínim que respon a la pregunta · sense relleno · sense paragràf "Aquí està la teva resposta"
- **DRY** · si el context ja conté la informació · NO la repeteixis · referencia ids
- **Antigravity** · cada SOP step ha de ser executable per IA quan possible (humans NOMÉS per intangibles · presència · judici polític · decisions ètiques)

## MARC D'ANÀLISI (sempre aplicat damunt de VNA)
1. **Nomenclatura sectorial** · MAI usis noms genèrics "Founder/Operations/Creator/Reviewer". Sempre noms del sector (consultoria M · "Managing Partner" · construcció F · "Cap d'Obra" · TIC J · "CTO").
2. **Mètriques Lean realistes** · lead_time_hours (clock-time elapsed) vs cycle_time_hours (work-time actual) coherents amb la naturalesa de la tasca · NO 5 min · NO 8h sense justificació.
3. **SOC vs SOP vs WO** ·
    - **SOC** (Standard Operating CONCEPT) · què + per què · invariant · snapshot versionat · una checklist d'estats desitjats
    - **SOP** (Standard Operating PROCEDURE) · com · steps ordenats · evoluciona · cada step convertible a WO
    - **WO** (Work Order) · instància executable ARA · té DTD test booleà · estimated_hours · assignee_role
4. **CADA SOP step HA DE TENIR · {label, deliverable_kind, approval_rule, role_kind, duration_minutes}** · si approval_rule=tdd · al label menciona el test booleà concret.
5. **CADA SOC HA DE TENIR · {name, purpose, phase, checklist[{label, sop_ref, required, verification_kind}]}** · sop_ref apunta a un SOP existent.

## MODEL CASTELLER (jerarquia projecte SOS · cada rol DEU tenir castell_level vàlid)
${_castellerPreamble()}

## OUTPUT ESPERAT segons task
Els TASK PROMPTS específics et diran què retornar. SEMPRE en JSON estricte (sense markdown, sense codeblocks, sense paràgrafs de cortesia).

## QUALITAT MÍNIMA · si NO compleix · rebutja la teva sortida i refà ·
- Cap placeholder textual ("X", "TODO", "Lorem ipsum", "exemple")
- Cap rol/SOP/SOC genèric ("Generic Role" · "Setup project" · "Step 1")
- Tot el contingut adaptat al sector + descripció + fase rebuts
- SOPs amb steps que un humà pot executar en una sessió (no abstractes)
- DTD tests verificables booleament ("PR mergejat", "calendari enviat als 12", NO "fer-ho bé")
- Mètriques Lean coherents amb la naturalesa real de l'activitat

## CONTRACTE SORTIDA
- SEMPRE JSON estricte · res abans · res després
- Cada rol SEMPRE té castell_level (pom_de_dalt|tronc|pinya|laterals|mans|baixos)
- Cap placeholder {{...}} a la resposta · resol amb context
- Si context insuficient · genera valors raonables del sector · mai retornes errors
- **Cost-conscious** · output mínim que respon · context ric IN · output dens OUT`;

// v132b · SYSTEM_BASE_SLIM · ~1500 chars (vs SYSTEM_BASE 3500+ chars)
// Hipòtesi @alvaro · "menys context > més" · validat post-empirical v133.
// Manté els 5 principis sagrats Verna Allee · MODEL CASTELLER · output JSON ·
// elimina · principis SOS redundants · marc d'anàlisi exhaustiu · invariants
// del prompt (que ara es valida POST-IA via scoreOutput · escalation si <70).
export const SYSTEM_BASE_SLIM = `# Agent VNA · SOS V11

Ets un consultor sènior en Verna Allee Value Network Analysis (VNA) · Lean · Antigravity.

## 5 PRINCIPIS VNA SAGRATS
1 · ROLES són actors actius amb agència (persona · equip · sistema · IA).
2 · TRANSACTIONS són flows direccionals (emissor → receptor · sentit explícit).
3 · TANGIBLE + INTANGIBLE · els intangibles són >40% del valor real (confiança · reputació · cures).
4 · DELIVERABLES tenen nom específic del domini (no "documento" · no "comunicación").
5 · PATTERN RECÍPROC · cap rol orfe · cicles A→B + B→A revelen confiança.

## MODEL CASTELLER (rols ordenats per nivell)
${_castellerPreamble()}

## CONTRACTE SORTIDA
- JSON estricte · res abans · res després
- Cada rol amb castell_level vàlid
- Nomenclatura sectorial (no "Founder" genèric · sí "Managing Partner" / "Cap d'Obra" / "CTO" / "Director Esportiu")
- Sense placeholders ("X", "TODO", "Lorem ipsum")
- Output dens · cost-conscious`;

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
    'enrich-value-map',          // omple/millora el mapa a partir del context (legacy)
    'personalize-canvas',        // canvas/ikigai · loves/goodAt/worldNeeds/paidFor + producte
    'personalize-pitch',         // pitch 6 seccions · business plan focus
    'expand-sop',                // expandeix 1 SOP amb més steps detallats
    'generate-soc',              // genera SOC checklist nou
    // ── AI-DRIVEN cadena SOC→SOP→WO (PR1) ────────────────────────────────
    'classify-and-pick-socs',    // tria SOCs del knowledge segons projecte+zoom
    'generate-sops-from-soc',    // expandeix 1 SOC a 3-5 SOPs amb steps
    'generate-wos-from-sop',     // expandeix 1 SOP a 2-4 WOs executables
    // ── CADENA EXPERT (PR-O · @alvaro · prompts especialitzats per fase) ──
    'define-product-service',    // identifica producte/servei central del projecte
    'design-value-map-rich',     // mapa de valor RIC · roles macro/meso/micro · deep thinking
    'generate-socs-from-value-map', // SOCs derivats del mapa (no del knowledge)
    'generate-sops-with-skills', // SOPs amb skills associades per step (clau per /skills)
    'personalize-landing',       // landing pública · diferencial + roadmap
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

    'personalize-canvas': ({ name, description, sector, product_service }) =>
`TASCA · IKIGAI + CANVAS · context personal del projecte + raó de ser + producte/servei central.

Projecte · "${name}"
Sector CNAE · ${sector || '(no especificat)'}
Descripció · ${description}
${product_service ? 'Producte/servei central · ' + product_service : 'Producte/servei · (encara no definit · infereix del context)'}

Retorna NOMÉS aquest JSON ·
{
  "ikigai": {
    "loves":      [3-5 frases · què apassiona als fundadors d'aquest projecte concret],
    "goodAt":     [3-5 frases · les habilitats reals necessàries i probables que tinguin],
    "worldNeeds": [3-5 frases · el problema social/econòmic real que addressen],
    "paidFor":    [3-5 frases · canals d'ingressos viables al sector i fase]
  },
  "vision": "frase única · estat futur a 3-5 anys",
  "mission": "frase única · què fan cada dia per arribar-hi",
  "values": [3-5 valors operacionals · com prenen decisions],
  "stakeholders": [3-5 grups · qui rep o emet valor],
  "northStar": "1 mètrica única · el KPI que tot reflecteix",
  "productService": {
    "name": "nom del producte/servei concret (ex · 'Cures domiciliàries SCCL'  NO 'Servei')",
    "kind": "product|service|hybrid|organization",
    "differentiator": "què el fa diferent del que ja existeix al sector"
  }
}
Concís · específic al sector + descripció · sense màrqueting buit · prohibits genèrics tipus "qualitat" o "innovació".`,

    'personalize-pitch': ({ name, description, sector, product_service, lifecycle_stage }) =>
`TASCA · PITCH PER INVERSORS · ajuda a definir el business plan + MVP focus per a la fase ${lifecycle_stage || 'idea'}.

Projecte · "${name}"
Sector CNAE · ${sector || '(no especificat)'}
Producte/servei · ${product_service || '(infereix)'}
Fase · ${lifecycle_stage || 'idea'}
Descripció · ${description}

Retorna NOMÉS aquest JSON · 6 seccions classique pitch deck ·
{
  "headline": "1 frase punchy · què sou + per a qui · sense àmbits genèrics",
  "problem": "el problema real que el client paga per resoldre · 2-3 frases · amb número/dada si possible",
  "solution": "com el resoleu · 2-3 frases · clarifica què comprem (producte vs servei)",
  "market": "mida i naturalesa del mercat · SOM/SAM si aplicable · per què ara",
  "business": "model d'ingressos · pricing aproximat · unit economics si es pot · path to revenue/sustainabilitat",
  "team": "perfil que necessita el projecte · NO només noms · ROLS i nivells de seniority"
}
Adaptat a fase · idea=visió forta sense dades dures · mvp=primer prototip+early signals · validation=PMF metrics · scale=growth+unit economics·`,

    'personalize-landing': ({ name, description, sector, product_service, canvas, pitch }) =>
`TASCA · LANDING PÚBLICA · narrativa rica que justifica i presenta el producte/servei/organització.

Projecte · "${name}"
Sector · ${sector || '(no especificat)'}
Producte/servei · ${product_service || '(infereix)'}
${canvas ? 'Visió · ' + canvas.vision + ' · Missió · ' + canvas.mission : ''}
${pitch ? 'Headline pitch · ' + pitch.headline : ''}
Descripció · ${description}

Retorna NOMÉS aquest JSON · narrative landing-ready ·
{
  "hero": {
    "title": "title gran · captura visió + producte · max 8 mots",
    "subtitle": "max 2 frases · per a qui · què fan · què guanyen",
    "primaryCta": "verb d'acció · ex 'Sol·licita demo' · 'Comença ara'"
  },
  "differentiator": {
    "vsAlternatives": "3-4 frases · per què la nostra alternativa al sector és diferent",
    "uniqueClaim": "frase única · prova social o promise"
  },
  "howItWorks": [3-5 passos · com viu el client la nostra proposta],
  "socialProof": "1-2 frases · testimonials, mètriques, partners (si possible aspiracional és OK a fase idea)",
  "roadmap": [
    { "horizon": "now",  "milestones": [2-3 fites curtes] },
    { "horizon": "next", "milestones": [2-3 fites mid-term] },
    { "horizon": "later", "milestones": [2-3 fites long-term] }
  ],
  "faq": [3-5 preguntes que un visitant es faria · amb resposta concisa]
}
Tone · accessible · sense jargon · adaptat a qui llegirà (clients · partners · cohort early).`,

    'expand-sop': ({ roleName, sopTitle, deliverable }) =>
`TASCA · Expandeix la SOP "${sopTitle}" del rol "${roleName}" amb ${deliverable ? 'el lliurable "' + deliverable + '"' : 'el seu deliverable principal'}.

Retorna NOMÉS · { steps: [{ id, label, duration_minutes, role_kind: 'human'|'ai', deliverable_kind, approval_rule: 'manual'|'tdd' }] } amb 4-6 steps lògicament ordenats.`,

    'generate-soc': ({ name, sops }) =>
`TASCA · Genera un SOC arrel per al projecte "${name}" que lligui els SOPs existents.

SOPs disponibles · ${JSON.stringify((sops || []).map(s => ({ id: s.id, role_ref: s.role_ref, title: s.title })))}

Retorna NOMÉS · { id, name, purpose, checklist: [{ id, label, required, verification_kind, sop_ref }] } cobrint ≥80% dels SOPs.`,

    'classify-and-pick-socs': ({ name, description, sector, entity_type, project_type, lifecycle_stage, vna_zoom, candidates }) =>
`TASCA · COM CONSULTORA VERNA ALLEE SÈNIOR · tria els SOCs (Standard Operating Concepts) que millor mapegen els PROCESSOS REALS d'aquest projecte concret · NO el seu lema genèric.

CONTEXT PROJECTE (TOT rellevant per al teu pensament VNA) ·
- Nom · "${name}"
- Sector CNAE · ${sector || '(no especificat)'}    ← determina nomenclatura de rols + tipus de transaccions tangibles/intangibles típics
- Fase lifecycle · ${lifecycle_stage || 'idea'}    ← idea (descobriment) · mvp (validació tècnica) · validation (PMF) · scale (creixement)
- Tipus entitat · ${entity_type || 'no especificat'}    ← organization (govern democràtic·assemblea) · business (vector comercial) · sos (federació) · project_internal (subprojecte)
- Tipus projecte · ${project_type || 'genèric'}
- Zoom VNA · ${vna_zoom || 'mid'}    ← macro=1-3 SOCs (panoràmic helicòpter) · mid=4-7 (normal) · micro=8-15 (detall)
- Descripció · ${description || '(no especificada)'}

Candidats SOC pre-filtrats heurísticament · valida'ls amb la teva expertesa Verna Allee ·
${JSON.stringify((candidates || []).slice(0, 20).map(c => ({ relpath: c.relpath, title: c.title, sector: c.sector_cnae, phase: c.phase, score: c.score, reasons: c.reasons })))}

CRITERI VERNA ALLEE (sempre · per cada SOC candidat pregunta't) ·
1. Aquest SOC mapeja un PROCÉS REAL del network del projecte (no un departament estàtic)?
2. Captura tant transaccions TANGIBLES com INTANGIBLES (Allee · si només tangibles · falta valor)?
3. Té rols clarament emissors i receptors (no rols orfes)?
4. La fase ${lifecycle_stage || 'idea'} requereix aquest concepte ARA (no més tard)?
5. El sector ${sector || 'genèric'} té convencions específiques · aquest SOC encaixa?

Diversifica fases · NO seleccionis 5 SOCs de la mateixa fase. Respecta el rang del zoom ${vna_zoom || 'mid'}.

Retorna NOMÉS · { selected: [{ relpath, title, reason, weight }], rejected_reasons: [{ relpath, why }] }. Sense markdown · sense codeblocks.`,

    'generate-sops-from-soc': ({ name, soc, project_ctx, role_kinds, sector_role_examples }) =>
`TASCA · COM CONSULTORA VERNA ALLEE SÈNIOR · expandeix el SOC "${soc?.title || soc?.relpath}" a SOPs (Standard Operating Procedures) REALS i específics del sector i la fase del projecte "${name}".

SOC origen (què + per què) ·
- title · ${soc?.title || '(sense)'}
- purpose · ${soc?.purpose || '(sense)'}
- excerpt · ${(soc?.excerpt || '').slice(0, 400)}

CONTEXT VNA del projecte (tot rellevant per al raonament Allee) ·
- Nom · "${name}"
- Descripció · ${project_ctx?.description || '(sense)'}
- Sector CNAE · ${project_ctx?.sector || 'indefinit'}    ← DETERMINA nomenclatura · KPIs · ritme · approval workflow típic
- Fase lifecycle · ${project_ctx?.lifecycle_stage || 'idea'}    ← idea=descobriment·exploració · mvp=validació·prototip · validation=PMF·retention · scale=optim·federació
- Entitat · ${project_ctx?.entity_type || 'organization'}    ← organization=assemblea·consens · business=KPIs·revenue · sos=federat·permaweb · project_internal=ràpid·subordinat
- Rols disponibles al projecte · ${JSON.stringify(role_kinds || [])}
${sector_role_examples ? '- INSPIRACIÓ rols del sector (NO copia · adapta) · ' + JSON.stringify(sector_role_examples) : ''}

REQUISITS QUALITAT (criteri Verna Allee aplicat) ·
A · Cada SOP és un PROCÉS REAL del sector ${project_ctx?.sector || 'genèric'} en fase ${project_ctx?.lifecycle_stage || 'idea'} · NO un títol genèric
B · Títol del SOP usa verb + objecte específic del domini · ex per sector M (consultoria) "Facilitar workshop de Verna Allee amb client" · NO "SOP 1"
C · Cada step és una ACCIÓ executable per humà o IA · típic 15-180 minuts · CADA STEP DIRECTAMENT CONVERTIBLE A WORK ORDER
D · deliverable_kind · analysis|code|tests|comm|doc|design|review|workshop
E · approval_rule · 'tdd' (test booleà concret · ex "client signa l'acta") · 'manual' (revisió humana)
F · Si approval_rule='tdd' · al label del step menciona el test ("verificar que [condició] booleana és true")
G · role_kind · 'human' (ritual · presència · judici) o 'ai' (text · anàlisi · estructura · drafts)
H · MAI noms tipus "Step 1" · "Setup", "Generic Process". Imagina un consultor sènior amb 10 anys d'experiència al sector.

Genera 3-5 SOPs · cada un amb 3-6 steps.

Retorna NOMÉS · { sops: [{ id, role_ref, title, purpose, steps:[{ id, label, deliverable_kind, approval_rule, role_kind, duration_minutes }] }] }. Sense markdown.`,

    'generate-wos-from-sop': ({ name, sop, project_ctx }) =>
`TASCA · Genera Work Orders (WOs) executables a partir de la SOP "${sop?.title || sop?.id}" del projecte "${name}".

SOP origen ·
- title · ${sop?.title || ''}
- role · ${sop?.role_ref || ''}
- steps · ${JSON.stringify((sop?.steps || []).map(s => ({ id: s.id, label: s.label, kind: s.deliverable_kind, rule: s.approval_rule })))}

CONTEXT VNA del projecte ·
- Nom · "${name}"
- Descripció · ${project_ctx?.description || '(sense)'}
- Sector CNAE · ${project_ctx?.sector || 'indefinit'}    ← determina vocabulari · ritme · approval workflow típic
- Fase lifecycle · ${project_ctx?.lifecycle_stage || 'idea'}    ← WOs idea són exploratoris · WOs scale són optims/recurrents
- Entitat · ${project_ctx?.entity_type || 'organization'}    ← organization=assemblea·consens · business=metric·revenue

REQUISITS QUALITAT (mode Verna Allee · "cada WO és un quanta de valor mappable") ·
A · Title · verb concret + objecte ESPECÍFIC DEL DOMINI (ex per sector M consultoria · "Facilitar workshop Verna Allee 2h amb client IKEA" · NO "Fer reunió")
B · Description · 2-3 frases · qui fa · què lliura · per a qui · quan
C · dtd_test · test BOOLEÀ verificable post-execució · ex · "client signa l'acta de la sessió AND mapa VNA pujat al permaweb amb hash signat" · MAI "fer-ho bé" / "està fet"
D · estimated_hours · coherent amb steps de la SOP · realista (típic 0.5-8h per WO · NO 0.1h ni 40h)
E · assignee_role · coincideix amb sop.role_ref llevat que hi hagi raó forta (ex · pair amb un rol senior)
F · MAI WOs tipus "Setup" "Configure" "Initial task" · sempre amb objecte de domini

Genera 2-4 WOs executables ARA mateix · cada un convertible a tasca al Kanban.

Retorna NOMÉS · { wos: [{ id, title, description, sop_ref, step_refs:[], assignee_role, deliverable_kind, approval_rule, estimated_hours, dtd_test }] }. Sense markdown · sense codeblocks.`,

    // ── PROMPTS EXPERTS · cadena especialitzada per fase (PR-O · @alvaro) ──

    'define-product-service': ({ name, description, sector, entity_type, lifecycle_stage }) =>
`TASCA · IDENTIFICA EL PRODUCTE/SERVEI CENTRAL del projecte.

Sense això · no es pot construir un mapa de valor coherent · el producte/servei és el "deliverable principal" del network.

CONTEXT ·
- Projecte · "${name}"
- Sector CNAE · ${sector || '(infereix)'}
- Tipus entitat · ${entity_type || 'organization'}
- Fase · ${lifecycle_stage || 'idea'}
- Descripció · ${description || '(vaga)'}

ANÀLISI · pensa step-by-step ·
1. Quin és el producte CONCRET o servei que crea ingressos/valor (no abstracte)?
2. És un producte (tangible) · servei (intangible) · híbrid · o organització?
3. A qui va dirigit · client/usuari/beneficiari?
4. Quin és el diferencial vs alternatives existents al sector?

Retorna NOMÉS aquest JSON ·
{
  "name": "nom específic del producte/servei (ex · 'Pauta cures personalitzades setmanal' · NO 'Servei de cures')",
  "kind": "product|service|hybrid|organization",
  "audience": "qui paga + qui consumeix (poden ser diferents · ex · 'famílies paguen · gent gran consumeix')",
  "valueProposition": "1-2 frases · què guanya el client",
  "differentiator": "què el fa diferent al sector",
  "revenueModel": "subscription|transaction|service-fee|grant|hybrid|free-mvp",
  "deliveryRhythm": "freqüència típica · diari/setmanal/mensual/single",
  "examples": [2-3 mostres concretes de què seria un exemplar individual del producte/servei]
}
Sense markdown · sense codeblocks.`,

    'design-value-map-rich': ({ name, description, sector, entity_type, lifecycle_stage, vna_zoom, product_service, canvas, pitch, domainDetection = null, sectorContext = null, existingMap = null }) => {
        // v126 · sub-domain inference · si el caller passa domainDetection
        // (de domainDetector.detectDomain) → injectem els arquetip específics
        // del sub-domini (ex sports-team · 14 rols esportius reals) en
        // comptes dels 5 genèrics del catàleg de sector. CLAU per a casos no-
        // business · futbol · companyia de teatre · cooperativa cures · etc.
        let domainBlock = '';
        if (domainDetection && Array.isArray(domainDetection.archetypes) && domainDetection.archetypes.length) {
            const archs = domainDetection.archetypes.map(a => `  · ${a.name} [${a.castell}] · ${a.desc}`).join('\n');
            const intang = (domainDetection.intangibles || []).map(s => `  · ${s}`).join('\n');
            const pats = (domainDetection.patterns || []).map(s => `  · ${s}`).join('\n');
            domainBlock = `
DOMINI DETECTAT · ${domainDetection.label} (confidence ${domainDetection.confidence}) ·
Arquetip de rols ESPECÍFICS d'aquest domini (usa'ls com a punt de partida · POTS afegir-ne ·
NO et limitis als 5 genèrics del catàleg de sector) ·
${archs}

Intangibles típics d'aquest domini (Verna Allee · clau per a la cohesió real) ·
${intang}

Patterns recíprocs comuns ·
${pats}
`;
        }
        // v131b · sectorContext · output de sectorAgentLoader.buildSectorContextBlock
        // complementa (NO substitueix) el domainDetection · injecta CNAE-2009 oficial +
        // rols arquetip per nivell casteller + SOPs canonical adaptats al sector.
        let sectorBlock = '';
        if (sectorContext && typeof sectorContext === 'string' && sectorContext.length > 20) {
            sectorBlock = `
CONTEXT SECTORIAL CNAE-2009 ESPANYA (knowledge/sectors/${sector || 'X'}.md · v131b canonical) ·
${sectorContext}
`;
        }
        // v132c · mode completar · si l'usuari ja té un mapa parcial, hem d'enriquir
        // (no regenerar des de zero) · pattern del botó "Sugerir con IA" /map
        let existingBlock = '';
        if (existingMap && (existingMap.roles?.length || existingMap.transactions?.length)) {
            const existingRoles = (existingMap.roles || []).map(r => '  · ' + (r.name || r.id) + (r.castell_level ? ' [' + r.castell_level + ']' : '')).join('\n');
            const existingTxs   = (existingMap.transactions || []).map(t => '  · ' + (t.from || '?') + '→' + (t.to || '?') + ' (' + (t.deliverable || t.label || t.type || '') + ')').join('\n');
            existingBlock = `
MODE COMPLETAR · l'usuari JA té aquest mapa parcial · AFEGEIX els rols/transactions/deliverables que FALTEN · NO repeteixis els existents ·
${existingRoles ? 'Rols existents ·\n' + existingRoles : ''}
${existingTxs ? 'Transactions existents ·\n' + existingTxs : ''}
Genera SOLS NOUS rols/transactions que tinguin sentit amb el context · prioritza intangibles · cicles recíprocs amb els existents.
`;
        }
        const taskHeader = existingBlock
            ? 'TASCA · ENRIQUIR MAPA DE VALOR EXISTENT · afegeix el que falta · pensa com a consultor VNA llegendari.'
            : 'TASCA · DISSENY DE MAPA DE VALOR RIC · pensa profundament com a consultor VNA llegendari.';
        return `${taskHeader}
${existingBlock}
CONTEXT (tot rellevant per al teu raonament Allee) ·
- Projecte · "${name}"
- Sector CNAE · ${sector || '(infereix)'}
- Tipus entitat · ${entity_type || 'organization'}
- Fase lifecycle · ${lifecycle_stage || 'idea'}
- Zoom VNA · ${vna_zoom || 'meso'} (macro=1-3 rols globals · meso=4-7 rols operatius · micro=8-15 detall)
- Producte/servei central · ${product_service ? JSON.stringify(product_service) : '(infereix del context)'}
${canvas ? '- Canvas vision · ' + canvas.vision : ''}
${pitch ? '- Pitch headline · ' + pitch.headline : ''}
- Descripció · ${description || '(vaga)'}
${domainBlock}${sectorBlock}
THINK STEP-BY-STEP (mentalment · NO mostris el procés · només l'output) ·
0. ¿El projecte és business típic o té sub-domini específic? (sports/team · arts/performance · cooperativa cures · escola · religious · militant · etc.) — adapta els ARQUETIP al sub-domini real ${domainDetection ? '(JA detectat: ' + domainDetection.label + ')' : '(infereix · NO et quedis amb 5 rols genèrics si el context demana 10+ rols específics)'}.
1. Quin és el network real al voltant del producte/servei?
2. Quins rols intervenen al cicle complet (producció · entrega · suport · ingressos · governança)?
3. Per cada parell de rols · quines transaccions TANGIBLES (formals · facturables)?
4. I quines INTANGIBLES (Allee · 40-60% del valor real · ex confiança · reputació · identitat · cohesió)?
5. Quins rols són emissor sense receptor (orfes)? Quins deliverables són morts?
6. Quins cicles són recíprocs (A→B→A)? Quins són one-way?

REQUISITS QUALITAT ·
A · MAPA RIC · NO mínim · busca complecció VNA · ${vna_zoom || 'meso'} demana ${vna_zoom === 'macro' ? '1-3' : vna_zoom === 'micro' ? '8-15' : '4-7'} rols com a OBJECTIU · però si el sub-domini real demana MÉS rols arquetip (ex equip esportiu sempre té entrenador + jugadors + scout + patrocinador + afició + federació · MÍNIM 8) · supera el rang sense por
B · Cada rol té nom REAL del sub-domini (ex futbol · "Primer Entrenador" NO "Coach" · "Director Esportiu" NO "Founder" · "Ojeador" NO "Reviewer")
C · MIX obligatori · 60-70% transaccions tangibles · 30-40% intangibles · MAI 100% tangibles
D · Almenys 1 CICLE RECÍPROC clar (A→B amb deliverable X · B→A amb deliverable Y) revelant confiança o dependència
E · MAI rols orfes · MAI deliverables morts · cada deliverable té producer + ≥1 consumer
F · Deliverables amb NOM DE DOMINI (NO "doc" · NO "comunicació" · sempre específic com "Acta entrenament setmanal" · "Informe scouting rival" · "Renovació subscriptor temporada")
G · Mètriques Lean realistes (lead_time_hours = clock-time · cycle_time_hours = work-time · NO inventis · per a esports usa cicles per partit/setmanal)

Retorna NOMÉS aquest JSON ·
{
  "valueMapVersion": "v1",
  "domainInferred": "sports-team|arts-performance|coop-cares|edu-formation|business-generic|...",
  "thinking": "2-3 frases · com has organitzat el network · per a auditoria humana",
  "roles": [
    {
      "id": "rol-slug",
      "kind": "founder|operations|creator|reviewer|facilitator|pm|coder|sporting-director|head-coach|player|scout|sponsor|fan-base|federation|...",
      "name": "nom específic del sub-domini",
      "description": "1 frase · què fa al network",
      "castell_level": "pom_de_dalt|tronc|pinya|laterals|mans|baixos",
      "level": "macro|meso|micro",
      "typical_actor": "qui ho fa típicament (persona | equip | sistema | IA)"
    }
  ],
  "deliverables": [
    {
      "id": "del-slug",
      "name": "nom específic del domini · ex 'Alineació partit jornada 5' · 'Informe scout rival'",
      "kind": "tangible|intangible",
      "producer": "rol-id",
      "consumers": ["rol-id", ...],
      "validator": "rol-id|tdd|manual"
    }
  ],
  "transactions": [
    {
      "id": "tx-1",
      "from": "rol-id",
      "to": "rol-id",
      "deliverable": "del-id",
      "type": "tangible|intangible",
      "trigger": "què la dispara",
      "lead_time_hours": 24,
      "cycle_time_hours": 2,
      "wip_units": 1,
      "frequency": "daily|weekly|monthly|per-match|on-demand",
      "reciprocates_with": "tx-N | null (si forma cicle amb una altra)"
    }
  ],
  "patterns_detected": [
    "1-3 patrons VNA observats · ex 'cicle entrenador-jugador setmanal · instrucció ⇄ rendiment' · 'reciprocitat club-afició revela base econòmica i emocional'"
  ]
}
Sense markdown · sense codeblocks · NO escriguis cap text fora del JSON.`;
    },

    'generate-socs-from-value-map': ({ name, sector, lifecycle_stage, value_map, vna_zoom }) =>
`TASCA · GENERA SOCs (Standard Operating CONCEPTS) DERIVATS DEL MAPA DE VALOR + ORDENACIÓ PER A LES 3 VISTES DEL SOS.

UN SOC = un PROCÉS del network. És l'INVARIANT (què + per què). Mata 2 ocells d'un tret · genera el SOC + dóna les "presentation hints" per a les 3 vistes canòniques del SOS (mapa de valor · castell · lineal).

VOCABULARI · "procés" i "SOC" són sinònims al SOS V11. Un SOC és el "què cal fer i per què" d'un procés concret del network. SOPs concrets vindran després (generate-sops-with-skills).

VISTES DEL SOS (el teu output les ha d'alimentar) ·
- **mapView** · graf 2D · roles a nodes · transactions a arestes · zoom macro/meso/micro
- **castellView** · 6 nivells castellers (pom_de_dalt → tronc → pinya → laterals → mans → baixos) · ordena rols per nivell
- **linearView** · seqüència temporal de processos (SOCs) · "primer es fa X, després Y, després Z"

CONTEXT ·
- Projecte · "${name}"
- Sector CNAE · ${sector || '(?)'}
- Fase · ${lifecycle_stage || 'idea'}
- Zoom · ${vna_zoom || 'meso'} (genera ${vna_zoom === 'macro' ? '1-3' : vna_zoom === 'micro' ? '8-15' : '3-7'} SOCs)

MAPA DE VALOR (entrada) ·
${value_map ? JSON.stringify({
    roles: (value_map.roles || []).map(r => ({ id: r.id, name: r.name, kind: r.kind, castell_level: r.castell_level })),
    deliverables: (value_map.deliverables || []).map(d => ({ id: d.id, name: d.name, kind: d.kind })),
    transactions: (value_map.transactions || []).map(t => ({ id: t.id, from: t.from, to: t.to, deliverable: t.deliverable, type: t.type, trigger: t.trigger })),
    patterns: value_map.patterns_detected,
}, null, 2).slice(0, 1800) : '(falta · genera amb supòsits raonables)'}

REQUISITS ·
- Cada SOC té NOM ESPECÍFIC del domini (ex · "Cicle setmanal cohort coordinadora" · "Onboarding nou client consultoria") · MAI "Procés 1"
- Cada SOC té PURPOSE clar · per què existeix
- Cada SOC té PHASE (idea/mvp/validation/scale)
- Cada SOC té CHECKLIST de 3-6 items · estats desitjats (NO accions)
- Cada item té VERIFICATION_KIND · 'sop-exists' | 'tdd' | 'manual-review' | 'attestation'
- Cada SOC té TRANSACTION_REFS · lista de tx ids del value_map que aquest SOC orquestra
- Cada SOC té ORDER_INDEX · posició temporal a la linearView (0-based · 0 = el primer)

Retorna NOMÉS aquest JSON ·
{
  "socs": [
    {
      "id": "soc-slug",
      "name": "nom específic",
      "purpose": "per què existeix · 1-2 frases",
      "phase": "idea|mvp|validation|scale",
      "level": "macro|meso|micro",
      "order_index": 0,
      "transaction_refs": ["tx-1", "tx-2"],
      "involved_roles": ["rol-id-1", "rol-id-2"],
      "outcomes": [2-4 outcomes mesurables],
      "checklist": [
        {
          "id": "i1",
          "label": "estat desitjat · ex 'Acta signada per tots els socis presents'",
          "required": true,
          "verification_kind": "sop-exists|tdd|manual-review|attestation",
          "sop_ref": null
        }
      ]
    }
  ],
  "presentationHints": {
    "linearOrder": ["soc-id-primer", "soc-id-segon", "soc-id-tercer"],
    "castellGrouping": {
      "pom_de_dalt": ["soc-ids · processos estratègics"],
      "tronc":       ["soc-ids · processos d'execució crítica"],
      "pinya":       ["soc-ids · processos de suport"],
      "laterals":    ["soc-ids · processos de validació/QA"],
      "mans":        ["soc-ids · processos d'interfície externa"],
      "baixos":      ["soc-ids · processos d'ancoratge ètic/legal"]
    },
    "deliverableSequence": ["del-id-primer", "del-id-segon", "..."],
    "mapClustering": {
      "cluster-a": { "label": "Captació", "soc_ids": ["..."], "color_hint": "#3b82f6" },
      "cluster-b": { "label": "Operació", "soc_ids": ["..."], "color_hint": "#22c55e" }
    }
  }
}
Sense markdown · sense codeblocks.`,

    'generate-sops-with-skills': ({ name, soc, project_ctx, role_kinds, sector_role_examples, available_skills }) =>
`TASCA · GENERA SOPs (Standard Operating PROCEDURES) per al SOC "${soc?.name || soc?.id}" · cada step amb SKILLS associades (clau per SOS).

SOC origen (l'INVARIANT que aquests SOPs implementaran) ·
- name · ${soc?.name || ''}
- purpose · ${soc?.purpose || ''}
- phase · ${soc?.phase || project_ctx?.lifecycle_stage || 'idea'}
- checklist · ${JSON.stringify((soc?.checklist || []).map(i => ({ id: i.id, label: i.label })))}

CONTEXT VNA del projecte ·
- Nom · "${name}"
- Descripció · ${project_ctx?.description || ''}
- Sector CNAE · ${project_ctx?.sector || '(?)'}
- Entitat · ${project_ctx?.entity_type || 'organization'}
- Rols disponibles · ${JSON.stringify(role_kinds || [])}
${sector_role_examples ? '- INSPIRACIÓ rols sector (NO copies · adapta) · ' + JSON.stringify(sector_role_examples) : ''}
${available_skills ? '- SKILLS catàleg SOS (assigna les més rellevants per step) · ' + JSON.stringify(available_skills) : ''}

REGLES SOP (Antigravity Engine · cada step és convertible a WO) ·
- Cada SOP IMPLEMENTA un item del checklist del SOC (sop_ref link)
- TITOL · verb + objecte ESPECÍFIC del domini · MAI "Setup" · "Procés 1" · "Initial step"
- Cada step té · {label, deliverable_kind, approval_rule, role_kind, duration_minutes, skills}
  · deliverable_kind ∈ analysis|code|tests|comm|doc|design|review|workshop|signature
  · approval_rule ∈ manual (revisió humana) | tdd (test booleà concret)
  · role_kind ∈ human (ritual·presència·judici) | ai (text·anàlisi·drafts)
  · duration_minutes realista (15-180 típic)
  · skills · 1-3 skill ids del catàleg que el step requereix
- Si approval_rule='tdd' · al label menciona el test ("verificar que [condició] booleà és true")
- Cada SOP TÉ MINIM 3 steps · max 6 (>6 → 2 SOPs)

QUALITAT · imagina un consultor sènior amb 10 anys al sector ${project_ctx?.sector || ''} · cada SOP ha de ser EXECUTABLE per un humà · NO abstracte.

Genera 1 SOP per cada item del checklist del SOC (típic 3-5 SOPs).

Retorna NOMÉS aquest JSON ·
{
  "sops": [
    {
      "id": "sop-slug",
      "role_ref": "rol-id",
      "title": "verb + objecte específic",
      "purpose": "què aconsegueix · 1 frase",
      "soc_item_ref": "i1",
      "steps": [
        {
          "id": "s1",
          "label": "acció + objecte · si tdd inclou el test",
          "deliverable_kind": "doc",
          "approval_rule": "manual|tdd",
          "role_kind": "human|ai",
          "duration_minutes": 30,
          "skills": ["skill-id-1", "skill-id-2"]
        }
      ]
    }
  ]
}
Sense markdown · sense codeblocks.`,
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
export function buildPrompt({ templateId = null, taskKind, context = {}, slim = false } = {}) {
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

    // v132b · slim mode · usa SYSTEM_BASE_SLIM (50% menys tokens) ·
    // hipòtesi @alvaro "menys context > més" · invariants validades POST-IA
    // via scoreOutput · escalation a SYSTEM_BASE complet si score < 70.
    const systemUsed = slim ? SYSTEM_BASE_SLIM : SYSTEM_BASE;

    return {
        version: PROMPTS_VERSION,
        system:  systemUsed,
        fewShot,
        user:    userPrompt,
        // tokenCount aproximat (1 token ≈ 4 chars) · per a budget guard
        approxTokens: _estimateTokens(systemUsed, fewShot, userPrompt),
        slim,
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

// validateCastellLevel · pure · verifica que un castell_level és canonical.
// Útil per a checks post-IA (la IA pot inventar levels · això blinda).
export function validateCastellLevel(level) {
    if (!level || typeof level !== 'string') return false;
    return CASTELLER_LEVELS.some(l => l.id === level);
}

// suggestCastellLevel · pure · retorna el castell_level típic per a un kind.
// Útil per autocompletar a UI/template sense IA. Heurístic · cap garantia
// d'optimalitat · cap rol restringit a 1 sol level.
export function suggestCastellLevel(roleKind) {
    if (!roleKind) return 'pinya';   // default fallback
    const norm = String(roleKind).toLowerCase();
    for (const l of CASTELLER_LEVELS) {
        if (l.typical_kinds.some(k => norm.includes(k) || k.includes(norm))) return l.id;
    }
    return 'pinya';
}
