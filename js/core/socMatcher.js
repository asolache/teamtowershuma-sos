// =============================================================================
// TEAMTOWERS SOS V11 — SOC MATCHER (AI-DRIVEN-001 · sprint PR1)
// Ruta · /js/core/socMatcher.js
//
// Selecciona els SOCs adequats del catàleg knowledge/socs/ per a un projecte
// concret · sense IA · puro pattern-matching sobre l'index. La IA pot després
// curar la selecció (task `classify-and-pick-socs`).
//
// Inputs · {sector_cnae, lifecycle_stage, entity_type, vna_zoom, project_type,
//           description, keywords, index?}
// Output · {selected:[{relpath, title, reason, weight}], rejected:[...], stats}
//
// VNA_ZOOM (zoom del mapa) ·
//   macro · 1-3 SOCs · vista panoràmica (lifecycle dominant)
//   mid   · 4-7 SOCs · vista normal (lifecycle + sector + critical)
//   micro · 8-15 SOCs · vista detallada (tots els que apliquen)
//
// Pure · zero deps · safe en Node + browser.
// =============================================================================

import { getCached } from './knowledgeIndexService.js';

export const SOC_MATCHER_VERSION = 'v1.0';

export const VNA_ZOOM_LEVELS = Object.freeze({
    macro: Object.freeze({ id: 'macro', min: 1, max: 3,  label: 'Panoràmic · vista de l\'helicòpter' }),
    mid:   Object.freeze({ id: 'mid',   min: 4, max: 7,  label: 'Normal · lifecycle + sector clau' }),
    micro: Object.freeze({ id: 'micro', min: 8, max: 15, label: 'Detall · tots els processos rellevants' }),
});

export const ENTITY_TYPES = Object.freeze({
    organization:     'Organització · estructura humana (cooperativa · associació · ONG)',
    business:         'Negoci · entitat amb vector comercial · SL · SLU · autònom',
    sos:              'SoS · sistema operatiu sociotècnic federat (SOS dins SOS)',
    project_internal: 'Projecte intern · subprojecte d\'una org existent',
});

// Weights · cada match contribueix punts · al final ordenem per score
const W = Object.freeze({
    sector_match:       100,   // SOC del sector exacte del projecte
    sector_neighbor:     40,   // SOC d'un sector adjacent (per descripció)
    lifecycle_match:     90,   // SOC de la fase actual del projecte
    lifecycle_next:      30,   // SOC de la fase següent (planificació futura)
    critical_brand:      80,   // SOC sos_context='critical' (TeamTowers core)
    keyword_match:       25,   // Cada keyword de la descripció que coincideix
    entity_org_bonus:    20,   // org/coop → boost SOCs cooperatius
    entity_business_bonus: 20, // business → boost SOCs amb angle comercial
});

// _normalizeZoom · accepta string o objecte
function _normalizeZoom(z) {
    if (!z) return VNA_ZOOM_LEVELS.mid;
    if (typeof z === 'string') return VNA_ZOOM_LEVELS[z] || VNA_ZOOM_LEVELS.mid;
    if (z && z.id && VNA_ZOOM_LEVELS[z.id]) return VNA_ZOOM_LEVELS[z.id];
    return VNA_ZOOM_LEVELS.mid;
}

// _detectBrandContext · pure · si la descripció del projecte conté "teamtowers"
// considerem que és el propi brand operador · activem brand-specific SOCs.
// Extensible · afegir altres brands aquí quan apliqui.
function _detectBrandContext({ name = '', description = '', project_type = '' } = {}) {
    const hay = (name + ' ' + description + ' ' + project_type).toLowerCase();
    if (/teamtowers|team-towers|team\s+towers/.test(hay)) return 'teamtowers';
    return null;
}

// _lifecycleOrder · per detectar "fase següent"
const LIFECYCLE_ORDER = Object.freeze(['idea', 'mvp', 'validation', 'scale']);
function _nextPhase(p) {
    const i = LIFECYCLE_ORDER.indexOf(String(p || '').toLowerCase());
    if (i < 0 || i >= LIFECYCLE_ORDER.length - 1) return null;
    return LIFECYCLE_ORDER[i + 1];
}

// _scoreSoc · pure · puntua un SOC candidat per al context donat
function _scoreSoc(soc, ctx) {
    const reasons = [];
    let score = 0;

    // 1. Sector CNAE exact match
    if (ctx.sector_cnae && soc.sector_cnae && soc.sector_cnae === ctx.sector_cnae) {
        score += W.sector_match;
        reasons.push('sector ' + ctx.sector_cnae + ' exact');
    }

    // 2. Lifecycle phase match
    if (ctx.lifecycle_stage && soc.phase && soc.phase === ctx.lifecycle_stage) {
        score += W.lifecycle_match;
        reasons.push('fase ' + ctx.lifecycle_stage);
    } else if (ctx.lifecycle_stage && soc.phase && soc.phase === _nextPhase(ctx.lifecycle_stage)) {
        score += W.lifecycle_next;
        reasons.push('fase següent (' + soc.phase + ')');
    }

    // 3. Critical brand SOCs (sempre rellevants per TeamTowers)
    if (soc.sos_context === 'critical') {
        score += W.critical_brand;
        reasons.push('TT-critical');
    }

    // 4. Keyword overlap
    const kws = Array.isArray(soc.keywords) ? soc.keywords.map(k => String(k).toLowerCase()) : [];
    const haystack = (ctx.description || '') + ' ' + (ctx.name || '') + ' ' + (ctx.project_type || '');
    const hay = haystack.toLowerCase();
    let kwHits = 0;
    for (const kw of kws) {
        if (kw.length >= 3 && hay.includes(kw)) {
            kwHits++;
            if (kwHits <= 3) reasons.push('kw·' + kw);
        }
    }
    score += Math.min(kwHits, 5) * W.keyword_match;

    // 5. Entity bonus
    if (ctx.entity_type === 'organization' || ctx.entity_type === 'sos') {
        // org/sos prefereix SOCs amb context cooperatiu/comunitari
        if (kws.some(k => /coop|colla|comunit|matriu|castell/.test(k))) {
            score += W.entity_org_bonus;
            reasons.push('entitat·coop');
        }
    } else if (ctx.entity_type === 'business') {
        if (kws.some(k => /merch|venda|consult|negoci|client/.test(k))) {
            score += W.entity_business_bonus;
            reasons.push('entitat·business');
        }
    }

    return { score, reasons };
}

