// =============================================================================
// TEAMTOWERS SOS V11 — v136 · ROLE DEDUP · EMBEDDING SIMILARITY
// Ruta · /js/core/roleDedup.js
//
// Item #3 del audit post-alfa (v134) · ALFA+ ·
// Detecta rols semànticament duplicats al mapa generat (ex · "Productor"
// + "Productor Local" amb cosine(embed_r1, embed_r2) > 0.85) i els
// fusiona en un de sol.
//
// Filosofia · pure function · embedding provider INJECTABLE (mocks fàcils
// per test · OpenAI text-embedding-3-small per producció · local model
// futur). No fa cap call si el provider no es passa.
//
// API ·
//  · cosineSimilarity(a, b) → number [-1, 1]
//  · roleSignature(role) → string (per a embedding) · pure
//  · detectDuplicateRoles({ roles, embedder, threshold? }) → { pairs }
//  · mergeDuplicates(map, pairs) → { roles, transactions, deliverables, merged }
//  · dedupRoles({ map, embedder, threshold? }) → composite (detect + merge)
// =============================================================================

export const ROLE_DEDUP_VERSION = 'v136';

// ── cosineSimilarity · pure · arrays numèrics ────────────────────────────
export function cosineSimilarity(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b)) return 0;
    if (a.length === 0 || a.length !== b.length) return 0;
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) {
        const av = +a[i] || 0, bv = +b[i] || 0;
        dot += av * bv;
        na  += av * av;
        nb  += bv * bv;
    }
    if (na === 0 || nb === 0) return 0;
    return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

// ── roleSignature · pure · text canonical d'un rol per a embedding ───────
//
// Concat name + kind + description per a context semàntic. Lowercase per
// reduir variància per minúscules/majúscules sense afectar cosine.
export function roleSignature(role) {
    if (!role || typeof role !== 'object') return '';
    const parts = [];
    if (role.name)        parts.push(String(role.name));
    if (role.kind)        parts.push('[' + String(role.kind) + ']');
    if (role.description) parts.push(String(role.description));
    if (role.castell_level) parts.push('(' + String(role.castell_level) + ')');
    return parts.join(' · ').toLowerCase().trim();
}

// ── detectDuplicateRoles · async · usa embedder injectat ─────────────────
//
// embedder · async fn(texts: string[]) → number[][] (un vector per text)
//
// threshold · default 0.85 · cosine ≥ threshold → considerats duplicats
//
// Retorna ·
//   { ok: true, pairs: [{ a: id1, b: id2, similarity: 0.91, signatures: [...] }], n: number }
//   { ok: false, error }
export async function detectDuplicateRoles({
    roles = [], embedder = null, threshold = 0.85,
} = {}) {
    if (!Array.isArray(roles) || roles.length < 2) {
        return { ok: true, pairs: [], n: roles.length, reason: 'less-than-2-roles' };
    }
    if (typeof embedder !== 'function') {
        return { ok: false, error: 'no-embedder · injecta async fn(texts[]) → vectors[]' };
    }
    const sigs = roles.map(roleSignature);
    let vectors;
    try { vectors = await embedder(sigs); }
    catch (e) { return { ok: false, error: 'embedder-failed · ' + (e?.message || 'unknown') }; }
    if (!Array.isArray(vectors) || vectors.length !== roles.length) {
        return { ok: false, error: 'embedder-bad-shape · expected ' + roles.length + ' vectors' };
    }
    const pairs = [];
    for (let i = 0; i < roles.length; i++) {
        for (let j = i + 1; j < roles.length; j++) {
            const sim = cosineSimilarity(vectors[i], vectors[j]);
            if (sim >= threshold) {
                pairs.push({
                    a: roles[i].id, b: roles[j].id,
                    aName: roles[i].name || roles[i].id,
                    bName: roles[j].name || roles[j].id,
                    similarity: +sim.toFixed(4),
                    threshold,
                });
            }
        }
    }
    // Sort desc per similarity · més similars primer
    pairs.sort((x, y) => y.similarity - x.similarity);
    return { ok: true, pairs, n: roles.length };
}

