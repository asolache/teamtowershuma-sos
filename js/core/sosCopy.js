// =============================================================================
// TEAMTOWERS SOS V11 — SOS COPY (DESIGN-SYSTEM sprint A)
// Ruta · /js/core/sosCopy.js
//
// SINGLE SOURCE OF TRUTH per a copy human-readable a tota l'app (DRY).
// Centralitza:
//   - Labels de menús + nav destinations
//   - CTA/botons clau
//   - Microcopy per estats (loading · empty · error · ok)
//   - Help · hints · tooltips per a forms
//
// PRINCIPIS · KISS (1 funció · 1 propòsit) · DRY (mai duplicar text). Quan
// la UI necessita text, importa des d'aquí en lloc de hardcoded.
// =============================================================================

// LABEL · funció central · `label(key, fallback?)` retorna copy human-readable.
// Si key no existeix · fallback · si fallback no donat · retorna key.
const TABLE = Object.freeze({
    // ─── Navigation · menus (human-readable · curt · acció clara) ────────
    'nav.home':           'Inici',
    'nav.dashboard':      'Projectes',
    'nav.map':            'Mapa de valor',
    'nav.sops':           'Procediments',
    'nav.kanban':         'Tasques',
    'nav.wallet':         'Wallet',
    'nav.tags':           'Tags',
    'nav.folders':        'Carpetes',
    'nav.mind':           'Mind-graph',
    'nav.sectors':        'Sectors',
    'nav.registry':       'Registre públic',
    'nav.opportunities':  'Descobreix',
    'nav.market':         'Mercat',
    'nav.efficiency':     'Eficiència',
    'nav.path':           'Historial neural',
    'nav.sprint':         'Swarm',
    'nav.savings':        'Estalvi vs conv.',
    'nav.value':          'Pastís de valor',
    'nav.pact':           'Pacte de socis',
    'nav.presentation':   'Presentació',
    'nav.learn':          'Aprèn',
    'nav.skills':         'Skills',
    'nav.matriu':         'Matriu',
    'nav.identity':       'Identitat',
    'nav.canvas':         'Canvas',
    'nav.pitch':          'Pitch públic',
    'nav.tokenomics':     'Tokenomics',
    'nav.accounting':     'Comptabilitat',
    'nav.invoices':       'Factures',
    'nav.proposals':      'Propostes',
    'nav.lifecycle':      'Cicle del projecte',
    'nav.improve':        'Millora contínua',
    'nav.swarm':          'Flux paral·lel',
    'nav.design':         'Disseny SOS',

    // ─── Sections · groups · UX-NAV-V3 · 5 grups imperatius (PR-A) ───────
    'group.create':       'Crear',
    'group.work':         'Treballar',
    'group.account':      'Comptabilitzar',
    'group.connect':      'Connectar',
    'group.learn':        'Aprendre',
    // Legacy (v2 · 7 grups) · es mantenen per backwards-compat en vistes que els llegeixen
    'group.foundation':   'Fundació',
    'group.execution':    'Execució',
    'group.value':        'Valor',
    'group.commercial':   'Comercial',
    'group.swarm':        'Swarm Intel·ligència',
    'group.discovery':    'Descobriment',
    'group.identity':     'Identitat',

    // ─── Common actions · CTAs (verb d'acció · curt) ────────────────────
    'cta.create':         'Crear',
    'cta.save':           'Desar',
    'cta.cancel':         'Cancel·lar',
    'cta.edit':           'Editar',
    'cta.delete':         'Esborrar',
    'cta.share':          'Compartir',
    'cta.publish':        'Publicar',
    'cta.unpublish':      'Despublicar',
    'cta.start':          'Començar',
    'cta.continue':       'Continuar',
    'cta.next':           'Següent',
    'cta.back':           'Tornar',
    'cta.close':          'Tancar',
    'cta.confirm':        'Confirmar',
    'cta.add':            'Afegir',
    'cta.remove':         'Treure',
    'cta.sync':           'Sincronitzar',
    'cta.refresh':        'Refrescar',
    'cta.generate':       'Generar amb IA',
    'cta.run':            'Executar',
    'cta.run_loop':       'Iterar',
    'cta.endorse':        'Endorsar',
    'cta.contact':        'Contactar',
    'cta.view_detail':    'Veure detall',
    'cta.see_more':       'Veure més',
    'cta.copy_link':      'Copiar enllaç',

    // ─── States · loading / empty / error / done ────────────────────────
    'state.loading':      'Carregant…',
    'state.thinking':     'Pensant…',
    'state.saving':       'Desant…',
    'state.empty':        'Cap entrada encara',
    'state.error':        'Error',
    'state.done':         'Fet',
    'state.partial':      'En curs',
    'state.pending':      'Pendent',
    'state.draft':        'Esborrany',
    'state.sent':         'Enviat',
    'state.paid':         'Pagat',
    'state.accepted':     'Acceptat',
    'state.rejected':     'Rebutjat',
    'state.expired':      'Caducat',

    // ─── Hints · tooltips · microcopy formularis ────────────────────────
    'hint.required':      'Camp requerit',
    'hint.optional':      'Opcional',
    'hint.min_chars':     'Mínim {n} caràcters',
    'hint.max_chars':     'Màxim {n} caràcters',
    'hint.email':         'p.ex. nom@domini.com',
    'hint.handle':        'p.ex. @alvaro',
    'hint.amount_eur':    'Import en €',
    'hint.ai_powered':    '✨ Generat amb IA · revisa abans de desar',
    'hint.local_first':   'Es desa al teu KB local · sincronitza amb /opportunities',

    // ─── Errors · llegibles ─────────────────────────────────────────────
    'err.empty':          'No pot estar buit',
    'err.too_short':      'Massa curt · mínim {n}',
    'err.too_long':       'Massa llarg · màxim {n}',
    'err.invalid':        'Format invàlid',
    'err.duplicate':      'Ja existeix',
    'err.not_found':      'No trobat',
    'err.network':        'Connexió fallida · reintenta',
    'err.ai_failed':      'IA no disponible · prova de nou o omple manualment',

    // ─── Help · explicacions one-line ───────────────────────────────────
    'help.canvas':        'Defineix la visió, missió i valors del projecte abans d\'engegar tot el cicle.',
    'help.pitch':         'One-pager públic shareable · OG meta auto per cards a xarxes.',
    'help.tokenomics':    'Disseny del token nadiu · 6 grups + vesting · quality score live.',
    'help.invoices':      'Cobrar genera automàticament l\'apunt comptable (debit cash · credit revenue + IVA).',
    'help.proposals':     'L\'IA genera el draft segons brief · skill match automàtic.',
    'help.swarm':         'Executa el DAG de roles en paral·lel · cada output alimenta el següent.',
    'help.improve':       'Cada SOP executat enriquix el projecte amb tags · evidencias · suggestions.',
    'help.ikigai':        '4 dimensions · loves + goodAt + worldNeeds + paidFor · centre = raó de ser.',

    // ─── Empty states · CTA contextual (DRY: no repetir text per view) ──
    'empty.market':       'Cap oferta encara · publica el primer producte o servei.',
    'empty.proposals':    'Cap proposta encara · l\'IA pot generar-te la primera amb un brief curt.',
    'empty.invoices':     'Cap factura encara · crea\'n una des del formulari.',
    'empty.ledger':       'Cap apunt comptable · cobrar una factura el genera automàticament.',
    'empty.projects':     'Cap projecte encara · el bootstrap MAX et dóna 108 cohort managers + lifecycle 85%.',
});

