---
id: vision-h110-sector-evolution
type: vision
version: v0.1
status: draft
author: "@alvaro"
purpose: "Perfilar H1.10 dentro del marco completo Mind-as-Graph: clonación sector→cliente, evolución del VNA cliente hacia SOPs y WOs ejecutables, vista grafo total del proyecto con anidación SOC/SOP/role/skill, y skills de usuario asociadas a roles para Comunidades de Práctica."
keywords: [h110, clonacion-sector, vna-evolution, mind-graph, skills, cop, antigravity, swarm-operative-system]
sos_context: critical
---

# H1.10 · Sector → Cliente → SOPs → WOs · Mind-Graph total y skills

> Documento de perfilado. Antes de codificar H1.10 conviene fijar
> alcance, fronteras y las 3 capas que la rodean para no implementar
> en silo.

---

## 1 · La cadena completa Antigravity aplicada a cliente

Hoy tenemos los 22 sectores CNAE como **plantillas genéricas**. La
visión final es que cada cliente recorra esta cadena:

```
Sector seed (CNAE)              ← genérico, 22 plantillas
   ↓ H1.10 fase 1
Cliente VNA model               ← 1 por cliente (cloneado + personalizado por LLM)
   ↓ H1.10 fase 2 (futura)
Cliente SOPs específicos        ← procedimientos para los roles del cliente
   ↓ H7.3 (ya hecho)
Cliente WOs ejecutables         ← humanos | IA
   ↓ H7.2 (ya hecho)
Deliverables firmados           ← outputs con coste real
   ↓ Ledger auto
Valor económico + ahorro IA contabilizados
```

**La cadena completa = Antigravity aplicado a cualquier cliente, no
sólo a TeamTowers.** Esto es el modelo de negocio "SOS para clientes":
cada cliente trae su contexto, SOS le entrega su mapa VNA + SOPs + WOs
con automatización progresiva.

---

## 2 · H1.10 fase 1 · Clonación sector → cliente

Alcance mínimo viable:

### Input
- Sector base (1 de los 22 CNAE).
- Descripción libre del cliente (`clientName`, `clientDescription`,
  opcional `audienceSize`, `sector` adicional).

### Proceso
1. `KnowledgeLoader.getSectorSeed(sectorId)` → roles + transactions +
   patterns base.
2. `KnowledgeLoader.buildContext({ sector, freeText, socs:
   ['teamtowers-brand'] })` → contexto rico para el LLM.
