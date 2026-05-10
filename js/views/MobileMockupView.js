// TEAMTOWERS SOS V11 — MOBILE MOCKUP VIEW (UX-AUDIT-001 sprint A2)
//
// Mockup design (read-only · static) per a la futura app mobile que ha de:
//   - Gestionar Work Orders del operador (claim · doing · done · ledger)
//   - Comptabilitzar temps i altres aportacions de valor (slicing pie)
//   - Reportar entregables amb evidència (foto · text · arxiu)
//   - Comunicació de l'equip (xat per WO)
//   - Registre d'esdeveniments en permaweb (Arweave) + blockchain (Gnosis)
//   - Ús d'IA (counter de tokens consumits per WO)
//   - Càrrega de saldo prepagat o pay-as-you-go (Stripe Payment Links)
//
// Aquesta vista renderitza el mockup en un viewport simulat de 390×844
// (iPhone 14 Pro) amb 4 pantalles que es poden alternar amb tabs:
//   1. Home (resum del operador · saldo · WOs assignats)
//   2. Work Order detail (timer · evidència · xat · IA assistant)
//   3. Wallet (saldo · top-up · ledger)
//   4. Activity (esdeveniments en permaweb · blockchain timestamps)
//
// L'objectiu és validar IA + UX abans de programar la PWA real (la
// implementació final pot ser PWA o Capacitor wrapper · zero backend).

export default class MobileMockupView {
    constructor() { document.title = 'Mobile Mockup · SOS V11'; }

