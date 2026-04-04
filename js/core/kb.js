// TEAMTOWERS SOS V11 — KB.JS · IndexedDB Async · dbVersion: 17
// REGLA: Todo await/async. saveNode() siempre requiere { id }.

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
