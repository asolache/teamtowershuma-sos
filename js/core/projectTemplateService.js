// =============================================================================
// TEAMTOWERS SOS V11 — PROJECT TEMPLATE SERVICE (C2-TEMPLATES-001 sprint A)
// Ruta · /js/core/projectTemplateService.js
//
// 15 plantilles · 5 simplified types × 3 stage groups. Decisió @alvaro ·
// "KISS sense perdre qualitat · el que m'interessa és que identifiquis el
// flux de valor crític segons fase del projecte i que tant rols com
// entregables com SOPs quedin perfectament definits".
//
// Cada plantilla defineix · roleSuggestions · transactionPatterns ·
// canvasFocus · pitchTone · sopFocus · valueFlowEmphasis. Quan B-UNIFIED-
// FORM-001 crea un projecte · cerca la plantilla per (type, stage), genera
// IA-driven drafts adaptats.
//
// Pure · zero KB · zero DOM.
// =============================================================================

import { PROJECT_TYPES } from './critical108Roles.js';
import { BUSINESS_MATURITY_STAGES } from './projectClassifierService.js';

export const TEMPLATE_VERSION = 'v1.0';

// 5 simplified type groups (mapejats des dels 12 PROJECT_TYPES) ·
// la classificació detallada serveix per a UI · les plantilles agrupen
// per affinitat operativa per evitar 12×6 = 72 plantilles (KISS).

export const SIMPLIFIED_TYPES = Object.freeze({
    'coop': {
        label: 'Cooperativa / multi-stakeholder',
        sourceTypes: ['cooperativa-multi', 'cooperativa-cures', 'startup-coop-tradicional', 'empresa-en-transicio'],
        valueLens: 'Stakeholders múltiples · governança policèntrica · slicing pie',
    },
    'platform': {
        label: 'Plataforma / DAO digital',
        sourceTypes: ['plataforma-cooperativa', 'dao-web3'],
        valueLens: 'Network effects · 2-sided market · token incentives',
    },
    'service': {
        label: 'Servei / consultoria local',
        sourceTypes: ['espai-autogestionat', 'familiar-relevo'],
        valueLens: 'Relació humana · proximitat · qualitat artesana',
    },
    'commons': {
        label: 'Commons / comunitat',
        sourceTypes: ['comunitat-autosuficient', 'fundacio-ong', 'ecosistema-regional'],
        valueLens: 'Bé comú · gestió compartida de recursos · sostenibilitat',
    },
    'transition-hub': {
        label: 'Hub transició sectorial',
        sourceTypes: ['hub-transicio'],
        valueLens: 'Catalitzador d\'ecosistema · capacity building · learn loops',
    },
});

// 3 stage groups (mapejats des de BUSINESS_MATURITY_STAGES)
export const STAGE_GROUPS = Object.freeze({
    'early': {
        label: 'Idea · MVP · Pilot (exploració)',
        sourceStages: ['idea', 'mvp', 'pilot'],
        focus: 'validar hipòtesis · primer fit · primer cohort',
    },
    'scaling': {
        label: 'Growth · escalat',
        sourceStages: ['growth'],
        focus: 'sistemes operatius repetibles · tracció mesurable · estructura',
    },
    'consolidated': {
        label: 'Maturity · Wind-down (legacy)',
        sourceStages: ['maturity', 'wind-down'],
        focus: 'optimitzar · transferir coneixement · governança madura',
    },
});

// helpers · type/stage normalization
export function simplifyType(type) {
    for (const [key, def] of Object.entries(SIMPLIFIED_TYPES)) {
        if (def.sourceTypes.includes(type)) return key;
    }
    return 'service';
}
export function simplifyStage(stage) {
    for (const [key, def] of Object.entries(STAGE_GROUPS)) {
        if (def.sourceStages.includes(stage)) return key;
    }
    return 'early';
}

// ── 15 plantilles · 5 types × 3 stages ─────────────────────────────────

