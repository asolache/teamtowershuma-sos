// =============================================================================
// TEAMTOWERS SOS V11 — v135 · VNA GAP DETECTOR · MULTI-TURN COMPLETION
// Ruta · /js/core/vnaGapDetector.js
//
// Item #2 del audit post-alfa (v134) · ALFA-RELEVANT ·
// Després de generar el mapa inicial, detecta gaps semàntics (no només
// numèrics com score<70). Si troba gaps específics → 2a crida targeted
// amb "afegeix el que falta" injectant la llista de gaps.
//
// Resol el bug típic · "equip de futbol generat sense rol scout".
//
// Diferencia vs escalation v132c ·
//  · Escalation v132c · slim→FULL si scoreOutput < threshold (general)
//  · Gap detector v135 · semantic gaps vs expected pattern (specific)
//
// API ·
//  · detectGaps({ map, domainDetection?, sectorContext? }) → { gaps[], hasAll }
//  · buildGapFillPrompt(gaps, currentMap) → prompt string per 2a crida
//  · runGapFillTurn({ map, gaps, provider, modelKey }) → { ok, updatedMap, ms }
// =============================================================================

export const VNA_GAP_VERSION = 'v135';

// ── detectGaps · pure function · compara map vs expected pattern ─────────
//
// Args ·
//   map               · { roles: [{ id, kind, name, castell_level }], transactions: [...] }
//   domainDetection   · { archetypes: [{ kind, name, castell }], ... } · si existeix
//   sectorContext     · { skill_levels: [...], expected_role_kinds: [...] } · si existeix
//   minRolesPerLevel  · default 1 · castell_level esperat (pom_de_dalt · tronc · ...)
//
// Retorna · { gaps: [{ kind, reason, suggestedKind, suggestedCastell? }], hasAll: bool }
export function detectGaps({
    map = {},
    domainDetection = null,
    sectorContext = null,
    minRolesPerLevel = 1,
} = {}) {
    const roles = Array.isArray(map?.roles) ? map.roles : [];
    const gaps = [];

    // 1 · domain archetype kinds esperats vs actuals
    if (domainDetection && Array.isArray(domainDetection.archetypes)) {
        const expectedKinds = new Set(domainDetection.archetypes.map(a => a?.kind).filter(Boolean));
        const expectedNames = new Set(domainDetection.archetypes.map(a => a?.name?.toLowerCase()).filter(Boolean));
        const actualKinds = new Set(roles.map(r => (r?.kind || '').toLowerCase()).filter(Boolean));
        const actualNames = new Set(roles.map(r => (r?.name || '').toLowerCase()).filter(Boolean));
        for (const arch of domainDetection.archetypes) {
            const kind = (arch?.kind || '').toLowerCase();
            const name = (arch?.name || '').toLowerCase();
            const present = actualKinds.has(kind) || actualNames.has(name) || _fuzzyContains(actualNames, name);
            if (!present) {
                gaps.push({
                    kind: 'missing-archetype',
                    reason: 'arquetip esperat del domini · "' + (arch?.name || arch?.kind) + '" no trobat al mapa',
                    suggestedKind:    arch?.kind || null,
                    suggestedName:    arch?.name || null,
                    suggestedCastell: arch?.castell || null,
                });
            }
        }
    }

    // 2 · expected_role_kinds del sector context
    if (sectorContext && Array.isArray(sectorContext.expected_role_kinds)) {
        const actualKinds = new Set(roles.map(r => (r?.kind || '').toLowerCase()).filter(Boolean));
        for (const k of sectorContext.expected_role_kinds) {
            if (typeof k !== 'string') continue;
            if (!actualKinds.has(k.toLowerCase())) {
                gaps.push({
                    kind: 'missing-sector-role',
                    reason: 'rol esperat pel sector · "' + k + '" no trobat',
                    suggestedKind: k,
                });
            }
        }
    }

    // 3 · castell levels · cap nivell crític buit (pom_de_dalt + tronc al mínim)
    const CRITICAL_LEVELS = ['pom_de_dalt', 'tronc', 'baixos'];
    const levelsPresent = new Set(roles.map(r => r?.castell_level).filter(Boolean));
    for (const lvl of CRITICAL_LEVELS) {
        if (!levelsPresent.has(lvl)) {
            gaps.push({
                kind: 'missing-castell-level',
                reason: 'nivell castell crític buit · "' + lvl + '"',
                suggestedCastell: lvl,
            });
        }
    }

    // 4 · zero transactions = el mapa no descriu interaccions
    if ((map?.transactions || []).length === 0 && roles.length >= 2) {
        gaps.push({ kind: 'no-transactions', reason: 'cap transacció · només llista de rols · falta dinàmica relacional' });
    }

    return { gaps, hasAll: gaps.length === 0, total: gaps.length };
}

// Fuzzy contains · útil quan el model torna noms lleugerament diferents
// (ex · "Doctor IA" vs "Doctora IA") · prefix/substring lleuger
function _fuzzyContains(setNames, target) {
    if (!target || target.length < 4) return false;
    const head = target.slice(0, Math.min(target.length, 6)).toLowerCase();
    for (const n of setNames) {
        if (n.startsWith(head) || target.startsWith(n.slice(0, 6))) return true;
    }
    return false;
}