3. `Orchestrator.callLLM` con un prompt canónico (ver fase 2 abajo)
   que pide al LLM **personalizar** los roles del sector base al
   contexto del cliente:
   - `name` → nombres específicos ("Vendedor de servicios" → "Vendedor
     senior B2B IKEA Madrid").
   - `description` → contextualizada.
   - `typical_actor` → ajustado al sector concreto del cliente.
   - `tags` → enriquecidos.
   - Mismas IDs estables para que la trazabilidad sector→cliente sea
     diferenciable visualmente.
4. Validación contra criterio TDD del KB (`_computeSectorReadiness`):
   el output debe alcanzar al menos `solid`. Si no, vuelve a backlog
   para revisión humana.
5. Persistencia como `clients/{client_id}/vna-model.md` (formato igual
   al sector seed para que el `KnowledgeLoader.getClientSeed` lo lea).

### Output
- Mapa VNA cliente firmado (artefacto inmutable).
- Trazabilidad: qué cambió respecto al sector base.
- Reutilizable para sedes y franquicias.

### Decisiones pendientes (para perfilar con @alvaro)
- ¿Auto-crear un nuevo `project` al clonar, o asociarlo a uno existente?
- ¿Cuántos roles personalizar por defecto? (10 base + N adicionales
  emergidos del contexto del cliente)
- ¿Incluir auto-clonación de transacciones también, o sólo roles
  primero?
- ¿UI: botón en `/dashboard` o en `/map` o en ambos?

---

## 3 · H1.10 fase 2 (futura) · Evolución VNA cliente → SOPs específicos

Idea: una vez el cliente tiene su mapa VNA, **cada rol cliente** puede
generar **un SOP específico** (cómo se ejecuta ese rol en su contexto).

Cadena conceptual:

```
vna_role (cliente)
   ↓ "describe procedimiento"
sop específico del rol (cliente)
   ↓ H7.3 auto-gen (ya implementado)
work_orders ejecutables
   ↓ H7.2 auto-ejecución IA
deliverables + ledger
```

Esto convierte el VNA en algo no sólo descriptivo sino **operativo**:
puedes lanzar un proyecto y arrancar inmediatamente con WOs reales.

Implementación sugerida (Ola 3+):
- En `/map` (ValueMap), botón por rol "📋 Generar SOP".
- WO IA con prompt canónico que produce un SOP estructurado con
  `steps:` (compatible con H7.3 ya hecho).
- Output guardado en `knowledge/sops/clients/{client_id}/{role_id}.md`.

---

## 4 · Mind-Graph total · vista grafo de TODO el conocimiento

Visión: una vista `/mind` (o `/graph`) que renderiza **todos los nodos
KB del proyecto activo** como grafo unificado, con anidación visual
de conceptos.

### Tipos de nodos en el grafo (todos ya en KB)

```
TIPO PADRE             TIPO HIJO (anidado)
soc                    →  outcomes, principles, related_socs
sop                    →  steps[], deliverables[], soc_ref
vna_role               →  transactions out/in, sop específicos
vna_transaction        →  deliverable, satisfaction
work_order             →  deliverable producido, ledger entry
deliverable            →  signed_artifact
skill_node             →  rol VNA al que apunta
ledger_entry           →  work_order, project
```

### Visualización (Ola 3+)
- D3 force-directed con render progresivo (espíritu Obsidian).
- Hover sobre un SOP → muestra sus `steps[]` como sub-grafo.
- Click sobre un rol → muestra todas sus transacciones + SOPs + skills.
- Filtros por tipo, por proyecto, por rol VNA.
- Modo "ego-view": centrarse en un nodo y mostrar sus 2 saltos.

Backlog ID: **H8.1** (Obsidian-view, ya anotada).

---

## 5 · Skills · puente entre usuario, rol VNA y CoP

Cuando SOS evolucione a app online con usuarios persistentes (Ola 3+),
cada usuario acumulará un perfil de **skills** que conecta tres
dimensiones:

```
USUARIO
  ↓ ha demostrado
SKILL  (type: 'skill_node')
  ↓ es competencia para
ROL VNA (universal · ej. "músic", "acotxador", "definidor de problema")
  ↓ se ejecuta en
SOP específico
  ↓ produce
DELIVERABLE firmado
```

### Forma del skill_node (canon propuesto)

```js
{
    id: 'skill-{userId}-{role}-{nonce}',
    type: 'skill_node',
    projectId: null,           // skills viven a nivel usuario, no proyecto
    content: {
        userId:        '@alvaro',
        roleRef:       'role-acotxador',     // rol VNA universal
        socRefs:       ['soc-fent-pinya'],
        sopRefs:       ['sop-fent-pinya-taller'],
        deliverables:  ['del-...', 'del-...'],   // evidencia
        level:         'novice|practitioner|expert',
        validatedBy:   ['@cop-acotxadors-construccion'],   // CoP que valida
        sinceAt:       1700000000000,
    },
    keywords: ['skill', 'acotxador', 'fent-pinya'],
}
```

### Beneficios cuando esto vive

1. **Matchmaking estilo 43things**: encontrar gente con la misma skill
   trabajando en otros sectores.
2. **CoPs por rol**: la CoP de "acotxadors invisibles" agrupa a los
   usuarios con esa skill y valida sus SOPs.
3. **Soulbound tokens (BACK-005)**: cada skill demostrada se puede
   tokenizar como NFT/SBT no transferible — credencial portable.
4. **Tarifa dinámica**: una skill "expert" en un rol implica un FMV
   superior automático en la propuesta IA.

### Conexión con CoPs (`vision/communities-of-practice-model.md`)

Una CoP es una **agrupación de skill_nodes** del mismo `roleRef`,
filtrable por ámbito (sector / dominio / folksonomía). Cuando alguien
publica un SOP, la CoP del `roleRef` correspondiente puede revisarlo
y firmarlo. SOPs aprobados por CoP tienen prioridad en el
KnowledgeLoader cuando hay duplicados.

Backlog ID: **H9.x** (CoPs online).

---

## 6 · Cómo se entrelazan las 4 ideas

```
┌─────────────────────────────────────────────────────┐
│        MIND-GRAPH TOTAL (vista /mind)               │
│  ┌────────────┐   ┌─────────────┐   ┌──────────┐    │
│  │ SECTORES   │ → │ CLIENTE VNA │ → │  SOPs    │    │
│  │ (22 CNAE)  │   │ (cloneado)  │   │ (gen IA) │    │
│  └────────────┘   └─────────────┘   └──────────┘    │
│         ↓ H1.10 fase 1     ↓               ↓        │
│         ↓                  ↓               ↓        │
│  ┌────────────┐   ┌─────────────┐   ┌──────────┐    │
│  │   SOCs     │   │   ROLES     │ ← │  WORK    │    │
│  │ irrenunc.  │   │ universales │   │  ORDERS  │    │
│  └────────────┘   └─────────────┘   └──────────┘    │
│                          ↑                ↓        │
│                          │           DELIVERABLES   │
│                   ┌─────────────┐         ↓         │
│                   │   SKILLS    │       LEDGER      │
│                   │ por usuario │                   │
│                   └─────────────┘                   │
│                          ↑                          │
│                   ┌─────────────┐                   │
│                   │     CoPs    │                   │
│                   │ (agrupador) │                   │
│                   └─────────────┘                   │
└─────────────────────────────────────────────────────┘
```

H1.10 fase 1 es **la primera flecha**. El resto son hitos siguientes
en el backlog que ya están parcialmente cubiertos:

- Roles universales · pendiente catalogación cuando aparezcan
  recurrencias entre clientes.
- Skills · pendiente Ola 3 (online).
- CoPs · pendiente Ola 3 (`vision/communities-of-practice-model.md`).
- Mind-Graph view · pendiente H8.1 (Obsidian-view).

---

## 7 · Preguntas abiertas para perfilar H1.10 fase 1

Antes de codificar, fijemos:

1. **Activación**: ¿botón en `/dashboard` (al crear proyecto) o en
   `/map` (vista del sector base)?
2. **Auto-creación de proyecto**: ¿el resultado crea un nuevo
   `project` automáticamente, o sólo persiste el `clients/{id}/...md`
   y deja la creación de proyecto al operador?
3. **Profundidad de la clonación**: ¿sólo roles, o también
   transacciones y patterns? ¿Cuántos roles añadir como "emergentes
   del contexto" además de los del sector base?
4. **Validación del output**: ¿bloqueamos el guardado si no alcanza
   `_computeSectorReadiness === 'solid'`? ¿O permitimos guardar y
   marcar como `draft`?
5. **Reutilización entre sedes**: ¿la UI permite "esta misma plantilla
   para otra sede" desde el inicio, o eso es feature posterior?
6. **Modelo tokenómico al crear el proyecto cliente**: ¿le pedimos al
   operador que elija ya en este momento `consolidada | startup |
   fundacion` (BACK-007), o lo dejamos para después?

Mi recomendación de alcance MVP H1.10 fase 1:

- Activación: botón en `/dashboard` (junto a "+ New Project").
- Auto-crea proyecto + persiste `clients/{id}/vna-model.md`.
- Clonación completa: roles + transactions + patterns.
- Permite output `solid` o superior; si baja → vuelve a edición humana.
- Reutilización entre sedes: feature de Ola 3+.
- Modelo tokenómico: feature de Ola 3+ (BACK-007).

---

*Documento de visión H1.10 v0.1 · pendiente confirmar alcance con*
*@alvaro antes de implementar fase 1.*
