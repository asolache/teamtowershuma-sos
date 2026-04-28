---
id: vision-sop-to-wo-model
type: vision
version: v1
status: approved
author: "@alvaro"
purpose: "Modelo canónico de conversión Mind-as-Graph: VNA → SOC → SOP → WORK ORDER → DELIVERABLE → LEDGER ENTRY. Sirve como contrato de coherencia entre todas las capas del SOS y como guía para que cualquier IA que opere en el sistema sepa cómo descomponer conocimiento operativo en tareas ejecutables."
keywords: [mind-as-graph, vna, soc, sop, work-order, ledger, dtd, antigravity, swarm-operative-system]
sos_context: critical
---

# Modelo VNA → SOC → SOP → WO → Ledger

> Tesis: en SOS V11 todo conocimiento operativo es **ejecutable**.
> El grafo Mind-as-Graph no almacena ideas — almacena **trabajo
> latente** que puede ser desplegado por humanos o IAs bajo el
> contrato SOC + SOP + DTD.

---

## La cadena de conversión

```
VNA (red de valor)
   └─ SOC (qué/por qué de un servicio o capacidad)
         └─ SOP (cómo · agenda fase a fase)
               └─ WORK ORDER (un paso ejecutable)
                     └─ DELIVERABLE (lo que produce esa WO)
                           └─ LEDGER ENTRY (valor económico contabilizado)
                                 └─ SIGNED ARTIFACT (firma + export inmutable)
```

Cada nivel es **un nodo del KB** con `type` propio. La cadena se navega
por referencias cruzadas (`soc_ref`, `sop_ref`, `workshopId`, `sopRef`,
`workOrderId`, `ledgerEntryId`).

---

## Capa 1 · VNA (red de valor)

- `vna_role` · una actividad real, no un cargo.
- `vna_transaction` · flujo direccional MUST (tangible) o EXTRA (intangible).
- `pattern` · disfunción detectada en la red.

**Aporta a la WO**: contexto sistémico — *quién* hace qué *para quién* y
*por qué* tiene valor en la red. Una WO sin red de valor referenciable
queda como tarea aislada (válida pero sin contexto Mind-as-Graph).

---

## Capa 2 · SOC (Standard Operating Concept)

- `type: soc` en `knowledge/socs/{slug}.md`.
- Define **qué es** y **por qué existe** una capacidad.
- Inmutable mientras el propósito no cambie.

**Aporta a la WO**: vocabulario común, principios irrenunciables,
outcomes esperables. La IA recibe el SOC en su contexto para no
inventar metodología fuera del invariante.

Ejemplos vivos:
- `soc-teamtowers-brand` (raíz de marca, heredado por todos)
- `soc-fent-pinya`, `soc-castellers-demo`, `soc-la-colla`, etc.

---

## Capa 3 · SOP (Standard Operating Procedure)

- `type: sop` en `knowledge/sops/{slug}.md`.
- Define **cómo** se ejecuta el SOC asociado.
- Estructura recomendada del frontmatter para que sea
  *convertible-en-WOs*:

```yaml
---
id: sop-{slug}
soc_ref: soc-{slug}
duration_minutes: int
audience: [ ... ]
deliverables: [ ... ]
# Pasos estructurados (clave para auto-WO)
steps:
  - id: paso-{n}
    label: "Nombre del paso"
    duration_minutes: int
    role:                        # quién lo ejecuta típicamente
      kind: human | ai | mixed
      profile: "facilitador | participante | agente_ia | ..."
    deliverable_kind: "..."      # ej. lista-roles, mapa-vna, propuesta
    approval_rule: manual | tdd-auto
    inputs:                      # qué se necesita
      - "..."
    outputs:                     # qué produce
      - "..."
    tdd_check: "..."             # opcional, expresión booleana evaluable
---
```

> Nota: los SOPs actuales usan agendas narrativas en MD. La capa
> `steps:` del frontmatter es **opcional** y *progresiva* — empieza
> manual y se va estructurando cuando un SOP demuestra que se
> ejecuta repetidamente y merece automatización.

---

## Capa 4 · WORK ORDER (la unidad de trabajo)

- `type: work_order` en KB.
- Cada WO **encarna un paso** del SOP en un proyecto concreto.
- Cuatro estados (Kanban): `backlog → doing → done → ledgered`.

### Forma canónica de una WO

```js
{
    id: 'wo-...',
    type: 'work_order',
    projectId: 'proj-cliente-x' | null,
    content: {
        // qué hace
        title: '...',
        description: '...',
        // de dónde viene
        sopRef:  'sop-fent-pinya-taller' | null,
        stepRef: 'paso-2-pinya'          | null,  // referencia al step del SOP
        socRefs: ['soc-fent-pinya', 'soc-teamtowers-brand'],
        workshopId: 'ws-...' | null,
        // quién la ejecuta
        assignee: {
            kind:   'human' | 'ai',
            id:     '@alvaro' | 'anthropic' | ...,
            engine: 'anthropic' | 'openai' | 'deepseek' | 'gemini' | null,
        },
        // cómo se aprueba
        approvalRule: 'manual' | 'tdd-auto',
        tddCheck:     '...código...' | null,
        // estimación y realidad
        estimatedHours: 1.5,
        fmvPerHour:     50,
        actualHours:    null,
        tokensIn:       null,    // si IA
        tokensOut:      null,    // si IA
        // estado
        status: 'backlog' | 'doing' | 'done' | 'ledgered',
        priority: 'low' | 'med' | 'high',
        // output
        aiOutput:    null,     // contenido producido por la IA
        deliverableId: null,   // id del nodo deliverable resultante
        // contabilización
        ledgerEntryId:    null,
        ledgerProjectId:  null,
        humanCostEur:     null,
        aiCostEur:        null,
        savingEur:        null,
    },
    keywords: ['work_order', sopRef, kind],
}
```

