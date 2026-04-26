---
id: soc-vna-network
type: soc
version: v1
status: draft
author: "@alvaro"
purpose: "Definir la red de valor (VNA) como objeto operativo central de TeamTowers: un grafo distribuido de roles que intercambian entregables tangibles e intangibles para lograr un propósito compartido."
outcomes:
  - "Cualquier proyecto SOS arranca con un mapa VNA explícito (roles + transacciones + propósito)."
  - "Tangibles e intangibles se modelan con la misma dignidad — los intangibles no son decoración."
  - "El grafo VNA es la fuente de verdad para todas las vistas del SOS (canvas, ledger, kanban, página pública, Obsidian-view)."
  - "Cada cliente puede reutilizar su mapa VNA para sedes, franquicias o proyectos derivados."
related_socs: [soc-fent-pinya]
related_sops: []
keywords: [vna, value-network, verna-allee, roles, transacciones, intangibles, tangibles, mapa-de-valor, mind-as-graph]
sos_context: critical
source_doc: vision/vna-principles.md
---

# VNA · Red de Valor · Concepto operativo

> Fuente teórica: Verna Allee, *Value Network Analysis and value conversion of
> tangible and intangible assets*, Journal of Intellectual Capital, 2008.
> Documento detallado: `vision/vna-principles.md`.

---

## Por qué existe

Los organigramas describen cargos jerárquicos pero **no describen valor**. El
valor real fluye por *transacciones* entre *roles* — y la mayor parte de esas
transacciones son **intangibles** (conocimiento, confianza, reputación, favores).
Las herramientas tradicionales (procesos, KPIs, BSC) sólo capturan tangibles, lo
que produce organizaciones que optimizan lo medible y degradan lo intangible.

VNA propone una alternativa: modelar la organización como una **red de roles e
intercambios**, donde cada rol es una *actividad* (no un puesto) y cada
transacción tiene tipo (tangible/intangible) y entregable explícito.

## Qué es una red de valor

Tres elementos canónicos:

1. **Roles** — actividades en el flujo de valor. Una persona puede tener varios.
2. **Transacciones** — flujos direccionales de un rol a otro. Tangible o intangible.
3. **Entregables** — el "qué" se mueve en cada transacción.

Reglas de oro:
- Sin nodo central obligatorio. El grafo es distribuido.
- Toda transacción tangible (sólida) suele ir acompañada de una intangible (punteada).
- La salud de la red emerge de la reciprocidad de intercambios, no de un score individual.
- El propósito y los valores compartidos se revelan en el patrón global, no en un manifiesto.

## Cómo se vive en SOS V11

Cada proyecto SOS tiene un mapa VNA explícito:

- Roles → nodos `vna_role` en KB (heredados de un sector CNAE o creados ad hoc).
- Transacciones → nodos `vna_transaction` con `category: tangible | intangible`.
- Patrones de disfunción → nodos `pattern` (cuellos de botella, callejones sin salida).

El mapa es:
- **Editable** desde `/map` (vista D3 con ego-view, edición, FMV).
- **Auditable** vía health score y análisis de intercambios (Verna Allee §7).
- **Reutilizable** como template para clientes derivados (franquicias, sedes).
- **Publicable** como página pública del proyecto (ver futuro `soc-public-project-page`).

## Conexión con Mind-as-Graph

VNA es la **vista canónica** del grafo único del proyecto, pero no la única:
- Misma KB → vistas distintas (canvas D3, kanban, ledger, Obsidian-view).
- Cualquier feature nueva escribe nodos al mismo grafo, no crea silos.
- La IA del SOS hereda este grafo completo en cada llamada (Context-First).

## Cuándo usarlo

- Siempre. Es el SOC raíz de cualquier proyecto SOS.
- Casos típicos: nueva organización, transformación, post-fusión, diseño de propósito,
  preparación de incubadora (Matrix), franquicia de formación.

## Cuándo NO basta

- Cuando hay que ejecutar procesos con SLAs estrictos → complementa con BPM.
- Cuando hay que dimensionar carga de personas → complementa con Org Network Analysis.
- Cuando hay que diseñar arquitectura técnica → VNA modela personas/equipos, no APIs.

VNA no compite con esas herramientas; las precede y orquesta.

## Principios irrenunciables

1. **Roles ≠ puestos** — un rol es una actividad, no un cargo.
2. **Intangibles primero** — la confianza precede al contrato.
3. **Reciprocidad** — un rol que sólo da o sólo recibe está enfermo.
4. **Propósito emergente** — no se decreta; se revela en el patrón.
5. **Antifragilidad** — el grafo sobrevive al cambio de un nodo.

---

*Stub v1 — destilado de `vision/vna-principles.md`. Profundizar conforme*
*la práctica del SOS revele matices propios de TeamTowers.*