// ── mergeDuplicates · pure · aplica pairs al mapa ────────────────────────
//
// Strategy · per cada pair, conserva el rol "a" (primer mencionat) i fusiona
// "b" cap a "a" · totes les transactions que apuntaven a b ara apunten a a.
//
// Retorna · { roles, transactions, deliverables, merged: [{ from, to, lostName }] }
//
// Nota · si una cadena de duplicats (a~b, b~c), aplica transitivament ·
// b → a, després c (que apuntava a b) també → a.
export function mergeDuplicates(map = {}, pairs = []) {
    const roles        = [...(map.roles || [])];
    const transactions = [...(map.transactions || [])];
    const deliverables = [...(map.deliverables || [])];
    const aliasOf = new Map();          // bId → resolvedId
    const merged = [];

    function resolve(id) {
        let cur = id;
        while (aliasOf.has(cur)) cur = aliasOf.get(cur);
        return cur;
    }

    for (const p of pairs) {
        const keep = resolve(p.a);
        const drop = resolve(p.b);
        if (keep === drop) continue;     // ja fusionat
        aliasOf.set(drop, keep);
        const dropRole = roles.find(r => r.id === drop);
        merged.push({ from: drop, to: keep, lostName: dropRole?.name || drop });
    }

    // Filtra rols · només els que NO són alias destí
    const filteredRoles = roles.filter(r => !aliasOf.has(r.id));

    // Remapeja transactions · from/to via resolve()
    const remappedTxs = transactions.map(t => ({
        ...t,
        from: resolve(t.from),
        to:   resolve(t.to),
    })).filter(t => t.from !== t.to);   // descarta self-loops

    // Dedupe transactions amb mateix from+to+type
    const seen = new Set();
    const deduped = [];
    for (const t of remappedTxs) {
        const key = t.from + '->' + t.to + ':' + (t.type || '');
        if (seen.has(key)) continue;
        seen.add(key);
        deduped.push(t);
    }

    return {
        ...map,
        roles:        filteredRoles,
        transactions: deduped,
        deliverables,
        merged,
    };
}

// ── dedupRoles · composite · detect + merge en una crida ─────────────────
export async function dedupRoles({ map = {}, embedder = null, threshold = 0.85 } = {}) {
    const t0 = Date.now();
    const detection = await detectDuplicateRoles({ roles: map.roles || [], embedder, threshold });
    if (!detection.ok) return { ok: false, error: detection.error, ms: Date.now() - t0 };
    if (detection.pairs.length === 0) {
        return { ok: true, updatedMap: map, pairs: [], merged: [], noChanges: true, ms: Date.now() - t0 };
    }
    const merged = mergeDuplicates(map, detection.pairs);
    return {
        ok: true,
        updatedMap: merged,
        pairs:      detection.pairs,
        merged:     merged.merged,
        rolesBefore: (map.roles || []).length,
        rolesAfter:  merged.roles.length,
        ms:         Date.now() - t0,
    };
}

// ── Embedding adapters · mínim · injectables al CLI o producció ──────────
//
// makeOpenAIEmbedder({ apiKey, model? }) → async (texts) → vectors
// makeMockEmbedder(map) → async (texts) → fixed vectors (per tests)

export function makeOpenAIEmbedder({ apiKey = null, model = 'text-embedding-3-small' } = {}) {
    if (!apiKey) throw new Error('makeOpenAIEmbedder · apiKey required');
    return async function openaiEmbed(texts) {
        if (!Array.isArray(texts) || texts.length === 0) return [];
        const res = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: { 'content-type': 'application/json', authorization: 'Bearer ' + apiKey },
            body:    JSON.stringify({ model, input: texts }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error('openai-embed ' + res.status + ' · ' + (data?.error?.message || res.statusText));
        return (data?.data || []).map(d => d?.embedding || []);
    };
}

// Determinístic per a tests · cada text genera el mateix vector ·
// vectors similars per a textos lèxicament similars (overlap-based simple)
export function makeMockEmbedder({ dim = 8 } = {}) {
    return async function mockEmbed(texts) {
        return texts.map(text => {
            const t = String(text).toLowerCase();
            const v = new Array(dim).fill(0);
            // Bag of char-bigrams · permet similarity bàsica · suficient per a test
            for (let i = 0; i < t.length - 1; i++) {
                const bigram = t.charCodeAt(i) + t.charCodeAt(i + 1);
                v[bigram % dim] += 1;
            }
            // Normalitzar L2
            let norm = 0;
            for (const x of v) norm += x * x;
            norm = Math.sqrt(norm) || 1;
            return v.map(x => x / norm);
        });
    };
}