    async getHtml() {
        return `
        <style>
            .mm-wrap { max-width: 1200px; margin: 0 auto; padding: var(--space-6); animation: fadeIn 0.4s var(--ease-out); color: var(--text-main); }
            .mm-header { padding-bottom: var(--space-6); border-bottom: 1px solid var(--border-default); margin-bottom: var(--space-6); }
            .mm-header h1 { font-size: var(--text-2xl); font-weight: 900; margin-bottom: var(--space-2); }
            .mm-header p { color: var(--text-secondary); font-size: var(--text-sm); max-width: 720px; }

            .mm-tabs { display:flex; gap: var(--space-2); margin-bottom: var(--space-6); flex-wrap: wrap; }
            .mm-tab { padding: 8px 16px; background: var(--bg-elevated); border: 1px solid var(--border-default); border-radius: var(--radius-full); color: var(--text-secondary); cursor: pointer; font-size: var(--text-sm); font-weight: 700; transition: 0.2s; }
            .mm-tab.active { background: var(--accent-indigo); color: var(--text-main); border-color: var(--accent-indigo); }
            .mm-tab:not(.active):hover { color: var(--text-main); }

            .mm-stage { display:flex; gap: var(--space-8); align-items: flex-start; flex-wrap: wrap; }
            .mm-frame {
                width: 390px; height: 844px; background: var(--bg-dark);
                border: 12px solid #1a1a22; border-radius: 50px;
                box-shadow: 0 30px 80px rgba(0,0,0,0.6), 0 0 0 2px rgba(255,255,255,0.04);
                overflow: hidden; position: relative; flex-shrink: 0;
            }
            .mm-frame::before { content: ''; position: absolute; top: 12px; left: 50%; transform: translateX(-50%); width: 120px; height: 28px; background: var(--bg-dark); border-radius: 0 0 14px 14px; z-index: 10; }
            .mm-screen { width: 100%; height: 100%; overflow-y: auto; background: var(--bg-panel); color: var(--text-main); padding: 50px 0 0 0; font-family: var(--font-base); }

            .mm-notes { flex: 1; min-width: 320px; }
            .mm-notes h3 { font-size: var(--text-lg); font-weight: 800; margin-bottom: var(--space-3); }
            .mm-notes ul { list-style: none; padding: 0; }
            .mm-notes li { padding: 8px 0; border-bottom: 1px dashed var(--border-default); font-size: var(--text-sm); color: var(--text-secondary); }
            .mm-notes li strong { color: var(--text-main); }
            .mm-notes-block { background: var(--bg-elevated); border: 1px solid var(--border-default); border-radius: var(--radius-lg); padding: var(--space-6); margin-bottom: var(--space-4); }

            /* ── INNER MOBILE STYLES ────────────────────────────────────── */
            .ms-statusbar { padding: 0 1rem; height: 36px; display:flex; align-items:center; justify-content:space-between; font-size: 11px; font-family: var(--font-mono); color: rgba(255,255,255,0.6); }
            .ms-screen-pad { padding: 0 16px 24px; }
            .ms-h1 { font-size: 22px; font-weight: 900; margin: 8px 0; color: var(--text-main); }
            .ms-card { background: var(--glass-hover); border: 1px solid var(--border-default); border-radius: 14px; padding: 14px; margin-bottom: 10px; }
            .ms-row { display:flex; align-items:center; justify-content:space-between; }
            .ms-mut { color: rgba(255,255,255,0.5); font-size: 11px; }
            .ms-acc-indigo { color: #818cf8; }
            .ms-acc-green  { color: #4ade80; }
            .ms-acc-orange { color: #fb923c; }
            .ms-acc-purple { color: #c084fc; }
            .ms-acc-red    { color: #f87171; }
            .ms-pill { display:inline-block; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 700; letter-spacing: 0.05em; }
            .ms-btn { width:100%; padding: 12px; border-radius: 12px; border: 0; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: var(--text-main); font-weight: 700; font-size: 14px; cursor:pointer; }
            .ms-btn-ghost { background: transparent; border: 1px solid rgba(255,255,255,0.15); color: var(--text-main); }
            .ms-tabbar { position: absolute; bottom: 0; left: 0; right: 0; height: 70px; background: var(--bg-panel); backdrop-filter: blur(10px); border-top: 1px solid rgba(255,255,255,0.05); display:flex; align-items:center; justify-content:space-around; padding-bottom: 14px; }
            .ms-tabbar-icon { display:flex; flex-direction:column; align-items:center; gap: 2px; font-size: 10px; color: rgba(255,255,255,0.45); }
            .ms-tabbar-icon.active { color: #818cf8; }
            .ms-timer { font-family: var(--font-mono); font-size: 32px; font-weight: 800; color: #4ade80; text-align:center; padding: 16px 0; }
            .ms-evidence { display:grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-top: 10px; }
            .ms-evidence > div { aspect-ratio: 1; background: var(--glass-hover); border-radius: 8px; display:flex; align-items:center; justify-content:center; font-size: 22px; }
            .ms-event-line { display:flex; gap: 10px; padding: 10px 0; border-bottom: 1px dashed rgba(255,255,255,0.06); }
            .ms-event-icon { width: 28px; height: 28px; flex-shrink: 0; border-radius: 50%; display:flex; align-items:center; justify-content:center; font-size: 14px; }
            .ms-event-text { flex: 1; font-size: 13px; }
            .ms-event-time { font-size: 10px; color: rgba(255,255,255,0.4); font-family: var(--font-mono); }

            .mm-screen-block { display: none; }
            .mm-screen-block.active { display: block; }

            @media (max-width: 760px) {
                .mm-stage { flex-direction: column; }
                .mm-frame { transform: scale(0.85); transform-origin: top left; }
            }
        </style>

        <div class="mm-wrap">
            <div class="mm-header">
                <h1>📱 Mobile App Mockup · Work Orders</h1>
                <p>UX-AUDIT-001 sprint A2 · Mockup estàtic de la futura PWA mobile per a operadors. 4 pantalles que cobreixen el cicle complet: <strong>WO assignats → cronometratge → evidència → ledger → permaweb/blockchain</strong>. La implementació final pot ser PWA o Capacitor amb el mateix codi local-first del SOS desktop · zero backend nou.</p>
            </div>

            <div class="mm-tabs">
                <button class="mm-tab active" data-mm-screen="home">🏠 Home</button>
                <button class="mm-tab" data-mm-screen="wo">⏱ WO Detail</button>
                <button class="mm-tab" data-mm-screen="wallet">💳 Wallet</button>
                <button class="mm-tab" data-mm-screen="activity">📡 Activity</button>
            </div>

            <div class="mm-stage">
                <div class="mm-frame">
                    <div class="mm-screen">
                        ${this._renderHome()}
                        ${this._renderWO()}
                        ${this._renderWallet()}
                        ${this._renderActivity()}
                    </div>
                </div>

                <div class="mm-notes">
                    <div class="mm-notes-block">
                        <h3>🎯 Decisions de disseny</h3>
                        <ul>
                            <li><strong>Local-first idèntic al desktop</strong> · IndexedDB · sense backend nou. Sync amb Arweave + Gnosis quan WO passa a <em>ledgered</em>.</li>
                            <li><strong>Timer físic visible</strong> · cada WO té un cronòmetre persistit. En segon pla l'app conta minuts.</li>
                            <li><strong>Evidència mínima 3 elements</strong> · foto · text · arxiu. La que apliqui per la WO.</li>
                            <li><strong>Esdeveniment a permaweb</strong> · només quan WO arriba a <em>ledgered</em> · l'usuari aprova el cost (Arweave ~ 0.001€) abans de signar.</li>
                            <li><strong>Saldo prepagat o pay-as-you-go</strong> · l'usuari escull al primer top-up · zero claus secret/restricted al frontend (Stripe Payment Links).</li>
                            <li><strong>Tab bar inferior 4 punts</strong> · Home · WO · Wallet · Activity. Sense menus laterals.</li>
                        </ul>
                    </div>

                    <div class="mm-notes-block">
                        <h3>🔌 Tech stack proposat</h3>
                        <ul>
                            <li><strong>PWA</strong> amb manifest + service worker · install des del navegador.</li>
                            <li><strong>WebCrypto ECDSA P-256</strong> per signar evidències i events (idèntic al pact builder).</li>
                            <li><strong>Arweave-js</strong> per upload async (cost cobertut amb el saldo del wallet).</li>
                            <li><strong>WalletConnect EIP-191</strong> per signar timestamps a Gnosis.</li>
                            <li><strong>OpenTimestamps</strong> per ancoratge legal Bitcoin (eIDAS).</li>
                            <li><strong>Stripe Payment Links</strong> per top-up · obre nou tab del navegador.</li>
                            <li><strong>Anthropic via Netlify proxy</strong> · idèntic al desktop · counter de tokens per WO.</li>
                        </ul>
                    </div>

                    <div class="mm-notes-block">
                        <h3>🛣 Roadmap (estimat)</h3>
                        <ul>
                            <li><strong>Sprint 1 · 2 setmanes</strong> · PWA shell + Home + WO list (només lectura del KB del desktop).</li>
                            <li><strong>Sprint 2 · 2 setmanes</strong> · Timer + claim/release de WO + evidència local.</li>
                            <li><strong>Sprint 3 · 1 setmana</strong> · Wallet + Stripe Payment Links + saldo prepagat.</li>
                            <li><strong>Sprint 4 · 2 setmanes</strong> · Sync Arweave (PERMAWEB-001) i Gnosis (PUBLICREG-001).</li>
                            <li><strong>Sprint 5 · 1 setmana</strong> · IA on-device counter + suggestions per WO.</li>
                            <li>Total: <strong>8 setmanes</strong> a 1 dev part-time.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>`;
    }

