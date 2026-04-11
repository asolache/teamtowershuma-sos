// TEAMTOWERS SOS V11 — STORE.JS · Redux Inmutable

import { KB }           from './kb.js';
import { injectSeeds }  from './skill-seeds.js';
import { initLang }     from '../i18n.js';

const initialState = {
    config: {
        version: 'v11-Antigravity',
        theme: 'dark',
        economics: {
            markup_margin: 0.30,
            premium_features_fee: 0.05,
            base_pricing: {
                anthropic: { input: 3.00,  output: 15.00 },
                openai:    { input: 2.50,  output: 10.00 },
                gemini:    { input: 0.075, output: 0.30  },
                deepseek:  { input: 0.14,  output: 0.28  },
                custom:    { input: 0.0,   output: 0.0   }
            }
        }
    },
    session: { activeUserId: null, role: 'guest' },
    globalUsers: [
        { id: '@agent_genesis_architect',  name: 'Genesis Architect',  globalRole: 'ai-agent', profile: { isAi: true, preferredEngine: 'anthropic' } },
        { id: '@agent_dharma_ontologist',  name: 'Dharma Ontologist',  globalRole: 'ai-agent', profile: { isAi: true, preferredEngine: 'anthropic' } },
        { id: '@agent_skill_crafter',      name: 'Skill Crafter',      globalRole: 'ai-agent', profile: { isAi: true, preferredEngine: 'anthropic' } },
        { id: '@agent_prompt_synthesizer', name: 'Prompt Synthesizer', globalRole: 'ai-agent', profile: { isAi: true, preferredEngine: 'anthropic' } },
        { id: '@agent_tdd_auditor',        name: 'TDD Auditor',        globalRole: 'ai-agent', profile: { isAi: true, preferredEngine: 'anthropic' } },
        { id: '@agent_synaptic_weaver',    name: 'Synaptic Weaver',    globalRole: 'ai-agent', profile: { isAi: true, preferredEngine: 'anthropic' } },
        { id: '@agent_token_economist',    name: 'Token Economist',    globalRole: 'ai-agent', profile: { isAi: true, preferredEngine: 'anthropic' } },
        { id: '@agent_web_deployer',       name: 'Web Deployer',       globalRole: 'ai-agent', profile: { isAi: true, preferredEngine: 'anthropic' } },
        { id: '@agent_codex_developer',    name: 'Codex Developer',    globalRole: 'ai-agent', profile: { isAi: true, preferredEngine: 'anthropic' } },
        { id: '@kaos_tester',              name: 'Kaos Tester',        globalRole: 'ai-agent', profile: { isAi: true, preferredEngine: 'anthropic' } },
        { id: '@bard_narrator',            name: 'Bard Narrator',      globalRole: 'ai-agent', profile: { isAi: true, preferredEngine: 'anthropic' } },
        { id: '@alvaro', name: 'Alvaro (Master Architect)', globalRole: 'ecosystem-owner', profile: { sbt_skills: [] } }
    ],
    projects: []
};


