// =============================================================================
// TEAMTOWERS SOS V11 — WORKSHOPS VIEW
// Ruta: /js/views/WorkshopsView.js
//
// Gestión de talleres Fent Pinya (y otros formatos):
//   - Listado agrupado por estado: propuesta | agendado | impartido | cobrado
//   - Crear taller (modal)
//   - Cambiar estado (1 click)
//   - Borrar
//   - Generar propuesta comercial vía LLM con contexto SOC+SOP (H2.3)
//
// Persistencia: nodos `type: 'workshop'` y `type: 'deliverable'` en KB.
// =============================================================================

import { store }           from '../core/store.js';
import { KB }              from '../core/kb.js';
import { KnowledgeLoader } from '../core/KnowledgeLoader.js';

// Orchestrator se importa dinámicamente con cache-bust en los puntos que
// llaman al LLM para que fixes del parser de respuestas (BUG-002) se
// apliquen sin requerir purga manual de caché del navegador.

const STATUSES = [
    { id: 'propuesta', label: 'Propuesta',  color: '#94a3b8', emoji: '📝' },
    { id: 'agendado',  label: 'Agendado',   color: '#6366f1', emoji: '📅' },
    { id: 'impartido', label: 'Impartido',  color: '#22c55e', emoji: '🎯' },
    { id: 'cobrado',   label: 'Cobrado',    color: '#16a34a', emoji: '💶' },
];

// H2.6 · Catálogo de servicios. Cada entrada mapea el tipo a los SOCs/SOPs
// que el KnowledgeLoader inyectará en buildContext para Propuesta/Informe IA.
// Si añades un servicio nuevo aquí, asegúrate de que existan en knowledge/.
const SERVICE_TYPES = [
    {
        id: 'fent-pinya',
        label: '🏰 Fent Pinya · Taller participativo (2 h)',
        socs: ['teamtowers-brand', 'fent-pinya'],
        sops: ['fent-pinya-taller'],
        description: 'Taller experiencial castellero hasta 1.000 pax.',
    },
    {
        id: 'castellers-demo',
        label: '🌟 Demo castellera · Espectáculo (30-45 min)',
        socs: ['teamtowers-brand', 'castellers-demo'],
        sops: ['castellers-demo'],
        description: 'Exhibición profesional 4-7 pisos, máx 4 castells.',
    },
    {
        id: 'la-colla',
        label: '🧠 La Colla · Proceso VNA (multi-sesión)',
        socs: ['teamtowers-brand', 'la-colla', 'soc-vna-network'],
        sops: ['la-colla'],
        description: 'Consultoría VNA tipo Pantheon — mapeo de la red del cliente.',
    },
    {
        id: 'merchandising',
        label: '🎁 Merchandising · Pañuelos y faixas',
        socs: ['teamtowers-brand', 'teamtowers-merchandising'],
        sops: ['teamtowers-merchandising'],
        description: 'Producto físico personalizable, upsell post-evento.',
    },
    {
        id: 'charla-conferencia',
        label: '🎤 Charla / Conferencia (30-60 min)',
        socs: ['teamtowers-brand', 'charla-conferencia'],
        sops: ['charla-conferencia'],
        description: 'Keynote para congresos, escuelas, comunidades.',
    },
    {
        id: 'proyecto-custom',
        label: '🛠️ Proyecto custom · A medida',
        socs: ['teamtowers-brand', 'proyecto-custom', 'fent-pinya', 'la-colla'],
        sops: ['proyecto-custom', 'fent-pinya-taller', 'la-colla'],
        description: 'Combinación a medida — la IA recibe contexto de todos los formatos.',
    },
];

const DEFAULT_TYPE = 'fent-pinya';

function getServiceType(typeId) {
    return SERVICE_TYPES.find(t => t.id === typeId) || SERVICE_TYPES[0];
}

function uid() { return 'ws-' + Math.random().toString(36).slice(2, 9) + '-' + Date.now().toString(36); }

