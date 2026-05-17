# Sectors CNAE Audit + Sector-Agent Evolution · v131 plan

> Audit dels 22 fitxers a `knowledge/sectors/*.md` · 8 errors crítics de mapping CNAE
> + evolució a "sector-agents" especialitzats que **complementin** el prompt VNA
> (no el contaminin com ara).

## TL;DR · què canvia

1. **8 fitxers tenen CNAE incorrecte** · K · L · M · N · Q · R + parcialment P · S
2. **Fix** · reassignació de continguts perquè el sector_id (lletra) coincideixi amb la taxonomia oficial CNAE-2009 Espanya
3. **Evolució** · cada `.md` esdevé un sector-agent amb frontmatter AGENT.md-style + seccions canòniques (rols per casteller + SOCs típics + SOPs adaptats + skill levels per rol)
4. **Loader nou** · `js/core/sectorAgentLoader.js` carrega i compon el sector-agent al prompt

## Audit · taula CNAE oficial vs actual

| Lletra | CNAE Espanya 2009 (oficial) | Codi | Fitxer actual diu | Estat |
|---|---|---|---|---|
| A | Agricultura, ganaderia, silvicultura, pesca | 01-03 | ✓ correcte | 🟢 |
| B | Indústries extractives | 05-09 | ✓ correcte | 🟢 |
| C | Industria manufacturera | 10-33 | ✓ correcte | 🟢 |
| D | Subministrament energia · gas · vapor | 35 | ✓ correcte | 🟢 |
| E | Subministrament aigua · sanejament · residus | 36-39 | ✓ correcte | 🟢 |
| F | Construcció | 41-43 | parcialment correcte (només lletra F al cnae:) | 🟡 |
| G | Comerç a l'engròs i al detall · reparació vehicles | 45-47 | ✓ correcte | 🟢 |
| H | Transport i emmagatzematge | 49-53 | ✓ correcte | 🟢 |
| I | Hostaleria | 55-56 | ✓ correcte (afegit "Turisme" no canonical però acceptable) | 🟢 |
| J | Informació i comunicacions | 58-63 | ✓ correcte | 🟢 |
| **K** | **Activitats financeres i d'assegurances** | **64-66** | ❌ diu "Telecomunicaciones, Programación Informática" | 🔴 |
| **L** | **Activitats immobiliàries** | **68** | ❌ diu "Activitats Financeres i d'Assegurances" (64-66) | 🔴 |
| **M** | **Activitats professionals · científiques · tècniques** | **69-75** | ❌ diu "Actividades Inmobiliarias" (68) | 🔴 |
| **N** | **Activitats administratives i serveis auxiliars** | **77-82** | ❌ diu "Actividades Profesionales, Científicas y Técnicas" (69-75) | 🔴 |
| O | Administració Pública i Defensa | 84 | ✓ correcte | 🟢 |
| **P** | **Educació** (no només K-12) | **85** | 🟡 diu "Educación Reglada (K-12)" · scope reduït | 🟡 |
| **Q** | **Activitats sanitàries i de serveis socials** | **86-88** | ❌ diu "Educación" | 🔴 |
| **R** | **Activitats artístiques · recreatives · entreteniment** | **90-93** | ❌ diu "Actividades Sanitarias y de Servicios Sociales" | 🔴 |
| **S** | **Altres serveis** | **94-96** | 🟡 diu "Otros Servicios" amb rang "90-96" (encara inclou 90-93 que és R) | 🟡 |
| T | Activitats de les llars com a empleadores | 97-98 | ✓ correcte | 🟢 |
| U(V) | Organismes extraterritorials | 99 | ✓ correcte (UV no canonical · només U a CNAE oficial) | 🟢 |

**Resum** · 6 errors crítics 🔴 + 3 parcials 🟡 + `construction.md` orfe (eliminable).

## Per què això CONTAMINA el prompt

Quan el VNA genera amb sector="M" pensa "Inmobiliarias" però la realitat és "Professional/Científic/Tècnic" (consultoria · abogados · arquitectes · enginyers · I+D · publicitat · etc.). Els arquetip de rol injectats són equivocats. El `domainDetector` v126/127 ja tenia el mateix bug arrossegat de `sectorRoleCatalog.R = Arts` (corregit a v127).