// label · pure · retorna el copy human-readable per a una key
export function label(key, fallback) {
    return TABLE[key] || (typeof fallback === 'string' ? fallback : key);
}

// labelOr · pure · ALIAS · explícit · útil quan vols passar fallback verbosament
export function labelOr(key, fallback) {
    return label(key, fallback);
}

// labelN · pure · substitueix {n} pel número donat (per a microcopy "min 30 chars")
export function labelN(key, n, fallback) {
    const tpl = label(key, fallback);
    return String(tpl).replace('{n}', String(n));
}

// hasLabel · pure · check d'existència
export function hasLabel(key) {
    return Object.prototype.hasOwnProperty.call(TABLE, key);
}

// listLabels · pure · per a diagnòstics · llistar totes les keys
export function listLabels() {
    return Object.keys(TABLE).slice();
}

// applyToNavDestinations · pure · pren NAV_DESTINATIONS i retorna còpia amb
// labels actualitzats des de TABLE (key = 'nav.' + dest.id). Útil per
// substituir copy a navService sense modificar el seu codi (DRY).
export function applyToNavDestinations(destinations = []) {
    return (destinations || []).map(d => {
        const key = 'nav.' + d.id;
        if (hasLabel(key)) return { ...d, label: TABLE[key] };
        return d;
    });
}

// COMMON_COMPONENT_TOKENS · constants per a tokens visuals (KISS · no css var spread)
// Aquí no fem styles · sols nomenats per a referència a Design System view
export const TOKENS = Object.freeze({
    colors: {
        primary:   '#6366f1',
        success:   '#22c55e',
        warning:   '#facc15',
        danger:    '#ef4444',
        info:      '#3b82f6',
        ikigai:    '#ec4899',
        purple:    '#a855f7',
    },
    radii: {
        sm: '4px',
        md: '6px',
        lg: '8px',
        pill: '999px',
    },
    spacing: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
    },
});
