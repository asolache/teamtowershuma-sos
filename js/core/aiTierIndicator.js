// =============================================================================
// TEAMTOWERS SOS V11 — AI TIER INDICATOR (D4 · sprint analysis & design)
// Ruta · /js/core/aiTierIndicator.js
//
// Widget visible · mostra a l'usuari en TOT moment ·
//   - quin model està fent la feina · de quin provider
//   - tier actual · draft / quality / critical
//   - cost estimat de la propera crida + cost acumulat sessió
//   - botó "Pujar tier" amb el delta de cost
//
// Filosofia · transparència total al cost · usuari decideix · no és una
// caixa negra. KISS · API similar a aiFormFeedback.
//
// USAGE ·
//   const tier = attachTierIndicator(container, {
//       taskKind: 'value-map-design',
//       taskTier: 'draft',
//       promptPreview: '...',          // text aproximat del prompt
//       projectId: 'proj-123',
//       onChange: (newTier) => { ... } // l'usuari ha clicat pujar/baixar
//   });
//   // Quan la crida real acaba ·
//   tier.refresh();
// =============================================================================

import {
    AI_MODELS, TASK_TIERS, pickModelForTier, estimatePromptCostEur, estimateTokensFromText,
} from './aiRouterService.js';
import {
    getSessionTotalEur, getProjectTotalEur, formatCostEur,
} from './aiCostTracker.js';

let _cssInjected = false;
function _ensureCss() {
    if (_cssInjected) return;
    if (typeof document === 'undefined') return;
    try {
        const style = document.createElement('style');
        style.setAttribute('data-ai-tier-indicator', '1');
        style.textContent = `
            .ati-shell { display:flex; flex-direction:column; gap:6px; padding:8px 10px; border-radius:8px; background:rgba(15,23,42,0.5); border:1px solid rgba(148,163,184,0.18); font-size:0.78rem; color:#cbd5e1; }
            .ati-row { display:flex; align-items:center; justify-content:space-between; gap:8px; flex-wrap:wrap; }
            .ati-model { display:flex; align-items:center; gap:6px; font-weight:600; color:#e2e8f0; }
            .ati-provider { font-size:0.7rem; padding:1px 6px; border-radius:999px; background:rgba(148,163,184,0.15); color:#94a3b8; font-weight:500; text-transform:uppercase; letter-spacing:0.04em; }
            .ati-tier { display:inline-flex; align-items:center; gap:4px; padding:2px 8px; border-radius:999px; font-weight:600; font-size:0.7rem; text-transform:uppercase; letter-spacing:0.04em; }
            .ati-tier.draft    { background:rgba(34,197,94,0.15);  color:#22c55e; border:1px solid rgba(34,197,94,0.4); }
            .ati-tier.quality  { background:rgba(99,102,241,0.15); color:#818cf8; border:1px solid rgba(99,102,241,0.4); }
            .ati-tier.critical { background:rgba(244,114,182,0.15);color:#f472b6; border:1px solid rgba(244,114,182,0.5); }
            .ati-cost { color:#facc15; font-weight:600; font-variant-numeric: tabular-nums; }
            .ati-cost-session { color:#94a3b8; font-size:0.7rem; }
            .ati-actions { display:flex; gap:6px; flex-wrap:wrap; }
            .ati-btn { padding:3px 10px; border-radius:6px; border:1px solid rgba(148,163,184,0.25); background:rgba(30,41,59,0.6); color:#cbd5e1; font-size:0.72rem; font-weight:600; cursor:pointer; transition:all 0.15s; }
            .ati-btn:hover { background:rgba(99,102,241,0.18); color:#e2e8f0; border-color:rgba(99,102,241,0.45); }
            .ati-btn[disabled] { opacity:0.4; cursor:default; }
            .ati-btn.active { background:rgba(99,102,241,0.25); color:#e2e8f0; border-color:rgba(99,102,241,0.6); }
            .ati-delta { color:#fb923c; font-size:0.68rem; margin-left:4px; }
        `;
        document.head.appendChild(style);
        _cssInjected = true;
    } catch (_) {}
}

const TIER_LABEL = { draft: 'Esborrany', quality: 'Qualitat', critical: 'Crític' };
const TIER_ICON  = { draft: '✏️',         quality: '⚡',       critical: '🏆' };

function _noopController() {
    return { refresh() {}, setTier() {}, getTier() { return null; }, destroy() {} };
}

