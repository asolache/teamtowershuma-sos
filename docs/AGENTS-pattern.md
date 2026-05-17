# AGENT.md pattern + MCP · pla d'adopció per SOS V11

> **Pregunta @alvaro (2026-05-17):** _"deberiamos tener el pensamiento que un prompt es un agente con un archivo .md y que el modelo de agentes de antropic se ha convertido en un estandard que deberiamos seguir · como se llama? · somos agnosticos de IA en todo caso"._

**Resposta curta:** sí, és la direcció correcta. Hi ha **dos estàndards convergents** que cal combinar.

---

## 1 · Els estàndards que existeixen

| Estàndard | Què és | Provider | Adopció |
|-----------|--------|----------|---------|
| **AGENT.md convention** | Comunitat · cada agent = 1 fitxer `.md` amb frontmatter YAML + body markdown | Agnostic | Usat per Claude Code · Continue.dev · Cursor · Cline · etc. |
| **MCP (Model Context Protocol)** | Anthropic · obert · per a tools + context + resources | Anthropic + qualsevol implementor | Cada cop més servers MCP públics |
| **OpenAI Assistants API** | Propietari · format propi | OpenAI only | Limitat · vendor lock-in |

**El que ja fem nosaltres** (PR #150 v119) és bàsicament una versió "in-code" del pattern AGENT.md · cada `TASK_PROMPTS[kind]` ja és un agent definit. Falta:
1. Extreure a fitxers `.md` independents (editables sense tocar JS)
2. Usar MCP per a tools agnostic
3. Parser que llegeixi els `.md` i els passi a qualsevol provider

---

## 2 · Estructura proposada · `agents/{task}.md`

```yaml
---
id: design-value-map-rich
name: "Disseny de mapa de valor RIC"
version: v1
model_tier: reasoner       # cost-aware · router pickModelForTier
expected_output_format: json
temperature: 0.4
max_output_tokens: 2000
methodology: ["verna-allee", "lean"]
output_schema:
  type: object
  required: [roles, deliverables, transactions, patterns_detected]
context_required:
  - name
  - description
  - sector
  - lifecycle_stage
  - vna_zoom
  - product_service
context_optional:
  - canvas
  - pitch
tools_mcp: []              # MCP tools per cridar (knowledge search · etc.)
tags: [vna, value-map, deep-thinking]
---

# Disseny de mapa de valor RIC

## Rol que assumeixes
COM CONSULTORA VERNA ALLEE SÈNIOR · pensa profundament...

## Context (interpolat per `{{...}}`)
- Projecte · "{{name}}"
- Sector CNAE · {{sector}}
- ...

## Think step-by-step
1. Quin és el network real al voltant del producte/servei?
2. ...

## Output JSON
```json
{
  "thinking": "...",
  "roles": [...],
  ...
}
```
```

**Beneficis:**
- ✅ Editable sense recompilar (text canviar al fitxer)
- ✅ Agnostic IA (qualsevol provider rep el .md com a system prompt)
- ✅ Versionable per git
- ✅ Compartible (publicar agents al permaweb · skills market)
- ✅ Test-able amb diffs visuals
- ✅ MCP tools wired (la IA pot cridar el nostre knowledge search · KB query · etc.)

---

## 3 · Plan implementació (WO `wo-agent-md-pattern` · L · 12€)

**Fase 1 · estructura (1 dia)**
- Crear carpeta `agents/` arrel del repo
- 13 fitxers `agents/{task}.md` amb frontmatter + body interpolat
- Parser `js/core/agentMdLoader.js` · llegeix fitxer · retorna `{system, user, model, tools, schema}`
- TDD que la sortida coincideix amb l'actual `TASK_PROMPTS[kind]`

**Fase 2 · MCP tools (1 dia)**
- Implementar 2 servers MCP locals al SOS ·
  - `mcp-server-knowledge` · search/get del `knowledge/`
  - `mcp-server-kb` · query KB nodes per type/project
- Configuració · els agents declaran `tools_mcp: [knowledge.search]` al frontmatter
- L'adapter passa les tools a la IA via Anthropic native tool-use (i fallback per altres providers)

**Fase 3 · migració (1 dia)**
- `vnaExpertPrompts.js` · `buildPrompt({taskKind, context})` ara crida `agentMdLoader(taskKind).render(context)`
- Compatibilitat 100% amb el sistema actual (els tests existents segueixen verds)
- `/prompts-debug` · llegeix els `.md` directament (a més de mostrar el system)

**Fase 4 · editor visual (opcional · futur PR)**
- `/agents` · nova vista per editar els `.md` des de la UI
- Diff preview · TDD inline · publish to permaweb

---

## 4 · Per què MCP a més de AGENT.md

| | AGENT.md | MCP |
|---|---|---|
| Què defineix | El agent (prompt + config) | Els tools que el agent pot cridar |
| Format | Markdown + frontmatter | JSON-RPC server |
| Editable | Sí · directe | No · server compilat |
| Discovery | git/permaweb | server registry |
| Reusable | Per qualsevol provider | Per qualsevol provider |

**Junts:** AGENT.md descriu QUI és l'agent + MCP descriu QUÈ pot fer. La IA reb el .md (rol + context) + crida tools MCP (knowledge search · KB query · permaweb publish · etc.).

---

## 5 · Próximes accions

1. **Aquest PR (v120)** · backlog + doc + UI fixes (search a breadcrumb · pills messages/wallet · skills a /learn)
2. **PR següent** · implementar Fase 1 d'aquest pla · estructura `agents/` + parser
3. **PR posterior** · MCP tools locals
4. **PR final** · migració + tests verds + /agents editor

> **Resum filosòfic:** un prompt no és una funció · és un **agent amb personalitat, eines i contracte**. Tractar-lo com a fitxer .md és la conseqüència natural d'aquesta veritat.
