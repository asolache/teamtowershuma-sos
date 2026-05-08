// TEAMTOWERS SOS V11 — SOS MANIFESTO (MAT-002-G fase A)
//
// Manifesto canónico de SOS V11 · persistido como nodo KB
// `type='system_prompt' kind='canonical-manifesto'` · referencia consultable.
//
// REGLA DE ORO (input @alvaro 2026-05-08):
//   El manifesto NO se inyecta automáticamente en `Orchestrator.callLLM`.
//   Inflar tokens en cada llamada degradaría la calidad/coste, que son
//   valores añadidos centrales de SOS. La visión vive en este documento +
//   en la memoria del desarrollador. SOS sólo lo PERMITE · no lo encarna.
//
// Sprints:
//   A · persistencia + UI editable en /settings (este módulo)
//   B · opt-in muy específico (cloning sector / generación SOC) · futuro
//   C · audit cuantificado pre-merge · futuro

const MANIFESTO_NODE_ID = 'sos-system-prompt-canonical';
const MANIFESTO_NODE_TYPE = 'system_prompt';
const MANIFESTO_NODE_KIND = 'canonical-manifesto';

const SOS_CANONICAL_MANIFESTO_TEXT = [
    'Eres el agente inteligente del SOS V11 · Sistema Operativo Sociotécnico',
    'de TeamTowers · diseñado para formar y facilitar el desarrollo de',
    'proyectos de todo tipo (cooperativos · empresariales · startup · fundación',
    '· hortet de barri · empresa de software) usando IA + sistemas de registro',
    'público + contabilidad triple-entry + descentralización.',
    '',
    'Misión · generar una ola disruptiva de personas formadas en:',
    '1. Diseño, análisis y mejora de flujos de valor (Value Network Analysis)',
    '2. Automatización de flujos de valor (Antigravity Engine: SOP→WO→Ledger)',
    '3. Contabilidad de valor con cobro y distribución de recompensas',
    '   automática (slicing pie · multiplicadores fundacionales · exit triggers)',
    '4. Uso de SOS como sistema operativo común para todo el proceso',
    '',
    'Principios:',
    '- Mind-as-Graph · todo es un nodo con tags taxonómicos + folksonómicos',
    '- Context-First sobre Multi-Agent · 1 llamada con contexto rico vence 20',
    '  agentes con contexto vacío',
    '- Local-first absoluto · todo en el navegador del operador',
    '- Intangibles humanos · presencia · juicio · decisión política · NO se',
    '  delegan a IA',
    '- DTD · cada deliverable tiene un test booleano · si IA → automatiza ·',
    '  si humano → revisa',
    '- Fair Fractal Tokenomics (Matriu) · precio ex-ante · estructura',
    '  composable · escalable · automática',
].join('\n');

export const SOS_MANIFESTO = Object.freeze({
    nodeId: MANIFESTO_NODE_ID,
    nodeType: MANIFESTO_NODE_TYPE,
    nodeKind: MANIFESTO_NODE_KIND,
    defaultText: SOS_CANONICAL_MANIFESTO_TEXT,
});

// ── Pure helpers ────────────────────────────────────────────────────

// buildManifestoNode({ text?, createdBy? }) → { id, type, content, keywords }
// Devuelve el nodo listo para `KB.upsert`. NO escribe nada.
export function buildManifestoNode({ text, createdBy } = {}) {
    const body = (typeof text === 'string' && text.trim().length > 0)
        ? text
        : SOS_CANONICAL_MANIFESTO_TEXT;
    const node = {
        id: MANIFESTO_NODE_ID,
        type: MANIFESTO_NODE_TYPE,
        content: {
            kind: MANIFESTO_NODE_KIND,
            title: 'SOS V11 · Manifesto canónico (referencia · NO inyectado en LLM)',
            body,
            isDefault: body === SOS_CANONICAL_MANIFESTO_TEXT,
        },
        keywords: ['type:system_prompt', 'kind:canonical-manifesto', 'sos', 'manifesto', 'vision'],
    };
    if (createdBy) node.content.createdBy = createdBy;
    return node;
}

// extractManifestoText(node) → string · vacío si nodo inválido o sin body
export function extractManifestoText(node) {
    if (!node || typeof node !== 'object') return '';
    const body = node?.content?.body;
    return typeof body === 'string' ? body : '';
}

// isDefaultManifesto(text) → bool · trim-aware
export function isDefaultManifesto(text) {
    if (typeof text !== 'string') return false;
    return text.trim() === SOS_CANONICAL_MANIFESTO_TEXT.trim();
}

// ── KB-bound helpers (async) ────────────────────────────────────────
// El módulo NO importa KB · acepta una instancia para mantener purity y
// permitir tests con mocks.

export async function loadManifesto(kbInstance) {
    if (!kbInstance || typeof kbInstance.getNode !== 'function') {
        throw new Error('[sosManifesto] loadManifesto requires a KB instance');
    }
    const node = await kbInstance.getNode(MANIFESTO_NODE_ID);
    const text = extractManifestoText(node) || SOS_CANONICAL_MANIFESTO_TEXT;
    return {
        node,
        text,
        isDefault: isDefaultManifesto(text),
        exists: !!node,
    };
}

export async function saveManifesto(kbInstance, { text, createdBy } = {}) {
    if (!kbInstance || typeof kbInstance.upsert !== 'function') {
        throw new Error('[sosManifesto] saveManifesto requires a KB instance with upsert');
    }
    const node = buildManifestoNode({ text, createdBy });
    return kbInstance.upsert(node);
}

export async function restoreDefaultManifesto(kbInstance, { createdBy } = {}) {
    return saveManifesto(kbInstance, { text: SOS_CANONICAL_MANIFESTO_TEXT, createdBy });
}

export async function ensureManifestoSeeded(kbInstance, { createdBy } = {}) {
    if (!kbInstance || typeof kbInstance.getNode !== 'function') return null;
    const existing = await kbInstance.getNode(MANIFESTO_NODE_ID);
    if (existing) return existing;
    return saveManifesto(kbInstance, { createdBy });
}
