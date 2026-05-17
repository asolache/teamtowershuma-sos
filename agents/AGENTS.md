# AGENTS · TeamTowers SOS V11 · AGENT.md convention + MCP

Aquest directori implementa el patró **AGENT.md** (convenció Anthropic) per a tots
els prompts de la cadena d'experts que crea projectes al SOS. Cada agent és un
fitxer `.md` autocontingut · frontmatter YAML + body Markdown · que pot ser
carregat per la SOS (mode local) i — en futur — per MCP servers compatibles.

## Per què

Avui els prompts viuen en `js/core/vnaExpertPrompts.js` com a strings JS · barreja
metadata + body · difícil de revisar per humans · prohibit per autors no-devs ·
no portable a altres orquestradors (Claude Desktop, MCP, OpenAI Assistants…).

El patró AGENT.md inverteix això:
- 1 fitxer per agent · 1 responsabilitat clara
- Frontmatter declara model_tier · cost · routing · evaluator
- Body en markdown llegible (input, output schema, exemples)
- Versionable a Git · diff humà · review per qualsevol stakeholder
- Carregable per qualsevol runtime compatible MCP

## Estructura del frontmatter

```yaml
---
id: define-product-service           # task kind canònic
version: v1.0                        # bump cada vegada que canvia el body
model_tier: mid                      # reasoner | mid | small (veure promptTierRouter)
routing: sop-structured              # quality-audit | sop-structured | creative-narrative
expected_output: json                # json | text | jsonl
cost_estimate_eur: 0.003             # estimació superior · per a budget guards
evaluator: schema-valid              # nom del check post-IA
escalation: standard                 # standard (3 intents) | aggressive | none
tags: [chain, vna, product]
---
```

## Estructura del body

```markdown
## Rol
[1-2 frases · qui ets · què fas]

## Context d'entrada
- name: nom del projecte
- description: descripció lliure
- sector: codi CNAE (opcional)
- ...

## Tasca
[1-3 frases · què t'estem demanant]

## Output schema
```json
{ ... esquema mínim del JSON a retornar ... }
```

## Restriccions
- KISS · prioritza claredat sobre completesa
- DRY · no repeteixis context ja al system
- No markdown · només JSON pur al response
```

## Phases de la cadena expert (CHAIN_PHASES @ expertChainOrchestrator.js)

1. `define-product-service` · identifica el producte/servei central
2. `personalize-canvas` · IKIGAI + visió + mission + values + producte
3. `personalize-pitch` · 6 seccions pitch deck
4. `personalize-landing` · hero + diferencial + howItWorks + roadmap + FAQ
5. `design-value-map-rich` · roles RIC + transactions + deliverables
6. `generate-socs-from-value-map` · SOCs derivats + presentationHints (mapa+castell+lineal)
7. `generate-sops-with-skills` · SOPs amb skills per cada SOC
8. `generate-wos-from-sop` · Work Orders executables per cada SOP

## Loader

Vegeu `js/core/agentMdLoader.js`. API ·

```js
import { loadAgent, listAgents, parseAgentSource } from './agentMdLoader.js';

const agent = await loadAgent('define-product-service');
// → { id, version, frontmatter: { model_tier, routing, … }, body: '## Rol\n…' }
```

## Pla de migració · 4 fases (veure docs/AGENTS-pattern.md)

- **Fase 1 (v122 · ARA)** · agents/ amb 8 .md + loader + tests · additive · zero breaking
- **Fase 2** · vnaExpertPrompts.js delega a loader per a les 8 fases canòniques
- **Fase 3** · UI /prompts-debug llegeix agents/ directament · edit live
- **Fase 4** · agents publicats al permaweb · marketplace de skills

## MCP (Model Context Protocol)

L'objectiu llarg termini és que cada agent sigui también un MCP tool exposat
per un MCP server local. Així la SOS pot delegar fases a qualsevol model
agnòstic (Claude, GPT, Mistral, llama local…) via un únic protocol.
