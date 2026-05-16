// =============================================================================
// TEAMTOWERS SOS V11 — AI COST TRACKER (D4 · tier visible · sprint analysis)
// Ruta · /js/core/aiCostTracker.js
//
// CAPA · UI live feedback · cost de la sessió actual + històric local
// per projecte. Permet que aiTierIndicator mostri en temps real model +
// tier + cost acumulat sense fer query del wallet a cada repintat.
//
// RELACIÓ amb el wallet ·
//   Aquest tracker NO és font de veritat de "lifetime AI spend per project".
//   Font de veritat · wallet del projecte (walletService.consumeFromWallet
//   amb source:'orchestrator') · agregat per costTrackingService.
//   `runPrompt` (aiRouterService.js) crida AMBDÓS · 1) recordUsage aquí ·
//   2) consumeAndPersist al wallet. Així NO duplica · cada capa té el seu
//   propòsit ·
//     - aiCostTracker   · feedback ràpid de sessió per la UI (no toca KB)
//     - wallet movements + costTrackingService · auditoria + facturació
//
// Persistència ·
//   - sessió actual · in-memory (window-scoped)
//   - històric per projecte · localStorage (caché ràpid · el wallet és gold)
//
// Emit · event 'ai:cost-updated' al window perquè les UI puguin escoltar.
// =============================================================================

import { actualCostUsd } from './aiProviderService.js';
import { estimateCostEur, estimateCostUsd } from './aiRouterService.js';

const LS_KEY = 'sos_ai_cost_v1';
const SESSION_KEY = '__sos_ai_cost_session__';

function _now() { return Date.now(); }

// In-memory session state · resetat només si es recarrega la pàgina.
// En entorn Node (tests) fem servir una variable de mòdul · en navegador
// l'ancorem a window perquè sigui visible entre re-imports.
let _moduleSession = { entries: [], totalUsd: 0, startedAt: _now() };
function _getSession() {
    if (typeof window === 'undefined') return _moduleSession;
    if (!window[SESSION_KEY]) {
        window[SESSION_KEY] = _moduleSession;
    }
    return window[SESSION_KEY];
}

function _loadHistoric() {
    if (typeof localStorage === 'undefined') return {};
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return {};
        return JSON.parse(raw) || {};
    } catch (_) { return {}; }
}

function _saveHistoric(data) {
    if (typeof localStorage === 'undefined') return;
    try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch (_) {}
}

function _emitUpdate(payload) {
    if (typeof window === 'undefined' || !window.dispatchEvent) return;
    try {
        window.dispatchEvent(new CustomEvent('ai:cost-updated', { detail: payload }));
    } catch (_) {}
}

// recordUsage · registra una crida real · sumem al session-total i al projecte.
// Pricing actual a partir del catàleg AI_MODELS (USD per 1M tokens).
export function recordUsage({
    modelKey,
    usage = { inputTokens: 0, outputTokens: 0 },
    taskKind = null,
    taskTier = null,
    sessionId = null,
    projectId = null,
    elapsedMs = 0,
} = {}) {
    if (!modelKey || !usage) return null;
    const costUsd = actualCostUsd(modelKey, usage) || 0;
    const entry = {
        modelKey,
        taskKind,
        taskTier,
        sessionId,
        projectId,
        inputTokens:  usage.inputTokens  || 0,
        outputTokens: usage.outputTokens || 0,
        costUsd,
        elapsedMs:    elapsedMs || 0,
        ts: _now(),
    };
    // Session
    const sess = _getSession();
    sess.entries.push(entry);
    sess.totalUsd = Number((sess.totalUsd + costUsd).toFixed(6));
    // Històric per projecte
    if (projectId) {
        const hist = _loadHistoric();
        if (!hist[projectId]) hist[projectId] = { totalUsd: 0, calls: 0, lastTs: 0 };
        hist[projectId].totalUsd = Number((hist[projectId].totalUsd + costUsd).toFixed(6));
        hist[projectId].calls += 1;
        hist[projectId].lastTs = _now();
        _saveHistoric(hist);
    }
    _emitUpdate({ entry, sessionTotalUsd: sess.totalUsd });
    return entry;
}

// getSessionTotalUsd · cost acumulat des de càrrega de pàgina
export function getSessionTotalUsd() {
    return _getSession().totalUsd;
}

// getSessionTotalEur · convertit · útil per la UI
const USD_EUR = 0.92;
export function getSessionTotalEur(rate = USD_EUR) {
    return Number((getSessionTotalUsd() * rate).toFixed(6));
}

// getSessionEntries · llistat per debug · UI pot mostrar últimes N crides
export function getSessionEntries({ limit = 0 } = {}) {
    const entries = _getSession().entries.slice();
    if (limit > 0 && entries.length > limit) return entries.slice(-limit);
    return entries;
}

// getProjectTotalUsd · històric persistent (localStorage)
export function getProjectTotalUsd(projectId) {
    if (!projectId) return 0;
    const hist = _loadHistoric();
    return hist[projectId]?.totalUsd || 0;
}

// getProjectTotalEur · convertit
export function getProjectTotalEur(projectId, rate = USD_EUR) {
    return Number((getProjectTotalUsd(projectId) * rate).toFixed(6));
}

// resetSession · sols per a tests
export function _resetSession() {
    _moduleSession = { entries: [], totalUsd: 0, startedAt: _now() };
    if (typeof window !== 'undefined') {
        window[SESSION_KEY] = _moduleSession;
    }
}

// resetHistoric · UI · "esborra dades" · perillós · només via /settings
export function resetHistoric() {
    _saveHistoric({});
    _emitUpdate({ reset: true });
}

// formatCostEur · helper UI · cèntims o euros segons magnitud
export function formatCostEur(eur) {
    if (typeof eur !== 'number' || !isFinite(eur)) return '—';
    if (eur < 0.01)   return '<0.01 €';
    if (eur < 1)      return eur.toFixed(3) + ' €';
    return eur.toFixed(2) + ' €';
}

// previewCostEur · NO grava · sols estima per a UI · usat per botons "Pujar tier"
export function previewCostEur({ modelKey, inputTokens = 0, outputTokens = 800, rate = USD_EUR } = {}) {
    return estimateCostEur(modelKey, { inputTokens, outputTokens }, { rate });
}

// previewCostUsd · idem
export function previewCostUsd({ modelKey, inputTokens = 0, outputTokens = 800 } = {}) {
    return estimateCostUsd(modelKey, { inputTokens, outputTokens });
}
