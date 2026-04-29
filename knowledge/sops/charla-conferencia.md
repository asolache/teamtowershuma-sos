---
id: sop-charla-conferencia
type: sop
soc_ref: soc-charla-conferencia
brand_ref: soc-teamtowers-brand
version: v1
status: draft
author: "@alvaro"
duration_minutes: 45   # 30-60 típico, 45 mediana en sala
audience: ["congresos", "escuelas-negocio", "comunidades-practica", "eventos-sectoriales", "eventos-publicos", "festivales"]
group_size_min: 30
group_size_max: 1000
languages: ["castellano", "catalán", "inglés", "alemán", "francés"]
prerequisites:
  - "Reunión con sponsor para fijar objetivos formativos (mínimo 2 semanas antes)."
  - "Pre-selección de 3-5 valores castellers / competencias VNA a transmitir."
  - "Mini-VNA borrador del cliente (1-2 h o 3-5 entrevistas breves)."
  - "Definición del público objetivo y composición."
  - "Decisión sobre arte vivo (clown / beatboxer / actor / músico tradicional)."
materials:
  - "Slides + recursos visuales (logo TeamTowers + co-branding cliente)"
  - "Sistema de sonido + microfonía"
  - "Vídeos castelleros breves para puntuar el guion"
  - "Faixa castellera (vestuario simbólico para el ponente)"
  - "Material de mini-VNA borrador (impreso o digital, anonimizable)"
deliverables:
  - "Acta de objetivos formativos firmada por sponsor"
  - "Mini-VNA borrador del cliente"
  - "Guion teatralizado v final"
  - "Speech impartido (audio + vídeo si autoriza el cliente)"
  - "Lista de leads cualificados post-charla"
team:
  ponente: 1
  artista_invitado: "0-1 (clown / beatboxer / actor / músico tradicional)"
  asistente_av: "1 si el evento es >300 pax o requiere streaming"
keywords: [charla, keynote, conferencia, ponencia, speech, teatralizado, clown, beatboxer, actor, músico]
fmv_eur_h: null   # Tarifa por charla + suplementos por arte vivo. NO incluir en outputs MD.
geographic_scope: "Estándar Barcelona/Madrid <2h; resto España/Europa con suplementos; internacional para premium"

# H7.3 · Pasos canónicos
steps:
  - id: fase-a1-objetivos
    label: "Sesión con sponsor · objetivos formativos"
    duration_minutes: 60
    role_kind: human
    role_profile: ponente
    deliverable_kind: acta-objetivos
    approval_rule: manual
    priority: high
  - id: fase-a2-valores
    label: "Pre-selección de 3-5 valores y competencias"
    duration_minutes: 45
    role_kind: human
    role_profile: ponente
    deliverable_kind: lista-valores-pre
    approval_rule: manual
    priority: high
  - id: fase-a3-mini-vna
    label: "Mini-VNA borrador del cliente (1-2h o entrevistas)"
    duration_minutes: 90
    role_kind: human
    role_profile: ponente
    deliverable_kind: mini-vna-cliente
    approval_rule: manual
    priority: high
  - id: fase-a4-audiencia
    label: "Identificación de público objetivo y perfiles"
    duration_minutes: 30
    role_kind: human
    role_profile: ponente
    deliverable_kind: ficha-audiencia
    approval_rule: manual
    priority: med
  - id: fase-a5-decisor-arte
    label: "Decisión arte vivo (clown / beatboxer / actor / músico)"
    duration_minutes: 30
    role_kind: human
    role_profile: ponente
    deliverable_kind: contrato-artista
    approval_rule: manual
    priority: med
  - id: fase-a6-guion
    label: "Construcción del guion teatralizado"
    duration_minutes: 240
    role_kind: human
    role_profile: ponente
    deliverable_kind: guion-final
    approval_rule: manual
    priority: high
  - id: fase-a7-borrador-ia
    label: "Borrador IA de speech con SOC+SOP+mini-VNA"
    duration_minutes: 30
    role_kind: ai
    role_profile: agente_anthropic
    deliverable_kind: speech-borrador
    approval_rule: manual
    priority: med
  - id: fase-b-charla
    label: "Speech en sala (30-60 min)"
    duration_minutes: 45
    role_kind: human
    role_profile: ponente
    deliverable_kind: speech-impartido
    approval_rule: manual
    priority: high
  - id: fase-c1-leads
    label: "Recolección de leads cualificados"
    duration_minutes: 60
    role_kind: human
    role_profile: ponente
    deliverable_kind: lista-leads
    approval_rule: manual
    priority: high
  - id: fase-c2-followup
    label: "Follow-up comercial · propuestas Fent Pinya / La Colla"
    duration_minutes: 120
    role_kind: human
    role_profile: comercial
    deliverable_kind: propuestas-derivadas
    approval_rule: manual
    priority: med
