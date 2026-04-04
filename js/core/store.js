// TEAMTOWERS SOS V11 — STORE.JS · Redux Inmutable

import { KB } from './kb.js';

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
            if (saved?.content) {
                this.state = saved.content;
            }
            this.state.config.version   = initialState.config.version;
            this.state.config.economics = initialState.config.economics;
            if (!this.state.globalUsers) this.state.globalUsers = [];
            initialState.globalUsers.forEach(agent => {
                if (!this.state.globalUsers.find(u => u.id === agent.id)) {
                    this.state.globalUsers.push(agent);
                }
            });
        } catch (err) {
            console.warn('[Store V11] Init fallback:', err.message);
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
        } catch (_) {
            localStorage.setItem('tt_v11_fallback', JSON.stringify(this.state));
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
