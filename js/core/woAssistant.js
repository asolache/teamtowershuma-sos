// =============================================================================
// TEAMTOWERS SOS V11 — WO ASSISTANT (H7.6)
// Ruta: /js/core/woAssistant.js
//
// Asistencia IA con contexto exacto a una Work Order humana.
//
// Tesis: las WOs humanas son las que cargan los intangibles (presencia,
// juicio, decisión política, relación con cliente). Pero los entregables
// concretos (informes, propuestas, diagnósticos, planificaciones) tienen
// una estructura semántica que la IA puede generar mejor cuando se le
// inyecta el contexto exacto: SOC + SOP + estado del proyecto + datos
// brutos aportados por el humano.
//
// Output: informe MD con estructura SOS estándar de 8 secciones que
// materializa los principios del sistema (Mind-as-Graph, Context-First,
// DTD, intangibles humanos, Antigravity).
// =============================================================================

import { KB }              from './kb.js';
import { KnowledgeLoader } from './KnowledgeLoader.js';

// ─── Helper PURO testeable · ensambla el bundle de contexto ────────────────
// No hace I/O de su lado · todos los inputs ya cargados.
// Tests pueden invocarlo con stubs sin tocar IndexedDB ni FS.
export function assembleWoContext({ wo, project = null, sopNode = null, socNotes = [], role = null }) {
    if (!wo)       throw new Error('assembleWoContext requires wo');
    if (!wo.content) throw new Error('wo.content requerido');

    const c = wo.content;
    const sopRef    = c.sopRef || null;
    const sopName   = sopNode?.content?.name   || null;
    const sopSteps  = Array.isArray(sopNode?.content?.steps) ? sopNode.content.steps : [];
    const socRefs   = Array.isArray(c.socRefs) ? c.socRefs : ['soc-teamtowers-brand'];

    return {
        // Identidad de la WO
        woId:         wo.id,
        woTitle:      c.title || '(sin título)',
        woDescription: c.description || '',
        woStatus:     c.status || 'backlog',
        woPriority:   c.priority || 'med',
        woEstimatedHours: c.estimatedHours || null,
        woFmvPerHour: c.fmvPerHour || null,
        // Contexto del proyecto cliente
        projectId:    wo.projectId || c.projectId || null,
        projectName:  project?.nombre || project?.name || null,
        projectSector: project?.sector_id || project?.based_on_sector || null,
        // SOP de referencia (puede no existir si la WO se creó sin SOP)
        sopRef,
        sopName,
        sopSteps,
        sopHasSteps:  sopSteps.length > 0,
        // SOC(s) raíz (texto resumen, no MD entero)
        socRefs,
        socNotes:     Array.isArray(socNotes) ? socNotes : [],
        // Rol VNA del assignee (si lo tenemos)
        role:         role || null,
        // Assignee
        assigneeKind: c.assignee?.kind || 'human',
        assigneeId:   c.assignee?.id   || 'pending',
    };
}