    _renderHome() {
        return `
        <div class="mm-screen-block active" data-mm-block="home">
            <div class="ms-statusbar"><span>9:41</span><span>● ● ● 100%</span></div>
            <div class="ms-screen-pad">
                <div class="ms-row">
                    <div>
                        <div class="ms-mut">Hola, Alvaro</div>
                        <div class="ms-h1">Avui</div>
                    </div>
                    <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#c25a3a,#5a6e4f);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;">AS</div>
                </div>

                <div class="ms-card" style="background:linear-gradient(135deg,rgba(99,102,241,0.18),rgba(192,132,252,0.12));border-color:rgba(99,102,241,0.3);">
                    <div class="ms-mut">Saldo wallet</div>
                    <div style="font-size:28px;font-weight:900;margin:4px 0;">42,80 €</div>
                    <div class="ms-row">
                        <span class="ms-pill" style="background:rgba(99,102,241,0.2);color:#a5b4fc;">PRO · 9€/mes</span>
                        <span class="ms-mut" style="font-size:10px;">+ pay-as-you-go</span>
                    </div>
                </div>

                <div class="ms-mut" style="text-transform:uppercase;letter-spacing:0.1em;font-weight:700;font-size:10px;margin:14px 0 8px;">Work Orders assignats · 3</div>

                <div class="ms-card" onclick="" style="border-left: 3px solid #fbbf24;">
                    <div class="ms-row">
                        <span class="ms-pill" style="background:rgba(251,191,36,0.15);color:#fbbf24;">DOING</span>
                        <span class="ms-mut">Hortet · #12</span>
                    </div>
                    <div style="font-size:14px;font-weight:700;margin-top:4px;">Plantar tomateres lot B</div>
                    <div class="ms-mut" style="font-size:11px;margin-top:2px;">⏱ 32 min · contant</div>
                </div>

                <div class="ms-card" style="border-left: 3px solid #6366f1;">
                    <div class="ms-row">
                        <span class="ms-pill" style="background:rgba(99,102,241,0.15);color:#a5b4fc;">BACKLOG</span>
                        <span class="ms-mut">Cohort 0 · #45</span>
                    </div>
                    <div style="font-size:14px;font-weight:700;margin-top:4px;">Onboarding nou membre Apolo</div>
                    <div class="ms-mut" style="font-size:11px;margin-top:2px;">📅 due demà · 25 min est</div>
                </div>

                <div class="ms-card" style="border-left: 3px solid #4ade80;">
                    <div class="ms-row">
                        <span class="ms-pill" style="background:rgba(34,197,94,0.15);color:#4ade80;">LEDGERED</span>
                        <span class="ms-mut">Hortet · #11</span>
                    </div>
                    <div style="font-size:14px;font-weight:700;margin-top:4px;">Reg gota a gota zona A</div>
                    <div class="ms-mut" style="font-size:11px;margin-top:2px;">✓ contabilitzat · 18 min</div>
                </div>
            </div>
            ${this._tabbar('home')}
        </div>`;
    }

