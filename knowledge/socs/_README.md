# SOCs · Standard Operating Concepts

Un **SOC** responde a *qué es* y *por qué existe* un servicio, ritual, artefacto o
capacidad. Define el invariante conceptual antes de que exista cualquier
procedimiento (SOP) o entregable concreto.

Reglas:
- Un SOC vive sólo aquí (`knowledge/socs/{slug}.md`).
- Sirve como nodo `type: soc` en KB tras invocar `KB.upsert`.
- Cualquier SOP referencia su SOC mediante `soc_ref` en frontmatter.
- Si un SOP cambia, el SOC sólo cambia si el *propósito* cambió.

Esquema mínimo del frontmatter:

```yaml
---
id: soc-{slug}
type: soc
version: v1
status: draft | review | approved
author: "@alvaro"
purpose: "Una frase que captura por qué existe este concepto."
outcomes: ["...", "..."]
related_socs: []
related_sops: []
keywords: []
---
```

Cuerpo libre en Markdown: contexto, principios, when_to_use, when_NOT_to_use,
conexión con VNA y con la red neuronal Mind-as-Graph.