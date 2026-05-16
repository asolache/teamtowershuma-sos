// =============================================================================
// TEAMTOWERS SOS V11 — PROJECT PITCH VIEW (PITCH-PUBLIC sprint A)
// Ruta · /js/views/ProjectPitchView.js  →  /pitch?project={id}
//                                       →  /pitch?project={id}&edit=1
//
// Public read-only by default (one-pager pitch shareable). Si ?edit=1 ·
// mostra editor inline per a 6 seccions + tagline + publish/unpublish.
// =============================================================================

import { KB } from '../core/kb.js';
import { findProjectByIdAny } from '../core/projectLookup.js';
import {
    PROJECT_PITCH_TYPE, PITCH_SECTIONS,
    buildEmptyPitch,
    validatePitchSection, applyPitchSection,
    setPitchTagline,
    computePitchCompletion,
    publishPitch, unpublishPitch,
    prefillFromCanvas,
    buildOGMeta, renderOGTagsHtml,
} from '../core/projectPitchService.js';

export default class ProjectPitchView {

    constructor() {
        document.title = 'Pitch · SOS V11';
        try {
            const u = new URL(window.location.href);
            this.projectId = u.searchParams.get('project') || null;
            this.editMode  = u.searchParams.get('edit') === '1';
        } catch (_) { this.projectId = null; this.editMode = false; }
        this.project = null;
        this.pitch   = null;
    }

    async getHtml() {
        if (!this.projectId) return this._htmlNoProject();
        try { this.project = await findProjectByIdAny(this.projectId); } catch (_) { this.project = null; }
        if (!this.project) return this._htmlNotFound();

        // Look for existing pitch · prefer most recent
        let pitches = [];
        try { pitches = await KB.query({ type: PROJECT_PITCH_TYPE, projectId: this.projectId }) || []; } catch (_) {}
        if (pitches.length > 0) {
            this.pitch = pitches.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];
        } else {
            // No pitch · auto-create empty + try prefill from canvas
            this.pitch = buildEmptyPitch({ projectId: this.projectId, lang: 'ca' });
            const canvas = this.project.content?.canvas;
            if (canvas) this.pitch = prefillFromCanvas(this.pitch, canvas);
        }

        // If not edit mode and pitch not published and no sections filled · go to edit
        const completion = computePitchCompletion(this.pitch);
        if (!this.editMode && completion.filled === 0) {
            this.editMode = true;
        }

