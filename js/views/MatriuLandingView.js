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
import { PROJECT_TYPES } from '../core/critical108Roles.js';
import {
    PROJECT_BOOTSTRAP_TEMPLATES, getBootstrapTemplate,
    expectedSopsCountFor, expectedWeeksToOperateFor,
} from '../core/bootstrapTemplates.js';
import { renderExplainerBadge, bindExplainerBadges, ensureExplainerStyle } from '../core/didacticService.js';

// Iconos para los 12 tipus de projecte (paralelos a PROJECT_TYPES)
const PROJECT_TYPE_ICONS = Object.freeze({
    'comunitat-autosuficient':   '🌾',
    'startup-coop-tradicional':  '🚀',
    'empresa-en-transicio':      '🏢',
    'cooperativa-multi':         '🤝',
    'fundacio-ong':              '🤲',
    'ecosistema-regional':       '🌍',
    'dao-web3':                  '⛓',
    'plataforma-cooperativa':    '📱',
    'cooperativa-cures':         '💗',
    'espai-autogestionat':       '🏛',
    'hub-transicio':             '🔄',
    'familiar-relevo':           '🌳',
});

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
        document.title = 'Matriu · Nucli fundacional obert · 24/108';
    }

    async getHtml() {
        const seatsTotal  = MATRIU_COHORT_0.capacity;
        const seatsTaken  = 24;
        const seatsLeft   = seatsTotal - seatsTaken;
        const stats       = statsRow();

        return `
        <style>
            /* ── Matriu Catalunya skin · SOS theme aliased ──────────────── */
            /* MATRIU-SOS-REBRAND-001 · alias matriu vars → SOS theme vars per
               heretar light/dark automàticament + typography unificada.        */
            .mt-shell {
                --mt-cream:  var(--bg-dark);        /* page background */
                --mt-dark:   var(--text-main);      /* primary text */
                --mt-tcotta: var(--accent-purple);  /* primary accent · soci */
                --mt-olive:  var(--accent-indigo);  /* secondary accent */
                --mt-blue:   var(--accent-indigo);  /* links */
                --mt-ink:    var(--bg-panel);       /* CTA bg · panels */
                --mt-rule:   var(--border-default);
                --mt-line:   var(--border-subtle);
                background: var(--bg-dark);
                color: var(--text-main);
                font-family: var(--font-base);
                line-height: 1.5;
                width: 100vw;
                min-height: 100%;
                overflow-x: hidden;
            }
            .mt-italic { font-family: var(--font-base); font-style: italic; font-weight: 400; }
            .mt-mono   { font-family: var(--font-mono); }
            .mt-shell a { color: inherit; }
            .mt-container { max-width: 1240px; margin: 0 auto; padding: 0 clamp(20px, 4vw, 48px); }

            /* ── Topbar mini ──────────────────────────────────────────── */
            .mt-topbar { display: flex; align-items: center; justify-content: space-between; padding: 22px clamp(20px, 4vw, 48px); border-bottom: 1px solid var(--mt-line); position: sticky; top: 0; background: var(--bg-dark); opacity: 0.96; backdrop-filter: blur(8px); z-index: 10; }
            .mt-brand { font-family: var(--font-base); font-weight: 700; letter-spacing: -0.01em; font-size: 22px; color: var(--mt-dark); display: inline-flex; align-items: center; gap: 10px; text-decoration: none; }
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
            .mt-hero h1 { font-family: var(--font-base); font-weight: 900; font-size: clamp(48px, 9vw, 110px); line-height: 0.98; letter-spacing: -0.025em; color: var(--mt-dark); margin-top: 22px; }
            .mt-hero h1 .blk { font-weight: 900; background: linear-gradient(135deg, var(--accent-indigo), var(--accent-purple)); -webkit-background-clip: text; background-clip: text; color: transparent; }
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

            /* ── Tipus de projecte (12 cards) ───────────────────────── */
            .mt-types-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: var(--mt-rule); border: 1px solid var(--mt-rule); }
            .mt-type-card { background: var(--mt-cream); padding: 22px 24px; display: flex; flex-direction: column; gap: 10px; cursor: pointer; transition: background 0.15s, transform 0.15s; min-height: 220px; }
            .mt-type-card:hover, .mt-type-card:focus { background: rgba(194,90,58,0.06); outline: none; transform: translateY(-1px); }
            .mt-type-head { display: flex; align-items: center; gap: 10px; }
            .mt-type-icon { font-size: 22px; }
            .mt-type-label { font-size: 19px; line-height: 1.2; color: var(--mt-dark); }
            .mt-type-narrative { font-size: 13px; line-height: 1.55; color: var(--mt-dark); opacity: 0.78; flex: 1; }
            .mt-type-stats { display: flex; gap: 12px; flex-wrap: wrap; padding-top: 8px; border-top: 1px solid var(--mt-line); font-family: ui-monospace, monospace; font-size: 11px; color: var(--mt-dark); opacity: 0.75; }
            .mt-type-stats strong { font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: 16px; opacity: 1; color: var(--mt-tcotta); margin-right: 2px; }
            .mt-type-meta { display: flex; flex-direction: column; gap: 4px; font-family: ui-monospace, monospace; font-size: 10px; opacity: 0.6; }
            .mt-type-meta strong { color: var(--mt-dark); opacity: 0.8; }
            .mt-type-cta { margin-top: 4px; font-size: 12px; font-weight: 600; color: var(--mt-tcotta); opacity: 0; transition: opacity 0.15s; }
            .mt-type-card:hover .mt-type-cta, .mt-type-card:focus .mt-type-cta { opacity: 1; }

            @media (max-width: 880px) { .mt-types-grid { grid-template-columns: 1fr; } }
            @media (min-width: 881px) and (max-width: 1100px) { .mt-types-grid { grid-template-columns: repeat(2, 1fr); } }

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

            /* ── Reservar seient form (modal) · todos los valores hardcodeados como fallback de las vars locales ── */
            .mt-modal { position: fixed; inset: 0; background: rgba(26,31,26,0.7); display: none; align-items: center; justify-content: center; z-index: 9999; backdrop-filter: blur(6px); }
            .mt-modal.is-open { display: flex; animation: mtFade 0.2s ease-out; }
            @keyframes mtFade { from { opacity: 0; } to { opacity: 1; } }
            .mt-modal-card { background: var(--bg-panel); border: 1px solid var(--border-default); border-radius: 16px; padding: clamp(28px, 4vw, 44px); max-width: 520px; width: calc(100% - 32px); max-height: 92vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.65); }
            .mt-modal-card h3 { font-family: var(--font-base); font-weight: 800; font-size: 26px; color: var(--text-main); margin-bottom: 12px; line-height: 1.15; letter-spacing: -0.02em; }
            .mt-modal-card p  { font-size: 14px; line-height: 1.6; color: var(--text-secondary); margin-bottom: 22px; }
            .mt-modal-card p strong { color: var(--accent-purple); font-weight: 600; }
            .mt-input-row { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
            .mt-input-row label { font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-secondary); font-weight: 600; }
            .mt-input { width: 100%; padding: 12px 14px; border: 1px solid var(--border-default); border-radius: 8px; background: var(--bg-elevated); font-size: 14px; font-family: var(--font-base); color: var(--text-main); outline: none; transition: border-color 0.15s, box-shadow 0.15s; box-sizing: border-box; }
            .mt-input::placeholder { color: var(--text-muted); }
            .mt-input:focus { border-color: var(--accent-purple); box-shadow: 0 0 0 3px rgba(168,85,247,0.12); }
            .mt-modal-actions { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 24px; }
            .mt-modal-cancel { background: transparent; border: 1px solid var(--border-default); color: var(--text-secondary); cursor: pointer; font-size: 14px; padding: 12px 22px; border-radius: 999px; font-weight: 600; transition: background 0.15s; font-family: var(--font-base); }
            .mt-modal-cancel:hover { background: var(--bg-elevated); }
            .mt-modal-confirm { background: var(--accent-purple); color: #fff; border: 0; padding: 14px 28px; border-radius: 999px; font-weight: 700; font-size: 14px; cursor: pointer; transition: transform 0.15s, box-shadow 0.15s; font-family: var(--font-base); box-shadow: 0 2px 0 rgba(0,0,0,0.1); }
            .mt-modal-confirm:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(168,85,247,0.35); }
            .mt-modal-confirm:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

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
                        <polygon points="12,2 22,20 2,20" fill="none" stroke="currentColor" stroke-width="1.5"></polygon>
                        <polygon points="12,8 18,18 6,18" fill="var(--accent-purple)"></polygon>
                    </svg>
                    Matriu Catalunya
                </a>
                <nav class="mt-nav">
                    <a href="#tokenomic">Tokenomic</a>
                    <a href="#engine">Engine</a>
                    <a href="#exit">Exit model</a>
                    <a href="#types">Tipus</a>
                    <a href="#cohort">Cohort 0</a>
                </nav>
                <a href="#cohort" class="mt-cta-mini" id="mtCtaTop">Sumar-me al nucli →</a>
            </header>

            <!-- HERO -->
            <section class="mt-hero">
                <div class="mt-container">
                    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
                        <span class="mt-pill">Nucli fundacional obert · ${seatsTaken}/${seatsTotal} places</span>
                        <a href="/matriu/network" data-link style="display:inline-flex;align-items:center;gap:6px;padding:6px 14px;background:transparent;border:1px solid var(--mt-rule, rgba(42,58,42,0.18));border-radius:999px;font-size:12px;color:var(--mt-dark, #2a3a2a);text-decoration:none;font-family:ui-monospace, monospace;transition:background 0.15s;">🌐 Veure els membres del nucli →</a>
                    </div>
                    <div class="mt-hero-grid" style="margin-top: 28px;">
                        <div>
                            <h1>
                                Una Catalunya<br>
                                <span class="blk">descentralitzada</span><br>
                                <span class="mt-italic">i autosuficient</span>
                            </h1>
                        </div>
                        <div class="mt-hero-block">
                            <div class="mt-hero-num">01</div>
                            <p class="mt-hero-body">
                                <strong>Matriu Catalunya</strong> és la xarxa cooperativa SOS · projectes,
                                ofertes i oportunitats verificables al permaweb · IA · triple-entry
                                accounting · contractes intel·ligents per a automatització legal +
                                comptable + tresoreria. Tot allò que aportes es converteix en
                                participacions automàtiques i auditables.
                            </p>
                            <a href="#mtSosMember" class="mt-hero-cta" id="mtCtaHero">Crea perfil · 1 € →</a>
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

            <!-- TIPUS DE PROJECTE · 12 plantilles -->
            <section class="mt-section" id="types">
                <div class="mt-container">
                    <div class="mt-section-tag">Tipus de projecte · 12 plantilles ${renderExplainerBadge('vna', { size: 'xs' })}</div>
                    <h2 class="mt-italic">Per qualsevol projecte:<br><strong>el motor ja està fet</strong>.</h2>
                    <p class="mt-section-lead">
                        Cada tipus de projecte arriba amb una matriu de valor pre-configurada ·
                        roles + transaccions seqüenciades + SOPs canònics + guardians objectiu.
                        No comences en blanc: comences amb el coneixement de la xarxa Matriu.
                    </p>
                    <div class="mt-types-grid">
                        ${PROJECT_TYPES.map(pt => {
                            const tpl = getBootstrapTemplate(pt.id);
                            const sops = expectedSopsCountFor(pt.id);
                            const wks  = expectedWeeksToOperateFor(pt.id);
                            const icon = PROJECT_TYPE_ICONS[pt.id] || '✦';
                            const sectorsList = (tpl?.sectorAffinity || []).join(' · ') || '—';
                            const guardiansList = (tpl?.requiredGuardians || []).slice(0, 4).join(' · ');
                            return `
                                <div class="mt-type-card" data-type-id="${escapeHtml(pt.id)}" tabindex="0" role="button">
                                    <div class="mt-type-head">
                                        <span class="mt-type-icon">${icon}</span>
                                        <span class="mt-type-label mt-italic">${escapeHtml(pt.label)}</span>
                                    </div>
                                    <p class="mt-type-narrative">${escapeHtml(tpl?.narrative || pt.whyNow || '')}</p>
                                    <div class="mt-type-stats">
                                        <span class="mt-type-stat"><strong>${tpl?.valueMapSeed?.roles?.length || 0}</strong> rols</span>
                                        <span class="mt-type-stat"><strong>${tpl?.valueMapSeed?.transactions?.length || 0}</strong> tx</span>
                                        <span class="mt-type-stat"><strong>${sops?.midpoint || '?'}</strong> SOPs</span>
                                        <span class="mt-type-stat"><strong>${wks?.midpoint || '?'}</strong> setm.</span>
                                    </div>
                                    <div class="mt-type-meta">
                                        <span><strong>Sectors</strong> · ${escapeHtml(sectorsList)}</span>
                                        <span><strong>Guardians</strong> · ${escapeHtml(guardiansList)}</span>
                                    </div>
                                    <div class="mt-type-cta">Reservar amb aquest tipus →</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </section>

            <!-- COHORT 0 · 6 PERKS -->
            <section class="mt-section" id="cohort">
                <div class="mt-container">
                    <div class="mt-section-tag">Nucli fundacional · ${seatsTotal} places ${renderExplainerBadge('cohort-0', { size: 'xs' })}</div>
                    <div class="mt-cohort-head">
                        <h2 class="mt-italic" style="margin: 0;">Què<br><strong>t'emportes</strong><br>per ser-hi.</h2>
                        <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end;">
                            <div class="mt-cohort-counter">${seatsTaken}/${seatsTotal}<span>· queden ${seatsLeft} seients</span></div>
                            <a href="/matriu/network" data-link style="font-family:ui-monospace,monospace;font-size:11px;color:#5a6e4f;text-decoration:underline;">🌐 Veure els membres del nucli →</a>
                        </div>
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

            <!-- COMM-001 · Comunitat SOS · feed de projectes/ofertes/oportunitats publicats al permaweb + CTA membership 1€ -->
            <section style="padding: clamp(48px, 8vw, 80px) 0; border-top: 1px solid var(--mt-rule);">
                <div class="mt-container">
                    <div style="display:flex;align-items:baseline;justify-content:space-between;flex-wrap:wrap;gap:1rem;margin-bottom:1.4rem;">
                        <h2 class="mt-italic" style="font-size:clamp(32px,5vw,56px);margin:0;color:var(--mt-dark);">Comunitat <strong style="font-style:normal;font-family:'Inter',sans-serif;">SOS</strong></h2>
                        <a href="#mtSosMember" class="mt-cta-mini" style="background:var(--mt-tcotta);">✦ Soci · 1 € →</a>
                    </div>
                    <p class="mt-hero-body" style="max-width:680px;margin-bottom:2rem;">
                        Descobreix què està fent la comunitat ara mateix · projectes publicats, ofertes obertes i oportunitats al permaweb. Es paguen els membre per a publicar (0,05€ per entrada · ×1.5 free) i discovery sempre lliure. <a href="/opportunities" data-link style="border-bottom:1px solid var(--mt-rule);">Explorar totes →</a>
                    </p>
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1.4rem;">
                        <div id="mtSosProjects" style="background:rgba(42,58,42,0.04);border:1px solid var(--mt-rule);border-radius:14px;padding:1.2rem 1.3rem;">
                            <h3 style="font-family:'Instrument Serif',Georgia,serif;font-size:22px;margin:0 0 8px 0;color:var(--mt-tcotta);">🏛 Projectes</h3>
                            <div data-stream="projects" class="mt-stream-list" style="font-size:13px;line-height:1.6;color:var(--mt-dark);min-height:80px;">— carregant —</div>
                            <a href="/opportunities?tab=projects" data-link style="font-size:11px;color:var(--mt-blue);text-decoration:underline;font-family:ui-monospace,monospace;display:inline-block;margin-top:10px;">→ veure tots</a>
                        </div>
                        <div id="mtSosOfertes" style="background:rgba(42,58,42,0.04);border:1px solid var(--mt-rule);border-radius:14px;padding:1.2rem 1.3rem;">
                            <h3 style="font-family:'Instrument Serif',Georgia,serif;font-size:22px;margin:0 0 8px 0;color:var(--mt-tcotta);">🛍 Ofertes</h3>
                            <div data-stream="market" class="mt-stream-list" style="font-size:13px;line-height:1.6;color:var(--mt-dark);min-height:80px;">— carregant —</div>
                            <a href="/opportunities?tab=market" data-link style="font-size:11px;color:var(--mt-blue);text-decoration:underline;font-family:ui-monospace,monospace;display:inline-block;margin-top:10px;">→ veure totes</a>
                        </div>
                        <div id="mtSosWOs" style="background:rgba(42,58,42,0.04);border:1px solid var(--mt-rule);border-radius:14px;padding:1.2rem 1.3rem;">
                            <h3 style="font-family:'Instrument Serif',Georgia,serif;font-size:22px;margin:0 0 8px 0;color:var(--mt-tcotta);">📋 Oportunitats (WOs)</h3>
                            <div data-stream="workorders" class="mt-stream-list" style="font-size:13px;line-height:1.6;color:var(--mt-dark);min-height:80px;">— carregant —</div>
                            <a href="/opportunities?tab=workorders" data-link style="font-size:11px;color:var(--mt-blue);text-decoration:underline;font-family:ui-monospace,monospace;display:inline-block;margin-top:10px;">→ veure totes</a>
                        </div>
                    </div>

                    <!-- CTA membership · 1 € · publicar perfil + projecte + ofertes + oportunitats -->
                    <div id="mtSosMember" style="margin-top:3rem;padding:2rem 1.6rem;background:linear-gradient(135deg,rgba(194,90,58,0.08),rgba(42,58,42,0.04));border:1px solid var(--mt-tcotta);border-radius:18px;display:flex;gap:1.6rem;align-items:center;flex-wrap:wrap;">
                        <div style="flex:1;min-width:280px;">
                            <h3 style="font-family:'Instrument Serif',Georgia,serif;font-size:28px;margin:0 0 0.5rem;color:var(--mt-dark);font-style:italic;">Crea el teu perfil · <strong style="font-style:normal;font-family:'Inter',sans-serif;">1 €</strong> de fee únic</h3>
                            <p style="font-size:14px;line-height:1.6;color:var(--mt-dark);margin:0;max-width:540px;">
                                Activa la teva identitat DID + ECDSA · publica el teu perfil al permaweb · puja projectes, ofertes i oportunitats que tota la comunitat SOS pugui descobrir · queda part del directori que enllaçarem a <strong>teamtowershuma.com</strong>.
                            </p>
                        </div>
                        <a href="/identity" data-link class="mt-hero-cta" style="background:var(--mt-tcotta);align-self:center;">✦ Crear perfil · 1 € →</a>
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
                        No requereix KYC ni wallet per reservar · Escrow de llinatge fins que tanqui el nucli
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
                        <a href="#cohort">Nucli fundacional</a>
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
                    <div>v0.1 · nucli fundacional · open source</div>
                </div>
            </footer>

            <!-- RESERVAR SEIENT MODAL · refactor 2-step · membre primer · projecte opcional -->
            <div class="mt-modal" id="mtModal" role="dialog" aria-labelledby="mtModalTitle" aria-modal="true">
                <div class="mt-modal-card">
                    <div id="mtStepIndicator" style="display:flex;gap:6px;font-family:ui-monospace,monospace;font-size:11px;color:#5a6e4f;margin-bottom:10px;letter-spacing:0.05em;text-transform:uppercase;">
                        <span class="mt-step-pill" id="mtStep1Pill">① El teu perfil</span>
                        <span style="opacity:0.4;">›</span>
                        <span class="mt-step-pill" id="mtStep2Pill" style="opacity:0.5;">② Projecte (opcional)</span>
                    </div>

                    <!-- STEP 1 · membre · skills + guardian -->
                    <div id="mtStep1">
                        <h3 id="mtModalTitle">Sumar-me al <strong>nucli</strong></h3>
                        <p>
                            Primer entres tu com a <strong>membre del nucli</strong>. Et reserves la plaça
                            amb el teu perfil de skills. Després pots crear el teu primer projecte (o no · com
                            tu vulguis).
                        </p>
                        <div class="mt-input-row">
                            <label for="mtName">El teu nom</label>
                            <input type="text" id="mtName" class="mt-input" placeholder="ex. Alvaro Solache" autocomplete="name">
                        </div>
                        <div class="mt-input-row">
                            <label for="mtHandle">Handle (opcional)</label>
                            <input type="text" id="mtHandle" class="mt-input" placeholder="@alvaro">
                        </div>
                        <div class="mt-input-row">
                            <label for="mtBio">Bio breu (opcional)</label>
                            <input type="text" id="mtBio" class="mt-input" placeholder="ex. Pagesa regenerativa · 12 anys · banc de llavors">
                        </div>
                        <div class="mt-input-row">
                            <label for="mtGuardian">El teu guardian Pantheon Work</label>
                            <small style="font-size:11px;color:#5a6e4f;opacity:0.85;margin-bottom:6px;">Cada guardian custodia uns rols i entregables (sobretot <strong>intangibles</strong> · valor profund que el sistema reconeix). Tria el que millor s'alinea amb el que aportes.</small>
                            <select id="mtGuardian" class="mt-input">
                                <option value="">— Tria el guardian que millor t'identifica —</option>
                                <option value="afrodita">Afrodita · ✦ disseny · cohesió · 🪶 estètica · narrativa · seducció</option>
                                <option value="apolo">Apolo · ✦ educació · 🪶 claredat · prospectiva · curriculum</option>
                                <option value="atenea">Atenea · ✦ estratègia · 🪶 governança deliberativa · protecció flux valor</option>
                                <option value="demeter">Demeter · ✦ ecologia · 🪶 regeneració · cicles · soberania alimentària</option>
                                <option value="dionisio">Dionisio · ✦ cultura · 🪶 ritual · transformació · cohesió emocional</option>
                                <option value="hebe">Hebe · ✦ operacions · 🪶 servei · onboarding · joventut · relleu</option>
                                <option value="hefesto">Hefesto · ✦ tecnologia · 🪶 forja · eines · infraestructura</option>
                                <option value="hera">Hera · ✦ pacte · 🪶 fidelitat estructural · alianza · compliance</option>
                                <option value="hermes">Hermes · ✦ comunitat · 🪶 xarxa · mediació · interoperabilitat</option>
                                <option value="hestia">Hestia · ✦ cures · 🪶 hospitalitat · llar · cohesió íntima</option>
                                <option value="poseidon">Poseidon · ✦ finances · 🪶 capital + risc · audàcia · oràcle</option>
                                <option value="zeus">Zeus · ✦ visió fundacional · 🪶 soberania · autoritat delegada</option>
                            </select>
                            <small style="font-size:10px;color:#888;opacity:0.7;margin-top:4px;font-family:ui-monospace,monospace;">✦ rol · 🪶 valor intangible</small>
                        </div>
                        <div class="mt-input-row">
                            <label for="mtSkills">Les teves skills (separades per coma · 3-7)</label>
                            <input type="text" id="mtSkills" class="mt-input" placeholder="ex. regenerative-agriculture, seed-banking, food-systems">
                            <small style="font-size:11px;color:#5a6e4f;opacity:0.85;margin-top:4px;">Veure el catàleg de 90 skills a <a href="/learn" data-link style="color:#c25a3a;">/learn</a> · escriu-les en kebab-case · taxonomia universal SKILL-TAX-002 (5 categories · 5 audiències)</small>
                            <div id="mtSkillsSuggested" style="display:none;margin-top:8px;padding:8px 10px;background:rgba(194,90,58,0.06);border:1px dashed rgba(194,90,58,0.35);border-radius:6px;font-size:12px;color:#2a3a2a;">
                                <span style="font-family:ui-monospace,monospace;font-size:10px;text-transform:uppercase;letter-spacing:0.05em;color:#5a6e4f;">Suggerides per al teu guardian:</span>
                                <div id="mtSkillsSuggestedList" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;"></div>
                            </div>
                        </div>
                        <div class="mt-input-row">
                            <label for="mtSectors">Sectors on tens experiència (multi-selecció)</label>
                            <select id="mtSectors" class="mt-input" multiple size="6" style="height:auto;">
                                <option value="A">A · Agricultura · ramaderia · pesca</option>
                                <option value="B">B · Indústries extractives</option>
                                <option value="C">C · Indústria manufacturera</option>
                                <option value="D">D · Energia · electricitat · gas</option>
                                <option value="E">E · Aigua · sanejament · residus</option>
                                <option value="F">F · Construcció</option>
                                <option value="G">G · Comerç · vehicles</option>
                                <option value="H">H · Transport · emmagatzematge</option>
                                <option value="I">I · Hostaleria</option>
                                <option value="J">J · Informació · comunicacions</option>
                                <option value="K">K · Tech · software · IA</option>
                                <option value="L">L · Activitats financeres · assegurances</option>
                                <option value="M">M · Immobiliàries</option>
                                <option value="N">N · Cures · serveis socials</option>
                                <option value="O">O · Educació · formació</option>
                                <option value="P">P · Finance · slicing pie · contabilitat</option>
                                <option value="Q">Q · Educació superior · cohort</option>
                                <option value="R">R · Cultura · arts · oci</option>
                                <option value="S">S · Altres serveis</option>
                            </select>
                            <small style="font-size:11px;color:#5a6e4f;opacity:0.85;margin-top:4px;">Pulsa Cmd/Ctrl per seleccionar múltiples · pots acotar després al perfil</small>
                        </div>
                        <div class="mt-modal-actions">
                            <button class="mt-modal-cancel" id="mtModalCancel">Cancel·lar</button>
                            <button class="mt-modal-confirm" id="mtStep1Next">Següent · 0 € →</button>
                        </div>
                    </div>

                    <!-- STEP 2 · projecte opcional -->
                    <div id="mtStep2" style="display:none;">
                        <h3>Vols crear el teu <strong>primer projecte</strong>?</h3>
                        <p>
                            Pots crear-lo ara amb mapa de valor pre-configurat o saltar-ho per ara
                            (sempre podràs crear-lo des del Dashboard). El projecte arrenca amb el
                            multiplicador <strong>×1.5 fundacional</strong>.
                        </p>
                        <div class="mt-input-row">
                            <label for="mtIdea">Idea de projecte</label>
                            <input type="text" id="mtIdea" class="mt-input" placeholder="ex. Hortet de la Vall · cooperativa de productores">
                        </div>
                        <div class="mt-input-row">
                            <label for="mtType">Tipus de projecte</label>
                            <select id="mtType" class="mt-input">
                                <option value="">— Tria un tipus (recomendat · mapa pre-configurat) —</option>
                                ${PROJECT_TYPES.map(pt => `<option value="${escapeHtml(pt.id)}">${PROJECT_TYPE_ICONS[pt.id] || '✦'} ${escapeHtml(pt.label)}</option>`).join('')}
                            </select>
                            <small style="font-size:11px;color:#5a6e4f;opacity:0.85;margin-top:4px;">Amb tipus selecconat · 5 rols + 6 transactions + 8 SOPs precarregats.</small>
                        </div>
                        <div class="mt-modal-actions">
                            <button class="mt-modal-cancel" id="mtStep2Skip">Saltar · només membre</button>
                            <button class="mt-modal-confirm" id="mtStep2Confirm">Crear projecte →</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- (modal mogut a dins del .mt-shell · vars Matriu hereden correctament) -->
        `;
    }

    async afterRender() {
        ensureExplainerStyle();
        bindExplainerBadges(document);

        // COMM-001 · render dels 3 streams de la comunitat (fire-and-forget)
        this._renderCommunityStreams().catch(e => console.warn('[matriu] streams', e?.message));

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
        const openModal = (e, presetTypeId = null) => {
            if (e) e.preventDefault();
            if (modal) {
                modal.classList.add('is-open');
                // Reset al step 1 sempre que s'obre
                const step1 = document.getElementById('mtStep1');
                const step2 = document.getElementById('mtStep2');
                if (step1) step1.style.display = '';
                if (step2) step2.style.display = 'none';
                const p1 = document.getElementById('mtStep1Pill');
                const p2 = document.getElementById('mtStep2Pill');
                if (p1) p1.style.opacity = '1';
                if (p2) { p2.style.opacity = '0.5'; p2.style.color = ''; }
                if (presetTypeId) {
                    const sel = document.getElementById('mtType');
                    if (sel) sel.value = presetTypeId;
                }
                setTimeout(() => document.getElementById('mtName')?.focus(), 80);
            }
        };
        const closeModal = () => modal?.classList.remove('is-open');

        document.getElementById('mtCtaFinal')?.addEventListener('click', (e) => openModal(e));

        // SKILL-TAX-002 sprint A · suggested skills al canviar guardian
        document.getElementById('mtGuardian')?.addEventListener('change', async (e) => {
            const guardianId = e.target.value;
            const box  = document.getElementById('mtSkillsSuggested');
            const list = document.getElementById('mtSkillsSuggestedList');
            if (!box || !list) return;
            if (!guardianId) { box.style.display = 'none'; return; }
            try {
                const ext = await import('../core/skillTaxonomyExtension.js?v=' + Date.now());
                const top = ext.topSkillsForGuardian(guardianId, 5);
                const intang = ext.intangibleValueOfGuardian(guardianId);
                if (top.length === 0) { box.style.display = 'none'; return; }
                list.innerHTML = top.map(s => `<button type="button" class="mt-skill-suggest" data-skill="${s.id}" style="background:#fff;border:1px solid rgba(42,58,42,0.2);color:#2a3a2a;padding:3px 9px;border-radius:99px;font-size:11px;font-family:ui-monospace,monospace;cursor:pointer;">+ ${s.id}</button>`).join('');
                if (intang) {
                    const valueLine = document.createElement('div');
                    valueLine.style.cssText = 'margin-top:8px;font-style:italic;color:#5a6e4f;font-size:11px;line-height:1.4;';
                    valueLine.textContent = `🪶 ${intang.primary} · ${(intang.secondary || []).join(' · ')}`;
                    list.appendChild(valueLine);
                }
                box.style.display = 'block';
                // Click suggestion → afegeix al input
                box.querySelectorAll('.mt-skill-suggest').forEach(b => {
                    b.addEventListener('click', (ev) => {
                        ev.preventDefault();
                        const skillId = b.getAttribute('data-skill');
                        const input = document.getElementById('mtSkills');
                        if (!input) return;
                        const current = (input.value || '').trim();
                        const arr = current.split(',').map(x => x.trim()).filter(Boolean);
                        if (!arr.includes(skillId)) arr.push(skillId);
                        input.value = arr.join(', ');
                        b.style.opacity = '0.4';
                    });
                });
            } catch (err) { /* non-blocking */ }
        });
        document.getElementById('mtModalCancel')?.addEventListener('click', closeModal);
        modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

        // MAT-002-H+ · click en card de tipus → abre modal con tipo preseleccionado
        document.querySelectorAll('.mt-type-card').forEach(card => {
            const typeId = card.getAttribute('data-type-id');
            card.addEventListener('click', (e) => openModal(e, typeId));
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openModal(e, typeId);
                }
            });
        });

        // Refactor 2-step · STEP 1 · validar membre + crear matriu_member · saltar a step 2
        let createdMember = null;
        document.getElementById('mtStep1Next')?.addEventListener('click', async () => {
            const name      = document.getElementById('mtName')?.value?.trim() || '';
            const handle    = document.getElementById('mtHandle')?.value?.trim() || null;
            const bio       = document.getElementById('mtBio')?.value?.trim() || '';
            const guardian  = document.getElementById('mtGuardian')?.value || '';
            const skillsRaw = document.getElementById('mtSkills')?.value?.trim() || '';
            const sectorsSelect = document.getElementById('mtSectors');
            const sectorsExperience = sectorsSelect
                ? Array.from(sectorsSelect.selectedOptions).map(o => o.value).filter(Boolean)
                : [];
            if (!name) { alert('Cal el teu nom · primer pas.'); return; }
            if (!guardian) { alert('Tria el teu guardian (qui millor et representa).'); return; }
            const skills = skillsRaw.split(',').map(s => s.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')).filter(Boolean);
            if (skills.length < 1) { alert('Almenys 1 skill cal · separada per comes.'); return; }
            const btn = document.getElementById('mtStep1Next');
            if (btn) { btn.disabled = true; btn.textContent = '⏳ Creant membre…'; }
            try {
                const { buildMatriuMember } = await import('../core/matriuMemberService.js?v=' + Date.now());
                const { store } = await import('../core/store.js?v=' + Date.now());
                const { KB }    = await import('../core/kb.js?v=' + Date.now());
                await store.init();
                await KB.init();
                createdMember = buildMatriuMember({
                    displayName:    name,
                    handle:         handle,
                    bio:            bio,
                    guardianOf:     guardian,
                    skillsDeclared: skills,
                    availability:   'normal',
                    cohortNumber:   0,
                });
                // MAT-002-I sprint E · sectors d'experiència opcionals
                if (sectorsExperience.length > 0) {
                    createdMember = {
                        ...createdMember,
                        content: {
                            ...createdMember.content,
                            sectorsExperience,    // ['A','K','P']
                        },
                        keywords: [
                            ...createdMember.keywords,
                            ...sectorsExperience.map(s => 'sector:' + s),
                        ],
                    };
                }
                await KB.upsert(createdMember);
                // Pasar a step 2
                document.getElementById('mtStep1').style.display = 'none';
                document.getElementById('mtStep2').style.display = '';
                document.getElementById('mtStep1Pill').style.opacity = '0.5';
                document.getElementById('mtStep2Pill').style.opacity = '1';
                document.getElementById('mtStep2Pill').style.color = '#c25a3a';
            } catch (err) {
                console.error('[MAT-002-I] alta membre falló:', err);
                alert('Error en l\'alta: ' + (err?.message || err));
                if (btn) { btn.disabled = false; btn.textContent = 'Següent · 0 € →'; }
            }
        });

        // STEP 2 · saltar (només membre) o crear projecte
        const goToNetworkAfterMember = async () => {
            const url = '/matriu/network';
            await new Promise(resolve => setTimeout(resolve, 100));   // flush state
            if (window.navigateTo) window.navigateTo(url);
            else window.location.assign(url);
        };

        document.getElementById('mtStep2Skip')?.addEventListener('click', async () => {
            await goToNetworkAfterMember();
        });

        document.getElementById('mtStep2Confirm')?.addEventListener('click', async () => {
            if (!createdMember) { alert('Falta crear membre primer · torna al step 1.'); return; }
            const idea   = document.getElementById('mtIdea')?.value?.trim() || '';
            const typeId = document.getElementById('mtType')?.value || '';
            if (!idea) { alert('Cal una idea de projecte (o "Saltar" per crear-lo després).'); return; }
            const btn = document.getElementById('mtStep2Confirm');
            if (btn) { btn.disabled = true; btn.textContent = '⏳ Creant projecte…'; }
            try {
                const { buildMatriuCohortProject, MATRIU_COHORT_0 } = await import('../core/matriuTemplate.js?v=' + Date.now());
                const { bootstrapMapForProject } = await import('../core/bootstrapTemplates.js?v=' + Date.now());
                const { store } = await import('../core/store.js?v=' + Date.now());
                const { KB }    = await import('../core/kb.js?v=' + Date.now());
                await store.init();
                await KB.init();
                const out = buildMatriuCohortProject({
                    operatorName:   createdMember.content.displayName,
                    operatorHandle: createdMember.content.handle || '',
                    projectIdea:    idea,
                });
                if (typeId) out.project.matriuProjectType = typeId;
                out.project.ownerMemberId = createdMember.id;     // lligat al membre

                // Si hay typeId, pre-popula vna_roles[] y vna_transactions[] al project
                // ANTES del CREATE_PROJECT (fix coherencia stats Dashboard).
                let seed = null;
                if (typeId) {
                    try {
                        seed = bootstrapMapForProject({
                            typeId,
                            projectId: out.project.id,
                            multiplier: MATRIU_COHORT_0.multiplier || 1.5,
                        });
                        out.project.vna_roles = seed.roles.map(r => ({
                            id: r.baseId, name: r.label, label: r.label,
                            guardianAffinity: r.guardianAffinity || [],
                            from_seed: true,
                        }));
                        out.project.vna_transactions = seed.transactions.map(tr => ({
                            id: tr.baseId,
                            from: tr.from.split('::').pop(), to: tr.to.split('::').pop(),
                            deliverable: tr.deliverable, phase: tr.phase,
                            sequence_order: tr.sequence_order,
                            tangible: tr.tangible, must: tr.must,
                            from_seed: true,
                        }));
                    } catch (seedErr) {
                        console.warn('[MAT-002-H+] bootstrap seed falló:', seedErr);
                    }
                }

                // AWAIT cada dispatch · evitar race condition timing
                await store.dispatch({ type: 'CREATE_PROJECT', payload: out.project });
                for (const node of out.kbNodes) {
                    await store.dispatch({ type: 'KB_UPSERT', payload: node });
                }
                if (seed) {
                    for (const r of seed.roles) {
                        await store.dispatch({ type: 'KB_UPSERT', payload: {
                            id: r.id, type: 'role', projectId: out.project.id,
                            content: { baseId: r.baseId, label: r.label, guardianAffinity: r.guardianAffinity, kind: 'bootstrap-role' },
                            keywords: ['type:role', 'kind:bootstrap-role', 'project:' + out.project.id],
                        }});
                    }
                    for (const tr of seed.transactions) {
                        await store.dispatch({ type: 'KB_UPSERT', payload: {
                            id: tr.id, type: 'transaction', projectId: out.project.id,
                            content: { baseId: tr.baseId, from: tr.from, to: tr.to, deliverable: tr.deliverable, phase: tr.phase, sequence_order: tr.sequence_order, tangible: tr.tangible, must: tr.must, kind: 'bootstrap-tx' },
                            keywords: ['type:transaction', 'kind:bootstrap-tx', 'phase:' + tr.phase, 'project:' + out.project.id],
                        }});
                    }
                    for (const sop of seed.sopsBootstrap) {
                        await store.dispatch({ type: 'KB_UPSERT', payload: {
                            id: sop.id, type: 'sop', projectId: out.project.id,
                            content: { baseId: sop.baseId, title: sop.label, label: sop.label, phase: sop.phase, multiplier: sop.multiplier, kind: 'bootstrap-sop' },
                            keywords: ['type:sop', 'kind:bootstrap-sop', 'phase:' + sop.phase, 'project:' + out.project.id],
                        }});
                    }
                    await store.dispatch({ type: 'KB_UPSERT', payload: {
                        id: out.project.id + '::bootstrap-meta',
                        type: 'project_bootstrap',
                        projectId: out.project.id,
                        content: {
                            typeId,
                            sectorAffinity:    seed.sectorAffinity,
                            requiredGuardians: seed.requiredGuardians,
                            expectedOutcomes:  seed.expectedOutcomes,
                            narrative:         seed.narrative,
                            ownerMemberId:     createdMember.id,
                        },
                        keywords: ['type:project_bootstrap', 'projectType:' + typeId, 'project:' + out.project.id, 'owner:' + createdMember.id],
                    }});
                }
                // Pequeño delay extra para garantizar persistencia IndexedDB
                await new Promise(resolve => setTimeout(resolve, 80));
                if (window.navigateTo) window.navigateTo(out.navigateTo);
                else window.location.assign(out.navigateTo);
            } catch (err) {
                console.error('[MAT-002-H] crear projecte falló:', err);
                alert('Error creant projecte: ' + (err?.message || err));
                if (btn) { btn.disabled = false; btn.textContent = 'Crear projecte →'; }
            }
        });
    }

    // COMM-001 · render dels 3 streams · top-N de cada type
    async _renderCommunityStreams() {
        try {
            const { KB } = await import('../core/kb.js');
            const { PUBLIC_PROJECT_TYPE }    = await import('../core/publicProjectService.js');
            const { PUBLIC_WORK_ORDER_TYPE, PUBLIC_MARKET_ITEM_TYPE } = await import('../core/publicEntityService.js');
            const [projects, market, wos] = await Promise.all([
                KB.query({ type: PUBLIC_PROJECT_TYPE }).catch(() => []),
                KB.query({ type: PUBLIC_MARKET_ITEM_TYPE }).catch(() => []),
                KB.query({ type: PUBLIC_WORK_ORDER_TYPE }).catch(() => []),
            ]);
            const _esc = (s) => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch]));
            const renderList = (entries, format) => {
                if (!entries || entries.length === 0) {
                    return '<div style="color:rgba(42,58,42,0.55);font-style:italic;">Encara ningú · sigues el primer.</div>';
                }
                return entries.slice(0, 5).map(e => {
                    const c = e?.content || {};
                    return '<div style="padding:6px 0;border-bottom:1px dashed rgba(42,58,42,0.10);">' + format(c, _esc) + '</div>';
                }).join('');
            };
            const proj  = document.querySelector('[data-stream="projects"]');
            const mkt   = document.querySelector('[data-stream="market"]');
            const wosEl = document.querySelector('[data-stream="workorders"]');
            if (proj)  proj.innerHTML  = renderList(projects, (c, esc) => `<strong>${esc(c.name || '?')}</strong>${c.sectorId ? ' · <code style="font-size:11px;opacity:0.7;">' + esc(c.sectorId) + '</code>' : ''}`);
            if (mkt)   mkt.innerHTML   = renderList(market,   (c, esc) => `<strong>${esc(c.title || '?')}</strong>${typeof c.priceEur === 'number' ? ' · <em style="color:#5a6e4f;">' + c.priceEur + '€</em>' : ''}${c.kind ? ' · ' + esc(c.kind) : ''}`);
            if (wosEl) wosEl.innerHTML = renderList(wos,      (c, esc) => `<strong>${esc(c.title || '?')}</strong>${c.status ? ' · <code style="font-size:11px;opacity:0.7;">' + esc(c.status) + '</code>' : ''}${typeof c.estimatedHours === 'number' ? ' · ~' + c.estimatedHours + 'h' : ''}`);
        } catch (e) {
            console.warn('[matriu] community streams failed', e?.message);
        }
    }

    destroy() { /* nothing to clean */ }
}
