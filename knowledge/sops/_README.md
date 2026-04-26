# SOPs · Standard Operating Procedures

Un **SOP** define *cómo* se ejecuta una capacidad concreta. Es el procedimiento
repetible que materializa el concepto descrito en su SOC asociado.

Reglas:
- Un SOP vive sólo aquí (`knowledge/sops/{slug}.md`).
- Sirve como nodo `type: sop` en KB tras invocar `KB.upsert`.
- Cada SOP referencia obligatoriamente un SOC mediante `soc_ref`.
- Cada SOP define entregables verificables → enlazables a `type: deliverable`
  bajo el ciclo DTD (Deliverable Test Driven).

Esquema mínimo del frontmatter:

```yaml
---
id: sop-{slug}
type: sop
soc_ref: soc-{slug}
version: v1
status: draft | review | approved
author: "@alvaro"
duration_minutes: null
audience: ["..."]
prerequisites: []
materials: []
deliverables: []
keywords: []
---
```

Cuerpo MD: agenda fase a fase con objetivo, tiempo, actividades, output esperado,
indicadores de éxito y variantes por audiencia.

Convención: marcar con `[REVISAR @alvaro]` cualquier dato que sea hipótesis y
necesite validación humana antes de firmar el SOP como `approved`.