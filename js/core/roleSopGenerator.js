// =============================================================================
// TEAMTOWERS SOS V11 — ROLE SOP GENERATOR (H1.10.2)
// Ruta: /js/core/roleSopGenerator.js
//
// Generación de SOPs propios de un proyecto cliente desde sus roles VNA.
//
// Tesis (input @alvaro 2026-04-30): los SOPs públicos de TeamTowers son
// los servicios que TT ofrece. Análogamente, los SOPs DE UN PROYECTO
// CLIENTE son los productos y servicios que esa red de valor con
// propósito genera. Cada rol VNA del cliente puede tener un SOP que
// describe cómo se ejecuta, con steps[] auto-convertibles en WOs (H7.3)
// que luego pueden ser ejecutadas por humanos o IA (H7.2) y se
// contabilizan en el ledger del cliente.
//
// Cierra la cadena Antigravity completa para cualquier cliente:
//   Sector seed (TT KB)
//      ↓ H1.10.1 ✅ (sectorCloner)
//   Cliente VNA (clonado)
//      ↓ H1.10.2 (este módulo)
//   SOPs por rol del cliente (= productos/servicios reales)
//      ↓ H7.3 ✅
//   Work Orders ejecutables
//      ↓ H7.2 ✅
//   Ledger del cliente con coste y ahorro IA
// =============================================================================

import { KnowledgeLoader } from './KnowledgeLoader.js';

// ─── Builder PURO testeable ─────────────────────────────────────────────────
export function buildRoleSopPrompt({ role, project, sectorBase = null }) {
    if (!role || !project) throw new Error('buildRoleSopPrompt requires role and project');

    const roleTags = Array.isArray(role.tags) ? role.tags.join(', ') : '';
    const projectName = project.nombre || project.id || '(sin nombre)';
    const sectorId = sectorBase || project.sector_id || project.based_on_sector || '(sin sector)';

    // Transacciones que tocan el rol (entrantes y salientes) — input crítico
    const txs = Array.isArray(project.vna_transactions) ? project.vna_transactions : [];
    const txOut = txs.filter(t => t.from === role.id);
    const txIn  = txs.filter(t => t.to   === role.id);

    const fmtTx = (t, dir) =>
        '  - ' + dir + ' ' + (dir === 'IN' ? t.from : t.to) +
        ' · ' + (t.deliverable || '?') +
        ' [' + (t.type || 'tangible') + (t.is_must ? ' · MUST' : ' · EXTRA') + ']';

    return [
        'TAREA: Generar un SOP (Standard Operating Procedure) específico del proyecto cliente para el rol VNA siguiente. El SOP describe CÓMO se ejecuta este rol en el contexto real del cliente y qué entregables produce. Será auto-convertible en Work Orders ejecutables.',
        '',
        'CLIENTE / PROYECTO: ' + projectName,
        'SECTOR BASE: ' + sectorId,
        '',
        'ROL VNA:',
        '- ID: ' + role.id,
        '- Nombre: ' + (role.name || role.id),
        '- Nivel castellero: ' + (role.castell_level || 'tronc'),
        '- Descripción: ' + (role.description || '(sin descripción)'),
        '- Actor típico: ' + (role.typical_actor || '(no especificado)'),
        '- Tags: ' + (roleTags || '(sin tags)'),
        '',
        'TRANSACCIONES SALIENTES (entregables que ESTE rol produce):',
        txOut.length ? txOut.map(t => fmtTx(t, 'OUT →')).join('\n') : '  (ninguna definida — el SOP debe inferir entregables principales)',
        '',
        'TRANSACCIONES ENTRANTES (lo que ESTE rol recibe para poder ejecutar):',
        txIn.length  ? txIn.map(t => fmtTx(t, 'IN  ←')).join('\n')  : '  (ninguna definida)',
        '',
        'INSTRUCCIONES:',
        '1. El SOP debe describir el procedimiento operativo del rol en este cliente, NO el rol genérico del sector.',
        '2. Estructura el SOP en 5-9 STEPS secuenciales. Cada step:',
        '   - tiene id (kebab-case con prefijo `step-`)',
        '   - label (frase corta y accionable)',
        '   - duration_minutes (estimación realista)',
        '   - role_kind ("human" | "ai" según viable automatización)',
        '   - role_profile (perfil concreto, ej. "operador-junior", "agente_anthropic")',
        '   - deliverable_kind (qué entregable tangible produce ese step)',
        '   - approval_rule ("manual" | "tdd-auto")',
        '   - priority ("low" | "med" | "high")',
        '3. AL MENOS UN step debe ser asignable a IA (role_kind: "ai") cuando el entregable sea repetitivo o estructurado (textos, tablas, resúmenes, validaciones).',
        '4. Los entregables del SOP deben corresponder a las transacciones SALIENTES del rol cuando aplique.',
        '5. Respeta el SOC raíz `soc-teamtowers-brand` (10 valores castellers, NO inventar precios).',
        '6. Producto de operación, no documento académico: lenguaje accionable, verbo activo, claridad operativa.',
        '',
        'OUTPUT: SÓLO JSON válido con este schema:',
        '{',
        '  "id": "sop-' + role.id + '-' + project.id + '",',
        '  "name": "Nombre legible del SOP del rol",',
        '  "soc_ref": "soc-vna-network",',
        '  "role_ref": "' + role.id + '",',
        '  "project_ref": "' + project.id + '",',
        '  "duration_minutes": int (suma de los steps),',
        '  "audience": ["actor típico de este rol"],',
        '  "deliverables": ["entregables principales del rol"],',
        '  "keywords": [...],',
        '  "steps": [{ "id", "label", "duration_minutes", "role_kind", "role_profile", "deliverable_kind", "approval_rule", "priority" }],',
        '  "summary": "Texto breve (3-4 líneas) explicando para qué sirve este SOP en el proyecto del cliente."',
        '}',
    ].join('\n');
}