function fmtDate(ts) {
    if (!ts) return '—';
    const d = new Date(ts);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function statusMeta(id) {
    return STATUSES.find(s => s.id === id) || STATUSES[0];
}

export default class WorkshopsView {

    constructor() {
        this.workshops = [];
    }

    async getHtml() {
        return `
        <style>
            .ws-shell      { height:100dvh; background:var(--bg-0,#050507); color:#e6e6e6; font-family:var(--font-sans,sans-serif); display:flex; flex-direction:column; overflow:hidden; }
            .ws-topbar     { display:flex; align-items:center; gap:1rem; padding:1rem 1.5rem; border-bottom:1px solid #1a1a22; background:#08080c; flex-shrink:0; }
            .ws-logo       { font-weight:700; color:#fff; text-decoration:none; font-size:1.05rem; }
            .ws-logo span  { color:#6366f1; }
            .ws-title      { color:#aaa; font-weight:500; letter-spacing:0.05em; text-transform:uppercase; font-size:0.8rem; }
            .ws-spacer     { flex:1; }
            .ws-btn        { background:#1a1a22; color:#e6e6e6; border:1px solid #2a2a35; padding:0.5rem 1rem; border-radius:6px; cursor:pointer; font-size:0.85rem; }
            .ws-btn:hover  { background:#22222d; }
            .ws-btn-primary{ background:#6366f1; border-color:#6366f1; color:#fff; }
            .ws-btn-primary:hover { background:#4f46e5; }
            .ws-link       { color:#6366f1; text-decoration:none; }

            .ws-main       { padding:1.5rem; max-width:1200px; margin:0 auto; flex:1; overflow-y:auto; overflow-x:hidden; width:100%; }
            .ws-stats      { display:flex; gap:1rem; margin-bottom:2rem; flex-wrap:wrap; }
            .ws-stat       { background:#0e0e14; border:1px solid #1a1a22; border-radius:8px; padding:0.85rem 1.1rem; min-width:130px; }
            .ws-stat-num   { font-size:1.6rem; font-weight:700; color:#fff; line-height:1; }
            .ws-stat-lbl   { color:#888; font-size:0.7rem; text-transform:uppercase; letter-spacing:0.08em; margin-top:0.4rem; }

            .ws-section    { margin-bottom:2rem; }
            .ws-section-h  { color:#aaa; font-size:0.75rem; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:0.6rem; display:flex; align-items:center; gap:0.5rem; }
            .ws-section-h .ws-pill { background:#1a1a22; padding:2px 8px; border-radius:10px; font-size:0.7rem; color:#bbb; }

            .ws-grid       { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:1rem; }
            .ws-card       { background:#0e0e14; border:1px solid #1a1a22; border-left:3px solid var(--accent,#6366f1); border-radius:8px; padding:1rem; display:flex; flex-direction:column; gap:0.5rem; }
            .ws-card h4    { margin:0; color:#fff; font-size:1rem; }
            .ws-card .meta { color:#888; font-size:0.78rem; }
            .ws-card .row  { display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; }
            .ws-card .row label { color:#888; font-size:0.7rem; min-width:60px; }
            .ws-card select{ background:#1a1a22; color:#e6e6e6; border:1px solid #2a2a35; border-radius:5px; padding:3px 6px; font-size:0.78rem; }
            .ws-card .actions { display:flex; gap:0.4rem; margin-top:0.5rem; padding-top:0.5rem; border-top:1px solid #1a1a22; }
            .ws-card .actions button { font-size:0.72rem; padding:0.3rem 0.6rem; }
            .ws-card .actions .danger { color:#ff5252; }

            .ws-empty      { text-align:center; padding:3rem 1rem; color:#666; border:1px dashed #2a2a35; border-radius:8px; }

            .ws-modal      { position:fixed; inset:0; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; z-index:1000; }
            .ws-modal-inner{ background:#0e0e14; border:1px solid #2a2a35; border-radius:12px; padding:1.5rem; width:90%; max-width:480px; }
            .ws-modal h3   { margin:0 0 1rem 0; color:#fff; }
            .ws-modal label{ display:block; color:#aaa; font-size:0.78rem; margin-top:0.7rem; margin-bottom:0.25rem; }
            .ws-modal input, .ws-modal select, .ws-modal textarea { width:100%; box-sizing:border-box; background:#050507; color:#e6e6e6; border:1px solid #2a2a35; border-radius:5px; padding:0.5rem; font-size:0.85rem; font-family:inherit; }
            .ws-modal textarea { min-height:70px; resize:vertical; }
            .ws-modal .actions { display:flex; gap:0.6rem; justify-content:flex-end; margin-top:1.2rem; }
        </style>

        <div class="ws-shell">
            <div class="ws-topbar">
                <a href="/" data-link class="ws-logo">🗼 Team<span>Towers</span></a>
                <span class="ws-title">Workshops · Fent Pinya Ops</span>
                <div class="ws-spacer"></div>
                <a href="/dashboard" data-link class="ws-link">← Dashboard</a>
                <button class="ws-btn ws-btn-primary" id="wsBtnNew">＋ Nuevo taller</button>
            </div>

            <div class="ws-main">
                <div class="ws-stats" id="wsStats"></div>
                <div id="wsBoard"></div>
            </div>

            <div id="wsModalRoot"></div>
        </div>
        `;
    }

    async afterRender() {
        await this._loadWorkshops();
        this._render();
        document.getElementById('wsBtnNew').addEventListener('click', () => this._openModal());
    }

    destroy() {
        // sin sims D3 ni listeners globales — nada que limpiar
    }

    // ─── data ──────────────────────────────────────────────────────────────
    async _loadWorkshops() {
        await KB.init();
        this.workshops = await KB.query({ type: 'workshop' });
        this.workshops.sort((a, b) => (b.content?.date || 0) - (a.content?.date || 0));
    }

    async _saveWorkshop(node) {
        await store.dispatch({ type: 'KB_UPSERT', payload: { node } });
        await this._loadWorkshops();
        this._render();
    }

    async _deleteWorkshop(id) {
        if (!confirm('¿Borrar este taller? La acción es irreversible.')) return;
        await store.dispatch({ type: 'KB_DELETE', payload: { id } });
        await this._loadWorkshops();
        this._render();
    }

    async _changeStatus(id, newStatus) {
        const w = this.workshops.find(x => x.id === id);
        if (!w) return;
        const updated = { ...w, content: { ...w.content, status: newStatus } };
        await this._saveWorkshop(updated);
    }

    // ─── render ─────────────────────────────────────────────────────────────
    _render() {
        this._renderStats();
        this._renderBoard();
    }

    _renderStats() {
        const root = document.getElementById('wsStats');
        if (!root) return;
        const counts = STATUSES.map(s => ({
            ...s,
            count: this.workshops.filter(w => (w.content?.status || 'propuesta') === s.id).length
        }));
        root.innerHTML = counts.map(c => `
            <div class="ws-stat" style="border-left:3px solid ${c.color};">
                <div class="ws-stat-num">${c.count}</div>
                <div class="ws-stat-lbl">${c.emoji} ${c.label}</div>
            </div>
        `).join('') + `
            <div class="ws-stat" style="border-left:3px solid #6366f1;">
                <div class="ws-stat-num">${this.workshops.length}</div>
                <div class="ws-stat-lbl">📚 Total</div>
            </div>
        `;
    }

    _renderBoard() {
        const root = document.getElementById('wsBoard');
        if (!root) return;

        if (this.workshops.length === 0) {
            root.innerHTML = `
                <div class="ws-empty">
                    Aún no hay talleres registrados.<br>
                    Pulsa <strong>＋ Nuevo taller</strong> para crear el primero.
                </div>`;
            return;
        }

        root.innerHTML = STATUSES.map(s => {
            const items = this.workshops.filter(w => (w.content?.status || 'propuesta') === s.id);
            if (items.length === 0) return '';
            return `
                <div class="ws-section">
                    <div class="ws-section-h">
                        ${s.emoji} ${s.label} <span class="ws-pill">${items.length}</span>
                    </div>
                    <div class="ws-grid">
                        ${items.map(w => this._cardHtml(w, s)).join('')}
                    </div>
                </div>
            `;
        }).join('');

        // bind actions
        root.querySelectorAll('[data-ws-status]').forEach(sel => {
            sel.addEventListener('change', e => this._changeStatus(sel.dataset.wsStatus, e.target.value));
        });
        root.querySelectorAll('[data-ws-del]').forEach(btn => {
            btn.addEventListener('click', () => this._deleteWorkshop(btn.dataset.wsDel));
        });
        root.querySelectorAll('[data-ws-ai]').forEach(btn => {
            btn.addEventListener('click', () => this._generateProposal(btn.dataset.wsAi));
        });
        root.querySelectorAll('[data-ws-report]').forEach(btn => {
            btn.addEventListener('click', () => this._openReportNotesModal(btn.dataset.wsReport));
        });
    }

    _cardHtml(w, s) {
        const c = w.content || {};
        const svc = getServiceType(c.type);
        const audSize = c.audienceSize ? `${c.audienceSize} pers.` : '—';
        const isProposal = s.id === 'propuesta';
        const isAfterDelivery = s.id === 'impartido' || s.id === 'cobrado';
        return `
            <div class="ws-card" style="--accent:${s.color};">
                <h4>${this._esc(c.clientName || '(sin cliente)')}</h4>
                <div class="meta">${this._esc(svc.label)}</div>
                <div class="meta">${this._esc(c.sector || '—')} · ${audSize}</div>
                <div class="meta">📅 ${fmtDate(c.date)}</div>
                ${c.notes ? `<div class="meta" style="color:#aaa;">${this._esc(c.notes)}</div>` : ''}
                ${c.proposalDeliverableId ? `<div class="meta" style="color:#22c55e;">📄 propuesta generada</div>` : ''}
                ${c.reportDeliverableId   ? `<div class="meta" style="color:#22c55e;">📋 informe post-taller listo</div>` : ''}
                <div class="row">
                    <label>Estado</label>
                    <select data-ws-status="${w.id}">
                        ${STATUSES.map(st => `<option value="${st.id}" ${st.id===s.id?'selected':''}>${st.emoji} ${st.label}</option>`).join('')}
                    </select>
                </div>
                <div class="actions">
                    ${isProposal       ? `<button class="ws-btn ws-btn-primary" data-ws-ai="${w.id}">✨ Propuesta IA</button>` : ''}
                    ${isAfterDelivery  ? `<button class="ws-btn ws-btn-primary" data-ws-report="${w.id}">📝 Generar informe</button>` : ''}
                    <button class="ws-btn danger" data-ws-del="${w.id}">Borrar</button>
                </div>
            </div>
        `;
    }

    _esc(str) {
        return String(str).replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
    }

    // ─── H2.3 · Generador de propuesta comercial vía LLM ────────────────────

    // Construye el userPrompt para el LLM según el tipo de servicio.
    // Público-instancia para test.
    buildProposalPrompt(workshop) {
        const c = workshop.content || {};
        const svc = getServiceType(c.type);
        const aud = c.audienceSize ? c.audienceSize + ' personas' : 'audiencia no especificada';
        const date = c.date ? fmtDate(c.date) : 'fecha por definir';
        const socRefs = svc.socs.map(s => '`' + (s.startsWith('soc-') ? s : 'soc-' + s) + '`').join(', ');
        const sopRefs = svc.sops.map(s => '`sop-' + s + '`').join(', ');

        return [
            'Genera una PROPUESTA COMERCIAL profesional en español para el siguiente servicio TeamTowers.',
            '',
            'TIPO DE SERVICIO: ' + svc.label,
            'Descripción base: ' + svc.description,
            '',
            'DATOS DEL CLIENTE:',
            '- Cliente: ' + (c.clientName || '(sin cliente)'),
            '- Sector / contexto: ' + (c.sector || '(no especificado)'),
            '- Tamaño de audiencia: ' + aud,
            '- Fecha propuesta: ' + date,
            '- Notas internas del formador: ' + (c.notes || '(sin notas)'),
            '',
            'REQUISITOS DE LA PROPUESTA:',
            '1. Markdown limpio. Encabezado con nombre del cliente y servicio propuesto.',
            '2. Resumen ejecutivo de 3-4 líneas que conecte el problema típico de su sector con este servicio.',
            '3. Sección "Qué entrega el servicio" con 3-5 outcomes tangibles del SOC.',
            '4. Sección "Cómo se desarrolla" alineada con el SOP correspondiente.',
            '5. Sección "Variante recomendada" basada en la audiencia y sector cuando aplique.',
            '6. Sección "Inversión y siguientes pasos" con placeholder [PRECIO] (no inventes precios).',
            '7. Si el servicio es "Proyecto custom", explica explícitamente la combinación de bloques estándar.',
            '8. Tono profesional, cercano, sin jerga vacía. Máximo 600 palabras.',
            '',
            'IMPORTANTE: usa SÓLO el contenido de los SOCs ' + socRefs + ' y los SOPs ' + sopRefs + ' que recibes en el contexto. NO inventes outcomes ni metodología que no estén ahí. Menciona Patrimonio Inmaterial UNESCO cuando el servicio sea casteller (Fent Pinya o Demo).'
        ].join('\n');
    }

    async _generateProposal(workshopId) {
        const w = this.workshops.find(x => x.id === workshopId);
        if (!w) return;
        this._openProposalModal(w, { state: 'loading' });

        try {
            const svc = getServiceType(w.content?.type);
            // Construye contexto rico Mind-as-Graph según tipo de servicio
            const ctx = await KnowledgeLoader.buildContext({
                sector:     w.content?.sector || null,
                freeText:   w.content?.notes  || '',
                socs:       svc.socs,
                sops:       svc.sops,
                projectId:  w.projectId || null,
                taskContext: 'Generar propuesta comercial ' + svc.label + ' para ' + (w.content?.clientName || 'cliente'),
            });

            // Cache-bust dinámico para Orchestrator (ver BUG-002/003)
            const { Orchestrator } = await import('../core/Orchestrator.js?v=' + Date.now());
            const result = await Orchestrator.callLLM({
                preferredEngine: 'anthropic',
                systemPrompt:    ctx.systemPrompt,
                userPrompt:      this.buildProposalPrompt(w),
                responseFormat:  'text',
                temperature:     0.4,
            });

            const proposalText = (typeof result.content === 'string')
                ? result.content
                : (result.content?.raw || JSON.stringify(result.content, null, 2));

            this._openProposalModal(w, {
                state:   'ready',
                text:    proposalText,
                sources: ctx.sources,
                tokens:  result.telemetry?.tokens?.total_tokens || 0,
                latency: result.telemetry?.latencyMs || 0,
            });
        } catch (err) {
            console.error('[H2.3] Error generando propuesta:', err);
            this._openProposalModal(w, {
                state: 'error',
                msg:   err.message + '\n\nVerifica tu API key en /settings.',
            });
        }
    }

    _openProposalModal(w, payload) {
        const root = document.getElementById('wsModalRoot');
        if (!root) return;
        const close = () => { root.innerHTML = ''; };

        let body;
        if (payload.state === 'loading') {
            body = `
                <p style="color:#aaa;">Construyendo contexto SOC + SOP + datos del taller…</p>
                <p style="color:#666; font-size:0.8rem;">Llamando al LLM. Puede tardar 5-15 segundos.</p>`;
        } else if (payload.state === 'error') {
            body = `
                <p style="color:#ff5252;">No se pudo generar la propuesta:</p>
                <pre style="background:#050507;padding:0.6rem;border-radius:5px;color:#aaa;white-space:pre-wrap;font-size:0.78rem;">${this._esc(payload.msg)}</pre>`;
        } else {
            const meta = `Tokens: ${payload.tokens} · Latencia: ${payload.latency} ms · Fuentes: ${payload.sources.length}`;
            body = `
                <p style="color:#888;font-size:0.75rem;">${this._esc(meta)}</p>
                <textarea id="wsfProposalText" style="width:100%;min-height:280px;background:#050507;color:#e6e6e6;border:1px solid #2a2a35;border-radius:5px;padding:0.6rem;font-family:monospace;font-size:0.78rem;">${this._esc(payload.text)}</textarea>`;
        }

        root.innerHTML = `
            <div class="ws-modal" id="wsProposalBg">
                <div class="ws-modal-inner" style="max-width:700px;">
                    <h3>✨ Propuesta IA · ${this._esc(w.content?.clientName || '(sin cliente)')}</h3>
                    ${body}
                    <div class="actions">
                        ${payload.state === 'ready' ? `
                            <button class="ws-btn" id="wsfCopy">📋 Copiar</button>
                            <button class="ws-btn ws-btn-primary" id="wsfSaveDel">💾 Guardar como deliverable</button>` : ''}
                        <button class="ws-btn" id="wsfClose">Cerrar</button>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('wsfClose').addEventListener('click', close);
        document.getElementById('wsProposalBg').addEventListener('click', e => { if (e.target.id === 'wsProposalBg') close(); });

        if (payload.state === 'ready') {
            document.getElementById('wsfCopy').addEventListener('click', () => {
                const ta = document.getElementById('wsfProposalText');
                ta.select();
                navigator.clipboard.writeText(ta.value).catch(() => document.execCommand('copy'));
            });
            document.getElementById('wsfSaveDel').addEventListener('click', async () => {
                const finalText = document.getElementById('wsfProposalText').value;
                const delId = 'del-' + Math.random().toString(36).slice(2, 9) + '-' + Date.now().toString(36);
                const svc = getServiceType(w.content?.type);
                await store.dispatch({ type: 'KB_UPSERT', payload: { node: {
                    id:        delId,
                    type:      'deliverable',
                    projectId: w.projectId || null,
                    content: {
                        kind:        'proposal',
                        workshopId:  w.id,
                        serviceType: svc.id,
                        title:       'Propuesta ' + svc.label + ' · ' + (w.content?.clientName || ''),
                        format:      'markdown',
                        body:        finalText,
                        socRefs:     svc.socs,
                        sopRefs:     svc.sops,
                        generatedAt: Date.now(),
                        sources:     payload.sources,
                    },
                    keywords: ['proposal', svc.id, w.content?.sector || ''],
                }}});
                // también enlazamos en el workshop
                const updated = { ...w, content: { ...w.content, proposalDeliverableId: delId } };
                await this._saveWorkshop(updated);
                close();
            });
        }
    }

    // ─── H2.5 · Informe post-taller ─────────────────────────────────────────

    // Builder del userPrompt para el informe según el tipo de servicio.
    // Público para test.
    buildReportPrompt(workshop, notes) {
        const c   = workshop.content || {};
        const svc = getServiceType(c.type);
        const aud  = c.audienceSize ? c.audienceSize + ' personas' : 'audiencia no especificada';
        const date = c.date ? fmtDate(c.date) : 'fecha desconocida';
        const socRefs = svc.socs.map(s => '`' + (s.startsWith('soc-') ? s : 'soc-' + s) + '`').join(', ');
        const sopRefs = svc.sops.map(s => '`sop-' + s + '`').join(', ');

        // Secciones canónicas según tipo de servicio
        const sectionsByType = {
            'fent-pinya': [
                '3. Sección "Roles VNA detectados" — roles reales emergidos durante la cosecha del taller, con nivel castellero (pinya/tronc/pom_de_dalt) cuando encaje.',
                '4. Sección "Intercambios intangibles críticos" — flujos no contractuales detectados, con hint de salud.',
                '5. Sección "Patrones de disfunción" — 1-3 patrones con descripción, señal y recomendación.',
                '6. Sección "Acotxadors invisibles" — roles de soporte emocional no reconocidos.',
                '7. Sección "Compromisos individuales" — síntesis anonimizada de roles VNA elegidos por cada participante.',
                '8. Sección "Recomendaciones de seguimiento" — consultoría VNA, formación interna, segundo taller, etc.',
            ],
            'la-colla': [
                '3. Sección "Mapa VNA del ámbito" — descripción narrativa de los 8-12 roles identificados, transacciones MUST y EXTRA.',
                '4. Sección "Pulso de satisfacción" — entregables azules (satisfechos) y amarillos (insatisfechos) con análisis.',
                '5. Sección "Retos identificados por el equipo" — 3-7 retos críticos co-formulados (no impuestos por consultor).',
                '6. Sección "Propuestas de mejora priorizadas" — formato Diagnóstico → Solución → Rol emergente (si aplica), con responsable y plazo.',
                '7. Sección "Roles emergentes detectados" — roles invisibles que sostienen la red sin reconocimiento formal.',
                '8. Sección "Roles pendientes para próximas sesiones" — entrevistas individuales o grupales sugeridas.',
            ],
            'castellers-demo': [
                '3. Sección "Castells construidos" — listado de los castells ejecutados (hasta 4), con altura y composición.',
                '4. Sección "Material audiovisual entregado" — fotos, vídeos, momentos viralizables.',
                '5. Sección "Impacto cultural percibido" — reacciones de la audiencia (si hay testimonios capturados).',
                '6. Sección "Lecciones operativas" — incidencias menores, ajustes para futuras demos en el mismo cliente.',
                '7. Sección "Recomendaciones de seguimiento" — taller participativo, demo de mayor altura, merchandising.',
            ],
            'merchandising': [
                '3. Sección "Productos entregados" — pañuelos, faixas, cantidades, personalización.',
                '4. Sección "Plazos cumplidos" — fechas de cada hito (briefing, mock-up, producción, entrega).',
                '5. Sección "Calidad de personalización" — observaciones sobre acabados, defectos, conformidad.',
                '6. Sección "Recomendaciones de seguimiento" — recompra, co-branding ampliado, eventos próximos.',
            ],
            'charla-conferencia': [
                '3. Sección "Mensaje principal entregado" — síntesis del contenido de la keynote.',
                '4. Sección "Audiencia y reacciones" — perfil del público y feedback recibido.',
                '5. Sección "Leads cualificados generados" — empresas o asistentes con interés en taller / La Colla / consultoría.',
                '6. Sección "Recomendaciones de seguimiento" — workshop posterior, tour por escuelas, comunidades.',
            ],
            'proyecto-custom': [
                '3. Secciones específicas según los bloques estándar combinados — alinéate con los SOPs de los bloques que componen este proyecto custom.',
                '4. Sección "Lecciones del custom" — qué funcionó, qué no, qué replicar.',
                '5. Sección "Promoción a SOP estándar" — si este custom merece convertirse en formato propio.',
            ],
        };
        const sections = sectionsByType[svc.id] || sectionsByType['fent-pinya'];

        return [
            'Genera un INFORME POST-EVENTO profesional en español para entregar al cliente tras ejecutar el siguiente servicio TeamTowers.',
            '',
            'TIPO DE SERVICIO: ' + svc.label,
            '',
            'DATOS DEL EVENTO:',
            '- Cliente: ' + (c.clientName || '(sin cliente)'),
            '- Sector / contexto: ' + (c.sector || '(no especificado)'),
            '- Tamaño de audiencia: ' + aud,
            '- Fecha: ' + date,
            '- Notas iniciales (encuadre): ' + (c.notes || '(sin notas)'),
            '',
            'CAPTURAS DEL FORMADOR DURANTE EL EVENTO (input crítico — la IA no debe inventar nada que no esté aquí):',
            '"""',
            (notes || '').trim() || '(sin notas — informe imposible de generar con calidad; pídelas al formador)',
            '"""',
            '',
            'REQUISITOS DEL INFORME:',
            '1. Markdown limpio. Encabezado con cliente, fecha y servicio.',
            '2. Resumen ejecutivo (3-4 líneas) basado en los hallazgos reales del evento.',
            ...sections,
            '9. Tono profesional, riguroso, no condescendiente. NO inventes datos no presentes en las capturas. Si una sección no tiene material, escríbela como "[pendiente — el formador debe añadir capturas adicionales]" en lugar de fabricar.',
            '10. Máximo 900 palabras.',
            '',
            'IMPORTANTE: alinéate con los SOCs ' + socRefs + ' y los SOPs ' + sopRefs + ' para conservar la coherencia metodológica. Cita textualmente frases de las capturas cuando sean valiosas.'
        ].join('\n');
    }

    _openReportNotesModal(workshopId) {
        const w = this.workshops.find(x => x.id === workshopId);
        if (!w) return;
        const root = document.getElementById('wsModalRoot');
        if (!root) return;
        const close = () => { root.innerHTML = ''; };
        root.innerHTML = `
            <div class="ws-modal" id="wsReportNotesBg">
                <div class="ws-modal-inner" style="max-width:700px;">
                    <h3>📝 Informe post-taller · ${this._esc(w.content?.clientName || '')}</h3>
                    <p style="color:#aaa;font-size:0.82rem;margin:0.5rem 0 0.8rem 0;">
                        Pega aquí <strong>las capturas reales</strong> que tomaste durante el taller:
                        intangibles detectados en la pinya, identificación del músic, acotxadors invisibles,
                        patrones de disfunción que surgieron, citas de participantes, compromisos individuales.
                        Cuanto más rico el input, mejor el informe. Sin notas, la IA no debe inventar.
                    </p>
                    <textarea id="wsfReportNotes" style="width:100%;min-height:240px;background:#050507;color:#e6e6e6;border:1px solid #2a2a35;border-radius:5px;padding:0.6rem;font-family:monospace;font-size:0.82rem;" placeholder="Ejemplo:
- Pinya fase 2: María tocó hombro de Javier en la 2ª ronda con vendas → primer intangible visible
- Músic identificado en la organización: Sara (project mgr de marketing). El equipo lo confirma sin dudar.
- Acotxador invisible: Pere (técnico de TI) — todos van a él en momentos críticos sin que conste en el organigrama.
- Patrón detectado: 'silla musical de baixos' — los seniors de operaciones rotan demasiado, foundation inestable.
- Compromisos: 5 personas eligen rol distinto a su puesto; 3 eligen 'músic'.
"></textarea>
                    <div class="actions">
                        <button class="ws-btn" id="wsfReportCancel">Cancelar</button>
                        <button class="ws-btn ws-btn-primary" id="wsfReportGo">✨ Generar informe</button>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('wsfReportCancel').addEventListener('click', close);
        document.getElementById('wsReportNotesBg').addEventListener('click', e => { if (e.target.id === 'wsReportNotesBg') close(); });
        document.getElementById('wsfReportGo').addEventListener('click', () => {
            const notes = document.getElementById('wsfReportNotes').value;
            if (!notes.trim()) {
                if (!confirm('Estás generando el informe SIN capturas del taller. La IA no inventará contenido — saldrá un esqueleto con secciones [pendiente]. ¿Continuar?')) return;
            }
            this._generateReport(w.id, notes);
        });
    }

    async _generateReport(workshopId, notes) {
        const w = this.workshops.find(x => x.id === workshopId);
        if (!w) return;
        this._openReportModal(w, { state: 'loading', notes });

        try {
            const svc = getServiceType(w.content?.type);
            const ctx = await KnowledgeLoader.buildContext({
                sector:     w.content?.sector || null,
                freeText:   w.content?.notes  || '',
                socs:       svc.socs,
                sops:       svc.sops,
                projectId:  w.projectId || null,
                taskContext: 'Generar informe post-evento ' + svc.label + ' para ' + (w.content?.clientName || 'cliente'),
            });

            // Cache-bust dinámico para Orchestrator (ver BUG-002/003)
            const { Orchestrator } = await import('../core/Orchestrator.js?v=' + Date.now());
            const result = await Orchestrator.callLLM({
                preferredEngine: 'anthropic',
                systemPrompt:    ctx.systemPrompt,
                userPrompt:      this.buildReportPrompt(w, notes),
                responseFormat:  'text',
                temperature:     0.3,
            });

            const reportText = (typeof result.content === 'string')
                ? result.content
                : (result.content?.raw || JSON.stringify(result.content, null, 2));

            this._openReportModal(w, {
                state:   'ready',
                text:    reportText,
                notes,
                sources: ctx.sources,
                tokens:  result.telemetry?.tokens?.total_tokens || 0,
                latency: result.telemetry?.latencyMs || 0,
            });
        } catch (err) {
            console.error('[H2.5] Error generando informe:', err);
            this._openReportModal(w, {
                state: 'error',
                msg:   err.message + '\n\nVerifica tu API key en /settings.',
            });
        }
    }

    _openReportModal(w, payload) {
        const root = document.getElementById('wsModalRoot');
        if (!root) return;
        const close = () => { root.innerHTML = ''; };

        let body;
        if (payload.state === 'loading') {
            body = `
                <p style="color:#aaa;">Construyendo contexto SOC + SOP + capturas del taller…</p>
                <p style="color:#666;font-size:0.8rem;">Llamando al LLM. Puede tardar 10-25 segundos (output más largo).</p>`;
        } else if (payload.state === 'error') {
            body = `
                <p style="color:#ff5252;">No se pudo generar el informe:</p>
                <pre style="background:#050507;padding:0.6rem;border-radius:5px;color:#aaa;white-space:pre-wrap;font-size:0.78rem;">${this._esc(payload.msg)}</pre>`;
        } else {
            const meta = `Tokens: ${payload.tokens} · Latencia: ${payload.latency} ms · Fuentes: ${payload.sources.length}`;
            body = `
                <p style="color:#888;font-size:0.75rem;">${this._esc(meta)}</p>
                <textarea id="wsfReportText" style="width:100%;min-height:340px;background:#050507;color:#e6e6e6;border:1px solid #2a2a35;border-radius:5px;padding:0.6rem;font-family:monospace;font-size:0.78rem;">${this._esc(payload.text)}</textarea>`;
        }

        root.innerHTML = `
            <div class="ws-modal" id="wsReportBg">
                <div class="ws-modal-inner" style="max-width:780px;">
                    <h3>📋 Informe post-taller · ${this._esc(w.content?.clientName || '(sin cliente)')}</h3>
                    ${body}
                    <div class="actions">
                        ${payload.state === 'ready' ? `
                            <button class="ws-btn" id="wsfReportCopy">📋 Copiar</button>
                            <button class="ws-btn ws-btn-primary" id="wsfReportSave">💾 Guardar como deliverable</button>` : ''}
                        <button class="ws-btn" id="wsfReportClose">Cerrar</button>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('wsfReportClose').addEventListener('click', close);
        document.getElementById('wsReportBg').addEventListener('click', e => { if (e.target.id === 'wsReportBg') close(); });

        if (payload.state === 'ready') {
            document.getElementById('wsfReportCopy').addEventListener('click', () => {
                const ta = document.getElementById('wsfReportText');
                ta.select();
                navigator.clipboard.writeText(ta.value).catch(() => document.execCommand('copy'));
            });
            document.getElementById('wsfReportSave').addEventListener('click', async () => {
                const finalText = document.getElementById('wsfReportText').value;
                const delId = 'del-' + Math.random().toString(36).slice(2, 9) + '-' + Date.now().toString(36);
                const svcR = getServiceType(w.content?.type);
                await store.dispatch({ type: 'KB_UPSERT', payload: { node: {
                    id:        delId,
                    type:      'deliverable',
                    projectId: w.projectId || null,
                    content: {
                        kind:        'post-workshop-report',
                        workshopId:  w.id,
                        serviceType: svcR.id,
                        title:       'Informe post-evento ' + svcR.label + ' · ' + (w.content?.clientName || ''),
                        format:      'markdown',
                        body:        finalText,
                        rawNotes:    payload.notes || '',
                        socRefs:     svcR.socs,
                        sopRefs:     svcR.sops,
                        generatedAt: Date.now(),
                        sources:     payload.sources,
                    },
                    keywords: ['post-workshop-report', svcR.id, w.content?.sector || ''],
                }}});
                const updated = { ...w, content: { ...w.content, reportDeliverableId: delId } };
                await this._saveWorkshop(updated);
                close();
            });
        }
    }

    // ─── modal de creación ──────────────────────────────────────────────────
    _openModal() {
        const root = document.getElementById('wsModalRoot');
        if (!root) return;
        const today = new Date().toISOString().split('T')[0];
        root.innerHTML = `
            <div class="ws-modal" id="wsModalBg">
                <div class="ws-modal-inner">
                    <h3>＋ Nuevo workshop / servicio</h3>
                    <label>Cliente</label>
                    <input id="wsfClient" type="text" placeholder="Ayuntamiento de X / Startup Y / ...">
                    <label>Tipo de servicio</label>
                    <select id="wsfType">
                        ${SERVICE_TYPES.map(t => `<option value="${t.id}" ${t.id===DEFAULT_TYPE?'selected':''}>${t.label}</option>`).join('')}
                    </select>
                    <p id="wsfTypeHint" style="color:#888;font-size:0.7rem;margin:0.2rem 0 0 0;">${this._esc(SERVICE_TYPES[0].description)}</p>
                    <label>Sector / contexto</label>
                    <input id="wsfSector" type="text" placeholder="consultoría / startup / ayuntamiento / CoP...">
                    <label>Fecha</label>
                    <input id="wsfDate" type="date" value="${today}">
                    <label>Tamaño de audiencia</label>
                    <input id="wsfAud" type="number" min="0" placeholder="ej. 18">
                    <label>Notas</label>
                    <textarea id="wsfNotes" placeholder="objetivo del cliente, sponsor, contactos..."></textarea>
                    <div class="actions">
                        <button class="ws-btn" id="wsfCancel">Cancelar</button>
                        <button class="ws-btn ws-btn-primary" id="wsfSave">Guardar</button>
                    </div>
                </div>
            </div>
        `;
        const close = () => { root.innerHTML = ''; };
        document.getElementById('wsfCancel').addEventListener('click', close);
        document.getElementById('wsModalBg').addEventListener('click', e => { if (e.target.id === 'wsModalBg') close(); });

        // Hint dinámico al cambiar el tipo de servicio
        const typeSel  = document.getElementById('wsfType');
        const typeHint = document.getElementById('wsfTypeHint');
        typeSel.addEventListener('change', () => {
            const cur = getServiceType(typeSel.value);
            typeHint.textContent = cur.description;
        });

        document.getElementById('wsfSave').addEventListener('click', async () => {
            const typeId = document.getElementById('wsfType').value;
            const node = {
                id:        uid(),
                type:      'workshop',
                projectId: null,
                content: {
                    clientName:   document.getElementById('wsfClient').value.trim() || '(sin cliente)',
                    type:         typeId,
                    sector:       document.getElementById('wsfSector').value.trim(),
                    date:         new Date(document.getElementById('wsfDate').value).getTime() || Date.now(),
                    audienceSize: parseInt(document.getElementById('wsfAud').value, 10) || null,
                    notes:        document.getElementById('wsfNotes').value.trim(),
                    status:       'propuesta',
                },
                keywords: ['workshop', typeId],
            };
            close();
            await this._saveWorkshop(node);
        });
    }
}
