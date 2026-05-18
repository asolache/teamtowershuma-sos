// =============================================================================
// TEAMTOWERS SOS V11 — PROMPTS DEBUG VIEW (PROMPT-VIEWER sprint · @alvaro)
// Ruta · /js/views/PromptsDebugView.js  →  /prompts-debug
//
// Vista de transparència total · mostra els prompts EXACTES que la IA reb
// per cada task del flow de creació. L'usuari pot ·
//   - Veure system message · few-shot · user prompt complets
//   - Modificar context (sector · lifecycle · entity · vna_zoom · descripció)
//     per veure com canvia el prompt
//   - Copiar al clipboard per a polir externament
//   - Estimar tokens per task
//
// Pure read-only (no escriu res) · safe a producció.
// =============================================================================

import { TASK_KINDS, SYSTEM_BASE, FEW_SHOT_EXAMPLES, buildPrompt, listTasks, flattenPrompt } from '../core/vnaExpertPrompts.js';
import { CNAE_SECTORS, renderCnaeOptionsHtml, getCnae } from '../core/cnaeCatalog.js';
import { SECTOR_ROLES } from '../core/sectorRoleCatalog.js';
// v127 · domain detection inline al panel · permet override manual + diff
import { detectDomain, detectDomainsMulti, combineDetections, listDomains, getDomainPack } from '../core/domainDetector.js';

const TPL_VERSION = 'prompts-debug-v1';

const DEFAULT_CTX = Object.freeze({
    name:           'Cooperativa Cures Vall d\'Aro',
    description:    'Cooperativa d\'iniciativa social que ofereix serveis de cura a domicili per a gent gran al Baix Empordà · 12 sòcies treballadores · model SCCL · cicle MVP',
    sector:         'Q',
    lifecycle_stage:'mvp',
    entity_type:    'organization',
    vna_zoom:       'mid',
    project_type:   'founder-coop-tradicional',
    templateId:     'founder-coop-tradicional',
});

export default class PromptsDebugView {

    constructor() {
        if (typeof document !== 'undefined') document.title = 'Prompts debug · SOS';
        this._ctx = { ...DEFAULT_CTX };
        this._activeTask = 'classify-and-pick-socs';
    }

    async getHtml() {
        return this._renderShell();
    }

    async afterRender() {
        this._bind();
        this._renderPromptPanel();
    }

    async render() {
        const app = (typeof document !== 'undefined') ? document.getElementById('app') : null;
        if (!app) return;
        app.innerHTML = await this.getHtml();
        await this.afterRender();
    }

