// =============================================================================
// TEAMTOWERS SOS V11 — KNOWLEDGE ROADMAPS BY ROLE (LEARN-HUB-001)
// Ruta · /js/core/knowledgeRoadmaps.js
//
// Roadmaps de lectura per a cada rol canònic SOS. Cada roadmap és una
// seqüència ordenada de lectures del knowledge/. Completar el roadmap →
// l'usuari pot ser marcat com 'practitioner' a aquest rol (futur ·
// integració amb skillTaxonomy + profile360).
//
// Pure · zero deps · safe Node + browser.
// =============================================================================

export const ROADMAPS_VERSION = 'v1.0';

// Cada roadmap · { roleName, description, readings: [{ step, title, path, why }] }
// path · relpath dins knowledge/ (sense prefix · ex. 'vision/sop-to-wo-model.md')
export const ROADMAPS_BY_ROLE = Object.freeze({

    visioner: {
        roleName: 'Visioner · Cap de Colla',
        description: 'Defineix direcció estratègica · prioritats absolutes · veu macroscòpica del projecte SOS',
        readings: [
            { step: 1, title: 'VNA principis (Verna Allee)',     path: 'vision/vna-principles.md',              why: 'Marc teòric base · sense això · qualsevol decisió estratègica és cega' },
            { step: 2, title: 'Cadena VNA→SOC→SOP→WO→Ledger',     path: 'vision/sop-to-wo-model.md',             why: 'Contracte canònic · com el coneixement es transforma en treball' },
            { step: 3, title: 'Arquitectura Mind-as-Graph',       path: 'vision/mind-architecture.md',           why: 'Com pensar amb el sistema · paral·lelisme · context-first' },
            { step: 4, title: 'Evolució sector → client',          path: 'vision/h110-sector-evolution-and-mind-graph.md', why: 'Visió completa de la cadena Antigravity aplicada a clients' },
            { step: 5, title: 'SOC TeamTowers brand',             path: 'socs/teamtowers-brand.md',              why: 'Marc cultural del moviment · valors castellers · 20+ anys' },
            { step: 6, title: 'SOC fase Scale del cicle',         path: 'socs/lifecycle/scale.md',               why: 'On vol arribar el projecte · 108+ ops · IA automatitza ≥50% WOs' },
        ],
    },

    architect: {
        roleName: 'Arquitecte · System Lead',
        description: 'Dissenya l\'arquitectura tècnica · KB · permaweb · IA · wallets · escalabilitat sense fricció',
        readings: [
            { step: 1, title: 'Cadena VNA→SOC→SOP→WO→Ledger',     path: 'vision/sop-to-wo-model.md',             why: 'Model canònic que ha d\'implementar tota arquitectura' },
            { step: 2, title: 'Mind-as-Graph arquitectura',       path: 'vision/mind-architecture.md',           why: 'Patró arquitectural del sistema · paral·lelisme · 1 nodes amb tags' },
            { step: 3, title: 'VNA principis (Verna Allee)',     path: 'vision/vna-principles.md',              why: 'Per què el model és aquest · trade-offs explicats' },
            { step: 4, title: 'H110 · Sector → Mind-Graph total', path: 'vision/h110-sector-evolution-and-mind-graph.md', why: 'Visió de grafs · clonació · evolució a SOPs/WOs · skill_nodes' },
            { step: 5, title: 'CoPs · Communities of Practice',   path: 'vision/communities-of-practice-model.md', why: 'Stub Ola 3 · com els agents IA es relacionen amb operadors humans' },
        ],
    },

    cohort_manager: {
        roleName: 'Cohort Manager · Matriuger',
        description: 'Gestiona el cicle de vida de la cohort · onboarding · pacts · membership · les 108 places',
        readings: [
            { step: 1, title: 'Cicle de vida fase Idea',          path: 'socs/lifecycle/idea.md',                why: 'Què pot esperar el nou operador al primer mes' },
            { step: 2, title: 'Cicle de vida fase MVP',           path: 'socs/lifecycle/mvp.md',                 why: 'Quan promocionar de "interessat" a "actiu"' },
            { step: 3, title: 'Cicle de vida fase Validation',    path: 'socs/lifecycle/validation.md',          why: 'Cohort estable · què validar abans d\'escalar' },
            { step: 4, title: 'SOC Fent Pinya · taller',          path: 'socs/fent-pinya.md',                    why: 'Activitat d\'onboarding comunitari · cohesió de cohort' },
            { step: 5, title: 'SOC La Colla · consultoria VNA',   path: 'socs/la-colla.md',                      why: 'Mètode aplicat al client · cohort ha d\'entendre el flow' },
            { step: 6, title: 'TeamTowers brand · marc cultural', path: 'socs/teamtowers-brand.md',              why: 'Valors castellers · per què aquesta cohort és diferent' },
        ],
    },

    sentinel: {
        roleName: 'Sentinel · Trust Auditor',
        description: 'Audita firmes ECDSA · verifica que els publishes al permaweb són legítims · detecta abusos',
        readings: [
            { step: 1, title: 'Cadena VNA→SOC→SOP→WO→Ledger',     path: 'vision/sop-to-wo-model.md',             why: 'Què cal verificar a cada capa per garantir integritat' },
            { step: 2, title: 'Mind-as-Graph · què signa cada node', path: 'vision/mind-architecture.md',        why: 'Cada node té possibles firmes · entendre el patró' },
            { step: 3, title: 'SOC fase Validation',              path: 'socs/lifecycle/validation.md',          why: 'Quan els errors de trust comencen a importar (>5 clients)' },
            { step: 4, title: 'SOC fase Scale',                   path: 'socs/lifecycle/scale.md',               why: 'Triple-entry accounting · permaweb federation · cross-SOS' },
        ],
    },

    curator: {
        roleName: 'Curator · Knowledge Base',
        description: 'Manté el corpus de coneixement universal SOS · sectors · SOPs · skills · workshops · taxonomies',
        readings: [
            { step: 1, title: 'Knowledge LOG · contracte IA-humà', path: '_LOG.md',                              why: 'Tota mutació de knowledge passa pel curator · contracte governance' },
            { step: 2, title: '_index.md · estructura del knowledge', path: '_index.md',                          why: 'Mapa complet de què hi ha al knowledge · 3 capes' },
            { step: 3, title: 'Convenció clients · estructura',    path: 'clients/_README.md',                    why: 'Com persistir el mind de cada client' },
            { step: 4, title: 'README socs · format de SOC',        path: 'socs/_README.md',                       why: 'Schema frontmatter SOC · per validar contribucions' },
            { step: 5, title: 'README sops · format de SOP',        path: 'sops/_README.md',                       why: 'Schema frontmatter SOP · per validar contribucions' },
            { step: 6, title: 'H110 · evolució sector → SOPs',     path: 'vision/h110-sector-evolution-and-mind-graph.md', why: 'Visió de creixement orgànic del knowledge' },
        ],
    },

    connector: {
        roleName: 'Connector · Network Weaver',
        description: 'Posa en contacte projectes de la xarxa · facilita transaccions entre operadors · activa CoPs',
        readings: [
            { step: 1, title: 'TeamTowers brand · proposta de valor', path: 'socs/teamtowers-brand.md',          why: 'Com vendre el moviment · valors · diferencial' },
            { step: 2, title: 'SOC La Colla · mètode estrella',    path: 'socs/la-colla.md',                      why: 'El servei consultor principal que es ven a clients' },
            { step: 3, title: 'SOC Fent Pinya · taller experiencial', path: 'socs/fent-pinya.md',                why: 'Servei viu · porta experiència emocional' },
            { step: 4, title: 'SOC proyecto-custom · adaptació',   path: 'socs/proyecto-custom.md',               why: 'Quan el client necessita una cosa mixta' },
            { step: 5, title: 'SOC charla conferencia',            path: 'socs/charla-conferencia.md',            why: 'Servei d\'entrada · charla pre-venda' },
            { step: 6, title: 'CoPs · model de comunitats',        path: 'vision/communities-of-practice-model.md', why: 'Com créixer la xarxa orgànicament' },
        ],
    },

    founder_anchor: {
        roleName: 'Founder Anchor',
        description: 'L\'humà que sosté la responsabilitat ètica + legal del SOS · mai delegable · activa propietat distribuïda',
        readings: [
            { step: 1, title: 'TeamTowers brand · llinatge fundacional', path: 'socs/teamtowers-brand.md',      why: 'Què representa SOS · per què aquesta responsabilitat' },
            { step: 2, title: 'VNA principis (Verna Allee)',     path: 'vision/vna-principles.md',              why: 'Mètode al qual et compromets · entendre limits' },
            { step: 3, title: 'Cadena VNA→SOC→SOP→WO→Ledger',     path: 'vision/sop-to-wo-model.md',             why: 'Què signes quan signes com a founder anchor' },
            { step: 4, title: 'Mind-as-Graph · que NO es delega', path: 'vision/mind-architecture.md',           why: 'Intangibles humans · presència · judici · decisió política' },
            { step: 5, title: 'SOC fase Scale · escala ètica',    path: 'socs/lifecycle/scale.md',               why: 'Què passa quan tot funciona · 108+ ops · responsabilitats' },
        ],
    },

    operations: {
        roleName: 'Operations · PM',
        description: 'Coordina l\'execució diària · prioritza · resol bloquejos · daily standup async',
        readings: [
            { step: 1, title: 'Cicle fase MVP · operativa diària', path: 'socs/lifecycle/mvp.md',                why: 'Fase on operations és més crítica · ritme alt' },
            { step: 2, title: 'Cicle fase Validation · mètriques', path: 'socs/lifecycle/validation.md',         why: 'Què mesurar · KPIs · retention' },
            { step: 3, title: 'Cadena VNA→SOC→SOP→WO→Ledger',     path: 'vision/sop-to-wo-model.md',             why: 'Com convertir SOPs en WOs executables · daily flow' },
        ],
    },

    creator: {
        roleName: 'Creator · Maker',
        description: 'Produeix els lliurables del projecte · feina pràctica · iteració',
        readings: [
            { step: 1, title: 'Cicle fase MVP · KISS sempre',     path: 'socs/lifecycle/mvp.md',                 why: 'Filosofia de creació · mínim viable real' },
            { step: 2, title: 'Cadena VNA→SOC→SOP→WO→Ledger',     path: 'vision/sop-to-wo-model.md',             why: 'On encaixes · què produeixes · com es valida' },
            { step: 3, title: 'Mind-as-Graph · context-first',    path: 'vision/mind-architecture.md',           why: 'Per què el context et permet fer més amb menys' },
        ],
    },

    reviewer: {
        roleName: 'Reviewer · QA',
        description: 'Valida la qualitat dels lliurables · audita resultats · feedback estructurat',
        readings: [
            { step: 1, title: 'Cadena VNA→SOC→SOP→WO→Ledger',     path: 'vision/sop-to-wo-model.md',             why: 'DTD · cada deliverable té un test · entendre el contracte' },
            { step: 2, title: 'Cicle fase Validation · mesurar',  path: 'socs/lifecycle/validation.md',          why: 'On la review és crítica · feedback per iteració' },
            { step: 3, title: 'VNA principis · què té valor',     path: 'vision/vna-principles.md',              why: 'Què revisar · tangible vs intangible · cap deliverable mort' },
        ],
    },

});
