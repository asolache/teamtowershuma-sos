// =============================================================================
// TEAMTOWERS SOS V11 — PROJECT I/O · Export/Import firmado
// Ruta: /js/core/projectIO.js
//
// Snapshot del grafo Mind-as-Graph completo:
//   - kernel state (Redux)
//   - todos los nodos KB (workshops, deliverables, sops, socs, etc.)
//   - firma ECDSA P-256 (compat Safari 13 / Catalina)
//
// La firma garantiza integridad — no es PKI estricta. Es un "self-signed
// snapshot": cualquier alteración del JSON exportado romperá la verify.
// El par de claves se genera al primer uso y se guarda en KB (nunca sale
// del navegador).
// =============================================================================

import { KB }    from './kb.js';
import { store } from './store.js';

const KEY_NODE_ID = 'sos_signing_keypair_v1';
const FORMAT      = 'sos-export';
const FORMAT_VER  = 'v11.1';

// ─── Crypto helpers ──────────────────────────────────────────────────────────
function bytesToB64(bytes) {
    let s = '';
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s);
}

function b64ToBytes(b64) {
    const s = atob(b64);
    const out = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
}

async function sha256Hex(bytes) {
    const buf = await crypto.subtle.digest('SHA-256', bytes);
    const arr = new Uint8Array(buf);
    return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── Par de claves (persiste en KB, primer uso lo genera) ────────────────────
export async function getOrCreateSigningKey() {
    await KB.init();
    const existing = await KB.getNode(KEY_NODE_ID);
    if (existing && existing.value?.publicJwk && existing.value?.privateJwk) {
        return existing.value;
    }
    const pair = await crypto.subtle.generateKey(
        { name: 'ECDSA', namedCurve: 'P-256' },
        true,
        ['sign', 'verify']
    );
    const publicJwk  = await crypto.subtle.exportKey('jwk', pair.publicKey);
    const privateJwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
    const value = { publicJwk, privateJwk, createdAt: Date.now() };
    await KB.upsert({ id: KEY_NODE_ID, type: 'config', value });
    return value;
}

async function importPrivKey(jwk) {
    return crypto.subtle.importKey('jwk', jwk,
        { name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign']);
}

async function importPubKey(jwk) {
    return crypto.subtle.importKey('jwk', jwk,
        { name: 'ECDSA', namedCurve: 'P-256' }, true, ['verify']);
}

// ─── Export ─────────────────────────────────────────────────────────────────
export async function exportSnapshot() {
    await KB.init();
    const keyValue = await getOrCreateSigningKey();
    const privateKey = await importPrivKey(keyValue.privateJwk);

    const allNodes = await KB.getAllNodes();
    // El par de claves NUNCA se exporta. El snapshot del kernel tampoco
    // (irá aparte como snap.kernel para evitar duplicar payload).
    const kbNodes = allNodes.filter(n =>
        n.id !== KEY_NODE_ID && n.id !== 'global_kernel_state_v11'
    );

    const payload = {
        format:     FORMAT,
        version:    FORMAT_VER,
        exportedAt: new Date().toISOString(),
        kernel:     store.getState(),
        kbNodes,
    };
    const json = JSON.stringify(payload);
    const data = new TextEncoder().encode(json);

    const sigBuf = await crypto.subtle.sign(
        { name: 'ECDSA', hash: 'SHA-256' },
        privateKey,
        data
    );

    return {
        ...payload,
        hash:      await sha256Hex(data),
        signature: bytesToB64(new Uint8Array(sigBuf)),
        publicJwk: keyValue.publicJwk,
    };
}

// ─── Verify ─────────────────────────────────────────────────────────────────
export async function verifySnapshot(snap) {
    if (!snap || snap.format !== FORMAT) throw new Error('Formato inválido (esperado sos-export)');
    if (!snap.signature || !snap.publicJwk)  throw new Error('Firma o clave pública ausentes');

    const { signature, publicJwk, hash, ...payload } = snap;
    const json = JSON.stringify(payload);
    const data = new TextEncoder().encode(json);

    const pub  = await importPubKey(publicJwk);
    const sig  = b64ToBytes(signature);
    const ok   = await crypto.subtle.verify(
        { name: 'ECDSA', hash: 'SHA-256' },
        pub,
        sig,
        data
    );
    if (!ok) throw new Error('Firma inválida — el snapshot fue alterado o no procede de este navegador');
    return true;
}

// ─── Import ─────────────────────────────────────────────────────────────────
// modes:
//   merge   (default) — añade/actualiza nodos del snapshot sobre lo existente
//   replace           — borra todo (excepto par de claves) y restaura snapshot
//
// v123-fix · IMPORT-BACKUP-BUG · @alvaro · els projectes no apareixien després
// d'importar perquè la kernel state (que conté `projects[]`) NO s'aplica en
// mode merge. Ara · ambdós modes apliquen també la kernel state (en merge ·
// fent merge de projects[] + globalUsers[] per id · en replace · substitució
// completa). A més · refresquem in-memory state i notifiquem listeners perquè
// la UI re-renderitzi sense full reload.
export async function importSnapshot(snap, { mode = 'merge' } = {}) {
    await verifySnapshot(snap);
    await KB.init();

    if (mode === 'replace') {
        const all = await KB.getAllNodes();
        for (const n of all) {
            if (n.id !== KEY_NODE_ID) await KB.deleteNode(n.id);
        }
    }

    let count = 0;
    for (const node of (snap.kbNodes || [])) {
        await KB.saveNode(node);
        count++;
    }

    // Apply kernel state (projects + globalUsers + session)
    let kernelApplied = false;
    let projectsMerged = 0;
    if (snap.kernel && typeof snap.kernel === 'object') {
        if (mode === 'replace') {
            // Reemplaça kernel sencer
            await KB.saveNode({ id: 'global_kernel_state_v11', type: 'kernel', content: snap.kernel });
            try { store.state = JSON.parse(JSON.stringify(snap.kernel)); } catch (_) {}
            kernelApplied = true;
            projectsMerged = (snap.kernel.projects || []).length;
        } else {
            // Merge · projects[] + globalUsers[] dedup per id · resta del kernel intacte
            const current = store.getState() || {};
            const mergedProjects = Array.isArray(current.projects) ? current.projects.slice() : [];
            const projectIds = new Set(mergedProjects.map(p => p.id));
            for (const p of (snap.kernel.projects || [])) {
                if (!p || !p.id) continue;
                if (projectIds.has(p.id)) {
                    // Update in place · els camps importats prevalen
                    const idx = mergedProjects.findIndex(x => x.id === p.id);
                    if (idx >= 0) mergedProjects[idx] = { ...mergedProjects[idx], ...p };
                } else {
                    mergedProjects.push(p);
                    projectIds.add(p.id);
                    projectsMerged++;
                }
            }
            const mergedUsers = Array.isArray(current.globalUsers) ? current.globalUsers.slice() : [];
            const userIds = new Set(mergedUsers.map(u => u.id));
            for (const u of (snap.kernel.globalUsers || [])) {
                if (!u || !u.id || userIds.has(u.id)) continue;
                mergedUsers.push(u);
                userIds.add(u.id);
            }
            const nextState = {
                ...current,
                projects:    mergedProjects,
                globalUsers: mergedUsers,
                lastUpdated: Date.now(),
                kbVersion:   (current.kbVersion || 0) + 1,
            };
            store.state = nextState;
            await store.persistState();
            kernelApplied = true;
        }
    }

    // Notify subscribers so views re-render without page reload
    try {
        if (Array.isArray(store.listeners)) {
            store.listeners.forEach(l => { try { l(store.state); } catch (_) {} });
        }
    } catch (_) {}

    return { imported: count, projectsMerged, kernelApplied, mode };
}

// ─── Helpers de UI: download/upload ─────────────────────────────────────────
export async function downloadSnapshotJson() {
    const snap = await exportSnapshot();
    const blob = new Blob([JSON.stringify(snap, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'sos-snapshot-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return snap;
}

export function readSnapshotFromFile(file) {
    return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onerror = () => reject(r.error);
        r.onload  = () => {
            try { resolve(JSON.parse(r.result)); }
            catch (e) { reject(new Error('JSON inválido: ' + e.message)); }
        };
        r.readAsText(file);
    });
}
