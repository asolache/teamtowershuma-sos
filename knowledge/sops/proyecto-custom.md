---
id: sop-proyecto-custom
type: sop
soc_ref: soc-proyecto-custom
brand_ref: soc-teamtowers-brand
version: v1
status: draft
author: "@alvaro"
duration_minutes: null   # variable según custom
audience: ["mixto", "escuelas", "festivales", "galas", "corporativo-ajustado"]
group_size_min: 8
group_size_max: 1000
languages: ["castellano", "catalán", "inglés", "alemán", "francés"]
prerequisites:
  - "Briefing detallado con sponsor/cliente para entender la modulación necesaria."
  - "Confirmación de que la variante NO compromete seguridad ni invariantes de marca."
  - "Acuerdo explícito documentado de la modulación (no asunciones tácitas)."
materials:
  - "Material según SOPs combinados (ver bloque correspondiente en cada SOP base)"
deliverables:
  - "Propuesta documentada como combinación + modulación (NO formato 'inventado')"
  - "Acta de modulaciones firmada por sponsor"
  - "Outputs de cada bloque siguiendo su SOP estándar"
  - "Informe post-evento que documenta la combinación para futura promoción a SOP propio"
keywords: [custom, hibrido, multi-formato, escuela, gymkana, demo-participativa, presupuesto-ajustado, proyecto-medida]
fmv_eur_h: null

# H7.3 · Pasos canónicos del proceso de diseño + ejecución de un custom
steps:
  - id: fase-a1-briefing
    label: "Briefing extenso con sponsor (pre-engagement)"
    duration_minutes: 90
    role_kind: human
    role_profile: facilitador
    deliverable_kind: brief-cliente
    approval_rule: manual
    priority: high
  - id: fase-a2-detectar-variante
    label: "Detección de variante (V1 escuela / V2 gymkana / V3 demo-part / V4 combinación / V5 económico)"
    duration_minutes: 60
    role_kind: human
    role_profile: facilitador
    deliverable_kind: variante-detectada
    approval_rule: manual
    priority: high
  - id: fase-a3-composicion
    label: "Composición de SOPs base + modulaciones explícitas"
    duration_minutes: 120
    role_kind: human
    role_profile: facilitador
    deliverable_kind: plan-custom
    approval_rule: manual
    priority: high
  - id: fase-a4-validacion-marca
    label: "Validación que las modulaciones respetan invariantes (seguridad, valores, UNESCO)"
    duration_minutes: 30
    role_kind: human
    role_profile: facilitador
    deliverable_kind: validacion-brand
    approval_rule: manual
    priority: high
  - id: fase-a5-propuesta
    label: "Propuesta comercial al cliente con modulación documentada"
    duration_minutes: 60
    role_kind: ai
    role_profile: agente_anthropic
    deliverable_kind: proposal
    approval_rule: manual
    priority: high
  - id: fase-b-ejecucion
    label: "Ejecución del custom (según SOPs base + modulaciones)"
    duration_minutes: 240
    role_kind: human
    role_profile: equipo-completo
    deliverable_kind: evento-impartido
    approval_rule: manual
    priority: high
  - id: fase-c1-informe
    label: "Informe post-evento (incluye documentación de modulación)"
    duration_minutes: 90
    role_kind: ai
    role_profile: agente_anthropic
    deliverable_kind: post-workshop-report
    approval_rule: manual
    priority: med
  - id: fase-c2-leccion
    label: "Lección custom · evaluar promoción a SOP estándar si se repite"
    duration_minutes: 30
    role_kind: human
    role_profile: facilitador
    deliverable_kind: leccion-custom
    approval_rule: manual
    priority: low
---

# Proyecto custom · SOP v1

> Procedimiento estándar para diseñar y ejecutar customs sin
> erosionar marca. La regla operativa es **componer + modular**, no
> inventar.

---

## Estructura general

| Fase | Descripción | Duración aprox |
|---|---|---|
| **A · Diseño** | Briefing → variante → composición → validación → propuesta | 1-2 semanas |
| **B · Ejecución** | Igual que los SOPs base que componen el custom | Según composición |
| **C · Cierre** | Informe + lección para evaluar promoción a SOP propio | 1-2 semanas |

---

## Fase A · Diseño del custom

### A.1 · Briefing extenso con sponsor (90 min)

Pregunta clave: **¿por qué los formatos estándar no encajan?**

Si la respuesta es vaga ("queremos algo diferente"), volver a indagar:
hay altas probabilidades de que un formato estándar sí encaje y el
cliente no lo conoce todavía.

Si la respuesta es concreta (restricción de aforo, presupuesto,
audiencia específica, espacio singular, combinación de objetivos),
seguir adelante con custom.

Otros datos a recoger:
- Audiencia: tamaño, perfil, edad, idioma.
- Espacio: dimensiones, indoor/outdoor, restricciones.
- Duración disponible.
- Budget realista (incluye comunicación abierta sobre tarifas).
- Resultados esperados.

Output: **brief firmado**.

### A.2 · Detección de variante (60 min)

Mapear el brief contra el catálogo de variantes (ver SOC):

