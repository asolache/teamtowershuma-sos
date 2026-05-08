// TEAMTOWERS SOS V11 — SKILL TAXONOMY (MAT-003 sprint B)
//
// Catálogo canónico de skills críticos del enjambre Cohort 0 + agente
// IA SOS para bootstrap de cualquier tipo de proyecto.
//
// Diseño · 90 skills distribuidos por los 10 dominios MAT-003,
// proporcionalmente a la distribución operativa 8/12/16/8/12/12/6/8/8/6.
// Cada skill declara afinidad con 1-2 guardianes Pantheon Work + las
// prácticas nativas digitales que vehicula.
//
// Tier semántico (no jerárquico estricto · es heurístico para
// matchmaker):
//   - foundation   · capacidad operativa básica · disponible en bootcamp
//   - practitioner · ejecuta autónomamente · ya ha completado proyectos
//   - master       · referente · forma a otras plazas · custodi del skill
//
// Cobertura del enjambre · `coverageReport({ swarmSkills })` evalúa
// si las skills declaradas por las plazas Cohort 0 cubren el catálogo
// completo, identifica gaps y redundancia (≥3 plazas la dominan ·
// resiliencia).

export const SKILL_TIERS = Object.freeze(['foundation', 'practitioner', 'master']);

// 90 skills · 8/10/14/8/11/10/6/8/8/7 = 90 (proporcional al 8/12/16/8/12/12/6/8/8/6 = 96)
export const SKILL_TAXONOMY = Object.freeze([

    // ─── governance · 8 ────────────────────────────────────────────
    Object.freeze({ id: 'vision-strategic',         label: 'Visió estratègica',           domain: 'governance', tier: 'master',       guardianAffinity: Object.freeze(['zeus']),               relatedPractices: Object.freeze(['flujo-valor', 'reconocer-competencias']),   description: 'Definir el rumb fundacional del projecte i sostenir-lo en decisions clau.' }),
    Object.freeze({ id: 'governance-design',        label: 'Disseny de governança',       domain: 'governance', tier: 'master',       guardianAffinity: Object.freeze(['atenea']),             relatedPractices: Object.freeze(['netiqueta-estricta']),                       description: 'Dissenyar com es prenen decisions, qui les pren i com es revisen.' }),
    Object.freeze({ id: 'decision-facilitation',    label: 'Facilitació de decisions',    domain: 'governance', tier: 'practitioner', guardianAffinity: Object.freeze(['atenea', 'zeus']),     relatedPractices: Object.freeze(['empoderar-mutuamente']),                     description: 'Conduir el grup cap a decisions efectives sense imposar criteri propi.' }),
    Object.freeze({ id: 'conflict-resolution',      label: 'Resolució de conflictes',     domain: 'governance', tier: 'master',       guardianAffinity: Object.freeze(['atenea', 'hera']),     relatedPractices: Object.freeze(['netiqueta-estricta']),                       description: 'Mediar tensions estructurals entre rols, plaçes o socis.' }),
    Object.freeze({ id: 'ownership-allocation',     label: 'Assignació d\'ownership',     domain: 'governance', tier: 'practitioner', guardianAffinity: Object.freeze(['zeus']),               relatedPractices: Object.freeze(['reconocer-competencias']),                   description: 'Determinar qui té responsabilitat última en cada àmbit del projecte.' }),
    Object.freeze({ id: 'policy-writing',           label: 'Redacció de polítiques',      domain: 'governance', tier: 'practitioner', guardianAffinity: Object.freeze(['atenea']),             relatedPractices: Object.freeze(['netiqueta-estricta']),                       description: 'Escriure normes internes clares, breus i revisables.' }),
    Object.freeze({ id: 'transparency-protocols',   label: 'Protocols de transparència',  domain: 'governance', tier: 'foundation',   guardianAffinity: Object.freeze(['hermes']),             relatedPractices: Object.freeze(['voz-alta']),                                  description: 'Implementar protocols que fan visibles decisions i fluxos.' }),
    Object.freeze({ id: 'delegation-systems',       label: 'Sistemes de delegació',       domain: 'governance', tier: 'practitioner', guardianAffinity: Object.freeze(['zeus']),               relatedPractices: Object.freeze(['empoderar-mutuamente']),                     description: 'Establir cadenes de delegació clares amb feedback mensurable.' }),

    // ─── finance · 10 ──────────────────────────────────────────────
    Object.freeze({ id: 'triple-entry-accounting',  label: 'Comptabilitat triple-entry',  domain: 'finance',    tier: 'practitioner', guardianAffinity: Object.freeze(['poseidon']),           relatedPractices: Object.freeze(['flujo-valor']),                              description: 'Registrar transaccions amb càrrec + abonament + signatura criptogràfica.' }),
    Object.freeze({ id: 'slicing-pie',              label: 'Slicing pie · equity dinàmic',domain: 'finance',    tier: 'master',       guardianAffinity: Object.freeze(['poseidon', 'hera']),   relatedPractices: Object.freeze(['reconocer-competencias']),                   description: 'Repartir equity proporcional a aportacions reals en temps real.' }),
    Object.freeze({ id: 'pricing-ex-ante',          label: 'Pricing ex-ante',             domain: 'finance',    tier: 'practitioner', guardianAffinity: Object.freeze(['poseidon']),           relatedPractices: Object.freeze(['flujo-valor']),                              description: 'Acordar preus de cada aportació abans, no després (regla Fair).' }),
    Object.freeze({ id: 'treasury-management',      label: 'Gestió de tresoreria',         domain: 'finance',    tier: 'master',       guardianAffinity: Object.freeze(['poseidon']),           relatedPractices: Object.freeze(['flujo-valor']),                              description: 'Custodiar el fons cooperatiu del projecte i les seves liquideses.' }),
    Object.freeze({ id: 'ledger-auditing',          label: 'Auditoria del ledger',        domain: 'finance',    tier: 'practitioner', guardianAffinity: Object.freeze(['poseidon']),           relatedPractices: Object.freeze(['voz-alta']),                                  description: 'Verificar que els assentaments del ledger són correctes i traçables.' }),
    Object.freeze({ id: 'capital-sourcing',         label: 'Originació de capital',       domain: 'finance',    tier: 'master',       guardianAffinity: Object.freeze(['poseidon']),           relatedPractices: Object.freeze(['flujo-valor']),                              description: 'Atreure capital alineat amb el model cooperatiu del projecte.' }),
    Object.freeze({ id: 'exit-mechanism-design',    label: 'Disseny d\'exit mechanism',   domain: 'finance',    tier: 'master',       guardianAffinity: Object.freeze(['poseidon']),           relatedPractices: Object.freeze(['flujo-valor']),                              description: 'Definir trigger + snapshot + càlcul + liquidació del projecte.' }),
    Object.freeze({ id: 'wallet-operations',        label: 'Operació de wallet',          domain: 'finance',    tier: 'foundation',   guardianAffinity: Object.freeze(['poseidon']),           relatedPractices: Object.freeze(['flujo-valor']),                              description: 'Recarregar, consumir i auditar wallets prepagos del projecte.' }),
    Object.freeze({ id: 'token-economics',          label: 'Tokenomics · disseny',        domain: 'finance',    tier: 'practitioner', guardianAffinity: Object.freeze(['poseidon']),           relatedPractices: Object.freeze(['flujo-valor']),                              description: 'Dissenyar tokens del projecte segons les regles Fair Fractal.' }),
    Object.freeze({ id: 'cost-modeling',            label: 'Modelatge de costos',         domain: 'finance',    tier: 'foundation',   guardianAffinity: Object.freeze(['poseidon']),           relatedPractices: Object.freeze(['flujo-valor']),                              description: 'Estimar costos d\'execució per WO/SOP/projecte abans d\'engegar.' }),

    // ─── tech · 14 ─────────────────────────────────────────────────
    Object.freeze({ id: 'system-architecture',      label: 'Arquitectura de sistemes',    domain: 'tech',       tier: 'master',       guardianAffinity: Object.freeze(['hefesto']),            relatedPractices: Object.freeze(['gestion-conocimiento']),                     description: 'Dissenyar l\'arquitectura tècnica del projecte cap a l\'escalabilitat.' }),
    Object.freeze({ id: 'backend-development',      label: 'Desenvolupament backend',     domain: 'tech',       tier: 'practitioner', guardianAffinity: Object.freeze(['hefesto']),            relatedPractices: Object.freeze(['beta']),                                      description: 'Construir lògica server-side · APIs · persistència.' }),
    Object.freeze({ id: 'frontend-development',     label: 'Desenvolupament frontend',    domain: 'tech',       tier: 'practitioner', guardianAffinity: Object.freeze(['hefesto']),            relatedPractices: Object.freeze(['beta']),                                      description: 'Construir interfícies d\'usuari · vanilla / framework.' }),
    Object.freeze({ id: 'smart-contract-development',label: 'Desenvolupament smart contracts',domain: 'tech',  tier: 'master',       guardianAffinity: Object.freeze(['hefesto']),            relatedPractices: Object.freeze(['beta']),                                      description: 'Codificar contractes auto-executables (Solidity / Vyper).' }),
    Object.freeze({ id: 'devops-cooperative',       label: 'DevOps cooperatiu',           domain: 'tech',       tier: 'practitioner', guardianAffinity: Object.freeze(['hefesto']),            relatedPractices: Object.freeze(['beta']),                                      description: 'CI/CD + infrastructure-as-code orientat a equips no jeràrquics.' }),
    Object.freeze({ id: 'security-engineering',     label: 'Enginyeria de seguretat',     domain: 'tech',       tier: 'master',       guardianAffinity: Object.freeze(['hefesto', 'atenea']), relatedPractices: Object.freeze(['netiqueta-estricta']),                       description: 'Auditar superfícies d\'atac, criptografia, protocols.' }),
    Object.freeze({ id: 'data-engineering',         label: 'Enginyeria de dades',         domain: 'tech',       tier: 'practitioner', guardianAffinity: Object.freeze(['hefesto']),            relatedPractices: Object.freeze(['gestion-conocimiento']),                     description: 'Pipelines de dades · ETL · warehousing · qualitat.' }),
    Object.freeze({ id: 'llm-orchestration',        label: 'Orquestració LLM',            domain: 'tech',       tier: 'practitioner', guardianAffinity: Object.freeze(['hefesto', 'hermes']), relatedPractices: Object.freeze(['gestion-conocimiento']),                     description: 'Encadenar crides LLM amb context-pruning + telemetria.' }),
    Object.freeze({ id: 'prompt-engineering',       label: 'Prompt engineering',          domain: 'tech',       tier: 'foundation',   guardianAffinity: Object.freeze(['hermes', 'hefesto']), relatedPractices: Object.freeze(['gestion-conocimiento']),                     description: 'Dissenyar prompts efectius per a cada tasca i model.' }),
    Object.freeze({ id: 'api-integration',          label: 'Integració d\'APIs',          domain: 'tech',       tier: 'foundation',   guardianAffinity: Object.freeze(['hermes', 'hefesto']), relatedPractices: Object.freeze(['redes-nodos']),                              description: 'Connectar sistemes externs amb el flux del projecte.' }),
    Object.freeze({ id: 'testing-quality',          label: 'Testing & qualitat',          domain: 'tech',       tier: 'practitioner', guardianAffinity: Object.freeze(['hefesto']),            relatedPractices: Object.freeze(['beta']),                                      description: 'Escriure tests automàtics + DTD · cobertura sòlida.' }),
    Object.freeze({ id: 'kb-curation',              label: 'Curació del KB',              domain: 'tech',       tier: 'practitioner', guardianAffinity: Object.freeze(['atenea']),             relatedPractices: Object.freeze(['gestion-conocimiento']),                     description: 'Mantenir el Mind-as-Graph net, taxonomia consistent, sense duplicats.' }),
    Object.freeze({ id: 'automation-engineering',   label: 'Enginyeria d\'automatització',domain: 'tech',       tier: 'practitioner', guardianAffinity: Object.freeze(['hefesto']),            relatedPractices: Object.freeze(['beta']),                                      description: 'Convertir SOPs repetitius en flows automatitzats.' }),
    Object.freeze({ id: 'maintenance-operations',   label: 'Manteniment operatiu',         domain: 'tech',       tier: 'foundation',   guardianAffinity: Object.freeze(['hefesto']),            relatedPractices: Object.freeze(['beta']),                                      description: 'Monitorització · resposta a incidents · tasques recurrents.' }),

    // ─── design · 8 ────────────────────────────────────────────────
    Object.freeze({ id: 'service-design',           label: 'Service design',              domain: 'design',     tier: 'practitioner', guardianAffinity: Object.freeze(['afrodita']),           relatedPractices: Object.freeze(['ecosistema']),                               description: 'Dissenyar el servei extrem-a-extrem incloent backstage i frontstage.' }),
    Object.freeze({ id: 'visual-identity',          label: 'Identitat visual',            domain: 'design',     tier: 'practitioner', guardianAffinity: Object.freeze(['afrodita']),           relatedPractices: Object.freeze(['memes-campanas']),                            description: 'Crear l\'imaginari visual coherent del projecte.' }),
    Object.freeze({ id: 'ux-research',              label: 'Recerca UX',                  domain: 'design',     tier: 'practitioner', guardianAffinity: Object.freeze(['afrodita', 'hermes']),relatedPractices: Object.freeze(['empoderar-mutuamente']),                     description: 'Entrevistes · observació · síntesi en insights actionables.' }),
    Object.freeze({ id: 'narrative-design',         label: 'Narrative design',            domain: 'design',     tier: 'practitioner', guardianAffinity: Object.freeze(['afrodita', 'dionisio']),relatedPractices: Object.freeze(['memes-campanas']),                          description: 'Construir storytelling consistent al voltant del projecte.' }),
    Object.freeze({ id: 'prototyping',              label: 'Prototipatge',                domain: 'design',     tier: 'practitioner', guardianAffinity: Object.freeze(['hefesto', 'afrodita']),relatedPractices: Object.freeze(['beta']),                                     description: 'Construir prototips ràpidament per validar hipòtesis.' }),
    Object.freeze({ id: 'accessibility-design',     label: 'Disseny accessible',          domain: 'design',     tier: 'practitioner', guardianAffinity: Object.freeze(['afrodita', 'hebe']),  relatedPractices: Object.freeze(['empoderar-mutuamente']),                     description: 'Garantir que el producte serveix a totes les capacitats.' }),
    Object.freeze({ id: 'information-architecture', label: 'Arquitectura d\'informació',  domain: 'design',     tier: 'master',       guardianAffinity: Object.freeze(['atenea', 'afrodita']),relatedPractices: Object.freeze(['gestion-conocimiento']),                     description: 'Estructurar la informació perquè sigui trobable i comprensible.' }),
    Object.freeze({ id: 'visual-facilitation',      label: 'Facilitació visual',          domain: 'design',     tier: 'practitioner', guardianAffinity: Object.freeze(['afrodita', 'hermes']),relatedPractices: Object.freeze(['empoderar-mutuamente']),                     description: 'Capturar discussions amb dibuixos en temps real.' }),

    // ─── operations · 11 ───────────────────────────────────────────
    Object.freeze({ id: 'process-architecture',     label: 'Arquitectura de processos',   domain: 'operations', tier: 'master',       guardianAffinity: Object.freeze(['hebe', 'atenea']),     relatedPractices: Object.freeze(['flujo-valor']),                              description: 'Dissenyar el conjunt de SOPs i les seves dependències.' }),
    Object.freeze({ id: 'sop-authoring',            label: 'Redacció de SOPs',             domain: 'operations', tier: 'practitioner', guardianAffinity: Object.freeze(['hebe']),               relatedPractices: Object.freeze(['gestion-conocimiento']),                     description: 'Escriure procediments operatius clars amb passos i DTD.' }),
    Object.freeze({ id: 'dtd-design',               label: 'Disseny de DTD',               domain: 'operations', tier: 'practitioner', guardianAffinity: Object.freeze(['hebe']),               relatedPractices: Object.freeze(['beta']),                                      description: 'Definir tests booleans per cada deliverable executable.' }),
    Object.freeze({ id: 'workflow-orchestration',   label: 'Orquestració de workflows',   domain: 'operations', tier: 'practitioner', guardianAffinity: Object.freeze(['hebe']),               relatedPractices: Object.freeze(['flujo-valor']),                              description: 'Coordinar SOPs · WOs · ledger en l\'Antigravity Engine.' }),
    Object.freeze({ id: 'quality-control',          label: 'Control de qualitat',         domain: 'operations', tier: 'practitioner', guardianAffinity: Object.freeze(['hebe', 'atenea']),     relatedPractices: Object.freeze(['beta']),                                      description: 'Verificar que cada WO compleix els criteris DTD abans del ledger.' }),
    Object.freeze({ id: 'supplier-sourcing',        label: 'Cerca de proveïdors',         domain: 'operations', tier: 'foundation',   guardianAffinity: Object.freeze(['hebe']),               relatedPractices: Object.freeze(['ecosistema']),                               description: 'Identificar i avaluar proveïdors externs alineats al projecte.' }),
    Object.freeze({ id: 'logistics',                label: 'Logística',                   domain: 'operations', tier: 'practitioner', guardianAffinity: Object.freeze(['hebe']),               relatedPractices: Object.freeze(['flujo-valor']),                              description: 'Coordinar moviment físic de materials, persones, fluxos.' }),
    Object.freeze({ id: 'audit-execution',          label: 'Execució d\'auditoria',       domain: 'operations', tier: 'practitioner', guardianAffinity: Object.freeze(['hebe', 'poseidon']),  relatedPractices: Object.freeze(['voz-alta']),                                  description: 'Conduir auditories internes/externes del projecte.' }),
    Object.freeze({ id: 'onboarding-design',        label: 'Disseny d\'onboarding',       domain: 'operations', tier: 'practitioner', guardianAffinity: Object.freeze(['hebe']),               relatedPractices: Object.freeze(['empoderar-mutuamente']),                     description: 'Crear el camí d\'arribada de noves plaçes/contributors.' }),
    Object.freeze({ id: 'continuous-improvement',   label: 'Millora contínua',            domain: 'operations', tier: 'practitioner', guardianAffinity: Object.freeze(['hebe']),               relatedPractices: Object.freeze(['beta']),                                      description: 'Cicles regulars de retro + ajustament de processos.' }),
    Object.freeze({ id: 'escalation-handling',      label: 'Gestió d\'escalats',          domain: 'operations', tier: 'practitioner', guardianAffinity: Object.freeze(['hebe', 'atenea']),     relatedPractices: Object.freeze(['netiqueta-estricta']),                       description: 'Decidir quan i com escalar incidents al nivell adequat.' }),

    // ─── community · 10 ───────────────────────────────────────────
    Object.freeze({ id: 'facilitation',             label: 'Facilitació',                  domain: 'community',  tier: 'master',       guardianAffinity: Object.freeze(['hermes', 'hestia']),  relatedPractices: Object.freeze(['empoderar-mutuamente']),                     description: 'Conduir reunions/sessions perquè el grup funcioni com a equip.' }),
    Object.freeze({ id: 'conflict-mediation',       label: 'Mediació de conflictes',      domain: 'community',  tier: 'master',       guardianAffinity: Object.freeze(['hera', 'hestia']),     relatedPractices: Object.freeze(['netiqueta-estricta']),                       description: 'Acompanyar parts en disputa fins a un nou equilibri.' }),
    Object.freeze({ id: 'territorial-ambassadorship',label: 'Ambaixada territorial',       domain: 'community',  tier: 'practitioner', guardianAffinity: Object.freeze(['hermes']),             relatedPractices: Object.freeze(['ecosistema']),                               description: 'Representar el projecte en territoris/contextos específics.' }),
    Object.freeze({ id: 'onboarding-buddy',         label: 'Onboarding buddy',            domain: 'community',  tier: 'foundation',   guardianAffinity: Object.freeze(['hebe', 'hestia']),     relatedPractices: Object.freeze(['empoderar-mutuamente']),                     description: 'Acompanyar 1:1 noves plaçes durant les primeres setmanes.' }),
    Object.freeze({ id: 'network-weaving',          label: 'Teixit de xarxa',             domain: 'community',  tier: 'master',       guardianAffinity: Object.freeze(['hermes']),             relatedPractices: Object.freeze(['redes-nodos']),                              description: 'Connectar persones, projectes i recursos creant xarxa viva.' }),
    Object.freeze({ id: 'digital-community-mgmt',   label: 'Gestió de comunitat digital', domain: 'community',  tier: 'practitioner', guardianAffinity: Object.freeze(['hermes']),             relatedPractices: Object.freeze(['voz-alta']),                                  description: 'Mantenir canals digitals (chat · forum · social) actius i sans.' }),
    Object.freeze({ id: 'meeting-design',           label: 'Disseny de reunions',         domain: 'community',  tier: 'practitioner', guardianAffinity: Object.freeze(['hermes']),             relatedPractices: Object.freeze(['empoderar-mutuamente']),                     description: 'Convocar reunions amb propòsit clar, agenda, output esperat.' }),
    Object.freeze({ id: 'cop-stewardship',          label: 'Custòdia de CoP',             domain: 'community',  tier: 'practitioner', guardianAffinity: Object.freeze(['hestia']),             relatedPractices: Object.freeze(['empoderar-mutuamente']),                     description: 'Mantenir vives les Comunitats de Pràctica del projecte.' }),
    Object.freeze({ id: 'conflict-prevention',      label: 'Prevenció de conflictes',     domain: 'community',  tier: 'practitioner', guardianAffinity: Object.freeze(['hera', 'hestia']),     relatedPractices: Object.freeze(['netiqueta-estricta']),                       description: 'Detectar tensions abans que s\'escalin · cultura del cuidado.' }),
    Object.freeze({ id: 'relational-intelligence',  label: 'Intel·ligència relacional',   domain: 'community',  tier: 'master',       guardianAffinity: Object.freeze(['hermes', 'hestia']),  relatedPractices: Object.freeze(['empoderar-mutuamente']),                     description: 'Llegir dinàmiques no-explícites de l\'equip i intervenir amb cura.' }),

    // ─── legal · 6 ─────────────────────────────────────────────────
    Object.freeze({ id: 'pact-design',              label: 'Disseny de pactes',           domain: 'legal',      tier: 'master',       guardianAffinity: Object.freeze(['hera']),               relatedPractices: Object.freeze(['netiqueta-estricta']),                       description: 'Articular pactes de socis dinàmics amb cláusules vivents.' }),
    Object.freeze({ id: 'compliance-cooperative',   label: 'Compliance cooperatiu',       domain: 'legal',      tier: 'practitioner', guardianAffinity: Object.freeze(['hera', 'atenea']),     relatedPractices: Object.freeze(['netiqueta-estricta']),                       description: 'Verificar que el projecte compleix la normativa cooperativa aplicable.' }),
    Object.freeze({ id: 'privacy-governance',       label: 'Privacitat & dades',          domain: 'legal',      tier: 'practitioner', guardianAffinity: Object.freeze(['hera']),               relatedPractices: Object.freeze(['netiqueta-estricta']),                       description: 'Garantir que les dades es tracten segons GDPR i principis ètics.' }),
    Object.freeze({ id: 'regulatory-tracking',      label: 'Seguiment regulatori',        domain: 'legal',      tier: 'foundation',   guardianAffinity: Object.freeze(['hera']),               relatedPractices: Object.freeze(['netiqueta-estricta']),                       description: 'Monitoritzar canvis normatius rellevants al sector del projecte.' }),
    Object.freeze({ id: 'contract-drafting',        label: 'Redacció de contractes',      domain: 'legal',      tier: 'practitioner', guardianAffinity: Object.freeze(['hera']),               relatedPractices: Object.freeze(['netiqueta-estricta']),                       description: 'Redactar contractes legals tradicionals quan són necessaris.' }),
    Object.freeze({ id: 'arbitration',              label: 'Arbitratge',                  domain: 'legal',      tier: 'master',       guardianAffinity: Object.freeze(['hera', 'atenea']),     relatedPractices: Object.freeze(['netiqueta-estricta']),                       description: 'Mediar disputes legals abans que vagin a tribunal.' }),

    // ─── ecology · 8 ───────────────────────────────────────────────
    Object.freeze({ id: 'regenerative-agriculture', label: 'Agricultura regenerativa',    domain: 'ecology',    tier: 'master',       guardianAffinity: Object.freeze(['demeter']),            relatedPractices: Object.freeze(['ecosistema']),                               description: 'Pràctiques agrícoles que regeneren sòl + biodiversitat.' }),
    Object.freeze({ id: 'ecosystem-monitoring',     label: 'Monitorització d\'ecosistemes',domain: 'ecology',   tier: 'practitioner', guardianAffinity: Object.freeze(['demeter']),            relatedPractices: Object.freeze(['ecosistema']),                               description: 'Registrar mètriques de salut d\'un ecosistema al llarg del temps.' }),
    Object.freeze({ id: 'circular-economy-design', label: 'Disseny d\'economia circular',  domain: 'ecology',    tier: 'master',       guardianAffinity: Object.freeze(['demeter', 'poseidon']),relatedPractices: Object.freeze(['ecosistema']),                               description: 'Tancar bucles materials · reduir entrada/sortida lineal.' }),
    Object.freeze({ id: 'biodiversity-stewardship', label: 'Custòdia de biodiversitat',   domain: 'ecology',    tier: 'practitioner', guardianAffinity: Object.freeze(['demeter']),            relatedPractices: Object.freeze(['ecosistema']),                               description: 'Protegir i restaurar diversitat biològica del territori.' }),
    Object.freeze({ id: 'carbon-accounting',        label: 'Comptabilitat de carboni',    domain: 'ecology',    tier: 'practitioner', guardianAffinity: Object.freeze(['demeter', 'poseidon']),relatedPractices: Object.freeze(['flujo-valor']),                              description: 'Mesurar la petjada de carboni del projecte · scope 1-3.' }),
    Object.freeze({ id: 'food-systems',             label: 'Sistemes alimentaris',         domain: 'ecology',    tier: 'practitioner', guardianAffinity: Object.freeze(['demeter', 'hestia']),  relatedPractices: Object.freeze(['ecosistema']),                               description: 'Dissenyar cadenes curtes d\'aliment local · de la llavor al plat.' }),
    Object.freeze({ id: 'energy-transition',        label: 'Transició energètica',        domain: 'ecology',    tier: 'practitioner', guardianAffinity: Object.freeze(['demeter']),            relatedPractices: Object.freeze(['ecosistema']),                               description: 'Reducció de consum + generació renovable cooperativa.' }),
    Object.freeze({ id: 'seed-banking',             label: 'Banc de llavors',              domain: 'ecology',    tier: 'foundation',   guardianAffinity: Object.freeze(['demeter']),            relatedPractices: Object.freeze(['ecosistema']),                               description: 'Conservar varietats locals i tradicionals davant l\'erosió genètica.' }),

    // ─── education · 8 ─────────────────────────────────────────────
    Object.freeze({ id: 'curriculum-design',        label: 'Disseny de curriculum',       domain: 'education',  tier: 'master',       guardianAffinity: Object.freeze(['apolo', 'hebe']),      relatedPractices: Object.freeze(['empoderar-mutuamente']),                     description: 'Construir el currículum formatiu de la cohort 0 / d\'un projecte.' }),
    Object.freeze({ id: 'pedagogy-cooperativa',     label: 'Pedagogia cooperativa',       domain: 'education',  tier: 'practitioner', guardianAffinity: Object.freeze(['apolo']),              relatedPractices: Object.freeze(['empoderar-mutuamente']),                     description: 'Aplicar pedagogies horitzontals i actives en formació adulta.' }),
    Object.freeze({ id: 'mentoring-junior',         label: 'Mentoring junior',            domain: 'education',  tier: 'practitioner', guardianAffinity: Object.freeze(['hebe']),               relatedPractices: Object.freeze(['empoderar-mutuamente']),                     description: 'Acompanyar trajectòries de plaçes en formació · senior bottom-up.' }),
    Object.freeze({ id: 'cop-facilitation',         label: 'Facilitació de CoP',          domain: 'education',  tier: 'practitioner', guardianAffinity: Object.freeze(['apolo', 'hestia']),    relatedPractices: Object.freeze(['empoderar-mutuamente']),                     description: 'Conduir Comunitats de Pràctica per a aprenentatge col·lectiu.' }),
    Object.freeze({ id: 'formative-assessment',     label: 'Avaluació formativa',         domain: 'education',  tier: 'practitioner', guardianAffinity: Object.freeze(['apolo']),              relatedPractices: Object.freeze(['reconocer-competencias']),                   description: 'Dissenyar avaluacions que serveixen per aprendre, no per filtrar.' }),
    Object.freeze({ id: 'learning-design',          label: 'Disseny d\'aprenentatge',     domain: 'education',  tier: 'practitioner', guardianAffinity: Object.freeze(['apolo']),              relatedPractices: Object.freeze(['empoderar-mutuamente']),                     description: 'Crear experiències formatives mesurables i replicables.' }),
    Object.freeze({ id: 'knowledge-translation',    label: 'Traducció de coneixement',    domain: 'education',  tier: 'practitioner', guardianAffinity: Object.freeze(['apolo', 'hermes']),    relatedPractices: Object.freeze(['voz-alta']),                                  description: 'Adaptar coneixement expert a audiències no-expertes.' }),
    Object.freeze({ id: 'multi-loop-learning',      label: 'Aprenentatge triple-loop',    domain: 'education',  tier: 'master',       guardianAffinity: Object.freeze(['apolo']),              relatedPractices: Object.freeze(['empoderar-mutuamente']),                     description: 'Aprendre · aprendre a aprendre · aprendre sobre com aprenem (Pantheon Work pàg. 9).' }),

    // ─── culture · 7 ──────────────────────────────────────────────
    Object.freeze({ id: 'ritual-design',            label: 'Disseny de ritual',           domain: 'culture',    tier: 'master',       guardianAffinity: Object.freeze(['dionisio', 'hestia']), relatedPractices: Object.freeze(['memes-campanas']),                            description: 'Crear rituals interns que sostenen identitat col·lectiva.' }),
    Object.freeze({ id: 'storytelling',             label: 'Storytelling',                domain: 'culture',    tier: 'practitioner', guardianAffinity: Object.freeze(['afrodita', 'dionisio']),relatedPractices: Object.freeze(['memes-campanas']),                          description: 'Construir relats que revelen el sentit del projecte.' }),
    Object.freeze({ id: 'chronicle-keeping',        label: 'Cronista',                    domain: 'culture',    tier: 'practitioner', guardianAffinity: Object.freeze(['dionisio']),           relatedPractices: Object.freeze(['voz-alta']),                                  description: 'Documentar la història viva del projecte · arxiu fundacional.' }),
    Object.freeze({ id: 'archetypal-imagination',   label: 'Imaginació arquetípica',      domain: 'culture',    tier: 'master',       guardianAffinity: Object.freeze(['dionisio']),           relatedPractices: Object.freeze(['memes-campanas']),                            description: 'Treballar amb símbols i arquetips per a transformació col·lectiva.' }),
    Object.freeze({ id: 'celebration-curation',     label: 'Curadoria de celebració',     domain: 'culture',    tier: 'foundation',   guardianAffinity: Object.freeze(['dionisio']),           relatedPractices: Object.freeze(['memes-campanas']),                            description: 'Organitzar fites i festes que sostenen cohesió de l\'equip.' }),
    Object.freeze({ id: 'manifesto-stewardship',    label: 'Custòdia del manifest',       domain: 'culture',    tier: 'practitioner', guardianAffinity: Object.freeze(['zeus', 'dionisio']),   relatedPractices: Object.freeze(['memes-campanas']),                            description: 'Mantenir viu el manifest fundacional i evolucionar-lo amb cura.' }),
    Object.freeze({ id: 'transition-rites',         label: 'Ritus de transició',          domain: 'culture',    tier: 'master',       guardianAffinity: Object.freeze(['dionisio', 'hestia']), relatedPractices: Object.freeze(['memes-campanas']),                            description: 'Dissenyar ritus que marquen pas de fase (entrada · sortida · canvi de rol).' }),
]);

