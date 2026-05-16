---
id: clients-readme
type: index
version: v1
status: live
purpose: "Convenció canònica de paths per a persistir el mind de cada client al knowledge. Garanteix trazabilitat sector→client→SOCs→SOPs→skills."
keywords: [clients, convention, mind-graph, trazabilidad]
---

# Clients · convenció canònica

Cada client SOS té el seu propi mind persistit aquí · format estàndard
per facilitar al KnowledgeLoader trobar-ho tot en bloc i a les IAs
operar amb context complet.

## Estructura de directori

```
knowledge/clients/{client_id}/
├── vna-model.md           ← REQUIRED · mapa VNA del client (roles + transactions)
├── socs/                  ← SOCs específics del client (1 fitxer per SOC)
│   ├── {soc-slug}.md
│   └── ...
├── sops/                  ← SOPs específics (1 fitxer per SOP · cada un té soc_ref)
│   ├── {sop-slug}.md
│   └── ...
└── skills/                ← Opcional · skills demostrades per usuaris del client
    └── {handle}.md
```

## Convencions

- **client_id** · `kebab-case` lowercase · ex. `ikea-madrid` · `castellers-bcn`
- **slugs de SOC/SOP** · sense prefix `soc-` ni `sop-` (ja implícit al directori)
- **Frontmatter** · cada fitxer YAML frontmatter com els canònics (`socs/_README.md`)
- **Heretat** · `socs/teamtowers-brand.md` (root) sempre s'afegeix com a context base
- **Trazabilitat** · `vna-model.md` referencia `sectorSeed` del CNAE base
- **SOPs lligats** · cada SOP del client té `soc_ref` (apunta a SOC del client o al canònic)

## Fixture de referència

`clients/EXAMPLE/` conté un client demo amb tot l'arbre per veure el format viu.

## KnowledgeLoader API

```js
import { KnowledgeLoader } from '../core/KnowledgeLoader.js';

// Carrega tot el client en un sol pas
const client = await KnowledgeLoader.getClientSeed('castellers-bcn');
// → { vnaModel, socs: [...], sops: [...], skills: [...] }
```

(API pendent · WO `wo-knowledge-loader-client-001` post-sprint K4)