    _renderWO() {
        return `
        <div class="mm-screen-block" data-mm-block="wo">
            <div class="ms-statusbar"><span>9:41</span><span>● ● ● 100%</span></div>
            <div class="ms-screen-pad">
                <div class="ms-row">
                    <span style="font-size:18px;">←</span>
                    <span class="ms-pill" style="background:rgba(251,191,36,0.15);color:#fbbf24;">DOING</span>
                </div>
                <div class="ms-h1" style="margin-top:10px;">Plantar tomateres lot B</div>
                <div class="ms-mut">Hortet Vallès · WO #12 · per @Demeter</div>

                <div class="ms-card">
                    <div class="ms-mut">⏱ Cronòmetre</div>
                    <div class="ms-timer">00:32:14</div>
                    <button class="ms-btn-ghost ms-btn">⏸ Pausar</button>
                </div>

                <div class="ms-card">
                    <div class="ms-mut" style="margin-bottom:6px;">📸 Evidència (mínim 1)</div>
                    <div class="ms-evidence">
                        <div>📷</div>
                        <div>📝</div>
                        <div>📎</div>
                    </div>
                    <div class="ms-mut" style="font-size:11px;margin-top:8px;">2 fotos · 1 nota · 0 arxius</div>
                </div>

                <div class="ms-card" style="background:rgba(192,132,252,0.06);border-color:rgba(192,132,252,0.2);">
                    <div class="ms-row">
                        <div class="ms-acc-purple" style="font-weight:700;font-size:13px;">🤖 IA · ${'<assistant>'}</div>
                        <span class="ms-mut">142 tokens</span>
                    </div>
                    <div style="font-size:13px;margin-top:6px;color:rgba(255,255,255,0.85);">Suggereixo separar 30 cm entre plantes · vol pluja demà · cobrir amb encoixinat.</div>
                </div>

                <div class="ms-card">
                    <div class="ms-mut" style="margin-bottom:6px;">💬 Comunicació equip · 2</div>
                    <div style="font-size:13px;color:rgba(255,255,255,0.85);">"Recorda regar abans de plantar" — @Hera · 15:42</div>
                </div>

                <button class="ms-btn ms-acc-green" style="background:linear-gradient(135deg,#16a34a,#22c55e);">✓ Marcar com a fet</button>
            </div>
            ${this._tabbar('wo')}
        </div>`;
    }

