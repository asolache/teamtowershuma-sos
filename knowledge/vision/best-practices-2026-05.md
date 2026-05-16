---
id: best-practices-2026-05
type: vision
version: v1
status: live
author: "@alvaro + claude session 2026-05-16/17"
purpose: "Bones pràctiques destil·lades de la sessió marató del flow de creació (13 PRs #135-#147) · capturades aquí perquè no es perdin entre sprints i serveixin com a guia per a properes iteracions de qualsevol part del SOS."
keywords: [best-practices, ux, prompts, vna, verna-allee, testing, navigation, hub]
sos_context: critical
scope: universal
---

# Bones pràctiques · SOS V11 · Sprint marató creació (mai 2026)

> **Context** · sessió 2026-05-16/17 · 13 PRs (#135-#147) · v99→v116 · centrada en transformar el flow de creació de projecte de "template clone" a "experiència legendària amb IA real" alineada amb Verna Allee methodology.
>
> **Sentit d'aquest doc** · cada vegada que entres a iterar una part del SOS · llegeix-lo abans · perquè aquests patrons s'apliquen arreu (no només a la creació).

---

## 1 · Información architecture · "viatge del fundador"

### Patró
Agrupa destins per **verbs imperatius** que segueixen el viatge mental d'un fundador, no per categories tècniques (Foundation/Discovery/etc).

```
Crear · Treballar · Comptabilitzar · Connectar · Aprendre
```

5 grups, KISS, max 8 items per grup. La identitat (perfil/wallet/settings) viu **fora** dels grups principals com a avatar-menu a la dreta.

### Per què funciona
- L'usuari pensa "vull crear", no "estic a la fase Foundation"
- 5 grups encaben en navbar sense scroll horizontal
- Permet créixer (afegir items dins grups) sense replantejar IA
- Coincideix amb expectativa de productivitat moderna (Linear, Notion)

### Anti-patró evitat
**NO** mantenir 2 navbars (top + bottom) per "mobile-first vs desktop". Causa overlap (`/map` apareixent a ambdós), incongruència visual, manteniment doble. Millor: 1 navbar adaptable + (al PR-D) bottom-nav mobile dedicada amb mini-apps específiques per consumir, no per navegar.

### Aplicació futura
- Quan creïs noves vistes · sempre pregunta't a quin **verb** pertanyen
- Si una vista no encaixa als 5 grups · probablement és secundària (avatar menu) o cal repensar la seva raó d'existir

---

## 2 · Methodology-first prompts (Verna Allee)

### Patró
Els prompts a la IA han de **invocar explícitament la metodologia** que apliquem · no "fes un mapa de valor" sinó "com a consultora Verna Allee sènior · aplica els 5 principis sagrats".

```
COM CONSULTORA VERNA ALLEE SÈNIOR · ...

CONTEXT VNA del projecte (tot rellevant per al teu pensament Allee) ·
- Sector CNAE · {code}  ← determina nomenclatura + tipus de transaccions típics
- Fase lifecycle · {stage}  ← idea (descobriment) · mvp · validation · scale
- Entitat · {type}  ← organization · business · sos · project_internal

CRITERI VERNA ALLEE (per cada decisió pregunta't) ·
1. ROLES actors actius (no jobs)
2. TRANSACTIONS bidireccionals amb sentit
3. TANGIBLE vs INTANGIBLE (els intangibles MÉS importants per al sustain)
4. DELIVERABLES amb identitat pròpia (no "doc" · nom específic del domini)
5. PATTERN RECÍPROC · cap rol orfe · cap deliverable mort
```

### Per què funciona
- La IA està entrenada en Verna Allee · només cal **invocar-la per nom**
- Anotar cada paràmetre amb "què determina" guia el raonament IA
- Citar els 5 principis impedeix que la IA caigui en pattern de "departments lineals"

### Anti-patró evitat
**NO** passar `currentTemplate` com a seed amb noms genèrics ("founder", "operations", "creator"). La IA mantè el pattern · resultat sempre igual. Si necessites donar exemples · marca'ls **explícitament com "INSPIRACIÓ · NO copia · adapta"**.

### Aplicació futura
- Qualsevol task IA nova · pregunta't · quina metodologia subyacent? Cita-la al system prompt
- Si la IA sembla "creativa però genèrica" · revisa si el prompt està educant o reciclant

---

## 3 · Knowledge-first defaults (zero cost IA)

### Patró
**Abans** de demanar a la IA · pregunta't · puc trobar la resposta al `knowledge/` sense gastar tokens?

Exemple `sectorRoleCatalog.js` · 17 CNAE × 5 rols hardcodejats (CTO Founder per J · Cap d'Obra per F · Managing Partner per M...). S'apliquen com a baseline · després si hi ha API key la IA polish-eja damunt.

```
template default → catàleg sectorial (offline) → IA opt-in (online)
```

### Per què funciona
- L'usuari sense API key encara veu noms diferenciats per sector
- L'IA arriba a un baseline ric · pot crear "damunt" en lloc de "des de zero"
- Cost per crear projecte light → 0€ si hi ha catàleg ric

### Anti-patró evitat
**NO** assumir que la IA sempre estarà disponible. Tots els flows han de tenir fallback offline robust. Si no · usuari frustrat.

### Aplicació futura
- Quan dissenyes una nova funció IA · primer pensa "què puc precomputar al knowledge?"
- El catàleg JS pur sempre és més ràpid · més predictible · més barat

---

## 4 · Pre-flight checks abans d'IA

### Patró
Abans d'invocar IA · verifica precondicions (API key · context complet · pre-validation) i fes **fallback automàtic** amb toast informatiu.

```js
if (genMode === 'ai-driven') {
    const ok = await hasAnyApiKey();
    if (!ok) {
        toast({ kind: 'warning', text: 'Cap API key · canvio a template' });
        effectiveGenMode = 'template';
    }
}
```

### Per què funciona
- Mai un pipeline IA executa silenciosament sense resultats
- L'usuari sap exactament què passa (toast)
- Cap callback queda "esperant WOs que mai arriben"

### Aplicació futura
- Pattern reutilitzable per qualsevol nova feature IA · sempre pre-flight + toast + fallback

---

## 5 · Streaming events + skeletons amb hints

### Patró
Pipelines llargs (createProject IA-driven · 5-30s) han d'emetre events estructurats que la UI consumeix per omplir tabs preview gradualment.

```js
emit('classify', 'start', { sector, lifecycle_stage });
emit('match-socs', 'done', { selected, stats });
emit('generate-sops', 'start', { soc: relpath });
```

Skeletons amb **hints visuals del que vindrà** ("🏰 Castell apareixerà aquí · jerarquia 6 nivells") en lloc de "—" buit.

### Per què funciona
- L'usuari veu progrés constant · no espera amb pantalla buida
- Els hints eduquen mentre esperen
- Cap moment "pareix penjat"

### Aplicació futura
- Qualsevol async op >2s · streaming events + skeleton hint
- Mai posis "—" o "Loading..." · sempre "què apareixerà aquí"

---

## 6 · IA fallback chain amb logging

### Patró
Quan IA falla (payment_required · no api key · timeout) · NO catch silenciós. Sempre log + propaga via `onModelUsed({error, errorCode})`.

```js
catch (e) {
    _logError('generate-sops-from-soc', e);   // console.warn + onModelUsed
    return { sops: [], cost: 0, error: e?.message };
}
```

### Per què funciona
- L'usuari pot veure al console què va passar (debug)
- L'UI pot mostrar errors en lloc d'estar penjada
- L'orchestrator pot decidir retry amb fallback (template SOPs)

### Aplicació futura
- Qualsevol crida IA · log estructurat amb taskKind + errorCode + modelKey
- Categoritzar errors per code (`payment-required` · `no-api-key` · `timeout` · `parse-error`)

---

## 7 · TDD de string + state, no només lògica pura

### Patró
Tests TDD que validen el **codi font** amb regex (per UI/CSS/copy) i el **state transition** (per orchestrators) · no només funcions pures.

```js
// Codi font · UI promesa
ok('avatar dropdown té data-nav-group="identity"',
    navHtml.includes('data-nav-group="identity"'));

// State · pipeline streaming
ok('event "generate-sops" emès abans de "generate-wos"',
    idxGenSops < idxGenWos && idxGenSops >= 0);
```

### Per què funciona
- Detecta regressions de UI sense necessitat de browser
- Documenta el contracte de la implementació
- Resol "code review automatitzat" per a coses visuals importants

### Aplicació futura
- Cada feature nova · al menys 1 test que validi el contracte string-shape al codi font + 1 test funcional/state

---

## 8 · CSS variables tokens · escala consistent

### Patró (pendent · WO PR-C)
Centralitzar typography + spacing + colors a CSS variables `:root` · TOTS els views usen `var(--text-sm)` no `font-size: 0.85rem` hardcoded.

```css
:root {
    --text-xs: 0.7rem;
    --text-sm: 0.85rem;
    --text-md: 0.95rem;
    --text-lg: 1.15rem;
    --text-xl: 1.5rem;
    --space-1: 4px;
    --space-2: 8px;
    --space-3: 12px;
    --space-4: 16px;
    --space-6: 24px;
}
```

### Per què
- Visites antigues (SwarmFlow · NeuralPath · Accounting) tenen estils inline divergents
- Refactor d'una sola passa · totes les vistes coherents
- Permet temes (light/dark/colorblind) sense tocar cada vista

---

## 9 · Hub/dashboard pattern · 1 cop d'ull primer

### Patró
A qualsevol vista "hub" o dashboard · la primera zona ha de respondre 3 preguntes en <2s ·
1. **Què és això?** (nom + status badge)
2. **Què s'ha fet?** (mètriques clau · stats grid 5-6 cards)
3. **Quin és el next-best-action?** (CTA primary visible)

Veure `ProjectHubV2View._zone0_Legendary` per l'exemple del projecte hub.

### Per què funciona
- L'usuari amb 10 segons sap si pot tancar la pestanya tranquil o cal intervenir
- Reduiex anxietat operativa
- Convida a fer click on importa

### Aplicació futura
- Tota vista hub nova · zone 0 hero amb stats clau + CTA
- Mai obriment amb "Bienvenido" o paràgraf llarg

---

## 10 · Sprint marathon · merge frequent

### Patró observat
13 PRs en ~6h · cada un autocontingut · TDD verd · merge a main després de Netlify deploy preview.

Cada PR:
- 1 branca aïllada
- 1 sol focus clar al títol
- BUILD_STAMP bump per a debug cache
- Tests nous + smoke regressions
- Comentari de PR amb "abans/després" si UI

### Per què funciona
- Cada merge dóna feedback ràpid (deploy live en ~2 min)
- Si quelcom es trenca · rollback granular
- L'usuari pot provar incrementalment

### Aplicació futura
- Mantenir aquest ritme: petit + frequent + green > gran + lent + risk
- TDD primer · arquitectura blindada · després UI

---

## Pendents · backlog "no oblidis"

Veure `docs/backlog.md` secció D · llistat de WOs prioritzats que han sortit d'aquesta sessió ·

1. `wo-knowledge-index-scope-002` · separar brand-specific SOPs als knowledge metadatats
2. `wo-mobile-mini-apps-PR-D` · launcher mobile amb mini-apps de model recurrent
3. `wo-hub-tabs-integration` · `/hub/{id}` 7 tabs DRY com `/learn`
4. `wo-vna-prompts-evidence-loop` · IA cita sector_role_examples a outputs
5. `wo-prompts-sector-deeper` · sub-sectors CNAE 2 dígits
6. `wo-quality-board-realtime` · cross-projects rubric trend
7. `wo-design-tokens-refactor` · escala typography centralitzada
8. `wo-onboarding-momentum` · tutorial inline al primer projecte

---

## Filosofia operativa

**El SOS V11 és un sistema viu, no un producte.** Cada bug que l'usuari reporta és un test que faltava. Cada fix s'enregistra al knowledge perquè la propera iteració no l'oblidi.

> "El TDD no es un coste · es la velocitat sostenible."
