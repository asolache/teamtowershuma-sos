---
id: soc-fent-pinya
type: soc
version: v2
status: draft
author: "@alvaro"
purpose: "Convertir la tradición castellera (Patrimonio Inmaterial UNESCO) en un taller corporativo participativo de 2 h que tangibiliza experiencialmente los 10 valores castellers y genera euforia colectiva ('aleta') con retorno medible en cohesión, comunicación y compromiso."
outcomes:
  - "El grupo construye torres humanas reales (hasta 5 pisos) en menos de 2 horas con seguridad certificada."
  - "Cada participante experimenta físicamente los 10 valores castellers (liderazgo compartido, comunicación, confianza, complementariedad, etc.)."
  - "El equipo identifica intercambios intangibles críticos que no aparecen en su organigrama."
  - "Surge un primer borrador de mapa VNA propio (cuando el formato incluye fase de cosecha VNA)."
  - "El cliente se lleva un recuerdo viral (foto del equipo coronando la torre) y mejoras de cohesión del 30-50% post-evento."
related_socs: [soc-teamtowers-brand, soc-vna-network]
related_sops: [sop-fent-pinya-taller]
keywords: [fent-pinya, castells, vna, intangibles, equipo, propósito, taller, teamtowers, mice, dmc, team-building]
sos_context: critical
---

# Fent Pinya · Concepto operativo

> Força · Equilibri · Valor · Seny.
> El taller estrella de TeamTowers desde 2005, evolucionado en >60.000
> participantes y >150 clientes corporativos.

---

## Por qué existe

Las redes de valor (Verna Allee, 2008) son **redes de roles e intercambios**, no
organigramas. La mayor parte del valor real fluye por intangibles:
conocimiento, confianza, reputación, favores, atención. Pero los equipos
modernos sólo saben hablar de KPIs tangibles, contratos y puestos.

Resultado: las organizaciones optimizan lo que ven (tangible) y degradan lo que
no ven (intangible). Llega un punto en que la red se rompe sin razón aparente.

**Fent Pinya** existe para que un equipo *sienta físicamente* qué pasa cuando se
le pide soportar carga sin haber construido los intangibles. La metáfora del
castell humano (catalán) es brutalmente honesta: si los baixos no transmiten
seguridad psicológica, los segons no pueden concentrarse, y todo se cae —
literalmente, no metafóricamente.

## Qué entrega

Es un **taller participativo** donde la audiencia se transforma en una colla
castellera real durante 2 horas. No es team-building genérico ni gamificación;
es una intervención cultural-experiencial certificada con seguro de
responsabilidad civil que termina con torres humanas reales y, opcionalmente,
con un primer mapa VNA del cliente.

| Entregable | Tipo | Destinatario |
|---|---|---|
| Vivencia física de los 10 valores castellers | intangible | Cada participante |
| Construcción real de castell hasta 5 pisos | tangible | Grupo entero |
| Foto del equipo coronando la torre | tangible | Cliente (viral en redes) |
| Lista de intercambios intangibles críticos (opcional cosecha VNA) | tangible | Cliente (informe post) |
| Decisión personal de rol VNA (si se incluye reflexión) | intangible | Cada participante |

## Audiencias

- **Corporativo** (mayoritario): incentivos, kick-offs, offsites, MICE.
- **Deportivo**: clubes, equipos profesionales, federaciones.
- **Educativo**: ESADE, IESE, EADA, La Salle y similares — formación de líderes.
- **Eventos a gran escala**: galas internas, congresos, festivales corporativos.

Tamaño de grupo: **de 10 a 1.000 personas**. Reglas de división y composición de
equipo en el SOP `sop-fent-pinya-taller`.

## Cuándo usarlo

- Equipo nuevo, post-fusión, kick-off de proyecto, cierre fiscal.
- Incentivos MICE: convertir un viaje de empresa en recuerdo memorable.
- Antes de transformación cultural / digital — para construir cohesión base.
- Como puerta de entrada a una **consultoría VNA** posterior (cuando se
  añade fase de cosecha).
- Como primer servicio en una **franquicia de formación** futura.

## Cuándo NO usarlo

- Como icebreaker de evento de marketing puro sin objetivo de cohesión.
- Para grupos < 10 (no hay base para construir castell con seguridad).
- Sin permiso del cliente cuando se incluye fase VNA que revela intangibles
  incómodos.
- Cuando el cliente sólo busca actividad y no acepta intervención cultural.

## Conexión con la mente del proyecto (Mind-as-Graph)

Cada vez que se imparte un Fent Pinya, el resultado puede entrar al SOS como
nodos del proyecto del cliente:

- **Workshop registrado** → nodo `type: workshop` en KB con cliente, fecha,
  audiencia, estado (propuesta / agendado / impartido / cobrado).
- **Roles detectados** (si hay cosecha VNA) → `type: vna_role`.
- **Transacciones intangibles capturadas** → `type: vna_transaction`
  con `category: intangible`.
- **Patrones de disfunción** → `type: pattern`.
- **Compromisos individuales** → `type: skill_node`.
- **Propuesta y/o informe** → `type: deliverable` con
  `kind: proposal` o `kind: post-workshop-report`.

Esto convierte cada taller en un alimentador de la red neuronal del proyecto
del cliente.

## Conexión con la franquicia de formación futura

Este SOC es el **invariante** que cualquier formador franquiciado debe
preservar. El SOP asociado define el procedimiento estándar; un formador
certificado podrá crear *variantes locales* (`sop-fent-pinya-taller-{ciudad}`)
siempre que respeten este SOC y el SOC-raíz `soc-teamtowers-brand`.

## Principios irrenunciables

1. **Experiencial antes que conceptual** — no se explica el VNA, se siente.
2. **Físico antes que verbal** — el cuerpo aprende lo que la mente racionaliza después.
3. **Seguridad certificada** — bajo riesgo, seguro de responsabilidad civil incluido.
4. **Sin nodo central obligatorio** — el cap de colla emerge, no se impone.
5. **Wow factor garantizado** — torres reales, no metáforas. La "aleta" es la firma.
6. **Logística seamless** — de 10 a 1.000 personas en cualquier venue
   (10×10×5 m mínimo).

---

*Documento de visión Fent Pinya v2 — alineado con el SOC-raíz*
*`soc-teamtowers-brand`. Sujeto a revisión por @alvaro.*
*Marca registrada del taller: TeamTowers.eu · Fent Pinya®*