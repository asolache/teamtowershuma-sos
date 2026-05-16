// =============================================================================
// TEAMTOWERS SOS V11 — CONVENTIONAL RANGES SERVICE (MKT-003 sprint A)
//
// Externalitza els rangs convencionals (notaria · contable · PM · consultoria)
// que abans vivien hardcoded a marketService.DEFAULT_CONVENTIONAL_RANGES.
//
// Ara són un node KB · `type='config'` · `id='conventional-ranges'` · que
// l'usuari pot editar via /settings (tab Mercat · pendent · veure SPRINT-PLAN).
//
// Fallback · si no hi ha node config al KB, retorna DEFAULT_CONVENTIONAL_RANGES
// (estimacions per a venta · MKT-001 sprint D · "no factura · argumento de venta").
//
// Filosofia · zero hardcoded numbers a la UI · sols defaults com a fallback.
// =============================================================================

import { DEFAULT_CONVENTIONAL_RANGES } from './marketService.js';

export const CONVENTIONAL_RANGES_CONFIG_ID = 'conventional-ranges';
export const CONVENTIONAL_RANGES_TYPE      = 'config';

// loadConventionalRanges · async · llegeix el node config del KB
// Retorna · l'objecte ranges (mateixa shape que DEFAULT_CONVENTIONAL_RANGES)
// Defensiu · si KB falla o el node no existeix · retorna defaults.
export async function loadConventionalRanges({ kb } = {}) {
    if (!kb || typeof kb.query !== 'function') {
        return { ranges: DEFAULT_CONVENTIONAL_RANGES, source: 'default-fallback-no-kb' };
    }
    let nodes = [];
    try {
        nodes = await kb.query({ type: CONVENTIONAL_RANGES_TYPE });
    } catch (_) {
        return { ranges: DEFAULT_CONVENTIONAL_RANGES, source: 'default-fallback-query-failed' };
    }
    const node = (nodes || []).find(n => n?.id === CONVENTIONAL_RANGES_CONFIG_ID);
    if (!node || !node.content?.ranges || typeof node.content.ranges !== 'object') {
        return { ranges: DEFAULT_CONVENTIONAL_RANGES, source: 'default-fallback-no-config' };
    }
    // Merge defaults amb overrides · usuari pot afegir/editar categories,
    // però si oblida una, el default segueix actiu (no perdrem cat existents).
    const merged = { ...DEFAULT_CONVENTIONAL_RANGES, ...node.content.ranges };
    return { ranges: merged, source: 'kb-config', updatedAt: node.updatedAt || node.createdAt || null };
}

// saveConventionalRanges · async · upsert al KB
//   ranges · objecte { [category]: { lowEur, highEur, label, unit? }, ... }
// Retorna · el node persistit
export async function saveConventionalRanges({ kb, ranges } = {}) {
    if (!kb || typeof kb.upsert !== 'function') {
        throw new Error('saveConventionalRanges requires kb with upsert()');
    }
    if (!ranges || typeof ranges !== 'object') {
        throw new Error('saveConventionalRanges requires ranges object');
    }
    // Validar shape mínima per a cada categoria
    for (const [cat, r] of Object.entries(ranges)) {
        if (typeof r !== 'object' || r === null) {
            throw new Error('ranges[' + cat + '] must be an object');
        }
        if (typeof r.lowEur !== 'number' || typeof r.highEur !== 'number') {
            throw new Error('ranges[' + cat + '] requires lowEur + highEur (numbers)');
        }
        if (r.lowEur < 0 || r.highEur < 0) {
            throw new Error('ranges[' + cat + '] · valors no poden ser negatius');
        }
        if (r.lowEur > r.highEur) {
            throw new Error('ranges[' + cat + '] · lowEur > highEur');
        }
    }
    const now = Date.now();
    const node = {
        id:   CONVENTIONAL_RANGES_CONFIG_ID,
        type: CONVENTIONAL_RANGES_TYPE,
        content: {
            ranges,
            description: 'Rangs convencionals de mercat per a computeSavings vs SOS · editables per l\'operador a /settings (tab Mercat)',
        },
        keywords: ['type:config', 'config:conventional-ranges'],
        createdAt: now,
        updatedAt: now,
    };
    await kb.upsert(node);
    return node;
}

// validateRangesShape · pure · valida sense llançar (per a UI form validation)
// Retorna · { ok, errors: [] }
export function validateRangesShape(ranges) {
    const errors = [];
    if (!ranges || typeof ranges !== 'object') {
        errors.push('ranges must be an object');
        return { ok: false, errors };
    }
    for (const [cat, r] of Object.entries(ranges)) {
        if (typeof r !== 'object' || r === null) { errors.push(cat + ': not object'); continue; }
        if (typeof r.lowEur !== 'number')         errors.push(cat + ': lowEur missing/non-numeric');
        if (typeof r.highEur !== 'number')        errors.push(cat + ': highEur missing/non-numeric');
        if (typeof r.lowEur === 'number' && r.lowEur < 0)   errors.push(cat + ': lowEur < 0');
        if (typeof r.highEur === 'number' && r.highEur < 0) errors.push(cat + ': highEur < 0');
        if (typeof r.lowEur === 'number' && typeof r.highEur === 'number' && r.lowEur > r.highEur) {
            errors.push(cat + ': lowEur > highEur');
        }
        if (!r.label || typeof r.label !== 'string') errors.push(cat + ': label missing');
    }
    return { ok: errors.length === 0, errors };
}
