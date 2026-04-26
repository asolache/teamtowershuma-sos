---
id: soc-fent-pinya
type: soc
version: v1
status: draft
author: "@alvaro"
purpose: "Tangibilizar de forma experiencial los activos intangibles de una red de valor con propósito, usando la metáfora viva del castell para revelar dónde se crea, se pierde y se transmite el valor en un equipo o organización."
outcomes:
  - "Cada participante experimenta físicamente la diferencia entre rol VNA y puesto jerárquico."
  - "El equipo identifica al menos 3 intercambios intangibles críticos que no aparecen en su organigrama."
  - "Surge un primer borrador de mapa VNA propio, con roles, transacciones y patrones de disfunción detectados durante el taller."
  - "Cada persona se lleva una decisión personal sobre qué rol VNA quiere ocupar (no necesariamente el de su puesto)."
related_socs: [soc-vna-network]
related_sops: [sop-fent-pinya-taller]
keywords: [fent-pinya, castells, vna, intangibles, equipo, propósito, taller, teamtowers]
sos_context: critical
---

# Fent Pinya · Concepto operativo

> Força · Equilibri · Valor · Seny.
> Veinte años de práctica condensados en un ritual de 3 horas que convierte
> un equipo abstracto en una red de valor consciente de sí misma.

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

Es un **diagnóstico VNA experiencial** seguido de un primer mapa de la red
del cliente. No es team-building genérico ni gamificación; es una intervención
diagnóstica que termina con un artefacto VNA accionable.

| Entregable | Tipo | Destinatario |
|---|---|---|
| Vivencia física de roles VNA | intangible | Cada participante |
| Lista de intercambios intangibles críticos | tangible | Cliente (informe) |
| Primer borrador VNA del cliente | tangible | Cliente (mapa SOS) |
| Decisión personal de rol | intangible | Cada participante |
| Hipótesis de patrones de disfunción | tangible | Cliente (informe) |

## Cuándo usarlo

- Equipo nuevo o post-fusión que necesita descubrir su red real de valor.
- Organización con problemas crónicos de coordinación que el organigrama no explica.
- Antes de un proceso de transformación cultural o digital.
- Como puerta de entrada a una **consultoría VNA** posterior.
- Como primer servicio en una **franquicia de formación** (formador entrenado).

## Cuándo NO usarlo

- Como icebreaker de evento corporativo de marketing puro.
- Con grupos < 8 o > 30 personas (la geometría del castell humano deja de funcionar).
- Sin permiso del cliente para que el diagnóstico revele intangibles incómodos.
- Cuando el cliente sólo busca actividad y no acepta intervención diagnóstica.

## Conexión con la mente del proyecto (Mind-as-Graph)

Cada vez que se imparte un Fent Pinya, el resultado entra al SOS como nodos
del proyecto del cliente:

- **Roles detectados** → `type: vna_role` en el ValueMap del cliente.
- **Transacciones intangibles capturadas** → `type: vna_transaction` con
  `category: intangible`.
- **Patrones de disfunción** → `type: pattern` en el bloque de análisis.
- **Decisiones personales** → `type: skill_node` en la red neuronal de cada
  persona.
- **El propio taller** → `type: ledger_entry` en el ledger del cliente
  (intangible: "valor entregado por el formador").

Esto convierte cada taller en un alimentador de la red neuronal del proyecto
del cliente — la IA del SOS hereda el contexto y puede continuar el trabajo.

## Conexión con la franquicia de formación

Este SOC es el **invariante** que cualquier formador franquiciado debe
preservar. El SOP asociado (`sop-fent-pinya-taller`) define el procedimiento
estándar, pero un formador certificado puede crear *variantes locales*
(`sop-fent-pinya-taller-{ciudad}`) siempre que respeten este SOC.

## Principios irrenunciables

1. **Experiencial antes que conceptual** — no se explica el VNA, se siente.
2. **Físico antes que verbal** — el cuerpo aprende lo que la mente racionaliza después.
3. **Intangibles primero** — la confianza se construye antes de cargar peso.
4. **Sin nodo central obligatorio** — el cap de colla emerge, no se impone.
5. **Diagnóstico honesto** — si la red está rota, el taller lo revela; no se "vende esperanza".

---

*Documento de visión Fent Pinya v1 — sujeto a revisión por @alvaro.*
*Marca registrada del taller: TeamTowers.eu · Fent Pinya®*