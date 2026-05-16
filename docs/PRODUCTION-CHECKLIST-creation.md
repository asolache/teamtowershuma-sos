# Production Test Checklist · Flux de creació de projecte

> Última actualització · v107 (PR-E0 critical fixes)
>
> Aquest checklist cobreix el flux complet d'un usuari nou que crea el seu primer projecte. Executa cada bloc al deploy de Netlify (sosteamtowers.netlify.app o similar) i marca ✓/✗ segons el resultat.

---

## A · Empty state + onboarding

| # | Pas | Esperat | Resultat |
|---|-----|---------|----------|
| A1 | Visitar `/home` sense projectes (incògnit) | CTA visible "Crear primer projecte" | ☐ |
| A2 | Click al CTA → arriba a `/create` | Form visible, wizard collapsible al top | ☐ |
| A3 | Form sense wizard · escriure nom `Test` (3 chars min) + descripció lliure + submit | No error · pipeline arrenca | ☐ |

---

## B · Wizard (descobriment del tipus de projecte)

| # | Pas | Esperat | Resultat |
|---|-----|---------|----------|
| B1 | `/create` → Q1 click "Organització" | Q2 apareix amb 5 cards (coop/assoc/ONG/fundació/colla) | ☐ |
| B2 | Q2 click "Cooperativa" | Pill verd "Configuració aplicada" · form auto-omple selects | ☐ |
| B3 | Botó "salta →" del wizard | El bloc wizard es plega · form segueix funcional | ☐ |
| B4 | Q2 + Q1 amb 4 combinacions diferents (org+coop · biz+SL · sos+federat · intern+pilot) | Configs diferents per cada (ambition + vna_zoom + genMode) | ☐ |

---

## C · Mode `template` (sense IA · offline)

| # | Pas | Esperat | Resultat |
|---|-----|---------|----------|
| C1 | Selecciona "template" al select Mode generació · submit | Pipeline síncron a `/create` mostra steps · redirect a `/hub/{id}` | ☐ |
| C2 | A `/hub/{id}` · veure ProjectHub | Zones poblades · canvas/pitch/roles visibles | ☐ |
| C3 | Anar a `/quality?project={id}` | Score ≥85 · gold · rubric 12 criteris verds | ☐ |
| C4 | Anar a `/map?project={id}` | Mapa de valor amb 5 rols + 5 transactions | ☐ |

---

## D · Mode `ai-driven` (streaming)

| # | Pas | Esperat | Resultat |
|---|-----|---------|----------|
| D1 | **PR-E0 fix A2** · Mode `ai-driven` SENSE API key configurada | Toast warning · fallback automàtic a template · NO encalla | ☐ |
| D2 | Anar a `/settings` · afegir 1 API key (anthropic preferit) | Save OK | ☐ |
| D3 | Tornar a `/create` · Mode `ai-driven` · submit | Redirect a `/create-live` | ☐ |
| D4 | `/create-live` · veure 4 tabs omplint-se | Events stream · pipeline dots avancen · quality gauge actualitza | ☐ |
| D5 | Al final · barra fixa amb 4 CTAs (Kanban · Mapa · Quality · Hub) | Tots els links naveguen al projecte creat | ☐ |
| D6 | **PR-E0 fix A1** · `/create-live` refresh F5 al mig del flow | Toast warning · redirect automàtic a `/create` | ☐ |
| D7 | **PR-E0 fix A1** · `/create-live` deep-link directe (sense sessionStorage) | Igual que D6 · NO pantalla buida encallada | ☐ |
| D8 | **PR-E0 fix B1** · mode ai-driven amb IA que falla a generar SOPs | Score encara ≥70 · SOCs amb checklist sop_ref vàlid (no orphans) | ☐ |

---

## E · Navbar V3 (navbar única · 5 grups)