    _renderWallet() {
        return `
        <div class="mm-screen-block" data-mm-block="wallet">
            <div class="ms-statusbar"><span>9:41</span><span>● ● ● 100%</span></div>
            <div class="ms-screen-pad">
                <div class="ms-h1" style="margin-top:10px;">💳 Wallet</div>

                <div class="ms-card" style="background:linear-gradient(135deg,rgba(99,102,241,0.2),rgba(192,132,252,0.12));border-color:rgba(99,102,241,0.4);text-align:center;">
                    <div class="ms-mut">Saldo prepagat</div>
                    <div style="font-size:42px;font-weight:900;margin:6px 0;">42,80 €</div>
                    <div class="ms-mut" style="font-size:11px;">~4.280 tokens IA · ~280 esdeveniments Arweave</div>
                </div>

                <div class="ms-row" style="gap:8px;">
                    <button class="ms-btn" style="flex:1;">+ Recarregar</button>
                    <button class="ms-btn-ghost ms-btn" style="flex:1;">Pay-as-you-go</button>
                </div>

                <div class="ms-mut" style="text-transform:uppercase;letter-spacing:0.1em;font-weight:700;font-size:10px;margin:18px 0 8px;">Top-up amounts</div>

                <div class="ms-row" style="gap:6px;">
                    <button class="ms-btn-ghost ms-btn" style="flex:1;font-size:13px;">5 €</button>
                    <button class="ms-btn-ghost ms-btn" style="flex:1;font-size:13px;">10 €</button>
                    <button class="ms-btn-ghost ms-btn" style="flex:1;font-size:13px;">25 €</button>
                </div>

                <div class="ms-mut" style="text-transform:uppercase;letter-spacing:0.1em;font-weight:700;font-size:10px;margin:18px 0 8px;">Ledger · darrers consums</div>

                <div class="ms-card">
                    <div class="ms-row">
                        <div style="font-size:13px;"><span class="ms-acc-purple">🤖</span> WO #12 · IA Claude</div>
                        <div class="ms-acc-red">−0,18 €</div>
                    </div>
                    <div class="ms-mut" style="font-size:10px;">142 tokens · 16 min</div>
                </div>
                <div class="ms-card">
                    <div class="ms-row">
                        <div style="font-size:13px;"><span class="ms-acc-orange">📡</span> WO #11 · Arweave</div>
                        <div class="ms-acc-red">−0,003 €</div>
                    </div>
                    <div class="ms-mut" style="font-size:10px;">3.2 KB · timestamp legal</div>
                </div>
                <div class="ms-card">
                    <div class="ms-row">
                        <div style="font-size:13px;"><span class="ms-acc-green">+</span> Top-up Stripe</div>
                        <div class="ms-acc-green">+25,00 €</div>
                    </div>
                    <div class="ms-mut" style="font-size:10px;">Visa **** 4242 · 28 abr</div>
                </div>
            </div>
            ${this._tabbar('wallet')}
        </div>`;
    }