// ─── Proyecto demo: Castellers VNA ─────────────────────────────────
const DEMO_PROJECT_ID = 'proj-colla-demo-v11';
const DEMO_PROJECT = {
    id:               DEMO_PROJECT_ID,
    nombre:           'Castellers · VNA Live Demo',
    sector_id:        'S',
    isArchived:       false,
    createdAt:        1744243200000,
    updatedAt:        1744243200000,
    vna_roles: [
        { id:'baixos',      name:'Baixos — Ground Anchor',    castell_level:'pinya',       description:'Transmits all structural compression to the ground. Every value flow rests here.',                    typical_actor:'Senior ops, infrastructure leads', fmv_usd_h:null, tags:['foundation','anchor'] },
        { id:'crosses',     name:'Crosses — Axilla Brace',    castell_level:'pinya',       description:'Prevents the Baixos from sinking. Communicates exclusively through touch — no verbal exchange.',      typical_actor:'Cross-functional support roles',    fmv_usd_h:null, tags:['support','haptic'] },
        { id:'contraforts', name:'Contraforts — Back Pressure',castell_level:'pinya',       description:'Absorbs rear pressure. Operates blind — cannot see the tower, only feel it through pressure.',        typical_actor:'Backend ops, blind-trust roles',    fmv_usd_h:null, tags:['alignment','blind-trust'] },
        { id:'mans',        name:'Mans — Hip Stabilizers',    castell_level:'pinya',       description:'If stable, confidence propagates upward. If they falter, panic cascades through the network.',         typical_actor:'Team enablers, support layer',      fmv_usd_h:null, tags:['stabilizer','cascade'] },
        { id:'laterals',    name:'Laterals — Side Guard',     castell_level:'pinya',       description:'Detects micro-sways before they become visible collapses. First early-warning in the network.',        typical_actor:'Risk monitors, QA, coordinators',  fmv_usd_h:null, tags:['risk','early-warning'] },
        { id:'segons',      name:'Segons — 2nd Floor',        castell_level:'tronc',       description:'Distributes weight geometrically. The bridge between base and superstructure.',                        typical_actor:'Mid-level managers, senior ICs',   fmv_usd_h:null, tags:['distribution','bridge'] },
        { id:'tercos',      name:'Terços — 3rd Floor',        castell_level:'tronc',       description:'Maximum cognitive focus required. No bandwidth for anything beyond pure execution.',                   typical_actor:'Senior specialists under pressure',fmv_usd_h:null, tags:['focus','compression'] },
        { id:'musics',      name:'Músics — Network Clock',    castell_level:'tronc',       description:'Acoustic telemetry to blind nodes. Synchronizes breathing, focus and flow state across all nodes.',    typical_actor:'Dashboards, status broadcasts',    fmv_usd_h:null, tags:['telemetry','rhythm'] },
        { id:'dosos',       name:'Dosos — Crown Base',        castell_level:'pom_de_dalt', description:'The emotional handoff zone — where technical execution meets psychological support.',                  typical_actor:'Executive sponsors, C-suite',      fmv_usd_h:null, tags:['crown','emotional-handoff'] },
        { id:'acotxador',   name:'Acotxador — Safety Bridge', castell_level:'pom_de_dalt', description:'Eye contact and touch at maximum height — the only intangible that prevents paralysis at the apex.',  typical_actor:'Executive coach, direct mentor',   fmv_usd_h:null, tags:['safety','empathy'] },
        { id:'enxaneta',    name:'Enxaneta — The Apex',       castell_level:'pom_de_dalt', description:'One gesture — la aleta — delivers collective catharsis to every node simultaneously.',                 typical_actor:'The milestone that validates all', fmv_usd_h:null, tags:['apex','catharsis'] },
        { id:'cap',         name:'Cap de Colla — Director',   castell_level:'pom_de_dalt', description:'The only node with full macroscopic visibility. In complex castles, authority must distribute.',       typical_actor:'CEO, CTO, transformation lead',    fmv_usd_h:null, tags:['director','vision'] },
    ],
    vna_transactions: [
        { id:'tx-baixos-segons-t',   from:'baixos',    to:'segons',     deliverable:'Structural compression platform — stable shoulders',                    type:'tangible',    is_must:true,  frequency:'alta', health_hint:'Unstable foundation = entire network at risk. No recovery once it breaks.' },
        { id:'tx-segons-baixos-t',   from:'segons',    to:'baixos',     deliverable:'Geometric weight distribution — equitable load',                         type:'tangible',    is_must:true,  frequency:'alta', health_hint:'Uneven distribution is invisible until collapse.' },
        { id:'tx-baixos-segons-i',   from:'baixos',    to:'segons',     deliverable:'Psychological security — certainty the foundation holds',                 type:'intangible',  is_must:false, frequency:'alta', health_hint:'Without this intangible, Segons cannot focus. Fear consumes cognitive bandwidth.' },
        { id:'tx-crosses-baixos-t',  from:'crosses',   to:'baixos',     deliverable:'Axial load prevention — physical bracing',                               type:'tangible',    is_must:true,  frequency:'alta', health_hint:'2mm slip cascades to full network failure.' },
        { id:'tx-baixos-crosses-i',  from:'baixos',    to:'crosses',    deliverable:'Haptic signals — micro-pressure communication',                           type:'intangible',  is_must:false, frequency:'alta', health_hint:'No verbal exchange possible. If tactile breaks, Crosses operate blind.' },
        { id:'tx-segons-tercos-t',   from:'segons',    to:'tercos',     deliverable:'Shoulder platform — anchored ascent surface',                            type:'tangible',    is_must:true,  frequency:'alta', health_hint:'Platform instability doubles cognitive load on Terços.' },
        { id:'tx-segons-tercos-i',   from:'segons',    to:'tercos',     deliverable:'Biomechanical confidence — calm transmitted upward',                      type:'intangible',  is_must:false, frequency:'alta', health_hint:'If Segons tremble, panic propagates instantly. Confidence is contagious.' },
        { id:'tx-tercos-dosos-t',    from:'tercos',    to:'dosos',      deliverable:'Upper platform — stable base for crown',                                 type:'tangible',    is_must:true,  frequency:'alta', health_hint:'At this height, any instability is amplified.' },
        { id:'tx-dosos-acot-t',      from:'dosos',     to:'acotxador',  deliverable:'Final physical platform — stable surface at apex',                       type:'tangible',    is_must:true,  frequency:'alta', health_hint:'Last tangible handoff. No second chances.' },
        { id:'tx-acot-enx-t',        from:'acotxador', to:'enxaneta',   deliverable:'Back surface — physical step to the apex',                               type:'tangible',    is_must:true,  frequency:'alta', health_hint:'Most visible transaction. Failure here is public.' },
        { id:'tx-acot-enx-i',        from:'acotxador', to:'enxaneta',   deliverable:'Empathy at altitude — eye contact that eliminates vertigo',               type:'intangible',  is_must:false, frequency:'alta', health_hint:'At maximum vulnerability, this is the only thing preventing paralysis.' },
        { id:'tx-enx-cap-t',         from:'enxaneta',  to:'cap',        deliverable:'La Aleta — raised arm that validates the entire network',                 type:'tangible',    is_must:true,  frequency:'alta', health_hint:'One gesture, systemic value delivery to every node.' },
        { id:'tx-enx-baixos-i',      from:'enxaneta',  to:'baixos',     deliverable:'Collective catharsis — simultaneous tension release',                     type:'intangible',  is_must:false, frequency:'alta', health_hint:'The purpose that justifies every sacrifice. Without it, the network loses meaning.' },
        { id:'tx-cap-segons-t',      from:'cap',       to:'segons',     deliverable:'Operational commands — timing, phase signals, abort decisions',           type:'tangible',    is_must:true,  frequency:'alta', health_hint:'In complex castles, Cap cannot see core. Authority must distribute.' },
        { id:'tx-cap-baixos-i',      from:'cap',       to:'baixos',     deliverable:'Macroscopic vision — the only node that sees the whole system',           type:'intangible',  is_must:false, frequency:'alta', health_hint:'Every node reads the Cap emotional state. Loss of confidence is systemic.' },
        { id:'tx-musics-baixos-t',   from:'musics',    to:'baixos',     deliverable:'Acoustic telemetry — melody signals exact apex phase to blind nodes',    type:'tangible',    is_must:true,  frequency:'alta', health_hint:'Baixos are blind to the apex. Without this, base operates on stale information.' },
        { id:'tx-musics-tercos-i',   from:'musics',    to:'tercos',     deliverable:'Group flow state — synchronized breathing and collective motivation',     type:'intangible',  is_must:false, frequency:'alta', health_hint:'Rhythm synchronizes the entire nervous system. Without it, individuals optimize locally.' },
        { id:'tx-mans-tercos-i',     from:'mans',      to:'tercos',     deliverable:'Distributed calm — steady base confidence traveling upward',              type:'intangible',  is_must:false, frequency:'alta', health_hint:'Nervous Mans cascade panic upward. Steady Mans enable upper floor focus.' },
        { id:'tx-laterals-baixos-i', from:'laterals',  to:'baixos',     deliverable:'Early-warning — oscillation detection before visible collapse',           type:'intangible',  is_must:false, frequency:'alta', health_hint:'Detects micro-sways 2-3 seconds before visible. Earliest signal in the system.' },
    ],
    ledger: [], telemetry: [], workOrders: [], roles: [], vna_flows: []
};