// _allSocsFromIndex · extreu tots els items folder=='socs' de l'index
// Per defecte EXCLOU SOCs amb scope='brand-specific' · només els inclou quan
// el projecte és del mateix brand_owner (ex · TeamTowers operadora). Aquests
// SOCs aporten context de marca al LLM però NO són SOCs reutilitzables.
function _allSocsFromIndex(idx, { brandContext = null } = {}) {
    if (!idx || !Array.isArray(idx.items)) return [];
    return idx.items
        .filter(it => it.folder === 'socs')
        .filter(it => {
            if (it.scope !== 'brand-specific') return true;
            if (!brandContext) return false;
            return it.brand_owner === brandContext;
        });
}

// matchSocs · pure · selecciona SOCs per al projecte
//
// args ·
//   sector_cnae      · 'A'..'T'|'UV' (opt)
//   lifecycle_stage  · 'idea'|'mvp'|'validation'|'scale' (opt)
//   entity_type      · ENTITY_TYPES key (opt)
//   vna_zoom         · 'macro'|'mid'|'micro' (default 'mid')
//   project_type     · string descriptiu (opt)
//   description      · text lliure (opt)
//   name             · nom projecte (opt)
//   index            · injectable · si null · agafa cache global
//
// Retorna ·
//   { selected:[{relpath, title, sector_cnae, phase, score, reasons}],
//     rejected:[{relpath, title, score}],
//     zoom, stats: {totalCandidates, selectedCount, avgScore, minScore} }
export function matchSocs({
    sector_cnae = null,
    lifecycle_stage = null,
    entity_type = null,
    vna_zoom = 'mid',
    project_type = null,
    description = '',
    name = '',
    brandContext = null,   // si el projecte és del brand · ex 'teamtowers' · inclou SOCs brand-specific
    index = null,
} = {}) {
    const idx = index || getCached();
    const zoom = _normalizeZoom(vna_zoom);
    // Detect brand context automàticament del nom/descripció si no s'ha passat
    const autoBrand = _detectBrandContext({ name, description, project_type });
    const effectiveBrand = brandContext || autoBrand;
    const candidates = _allSocsFromIndex(idx, { brandContext: effectiveBrand });
    const ctx = { sector_cnae, lifecycle_stage, entity_type, project_type, description, name };

    // Score everyone
    const scored = candidates.map(soc => {
        const { score, reasons } = _scoreSoc(soc, ctx);
        return {
            relpath:     soc.relpath,
            title:       soc.title || soc.id || soc.relpath,
            sector_cnae: soc.sector_cnae || null,
            phase:       soc.phase || null,
            sos_context: soc.sos_context || null,
            score,
            reasons,
        };
    }).sort((a, b) => b.score - a.score);

    // Apply zoom · pren els N millors dins el rang
    const targetCount = Math.min(zoom.max, Math.max(zoom.min, scored.filter(s => s.score > 0).length));
    const selected = scored.slice(0, targetCount).filter(s => s.score > 0);
    // Si tots són 0, com a fallback dóna els critical (sempre rellevants)
    if (selected.length === 0) {
        const critical = candidates.filter(s => s.sos_context === 'critical')
            .slice(0, zoom.min)
            .map(s => ({
                relpath: s.relpath, title: s.title || s.id, sector_cnae: null, phase: null,
                sos_context: 'critical', score: 1, reasons: ['fallback·critical'],
            }));
        selected.push(...critical);
    }

    const rejected = scored.slice(targetCount).map(s => ({
        relpath: s.relpath, title: s.title, score: s.score,
    }));

    const totalScore = selected.reduce((a, s) => a + s.score, 0);
    return {
        version:  SOC_MATCHER_VERSION,
        selected,
        rejected,
        zoom:     zoom.id,
        stats: {
            totalCandidates: candidates.length,
            selectedCount:   selected.length,
            avgScore:        selected.length ? Math.round(totalScore / selected.length) : 0,
            minScore:        selected.length ? selected[selected.length - 1].score : 0,
        },
    };
}

// listEntityTypes · helper UI
export function listEntityTypes() {
    return Object.entries(ENTITY_TYPES).map(([id, label]) => ({ id, label }));
}

// listZoomLevels · helper UI
export function listZoomLevels() {
    return Object.values(VNA_ZOOM_LEVELS).map(z => ({ id: z.id, min: z.min, max: z.max, label: z.label }));
}
