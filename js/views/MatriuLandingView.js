// TEAMTOWERS SOS V11 — MATRIU LANDING VIEW (MAT-002-H)
//
// Landing pública de Matriu Incoopadora · /matriu
// Reproduce fielmente la landing de Matriu_Landing_standalone.html en
// catalán. Usa los catálogos canónicos `MATRIU_COHORT_0`,
// `MATRIU_PERKS`, `MATRIU_FAIR_FRACTAL_RULES`, `MATRIU_VALUE_KINDS`
// definidos en `js/core/matriuTemplate.js` para que un cambio en los
// perks o reglas se refleje aquí sin tocar el HTML.
//
// Identidad visual Matriu:
//   - Fondo crema           #f1ebde
//   - Texto verde oscuro    #2a3a2a
//   - Acento terracota      #c25a3a
//   - Verde olivo           #5a6e4f
//   - Azul profundo         #2c4a7a
//   - Tipografía: Instrument Serif italic (titulares) + Inter (cuerpo)

import {
    MATRIU_COHORT_0,
    MATRIU_PERKS,
    MATRIU_FAIR_FRACTAL_RULES,
    MATRIU_VALUE_KINDS,
} from '../core/matriuTemplate.js';
import { renderExplainerBadge, bindExplainerBadges, ensureExplainerStyle } from '../core/didacticService.js';

// 4 ejemplos de transacciones del Value Mapping Engine (estáticos · UI)
const VME_EXAMPLES = Object.freeze([
    { initials: 'JT', name: 'Jordi T. · pagès',  contribution: '120 kg verdura · setmana 4', project: 'Hortet de la Vall', detail: '3 cistelles/mes · 2 anys',         reward: '+3 CISTL'  },
    { initials: 'NB', name: 'Núria B. · dev',    contribution: 'Smart contract Pact v2',     project: 'Bici-Repara',       detail: 'Equity slicing pie',              reward: '+12 EQUITY' },
    { initials: 'AR', name: 'Aitana R. · invest.', contribution: 'Capital · 2.500 EURe',     project: 'Llavor Digital',    detail: "Drets d'ús · cohort 1",            reward: '+1 SEAT'    },
    { initials: 'ML', name: 'Marc L. · facilit.', contribution: 'Sessió CoP · 3h',           project: 'Cuidem-nos Coop',   detail: 'Reputació + crèdits',             reward: '+45 TW'     },
]);

// 4 fases del Exit Model
const EXIT_PHASES = Object.freeze([
    { num: '01', title: 'Trigger',     timing: 'SET A LA RONDA',    body: "Una condició pre-acordada s'activa: oferta de compra, finestra de liquidació anual, dissolució, traspàs." },
    { num: '02', title: 'Snapshot',    timing: 'EN EL MATEIX BLOC', body: 'Es congelen totes les posicions de slicing pie en aquell bloc. Ningú modifica res. Tot queda a Arweave.' },
    { num: '03', title: 'Càlcul',      timing: 'FÒRMULA PÚBLICA',   body: 'El contracte aplica la fórmula a cada posició. Diners cash, tokens swappables, drets futurs — segons el tipus.' },
    { num: '04', title: 'Liquidació',  timing: '< 24 H',            body: 'Diners als wallets. Drets transferits. Reputació mantinguda. Una transacció, sense cua, sense pèrdua de senyal.' },
]);

const EXIT_INVARIANTS = Object.freeze([
    { tag: '→ MAI',     headline: 'El fundador no decideix qui surt', body: "L'algorisme pre-aprovat sí. La regla és el tracte; el cas no." },
    { tag: '→ NO HI HA', headline: 'Cap "ronda morta"',                body: 'Si el projecte no compleix mètriques, es liquida en finestra anual. No s\'arrossega.' },
    { tag: '→ SEMPRE',  headline: 'Auditable per qualsevol',           body: 'El càlcul i la liquidació són públics, verificables on-chain.' },
]);

// 4 perks del bloque "Per què ara" · subset narrativo (los 6 completos van en sección Cohort 0 más abajo)
const WHY_NOW = Object.freeze([
    { num: '01', title: 'Multiplicador fundacional',   body: 'Les 100 primeres persones reben un coeficient ×1.5 de per vida en cada repartiment del seu projecte.' },
    { num: '02', title: 'Drets de governança ECO',     body: 'Vot ponderat a totes les rondes FICE, també les futures, sense haver de tornar a comprar res.' },
    { num: '03', title: 'Crèdits de plataforma',       body: '2.000 crèdits per gastar en IA, attestations i tokenitzacions — abans que la cua els torni grocs.' },
    { num: '04', title: 'Llinatge visible',            body: 'El teu nom queda a la cadena fundacional. Cada projecte futur sap qui va seure abans.' },
]);