### Reglas de generación de WOs desde un SOP

1. **Por paso explícito** (cuando el SOP tiene `steps:` en frontmatter):
   cada paso → 1 WO. El `step.role.kind` determina el `assignee.kind`
   por defecto. El `step.approval_rule` determina `approvalRule`.
2. **Manual** (cuando el SOP es narrativo): el operador crea WOs a
   mano desde la vista Kanban. Conserva `sopRef` para trazabilidad.
3. **Híbrida**: el SOS sugiere WOs derivadas del cuerpo MD del SOP
   pero requiere que el operador confirme. (Futuro: H7.3.)

### Reglas de ejecución por la IA (H7.2)

Una WO con `assignee.kind === 'ai'` puede ejecutarse automáticamente
si:

- Tiene `engine` válido y API key configurada en `/settings`.
- El `KnowledgeLoader` puede construir contexto con sus `socRefs` y
  `sopRef`.
- El humano operador pulsa **▶ Ejecutar con IA** en la WO (en `backlog`
  o `doing`). Esto lanza `Orchestrator.callLLM` con:
  - `systemPrompt`: contexto rico (SOCs + SOP + projectId + tarea).
  - `userPrompt`: builder canónico — título de la WO + descripción +
    referencia al paso + restricciones explícitas (no inventar,
    respetar SOC, máximo de palabras según `step.deliverable_kind`).
- Al terminar, se capturan `tokens_in/out` y `latencyMs` del telemetry
  y se actualizan en la WO. La WO transiciona automáticamente a
  `status: 'done'`.

### Reglas de aprobación (DTD · Deliverable Test Driven)

| `approvalRule` | Qué pasa al transicionar `done → ledgered` |
|---|---|
| `manual` | Humano operador revisa el `aiOutput` y pulsa "Aprobar". |
| `tdd-auto` | Si `tddCheck` evalúa `true` → ledger automático. Si `false` → vuelve a `backlog` con `tddFailed: true` para revisión humana. |

> El `tddCheck` puede ser una función pura JS, una llamada a una
> API local, o un test booleano sobre el `aiOutput` (ej. *"contiene
> al menos 6 secciones h2"*). H7.4 desarrollará el sandbox seguro
> para evaluar `tddChecks` sin riesgo de eval.

---

## Capa 5 · DELIVERABLE

- `type: deliverable` con `kind: 'proposal' | 'post-workshop-report' |
  'vna-final-report' | 'merch-quotation' | etc.`
- Producido por una WO (relación 1:1 o 1:N — una WO puede generar
  varios deliverables menores).
- Conserva `socRefs[]`, `sopRefs[]`, `sources[]` para trazabilidad.

---

## Capa 6 · LEDGER ENTRY

- `type: ledger_entry` (vive como elemento de `project.ledger[]` en
  el store actual; futuro nodo first-class).
- Genera la **contabilidad de valor** de la cadena:
  - Si `assignee.kind === 'human'`: `slices = realHours × fmv ×
    multiplier`.
  - Si `assignee.kind === 'ai'`: incluye `aiCostReal` y `savingEur`
    (= `humanCostEstimated - aiCostReal`).
- Triple-entrada futura (BACK-003): cada entry firmada localmente
  ahora; futuro hash anclado en blockchain (Gnosis preferida).

---

## Capa 7 · SIGNED ARTIFACT

- `type: signed_artifact` (ECDSA P-256 implementado en H1.3).
- Snapshot inmutable del proyecto entero, exportable y verificable.
- Futuro (BACK-004): ancla en Arweave/Permaweb para soberanía
  permanente.

---

## Implicaciones para la IA del SOS

Cuando una IA interactúa con SOS, debe **respetar la cadena**:

1. Antes de generar contenido, **leer** los SOCs/SOPs relevantes via
   `KnowledgeLoader.buildContext({ socs, sops, projectId })`.
2. **No inventar** estructura fuera del SOC. Si falta información,
   marcar `[pendiente]` o `[REVISAR @alvaro]`.
3. Al producir output, **declarar fuentes** (`sources[]` con paths).
4. Si la WO tiene `tddCheck`, el output debe estar construido para
   pasarlo (cuando posible).
5. Toda contribución alimenta el grafo Mind-as-Graph del proyecto:
   no se pierde información, todo es nodo enlazado.

---

## Conexión con Comunidades de Práctica (Ola 3)

Los **roles VNA** de un proyecto pueden agruparse en **comunidades de
práctica** con su propio ámbito (sector / dominio / folksonomía). Las
CoPs proveen otra fuente de SOPs validados por la comunidad — una
biblioteca compartida de procedimientos que se incorpora al
KnowledgeLoader como capa adicional.

Ver `knowledge/vision/communities-of-practice-model.md`.

---

*Documento de visión v1 · base para H7.2, H7.3, H7.4 y la futura
auto-orquestación de swarms IA en proyectos cliente.*