## Pla de correcció · v131a (aquest sprint)

### Step 1 · Fix YAML frontmatter dels 6 fitxers crítics 🔴

| Fitxer | Canvis al frontmatter |
|---|---|
| `K.md` | `sector_name: "Actividades Financieras y de Seguros"` · `cnae: "64-66"` · tags finance |
| `L.md` | `sector_name: "Actividades Inmobiliarias"` · `cnae: "68"` · tags real-estate |
| `M.md` | `sector_name: "Actividades Profesionales, Científicas y Técnicas"` · `cnae: "69-75"` · tags consultoria · enginyeria · I+D |
| `N.md` | `sector_name: "Actividades Administrativas y Servicios Auxiliares"` · `cnae: "77-82"` · tags ETT · seguretat · neteja |
| `Q.md` | `sector_name: "Actividades Sanitarias y de Servicios Sociales"` · `cnae: "86-88"` · tags salut · cures |
| `R.md` | `sector_name: "Actividades Artísticas, Recreativas y de Entretenimiento"` · `cnae: "90-93"` · tags arts · esports · entreteniment |

Els 3 🟡 ·
| `P.md` | scope expand · "Educación" general (85) · ja inclou K-12 |
| `S.md` | scope reduït · "Otros Servicios" (94-96) · 90-93 ja és R |
| `F.md` | afegir `cnae: "41-43"` complet |

Eliminar · `construction.md` orfe (duplicat amb F · sense YAML).

### Step 2 · Skills levels per role

Cada rol d'un sector tindrà un nou camp `skill_levels:` amb 4 nivells canonical ·
- **junior** · 0-2 anys · supervisat · executa amb guia
- **mid** · 3-5 anys · autònom · pot mentorar juniors
- **senior** · 6-10 anys · lidera projectes · representa el rol
- **principal** · 10+ anys · arquitecte/visionari · marca direcció estratègica

Cada nivell · descripció + skills requerides (3-5) + responsabilitats típiques.

### Step 3 · Estructura sector-agent (complementen, no contaminen)

Frontmatter nou ·
```yaml
---
id: sector-M               # canonical AGENT.md id
sector_id: M
sector_name: "Actividades Profesionales, Científicas y Técnicas"
cnae: "69-75"
sector_name_en: "Professional, Scientific & Technical Activities"
version: "v2.0"
agent_type: sector-context   # nou · diferencia dels agents legals/chain
purpose: "Proporcionar context sectorial al prompt VNA · NO substituir-lo"
casteller_archetypes:        # rols ordenats per nivell castell
  pom_de_dalt: [...]
  tronc: [...]
  pinya: [...]
  laterals: [...]
  mans: [...]
  baixos: [...]
canonical_socs:              # processos típics del sector
  - id: ...
    title: ...
    description: ...
sop_adaptations:             # ajustaments per al sector
  - process_kind: ...
    sector_specific_steps: [...]
tags: [...]
---
```

### Step 4 · `js/core/sectorAgentLoader.js` (nou)

API ·
- `loadSectorAgent(sectorId)` → carrega + parse + valida
- `buildSectorContextBlock(sectorId)` → genera text per injectar al prompt VNA
- `getRolesByCastellLevel(sectorId, level)` → rols filtrats per nivell castell
- `getSkillsForRole(sectorId, roleId, level)` → skills requerides al nivell

### Step 5 · Wire-up a `vnaExpertPrompts.js`

Quan `design-value-map-rich` rep un `sector` · es carrega `sector-{X}.md` i s'injecta el bloc canonical_archetypes + canonical_socs al prompt. **Complementa** (no contamina) el `domainDetection` existent.

## Plan v131b (sprint següent · no inclós aquí)

- Deep content rewrite · SOPs canòniques per sector
- Skills marketplace · vincle entre `skill_levels` + `/skills` view + WO assignment
- Sector quality rubric · "una consultora M té certs SOPs esperables"

## KISS commitment v131a

- Fix YAML frontmatter (no toquem contingut roles intern · v131b fa això)
- Afegir `skill_levels:` map a cada role
- Loader nou `sectorAgentLoader.js` · pure · testable
- Tests
- Total · ~600 LOC nous · 8 fitxers tocats al YAML
