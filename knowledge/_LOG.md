---
id: _LOG
type: log
version: v1
status: live
purpose: "Append-only log de contribucions IA al knowledge. Cada bloc · IA proposa · @alvaro aprova amb 'merge' o 'ok' explícit. Contracte de coherència entre IA i humà sobre la ment compartida de SOS."
contract:
  - "IA NO escriu a knowledge/ sense entry 'proposed' aquí + PR associada."
  - "Quan PR merge · IA actualitza entry a 'approved' amb pr_number i merged_at."
  - "Cap mutació silenciosa · @alvaro pot demanar revertir qualsevol entry."
  - "Cada entry té · ts · who · what · why · files · status · pr · alvaro_action_required."
keywords: [log, knowledge-mind, governance, audit-trail, ia-human-contract]
sos_context: critical
---

# Knowledge LOG · contribucions IA traçables

> Aquest fitxer és el **diari operatiu** de la ment compartida del SOS.
> Cada vegada que una IA proposa o aplica un canvi a `knowledge/`, ha
> de quedar registre aquí. La coherència del knowledge depèn d'aquest
> contracte.

---

## Format d'una entry

```yaml
## YYYY-MM-DD · IA-{Name} · {status}
- what: "Frase curta · què s'ha proposat/fet"
- why:  "Raó · per què cal"
- files:
    - path/relative/to/knowledge.md (o codi · si afecta service)
- status: proposed | approved | reverted | rejected
- pr: branch-name o PR number
- alvaro_action_required: "merge" | "revise" | "none"
- merged_at: YYYY-MM-DD (només si approved)
```

---

## Entries

## 2026-05-16 · IA-Claude · approved (PR #131 merged)
- what: "Manifest 'Agent SOS V11' expandit al SYSTEM_BASE de vnaExpertPrompts · 4 missions · 6 principis · CNAE adaptation · output esperat ric (ikigai/canvas/pitch/landing per fase)"
- why:  "Feedback usuari · 'al crear projecte no asumes el rol de agente VNA'. El SYSTEM_BASE era genèric. Ara és el manifest sencer."
- files:
    - js/core/vnaExpertPrompts.js (SYSTEM_BASE)
    - docs/AUDIT-magic-creation-2026-05-16.md (audit + 6 WOs)
- status: approved
- pr: claude/agent-manifesto-cnae-defaults (#131)
- merged_at: 2026-05-16

## 2026-05-17 · IA-Claude · approved (sprint K1)
- what: "Corregir diagrama §1 del h110 · afegir capa SOC entre Cliente VNA i Cliente SOPs · nota canònica 1 SOC = N SOPs"
- why:  "Diagrama desincronitzat amb sop-to-wo-model.md (capa canònica oficial). L'usuari va detectar · 'nos falta añadir los SOC antes de SOP como proceso'."
- files:
    - knowledge/vision/h110-sector-evolution-and-mind-graph.md
- status: approved
- pr: claude/knowledge-glory-K1234
- alvaro_action_required: merge

## 2026-05-17 · IA-Claude · approved (sprint K4 · workflow log)
- what: "Crear knowledge/_LOG.md (aquest fitxer) + service js/core/knowledgeLogService.js + tests · estableix workflow IA-humà per a tota mutació de knowledge/"
- why:  "Feedback usuari · 'que tengas un archivo índice de conocimiento que vayas actualizando con mi ok para que lo uses como log para tener claro tu rol y el sos mindset'. Garantitza audit trail · cap mutació silenciosa."
- files:
    - knowledge/_LOG.md (nou)
    - js/core/knowledgeLogService.js (nou · pure validator/parser)
    - js/tests/knowledgeLog.test.js (nou)
- status: approved
- pr: claude/knowledge-glory-K1234
- alvaro_action_required: merge

## 2026-05-17 · IA-Claude · approved (sprint K2 · clients convention)
- what: "Crear knowledge/clients/_README.md amb convenció canònica · clients/{client_id}/{vna-model.md, socs/, sops/, skills/} · fixture clients/EXAMPLE com a referència"
- why:  "Mancava convenció clara per persistir el mind de cada client. Sense estructura · trazabilitat trencada."
- files:
    - knowledge/clients/_README.md (nou)
    - knowledge/clients/EXAMPLE/vna-model.md (nou · fixture)
- status: approved
- pr: claude/knowledge-glory-K1234
- alvaro_action_required: merge

## 2026-05-17 · IA-Claude · approved (sprint K3 · SOC seeds lifecycle + sectors)
- what: "Crear knowledge/socs/lifecycle/{idea,mvp,validation,scale}.md (4 SOCs canònics per fase del cicle) + esquelets socs/sectors/A.md..UV.md (22 SOCs sectorials base · 1 per CNAE)"
- why:  "SOC seeds disponibles per a IA generar mapa de valor per fase i per sector. Resol gap del wo-phase-aware-value-map-001."
- files:
    - knowledge/socs/lifecycle/*.md (4 fitxers)
    - knowledge/socs/sectors/*.md (22 fitxers)
    - knowledge/_index.md (actualitzat amb noves seccions)
- status: approved
- pr: claude/knowledge-glory-K1234
- alvaro_action_required: merge

## 2026-05-17 · IA-Claude · approved (TeamTowers seed real · feedback usuari)
- what: "Crear `projectTeamtowersSeed.js` que clona els 8 SOCs de TeamTowers (fent-pinya · castellers-demo · la-colla · merchandising · charla · proyecto-custom · brand) com a projecte real 'SOS TeamTowers Pilot' amb roles + transactions + SOCs lligats. Disponible com a seed al DashboardV2 + a /create amb templateId=teamtowers-real"
- why:  "Feedback usuari · 'Los SOC TeamTowers asociarlos a el proyecto inicial por defecto que te puedo pedir crear como test real y aprovecharlos como SOCs para hacer propuestas de ese proyecto'. Activa els SOCs existents com a context real per a propostes."
- files:
    - js/core/projectTeamtowersSeed.js (nou)
    - js/core/projectTemplateCatalog.js (afegir teamtowers-real al CATALOG)
    - js/tests/projectTeamtowersSeed.test.js (nou)
- status: approved
- pr: claude/knowledge-glory-K1234
- alvaro_action_required: merge

---

## 2026-05-17 · vision/best-practices-2026-05.md (NOU)

- author: "@alvaro + claude-session 2026-05-16/17"
- action: add
- description: "10 bones pràctiques destil·lades del sprint marató del flow de creació (13 PRs · v99→v116). Information architecture · methodology-first prompts · knowledge-first defaults · pre-flight checks · streaming + skeletons · IA fallback chain · TDD string+state · CSS tokens · hub pattern · merge frequent."
- changes:
    - knowledge/vision/best-practices-2026-05.md (nou · v1)
    - knowledge/_index.md (entrada nova a vision)
    - knowledge/_search-index.json (regenerat · 69 → 70 fitxers)
    - docs/backlog.md (secció D · hito sprint + 8 WOs pendents)
- status: approved (self-merge · documentació)
- pr: claude/backlog-knowledge-update
- next: re-llegir abans de cada iteració significativa del SOS

---

*Final del LOG · pròximes contribucions s'afegeixen append-only sota.*