        return this.editMode ? this._htmlEdit() : this._htmlPublic();
    }

    async afterRender() {
        if (!this.project) return;
        // Inject OG meta tags al <head>
        this._injectOGMeta();
        if (this.editMode) this._bindEdit();
    }

    _injectOGMeta() {
        try {
            const og = buildOGMeta({
                pitch:       this.pitch,
                project:     this.project,
                absoluteUrl: window.location.origin,
            });
            // Remove any existing OG meta tags we added previously
            document.querySelectorAll('meta[data-pitch-og="1"]').forEach(m => m.remove());
            const head = document.head;
            const tagHtml = renderOGTagsHtml(og);
            if (!tagHtml) return;
            const tmp = document.createElement('div');
            tmp.innerHTML = tagHtml;
            Array.from(tmp.children).forEach(node => {
                if (node && node.tagName === 'META') {
                    node.setAttribute('data-pitch-og', '1');
                    head.appendChild(node);
                }
            });
            // Page title amb tagline
            if (og.title) document.title = og.title;
        } catch (e) {
            console.warn('[pitch] OG meta inject failed', e);
        }
    }

    _htmlNoProject() {
        return `<div style="min-height:100dvh;background:var(--bg-dark);color:var(--text-main);font-family:var(--font-base);padding:2rem;">
            <div style="max-width:600px;margin:4rem auto;text-align:center;background:var(--bg-panel);padding:2rem;border-radius:8px;border:1px solid var(--border-default);">
                <h1>📣 Pitch</h1>
                <p>Cal indicar projecte · <code>?project=&lt;projectId&gt;</code>.</p>
                <a href="/dashboard" data-link style="color:var(--accent-indigo);">← Dashboard</a>
            </div></div>`;
    }
    _htmlNotFound() {
        return `<div style="min-height:100dvh;background:var(--bg-dark);color:var(--text-main);font-family:var(--font-base);padding:2rem;">
            <div style="max-width:600px;margin:4rem auto;text-align:center;background:var(--bg-panel);padding:2rem;border-radius:8px;border:1px solid var(--border-default);">
                <h1>⚠ Projecte no trobat</h1><p><code>${this._esc(this.projectId)}</code></p>
                <a href="/dashboard" data-link style="color:var(--accent-indigo);">← Dashboard</a>
            </div></div>`;
    }

    _htmlPublic() {
        const projName = this.project.nombre || this.project.name || this.project.id;
        const tagline = this.pitch.content.tagline || '';
        const sections = this.pitch.content.sections || {};
        const completion = computePitchCompletion(this.pitch);
        const isPublished = !!this.pitch.content.publishedAt;

        const sectionCards = PITCH_SECTIONS.map(s => {
            const val = sections[s.id]?.value || '';
            if (!val) return '';
            return `<div class="pt-card">
                <h2 class="pt-section-label">${this._esc(s.label)}</h2>
                <p class="pt-section-text">${this._esc(val)}</p>
            </div>`;
        }).join('');

        const banner = !isPublished ? `
            <div class="pt-banner">
                <span>📝 Aquest pitch està en draft</span>
                <a href="?project=${encodeURIComponent(this.projectId)}&edit=1" data-link class="pt-banner-cta">✎ Editar</a>
            </div>
        ` : '';

        return `
        <style>
            .pt-shell { min-height:100dvh; background:var(--bg-dark); color:var(--text-main); font-family:var(--font-base); }
            .pt-topbar { display:flex; align-items:center; gap:10px; padding:8px 16px; border-bottom:1px solid var(--border-default); background:var(--bg-panel); flex-wrap:wrap; }
            .pt-logo { font-weight:700; color:var(--text-main); text-decoration:none; font-size:1.05rem; }
            .pt-logo span { color:var(--accent-indigo); }
            .pt-banner { background:#facc1530; border-bottom:1px solid #facc1550; padding:8px 16px; display:flex; align-items:center; gap:10px; flex-wrap:wrap; font-size:0.82rem; }
            .pt-banner-cta { color:var(--accent-indigo); text-decoration:none; font-weight:600; padding:4px 10px; background:var(--bg-dark); border-radius:4px; }
            .pt-hero { background:linear-gradient(135deg,#6366f130,#a855f730,#22c55e20); padding:3rem 1.5rem 2.5rem; text-align:center; border-bottom:1px solid var(--border-default); }
            .pt-hero h1 { margin:0 0 0.6rem 0; font-size:2.4rem; font-weight:800; line-height:1.15; letter-spacing:-0.01em; }
            .pt-tagline { font-size:1.15rem; color:var(--text-secondary); max-width:680px; margin:0 auto 0.6rem; line-height:1.45; }
            .pt-pub { font-size:11px; color:var(--text-muted); font-family:var(--font-mono); margin-top:1rem; }
            .pt-main { max-width:880px; margin:0 auto; padding:2rem 1.5rem; display:grid; grid-template-columns:repeat(auto-fit,minmax(360px,1fr)); gap:1rem; }
            .pt-card { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:8px; padding:1.4rem 1.6rem; }
            .pt-section-label { font-size:0.85rem; margin:0 0 0.6rem 0; color:var(--accent-indigo); text-transform:uppercase; letter-spacing:0.06em; font-family:var(--font-mono); font-weight:700; }
            .pt-section-text { margin:0; line-height:1.6; font-size:1rem; color:var(--text-main); white-space:pre-wrap; }
            .pt-footer { max-width:880px; margin:1rem auto; padding:1rem 1.5rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; font-size:0.8rem; color:var(--text-muted); }
            .pt-empty { max-width:600px; margin:4rem auto; padding:2rem; text-align:center; background:var(--bg-panel); border:1px solid var(--border-default); border-radius:8px; }
        </style>
        <div class="pt-shell">
            <div class="pt-topbar">
                <a href="/dashboard" data-link class="pt-logo">🗼 Team<span>Towers</span></a>
                <span style="color:var(--text-secondary);font-size:0.78rem;text-transform:uppercase;letter-spacing:0.05em;">Pitch · públic</span>
                <span style="flex:1;"></span>
                <a href="/lifecycle?project=${encodeURIComponent(this.projectId)}" data-link style="color:var(--text-secondary);text-decoration:none;font-size:0.78rem;">🌀 Lifecycle</a>
                <a href="?project=${encodeURIComponent(this.projectId)}&edit=1" data-link style="color:var(--accent-indigo);text-decoration:none;font-size:0.78rem;font-weight:600;">✎ Editar</a>
            </div>
            ${banner}
            <div class="pt-hero">
                <h1>${this._esc(projName)}</h1>
                ${tagline ? `<p class="pt-tagline">${this._esc(tagline)}</p>` : ''}
                ${isPublished ? `<div class="pt-pub">📡 publicat ${this._esc(this.pitch.content.publishedAt.slice(0, 10))} · slug <code>${this._esc(this.pitch.content.slug || '')}</code></div>` : ''}
            </div>
            ${sectionCards ? `<div class="pt-main">${sectionCards}</div>` : `<div class="pt-empty">
                <h3>📝 Pitch encara buit</h3>
                <p>Cap secció omplerta. <a href="?project=${encodeURIComponent(this.projectId)}&edit=1" data-link style="color:var(--accent-indigo);">Comença a editar →</a></p>
            </div>`}
            <div class="pt-footer">
                <span>📊 ${completion.filled}/${completion.total} seccions omplertes · ${completion.percent}%</span>
                <span>powered by 🗼 SOS V11</span>
            </div>
        </div>`;
    }

    _htmlEdit() {
        const projName = this.project.nombre || this.project.name || this.project.id;
        const tagline = this.pitch.content.tagline || '';
        const sections = this.pitch.content.sections || {};
        const completion = computePitchCompletion(this.pitch);
        const isPublished = !!this.pitch.content.publishedAt;

        const sectionEditors = PITCH_SECTIONS.map((s, idx) => {
            const val = sections[s.id]?.value || '';
            const validation = validatePitchSection(s.id, val);
            const badge = validation.ok
                ? '<span style="color:#22c55e;font-weight:700;font-size:11px;">✓ vàlid</span>'
                : '<span style="color:var(--text-muted);font-size:11px;">— pendent</span>';
            return `<div class="pt-edit-card" data-section="${s.id}">
                <div class="pt-edit-head">
                    <span class="pt-edit-num">${idx + 1}</span>
                    <div style="flex:1;min-width:0;">
                        <div class="pt-edit-title">${this._esc(s.label)}</div>
                        <div class="pt-edit-prompt">${this._esc(s.prompt)}</div>
                    </div>
                    <div data-badge="${s.id}">${badge}</div>
                </div>
                <textarea class="pt-textarea" data-text="${s.id}" rows="4" placeholder="Min ${s.minLength} · max ${s.maxLength} caràcters · ${this._esc(s.prompt.slice(0, 60))}…">${this._esc(val)}</textarea>
                <div class="pt-edit-actions">
                    <button class="pt-btn pt-btn-save" data-save="${s.id}">✓ Validar &amp; desar</button>
                    <span class="pt-msg" data-msg="${s.id}"></span>
                </div>
            </div>`;
        }).join('');

        return `
        <style>
            .pte-shell { min-height:100dvh; background:var(--bg-dark); color:var(--text-main); font-family:var(--font-base); }
            .pte-topbar { display:flex; align-items:center; gap:10px; padding:8px 16px; border-bottom:1px solid var(--border-default); background:var(--bg-panel); flex-wrap:wrap; }
            .pte-logo { font-weight:700; color:var(--text-main); text-decoration:none; font-size:1.05rem; }
            .pte-logo span { color:var(--accent-indigo); }
            .pte-main { max-width:900px; margin:0 auto; padding:1.5rem; }
            .pte-header { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:8px; padding:1rem 1.2rem; margin-bottom:1.2rem; }
            .pte-progress { height:8px; background:#0008; border-radius:4px; overflow:hidden; margin-top:0.6rem; }
            .pte-progress-fill { height:100%; background:linear-gradient(90deg,#6366f1,#22c55e); transition:width 0.4s; }
            .pte-tagline-input { width:100%; box-sizing:border-box; background:#000; color:var(--text-main); border:1px solid var(--border-default); border-radius:4px; padding:8px 10px; font-family:var(--font-base); font-size:0.95rem; margin-top:8px; }
            .pte-pubblock { background:linear-gradient(135deg,#22c55e25,#6366f125); border:1px solid #22c55e50; border-radius:8px; padding:0.8rem 1.2rem; margin-bottom:1.2rem; }
            .pt-edit-card { background:var(--bg-panel); border:1px solid var(--border-default); border-radius:8px; padding:1rem 1.2rem; margin-bottom:1rem; }
            .pt-edit-head { display:flex; align-items:flex-start; gap:12px; margin-bottom:10px; }
            .pt-edit-num { width:30px; height:30px; border-radius:50%; background:var(--accent-indigo); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-family:var(--font-mono); flex-shrink:0; }
            .pt-edit-title { font-weight:700; font-size:0.95rem; margin-bottom:2px; }
            .pt-edit-prompt { font-size:0.78rem; color:var(--text-secondary); line-height:1.45; }
            .pt-textarea { width:100%; box-sizing:border-box; background:#000; color:var(--text-main); border:1px solid var(--border-default); border-radius:4px; padding:8px 10px; font-family:var(--font-base); font-size:0.85rem; line-height:1.5; resize:vertical; }
            .pt-edit-actions { display:flex; align-items:center; gap:8px; margin-top:8px; flex-wrap:wrap; }
            .pt-btn { padding:6px 12px; border-radius:4px; border:1px solid var(--border-default); background:var(--bg-dark); color:var(--text-main); font-size:0.78rem; font-weight:600; cursor:pointer; }
            .pt-btn:hover { background:var(--glass-hover); }
            .pt-btn:disabled { opacity:0.5; cursor:not-allowed; }
            .pt-btn-save { background:#22c55e; color:#fff; border-color:#22c55e; }
            .pt-btn-pub { background:#6366f1; color:#fff; border-color:#6366f1; padding:8px 16px; font-size:0.85rem; }
            .pt-msg { font-size:11px; font-family:var(--font-mono); }
            .pt-msg.ok { color:#22c55e; }
            .pt-msg.err { color:#ef4444; }
        </style>
        <div class="pte-shell">
            <div class="pte-topbar">
                <a href="/dashboard" data-link class="pte-logo">🗼 Team<span>Towers</span></a>
                <span style="color:var(--text-secondary);font-size:0.78rem;text-transform:uppercase;letter-spacing:0.05em;">Pitch · edit</span>
                <span style="flex:1;"></span>
                <a href="?project=${encodeURIComponent(this.projectId)}" data-link style="color:var(--accent-indigo);text-decoration:none;font-size:0.78rem;font-weight:600;">👁 Veure públic</a>
                <a href="/lifecycle?project=${encodeURIComponent(this.projectId)}" data-link style="color:var(--text-secondary);text-decoration:none;font-size:0.78rem;">🌀 Lifecycle</a>
            </div>
            <div class="pte-main">
                <div class="pte-header">
                    <div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:8px;">
                        <h1 style="margin:0;font-size:1.35rem;">📣 ${this._esc(projName)} · Pitch</h1>
                        <div style="font-family:var(--font-mono);font-size:0.85rem;color:var(--text-secondary);">${completion.filled} / ${completion.total} · <strong style="color:var(--text-main);">${completion.percent}%</strong></div>
                    </div>
                    <div class="pte-progress"><div class="pte-progress-fill" style="width:${completion.percent}%;"></div></div>
                    <label style="display:block;margin-top:1rem;font-size:0.78rem;color:var(--text-secondary);">Tagline (max 140 · per OG cards · subtítol)</label>
                    <input type="text" class="pte-tagline-input" id="pteTagline" maxlength="140" value="${this._esc(tagline)}" placeholder="Ex · OS cooperatiu local-first per a equips reals">
                    <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;">
                        <button class="pt-btn pt-btn-save" id="pteSaveTagline">💾 Desar tagline</button>
                        <span class="pt-msg" id="pteTaglineMsg"></span>
                    </div>
                </div>

                ${isPublished ? `
                    <div class="pte-pubblock">
                        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
                            <div>
                                <strong>📡 Publicat</strong> · slug <code>${this._esc(this.pitch.content.slug || '')}</code> · des de ${this._esc(this.pitch.content.publishedAt.slice(0, 10))}
                            </div>
                            <button class="pt-btn" id="pteUnpublish">⏸ Despublicar</button>
                        </div>
                    </div>
                ` : `
                    <div class="pte-pubblock" style="background:linear-gradient(135deg,#facc1525,#fb923c25);border-color:#facc1550;">
                        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
                            <div>
                                <strong>📝 Draft</strong> · cal mínim 3 seccions per publicar (té ${completion.filled}/${completion.total})
                            </div>
                            <button class="pt-btn pt-btn-pub" id="ptePublish" ${completion.filled >= 3 ? '' : 'disabled'}>📡 Publicar pitch</button>
                        </div>
                    </div>
                `}

                ${sectionEditors}

                <div style="margin-top:1rem;padding:0.8rem 1rem;background:var(--bg-panel);border:1px solid var(--border-default);border-radius:6px;font-size:0.78rem;color:var(--text-muted);line-height:1.5;">
                    💡 Tip · les seccions <strong>vision</strong> i <strong>solution</strong> es pre-omplen automàticament des del canvas (si l'has omplert a <a href="/canvas?project=${encodeURIComponent(this.projectId)}" data-link style="color:var(--accent-indigo);">/canvas</a>). Pots ajustar-les aquí. Una vegada publicat, qualsevol amb el link <code>/pitch?project=${this._esc(this.projectId)}</code> el podrà veure.
                </div>
            </div>
        </div>`;
    }

    _bindEdit() {
        // Tagline save
        const tagBtn = document.getElementById('pteSaveTagline');
        const tagInput = document.getElementById('pteTagline');
        const tagMsg = document.getElementById('pteTaglineMsg');
        if (tagBtn && tagInput) {
            tagBtn.addEventListener('click', async () => {
                try {
                    this.pitch = setPitchTagline(this.pitch, tagInput.value);
                    await KB.upsert(this.pitch);
                    if (tagMsg) { tagMsg.textContent = '✓ tagline desada'; tagMsg.className = 'pt-msg ok'; }
                } catch (e) {
                    if (tagMsg) { tagMsg.textContent = '✗ ' + (e?.message || 'error'); tagMsg.className = 'pt-msg err'; }
                }
            });
        }

        // Section saves
        for (const s of PITCH_SECTIONS) {
            const saveBtn = document.querySelector('[data-save="' + s.id + '"]');
            const ta      = document.querySelector('[data-text="' + s.id + '"]');
            const msg     = document.querySelector('[data-msg="' + s.id + '"]');
            const badge   = document.querySelector('[data-badge="' + s.id + '"]');
            if (!saveBtn || !ta) continue;
            saveBtn.addEventListener('click', async () => {
                const val = ta.value || '';
                try {
                    this.pitch = applyPitchSection(this.pitch, s.id, val);
                    await KB.upsert(this.pitch);
                    if (msg) { msg.textContent = '✓ desada'; msg.className = 'pt-msg ok'; }
                    if (badge) badge.innerHTML = '<span style="color:#22c55e;font-weight:700;font-size:11px;">✓ vàlid</span>';
                    this._refreshProgress();
                } catch (e) {
                    if (msg) { msg.textContent = '✗ ' + (e.reason || e.message); msg.className = 'pt-msg err'; }
                }
            });
        }

        // Publish / Unpublish
        const pubBtn   = document.getElementById('ptePublish');
        const unpubBtn = document.getElementById('pteUnpublish');
        if (pubBtn) {
            pubBtn.addEventListener('click', async () => {
                try {
                    const projectName = this.project.nombre || this.project.name || this.project.id;
                    this.pitch = publishPitch(this.pitch, { projectName });
                    await KB.upsert(this.pitch);
                    setTimeout(() => window.location.reload(), 300);
                } catch (e) {
                    alert('No es pot publicar · ' + (e?.message || 'error'));
                }
            });
        }
        if (unpubBtn) {
            unpubBtn.addEventListener('click', async () => {
                try {
                    this.pitch = unpublishPitch(this.pitch);
                    await KB.upsert(this.pitch);
                    setTimeout(() => window.location.reload(), 300);
                } catch (e) {
                    alert('No es pot despublicar · ' + (e?.message || 'error'));
                }
            });
        }
    }

    _refreshProgress() {
        const c = computePitchCompletion(this.pitch);
        const fill = document.querySelector('.pte-progress-fill');
        if (fill) fill.style.width = c.percent + '%';
        // Re-enable publish button if hit threshold
        const pubBtn = document.getElementById('ptePublish');
        if (pubBtn) pubBtn.disabled = c.filled < 3;
    }

    _esc(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
}