| Si el brief dice... | Variante probable |
|---|---|
| Aula escolar, 8-25 alumnos, equipo reducido | **V1 · Escuela** |
| Festival corporativo outdoor, 30-200 pax, formato cooperativo | **V2 · Gymkana** |
| Gala / launch / cumbre 100-500 pax · "más que demo, menos que taller" | **V3 · Demo participativa** |
| Múltiples formatos en mismo evento o serie | **V4 · Combinación** |
| Budget < 60% del estándar pero quieren TeamTowers | **V5 · Económico** |
| Caso no listado | **Replantear con el cliente** o nueva sub-variante |

Output: **variante elegida + justificación documentada**.

### A.3 · Composición y modulación (120 min, off-site)

Por cada variante, identificar:

1. **SOPs base**: ej. V1 = `sop-fent-pinya-taller`. V4 = combinación.
2. **Modulaciones explícitas** sobre el SOP base. Tabla típica:

| Variante | Modulaciones canónicas |
|---|---|
| V1 Escuela | Equipo reducido (1 din + 1 mon) · sin músicos · 90-120 min · castell máx 3 pisos |
| V2 Gymkana | Estaciones paralelas con 1 mon/cada · rotación de grupos · castell final opcional |
| V3 Demo participativa | Demo profesional + 30 min de pinya audiencia con monitores · castell final 3-4 pisos |
| V4 Combinación | Cada bloque sigue su SOP base · documentar transiciones |
| V5 Económico | Mínimos no negociables: 1 din + 2 mon · sin músicos · sin merch · comunicación clara al cliente |

3. **Salvaguardas no negociables a verificar**: seguridad
   certificada, seguro RC, respeto a los 10 valores castellers, NO
   construir con riesgo > "bajo riesgo certificado".

Output: **plan custom documentado**.

### A.4 · Validación de marca (30 min)

Lista de comprobación antes de presentar la propuesta:

- [ ] La seguridad NO se reduce por debajo del estándar legal.
- [ ] El cliente conoce y acepta las modulaciones (no asunciones).
- [ ] La calidad final SIGUE entregando wow factor (aunque reducido).
- [ ] El precio refleja el alcance real (no se subsidia complejidad).
- [ ] Si V5 económico: el cliente acepta por escrito que "no es la
      versión completa".

Output: **validación firmada por el responsable comercial**.

### A.5 · Propuesta comercial (60 min IA)

Generar propuesta al cliente que **documenta la modulación
explícitamente** (no se vende como "formato genérico"). Recomendado:
WO IA con `sopRef: sop-proyecto-custom` que recibe el plan y
construye el MD comercial.

Output: **propuesta enviada y firmada**.

---

## Fase B · Ejecución

Cada bloque del custom **sigue su SOP base estándar** (Fent Pinya,
demo, La Colla, merchandising, charla). Las modulaciones acordadas
se aplican localmente.

El dinamizador-jefe del custom es responsable de:
- Coordinar transiciones entre bloques (en V4 combinación).
- Comunicar a equipo y audiencia las particularidades de la modulación.
- Documentar incidencias para la fase C.

---

## Fase C · Cierre y aprendizaje

### C.1 · Informe post-evento (90 min IA)

WO IA con `sopRef: sop-proyecto-custom` que genera informe documentando:
- Variante usada.
- Modulaciones aplicadas vs plan inicial.
- Outputs reales de cada bloque.
- Indicadores de éxito.
- Ahorro de costes (si V5) o sobrecoste justificado (si V4).

### C.2 · Lección custom (30 min)

Evaluar:
- ¿La variante funcionó según lo previsto?
- ¿Aparecen patrones recurrentes en los últimos N customs?
- ¿Esta combinación merece convertirse en SOP propio?

Si una variante se ha hecho 3 veces con éxito → promover a SOP
estándar específico (ej. `sop-fent-pinya-escuela`) para no repetir
diseño cada vez.

---

## Indicadores de éxito

| Dimensión | Verde | Ámbar | Rojo |
|---|---|---|---|
| Variante claramente identificada | Sí, una de las 5 (o nueva justificada) | Borrosa | Inventada sin marco |
| Modulaciones documentadas explícitamente | Sí, en propuesta y informe | Algunas tácitas | Asumidas sin doc |
| Salvaguardas verificadas | 100% | 1 sin verificar | ≥2 sin verificar |
| Wow factor entregado | Cliente reporta sorpresa positiva | Aceptable | Decepción |
| Margen económico real | Adecuado al alcance | Justo | Pérdida |

---

## Conexión con SOS · Mind-as-Graph

| Output | Tipo de nodo |
|---|---|
| Workshop kind=proyecto-custom · customVariant=V1..V5 · composedFrom=[SOPs] | `workshop` |
| Brief, plan, validación | `deliverable` con kind específico |
| Propuesta y informe IA | `deliverable` kind=proposal / post-workshop-report |
| Lección custom | `deliverable` kind=custom-lesson |
| Si se promueve a SOP propio | `sop` nuevo en `knowledge/sops/` |

---

## TODOs vivos

- [ ] Crear SOPs específicos cuando una variante se repita ≥3 veces:
      `sop-fent-pinya-escuela`, `sop-gymkana-castellera`,
      `sop-demo-participativa`.
- [ ] Plantilla de propuesta MD por variante (acelera Fase A.5).
- [ ] Política clara de mínimos para V5 económico (umbrales que
      activan "no aceptar el contrato").

---

*SOP v1 · enriquecido con input @alvaro 2026-04-30 · cubre las 5*
*variantes habituales identificadas en la práctica de TeamTowers.*
