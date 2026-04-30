// =============================================================================
// TEAMTOWERS SOS V11 — LINKIFY SERVICE (UX-001 sprint B)
// Ruta: /js/core/linkifyService.js
//
// Hipertexto folksonómico: cualquier campo de texto puede contener
// referencias a otros nodos del Mind-as-Graph mediante la sintaxis:
//
//   [[nodeId]]            → renderiza como <a href="/n/{nodeId}">{nodeId}</a>
//   [[nodeId|alias]]      → renderiza como <a href="/n/{nodeId}">{alias}</a>
//   #tag-folksonomico     → renderiza como <a href="/tags?tag={tag}">#tag</a>
//
// Función PURA (sin I/O · testeable). Escapa el resto del texto para
// evitar XSS · sólo emite los anchors como HTML "trusted".
// =============================================================================

// HTML escape mínimo
function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, ch => ({
        '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
    }[ch]));
}

// Validación de id de nodo: alfanumérico + _ - . (suficiente para los uids
// que produce el sistema, sin barras ni espacios para no romper rutas).
const NODE_ID_RE = /^[A-Za-z0-9_.-]+$/;

// Tag folksonómico (igual al normalizeTag de tagsService): kebab-case lowercase.
const TAG_RE = /^[a-z0-9][a-z0-9-]{0,39}$/;

export function linkifyNodeRefs(text, options = {}) {
    if (text == null || text === '') return '';
    const raw = String(text);

    // Tokenizamos: vamos consumiendo el texto en orden, alternando
    // bloques "literal" (a escapar) y bloques "anchor" (HTML trusted).
    // Patrones soportados (en orden de precedencia):
    //   [[id|alias]]   o   [[id]]   o   #tag
    // Grupos: m[1]=id  m[2]=alias  m[3]=prefijo de #tag  m[4]=tag
    const TOKEN_RE = /\[\[([^\]|\s][^\]|]*)(?:\|([^\]]+))?\]\]|(^|[\s(>])#([a-z0-9][a-z0-9-]{0,39})(?=$|[\s).,;:!?<])/g;

    let out = '';
    let lastIdx = 0;
    let m;
    while ((m = TOKEN_RE.exec(raw)) !== null) {
        const idx = m.index;
        // Texto literal antes del match
        if (idx > lastIdx) out += escapeHtml(raw.slice(lastIdx, idx));

        if (m[1] !== undefined) {
            // [[id|alias]] o [[id]]
            const id    = m[1].trim();
            const alias = m[2] != null ? m[2].trim() : id;
            if (NODE_ID_RE.test(id)) {
                out += `<a href="/n/${encodeURIComponent(id)}" data-link class="sos-noderef">${escapeHtml(alias)}</a>`;
            } else {
                // id inválido → preservar literal
                out += escapeHtml(m[0]);
            }
            lastIdx = idx + m[0].length;
        } else if (m[4]) {
            // #tag (con prefijo opcional de espacio/(/>/inicio)
            const prefix = m[3] || '';
            const tag    = m[4];
            if (TAG_RE.test(tag)) {
                out += escapeHtml(prefix);
                out += `<a href="/tags?tag=${encodeURIComponent(tag)}" data-link class="sos-tagref">#${escapeHtml(tag)}</a>`;
            } else {
                out += escapeHtml(m[0]);
            }
            lastIdx = idx + m[0].length;
        }
    }
    // Resto literal
    if (lastIdx < raw.length) out += escapeHtml(raw.slice(lastIdx));
    return out;
}

// Helper conveniencia · si quieres escribir HTML completo con saltos como <br>:
export function linkifyMultiline(text, options = {}) {
    return linkifyNodeRefs(text, options).replace(/\r?\n/g, '<br>');
}