// ─── Orquestador: construye contexto, llama LLM, valida ────────────────────
export async function generateRoleSop({ role, project, sectorBase = null }) {
    if (!role)    throw new Error('role requerido');
    if (!project) throw new Error('project requerido');

    const ctx = await KnowledgeLoader.buildContext({
        sector:      sectorBase || project.sector_id || project.based_on_sector || null,
        socs:        ['teamtowers-brand', 'soc-vna-network'],
        sops:        ['la-colla'],     // método VNA como referencia metodológica
        projectId:   project.id,
        taskContext: 'Generar SOP del rol "' + (role.name || role.id) + '" para el proyecto cliente "' + (project.nombre || project.id) + '"',
    });

    const userPrompt = buildRoleSopPrompt({ role, project, sectorBase });

    // Cache-bust dinámico (BUG-002/003)
    const { Orchestrator } = await import('./Orchestrator.js?v=' + Date.now());
    const result = await Orchestrator.callLLM({
        preferredEngine: 'anthropic',
        systemPrompt:    ctx.systemPrompt,
        userPrompt,
        responseFormat:  'json_object',
        temperature:     0.3,
    });

    const generated = result.content;
    if (!generated || generated.parseError) {
        const tail = (generated && generated.raw) ? generated.raw.slice(-200) : '(sin raw)';
        throw new Error('LLM devolvió SOP no parseable. Últimos 200 chars: ' + tail);
    }

    // Validación TDD: el SOP debe tener al menos N steps
    const stepsCount = Array.isArray(generated.steps) ? generated.steps.length : 0;
    const validation = {
        steps: stepsCount,
        hasIaStep: Array.isArray(generated.steps) && generated.steps.some(s => s.role_kind === 'ai'),
        hasName:   typeof generated.name === 'string' && generated.name.length > 3,
        hasSocRef: !!generated.soc_ref,
    };
    const readiness =
        (validation.steps >= 5 && validation.hasIaStep && validation.hasName && validation.hasSocRef) ? 'ready' :
        (validation.steps >= 3 && validation.hasName) ? 'solid' : 'tier 2';

    return {
        sop:        generated,
        validation,
        readiness,
        sources:    ctx.sources,
        tokens:     result.telemetry?.tokens || {},
        latencyMs:  result.telemetry?.latencyMs || 0,
        roleRef:    role.id,
        projectRef: project.id,
    };
}