export const PROJECT_TEMPLATES = Object.freeze({
    'coop:early': {
        canvasFocus: 'Definir els valors fundacionals · qui són els socis · per què cooperativa i no SL · primer mapa de valor amb 5-7 rols founder',
        pitchTone: 'Visió clara + humil + admetem hipòtesis · "construïm un model alternatiu"',
        valueFlowEmphasis: 'flux founder→cohort · transparència radical des del dia 1',
        roleSuggestions: [
            'Soci fundador · ownership ètica',
            'Coordinador operatiu · primer membre treballador',
            'Mentor extern · acompanya governança',
        ],
        transactionPatterns: [
            { from: 'fundadors', to: 'mentor', kind: 'intangible', label: 'busca de feedback estratègic' },
            { from: 'fundadors', to: 'cohort-inicial', kind: 'tangible', label: 'onboarding + primers serveis' },
            { from: 'cohort', to: 'fundadors', kind: 'intangible', label: 'validació real de l\'oferta' },
        ],
        sopFocus: ['onboarding-soci-treballador', 'pact-fundador', 'assemblea-mensual'],
        critical_kpis: ['Cohort 0 reclutat (N socis)', 'NPS cohort > 50', 'Cash runway ≥ 6 mesos'],
    },
    'coop:scaling': {
        canvasFocus: 'Escalat sense perdre principis coop · governança policèntrica · estructura de 3 cercles (operatiu/táctic/estratègic)',
        pitchTone: 'Tracció demostrable · números cooperatius (sharePct allocated · NPS · retention)',
        valueFlowEmphasis: 'flux producció→client establert · noves cohorts entrants amb onboarding repetible',
        roleSuggestions: [
            'Cercle estratègic (3-5 socis)',
            'Coordinador cercle operatiu',
            'Mentor cohort N+1',
            'Tresorer cooperatiu',
        ],
        transactionPatterns: [
            { from: 'cercle-operatiu', to: 'cercle-estratègic', kind: 'tangible', label: 'reports mensuals' },
            { from: 'cohort-N', to: 'cohort-N+1', kind: 'intangible', label: 'mentoria peer-to-peer' },
        ],
        sopFocus: ['decisió-policéntrica', 'audit-trimestral', 'onboarding-cohort-N+1'],
        critical_kpis: ['Cohorts vives (N)', 'Profit margin · sostenible', 'Cohort retention'],
    },
    'coop:consolidated': {
        canvasFocus: 'Transmissió generacional · documentar el que funciona · obrir el codi/SOP a altres coops',
        pitchTone: 'Rendibilitat sostinguda · ja no demanem inversió · oferim mentoring',
        valueFlowEmphasis: 'flux exterior · ensenyar a noves coops sorgents · marketplace de SOPs',
        roleSuggestions: ['Cap cooperativa madura', 'Mentor inter-coop', 'Custodi del patrimoni'],
        transactionPatterns: [
            { from: 'coop-madura', to: 'coop-emergent', kind: 'tangible', label: 'mentoring pagat · SOP/training' },
        ],
        sopFocus: ['transferència-coneixement', 'mentoring-extern'],
        critical_kpis: ['SOPs publicats al permaweb', 'Coops mentoritzades', 'Operació predictible (CV < 15%)'],
    },

    'platform:early': {
        canvasFocus: 'MVP digital · 2-sided market · primer pilot tancat amb 10-50 early adopters',
        pitchTone: 'Demo tècnica · primers users delitats · runway curt',
        valueFlowEmphasis: 'flux supply ↔ demand · network effects encara febles · token incentives stub',
        roleSuggestions: ['CTO · arquitecte plataforma', 'Comunity builder · supply onboarding', 'Pilot user advocate'],
        transactionPatterns: [
            { from: 'plataforma', to: 'supply', kind: 'tangible', label: 'eines + visibilitat' },
            { from: 'demand', to: 'plataforma', kind: 'tangible', label: 'fees + dades anonimitzades' },
        ],
        sopFocus: ['onboard-supplier', 'onboard-buyer', 'pricing-pilot'],
        critical_kpis: ['Active supply (N)', 'Active demand (N)', 'Match rate · setmana'],
    },
    'platform:scaling': {
        canvasFocus: 'Network effects amplifyats · tokenomics actiu · governança token-holder',
        pitchTone: 'Tracció · GMV · take rate · K-factor viral · arquitectura escalable',
        valueFlowEmphasis: 'flux exponencial · supply+demand creixen mútuament · token incentives operatius',
        roleSuggestions: ['Head of supply ops', 'Head of demand ops', 'Tokenomics designer', 'DAO facilitator'],
        transactionPatterns: [
            { from: 'plataforma', to: 'token-holders', kind: 'tangible', label: 'distribució rewards governance' },
        ],
        sopFocus: ['tokenomics-quarterly-review', 'dao-vote', 'scale-supply'],
        critical_kpis: ['GMV mensual', 'Take rate', 'Active token holders', 'Vote participation'],
    },
    'platform:consolidated': {
        canvasFocus: 'Plataforma matriu · genera spin-offs · ecosistema',
        pitchTone: 'Profitable · self-sustaining · genera grants · ecosistema viu',
        valueFlowEmphasis: 'flux de plataforma a spin-offs · grants programs · community treasury',
        roleSuggestions: ['Ecosystem lead', 'Grant program manager', 'Spin-off accelerator'],
        transactionPatterns: [
            { from: 'plataforma-matriu', to: 'spin-offs', kind: 'tangible', label: 'grants + mentoring' },
        ],
        sopFocus: ['grant-program', 'spin-off-launch'],
        critical_kpis: ['Spin-offs actius', 'Grants distribuïts', 'Treasury sostenible'],
    },

    'service:early': {
        canvasFocus: 'Primer client de confiança · refinant el servei · proximitat humana',
        pitchTone: 'Personalitzat · testimoni del primer client · "art" del servei',
        valueFlowEmphasis: 'flux proximitat · feedback iteratiu · qualitat artesana',
        roleSuggestions: ['Proveïdor de servei principal', 'Primer client de confiança'],
        transactionPatterns: [
            { from: 'proveïdor', to: 'client', kind: 'tangible', label: 'servei lliurat' },
            { from: 'client', to: 'proveïdor', kind: 'intangible', label: 'feedback + testimonis' },
        ],
        sopFocus: ['onboard-client', 'lliurar-servei', 'feedback-loop'],
        critical_kpis: ['Primer client (sí/no)', 'NPS', 'Repetició'],
    },
    'service:scaling': {
        canvasFocus: 'Repetibilitat sense perdre qualitat · SOPs detallats · primer equip',
        pitchTone: 'Casos d\'èxit · margin per servei · contractació plan',
        valueFlowEmphasis: 'flux d\'expansió per qualitat · word-of-mouth · referrals',
        roleSuggestions: ['Coordinador d\'equip', 'Especialistes per àrea', 'Client success'],
        transactionPatterns: [
            { from: 'coordinador', to: 'especialistes', kind: 'intangible', label: 'directrius + supervisió' },
        ],
        sopFocus: ['quality-check', 'handover-client'],
        critical_kpis: ['Clients mensuals', 'Margen per servei', 'NPS sostingut'],
    },
    'service:consolidated': {
        canvasFocus: 'Servei boutique establert · transmissió a successors · marca personal',
        pitchTone: 'Reputació · selecció de clients · preu premium',
        valueFlowEmphasis: 'flux selectiu · qualitat per damunt de volum',
        roleSuggestions: ['Mentor del servei (founder)', 'Successors entrenats'],
        transactionPatterns: [],
        sopFocus: ['successor-training', 'brand-stewardship'],
        critical_kpis: ['Reputació index', 'Clients premium', 'Successió plan'],
    },

    'commons:early': {
        canvasFocus: 'Definir el bé comú · qui pot accedir · regles de gestió compartida (Ostrom)',
        pitchTone: 'Missió + comunitat + sostenibilitat · evitem privatització',
        valueFlowEmphasis: 'flux entre comunitat i recurs · contribució-extracció equilibrada',
        roleSuggestions: ['Steward del commons', 'Comunitat usuària', 'Validadors externs'],
        transactionPatterns: [
            { from: 'comunitat', to: 'commons', kind: 'intangible', label: 'contribució + cura' },
            { from: 'commons', to: 'comunitat', kind: 'tangible', label: 'accés + serveis' },
        ],
        sopFocus: ['define-rules-ostrom', 'monitor-extraction'],
        critical_kpis: ['Membres comunitat', 'Cycle extraction-contribution', 'Health del recurs'],
    },
    'commons:scaling': {
        canvasFocus: 'Multiplicació de nodes · federació · evitació de tragedy-of-commons',
        pitchTone: 'Múltiples comunitats · governança federada · resiliència',
        valueFlowEmphasis: 'flux entre nodes federats · standardització + autonomia',
        roleSuggestions: ['Federation coordinator', 'Node stewards (N)'],
        transactionPatterns: [
            { from: 'node', to: 'federation', kind: 'tangible', label: 'reports + contribució monetary' },
        ],
        sopFocus: ['federation-charter', 'cross-node-coordination'],
        critical_kpis: ['Nodes federats', 'Pacte federació signat', 'Sostenibilitat agregada'],
    },
    'commons:consolidated': {
        canvasFocus: 'Commons institucionalitzat · resistència legal i operativa',
        pitchTone: 'Influència regulatoria · models replicats · llegacy',
        valueFlowEmphasis: 'flux d\'influència · advocacy · documentation',
        roleSuggestions: ['Custodi institucional', 'Legal advocate', 'Documentador històric'],
        transactionPatterns: [],
        sopFocus: ['legal-charter-update', 'documentation-archive'],
        critical_kpis: ['Models replicats globalment', 'Influència regulatòria'],
    },

    'transition-hub:early': {
        canvasFocus: 'Identificar el sector i la xarxa d\'actors · mapping the territory',
        pitchTone: 'Funcionem com a catalitzador · no fem el seu treball · els ajudem a fer-lo',
        valueFlowEmphasis: 'flux d\'aprenentatge · primer cohort sectorial',
        roleSuggestions: ['Coordinador hub', 'Actors del sector', 'Mentors externs'],
        transactionPatterns: [
            { from: 'hub', to: 'actors', kind: 'intangible', label: 'metodologia + connexions' },
        ],
        sopFocus: ['sector-mapping', 'cohort-curation'],
        critical_kpis: ['Actors identificats', 'Cohort sectorial reclutat'],
    },
    'transition-hub:scaling': {
        canvasFocus: 'Replicabilitat · franquícia social · learn loops entre hubs',
        pitchTone: 'Hubs múltiples · evidència sectorial · transformació mesurable',
        valueFlowEmphasis: 'flux peer-learning entre hubs · estandardització metodològica',
        roleSuggestions: ['Hub network coordinator', 'Curriculum designer'],
        transactionPatterns: [
            { from: 'hub-A', to: 'hub-B', kind: 'intangible', label: 'best practices' },
        ],
        sopFocus: ['hub-launch-protocol', 'curriculum-iteration'],
        critical_kpis: ['Hubs operatius', 'Cohorts graduades', 'Indicadors sectorials'],
    },
    'transition-hub:consolidated': {
        canvasFocus: 'Influència sistèmica · policy advocacy · institutional change',
        pitchTone: 'Hem canviat el sector · ara polices · institucionalització',
        valueFlowEmphasis: 'flux d\'incidència · advocacy · capacity building intergeneracional',
        roleSuggestions: ['Policy advocate', 'Institutional liaison', 'Successor curators'],
        transactionPatterns: [],
        sopFocus: ['policy-engagement', 'institutional-legacy'],
        critical_kpis: ['Polices modificades', 'Institucionalitzacions'],
    },
});

