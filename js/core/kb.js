// TEAMTOWERS SOS V11 — KB.JS · IndexedDB Async · dbVersion: 17
// REGLA: Todo await/async. saveNode() siempre requiere { id }.
//
// Mind-as-Graph: un proyecto SOS es un único grafo de conocimiento.
// Todos los tipos de nodo conviven en la misma object store `nodes`
// y se indexan por `type`, `projectId` y `keywords` (multiEntry).
//
// Tipos canónicos:
//   config           — valor de configuración (API keys, provider, idioma)
//   kernel           — snapshot completo del store Redux
//   skill            — capacidad ejecutable (ver skill-seeds.js)
//   prompt           — system prompt de agente (@agent_*)
//   soc              — Standard Operating Concept (qué + por qué)
//   sop              — Standard Operating Procedure (cómo)
//   deliverable      — entregable + criterios de aceptación (DTD)
//   work_order       — tarjeta kanban ligada a un deliverable
//   ledger_entry     — asiento de contabilidad de valor
//   signed_artifact  — snapshot/export firmado (hash + firma)
//   skill_node       — registro de uso/evolución de un skill
//
// Forma del nodo:
//   { id, type, projectId?, content, keywords?[],
//     createdAt, updatedAt, signature? }

export const KB = {
    dbName: 'TeamTowers_V11', dbVersion: 17, db: null,

    init() {
        return new Promise((resolve, reject) => {
            if (this.db) { resolve(this.db); return; }
            const req = indexedDB.open(this.dbName, this.dbVersion);
            req.onerror = e => reject(e.target.error);
            req.onsuccess = e => { this.db = e.target.result; resolve(this.db); };
            req.onupgradeneeded = e => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('nodes')) {
                    const s = db.createObjectStore('nodes', { keyPath: 'id' });
                    s.createIndex('type', 'type', { unique: false });
                    s.createIndex('projectId', 'projectId', { unique: false });
                    s.createIndex('keywords', 'keywords', { multiEntry: true, unique: false });
                }
            };
        });
    },

    saveNode(node) {
        return new Promise((resolve, reject) => {
            if (!this.db) { reject(new Error('[KB] DB no inicializada.')); return; }
            if (!node?.id) { reject(new Error('[KB] El nodo necesita un id.')); return; }
            const req = this.db.transaction('nodes', 'readwrite').objectStore('nodes').put(node);
            req.onsuccess = () => resolve(node);
            req.onerror = e => reject(e.target.error);
        });
    },

    getNode(id) {
        return new Promise((resolve, reject) => {
            if (!this.db) { resolve(null); return; }
            const req = this.db.transaction('nodes', 'readonly').objectStore('nodes').get(id);
            req.onsuccess = e => resolve(e.target.result || null);
            req.onerror = e => reject(e.target.error);
        });
    },

    deleteNode(id) {
        return new Promise((resolve, reject) => {
            if (!this.db) { reject(new Error('[KB] DB no inicializada.')); return; }
            const req = this.db.transaction('nodes', 'readwrite').objectStore('nodes').delete(id);
            req.onsuccess = () => resolve(true);
            req.onerror = e => reject(e.target.error);
        });
    },

    getAllNodes() {
        return new Promise((resolve, reject) => {
            if (!this.db) { resolve([]); return; }
            const req = this.db.transaction('nodes', 'readonly').objectStore('nodes').getAll();
            req.onsuccess = e => resolve(e.target.result || []);
            req.onerror = e => reject(e.target.error);
        });
    },

    getNodesByType(type) {
        return new Promise((resolve, reject) => {
            if (!this.db) { resolve([]); return; }
            const req = this.db.transaction('nodes', 'readonly').objectStore('nodes').index('type').getAll(type);
            req.onsuccess = e => resolve(e.target.result || []);
            req.onerror = e => reject(e.target.error);
        });
    },

    // ── Mind-as-Graph API ─────────────────────────────────────────
    // upsert: crea o actualiza; preserva createdAt, refresca updatedAt
    async upsert(node) {
        if (!node?.id) throw new Error('[KB] upsert requires { id }');
        const existing = await this.getNode(node.id);
        const now = Date.now();
        const merged = {
            createdAt: existing?.createdAt || now,
            ...node,
            updatedAt: now
        };
        return this.saveNode(merged);
    },

    // query: filtra por type y/o projectId y/o keyword (cualquier combinación)
    query({ type, projectId, keyword } = {}) {
        return new Promise((resolve, reject) => {
            if (!this.db) { resolve([]); return; }
            const store = this.db.transaction('nodes', 'readonly').objectStore('nodes');
            let req;
            if (keyword)                        req = store.index('keywords').getAll(keyword);
            else if (type && !projectId)        req = store.index('type').getAll(type);
            else if (projectId && !type)        req = store.index('projectId').getAll(projectId);
            else                                req = store.getAll();
            req.onsuccess = e => {
                let rows = e.target.result || [];
                if (type)      rows = rows.filter(n => n.type === type);
                if (projectId) rows = rows.filter(n => n.projectId === projectId);
                resolve(rows);
            };
            req.onerror = e => reject(e.target.error);
        });
    },

    // remove: alias semántico de deleteNode
    remove(id) { return this.deleteNode(id); },

    async purge() {
        const nodes = await this.getAllNodes();
        for (const n of nodes) await this.deleteNode(n.id);
        return true;
    },

    async exportAll() {
        const nodes = await this.getAllNodes();
        return { version: 'v11', exported: new Date().toISOString(), count: nodes.length, nodes };
    },

    async importAll(data) {
        if (!data?.nodes) throw new Error('[KB] Formato inválido.');
        for (const n of data.nodes) await this.saveNode(n);
        return true;
    }
};