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
    if (mode === 'replace' && snap.kernel) {
        await KB.saveNode({ id: 'global_kernel_state_v11', type: 'kernel', content: snap.kernel });
    }
    return { imported: count, mode };
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
