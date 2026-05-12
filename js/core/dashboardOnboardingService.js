// =============================================================================
// TEAMTOWERS SOS V11 — DASHBOARD ONBOARDING SERVICE (PROJ-QUALITY-001 sprint D)
//
// Service pur · calcula l'estat dels 5 passos d'onboarding alfa de SOS:
//
//   1. 👤 Identitat   · té node `user_identity` o `matriu_member` amb DID
//   2. 🌐 Permaweb    · perfil publicat (té arweaveTxId no-mock o real)
//   3. 🚀 Projecte    · ha creat ≥1 projecte propi (no demo, no archivat)
//   4. 🗺 Value map   · ≥1 projecte amb valueMap dim ≥75
//   5. 🌟 Score 90+   · ≥1 projecte amb total quality ≥90
//
// Retorna un estat per pintar a la dashboard com a card guia, amb cta
// directa a la vista que desbloca cada pas. "Enseñar haciendo" inline.
// =============================================================================

export const ONBOARDING_STEPS = Object.freeze([
    Object.freeze({
        id: 'identity', icon: '👤',
        label: 'Crea el teu perfil',
        hint:  'DID local-first · clau ECDSA P-256 generada al teu dispositiu',
        cta:   { href: '/identity', label: 'Anar a Identity' },
    }),
    Object.freeze({
        id: 'permaweb', icon: '🌐',
        label: 'Publica perfil al permaweb',
        hint:  '0,05€ una sola vegada · operadors SOS de la xarxa et podran descobrir i verificar',
        cta:   { href: '/identity', label: 'Publicar perfil' },
    }),
    Object.freeze({
        id: 'project',  icon: '🚀',
        label: 'Crea el teu primer projecte',
        hint:  'Wizard amb sector + IA · clona la demo per veure el flux complet',
        cta:   { href: '#new', label: '＋ Nou projecte' },
    }),
    Object.freeze({
        id: 'valueMap', icon: '🗺',
        label: 'Completa el mapa de valor',
        hint:  '≥3 roles · ≥5 transaccions · 1 intangible · 1 cicle recíproc',
        cta:   { href: '/map', label: 'Dissenyar mapa' },
    }),
    Object.freeze({
        id: 'quality',  icon: '🌟',
        label: 'Aconsegueix score 90+',
        hint:  'Landing + SOPs + Workshops · estaràs llest per a la xarxa Matriu',
        cta:   { href: '/registry', label: 'Veure xarxa' },
    }),
]);

function _get(node, key) {
    if (!node) return undefined;
    if (node.content && node.content[key] !== undefined) return node.content[key];
    return node[key];
}

// Detecta si un projecte és el demo precarregat (que no compta com a propi)
function _isDemoOrArchived(p) {
    if (!p) return true;
    if (p.isArchived) return true;
    if (p.id === 'proj-colla-demo-v11') return true;
    return false;
}

export function computeOnboardingState({ identityNode = null, projects = [], qualityById = {} } = {}) {
    const id     = identityNode || null;
    const tx     = id ? (_get(id, 'arweaveTxId') || _get(id, 'permawebTxId')) : null;
    const hasIdentity = !!id;
    // Mock txIds (prefix MOCK_TX_) NO compten com a permaweb real
    const hasPermaweb = !!(tx && typeof tx === 'string' && !tx.startsWith('MOCK_TX_'));

    const myProjects = (projects || []).filter(p => !_isDemoOrArchived(p));
    const hasProject = myProjects.length > 0;

    let hasValueMap = false;
    let hasQuality90 = false;
    for (const p of myProjects) {
        const q = qualityById && qualityById[p.id];
        if (q && q.byDim && q.byDim.valueMap && q.byDim.valueMap.score >= 75) hasValueMap = true;
        if (q && q.total >= 90)                                               hasQuality90 = true;
    }

    return {
        identity: hasIdentity,
        permaweb: hasPermaweb,
        project:  hasProject,
        valueMap: hasValueMap,
        quality:  hasQuality90,
    };
}

export function onboardingCompletion(state) {
    if (!state) return { done: 0, total: ONBOARDING_STEPS.length, pct: 0 };
    let done = 0;
    for (const s of ONBOARDING_STEPS) if (state[s.id]) done++;
    return { done, total: ONBOARDING_STEPS.length, pct: Math.round(done / ONBOARDING_STEPS.length * 100) };
}

// Retorna el primer pas no completat (pista "què fer ara")
export function nextOnboardingStep(state) {
    if (!state) return ONBOARDING_STEPS[0];
    for (const s of ONBOARDING_STEPS) {
        if (!state[s.id]) return s;
    }
    return null;  // tot complet
}