// ─── Builder PURO testeable · construye el user prompt para el LLM ─────────
// La instrucción de OUTPUT es el "estándar de comunicaciones SOS" — ver
// docs/backlog.md sección "Estándar de comunicaciones SOS".
export function buildWoAssistPrompt(woContext, humanInput, options = {}) {
    if (!woContext) throw new Error('buildWoAssistPrompt requires woContext');
    const human = (humanInput || '').toString().trim();
    if (!human) throw new Error('buildWoAssistPrompt requires humanInput non-empty');

    const c = woContext;
    const stepsBlock = c.sopHasSteps
        ? c.sopSteps.map((s, i) => '  ' + (i + 1) + '. [' + (s.role_kind || '?') + '] ' + (s.label || s.id) + ' · ' + (s.duration_minutes || '?') + 'min · ' + (s.deliverable_kind || '?'))
            .join('\n')
        : '  (el SOP referenciado no tiene steps · infiere desde título y descripción de la WO)';

    const socBlock = c.socNotes.length
        ? c.socNotes.map(n => '- ' + n).join('\n')
        : '- (sin SOCs cargados · usa los principios genéricos de SOS)';

    const roleBlock = c.role
        ? '- ID: ' + c.role.id + '\n- Nombre: ' + (c.role.name || c.role.id) + '\n- Castell level: ' + (c.role.castell_level || 'tronc') + '\n- Descripción: ' + (c.role.description || '(sin descripción)')
        : '(sin rol VNA explícito)';

    return [
        'TAREA: Generar un INFORME ESTRUCTURADO en formato Markdown que asista al humano asignado a esta Work Order. El informe debe seguir el estándar de comunicaciones SOS (8 secciones, ver OUTPUT abajo) que materializa los principios del sistema: Mind-as-Graph, Context-First, DTD, intangibles humanos, Antigravity.',
        '',
        '═══ WORK ORDER ═══',
        '- ID: ' + c.woId,
        '- Título: ' + c.woTitle,
        '- Descripción: ' + (c.woDescription || '(sin descripción)'),
        '- Estado: ' + c.woStatus + ' · Prioridad: ' + c.woPriority,
        '- Assignee humano: ' + c.assigneeId + (c.woEstimatedHours ? ' · ' + c.woEstimatedHours + 'h estimadas' : ''),
        c.woFmvPerHour ? '- FMV humano: ' + c.woFmvPerHour + ' €/h' : '',
        '',
        '═══ PROYECTO CLIENTE ═══',
        '- ID: ' + (c.projectId || '(sin proyecto · WO suelta)'),
        c.projectName  ? '- Nombre: ' + c.projectName : '',
        c.projectSector ? '- Sector base: ' + c.projectSector : '',
        '',
        '═══ SOP DE REFERENCIA ═══',
        c.sopRef ? '- Slug: ' + c.sopRef : '- (sin SOP de referencia)',
        c.sopName ? '- Nombre: ' + c.sopName : '',
        'Steps del SOP:',
        stepsBlock,
        '',
        '═══ SOC(s) RAÍZ ═══',
        socBlock,
        '',
        '═══ ROL VNA DEL ASSIGNEE ═══',
        roleBlock,
        '',
        '═══ DATOS BRUTOS APORTADOS POR EL HUMANO ═══',
        '<<<HUMAN_INPUT_START',
        human,
        'HUMAN_INPUT_END>>>',
        '',
        'INSTRUCCIONES DE CALIDAD:',
        '1. NO inventes datos. Si una sección no tiene base, marca "(sin información suficiente · pregunta al humano)".',
        '2. Lenguaje accionable, verbo activo, claridad operativa.',
        '3. Cada afirmación verificable debe poderse trazar a un dato del contexto inyectado o del input humano.',
        '4. Distingue claramente HECHOS · INFERENCIAS (con confianza %) · LAGUNAS.',
        '5. La sección 4 (DTD) es OBLIGATORIA y debe contener entre 3 y 7 criterios booleanos verificables.',
        '6. La sección 5 (Intangibles) debe explicitar qué decisiones NO puede tomar la IA · esto protege al humano de delegar lo que no debe.',
        '7. La sección 6 (Mind-as-Graph) debe proponer nodos KB explícitos como sugerencia · el humano valida y dispatcha.',
        '',
        'OUTPUT: SÓLO Markdown válido con esta estructura EXACTA (mantén los headings):',
        '',
        '# ' + c.woTitle,
        '> WO `' + c.woId + '` · proyecto `' + (c.projectId || 'none') + '` · SOP `' + (c.sopRef || 'none') + '` · rol `' + (c.role?.id || 'none') + '`',
        '> Generado por IA · {provider}/{model} · {timestamp}',
        '',
        '## 0 · Contexto inyectado (Chitta)',
        '- SOC(s): ' + (c.socRefs || []).join(', '),
        '- SOP de referencia: ' + (c.sopRef || 'none') + ' · steps: ' + c.sopSteps.length,
        '- Datos del humano: ' + human.length + ' chars',
        '',
        '## 1 · Síntesis (Buddhi · 3 frases máx)',
        '...',
        '',
        '## 2 · Diagnóstico estructurado',
        '- Hechos: ...',
        '- Inferencias (con % confianza): ...',
        '- Lagunas (preguntas para el humano): ...',
        '',
        '## 3 · Propuesta operativa',
        '...',
        '',
        '## 4 · DTD · test de aprobación',
        '- [ ] Criterio 1: ...',
        '- [ ] Criterio 2: ...',
        '- [ ] Criterio 3: ...',
        '',
        '## 5 · Intangibles humanos requeridos',
        '...',
        '',
        '## 6 · Mind-as-Graph · nodos a crear/actualizar',
        '- type=\'X\' id=\'Y\' content={...}',
        '',
        '## 7 · Tokens y coste',
        '(rellenado automáticamente · placeholder)',
    ].filter(Boolean).join('\n');
}