// Stats hero
function statsRow() {
    return [
        { v: String(MATRIU_COHORT_0.capacity), label: 'places fundacionals' },
        { v: '24',                              label: 'ja dins'              },
        { v: '∞',                               label: 'tipus de valor'       },
        { v: '0s',                              label: 'latència de repartiment' },
    ];
}

function escapeHtml(s) {
    if (typeof s !== 'string') return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default class MatriuLandingView {
    constructor() {
        document.title = 'Matriu Incoopadora · Cohort 0 oberta · 24/100';
    }

    async getHtml() {
        const seatsTotal  = MATRIU_COHORT_0.capacity;
        const seatsTaken  = 24;
        const seatsLeft   = seatsTotal - seatsTaken;
        const stats       = statsRow();

        return `
        <style>
            /* ── Matriu skin ───────────────────────────────────────────── */
            .mt-shell {
                --mt-cream:  #f1ebde;
                --mt-dark:   #2a3a2a;
                --mt-tcotta: #c25a3a;
                --mt-olive:  #5a6e4f;
                --mt-blue:   #2c4a7a;
                --mt-ink:    #1a1f1a;
                --mt-rule:   rgba(42,58,42,0.18);
                --mt-line:   rgba(42,58,42,0.10);
                background: var(--mt-cream);
                color: var(--mt-dark);
                font-family: 'Inter', 'Inter Tight', -apple-system, BlinkMacSystemFont, sans-serif;
                line-height: 1.5;
                width: 100vw;
                min-height: 100%;
                overflow-x: hidden;
            }
            .mt-italic { font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-weight: 400; }
            .mt-mono   { font-family: ui-monospace, SFMono-Regular, monospace; }
            .mt-shell a { color: inherit; }
            .mt-container { max-width: 1240px; margin: 0 auto; padding: 0 clamp(20px, 4vw, 48px); }

            /* ── Topbar mini ──────────────────────────────────────────── */
            .mt-topbar { display: flex; align-items: center; justify-content: space-between; padding: 22px clamp(20px, 4vw, 48px); border-bottom: 1px solid var(--mt-line); position: sticky; top: 0; background: rgba(241,235,222,0.92); backdrop-filter: blur(8px); z-index: 10; }
            .mt-brand { font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 26px; color: var(--mt-dark); display: inline-flex; align-items: center; gap: 10px; text-decoration: none; }
            .mt-brand-mark { width: 24px; height: 24px; display: inline-block; }
            .mt-nav { display: flex; gap: clamp(12px, 2vw, 28px); font-size: 13px; color: var(--mt-dark); opacity: 0.78; }
            .mt-nav a { text-decoration: none; transition: opacity 0.2s; }
            .mt-nav a:hover { opacity: 1; }
            .mt-cta-mini { background: var(--mt-ink); color: var(--mt-cream); padding: 10px 18px; border-radius: 999px; font-size: 13px; font-weight: 600; text-decoration: none; transition: transform 0.2s; }
            .mt-cta-mini:hover { transform: translateY(-1px); }

            /* ── Status pill cohort ──────────────────────────────────── */
            .mt-pill { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; background: rgba(42,58,42,0.06); border: 1px solid var(--mt-rule); border-radius: 999px; font-size: 12px; color: var(--mt-dark); font-family: ui-monospace, monospace; }
            .mt-pill::before { content: '●'; color: var(--mt-tcotta); animation: mtPulse 2s ease-in-out infinite; }
            @keyframes mtPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

            /* ── Hero ─────────────────────────────────────────────────── */
            .mt-hero { padding: clamp(48px, 8vw, 96px) 0 clamp(40px, 6vw, 64px); }
            .mt-hero-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: clamp(24px, 4vw, 64px); align-items: end; }
            .mt-hero h1 { font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-weight: 400; font-size: clamp(48px, 9vw, 120px); line-height: 0.95; letter-spacing: -0.02em; color: var(--mt-dark); margin-top: 22px; }
            .mt-hero h1 .blk { font-style: normal; font-family: 'Inter', 'Inter Tight', sans-serif; font-weight: 700; }
            .mt-hero-counter { font-family: ui-monospace, monospace; font-size: 11px; color: var(--mt-dark); opacity: 0.55; margin-bottom: 8px; letter-spacing: 0.08em; }
            .mt-hero-block { display: flex; flex-direction: column; gap: 24px; }
            .mt-hero-num { font-family: ui-monospace, monospace; font-size: 11px; color: var(--mt-dark); opacity: 0.55; letter-spacing: 0.08em; }
            .mt-hero-body { font-size: 16px; line-height: 1.6; color: var(--mt-dark); max-width: 440px; }
            .mt-hero-cta { display: inline-flex; align-items: center; gap: 12px; padding: 16px 28px; background: var(--mt-ink); color: var(--mt-cream); border-radius: 999px; text-decoration: none; font-weight: 600; font-size: 15px; transition: transform 0.2s, box-shadow 0.2s; align-self: flex-start; box-shadow: 0 2px 0 rgba(0,0,0,0.05); }
            .mt-hero-cta:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(26,31,26,0.25); }
            .mt-hero-meta { display: flex; flex-direction: column; gap: 8px; font-size: 13px; color: var(--mt-dark); }
            .mt-hero-meta-key { font-family: ui-monospace, monospace; font-size: 10px; opacity: 0.55; letter-spacing: 0.08em; text-transform: uppercase; }

            /* ── Stats row ────────────────────────────────────────────── */
            .mt-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; border-top: 1px solid var(--mt-rule); border-bottom: 1px solid var(--mt-rule); padding: clamp(32px, 4vw, 56px) 0; }
            .mt-stat { padding: 0 clamp(8px, 2vw, 24px); border-right: 1px solid var(--mt-line); }
            .mt-stat:last-child { border-right: 0; }
            .mt-stat-v { font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: clamp(48px, 6vw, 84px); line-height: 1; color: var(--mt-dark); }
            .mt-stat-l { font-size: 12px; color: var(--mt-dark); opacity: 0.65; margin-top: 8px; font-family: ui-monospace, monospace; letter-spacing: 0.04em; text-transform: uppercase; }

            /* ── Section base ─────────────────────────────────────────── */
            .mt-section { padding: clamp(64px, 10vw, 120px) 0; border-bottom: 1px solid var(--mt-rule); }
            .mt-section-tag { font-family: ui-monospace, monospace; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--mt-dark); opacity: 0.55; margin-bottom: 18px; }
            .mt-section h2 { font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-weight: 400; font-size: clamp(40px, 6vw, 80px); line-height: 1.05; letter-spacing: -0.02em; color: var(--mt-dark); margin-bottom: 24px; }
            .mt-section h2 strong { font-weight: 400; color: var(--mt-tcotta); }
            .mt-section-lead { font-size: 16px; line-height: 1.7; max-width: 640px; color: var(--mt-dark); margin-bottom: 48px; }

            /* ── Cards 4 cols ─────────────────────────────────────────── */
            .mt-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--mt-rule); border: 1px solid var(--mt-rule); }
            .mt-card { background: var(--mt-cream); padding: clamp(24px, 3vw, 36px); display: flex; flex-direction: column; gap: 14px; min-height: 220px; }
            .mt-card-num { font-family: ui-monospace, monospace; font-size: 11px; opacity: 0.55; letter-spacing: 0.08em; }
            .mt-card-title { font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 22px; line-height: 1.2; color: var(--mt-dark); }
            .mt-card-body { font-size: 14px; line-height: 1.55; color: var(--mt-dark); }
            .mt-card-meta { font-family: ui-monospace, monospace; font-size: 10px; opacity: 0.55; letter-spacing: 0.08em; text-transform: uppercase; margin-top: auto; }

            /* ── Value Mapping Engine ─────────────────────────────────── */
            .mt-vme { display: flex; flex-direction: column; gap: 12px; max-width: 920px; }
            .mt-vme-head { display: flex; justify-content: space-between; align-items: baseline; font-family: ui-monospace, monospace; font-size: 11px; opacity: 0.6; padding-bottom: 8px; border-bottom: 1px solid var(--mt-line); margin-bottom: 8px; }
            .mt-vme-row { display: grid; grid-template-columns: 44px 1.2fr 1fr 1fr auto; gap: 16px; align-items: center; padding: 14px 0; border-bottom: 1px solid var(--mt-line); }
            .mt-vme-row:last-child { border-bottom: 0; }
            .mt-vme-init { width: 38px; height: 38px; border-radius: 50%; background: var(--mt-ink); color: var(--mt-cream); display: inline-flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; font-family: 'Inter', sans-serif; }
            .mt-vme-name { font-weight: 600; font-size: 14px; color: var(--mt-dark); }
            .mt-vme-name span { display: block; font-weight: 400; opacity: 0.6; font-size: 12px; margin-top: 2px; }
            .mt-vme-arr { font-size: 18px; opacity: 0.4; text-align: center; }
            .mt-vme-prj { font-size: 14px; color: var(--mt-dark); }
            .mt-vme-prj span { display: block; opacity: 0.6; font-size: 12px; margin-top: 2px; }
            .mt-vme-rew { font-family: ui-monospace, monospace; font-size: 13px; font-weight: 700; color: var(--mt-tcotta); padding: 6px 10px; border: 1px solid var(--mt-tcotta); border-radius: 999px; white-space: nowrap; }

            /* ── Exit model ───────────────────────────────────────────── */
            .mt-exit-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--mt-rule); border: 1px solid var(--mt-rule); margin-bottom: 32px; }
            .mt-exit-rules { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; padding-top: 24px; }
            .mt-exit-rule { padding: 18px 0; border-top: 1px solid var(--mt-rule); }
            .mt-exit-rule-tag { font-family: ui-monospace, monospace; font-size: 11px; opacity: 0.55; margin-bottom: 8px; letter-spacing: 0.06em; }
            .mt-exit-rule-h { font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 19px; color: var(--mt-dark); line-height: 1.2; margin-bottom: 6px; }
            .mt-exit-rule-b { font-size: 13px; color: var(--mt-dark); opacity: 0.78; line-height: 1.55; }

            /* ── Cohort 0 perks (6) ──────────────────────────────────── */
            .mt-cohort-head { display: flex; justify-content: space-between; align-items: end; flex-wrap: wrap; gap: 16px; margin-bottom: 32px; }
            .mt-cohort-counter { background: var(--mt-tcotta); color: white; padding: 10px 18px; border-radius: 999px; font-family: ui-monospace, monospace; font-size: 13px; font-weight: 700; }
            .mt-cohort-counter span { opacity: 0.8; font-weight: 400; margin-left: 6px; }
            .mt-perks { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1px; background: var(--mt-rule); border: 1px solid var(--mt-rule); }
            .mt-perk { background: var(--mt-cream); padding: 22px 24px; display: grid; grid-template-columns: 24px 1fr 32px; gap: 12px; align-items: start; }
            .mt-perk-check { color: var(--mt-tcotta); font-weight: 800; font-size: 16px; line-height: 1.4; }
            .mt-perk-title { font-weight: 600; font-size: 15px; color: var(--mt-dark); margin-bottom: 4px; }
            .mt-perk-body { font-size: 13px; color: var(--mt-dark); opacity: 0.72; line-height: 1.5; }
            .mt-perk-num { font-family: ui-monospace, monospace; font-size: 11px; opacity: 0.45; text-align: right; }

            /* ── Footer CTA ──────────────────────────────────────────── */
            .mt-footer-cta { padding: clamp(80px, 12vw, 140px) 0 clamp(40px, 6vw, 64px); }
            .mt-footer-cta h2 { font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: clamp(48px, 8vw, 110px); line-height: 1; color: var(--mt-dark); letter-spacing: -0.02em; }
            .mt-footer-cta h2 strong { font-weight: 400; color: var(--mt-tcotta); }
            .mt-footer-lead { font-size: 17px; max-width: 600px; margin-top: 32px; line-height: 1.6; }
            .mt-footer-actions { display: flex; gap: 12px; margin-top: 36px; flex-wrap: wrap; align-items: center; }
            .mt-cta-second { padding: 16px 28px; background: transparent; color: var(--mt-dark); border: 1px solid var(--mt-rule); border-radius: 999px; text-decoration: none; font-weight: 600; font-size: 15px; transition: background 0.2s; }
            .mt-cta-second:hover { background: rgba(42,58,42,0.06); }
            .mt-disclaimer { font-family: ui-monospace, monospace; font-size: 11px; opacity: 0.55; letter-spacing: 0.05em; text-transform: uppercase; margin-top: 28px; }

            /* ── Footer cooperativa ──────────────────────────────────── */
            .mt-footer { padding: clamp(40px, 5vw, 72px) 0 clamp(28px, 3vw, 40px); border-top: 1px solid var(--mt-rule); display: grid; grid-template-columns: 1.4fr 1fr 1fr 1fr; gap: 48px; }
            .mt-footer-brand { font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 28px; color: var(--mt-dark); }
            .mt-footer-brand-sub { font-size: 13px; opacity: 0.65; margin-top: 8px; }
            .mt-footer-tag { font-family: ui-monospace, monospace; font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.55; margin-top: 12px; }
            .mt-footer-col h5 { font-size: 11px; font-family: ui-monospace, monospace; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.55; margin-bottom: 16px; font-weight: 500; }
            .mt-footer-col a { display: block; padding: 4px 0; font-size: 14px; color: var(--mt-dark); text-decoration: none; opacity: 0.85; transition: opacity 0.2s; }
            .mt-footer-col a:hover { opacity: 1; text-decoration: underline; }
            .mt-footer-bottom { border-top: 1px solid var(--mt-line); padding: 24px clamp(20px, 4vw, 48px); display: flex; justify-content: space-between; font-family: ui-monospace, monospace; font-size: 11px; opacity: 0.55; letter-spacing: 0.05em; flex-wrap: wrap; gap: 12px; }

            /* ── Reservar seient form (modal) ────────────────────────── */
            .mt-modal { position: fixed; inset: 0; background: rgba(26,31,26,0.6); display: none; align-items: center; justify-content: center; z-index: 999; backdrop-filter: blur(6px); }
            .mt-modal.is-open { display: flex; animation: mtFade 0.2s ease-out; }
            @keyframes mtFade { from { opacity: 0; } to { opacity: 1; } }
            .mt-modal-card { background: var(--mt-cream); border-radius: 16px; padding: clamp(28px, 4vw, 44px); max-width: 480px; width: calc(100% - 32px); max-height: 92vh; overflow-y: auto; }
            .mt-modal-card h3 { font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 32px; color: var(--mt-dark); margin-bottom: 8px; }
            .mt-modal-card p  { font-size: 14px; line-height: 1.55; color: var(--mt-dark); opacity: 0.8; margin-bottom: 20px; }
            .mt-input-row { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
            .mt-input-row label { font-family: ui-monospace, monospace; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; opacity: 0.6; }
            .mt-input { width: 100%; padding: 12px 14px; border: 1px solid var(--mt-rule); border-radius: 8px; background: white; font-size: 14px; font-family: inherit; color: var(--mt-dark); outline: none; transition: border-color 0.15s; }
            .mt-input:focus { border-color: var(--mt-tcotta); }
            .mt-modal-actions { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 20px; }
            .mt-modal-cancel { background: transparent; border: 0; color: var(--mt-dark); opacity: 0.6; cursor: pointer; font-size: 14px; padding: 8px 12px; }
            .mt-modal-confirm { background: var(--mt-ink); color: var(--mt-cream); border: 0; padding: 14px 24px; border-radius: 999px; font-weight: 600; font-size: 14px; cursor: pointer; transition: transform 0.15s; }
            .mt-modal-confirm:hover { transform: translateY(-1px); }

            /* ── Responsive ───────────────────────────────────────────── */
            @media (max-width: 880px) {
                .mt-hero-grid    { grid-template-columns: 1fr; }
                .mt-stats        { grid-template-columns: repeat(2, 1fr); gap: 24px; }
                .mt-stat         { border-right: 0; }
                .mt-grid-4       { grid-template-columns: repeat(2, 1fr); }
                .mt-vme-row      { grid-template-columns: 38px 1fr auto; }
                .mt-vme-arr,
                .mt-vme-prj      { display: none; }
                .mt-exit-grid    { grid-template-columns: repeat(2, 1fr); }
                .mt-exit-rules   { grid-template-columns: 1fr; }
                .mt-perks        { grid-template-columns: 1fr; }
                .mt-footer       { grid-template-columns: 1fr; gap: 32px; }
                .mt-nav          { display: none; }
            }
            @media (max-width: 480px) {
                .mt-stats     { grid-template-columns: 1fr; }
                .mt-grid-4    { grid-template-columns: 1fr; }
                .mt-exit-grid { grid-template-columns: 1fr; }
            }
        </style>

        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700;800&display=swap">

        <div class="mt-shell">
            <header class="mt-topbar">
                <a href="/matriu" class="mt-brand" data-link>
                    <svg class="mt-brand-mark" viewBox="0 0 24 24" aria-hidden="true">
                        <polygon points="12,2 22,20 2,20" fill="none" stroke="#2a3a2a" stroke-width="1.5"></polygon>
                        <polygon points="12,8 18,18 6,18" fill="#c25a3a"></polygon>
                    </svg>
                    Matriu
                </a>
                <nav class="mt-nav">
                    <a href="#tokenomic">Tokenomic</a>
                    <a href="#engine">Engine</a>
                    <a href="#exit">Exit model</a>
                    <a href="#cohort">Cohort 0</a>
                </nav>
                <a href="#cohort" class="mt-cta-mini" id="mtCtaTop">Sumar-me al nucli →</a>
            </header>

            <!-- HERO -->
            <section class="mt-hero">
                <div class="mt-container">
                    <span class="mt-pill">Cohort 0 oberta · ${seatsTaken}/${seatsTotal} places</span>
                    <div class="mt-hero-grid" style="margin-top: 28px;">
                        <div>
                            <h1>
                                <span class="mt-italic">Sigues</span><br>
                                <span class="mt-italic">dels primers</span><br>
                                <span class="mt-italic">en el nucli</span>
                            </h1>
                        </div>
                        <div class="mt-hero-block">
                            <div class="mt-hero-num">01</div>
                            <p class="mt-hero-body">
                                <strong>Matriu</strong> és una incubadora cooperativa que reparteix valor
                                en temps real. Equity, collita, accés, drets d'ús — tot el que aportes
                                es converteix en participacions automàtiques i auditables.
                            </p>
                            <a href="#cohort" class="mt-hero-cta" id="mtCtaHero">Reserva el teu seient →</a>
                            <div class="mt-hero-meta">
                                <span class="mt-hero-meta-key">Com funciona</span>
                                <a href="#engine" style="text-decoration: underline; opacity: 0.85;">Veure value mapping engine ↓</a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- STATS -->
            <section>
                <div class="mt-container">
                    <div class="mt-stats">
                        ${stats.map(s => `
                            <div class="mt-stat">
                                <div class="mt-stat-v mt-italic">${escapeHtml(s.v)}</div>
                                <div class="mt-stat-l">${escapeHtml(s.label)}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>

            <!-- WHY NOW · 4 cards -->
            <section class="mt-section">
                <div class="mt-container">
                    <div class="mt-section-tag">Per què ara</div>
                    <h2 class="mt-italic">Hi ha un moment per <strong>entrar-hi</strong><br>i ja ha començat.</h2>
                    <p class="mt-section-lead">
                        Cada projecte que entra fa créixer el pastís — i els primers el partim diferent.
                    </p>
                    <div class="mt-grid-4">
                        ${WHY_NOW.map(p => `
                            <div class="mt-card">
                                <div class="mt-card-num">${escapeHtml(p.num)}</div>
                                <div class="mt-card-title">${escapeHtml(p.title)}</div>
                                <div class="mt-card-body">${escapeHtml(p.body)}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>

            <!-- TOKENOMIC FAIR FRACTAL -->
            <section class="mt-section" id="tokenomic">
                <div class="mt-container">
                    <div class="mt-section-tag">Tokenomic · Fair Fractal ${renderExplainerBadge('fair-fractal-tokenomics', { size: 'xs' })}</div>
                    <h2 class="mt-italic">Quatre regles<br>que <strong>no canvien</strong>.</h2>
                    <p class="mt-section-lead">
                        El model és el mateix per a un hort, una empresa o una xarxa de cures.
                        Es replica sense perdre forma — fractal — i el repartiment no depèn
                        de qui mana, sinó del valor mesurat. Just per disseny.
                    </p>
                    <div class="mt-grid-4">
                        ${MATRIU_FAIR_FRACTAL_RULES.map((r, i) => `
                            <div class="mt-card">
                                <div class="mt-card-num">${String(i + 1).padStart(2, '0')}</div>
                                <div class="mt-card-title">${escapeHtml(r.title)}</div>
                                <div class="mt-card-body">${escapeHtml(r.summary)}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>

            <!-- VALUE MAPPING ENGINE -->
            <section class="mt-section" id="engine">
                <div class="mt-container">
                    <div class="mt-section-tag">Value mapping engine ${renderExplainerBadge('vna', { size: 'xs' })}</div>
                    <h2 class="mt-italic">Aportes valor.<br>Reps participació. <strong>A l'instant.</strong></h2>
                    <p class="mt-section-lead">
                        Cada acció que reconeix la xarxa — codi, hores, capital, llavors,
                        un contacte clau, una invitació a un client — entra al motor de
                        comptabilitat de valor. El motor calcula la teva quota i reparteix
                        en el moment, no a final d'any.
                    </p>
                    <div class="mt-vme">
                        <div class="mt-vme-head">
                            <span>3 entrades aquesta hora · block 8.241k</span>
                            <span>${renderExplainerBadge('triple-entry-accounting', { size: 'xs' })}</span>
                        </div>
                        ${VME_EXAMPLES.map(e => `
                            <div class="mt-vme-row">
                                <div class="mt-vme-init">${escapeHtml(e.initials)}</div>
                                <div>
                                    <div class="mt-vme-name">${escapeHtml(e.name)} <span>${escapeHtml(e.contribution)}</span></div>
                                </div>
                                <div class="mt-vme-arr">→</div>
                                <div class="mt-vme-prj">${escapeHtml(e.project)} <span>${escapeHtml(e.detail)}</span></div>
                                <div class="mt-vme-rew">${escapeHtml(e.reward)}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>

            <!-- EXIT MODEL -->
            <section class="mt-section" id="exit">
                <div class="mt-container">
                    <div class="mt-section-tag">Exit model ${renderExplainerBadge('smart-contract', { size: 'xs' })}</div>
                    <h2 class="mt-italic">Si entres,<br>també <strong>saps com</strong> sortir.</h2>
                    <p class="mt-section-lead">
                        L'exit no és una negociació entre advocats. És una funció. Quan
                        es compleix la condició — venda, compra interna, dissolució o
                        relleu — el contracte liquida posicions a preu de mercat o per
                        l'oracle pre-acordat. Tothom rep, ningú espera.
                    </p>
                    <div class="mt-exit-grid">
                        ${EXIT_PHASES.map(p => `
                            <div class="mt-card">
                                <div class="mt-card-num">${escapeHtml(p.num)}</div>
                                <div class="mt-card-title">${escapeHtml(p.title)}</div>
                                <div class="mt-card-body">${escapeHtml(p.body)}</div>
                                <div class="mt-card-meta">${escapeHtml(p.timing)}</div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="mt-exit-rules">
                        ${EXIT_INVARIANTS.map(r => `
                            <div class="mt-exit-rule">
                                <div class="mt-exit-rule-tag">${escapeHtml(r.tag)}</div>
                                <div class="mt-exit-rule-h">${escapeHtml(r.headline)}</div>
                                <div class="mt-exit-rule-b">${escapeHtml(r.body)}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>

            <!-- COHORT 0 · 6 PERKS -->
            <section class="mt-section" id="cohort">
                <div class="mt-container">
                    <div class="mt-section-tag">Cohort 0 · ${seatsTotal} places ${renderExplainerBadge('cohort-0', { size: 'xs' })}</div>
                    <div class="mt-cohort-head">
                        <h2 class="mt-italic" style="margin: 0;">Què<br><strong>t'emportes</strong><br>per ser-hi.</h2>
                        <div class="mt-cohort-counter">${seatsTaken}/${seatsTotal}<span>· queden ${seatsLeft} seients</span></div>
                    </div>
                    <p class="mt-section-lead">
                        Els primers ${seatsTotal} sou els que escriviu la regla. Cobreu coeficient
                        fundacional de per vida sobre el vostre projecte i sobre la pròpia
                        Matriu. No és un descompte: és un dret estructural.
                    </p>
                    <div class="mt-perks">
                        ${MATRIU_PERKS.map((p, i) => `
                            <div class="mt-perk">
                                <span class="mt-perk-check">${escapeHtml(p.icon)}</span>
                                <div>
                                    <div class="mt-perk-title">${escapeHtml(p.label)}</div>
                                    <div class="mt-perk-body">${escapeHtml(p.description)}</div>
                                </div>
                                <span class="mt-perk-num">${String(i + 1).padStart(2, '0')}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>

            <!-- FOOTER CTA -->
            <section class="mt-footer-cta">
                <div class="mt-container">
                    <h2 class="mt-italic">El valor<br>que aportis es paga<br><strong>sol</strong>.</h2>
                    <p class="mt-footer-lead">
                        Les regles ja són escrites. El motor ja gira. Només falta el teu
                        seient. Quan entris, el repartiment s'activa per a tu de manera automàtica.
                    </p>
                    <div class="mt-footer-actions">
                        <a href="#" class="mt-hero-cta" id="mtCtaFinal">Reservar seient · 0 € →</a>
                        <a href="https://matriu.coop" target="_blank" rel="noopener noreferrer" class="mt-cta-second">Llegir el whitepaper</a>
                    </div>
                    <div class="mt-disclaimer">
                        No requereix KYC ni wallet per reservar · Escrow de llinatge fins a la cohort
                    </div>
                </div>
            </section>

            <!-- FOOTER COOPERATIVA -->
            <footer>
                <div class="mt-container mt-footer">
                    <div>
                        <div class="mt-footer-brand">Matriu</div>
                        <div class="mt-footer-brand-sub">Incoopadora cooperativa · Barcelona, ES</div>
                        <div class="mt-footer-tag">local-first · permaweb · gnosis</div>
                    </div>
                    <div class="mt-footer-col">
                        <h5>Producte</h5>
                        <a href="/" data-link>Mètode SOS</a>
                        <a href="/dashboard" data-link>App</a>
                        <a href="/wallet" data-link>Crèdits</a>
                        <a href="#tokenomic">FICE</a>
                    </div>
                    <div class="mt-footer-col">
                        <h5>Comunitat</h5>
                        <a href="/folders" data-link>CoPs obertes</a>
                        <a href="#cohort">Cohort 0</a>
                        <a href="#engine">Esdeveniments</a>
                        <a href="#tokenomic">Manifest</a>
                    </div>
                    <div class="mt-footer-col">
                        <h5>Recursos</h5>
                        <a href="https://matriu.coop" target="_blank" rel="noopener noreferrer">Whitepaper</a>
                        <a href="#exit">Contractes</a>
                        <a href="/efficiency" data-link>Auditoria</a>
                        <a href="#">Premsa</a>
                    </div>
                </div>
                <div class="mt-footer-bottom">
                    <div>© ${new Date().getFullYear()} · Matriu Incoopadora SCCL</div>
                    <div>v0.1 · cohort 0 · open source</div>
                </div>
            </footer>
        </div>

        <!-- RESERVAR SEIENT MODAL -->
        <div class="mt-modal" id="mtModal" role="dialog" aria-labelledby="mtModalTitle" aria-modal="true">
            <div class="mt-modal-card">
                <h3 id="mtModalTitle">Reservar el teu seient</h3>
                <p>
                    Entres a la cohort 0 fundacional. Sense KYC ni wallet ara mateix · només
                    el teu nom i una idea de projecte · els crèdits es minten quan tanqui la
                    cohort.
                </p>
                <div class="mt-input-row">
                    <label for="mtName">Nom</label>
                    <input type="text" id="mtName" class="mt-input" placeholder="ex. Alvaro Solache" autocomplete="name">
                </div>
                <div class="mt-input-row">
                    <label for="mtHandle">Handle (opcional)</label>
                    <input type="text" id="mtHandle" class="mt-input" placeholder="@alvaro">
                </div>
                <div class="mt-input-row">
                    <label for="mtIdea">La teva idea de projecte</label>
                    <input type="text" id="mtIdea" class="mt-input" placeholder="ex. Hortet de la Vall · cooperativa de productores">
                </div>
                <div class="mt-modal-actions">
                    <button class="mt-modal-cancel" id="mtModalCancel">Cancel·lar</button>
                    <button class="mt-modal-confirm" id="mtModalConfirm">Reservar seient · 0 € →</button>
                </div>
            </div>
        </div>
        `;
    }

    async afterRender() {
        ensureExplainerStyle();
        bindExplainerBadges(document);

        // Smooth scroll para anchor links internos (no SPA)
        document.querySelectorAll('.mt-shell a[href^="#"]').forEach(a => {
            a.addEventListener('click', (e) => {
                const href = a.getAttribute('href');
                if (!href || href === '#') return;
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });

        // CTAs · abrir modal de reserva
        const modal = document.getElementById('mtModal');
        const openModal = (e) => {
            if (e) e.preventDefault();
            if (modal) {
                modal.classList.add('is-open');
                setTimeout(() => document.getElementById('mtName')?.focus(), 80);
            }
        };
        const closeModal = () => modal?.classList.remove('is-open');

        document.getElementById('mtCtaFinal')?.addEventListener('click', openModal);
        document.getElementById('mtModalCancel')?.addEventListener('click', closeModal);
        modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

        // Confirm · usa el builder existente buildMatriuCohortProject + acciones store/KB
        document.getElementById('mtModalConfirm')?.addEventListener('click', async () => {
            const name   = document.getElementById('mtName')?.value?.trim() || '';
            const handle = document.getElementById('mtHandle')?.value?.trim() || '';
            const idea   = document.getElementById('mtIdea')?.value?.trim() || '';
            if (!name) { alert('Cal el teu nom per reservar.'); return; }
            if (!idea) { alert('Cal una idea de projecte.'); return; }
            const btn = document.getElementById('mtModalConfirm');
            if (btn) { btn.disabled = true; btn.textContent = '⏳ Reservant…'; }
            try {
                const { buildMatriuCohortProject } = await import('../core/matriuTemplate.js?v=' + Date.now());
                const { store } = await import('../core/store.js?v=' + Date.now());
                const { KB }    = await import('../core/kb.js?v=' + Date.now());
                const out = buildMatriuCohortProject({ operatorName: name, operatorHandle: handle, projectIdea: idea });
                await store.init();
                await KB.init();
                store.dispatch({ type: 'CREATE_PROJECT', payload: out.project });
                for (const node of out.kbNodes) {
                    store.dispatch({ type: 'KB_UPSERT', payload: node });
                }
                if (window.navigateTo) window.navigateTo(out.navigateTo);
                else window.location.assign(out.navigateTo);
            } catch (err) {
                console.error('[MAT-002-H] reservar seient falló:', err);
                alert('Error reservant: ' + (err?.message || err));
                if (btn) { btn.disabled = false; btn.textContent = 'Reservar seient · 0 € →'; }
            }
        });
    }

    destroy() { /* nothing to clean */ }
}
