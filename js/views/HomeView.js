// =============================================================================
// TEAMTOWERS SOS V11 — HOME VIEW
// Vista de inicio · sos.teamtowershuma.com/
// =============================================================================

import { store } from '../core/store.js';

export default class HomeView {
    constructor() {
        document.title = 'TeamTowers SOS V11';
    }

    async getHtml() {
        const state    = store.getState();
        const projects = (state.projects || []).filter(p => !p.isArchived);

        return `
        <style>
            .home-wrap {
                display: flex;
                height: 100dvh;
                width: 100vw;
                align-items: center;
                justify-content: center;
                background: var(--bg-dark);
                flex-direction: column;
                gap: var(--space-8);
                padding: var(--space-8);
                animation: fadeIn 0.5s var(--ease-out);
            }

            .home-hero {
                text-align: center;
            }
            .home-hero h1 {
                font-size: clamp(2rem, 6vw, var(--text-3xl));
                font-weight: 800;
                letter-spacing: -2px;
                margin-bottom: var(--space-2);
            }
            .home-hero h1 span { color: var(--accent-indigo); }
            .home-hero p {
                color: var(--text-muted);
                font-size: var(--text-lg);
                font-family: var(--font-mono);
            }

            .home-actions {
                display: flex;
                gap: var(--space-4);
                flex-wrap: wrap;
                justify-content: center;
            }

            .action-card {
                background: linear-gradient(145deg, rgba(25,25,32,0.9), rgba(10,10,15,0.95));
                border: 1px solid var(--glass-border);
                border-radius: var(--radius-xl);
                padding: var(--space-6) var(--space-8);
                cursor: pointer;
                text-decoration: none;
                color: inherit;
                transition: all var(--dur-base) var(--ease-out);
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: var(--space-3);
                min-width: 160px;
                text-align: center;
            }
            .action-card:hover {
                border-color: var(--accent-indigo);
                transform: translateY(-4px);
                box-shadow: var(--shadow-indigo);
            }
            .action-card .icon { font-size: 2rem; }
            .action-card .label {
                font-weight: 800;
                font-size: var(--text-sm);
            }
            .action-card .sublabel {
                font-size: var(--text-xs);
                color: var(--text-muted);
                font-family: var(--font-mono);
            }

            .status-bar {
                position: fixed;
                bottom: var(--space-4);
                right: var(--space-4);
                background: var(--bg-elevated);
                border: 1px solid var(--glass-border);
                border-radius: var(--radius-md);
                padding: var(--space-2) var(--space-4);
                font-family: var(--font-mono);
                font-size: var(--text-xs);
                color: var(--text-muted);
                display: flex;
                align-items: center;
                gap: var(--space-2);
            }
            .status-dot {
                width: 6px; height: 6px;
                border-radius: 50%;
                background: var(--accent-green);
                animation: pulse 2s infinite;
            }

            @media (max-width: 768px) {
                .home-actions { flex-direction: column; align-items: center; }
                .action-card { width: 100%; max-width: 300px; flex-direction: row; text-align: left; }
            }
        </style>

        <div class="home-wrap">
            <div class="home-hero">
                <h1>TeamTowers <span>V11</span></h1>
                <p>Antigravity Kernel · ${projects.length} ecosistema${projects.length !== 1 ? 's' : ''}</p>
            </div>

            <div class="home-actions">
                <a href="/dashboard" data-link class="action-card">
                    <div class="icon">📊</div>
                    <div class="label">Dashboard</div>
                    <div class="sublabel">Overview</div>
                </a>
                <a href="/team" data-link class="action-card">
                    <div class="icon">👥</div>
                    <div class="label">Team</div>
                    <div class="sublabel">Padrón · VNA</div>
                </a>
                <a href="/map" data-link class="action-card">
                    <div class="icon">🕸️</div>
                    <div class="label">Value Map</div>
                    <div class="sublabel">Red de valor</div>
                </a>
                <a href="/paper" data-link class="action-card">
                    <div class="icon">📄</div>
                    <div class="label">Paper</div>
                    <div class="sublabel">Chat · GTD</div>
                </a>
                <a href="/settings" data-link class="action-card">
                    <div class="icon">⚙️</div>
                    <div class="label">Settings</div>
                    <div class="sublabel">Bóveda KB</div>
                </a>
            </div>
        </div>

        <div class="status-bar">
            <div class="status-dot"></div>
            SOS V11 · ${state.config?.version || 'v11'} · Anthropic Primary
        </div>`;
    }

    afterRender() {
        console.log('[HomeView V11] Renderizado.');
    }
}
