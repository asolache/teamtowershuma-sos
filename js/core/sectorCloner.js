// =============================================================================
// TEAMTOWERS SOS V11 — SECTOR CLONER (H1.10.1)
// Ruta: /js/core/sectorCloner.js
//
// Clonación sector → cliente con LLM Context-First.
// Toma un sector base de los 22 CNAE + descripción libre del cliente y
// produce un mapa VNA personalizado con trazabilidad sector→cliente.
//
// Cadena Antigravity completa aplicada al cliente:
//   Sector seed → Cliente VNA (H1.10.1) → SOPs cliente (futuro) →
//   WOs (H7.3) → auto-ejecución IA (H7.2) → Ledger.
// =============================================================================

import { Orchestrator }    from './Orchestrator.js';
import { KnowledgeLoader } from './KnowledgeLoader.js';

// ─── Builder puro del userPrompt (testeable sin LLM) ───────────────────────
export function buildClonePrompt({ sectorId, sectorSeed, clientName, clientDescription }) {
    const roles = (sectorSeed && sectorSeed.roles) || [];
    const txs   = (sectorSeed && sectorSeed.transactions) || [];
    const pats  = (sectorSeed && sectorSeed.patterns) || [];

    const fmtRole = r => [
        '  - id: '            + (r.id || ''),
        '    name: "'         + (r.name || r.id || '') + '"',
        '    castell_level: ' + (r.castell_level || 'tronc'),
        '    description: "'  + String(r.description || '').replace(/"/g, "'") + '"',
        '    typical_actor: "'+ String(r.typical_actor || '').replace(/"/g, "'") + '"',
    ].join('\n');

    const fmtTx = t => [
        '  - id: '            + (t.id || ''),
        '    from: '          + (t.from || ''),
        '    to: '            + (t.to || ''),
        '    deliverable: "'  + String(t.deliverable || '').replace(/"/g, "'") + '"',
        '    type: '          + (t.type || 'tangible'),
        '    is_must: '       + (t.is_must ? 'true' : 'false'),
        t.health_hint ? '    health_hint: "' + String(t.health_hint).replace(/"/g, "'") + '"' : null,
    ].filter(Boolean).join('\n');

    const fmtPat = p => [
        '  - name: "'         + String(p.name || '') + '"',
        '    description: "'  + String(p.description || '').replace(/"/g, "'") + '"',
        '    signal: "'       + String(p.signal || '').replace(/"/g, "'") + '"',
    ].join('\n');

    return [
        'TAREA: Clonar y personalizar el mapa VNA del sector "' + sectorId + '" para el cliente "' + (clientName || '(sin nombre)') + '".',
        '',
        'DESCRIPCIÓN DEL CLIENTE:',
        '"""',
        (clientDescription || '(sin descripción)'),
        '"""',
        '',
        'MAPA VNA DEL SECTOR BASE (' + sectorId + '):',
        '',
        'roles:',
        roles.length ? roles.map(fmtRole).join('\n\n') : '  []',
        '',
        'transactions:',
        txs.length ? txs.map(fmtTx).join('\n\n') : '  []',
        '',
        'patterns:',
        pats.length ? pats.map(fmtPat).join('\n\n') : '  []',
        '',
        'INSTRUCCIONES DE PERSONALIZACIÓN:',
        '1. CONSERVA los IDs de los roles base (trazabilidad sector→cliente).',
        '2. PERSONALIZA `name`, `description`, `typical_actor` y `tags` al contexto real del cliente.',
        '3. AÑADE 1-3 roles emergentes específicos si la descripción del cliente los sugiere (id con prefijo `client-`).',
        '4. CONSERVA las transacciones base, personalizando `deliverable` cuando aplique.',
        '5. AÑADE 0-3 transacciones nuevas para conectar los roles emergentes.',
        '6. CONSERVA todos los patterns base + AÑADE 0-2 patterns específicos del cliente si su descripción identifica disfunciones reales.',
        '',
        'REGLAS IRRENUNCIABLES:',
        '- NO inventes roles sin base contextual real del cliente.',
        '- NO incluyas precios. Usa `[VER CATÁLOGO]` o `[PRECIO]` como placeholders.',
        '- Mantén el bilingüismo (`name_en`, `description_en`) si el sector base lo tenía.',
        '- Respeta los 10 valores castellers del SOC raíz `soc-teamtowers-brand`.',
        '',
        'OUTPUT: SÓLO JSON válido con este schema (NADA antes ni después):',
        '{',
        '  "client_id": "kebab-case-derivado-del-cliente",',
        '  "project_name": "Nombre legible del proyecto cliente",',
        '  "sector_id": "' + sectorId + '",',
        '  "based_on_sector": "' + sectorId + '",',
        '  "roles": [{ "id", "name", "description", "castell_level", "typical_actor", "tags": [] }],',
        '  "transactions": [{ "id", "from", "to", "deliverable", "type", "is_must", "frequency", "health_hint" }],',
        '  "patterns": [{ "name", "description", "signal" }],',
        '  "emergent_notes": "Texto explicando los nodos emergentes añadidos y por qué",',
        '  "version": "v1.0"',
        '}',
    ].join('\n');
}

// ─── Orquestador: construye contexto, llama LLM, valida readiness ──────────
export async function cloneSectorForClient({ sectorId, clientName, clientDescription }) {
    if (!sectorId)         throw new Error('sectorId requerido');
    if (!clientName)       throw new Error('clientName requerido');
    if (!clientDescription)throw new Error('clientDescription requerido');

    const sectorSeed = await KnowledgeLoader.getSectorSeed(sectorId);
    if (!sectorSeed) throw new Error('Sector no encontrado: ' + sectorId);

    const ctx = await KnowledgeLoader.buildContext({
        sector:      sectorId,
        freeText:    clientDescription,
        socs:        ['teamtowers-brand'],
        taskContext: 'Clonar sector ' + sectorId + ' para cliente ' + clientName,
    });

    const userPrompt = buildClonePrompt({ sectorId, sectorSeed, clientName, clientDescription });

    const result = await Orchestrator.callLLM({
        preferredEngine: 'anthropic',
        systemPrompt:    ctx.systemPrompt,
        userPrompt,
        responseFormat:  'json_object',
        temperature:     0.3,
    });

    const cloned = result.content;
    if (!cloned || cloned.parseError) {
        throw new Error('LLM devolvió output no parseable: ' + JSON.stringify(cloned).slice(0, 300));
    }

    // Validación TDD usando el mismo criterio de KnowledgeLoader
    const validation = {
        roles:     Array.isArray(cloned.roles)        ? cloned.roles.length        : 0,
        txs:       Array.isArray(cloned.transactions) ? cloned.transactions.length : 0,
        patterns:  Array.isArray(cloned.patterns)     ? cloned.patterns.length     : 0,
        hasEn:     true,   // heredado del sector base
    };
    const readiness = KnowledgeLoader._computeSectorReadiness(validation);

    return {
        cloned,
        validation,
        readiness,
        sources:   ctx.sources,
        tokens:    result.telemetry?.tokens || {},
        latencyMs: result.telemetry?.latencyMs || 0,
        sectorBase: sectorId,
    };
}