// ── Helpers puros ────────────────────────────────────────────────────

export function getSkillById(id) {
    if (typeof id !== 'string' || !id) return null;
    return SKILL_TAXONOMY.find(s => s.id === id) || null;
}

export function listSkills() { return SKILL_TAXONOMY.slice(); }

export function skillsByDomain(domain) {
    if (typeof domain !== 'string' || !domain) return [];
    return SKILL_TAXONOMY.filter(s => s.domain === domain);
}

export function skillsByTier(tier) {
    if (!SKILL_TIERS.includes(tier)) return [];
    return SKILL_TAXONOMY.filter(s => s.tier === tier);
}

export function skillsByGuardian(guardianId) {
    if (typeof guardianId !== 'string' || !guardianId) return [];
    return SKILL_TAXONOMY.filter(s => Array.isArray(s.guardianAffinity) && s.guardianAffinity.includes(guardianId));
}

export function skillsByPractice(practiceId) {
    if (typeof practiceId !== 'string' || !practiceId) return [];
    return SKILL_TAXONOMY.filter(s => Array.isArray(s.relatedPractices) && s.relatedPractices.includes(practiceId));
}

// ── coverageReport · evalúa cobertura del enjambre ──────────────────
//
// Input · `swarmSkills` array de { skillId, seatId?, tier? } donde
// `tier` es opcional (foundation/practitioner/master). Si no se pasa
// asume `practitioner`.
//
// Output · {
//     totalSkills:       90,
//     coveredCount:      X,
//     coveragePct:       0..100,
//     gaps:              [skillId, ...]    // skills sin ninguna plaza
//     resilient:         [skillId, ...]    // skills con ≥3 plazas que la dominan
//     fragile:           [skillId, ...]    // skills con 1 sola plaza
//     byDomain:          { domain: { total, covered, gaps[], pct } }
//     byTier:            { tier: { total, covered, pct } }
//     byGuardian:        { guardianId: { total, covered, pct } }
// }
export function coverageReport({ swarmSkills = [] } = {}) {
    const counts = new Map();
    for (const entry of (Array.isArray(swarmSkills) ? swarmSkills : [])) {
        if (!entry || typeof entry.skillId !== 'string') continue;
        if (!getSkillById(entry.skillId)) continue;
        counts.set(entry.skillId, (counts.get(entry.skillId) || 0) + 1);
    }

    const total = SKILL_TAXONOMY.length;
    const covered = SKILL_TAXONOMY.filter(s => (counts.get(s.id) || 0) >= 1);
    const gaps = SKILL_TAXONOMY.filter(s => (counts.get(s.id) || 0) === 0).map(s => s.id);
    const resilient = SKILL_TAXONOMY.filter(s => (counts.get(s.id) || 0) >= 3).map(s => s.id);
    const fragile = SKILL_TAXONOMY.filter(s => (counts.get(s.id) || 0) === 1).map(s => s.id);
    const coveragePct = total === 0 ? 0 : Math.round((covered.length / total) * 100);

    // by domain
    const byDomain = {};
    const domains = Array.from(new Set(SKILL_TAXONOMY.map(s => s.domain)));
    for (const d of domains) {
        const skillsOfDomain = SKILL_TAXONOMY.filter(s => s.domain === d);
        const cov = skillsOfDomain.filter(s => (counts.get(s.id) || 0) >= 1);
        byDomain[d] = {
            total:   skillsOfDomain.length,
            covered: cov.length,
            gaps:    skillsOfDomain.filter(s => (counts.get(s.id) || 0) === 0).map(s => s.id),
            pct:     skillsOfDomain.length === 0 ? 0 : Math.round((cov.length / skillsOfDomain.length) * 100),
        };
    }

    // by tier
    const byTier = {};
    for (const t of SKILL_TIERS) {
        const skillsOfTier = SKILL_TAXONOMY.filter(s => s.tier === t);
        const cov = skillsOfTier.filter(s => (counts.get(s.id) || 0) >= 1);
        byTier[t] = {
            total:   skillsOfTier.length,
            covered: cov.length,
            pct:     skillsOfTier.length === 0 ? 0 : Math.round((cov.length / skillsOfTier.length) * 100),
        };
    }

    // by guardian
    const byGuardian = {};
    const allGuardianIds = Array.from(new Set(SKILL_TAXONOMY.flatMap(s => s.guardianAffinity || [])));
    for (const gId of allGuardianIds) {
        const skillsOfG = SKILL_TAXONOMY.filter(s => (s.guardianAffinity || []).includes(gId));
        const cov = skillsOfG.filter(s => (counts.get(s.id) || 0) >= 1);
        byGuardian[gId] = {
            total:   skillsOfG.length,
            covered: cov.length,
            pct:     skillsOfG.length === 0 ? 0 : Math.round((cov.length / skillsOfG.length) * 100),
        };
    }

    return {
        totalSkills:  total,
        coveredCount: covered.length,
        coveragePct,
        gaps,
        resilient,
        fragile,
        byDomain,
        byTier,
        byGuardian,
    };
}