class Store {
    constructor() {
        this.state = JSON.parse(JSON.stringify(initialState));
        this.listeners = [];
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) return;
        try {
            await Promise.race([
                KB.init(),
                new Promise((_, r) => setTimeout(() => r(new Error('KB timeout')), 4000))
            ]);
            const saved = await KB.getNode('global_kernel_state_v11');
            if (saved && saved.content && typeof saved.content === 'object') {
                this.state = JSON.parse(JSON.stringify(saved.content));
                console.log('[Store V11] State restored from IndexedDB.');
            } else {
                // Intentar fallback localStorage
                var fallback = localStorage.getItem('tt_v11_fallback');
                if (fallback) {
                    try { this.state = JSON.parse(fallback); console.log('[Store V11] State restored from localStorage fallback.'); }
                    catch(_) { /* estado fresco */ }
                }
            }
            // Siempre forzar versión y economics actuales
            if (!this.state.config) this.state.config = {};
            this.state.config.version   = initialState.config.version;
            this.state.config.economics = initialState.config.economics;
            // Asegurar arrays
            if (!this.state.globalUsers) this.state.globalUsers = [];
            if (!this.state.projects)    this.state.projects    = [];
            // Hard sync agentes
            initialState.globalUsers.forEach(agent => {
                if (!this.state.globalUsers.find(u => u.id === agent.id)) {
                    this.state.globalUsers.push(agent);
                }
            });
        } catch (err) {
            console.warn('[Store V11] Init fallback (fresh state):', err.message);
            // Asegurar arrays mínimos en estado fresco
            if (!this.state.projects)    this.state.projects    = [];
            if (!this.state.globalUsers) this.state.globalUsers = initialState.globalUsers.slice();
        }