// ─── Orquestador · construye contexto, llama LLM, devuelve informe MD ──────
export async function generateWoAssistReport({ wo, humanInput, preferredEngine = 'anthropic' }) {
    if (!wo)         throw new Error('wo requerido');
    if (!humanInput) throw new Error('humanInput requerido');

    // 1. Cargar nodos auxiliares en paralelo desde KB
    await KB.init();
    const projectId = wo.projectId || wo.content?.projectId || null;
    const sopRef    = wo.content?.sopRef || null;

    const projectsState = (await import('./store.js')).store.getState().projects || [];
    const project = projectId ? projectsState.find(p => p.id === projectId) || null : null;

    let sopNode = null;
    if (sopRef && projectId) {
        const sops = await KB.query({ type: 'sop', projectId });
        sopNode = sops.find(s => s.id === sopRef) || null;
    }

    // 2. SOC(s) — usar resúmenes cortos del KB de TT
    const socRefs = ['teamtowers-brand'];
    const socNotes = [];
    for (const slug of socRefs) {
        try {
            const seed = await KnowledgeLoader.getSocSeed(slug);
            if (seed?.summary) socNotes.push('SOC ' + slug + ': ' + seed.summary);
        } catch (_) { /* SOC no encontrado · seguir */ }
    }

    // 3. Rol VNA del proyecto que coincida con el rol del SOP (si existe)
    let role = null;
    if (project && sopNode?.content?.role_ref) {
        const roleRef = sopNode.content.role_ref;
        role = (project.vna_roles || []).find(r => r.id === roleRef) || null;
    }

    // 4. Ensamblar contexto puro
    const woContext = assembleWoContext({ wo, project, sopNode, socNotes, role });

    // 5. Construir prompts y llamar LLM
    const userPrompt = buildWoAssistPrompt(woContext, humanInput);
    const systemPrompt = 'Eres el asistente IA del sistema TeamTowers SOS V11. Tu rol es ayudar a un humano que ejecuta una Work Order, aportándole un informe estructurado de alta calidad semántica que respeta los principios SOS. NUNCA inventas datos. Distingues siempre hechos / inferencias / lagunas. Tu output es Markdown puro · sin ```fences``` envolventes · sin texto introductorio antes del primer #.';

    const { Orchestrator } = await import('./Orchestrator.js?v=' + Date.now());
    const pruningOn = await Orchestrator.isContextPruningEnabled();
    const result = await Orchestrator.callLLM({
        preferredEngine,
        systemPrompt,
        userPrompt,
        responseFormat: 'text',  // queremos MD, no JSON
        temperature:    0.3,
        maxTokens:      8192,
        // KM-001 sprint E2 · pruner activo cuando el toggle global está ON.
        // Para una WO el contexto más rico viene de SOPs hermanos del mismo
        // proyecto + el rol VNA + transacciones del rol. La WO en sí ya
        // está embebida en el userPrompt vía buildWoAssistPrompt.
        contextPruning: pruningOn ? {
            enabled:   true,
            projectId: projectId,
            task: {
                projectId,
                sectorId: project?.sector_id || project?.based_on_sector,
                roleId:   role?.id,
                types:    ['sop', 'soc', 'role', 'transaction', 'work_order'],
            },
        } : null,
    });

    return {
        markdown:  result.content || '',
        provider:  result.telemetry?.provider || preferredEngine,
        model:     result.telemetry?.model    || preferredEngine,
        tokens:    result.telemetry?.tokens   || {},
        latencyMs: result.telemetry?.latencyMs || 0,
        woContext,
    };
}