    _bind() {
        document.querySelectorAll('[data-task]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this._activeTask = e.currentTarget.dataset.task;
                document.querySelectorAll('[data-task]').forEach(b => b.classList.toggle('active', b === e.currentTarget));
                this._renderPromptPanel();
            });
        });
        document.querySelectorAll('[data-ctx]').forEach(el => {
            el.addEventListener('change', (e) => {
                this._ctx[e.currentTarget.dataset.ctx] = e.currentTarget.value;
                this._renderPromptPanel();
            });
            el.addEventListener('input', (e) => {
                if (e.currentTarget.tagName === 'TEXTAREA') {
                    this._ctx[e.currentTarget.dataset.ctx] = e.currentTarget.value;
                    this._renderPromptPanel();
                }
            });
        });
        document.getElementById('pdResetCtx')?.addEventListener('click', () => {
            this._ctx = { ...DEFAULT_CTX };
            this.render();
        });
        // v132c · A/B Lab estàtic (sense LLM)
        document.getElementById('pdAbLabRun')?.addEventListener('click', () => this._runAbLab());
        // v132f · A/B Lab live (LLM real) + dropdown de casos benchmark
        document.getElementById('pdAbLabRunLive')?.addEventListener('click', () => this._runAbLabLive());
        // v160 · Anchoring Lab · cross-project A/B de 3 perfils de context
        document.getElementById('pdAnchoringLabRun')?.addEventListener('click', () => this._runAnchoringLab());
        const benchSel = document.getElementById('pdBenchmarkCase');
        if (benchSel) {
            this._loadBenchmarkCases().then(() => {
                benchSel.addEventListener('change', (e) => this._applyBenchmarkCase(e.target.value));
            });
        }
    }

    // v132f · carrega els 20 casos canonical i omple el dropdown
    async _loadBenchmarkCases() {
        const sel = document.getElementById('pdBenchmarkCase');
        if (!sel) return;
        try {
            const res = await fetch('/knowledge/benchmarks/vna-quality-cases.json');
            if (!res.ok) throw new Error('fetch ' + res.status);
            const data = await res.json();
            this._benchmarkCases = Array.isArray(data?.cases) ? data.cases : [];
            for (const c of this._benchmarkCases) {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = c.id + ' · ' + (c.name || '').slice(0, 28);
                sel.appendChild(opt);
            }
        } catch (e) {
            // No critical · dropdown buit
            console.warn('[PromptsDebug] benchmark cases unavailable ·', e?.message);
        }
    }

    // v132f · aplica un cas benchmark al context · re-render
    _applyBenchmarkCase(caseId) {
        if (!caseId || !this._benchmarkCases) return;
        const c = this._benchmarkCases.find(x => x.id === caseId);
        if (!c) return;
        this._ctx.name        = c.name;
        this._ctx.description = c.description;
        this._ctx.sector      = c.sector;
        this.render();
    }

    // v132f · executa A/B test REAL amb LLM (usa generateWithProvider · necessita API key a /settings)
    async _runAbLabLive() {
        const out = document.getElementById('pdAbLabResult');
        if (!out) return;
        out.innerHTML = '<span style="color:var(--accent-orange);">⏳ Cridant LLM real (FULL i SLIM en paral·lel)…</span>';
        try {
            const { runABTest } = await import('../core/promptABTestService.js');
            const { generateWithProvider } = await import('../core/aiProviderService.js');
            const ctx = this._buildContext();
            const r = await runABTest({
                context: { name: ctx.name, description: ctx.description, sector: ctx.sector, vna_zoom: ctx.vna_zoom },
                provider: generateWithProvider,
                onProgress: (p) => {
                    if (p.step === 'start') out.innerHTML = '<span style="color:var(--accent-orange);">⏳ A=' + p.promptA + 'tk · B=' + p.promptB + 'tk · esperant LLM…</span>';
                },
            });
            const a = r.variants?.A; const b = r.variants?.B; const cmp = r.comparison;
            const errA = a?.error ? '<span style="color:var(--accent-red);">⚠ ' + this._esc(a.error.slice(0, 60)) + '</span>' : '';
            const errB = b?.error ? '<span style="color:var(--accent-red);">⚠ ' + this._esc(b.error.slice(0, 60)) + '</span>' : '';
            out.innerHTML = `
                <div style="background:var(--bg-elevated);border-radius:6px;padding:10px 12px;border-left:3px solid var(--accent-orange);">
                    <div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-bottom:6px;">
                        <strong>🏆 Winner · ${this._esc(cmp?.winner || '—')}</strong>
                        <code>${r.ms}ms</code>
                    </div>
                    <div style="display:flex;justify-content:space-between;"><strong>A · FULL</strong><code>${a?.approxTokens || '—'} tk · score ${a?.score?.score ?? '—'} ${errA}</code></div>
                    <div style="display:flex;justify-content:space-between;color:#22c55e;"><strong>B · SLIM</strong><code>${b?.approxTokens || '—'} tk · score ${b?.score?.score ?? '—'} ${errB}</code></div>
                    <p style="margin:8px 0 0;font-size:0.72rem;color:var(--text-muted);">ΔScore · ${cmp?.deltaScore ?? '—'} · ${cmp?.summary ? this._esc(cmp.summary) : ''}</p>
                </div>`;
        } catch (e) {
            out.innerHTML = '<span style="color:var(--accent-red);">Error LLM · ' + this._esc(e?.message || String(e)) + ' · configura API key a /settings</span>';
        }
    }

    // v160 · _runAnchoringLab · executa A/B cross-projecte amb 3 perfils de
    // context (sos-current · verna-minimal · verna-guided) i 5 projectes
    // diversos · calcula mètriques d'anchoring · taula comparativa.
    async _runAnchoringLab() {
        const out = document.getElementById('pdAnchoringResult');
        if (!out) return;
        const PROFILES  = ['sos-current', 'verna-minimal', 'verna-guided'];
        const PROJECTS = [
            { id: 'consultoria-ai',   name: 'Consultoria AI per a PYMES',
              description: 'Consultoria boutique de 3 sòcies que ajuden PYMES industrials del Bages a integrar IA generativa als seus processos de venda i operacions · model SCCL · cicle MVP',
              sector: 'M' },
            { id: 'agro-cooperativa', name: 'Cooperativa agroecològica',
              description: 'Cooperativa de productors agroecològics del Pirineu · 8 famílies · venda directa i caixes setmanals a Barcelona · cicle MVP en transició a validació',
              sector: 'A' },
            { id: 'arts-companyia',   name: 'Companyia teatre comunitari',
              description: 'Companyia de teatre comunitari amb 12 actors no professionals que crea espectacles a partir de les històries del barri del Raval · finançament híbrid (taquilla + ajuts) · cicle validation',
              sector: 'R' },
            { id: 'edu-cooperativa',  name: 'Escola cooperativa de famílies',
              description: 'Escola d\'iniciativa social on les famílies són sòcies cooperativistes · 60 alumnes 3-12 anys · pedagogia activa · 8 mestres + cuiner + administrativa · cicle scale',
              sector: 'P' },
            { id: 'sports-club',      name: 'Club esportiu amateur',
              description: 'Club de futbol amateur de barri amb 4 equips formatius + 1 sènior · 60 jugadors + 8 entrenadors voluntaris · finançament quotes + petits patrocinadors · cicle mvp',
              sector: 'R' },
        ];

        const preferredEngine = (document.getElementById('pdAnchoringProvider')?.value) || 'anthropic';
        out.innerHTML = '<span style="color:#22c55e;">⏳ Anchoring Lab · ' + (PROJECTS.length * PROFILES.length) + ' crides LLM (' + preferredEngine + ', fallback auto) · 30-90s…</span>';

        try {
            const { quickSuggestMap } = await import('../core/vnaQuickSuggest.js');
            const { Orchestrator } = await import('../core/Orchestrator.js');
            const { FEW_SHOT_EXAMPLES } = await import('../core/vnaExpertPrompts.js');
            const { evaluateValueMapShape } = await import('../core/vnaShapeEvaluators.js');

            // v160.1 · adaptador Orchestrator.callLLM → generateWithProvider({system,user})
            // (igual pattern que ValueMapView._runAISuggestionQuickSuggest · usa
            // l'auto-fallback del Orchestrator entre providers configurats)
            const provider = async (_modelKey, opts) => {
                const result = await Orchestrator.callLLM({
                    preferredEngine,
                    systemPrompt: opts.systemPrompt,
                    userPrompt:   opts.userPrompt,
                    responseFormat: 'json_object',
                    temperature:  opts.temperature ?? 0.4,
                });
                const text = typeof result?.content === 'string' ? result.content : JSON.stringify(result?.content || {});
                return { text, usage: result?.usage || null };
            };

            // Build set of fewshot literal role names (lowercased) for overlap metric
            const fewShotRoleNames = new Set();
            Object.values(FEW_SHOT_EXAMPLES).forEach(ex => {
                try {
                    const parsed = JSON.parse(ex.assistantOutput);
                    (parsed.roles || []).forEach(r => {
                        if (r.name) fewShotRoleNames.add(String(r.name).toLowerCase());
                        if (r.kind) fewShotRoleNames.add(String(r.kind).toLowerCase());
                    });
                } catch (_) {}
            });

            const tasks = [];
            for (const proj of PROJECTS) {
                for (const profile of PROFILES) {
                    tasks.push((async () => {
                        const t0 = Date.now();
                        try {
                            const r = await quickSuggestMap({
                                context: { name: proj.name, description: proj.description, sector: proj.sector, vna_zoom: 'meso' },
                                slim: true,
                                qualityThreshold: 60,
                                generateWithProvider: provider,
                                contextProfile: profile,
                            });
                            return { proj: proj.id, profile, ok: r.ok, ms: Date.now() - t0, map: r.map, score: r.score, tokens: r.tokens, escalated: r.escalatedToFull, error: r.error };
                        } catch (e) {
                            return { proj: proj.id, profile, ok: false, ms: Date.now() - t0, error: e?.message || String(e) };
                        }
                    })());
                }
            }
            const results = await Promise.all(tasks);

            // Compute metrics per profile
            const byProfile = {};
            PROFILES.forEach(p => { byProfile[p] = results.filter(r => r.profile === p); });

            const allRoleNames = {};
            PROFILES.forEach(p => {
                allRoleNames[p] = new Set();
                byProfile[p].forEach(r => {
                    (r.map?.roles || []).forEach(role => {
                        if (role.name) allRoleNames[p].add(String(role.name).toLowerCase());
                    });
                });
            });

            const fewshotOverlapPct = (profile) => {
                const set = allRoleNames[profile];
                if (!set.size) return 0;
                let hits = 0;
                set.forEach(n => { if (fewShotRoleNames.has(n)) hits++; });
                return Math.round((hits / set.size) * 100);
            };

            const crossProjectDiversity = (profile) => {
                const results_p = byProfile[profile].filter(r => r.ok && r.map?.roles?.length);
                if (results_p.length < 2) return 0;
                const totalRoles = results_p.reduce((s, r) => s + (r.map.roles?.length || 0), 0);
                const unique = allRoleNames[profile].size;
                return totalRoles > 0 ? Math.round((unique / totalRoles) * 100) : 0;
            };

            const avgShapeScore = (profile) => {
                const results_p = byProfile[profile].filter(r => r.ok && r.map);
                if (!results_p.length) return 0;
                const scores = results_p.map(r => {
                    try { return evaluateValueMapShape(r.map).score; } catch (_) { return 0; }
                });
                return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
            };

            const avgTokens = (profile) => {
                const results_p = byProfile[profile].filter(r => r.ok);
                if (!results_p.length) return 0;
                return Math.round(results_p.reduce((s, r) => s + (r.tokens || 0), 0) / results_p.length);
            };

            const okCount = (profile) => byProfile[profile].filter(r => r.ok).length;

            // Render comparison table
            const profileColor = { 'sos-current': '#a855f7', 'verna-minimal': '#22c55e', 'verna-guided': '#3b82f6' };
            const metricsHtml = `
                <div style="margin-top:10px;background:var(--bg-elevated);border-radius:6px;padding:10px;border-left:3px solid #22c55e;">
                    <table style="width:100%;border-collapse:collapse;font-size:0.78rem;">
                        <thead><tr style="text-align:left;border-bottom:1px solid var(--border-default);">
                            <th style="padding:4px;">Profile</th>
                            <th style="padding:4px;">OK / 5</th>
                            <th style="padding:4px;" title="% rols del output que coincideixen amb FEW_SHOT literal · LOWER = MILLOR">fewshot↓</th>
                            <th style="padding:4px;" title="% rols únics entre els 5 projectes · HIGHER = MILLOR">diversity↑</th>
                            <th style="padding:4px;" title="Shape eval score promig · HIGHER = MILLOR">shape↑</th>
                            <th style="padding:4px;" title="Tokens del prompt · LOWER = més barat">tokens</th>
                        </tr></thead>
                        <tbody>
                        ${PROFILES.map(p => `
                            <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
                                <td style="padding:4px;color:${profileColor[p]};font-weight:600;">${p}</td>
                                <td style="padding:4px;">${okCount(p)}/${PROJECTS.length}</td>
                                <td style="padding:4px;font-family:var(--font-mono);">${fewshotOverlapPct(p)}%</td>
                                <td style="padding:4px;font-family:var(--font-mono);">${crossProjectDiversity(p)}%</td>
                                <td style="padding:4px;font-family:var(--font-mono);">${avgShapeScore(p)}</td>
                                <td style="padding:4px;font-family:var(--font-mono);">${avgTokens(p)}</td>
                            </tr>
                        `).join('')}
                        </tbody>
                    </table>
                </div>`;

            // Render per-project details (collapsed)
            const detailsHtml = PROJECTS.map(proj => {
                const rows = PROFILES.map(p => {
                    const r = results.find(x => x.proj === proj.id && x.profile === p);
                    if (!r) return '';
                    if (!r.ok) return `<li style="color:var(--accent-red);">${p} · ❌ ${this._esc(r.error || 'failed')}</li>`;
                    const roles = (r.map?.roles || []).map(rl => rl.name).join(' · ');
                    return `<li><strong style="color:${profileColor[p]};">${p}</strong> · ${(r.map?.roles || []).length} rols · ${roles ? this._esc(roles.slice(0, 200)) : '(buit)'}</li>`;
                }).join('');
                return `<details style="margin-top:6px;"><summary style="cursor:pointer;color:var(--text-secondary);">${this._esc(proj.name)}</summary><ul style="margin:4px 0 0 14px;padding:0;list-style:disc;">${rows}</ul></details>`;
            }).join('');

            // v160.1 · detecció d'errors recurrents · ajuda diagnòstic
            const errors = results.filter(r => !r.ok).map(r => r.error || '').join(' · ');
            let warningBanner = '';
            if (errors) {
                const isBilling = /credit|quota|insufficient|402|429|billing|exceeded|balance/i.test(errors);
                const isAuth    = /401|403|api[\s_-]?key|unauthor|forbidden/i.test(errors);
                const isModelKey= /modelKey unknown|provider desconegut/i.test(errors);
                let hint = '';
                if (isBilling)   hint = '💳 Sembla problema de saldo/quota. Prova un altre provider al dropdown.';
                else if (isAuth) hint = '🔑 API key no configurada o invàlida. Configura-la a /settings.';
                else if (isModelKey) hint = '⚠ ModelKey error · reporta bug.';
                else if (errors) hint = 'ℹ Veure detalls per projecte més avall.';
                warningBanner = `<div style="background:rgba(239,68,68,0.1);border-left:3px solid var(--accent-red);padding:8px 10px;margin-top:8px;border-radius:4px;font-size:0.78rem;">
                    ${hint} <code style="color:var(--text-muted);">${this._esc(errors.slice(0, 120))}</code>
                </div>`;
            }
            out.innerHTML = warningBanner + metricsHtml + `<div style="margin-top:10px;">${detailsHtml}</div>`;
            // Store last results for the user to inspect via console
            try { window.__sos_anchoring_lab = { results, metrics: { fewshotOverlap: PROFILES.map(p => ({ p, v: fewshotOverlapPct(p) })), diversity: PROFILES.map(p => ({ p, v: crossProjectDiversity(p) })), shape: PROFILES.map(p => ({ p, v: avgShapeScore(p) })) } }; } catch (_) {}
        } catch (e) {
            out.innerHTML = '<span style="color:var(--accent-red);">Anchoring Lab error · ' + this._esc(e?.message || String(e)) + ' · configura API key a /settings</span>';
        }
    }

    _buildContext() {
        // Build per-task context · cada task necessita inputs diferents
        const c = this._ctx;
        const ctx = {
            name: c.name,
            description: c.description,
            sector: c.sector,
            entity_type: c.entity_type,
            project_type: c.project_type,
            lifecycle_stage: c.lifecycle_stage,
            vna_zoom: c.vna_zoom,
        };
        // v127 · domainDetection per design-value-map-rich · auto + override
        if (this._activeTask === 'design-value-map-rich') {
            if (c.domainOverride && c.domainOverride !== 'auto' && c.domainOverride !== 'none') {
                const pack = getDomainPack(c.domainOverride);
                if (pack) ctx.domainDetection = { ...pack, domain: pack.id, confidence: 1.0, via: 'manual-override' };
            } else if (c.domainOverride !== 'none') {
                const auto = detectDomain({ name: c.name, description: c.description, sector: c.sector });
                if (auto) ctx.domainDetection = { ...auto, via: 'keywords' };
            }
            this._lastDomainDetection = ctx.domainDetection || null;
        }
        if (this._activeTask === 'classify-and-pick-socs') {
            ctx.candidates = [
                { relpath: 'socs/sectors/' + (c.sector || 'M') + '.md', title: 'Sector ' + (c.sector || 'M'), sector_cnae: c.sector, score: 100, reasons: ['sector exact'] },
                { relpath: 'socs/lifecycle/' + (c.lifecycle_stage || 'mvp') + '.md', title: 'Fase ' + (c.lifecycle_stage || 'mvp'), phase: c.lifecycle_stage, score: 90, reasons: ['lifecycle match'] },
                { relpath: 'socs/la-colla.md', title: 'La Colla · VNA', sos_context: 'critical', score: 80, reasons: ['TT critical'] },
            ];
        } else if (this._activeTask === 'generate-sops-from-soc') {
            ctx.soc = { title: 'La Colla · procés VNA', purpose: 'Consultoria multi-sessió Verna Allee', excerpt: 'Mapatge xarxa de valor del client...' };
            ctx.project_ctx = { name: c.name, description: c.description, sector: c.sector, lifecycle_stage: c.lifecycle_stage, entity_type: c.entity_type };
            ctx.role_kinds = ['founder', 'operations', 'creator', 'reviewer', 'facilitator'];
            const sectorTable = SECTOR_ROLES[String(c.sector || '').toUpperCase()] || SECTOR_ROLES.DEFAULT;
            ctx.sector_role_examples = Object.entries(sectorTable).slice(0, 5).map(([k, v]) => ({ kind: k, name: v.name, description: v.description }));
        } else if (this._activeTask === 'generate-wos-from-sop') {
            ctx.sop = {
                id: 'sop-x', title: 'Facilitar sessió Verna Allee 2h amb client',
                role_ref: 'operations',
                steps: [
                    { id: 's1', label: 'Preparar agenda', deliverable_kind: 'doc', approval_rule: 'manual' },
                    { id: 's2', label: 'Facilitar sessió', deliverable_kind: 'workshop', approval_rule: 'manual' },
                    { id: 's3', label: 'Enviar acta', deliverable_kind: 'comm', approval_rule: 'tdd' },
                ],
            };
            ctx.project_ctx = { name: c.name, description: c.description, sector: c.sector, lifecycle_stage: c.lifecycle_stage, entity_type: c.entity_type };
        } else if (this._activeTask === 'enrich-value-map') {
            ctx.currentTemplate = { roles: [{ id: 'r1', kind: 'founder', name: 'Founder' }], transactions: [], deliverables: [], sops: [] };
        } else if (this._activeTask === 'personalize-canvas' || this._activeTask === 'personalize-pitch') {
            // no extra
        } else if (this._activeTask === 'expand-sop') {
            ctx.roleName = 'Operations'; ctx.sopTitle = 'SOP de ' + c.sector; ctx.deliverable = 'Acta sessió';
        } else if (this._activeTask === 'generate-soc') {
            ctx.sops = [{ id: 'sop-1', role_ref: 'founder', title: 'SOP founder' }];
        }
        return ctx;
    }

    _renderPromptPanel() {
        const panel = document.getElementById('pdPanel');
        if (!panel) return;
        let prompt;
        try {
            prompt = buildPrompt({
                templateId: this._ctx.templateId,
                taskKind: this._activeTask,
                context: this._buildContext(),
            });
        } catch (e) {
            panel.innerHTML = '<div class="pd-err">Error · ' + this._esc(e?.message || String(e)) + '</div>';
            return;
        }

        const flatLen = flattenPrompt(prompt).length;
        const fewShotHtml = (prompt.fewShot || []).map(m => `
            <div class="pd-msg pd-msg-${m.role}">
                <div class="pd-msg-role">[${m.role.toUpperCase()}]</div>
                <pre class="pd-msg-body">${this._esc(m.content)}</pre>
            </div>`).join('');

        // v127 · domain panel · només per design-value-map-rich
        const domainPanelHtml = (this._activeTask === 'design-value-map-rich') ? this._renderDomainPanel() : '';

        panel.innerHTML = `
            <div class="pd-stats">
                <span class="pd-stat-pill">📊 ~${prompt.approxTokens} tokens</span>
                <span class="pd-stat-pill">📏 ${flatLen.toLocaleString()} chars (flat)</span>
                <span class="pd-stat-pill">⚙ task · <strong>${this._esc(this._activeTask)}</strong></span>
                <button class="pd-copy-btn" data-copy-target="pdFlat">📋 Copia tot el prompt</button>
            </div>

            ${domainPanelHtml}

            <div class="pd-section">
                <h3>📜 SYSTEM (manifest Agent SOS V11)</h3>
                <pre class="pd-msg-body pd-system">${this._esc(prompt.system)}</pre>
            </div>

            ${fewShotHtml ? `<div class="pd-section">
                <h3>🎓 FEW-SHOT EXAMPLES (template · ${this._esc(this._ctx.templateId || 'none')})</h3>
                ${fewShotHtml}
            </div>` : ''}

            <div class="pd-section">
                <h3>📨 USER (task-specific prompt amb el teu context)</h3>
                <pre class="pd-msg-body pd-user">${this._esc(prompt.user)}</pre>
            </div>

            <textarea id="pdFlat" style="position:absolute;left:-9999px;">${this._esc(flattenPrompt(prompt))}</textarea>
        `;

        // Bind copy button
        panel.querySelector('[data-copy-target]')?.addEventListener('click', (e) => {
            const target = document.getElementById(e.currentTarget.dataset.copyTarget);
            if (!target) return;
            target.select();
            try {
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(target.value).then(() => {
                        e.currentTarget.textContent = '✓ Copiat!';
                        setTimeout(() => { e.currentTarget.textContent = '📋 Copia tot el prompt'; }, 1500);
                    });
                } else {
                    document.execCommand('copy');
                    e.currentTarget.textContent = '✓ Copiat!';
                }
            } catch (_) {}
        });

        // v127 · domain override + alt buttons
        const sel = panel.querySelector('#pdDomainOverride');
        if (sel) {
            sel.addEventListener('change', (e) => {
                this._ctx.domainOverride = e.target.value;
                this._renderPromptPanel();
            });
        }
        panel.querySelectorAll('[data-domain-alt]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this._ctx.domainOverride = e.currentTarget.getAttribute('data-domain-alt');
                this._renderPromptPanel();
            });
        });
    }

    _renderShell() {
        const tasks = listTasks();
        return `
        <style>
            .pd-shell { min-height:100dvh; background:var(--bg-dark); color:var(--text-main); font-family:var(--font-base); padding:14px 18px 4rem; }
            .pd-hero { background:linear-gradient(135deg,rgba(168,85,247,0.18),rgba(99,102,241,0.10)); border:1px solid rgba(168,85,247,0.3); border-radius:10px; padding:1rem 1.4rem; margin-bottom:1rem; }
            .pd-hero h1 { margin:0 0 0.3rem 0; font-size:1.3rem; }
            .pd-hero p  { margin:0; color:var(--text-secondary); font-size:0.88rem; line-height:1.5; }

            .pd-grid { display:grid; grid-template-columns:300px 1fr; gap:14px; align-items:start; }
            @media (max-width: 920px) { .pd-grid { grid-template-columns:1fr; } }

            .pd-side { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:8px; padding:1rem; position:sticky; top:14px; }
            .pd-side h3 { margin:0 0 8px 0; font-size:0.8rem; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.05em; }
            .pd-task-btn { display:block; width:100%; text-align:left; padding:7px 10px; margin-bottom:3px; background:transparent; border:1px solid transparent; border-radius:5px; color:var(--text-secondary); cursor:pointer; font-size:0.82rem; font-family:var(--font-base); }
            .pd-task-btn:hover { background:rgba(255,255,255,0.04); color:var(--text-main); }
            .pd-task-btn.active { background:rgba(99,102,241,0.18); color:var(--accent-indigo); border-color:rgba(99,102,241,0.35); font-weight:600; }

            .pd-ctx-field { margin-bottom:0.6rem; }
            .pd-ctx-field label { font-size:0.7rem; color:var(--text-muted); display:block; margin-bottom:3px; text-transform:uppercase; letter-spacing:0.04em; }
            .pd-ctx-field input, .pd-ctx-field select, .pd-ctx-field textarea {
                width:100%; padding:5px 8px; background:var(--bg-dark); color:var(--text-main);
                border:1px solid var(--border-default); border-radius:4px; font-size:0.82rem; font-family:var(--font-base); box-sizing:border-box;
            }
            .pd-ctx-field textarea { min-height:60px; resize:vertical; font-family:var(--font-mono); font-size:0.78rem; }
            .pd-reset { width:100%; padding:6px; background:rgba(255,255,255,0.04); border:1px solid var(--border-default); color:var(--text-secondary); border-radius:5px; cursor:pointer; font-size:0.78rem; margin-top:8px; }
            .pd-reset:hover { background:rgba(99,102,241,0.12); color:var(--accent-indigo); }

            .pd-main { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:8px; padding:1rem 1.2rem; min-height:600px; }
            .pd-stats { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:14px; align-items:center; }
            .pd-stat-pill { background:rgba(255,255,255,0.06); border:1px solid var(--border-default); padding:3px 9px; border-radius:999px; font-size:0.75rem; color:var(--text-secondary); font-family:var(--font-mono); }
            .pd-stat-pill strong { color:var(--accent-indigo); }
            .pd-copy-btn { margin-left:auto; padding:5px 12px; background:linear-gradient(90deg,#3b82f6,#6366f1); border:none; border-radius:6px; color:#fff; font-size:0.78rem; font-weight:600; cursor:pointer; }
            .pd-copy-btn:hover { filter:brightness(1.15); }

            .pd-section { margin-bottom:1.2rem; }
            .pd-section h3 { margin:0 0 8px 0; font-size:0.85rem; color:var(--accent-indigo); }
            .pd-msg { margin-bottom:8px; }
            .pd-msg-role { font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:3px; font-family:var(--font-mono); }
            .pd-msg-body {
                background:rgba(0,0,0,0.4); padding:12px 14px; border-radius:6px; color:#e6e6e6;
                font-family:var(--font-mono); font-size:0.78rem; line-height:1.55; white-space:pre-wrap;
                max-height:540px; overflow-y:auto; border:1px solid var(--border-default); margin:0;
            }
            .pd-system { border-left:3px solid #a855f7; }
            .pd-user { border-left:3px solid #22c55e; }
            .pd-msg-user .pd-msg-body { border-left:3px solid #94a3b8; }
            .pd-msg-assistant .pd-msg-body { border-left:3px solid #6366f1; }
            .pd-err { padding:1rem; background:rgba(239,68,68,0.1); border:1px solid #ef4444; border-radius:6px; color:#fca5a5; }
        </style>

        <div class="pd-shell">
            <div class="pd-hero">
                <h1>🔍 Prompts debug · transparència total IA</h1>
                <p>Veu el prompt EXACTE que la IA reb per cada task del flow de creació. Modifica el context i veuràs com canvia el system + few-shot + user. Copia per polir externament.</p>
            </div>

            <div class="pd-grid">
                <aside class="pd-side">
                    <h3>Task</h3>
                    ${tasks.map(t => `<button class="pd-task-btn ${t === this._activeTask ? 'active' : ''}" data-task="${this._esc(t)}">${this._esc(t)}</button>`).join('')}

                    <h3 style="margin-top:1rem;">Context (edita per veure el canvi)</h3>
                    <div class="pd-ctx-field">
                        <label>Nom projecte</label>
                        <input type="text" data-ctx="name" value="${this._esc(this._ctx.name)}">
                    </div>
                    <div class="pd-ctx-field">
                        <label>Descripció</label>
                        <textarea data-ctx="description">${this._esc(this._ctx.description)}</textarea>
                    </div>
                    <div class="pd-ctx-field">
                        <label>Sector CNAE</label>
                        <select data-ctx="sector">${renderCnaeOptionsHtml({ selected: this._ctx.sector, includeOther: false })}</select>
                    </div>
                    <div class="pd-ctx-field">
                        <label>Fase lifecycle</label>
                        <select data-ctx="lifecycle_stage">
                            ${['idea', 'mvp', 'validation', 'scale'].map(s => `<option value="${s}" ${s === this._ctx.lifecycle_stage ? 'selected' : ''}>${s}</option>`).join('')}
                        </select>
                    </div>
                    <div class="pd-ctx-field">
                        <label>Tipus entitat</label>
                        <select data-ctx="entity_type">
                            ${['organization', 'business', 'sos', 'project_internal'].map(s => `<option value="${s}" ${s === this._ctx.entity_type ? 'selected' : ''}>${s}</option>`).join('')}
                        </select>
                    </div>
                    <div class="pd-ctx-field">
                        <label>Zoom VNA</label>
                        <select data-ctx="vna_zoom">
                            ${['macro', 'mid', 'micro'].map(s => `<option value="${s}" ${s === this._ctx.vna_zoom ? 'selected' : ''}>${s}</option>`).join('')}
                        </select>
                    </div>
                    <div class="pd-ctx-field">
                        <label>Template (few-shot)</label>
                        <select data-ctx="templateId">
                            <option value="">— none —</option>
                            ${Object.keys(FEW_SHOT_EXAMPLES).map(t => `<option value="${t}" ${t === this._ctx.templateId ? 'selected' : ''}>${t}</option>`).join('')}
                        </select>
                    </div>
                    <button id="pdResetCtx" class="pd-reset">↺ Reset al context per defecte</button>

                    <h3 style="margin-top:1rem;color:var(--accent-purple);">🧪 A/B Lab (v132c+f)</h3>
                    <p style="font-size:0.78rem;color:var(--text-muted);">Compara prompt FULL vs SLIM · valida hipòtesi "menys context > més".</p>
                    <div class="pd-ctx-field">
                        <label>Cas benchmark (v132f)</label>
                        <select id="pdBenchmarkCase">
                            <option value="">— context lliure —</option>
                        </select>
                    </div>
                    <button id="pdAbLabRun" class="pd-reset" style="background:var(--accent-purple);color:#fff;border-color:var(--accent-purple);">▶ Compara prompts (estàtic · sense LLM)</button>
                    <button id="pdAbLabRunLive" class="pd-reset" style="background:var(--accent-orange);color:#fff;border-color:var(--accent-orange);margin-top:6px;">⚡ Run live A/B (LLM real · necessita API key)</button>
                    <div id="pdAbLabResult" style="margin-top:8px;font-size:0.78rem;"></div>

                    <h3 style="margin-top:1rem;color:#22c55e;">🧬 VNA Anchoring Lab (v160)</h3>
                    <p style="font-size:0.78rem;color:var(--text-muted);">Compara 3 perfils de context · sos-current vs verna-minimal vs verna-guided · 5 projectes diversos · mètriques d'anchoring (fewshot overlap · cross-project diversity).</p>
                    <div class="pd-ctx-field">
                        <label>Provider preferit (auto fallback)</label>
                        <select id="pdAnchoringProvider">
                            <option value="anthropic">anthropic (Claude)</option>
                            <option value="openai">openai (GPT)</option>
                            <option value="gemini">gemini (Google)</option>
                            <option value="deepseek">deepseek</option>
                            <option value="minimax">minimax</option>
                        </select>
                    </div>
                    <button id="pdAnchoringLabRun" class="pd-reset" style="background:#22c55e;color:#fff;border-color:#22c55e;margin-top:6px;">🧬 Run Anchoring A/B (LLM · 5 projectes × 3 perfils)</button>
                    <div id="pdAnchoringResult" style="margin-top:8px;font-size:0.78rem;"></div>
                </aside>

                <main id="pdPanel" class="pd-main">
                    <div style="padding:2rem;text-align:center;color:var(--text-muted);">Carregant prompt...</div>
                </main>
            </div>
        </div>`;
    }

    // v132c · panel A/B Lab · comparació estàtica FULL vs SLIM (sense LLM)
    // Si l'usuari té cas a la KB amb LLM provider · pot córrer runABTest real
    async _runAbLab() {
        const out = document.getElementById('pdAbLabResult');
        if (!out) return;
        out.innerHTML = '<span style="color:var(--text-muted);">⏳ Comparant FULL vs SLIM…</span>';
        try {
            const { buildPrompt } = await import('../core/vnaExpertPrompts.js');
            const { buildVariantBPrompt, scoreOutput } = await import('../core/promptABTestService.js');
            const ctx = this._buildContext();
            const full = buildPrompt({ taskKind: 'design-value-map-rich', context: ctx, slim: false });
            const slim = buildPrompt({ taskKind: 'design-value-map-rich', context: ctx, slim: true });
            const minB = buildVariantBPrompt(ctx);
            const saving = (((full.approxTokens - slim.approxTokens) / full.approxTokens) * 100).toFixed(0);
            const minPct = (((full.approxTokens - minB.approxTokens) / full.approxTokens) * 100).toFixed(0);
            out.innerHTML = `
                <div style="background:var(--bg-elevated);border-radius:6px;padding:8px 10px;border-left:3px solid var(--accent-purple);">
                    <div style="display:flex;justify-content:space-between;"><strong>FULL</strong><code>${full.approxTokens} tk</code></div>
                    <div style="display:flex;justify-content:space-between;color:#22c55e;"><strong>SLIM (v132c)</strong><code>${slim.approxTokens} tk · -${saving}%</code></div>
                    <div style="display:flex;justify-content:space-between;color:var(--accent-orange);"><strong>MINIMAL</strong><code>${minB.approxTokens} tk · -${minPct}%</code></div>
                    <p style="margin:8px 0 0;font-size:0.72rem;color:var(--text-muted);">SLIM manté els 5 principis Verna Allee · MODEL CASTELLER · contracte sortida. Per a A/B amb LLM real · usa <code>runABTest()</code> des de la KB.</p>
                </div>`;
        } catch (e) {
            out.innerHTML = '<span style="color:var(--accent-red);">Error · ' + this._esc(e?.message || String(e)) + '</span>';
        }
    }

    _esc(s) {
        if (s == null) return '';
        return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    // v127 · _renderDomainPanel · mostra el domini detectat + permet override
    // manual + ensenya els arquetip injectats al prompt. Bind handlers després.
    _renderDomainPanel() {
        const c = this._ctx;
        const det = this._lastDomainDetection;
        const allDomains = listDomains();
        const multi = detectDomainsMulti({ name: c.name, description: c.description, sector: c.sector, topN: 3 });
        const altSuggestions = multi.filter(d => d.domain !== det?.domain).slice(0, 2);

        const detBox = det ? `
            <div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:8px;padding:10px 14px;">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
                    <strong style="color:#22c55e;">✓ ${this._esc(det.label)}</strong>
                    <span style="font-family:var(--font-mono);font-size:0.72rem;color:var(--text-muted);">
                        via <code>${this._esc(det.via || 'keywords')}</code> · confidence ${det.confidence ?? '—'}${det.matchCount != null ? ' · ' + det.matchCount + ' kw match' : ''}
                    </span>
                </div>
                <details style="margin-top:8px;">
                    <summary style="cursor:pointer;font-size:0.78rem;color:var(--text-secondary);">Mostra els ${det.archetypes?.length || 0} arquetip injectats al prompt</summary>
                    <div style="margin-top:8px;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:6px;font-size:0.78rem;">
                        ${(det.archetypes || []).map(a => `
                            <div style="background:var(--bg-elevated);border-radius:4px;padding:6px 8px;border-left:3px solid var(--accent-indigo);">
                                <strong>${this._esc(a.name)}</strong> <em style="color:var(--text-muted);">[${this._esc(a.castell)}]</em>
                                <div style="color:var(--text-muted);font-size:0.72rem;margin-top:2px;">${this._esc(a.desc || '')}</div>
                            </div>`).join('')}
                    </div>
                </details>
            </div>` : `
            <div style="background:rgba(250,204,21,0.08);border:1px solid rgba(250,204,21,0.3);border-radius:8px;padding:10px 14px;color:var(--accent-orange);">
                ⚠ Sense detecció · el prompt usarà arquetip GENÈRICS del catàleg de sector (5 rols). Fes override manual si vols injectar arquetip d'un sub-domini específic.
            </div>`;

        const overrideOptions = `
            <option value="auto" ${(!c.domainOverride || c.domainOverride === 'auto') ? 'selected' : ''}>🤖 Auto-detect (keyword matching)</option>
            <option value="none" ${c.domainOverride === 'none' ? 'selected' : ''}>❌ Sense detecció (rols genèrics)</option>
            <optgroup label="── Override manual ──">
                ${allDomains.map(d => `<option value="${this._esc(d.id)}" ${c.domainOverride === d.id ? 'selected' : ''}>${this._esc(d.label)} (${d.archetypeCount} rols)</option>`).join('')}
            </optgroup>`;

        const altHtml = altSuggestions.length ? `
            <div style="margin-top:8px;font-size:0.78rem;color:var(--text-muted);">
                💡 Alternatives detectades · ${altSuggestions.map(d => `<button type="button" data-domain-alt="${this._esc(d.domain)}" style="background:none;border:1px solid var(--border-default);padding:2px 8px;border-radius:4px;color:var(--accent-indigo);cursor:pointer;font-size:0.75rem;">${this._esc(d.label)} (${d.confidence})</button>`).join(' · ')}
            </div>` : '';

        return `
            <div class="pd-section" id="pdDomainPanel" style="border:1px solid var(--border-default);border-radius:var(--radius-md);padding:14px 16px;background:var(--bg-panel);">
                <h3 style="margin:0 0 10px 0;color:var(--accent-purple);">🎯 Detecció de sub-domini (VNA quality booster)</h3>
                <p style="font-size:0.78rem;color:var(--text-muted);margin:0 0 10px 0;">
                    Per generar el mapa de valor amb rols realment adaptats (no genèrics) · el SOS infereix el sub-domini del projecte i injecta arquetip específics al prompt. Pots fer override manual per provar diferents perspectives.
                </p>
                ${detBox}
                ${altHtml}
                <div style="margin-top:10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                    <label style="font-size:0.78rem;color:var(--text-secondary);">Override ·</label>
                    <select id="pdDomainOverride" style="background:var(--bg-elevated);color:var(--text-main);border:1px solid var(--border-default);padding:5px 8px;border-radius:4px;font-size:0.78rem;">
                        ${overrideOptions}
                    </select>
                </div>
            </div>`;
    }

    destroy() {}
}

export { TPL_VERSION };