        // ─── Inyectar semillas del swarm (idempotente por version) ────
        try { await injectSeeds(); } catch (e) { console.warn('[Store V11] Seeds fallback:', e.message); }

        // ─── Inicializar idioma desde KB ──────────────────────────────────
        try { await initLang(); } catch (_) { window.__lang = 'en'; }

        // ─── Exponer setLang en window para el selector HTML ──────────────
        const { setLang } = await import('../i18n.js');
        window.__setLang = setLang;

        // ─── Inyectar proyecto demo (SIEMPRE, idempotente) ──────────────
        if (!this.state.projects) this.state.projects = [];
        const demoExists = this.state.projects.find(function(p){ return p.id === DEMO_PROJECT_ID; });
        if (!demoExists) {
            this.state.projects.unshift(JSON.parse(JSON.stringify(DEMO_PROJECT)));
            console.log('[Store V11] Demo project injected.');
            await this.persistState();
        }

        this.isInitialized = true;
        this.state.lastUpdated = Date.now();
    }

    getState() { return this.state; }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => { this.listeners = this.listeners.filter(l => l !== listener); };
    }

    async dispatch(action) {
        this.state = this._reducer(JSON.parse(JSON.stringify(this.state)), action);
        this.state.lastUpdated = Date.now();
        await this.persistState();
        this.listeners.forEach(l => l(this.state));
        return this.state;
    }

    async persistState() {
        try {
            await KB.saveNode({ id: 'global_kernel_state_v11', type: 'kernel', content: this.state });
            // Doble escritura en localStorage como fallback siempre
            try { localStorage.setItem('tt_v11_fallback', JSON.stringify(this.state)); } catch(_) {}
        } catch (err) {
            console.warn('[Store V11] IndexedDB persist failed, using localStorage:', err.message);
            try { localStorage.setItem('tt_v11_fallback', JSON.stringify(this.state)); } catch(_) {}
        }
    }

    _reducer(state, action) {
        const newState = { ...state };
        const findProject = id => newState.projects.findIndex(p => p.id === id);
        let idx;

        switch (action.type) {
            case 'LOGIN_USER':
                newState.session.activeUserId = action.payload.userId;
                newState.session.role = newState.globalUsers.find(u => u.id === action.payload.userId)?.globalRole || 'network-user';
                break;
            case 'LOGOUT_USER':
                newState.session = { activeUserId: null, role: 'guest' };
                break;
            case 'ADD_USER':
            case 'REGISTER_USER':
                if (!newState.globalUsers.find(u => u.id === action.payload.id))
                    newState.globalUsers.push({ ...action.payload, profile: { sbt_skills: [], ...action.payload.profile } });
                break;
            case 'CREATE_PROJECT':
                if (!newState.projects.find(p => p.id === action.payload.id))
                    newState.projects.push({ roles: [], vna_flows: [], ledger: [], telemetry: [], workOrders: [], isArchived: false, createdAt: Date.now(), ...action.payload });
                break;
            case 'UPDATE_PROJECT_INFO':
                idx = findProject(action.payload.projectId);
                if (idx > -1) Object.assign(newState.projects[idx], action.payload.updates);
                break;
            case 'ADD_ROLE':
                idx = findProject(action.payload.projectId);
                if (idx > -1) { if (!newState.projects[idx].roles) newState.projects[idx].roles = []; newState.projects[idx].roles.push(action.payload.role); }
                break;
            case 'ADD_FLOW':
                idx = findProject(action.payload.projectId);
                if (idx > -1) { if (!newState.projects[idx].vna_flows) newState.projects[idx].vna_flows = []; newState.projects[idx].vna_flows.push(action.payload.flow); }
                break;
            case 'LEDGER_UPDATE':
            case 'LOG_WORK':
                idx = findProject(action.payload.projectId);
                if (idx > -1) {
                    if (!newState.projects[idx].ledger) newState.projects[idx].ledger = [];
                    newState.projects[idx].ledger.push({
                        ...action.payload,
                        slices: Number(((action.payload.realHours || 0) * (action.payload.fmv || 50) * (action.payload.multiplier || 1)).toFixed(3)),
                        timestamp: Date.now()
                    });
                }
                break;
            case 'LOG_TELEMETRY':
                idx = findProject(action.payload.projectId);
                if (idx > -1) { if (!newState.projects[idx].telemetry) newState.projects[idx].telemetry = []; newState.projects[idx].telemetry.push({ ...action.payload, timestamp: Date.now() }); }
                break;
            default: break;
        }
        return newState;
    }
}

export const store = new Store();