| # | Pas | Esperat | Resultat |
|---|-----|---------|----------|
| E1 | Top-navbar visible · 5 grups (Crear · Treballar · Comptabilitzar · Connectar · Aprendre) | Dropdowns funcionen amb hover/click | ☐ |
| E2 | Bottom-nav NO present | Ni al desktop ni al mobile | ☐ |
| E3 | Project pill visible quan `?project=` actiu | Click navega a `/hub/{id}` | ☐ |
| E4 | Search box top-right · escriure `canvas` + Enter | Navega a `/canvas` | ☐ |
| E5 | Search box · escriure paraula no-destí + Enter | Navega a `/learn?q=...` (fallback) | ☐ |
| E6 | **PR-E0 fix C2** · Cmd+K (Mac) o Ctrl+K (Win) | Focus al search input | ☐ |
| E7 | **PR-E0 fix C2** · Cmd+K + navegar 5 pàgines + Cmd+K | Encara funciona 1 sol cop · no triggers múltiples | ☐ |
| E8 | Avatar `👤 ▾` dropdown · 5 items (me · identity · wallet · settings · design) | Tots naveguen correctament | ☐ |

---

## F · Mobile (320-720px width)

| # | Pas | Esperat | Resultat |
|---|-----|---------|----------|
| F1 | DevTools · viewport 360x800 | Navbar wraps en 2 línies · search ocult · grups visibles | ☐ |
| F2 | Click dropdown grup "Crear" al mobile | Menu apareix posicionat (no overflow horitzontal) | ☐ |
| F3 | `/create` al mobile | Form usable · selects accessibles · botó submit visible | ☐ |
| F4 | `/create-live` al mobile | 4 tabs accessibles · sidebar quality+cost+log apilada sota | ☐ |

---

## G · Learn hub (subhub coneixement)

| # | Pas | Esperat | Resultat |
|---|-----|---------|----------|
| G1 | `/learn` · veure tabs | 3-7 tabs disponibles (depèn de si PR-B #138 mergejat) | ☐ |
| G2 | Tab "Roadmaps" · click rol "Visioner" | 6 lectures ordenades amb links | ☐ |
| G3 | Tab "Cerca" · escriure `castell` + Enter | Resultats apareixen | ☐ |
| G4 | Tab "Knowledge" / "Carpetas" · veure 6 carpetes | Cada una té docs llistats | ☐ |

---

## H · Audit qualitat post-creació

| # | Pas | Esperat | Resultat |
|---|-----|---------|----------|
| H1 | `/quality?project={id}` · score visible | Gauge gold/silver/bronze segons rubric | ☐ |
| H2 | 12 criteris visibles amb status (✓/✘) | Cada criteri amb explicació | ☐ |
| H3 | Integrity 7 regles · 0 errors esperat per template | Tots verds | ☐ |
| H4 | "🧠 Omplir amb IA" botó per criteri amb gap | Click → IA pot enriquir aquell dim | ☐ |

---

## I · Knowledge persistència

| # | Pas | Esperat | Resultat |
|---|-----|---------|----------|
| I1 | Tancar pestanya després d'un projecte creat · obrir-ne una nova | Projecte segueix accessible a `/projects` | ☐ |
| I2 | Mode incògnit | El projecte NO apareix (local-first · cada navegador té el seu KB) | ☐ |

---

## Bugs trobats durant el test

> Llista aquí qualsevol issue trobat amb path + screenshot si pots.

| Bloc | Pas | Descripció | Severitat |
|------|-----|------------|-----------|
| - | - | - | - |

---

## Cobertura TDD per cada fix

| Fix | TDD test | Status |
|-----|----------|--------|
| A1 · sessionStorage redirect | `creationFlowCriticalFixes.test.js` blocs A1 | ✓ |
| A2 · pre-flight API key | `creationFlowCriticalFixes.test.js` blocs A2 | ✓ |
| B1 · SOC fallback sense IA | `creationFlowCriticalFixes.test.js` blocs B1 | ✓ |
| C2 · Cmd+K no-acumulació | `creationFlowCriticalFixes.test.js` blocs C2 | ✓ |

Run amb · `node js/tests/creationFlowCriticalFixes.test.js`