// attachTierIndicator · munta el widget i retorna controller.
export function attachTierIndicator(container, options = {}) {
    if (!container || typeof container.innerHTML !== 'string') return _noopController();
    _ensureCss();

    const state = {
        taskKind:       options.taskKind || 'creative-narrative',
        taskTier:       TASK_TIERS.includes(options.taskTier) ? options.taskTier : 'draft',
        promptPreview:  options.promptPreview || '',
        projectId:      options.projectId || null,
        onChange:       typeof options.onChange === 'function' ? options.onChange : null,
        expectedOutputTokens: options.expectedOutputTokens || 800,
    };

    function _render() {
        const modelKey = pickModelForTier({ taskKind: state.taskKind, taskTier: state.taskTier });
        const model = modelKey ? AI_MODELS[modelKey] : null;
        const inputTokens = estimateTokensFromText(state.promptPreview);
        const estEur = modelKey ? estimatePromptCostEur({
            modelKey,
            prompt: state.promptPreview,
            expectedOutputTokens: state.expectedOutputTokens,
        }) : null;
        const sessionEur = getSessionTotalEur();
        const projectEur = state.projectId ? getProjectTotalEur(state.projectId) : 0;

        // Botons per cada tier amb delta de cost
        const tierButtons = TASK_TIERS.map(t => {
            const tModelKey = pickModelForTier({ taskKind: state.taskKind, taskTier: t });
            const tEur = tModelKey ? estimatePromptCostEur({
                modelKey: tModelKey,
                prompt: state.promptPreview,
                expectedOutputTokens: state.expectedOutputTokens,
            }) : null;
            const active = t === state.taskTier ? 'active' : '';
            const label = `${TIER_ICON[t]} ${TIER_LABEL[t]}`;
            const cost = (tEur !== null) ? `<span class="ati-delta">${formatCostEur(tEur)}</span>` : '';
            return `<button class="ati-btn ${active}" data-ati-tier="${t}" type="button">${label}${cost}</button>`;
        }).join('');

        container.innerHTML = `
            <div class="ati-shell">
                <div class="ati-row">
                    <div class="ati-model">
                        <span class="ati-tier ${state.taskTier}">${TIER_ICON[state.taskTier]} ${TIER_LABEL[state.taskTier]}</span>
                        <span>${model ? (model.id || modelKey) : '—'}</span>
                        ${model ? `<span class="ati-provider">${model.provider}</span>` : ''}
                    </div>
                    <div class="ati-cost" title="Cost estimat propera crida">${estEur !== null ? formatCostEur(estEur) : '—'}</div>
                </div>
                <div class="ati-row">
                    <div class="ati-actions">${tierButtons}</div>
                    <div class="ati-cost-session" title="Cost acumulat sessió · projecte">
                        Sessió · <strong>${formatCostEur(sessionEur)}</strong>${state.projectId ? ` · Projecte · <strong>${formatCostEur(projectEur)}</strong>` : ''}
                    </div>
                </div>
            </div>
        `;

        // Bind clicks
        container.querySelectorAll('[data-ati-tier]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const newTier = btn.getAttribute('data-ati-tier');
                if (!TASK_TIERS.includes(newTier) || newTier === state.taskTier) return;
                state.taskTier = newTier;
                _render();
                if (state.onChange) {
                    try { state.onChange(newTier, { modelKey: pickModelForTier({ taskKind: state.taskKind, taskTier: newTier }) }); }
                    catch (_) {}
                }
            });
        });
    }

    _render();

    // Auto-refresh quan arribi un cost-updated · UI sempre fresca
    const _onCost = () => _render();
    if (typeof window !== 'undefined' && window.addEventListener) {
        window.addEventListener('ai:cost-updated', _onCost);
    }

    return {
        refresh() { _render(); },
        setTier(newTier) {
            if (TASK_TIERS.includes(newTier)) {
                state.taskTier = newTier;
                _render();
            }
        },
        setPromptPreview(text) {
            state.promptPreview = text || '';
            _render();
        },
        getTier() { return state.taskTier; },
        getModelKey() { return pickModelForTier({ taskKind: state.taskKind, taskTier: state.taskTier }); },
        destroy() {
            if (typeof window !== 'undefined' && window.removeEventListener) {
                window.removeEventListener('ai:cost-updated', _onCost);
            }
            container.innerHTML = '';
        },
    };
}

// renderTierIndicatorHtml · placeholder per a SSR · mount-point buit
export function renderTierIndicatorHtml({ id = 'aiTierIndicator' } = {}) {
    return `<div id="${id}" class="ati-mount"></div>`;
}
