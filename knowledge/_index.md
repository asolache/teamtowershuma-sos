---
id: _index
type: index
version: "v11.1"
updated_at: "2025-04-10"
---

# Knowledge Base · SOS V11

Base de conocimiento de TeamTowers SOS. Tres capas: pública (sectores + roles + visión), cliente (modelos VNA guardados), swarm (prompts + skills).

---

## Sectores

Ficheros disponibles. KnowledgeLoader los carga por id CNAE o alias.

| ID | `sectors/X.md` | Nombre completo |
|----|----------------|-----------------|
| `A` | `sectors/A.md` | `Agricultura, Ganadería, Silvicultura y Pesca` |
| `B` | `sectors/B.md` | `Industrias Extractivas` |
| `C` | `sectors/C.md` | `Industria Manufacturera` |
| `D` | `sectors/D.md` | `Suministro de Energía Eléctrica, Gas y Vapor` |
| `E` | `sectors/E.md` | `Suministro de Agua, Saneamiento y Gestión de Residuos` |
| `F` | `sectors/F.md` | `Construcción` |
| `G` | `sectors/G.md` | `Comercio al por Mayor y Menor` |
| `H` | `sectors/H.md` | `Transporte y Almacenamiento` |
| `I` | `sectors/I.md` | `Hostelería y Turismo` |
| `J` | `sectors/J.md` | `Información y Comunicaciones` |
| `K` | `sectors/K.md` | `Tech / Software / IA` |
| `L` | `sectors/L.md` | `Actividades Financieras y de Seguros` |
| `M` | `sectors/M.md` | `Actividades Inmobiliarias` |
| `N` | `sectors/N.md` | `Consultoría / Actividades Profesionales` |
| `O` | `sectors/O.md` | `Administración Pública y Defensa` |
| `P` | `sectors/P.md` | `Educación Reglada (K-12)` |
| `Q` | `sectors/Q.md` | `Educación Superior y Formación` |
| `R` | `sectors/R.md` | `Salud y Servicios Sociales` |
| `S` | `sectors/S.md` | `Arte, Deporte, Cultura y Servicios Personales` |
| `T` | `sectors/T.md` | `Actividades de los Hogares como Empleadores` |
| `UV` | `sectors/UV.md` | `Organismos Extraterritoriales e Internacionales` |

---

## Visión

| Fichero | Contenido |
|---------|-----------|
| `vision/vna-principles.md` | Principios VNA — Verna Allee 2008. Base teórica de toda operación VNA en SOS. Incluir siempre en llamadas VNA. |
| `vision/mind-architecture.md` | Arquitectura cognitiva Vedanta aplicada al swarm. Incluir solo cuando se trabaje diseño de agentes. |
| `vision/sop-to-wo-model.md` | Modelo canónico VNA→SOC→SOP→WO→Ledger. Contrato de coherencia para H7.x (Kanban + auto-ejecución IA). |
| `vision/communities-of-practice-model.md` | Stub Ola 3: CoPs por rol VNA agrupables por ámbito (sector / dominio / folksonomía). |

---

## SOCs · Standard Operating Concepts

Conceptos invariantes (qué + por qué) de servicios, rituales y artefactos
de TeamTowers. Cada SOC es un nodo `type: soc` en KB. Ver `socs/_README.md`
para el esquema de frontmatter. El SOC raíz `soc-teamtowers-brand` aporta
contexto de marca heredable a todas las llamadas LLM.

| Fichero | Concepto |
|---------|----------|
| `socs/teamtowers-brand.md` | TeamTowers · marca raíz — 20+ años, 60k+ participantes, 150+ clientes, 10 valores castellers, portfolio (taller/demo/merch/consultoría). |
| `socs/soc-vna-network.md` | Red de valor (VNA) — concepto operativo raíz de cualquier proyecto SOS. |
| `socs/fent-pinya.md` | Taller experiencial Fent Pinya — taller participativo 2 h, hasta 1.000 pax, valores castellers. |
| `socs/castellers-demo.md` | Demos castelleras — espectáculo profesional no participativo, hasta 7 pisos, máx 4 castells por demo. |
| `socs/la-colla.md` | La Colla · proceso VNA — consultoría tipo Pantheon Work / Verna Allee, multi-sesión, mapeo de la red de valor del cliente. |
| `socs/teamtowers-merchandising.md` | Merchandising TeamTowers — pañuelos y faixas personalizables, upsell del evento. |
| `socs/proyecto-custom.md` | Proyectos a medida — 5 variantes (escuela, gymkana, demo participativa, combinación, presupuesto ajustado). |
| `socs/charla-conferencia.md` | Charla teatralizada 30-60 min con pre-trabajo consultivo + arte vivo opcional (clown, beatboxer, actor, músico). |

---

## SOPs · Standard Operating Procedures

Procedimientos repetibles (cómo) que materializan los SOCs. Cada SOP es un
nodo `type: sop` en KB y referencia un `soc_ref`. Ver `sops/_README.md`.

| Fichero | Procedimiento | SOC ref |
|---------|---------------|---------|
| `sops/fent-pinya-taller.md` | Taller Fent Pinya base, 2 h core (+30 min reflex opcional), 10-1.000 pax, guion 8 pasos. | `soc-fent-pinya` |
| `sops/castellers-demo.md` | Demo castellera, 30-45 min, 4-7 pisos, máx 4 castells por demo. | `soc-castellers-demo` |
| `sops/la-colla.md` | Proceso VNA multi-sesión (3-12 sem), 7 pasos Allee/Pantheon + bola extra, zoom por área/servicio/proceso. | `soc-la-colla` |
| `sops/teamtowers-merchandising.md` | Pedidos de merchandising castellero personalizable, plazo 3-7 semanas. | `soc-teamtowers-merchandising` |
| `sops/proyecto-custom.md` | 5 variantes de custom (escuela, gymkana, demo-participativa, combinación, económico) + ciclo de promoción a SOP estándar. | `soc-proyecto-custom` |
| `sops/charla-conferencia.md` | Charla teatralizada · 3 fases (A pre-trabajo / B speech / C follow-up) · arte vivo opcional. | `soc-charla-conferencia` |

---

## Clientes

Modelos VNA guardados por cliente. Formato: `clients/{client_id}/vna-model.md`

Estructura de cada modelo:
- YAML frontmatter con `project_name`, `client_id`, `sector_id`, `roles[]`, `transactions[]`
- Cuerpo MD con notas del proyecto
- Reutilizable para sedes, franquicias y proyectos derivados

---

## Schema canónico de sector

Cada `sectors/X.md` sigue este schema YAML frontmatter + cuerpo MD:

```yaml
sector_id: X
sector_name: "Nombre completo"
cnae: X
version: "v11.1"
tags: [tag1, tag2]

roles:
  - id: kebab-case-unico
    name: "Nombre de la actividad"
    description: "Qué hace en el flujo de valor"
    castell_level: pinya | tronc | pom_de_dalt
    fmv_usd_h: null
    typical_actor: "quién suele ocuparlo"
    tags: [tag1, tag2]

transactions:
  - id: tx-kebab-case
    from: id-rol-origen
    to: id-rol-destino
    deliverable: "Qué se entrega"
    type: tangible | intangible
    is_must: true | false
    frequency: alta | media | baja
    health_hint: "Señal si esta tx falla"

patterns:
  - name: "Nombre del patrón de disfunción"
    description: "Qué significa"
    signal: "Cómo detectarlo en el mapa"