// ── buildGapFillPrompt · pure · prompt per a la 2a crida ─────────────────
export function buildGapFillPrompt(gaps = [], currentMap = {}) {
    const lines = [];
    lines.push('## TASCA · COMPLETAR EL MAPA EXISTENT');
    lines.push('');
    lines.push('Tens un mapa de valor parcialment generat. Identifica i AFEGEIX només els elements que falten.');
    lines.push('');
    lines.push('### Gaps detectats (llista prioritzada)');
    for (const g of gaps) {
        if (g.kind === 'missing-archetype' || g.kind === 'missing-sector-role') {
            lines.push('· Falta rol · ' + (g.suggestedName || g.suggestedKind) +
                       (g.suggestedCastell ? ' (nivell castell · ' + g.suggestedCastell + ')' : '') +
                       ' · raó · ' + g.reason);
        } else if (g.kind === 'missing-castell-level') {
            lines.push('· Falta nivell castell · ' + g.suggestedCastell + ' · afegeix almenys un rol amb aquest castell_level');
        } else if (g.kind === 'no-transactions') {
            lines.push('· Cap transacció · genera ≥ 4 transaccions entre els rols existents');
        }
    }
    lines.push('');
    lines.push('### Rols ja presents (NO repeteixis)');
    for (const r of (currentMap.roles || [])) {
        lines.push('· ' + (r.name || r.id) + (r.kind ? ' [' + r.kind + ']' : '') + (r.castell_level ? ' (' + r.castell_level + ')' : ''));
    }
    lines.push('');
    lines.push('### Output JSON · MATEIX ESQUEMA QUE design-value-map-rich');
    lines.push('Retorna { roles: [...], transactions: [...], deliverables: [...] } amb NOMÉS els elements NOUS.');
    return lines.join('\n');
}

// ── runGapFillTurn · async · 2a crida targeted ───────────────────────────
//
// Args ·
//   map           · mapa actual (que ja conté roles+transactions)
//   gaps          · output de detectGaps()
//   provider      · async fn(modelKey, opts) → { text, usage }
//   modelKey      · default 'auto-small' (gap fill és quirúrgic · no necessita reasoner)
//   systemPrompt  · opcional · default reutilitza system base · pots passar el SYSTEM_BASE_SLIM
//
// Retorna ·
//   { ok: true,  added: { roles: [...], transactions: [...], deliverables: [...] }, updatedMap, usage, ms }
//   { ok: false, error, rawOutput?, ms }
export async function runGapFillTurn({
    map = {},
    gaps = [],
    provider = null,
    modelKey = 'auto-small',
    systemPrompt = null,
} = {}) {
    if (!gaps || gaps.length === 0) {
        return { ok: true, added: { roles: [], transactions: [], deliverables: [] }, updatedMap: map, ms: 0, noop: true };
    }
    if (typeof provider !== 'function') {
        return { ok: false, error: 'no-provider · injecta provider async fn' };
    }
    const t0 = Date.now();
    const userPrompt = buildGapFillPrompt(gaps, map);
    const sysPrompt  = systemPrompt || 'Ets un assistent VNA expert. Retorna JSON estricte amb només els elements NOUS demanats.';
    let result;
    try {
        result = await provider(modelKey, {
            systemPrompt: sysPrompt,
            userPrompt,
            temperature: 0.3,
            maxOutputTokens: 800,
        });
    } catch (e) {
        return { ok: false, error: 'gap-fill-provider-failed · ' + (e?.message || 'unknown'), ms: Date.now() - t0 };
    }
    const text = (typeof result?.text === 'string') ? result.text : (typeof result?.content === 'string' ? result.content : '');
    let parsed;
    try {
        let t = text.trim();
        const fenced = t.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
        if (fenced) t = fenced[1].trim();
        if (!t.startsWith('{')) {
            const open = t.indexOf('{'); const close = t.lastIndexOf('}');
            if (open >= 0 && close > open) t = t.slice(open, close + 1);
        }
        parsed = JSON.parse(t);
    } catch (_) {
        return { ok: false, error: 'parse-failed', rawOutput: text, ms: Date.now() - t0 };
    }
    const added = {
        roles:         Array.isArray(parsed?.roles)         ? parsed.roles         : [],
        transactions:  Array.isArray(parsed?.transactions)  ? parsed.transactions  : [],
        deliverables:  Array.isArray(parsed?.deliverables)  ? parsed.deliverables  : [],
    };
    const updatedMap = mergeGapFill(map, added);
    return { ok: true, added, updatedMap, usage: result?.usage || null, ms: Date.now() - t0 };
}

// ── mergeGapFill · pure · dedupe per id i fuzzy name ─────────────────────
export function mergeGapFill(currentMap = {}, added = {}) {
    const existingRoleIds   = new Set((currentMap.roles || []).map(r => r.id).filter(Boolean));
    const existingRoleNames = new Set((currentMap.roles || []).map(r => (r.name || '').toLowerCase()).filter(Boolean));
    const newRoles = (added.roles || []).filter(r => r && r.id &&
        !existingRoleIds.has(r.id) && !existingRoleNames.has((r.name || '').toLowerCase()));
    const allRoleIds = new Set([...(currentMap.roles || []).map(r => r.id), ...newRoles.map(r => r.id)]);
    // Filter transactions · només si from i to existeixen ara
    const newTxs = (added.transactions || []).filter(t => t && allRoleIds.has(t.from) && allRoleIds.has(t.to));
    const newDeliv = (added.deliverables || []).filter(d => d && d.name);
    return {
        ...currentMap,
        roles:        [...(currentMap.roles || []),        ...newRoles],
        transactions: [...(currentMap.transactions || []), ...newTxs],
        deliverables: [...(currentMap.deliverables || []), ...newDeliv],
    };
}
