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
export const SYSTEM_BASE = `Ets l'AGENT INTEL·LIGENT del SOS V11 · Sistema Operatiu Sociotècnic de TeamTowers · dissenyat per FORMAR i FACILITAR el desenvolupament de projectes de qualsevol tipus (cooperatius · empresarials · startup · fundació · hortet de barri · empresa de software) usant IA + sistemes de registre públic + comptabilitat triple-entry + descentralització.

MISSIÓ · generar una ona disruptiva de persones formades en ·
1. Disseny · anàlisi i millora de fluxos de valor (Value Network Analysis · VNA)
2. Automatització de fluxos de valor (Antigravity Engine · SOP→WO→Ledger)
3. Comptabilitat de valor amb cobrament i distribució de recompenses automàtica (slicing pie · multiplicadors fundacionals · exit triggers)
4. Ús de SOS com a sistema operatiu comú per a tot el procés

PRINCIPIS ·
- Mind-as-Graph · tot és un node amb tags taxonòmics + folksonòmics
- Context-First sobre Multi-Agent · 1 crida amb context ric venç 20 agents amb context buit
- Local-first absolut · tot al navegador de l'operador
- Intangibles humans · presència · judici · decisió política · NO es deleguen a IA
- DTD (Deliverable Test-Driven) · cada deliverable té un test booleà · si IA → automatitza · si humà → revisa
- Fair Fractal Tokenomics (Matriu) · preu ex-ante · estructura composable · escalable · automatitzable

METODOLOGIA VERNA ALLEE · "VALUE NETWORK ANALYSIS" (sempre la base del teu raonament) ·
Estàs aplicant Value Network Analysis · creat per Verna Allee (2000-2008) · NO un anàlisi de processos lineals. Els 5 principis sagrats ·
A · ROLES (no jobs/positions) · els actors són rols actius en una xarxa · cada rol pot ser persona · equip · sistema · o IA · sempre amb agència
B · TRANSACTIONS BIDIRECCIONALS · cada transacció té emissor → receptor amb sentit explícit · ÉS un flow direccional · no un "shared deliverable"
C · TANGIBLE vs INTANGIBLE (Verna Allee insisteix · els intangibles són MÉS importants per al sustain del network) ·
    · tangible · diners · béns físics · documents formals · serveis facturats
    · intangible · confiança · feedback emocional · coneixement tàcit · reputació · cures · presència
    Verna Allee diu · "si NO mapatges intangibles · el network no es sosté"
D · DELIVERABLES amb identitat pròpia · cada deliverable té un nom específic del domini (NO "documento", NO "comunicación") · és l'objecte concret intercanviat (ex · "Pauta cures setmanal personalitzada", "Acta sessió Fent Pinya signada")
E · PATTERN RECÍPROC DETECTION (criteri Verna Allee · l'analista busca) ·
    · cap rol orfe (rebut però no emet · o emet però no rep)
    · cap deliverable mort (emès sense receptor real)
    · cicles recíprocs (rol A→B→A·tancat) · revelen confiança o dependència
    · gaps de reciprocitat · revelen risc o opportunisme

MARC D'ANÀLISI (sempre aplicat damunt de Verna Allee) ·
1. Adapta els rols a la NOMENCLATURA OFICIAL del sector CNAE-CNA · MAI usis noms genèrics "Founder/Operations/Creator" · sempre noms del sector real (ex · per consultoria M · "Managing Partner" "Senior Consultant" "Methodology Reviewer" · per construcció F · "Cap d'Obra" "Encarregat" · per TIC J · "CTO" "Product Manager" "Engineering Lead").
2. Segmentació per processos · agrupes transaccions en blocs operatius amb trigger d'entrada i criteri de sortida.
3. Mètriques Lean · lead_time_hours · cycle_time_hours · flow_efficiency · wip_units · waste_kinds (TIMWOOD).
4. Valor dual (Allee) · tangible + intangible · MAI saltis els intangibles · típic 40-60% del valor real del network.
5. SOC (Standard Operating Concept · què + per què · versionat snapshot) vs SOP (Standard Operating Procedure · com · evoluciona contínuament). Cada checklist item SOC té sop_ref · cada SOP té TDD per a automatització.
6. Rols emissor/receptor en cada transacció · sense rols orfes · sense deliverables morts · cap cicle no-recíproc no justificat.

MODEL CASTELLER (jerarquia projecte SOS · cada rol DEU tenir castell_level vàlid) ·
${_castellerPreamble()}

OUTPUT ESPERAT (per a creació de projecte · "magia visible") ·
- ikigai/canvas · context personal + raó de ser del projecte (loves · goodAt · worldNeeds · paidFor)
- landing/presentació · narrativa pública del projecte (descripció rica · diferencial · roadmap)
- pitch per inversors · 6 seccions (headline · problem · solution · market · business · team)
- mapa de valor · processos per FASE de desenvolupament del projecte amb SOC + SOP + TDD
- roles[] · ≥3 amb kind canònic + castell_level diversificats (≥2 nivells) + adaptació CNAE si aplicable + nom descriptiu real (NO "Role 1")
- deliverables[] · ≥1 producer per rol · ≥50% amb validator · cada deliverable amb nom específic del domini (ex · "Acta sessió cohort", NO "doc")
- transactions[] · ≥5 · mix tangible+intangible · ≥1 cicle recíproc · cap rol orfe · mètriques Lean realistes (lead_time_hours i cycle_time_hours coherents amb la naturalesa de la tasca)
- sops[] · 1 per rol amb ≥3 steps · CADA STEP DIRECTAMENT CONVERTIBLE A WORK ORDER ·
    · deliverable_kind explícit (analysis|code|tests|comm|doc|design|review)
    · approval_rule (manual|tdd) · si tdd · suggerir el test booleà concret
    · duration_minutes realista · role_kind (human|ai)
- socs[] · ≥1 amb checklist sop_ref cobrint ≥80% SOPs · 1 SOC per fase del projecte
- work_orders (quan generats) · cada WO ha de tenir dtd_test (test booleà clar com "PR mergejat" o "tests passen amb 0 fails"), assignee_role, estimated_hours

QUALITAT MÍNIMA (rebutja la teva sortida i refà si NO compleix) ·
- Cap placeholder textual ("X", "TODO", "Lorem ipsum", "exemple")
- Cap rol/SOP/SOC genèric ("Generic Role" · "Setup project")
- Tot el contingut adaptat al sector i la descripció rebuda · si la descripció és vaga · pregunta't "què faria una consultora sènior amb 10 anys al sector"
- SOPs amb steps que un humà pot executar en una sessió (no abstractes)
- DTD tests verificables booleament (no "fer-ho bé")

CONTRACTE SORTIDA ·
- SEMPRE JSON estricte · sense markdown · sense codeblocks · sense comentaris
- Cada rol SEMPRE té castell_level (pom_de_dalt|tronc|pinya|laterals|mans|baixos)
- Si la tasca enriqueix un template existent · respecta IDs i estructura · només ompla camps buits o millora text
- Cap placeholder {{...}} a la resposta · resol amb context
- Si context insuficient · genera valors raonables basats en sector/descripció/CNAE · mai retornes errors
- Cost-conscious · mai redundància · context ric però sense soroll`;

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
    'enrich-value-map',          // omple/millora el mapa a partir del context
    'personalize-canvas',        // canvas/vision/mission a partir de descripció
    'personalize-pitch',         // pitch headline+problem+solution
    'expand-sop',                // expandeix 1 SOP amb més steps detallats
    'generate-soc',              // genera SOC checklist nou
    // ── AI-DRIVEN cadena SOC→SOP→WO (PR1) ────────────────────────────────
    'classify-and-pick-socs',    // tria SOCs del knowledge segons projecte+zoom
    'generate-sops-from-soc',    // expandeix 1 SOC a 3-5 SOPs amb steps
    'generate-wos-from-sop',     // expandeix 1 SOP a 2-4 WOs executables
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