// ── Lookups ────────────────────────────────────────────────────────────

// getTemplate · pure · per a (project_type, lifecycle_stage) retorna la
// plantilla adequada. Si no exacte · fallback al més pròxim.
export function getTemplate({ projectType, lifecycleStage } = {}) {
    const t = simplifyType(projectType);
    const s = simplifyStage(lifecycleStage);
    const key = t + ':' + s;
    if (PROJECT_TEMPLATES[key]) return { key, ...PROJECT_TEMPLATES[key] };
    // Fallback to early stage of detected type
    return { key: t + ':early', ...PROJECT_TEMPLATES[t + ':early'] };
}

// listTemplates · pure · per a UI · llista totes les 15
export function listTemplates() {
    return Object.entries(PROJECT_TEMPLATES).map(([key, tpl]) => {
        const [type, stage] = key.split(':');
        return {
            key, type, stage,
            label: SIMPLIFIED_TYPES[type].label + ' · ' + STAGE_GROUPS[stage].label,
            ...tpl,
        };
    });
}

// ── Prompt builders · per a B-UNIFIED-FORM-001 ────────────────────────

// buildTemplateAwarePrompt · pure · enriqueix un prompt base amb context
// de plantilla. Usat per al unified form quan crea un projecte.
//
// args ·
//   templateKey · 'coop:early' · etc
//   stepKind · 'canvas' | 'vna' | 'pitch' | 'sop' | 'kpi'
//   projectName, projectDescription, sectorContext
//
// Retorna · prompt string optimitzat amb signals de la plantilla.
export function buildTemplateAwarePrompt({
    templateKey,
    stepKind,
    projectName = '',
    projectDescription = '',
    sectorContext = null,
} = {}) {
    const tpl = PROJECT_TEMPLATES[templateKey];
    if (!tpl) throw new Error('buildTemplateAwarePrompt · template not found · ' + templateKey);
    const [type, stage] = templateKey.split(':');
    const typeDef = SIMPLIFIED_TYPES[type];
    const stageDef = STAGE_GROUPS[stage];

    const baseSignals = [
        'PLANTILLA SOS · ' + typeDef.label + ' · fase ' + stageDef.label,
        'value lens · ' + typeDef.valueLens,
        'stage focus · ' + stageDef.focus,
    ].join('\n');

    const stepGuidance = (() => {
        switch (stepKind) {
            case 'canvas':
                return 'CANVAS FOCUS · ' + tpl.canvasFocus;
            case 'vna':
                return 'VNA emphasis · ' + tpl.valueFlowEmphasis +
                    '\nRoles suggerits ·\n' + tpl.roleSuggestions.map(r => '  - ' + r).join('\n') +
                    '\nTransactions patterns ·\n' + (tpl.transactionPatterns || []).map(p =>
                        `  - ${p.from} → ${p.to} · ${p.kind} · ${p.label}`
                    ).join('\n');
            case 'pitch':
                return 'PITCH TONE · ' + tpl.pitchTone +
                    '\nKPIs crítiques ·\n' + (tpl.critical_kpis || []).map(k => '  - ' + k).join('\n');
            case 'sop':
                return 'SOPs prioritaris ·\n' + (tpl.sopFocus || []).map(s => '  - ' + s).join('\n');
            case 'kpi':
                return 'KPIs crítiques per a aquesta fase ·\n' + (tpl.critical_kpis || []).map(k => '  - ' + k).join('\n');
            default:
                return '';
        }
    })();

    return [
        baseSignals,
        '',
        'PROJECTE ·',
        '- Nom · ' + projectName,
        '- Descripció · ' + (projectDescription || '(sense)'),
        sectorContext ? '- Sector · ' + sectorContext : '',
        '',
        stepGuidance,
    ].filter(Boolean).join('\n');
}

// listSimplifiedTypes · UI helper
export function listSimplifiedTypes() {
    return Object.entries(SIMPLIFIED_TYPES).map(([key, def]) => ({ key, ...def }));
}
export function listStageGroups() {
    return Object.entries(STAGE_GROUPS).map(([key, def]) => ({ key, ...def }));
}