    _renderActivity() {
        return `
        <div class="mm-screen-block" data-mm-block="activity">
            <div class="ms-statusbar"><span>9:41</span><span>● ● ● 100%</span></div>
            <div class="ms-screen-pad">
                <div class="ms-h1" style="margin-top:10px;">📡 Activity</div>
                <div class="ms-mut">Esdeveniments registrats en permaweb i blockchain</div>

                <div class="ms-card">
                    <div class="ms-event-line">
                        <div class="ms-event-icon" style="background:rgba(34,197,94,0.15);">✓</div>
                        <div class="ms-event-text">
                            <div><strong>WO #11 ledgered</strong> · Reg gota a gota</div>
                            <div class="ms-event-time">arweave · tx-id 7s4k…2bX9 · ara fa 12 min</div>
                        </div>
                    </div>
                    <div class="ms-event-line">
                        <div class="ms-event-icon" style="background:rgba(99,102,241,0.15);">⚓</div>
                        <div class="ms-event-text">
                            <div><strong>OpenTimestamps anchor</strong> · WO #11</div>
                            <div class="ms-event-time">Bitcoin block 829.142 · ara fa 14 min</div>
                        </div>
                    </div>
                    <div class="ms-event-line">
                        <div class="ms-event-icon" style="background:rgba(251,146,60,0.15);">🔐</div>
                        <div class="ms-event-text">
                            <div><strong>Pacte signat</strong> · ECDSA P-256</div>
                            <div class="ms-event-time">arweave · tx-id 9p2m…F4kQ · ahir</div>
                        </div>
                    </div>
                    <div class="ms-event-line">
                        <div class="ms-event-icon" style="background:rgba(192,132,252,0.15);">🤖</div>
                        <div class="ms-event-text">
                            <div><strong>IA suggestió</strong> · WO #12 separació tomateres</div>
                            <div class="ms-event-time">claude-sonnet · 142 tokens · ara fa 32 min</div>
                        </div>
                    </div>
                    <div class="ms-event-line" style="border-bottom:0;">
                        <div class="ms-event-icon" style="background:rgba(244,114,182,0.15);">🪙</div>
                        <div class="ms-event-text">
                            <div><strong>Slicing Pie update</strong> · +0.4 punts (time)</div>
                            <div class="ms-event-time">gnosis chain · block 32M · ahir</div>
                        </div>
                    </div>
                </div>

                <button class="ms-btn-ghost ms-btn">Veure tots els esdeveniments</button>
            </div>
            ${this._tabbar('activity')}
        </div>`;
    }

    _tabbar(active) {
        const items = [
            { id: 'home',     icon: '🏠', label: 'Home' },
            { id: 'wo',       icon: '⏱',  label: 'WO' },
            { id: 'wallet',   icon: '💳', label: 'Wallet' },
            { id: 'activity', icon: '📡', label: 'Activity' },
        ];
        return `<div class="ms-tabbar">${items.map(i => `
            <div class="ms-tabbar-icon ${i.id === active ? 'active' : ''}">
                <span style="font-size:20px;">${i.icon}</span>
                <span>${i.label}</span>
            </div>`).join('')}</div>`;
    }

    async afterRender() {
        const tabs   = document.querySelectorAll('.mm-tab');
        const blocks = document.querySelectorAll('.mm-screen-block');
        tabs.forEach(t => {
            t.addEventListener('click', () => {
                tabs.forEach(x => x.classList.remove('active'));
                blocks.forEach(b => b.classList.remove('active'));
                t.classList.add('active');
                const screen = t.getAttribute('data-mm-screen');
                document.querySelector(`[data-mm-block="${screen}"]`)?.classList.add('active');
            });
        });
    }
}