---

# Charla / Conferencia · SOP v1

> Procedimiento estándar para entregar el speech corporativo
> teatralizado de TeamTowers. Tres fases: A pre-trabajo consultivo,
> B speech en sala, C follow-up comercial.

---

## Fase A · Pre-trabajo consultivo (mínimo 2 semanas antes)

Sin esta fase la charla **degrada a keynote genérica**. Es la
diferencia operativa que justifica el precio premium.

### A.1 · Objetivos formativos (60 min · sponsor)

Reunión con sponsor del cliente. Preguntas obligatorias:

1. ¿Qué problema o oportunidad estratégica os mueve a contratar la charla?
2. ¿Qué queréis que la audiencia se lleve grabado y aplique tras la charla?
3. ¿Qué cambios de comportamiento esperáis ver en 30/60/90 días?
4. ¿Hay temas que NO podemos tocar abiertamente?

Output: **2-4 objetivos formativos consensuados** firmados por sponsor.

### A.2 · Pre-selección de valores y competencias (45 min)

De los **10 valores castellers** (ver `soc-teamtowers-brand`) y de las
competencias VNA, elegimos **3-5** alineados con los objetivos
formativos. Ejemplos:

- Para post-fusión → confianza, complementariedad, comunicación.
- Para resistencia al cambio → liderazgo compartido, esfuerzo compartido.
- Para silos → trabajo en equipo, definición de objetivos comunes.
- Para crisis → concentración, compromiso, organización.

Output: **lista de valores firmada**.

### A.3 · Mini-VNA borrador del cliente (1-2 h o 3-5 entrevistas)

Sesión breve con sponsor + 2-3 stakeholders representativos del
cliente, o entrevistas individuales de 30 min cada una. Mapeo
**ligero** (no exhaustivo) de:

- 5-7 roles principales del ámbito relevante.
- 8-12 transacciones MUST/EXTRA críticas.
- 1-3 patrones de disfunción visibles.

Output: **mini-VNA borrador** que se incorpora al guion como anclaje
narrativo (con permiso explícito + anonimización si conviene).

### A.4 · Identificación de público objetivo (30 min)

Ficha de audiencia:

- **Composición**: alta dirección / mando intermedio / personal base / mix.
- **Sector**: define metáforas y casos a usar.
- **Tamaño**: ajusta dinámica (auditorio vs sala íntima).
- **Cultura**: formal / cercana / técnica.
- **Idioma del speech**.
- **Expectativas previas**: ¿inspiración? ¿formación? ¿entretenimiento?

Output: **ficha de audiencia firmada**.

### A.5 · Decisión sobre arte vivo (30 min)

Pregunta clave al cliente: ¿queréis amplificación vía artista
invitado? Opciones probadas (con casos reales):

| Artista | Cuándo encaja | Función en el guion |
|---|---|---|
| **Clown** | Audiencias formales que necesitan permiso para reír | Encarna al "acotxador invisible" o al músic — irrumpe en momento de tensión |
| **Beatboxer** | Audiencias jóvenes / tech / digitales | Sustituye al músic castellero, sincroniza ritmo grupal |
| **Actor teatro físico** | Audiencias mixtas o internacionales | Dramatiza la "aleta" y la catarsis colectiva |
| **Músico tradicional (gralla + timbal)** | Audiencias culturales / institucionales | Inmersión auténtica · 5-7 min antes y/o después del speech |

Si el cliente acepta: contratación del artista (gestión TeamTowers o
externa según convenga). Acordar fecha de ensayo conjunto.

Output: **contrato del artista o decisión negativa firmada**.

### A.6 · Construcción del guion teatralizado (4 h, off-site)

El ponente integra:
- Objetivos formativos (A.1).
- Valores y competencias seleccionados (A.2).
- Ejemplos del mini-VNA del cliente (A.3) anonimizados.
- Tono adaptado al público (A.4).
- Apariciones del artista invitado si lo hay (A.5).

Estructura del guion en **6 bloques** (ajustable a 30-60 min):

