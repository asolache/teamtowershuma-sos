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
| `N` | `sectors/N.md` | `Consultoría / Actividades Profesionales` |
| `K` | `sectors/K.md` | `Tech / Software / IA` |
| `Q` | `sectors/Q.md` | `Educación` |
| `F` | `sectors/F.md` | `Construcción` |
| `R` | `sectors/R.md` | `Salud y Servicios Sociales` |

Sectores Tier 2 (pendientes — KnowledgeLoader los infiere desde la IA si no existen):
`A` Agricultura · `B` Extractivas · `C` Manufactura · `D` Energía · `E` Agua/Medioambiente · `G` Comercio · `H` Transporte · `I` Hostelería · `J` Media · `L` Finanzas · `M` Inmobiliaria · `O` Servicios administrativos · `P` Administración pública · `S` Entretenimiento · `T` Otros servicios · `UV` Hogares/Extraterritoriales

---

## Visión

| Fichero | Contenido |
|---------|-----------|
| `vision/vna-principles.md` | Principios VNA — Verna Allee 2008. Base teórica de toda operación VNA en SOS. Incluir siempre en llamadas VNA. |
| `vision/mind-architecture.md` | Arquitectura cognitiva Vedanta aplicada al swarm. Incluir solo cuando se trabaje diseño de agentes. |

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
```

Reglas del schema:
- `fmv_usd_h: null` siempre en seeds — editable por el usuario en el canvas
- `castell_level` mapea a UI: `pinya` = Base operativa · `tronc` = Núcleo de valor · `pom_de_dalt` = Cúspide estratégica
- Todo rol necesita al menos 1 transacción entrante y 1 saliente para health score verde
- Tangible = contractual (línea sólida verde en canvas) · Intangible = informal (línea punteada dorada)

---

## Instrucciones para la IA

Cuando KnowledgeLoader inyecta este índice en el contexto:

1. Si el sector del proyecto coincide con un fichero Tier 1, úsalo como base de roles y transacciones
2. Si el sector es Tier 2 (no existe fichero), infiere roles desde conocimiento propio siguiendo el schema canónico
3. `fmv_usd_h` nunca lo rellenes — lo define el usuario
4. `open_question: null` por defecto — solo preguntar en bifurcaciones estratégicas reales
5. Mínimo 6 roles por mapa generado, mínimo 2 por nivel castellero
6. Todo rol generado debe tener al menos 1 transacción entrante y 1 saliente