```
1 · Hook visual                · 3-5 min  · vídeo / foto castellera de impacto
2 · El problema sistémico      · 8 min    · por qué los procesos lineales fallan
3 · La metáfora castellera     · 10 min   · UNESCO, 10 valores, "fent pinya"
                                            · arte vivo posible aquí (clown/beatboxer)
4 · El método VNA              · 15 min   · Verna Allee + caso real (mini-VNA cliente)
                                            · arte vivo posible aquí (actor en "aleta")
5 · Cita literal sponsor       · 3 min    · una frase del sponsor que cierra la conexión
6 · Llamada a la acción        · 5 min    · taller / La Colla / consultoría · CTA medible
```

Output: **guion final** (Markdown + slides) entregado al cliente
para revisión 48 h antes del evento.

### A.7 · Borrador IA del speech (30 min IA)

WO IA opcional que arranca el guion desde el mini-VNA + SOC + SOP.
El ponente refina con su voz personal antes de la charla.

---

## Fase B · Speech en sala (30-60 min)

Estructura ya definida en A.6. El ponente:

1. Llega 60 min antes para revisión técnica (sonido, micros, video).
2. Si hay artista invitado: ensayo de transiciones 30 min antes.
3. Imparte el speech siguiendo el guion final.
4. Cierra con CTA + invitación a contactar.

**Indicador de éxito en sala**: aplauso sostenido + audiencia que se
acerca a hacer preguntas tras el speech.

---

## Fase C · Follow-up comercial

### C.1 · Recolección de leads (60 min, mismo día)

- Lista de asistentes interesados (cualificada con sponsor del cliente).
- Notas del ponente sobre conversaciones post-speech.
- Output: **lista de leads cualificados** persistida en SOS.

### C.2 · Propuestas derivadas (120 min, en 5 días naturales)

Según leads cualificados, generar:
- Propuestas de talleres Fent Pinya (vía SOS H2.3).
- Propuestas de procesos La Colla (vía SOS H2.3).
- Propuestas de demos castelleras o consultoría VNA.

Output: **propuestas enviadas** firmadas y registradas.

---

## Variantes operativas

| Variante | Modulación |
|---|---|
| **Charla académica (escuela negocio)** | Énfasis VNA + Verna Allee + casos reales (Pantheon Work, Value Network Lab). Más profundidad teórica. |
| **Keynote congreso sectorial** | Adaptación al sector con metáforas específicas (sanidad, banca, retail, etc.). |
| **Charla cultural/festival** | Énfasis Patrimonio UNESCO + músico tradicional + público abierto. |
| **Charla interna corporativa** | Mini-VNA del cliente como protagonista. Anonimización opcional. |
| **Internacional** | Idioma + suplemento desplazamiento + adaptación cultural de metáforas. |

---

## Indicadores de éxito

| Dimensión | Verde | Ámbar | Rojo |
|---|---|---|---|
| Pre-trabajo completo | A.1 a A.5 firmado por sponsor | falta 1 fase | falta ≥2 fases |
| NPS post-charla (1 sem) | ≥9 | 7-8 | <7 |
| Leads cualificados | ≥3 contactos serios | 1-2 | 0 |
| Conversiones (3 meses) | ≥1 contrato derivado | promesa sin firmar | 0 |
| Material audiovisual | El cliente lo difunde | lo guarda interno | no lo comparte |

---

## Conexión con SOS · Mind-as-Graph

| Output | Tipo de nodo | Cuándo |
|---|---|---|
| Workshop kind=charla-conferencia | `workshop` | Inicio (Fase A) |
| Acta de objetivos | `deliverable` kind=meeting-minutes | A.1 |
| Mini-VNA cliente | `vna_role` + `vna_transaction` + `pattern` | A.3 |
| Guion teatralizado final | `deliverable` kind=speech-script | A.6 |
| Speech impartido | `signed_artifact` (con vídeo si autoriza) | Fase B |
| Lista de leads | `deliverable` kind=lead-list | C.1 |
| Propuestas derivadas | `deliverable` kind=proposal | C.2 |

---

## TODOs vivos

- [ ] Construir biblioteca de **guiones teatralizados** reutilizables
      por sector (banca, retail, sanidad, etc.) como SOPs derivados.
- [ ] Acuerdos de partnership con artistas recurrentes (clowns,
      beatboxers, actores) para tarifas preferentes.
- [ ] Plantilla de slides TeamTowers + recursos audiovisuales
      castelleros descargables.

---

*SOP v1 · enriquecido con input @alvaro 2026-04-30 · alineado con*
*SOC `soc-charla-conferencia` y SOC raíz `soc-teamtowers-brand`.*
