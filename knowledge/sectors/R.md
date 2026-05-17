---
sector_id: R
sector_name: "Actividades Artísticas, Recreativas y de Entretenimiento"
sector_name_en: "Arts, Entertainment & Recreation"
cnae: "90-93"
cnae_official: "CNAE-2009 R · Actividades artísticas, recreativas y de entretenimiento (arts escèniques · creació literària · biblioteques · museus · patrimoni · joc d'atzar · esports · entreteniment recreatiu)"
version: "v131b"
agent_type: sector-context
roles_status: canonical
canonical_archetypes_source: "knowledge/sectors/R.md v131b · 9 rols per nivell casteller + skill_levels + 5 SOPs canonical · cobreix arts + esports + cultura + entreteniment"
tags: ["arts-escenicas", "música", "teatre", "dansa", "museus", "patrimoni", "biblioteca", "esports", "club-deportivo", "lliga-esportiva", "joc-atzar", "entreteniment-recreatiu", "festival", "promotor-musical"]

skill_level_taxonomy:
  junior: "0-2 anys · debut professional · supervisat · sense reconeixement extern"
  mid: "3-7 anys · cartera estable · gira/lliga regional · primera visibilitat"
  senior: "8-15 anys · headliner · primera división · referent del subsector"
  principal: "15+ anys · llegenda · membre comitè/jurat institucional · marca pròpia"

roles:
  - id: artistic_sporting_director
    name: "Director Artístic · Director Esportiu"
    castell_level: pom_de_dalt
    fmv_usd_h: 180
    typical_actor: "Director companyia · festival · museu · club esportiu · lliga"
    description: "Visió artística/esportiva · contractació talent · línia editorial · representació institucional."
    skill_levels:
      principal: ["lidera companyia/club amb pressupost > €5M", "membre jurats nacionals", "innovació programàtica"]

  - id: head_coach_artistic_director
    name: "Primer Entrenador · Director d'Escena"
    castell_level: tronc
    fmv_usd_h: 140
    typical_actor: "Entrenador club professional · director d'orquestra · director d'escena teatre"
    description: "Lidera execució dia a dia · plantilla/elenc · estratègia tàctica/escènica setmanal."
    skill_levels:
      mid: ["lidera equip 15-25 persones", "preparació partit/funció", "comunicació amb DT/director artistic"]
      senior: ["títols professionals · UEFA Pro · NBA Coach Cert", "gestió mediàtica", "transferència knowledge"]
      principal: ["llegenda esportiva/artística", "mentor altres entrenadors", "auditor mètode"]

  - id: performer_athlete
    name: "Jugador/a · Intèrpret · Artista"
    castell_level: pinya
    fmv_usd_h: 95
    typical_actor: "Jugador primera plantilla · solista · actriu · ballarina · cantant"
    description: "Producció central · entrena/assaja · executa partit/funció · projecció pública."
    skill_levels:
      junior: ["acabat de promoure · cantera · debut", "rutina entreno/assaig diari", "primer contacte mèdia"]
      mid: ["titular regular · 5-15 partits/funcions/temporada", "specialització rol", "fan base local"]
      senior: ["estrella d'equip/companyia", "transfer market · primer reclam", "marca personal"]
      principal: ["llegenda viva", "Hall of Fame / Premio Nacional", "advisor sectorial"]

  - id: youth_academy_apprentice
    name: "Jugador/a Cantera · Aprenent (formació)"
    castell_level: pinya
    fmv_usd_h: 35
    typical_actor: "Jove en formació · cantera · escola companyia"
    description: "Formació esportiva/artística · acadèmica · progressió cap a primera línia."
    skill_levels:
      junior: ["entrenament/assaig diari", "competició local", "formació académica paral·lela"]
      mid: ["promoció B-team", "primer contracte professional", "psicòleg + nutricionista"]

  - id: technical_staff_medical
    name: "Staff Tècnic · Servei Mèdic / Stage Manager"
    castell_level: laterals
    fmv_usd_h: 75
    typical_actor: "Fisio · metge esportiu · stage manager · regidor"
    description: "Suport tècnic · prevenció lesions · readaptació · logística escènica · backstage."
    skill_levels:
      junior: ["suport entreno/assaig", "logística material"]
      mid: ["responsable disciplina específica", "rehabilitació jugadors clau", "stage management funcions"]
      senior: ["cap de servei mèdic/tècnic", "presa decisions in-game", "lidera 3-8 tècnics"]

  - id: scout_dramaturg
    name: "Ojeador · Dramaturg · Comissari (curador)"
    castell_level: laterals
    fmv_usd_h: 90
    typical_actor: "Scout xarxa internacional · dramaturg · curator museu · selector festival"
    description: "Detecció talent · selecció repertori · narrativa exposició · scout rivals."
    skill_levels:
      mid: ["informes individuals", "cartera 50-200 referències"]
      senior: ["recommanació fitxatges €1M+", "cap de programa", "thought leader segment"]

  - id: federation_referee
    name: "Federació · Lliga · Àrbitre · Regulador"
    castell_level: laterals
    fmv_usd_h: 120
    typical_actor: "Federació esportiva · lliga · OAM · òrgan disciplinari · regulador joc d'atzar"
    description: "Marc reglament · calendari · sancions · validació compliance · supervisió circuit."
    skill_levels:
      principal: ["membre comitè FIFA/UEFA/COI", "regulació estatal", "comitès deontologia"]

  - id: comms_press_booking
    name: "Comunicació · Premsa · Booking"
    castell_level: mans
    fmv_usd_h: 60
    typical_actor: "Cap premsa · responsable xarxes · booking agent · community manager"
    description: "Rodes premsa · gestió crisi · xarxes socials · contractació gires · branding."
    skill_levels:
      junior: ["redacció notes premsa", "publicació xarxes"]
      mid: ["estratègia content", "rodes premsa club / artista mid-tier"]
      senior: ["responsable brand · marca pròpia · xarxes 100k+ followers", "negociació exclusives"]

  - id: fanbase_audience_sponsor
    name: "Afició · Públic · Patrocinador"
    castell_level: baixos
    fmv_usd_h: null
    typical_actor: "Soci · subscriptor · patrocinador (sponsor)"
    description: "Base econòmica i emocional · taquilla · botiga · ingressos drets · sentiment de pertinença."

sops_canonical:
  - id: sop-season-planning
    title: "Planificació temporada esportiva/artística"
    castell_level: pom_de_dalt
    description: "Calendari · plantilla/elenc · pressupost · objectius esportius/artístics · sponsors."
    steps_summary: "1-3 mesos · 8-12 stakeholders · gate anual"
  - id: sop-match-show-cycle
    title: "Cicle complet partit / funció"
    castell_level: tronc
    description: "Convocatòria · pre-event · execució · post-anàlisi · roda premsa · planificació següent."
    steps_summary: "3-7 dies · 6-10 stakeholders · cicle setmanal"
  - id: sop-transfer-signing
    title: "Fitxatge / Contractació talent"
    castell_level: laterals
    description: "Scouting · negociació representant · validació mèdica · contracte · presentació pública."
    steps_summary: "1-6 mesos · 5-8 stakeholders · finestres mercat"
  - id: sop-injury-rehab
    title: "Lesió i readaptació esportiu"
    castell_level: laterals
    description: "Diagnòstic · pla rehabilitació · seguiment fisio · alta funcional · reintegració."
    steps_summary: "setmanes-mesos · 3-5 stakeholders · key per a temporada"
  - id: sop-touring-production
    title: "Gira artística / temporada producció"
    castell_level: tronc
    description: "Booking sales · logística · tècnics gira · funcions · post-mortem · liquidació."
    steps_summary: "mesos · 8-15 stakeholders · projecte autocontingut"
---

## Contexto narrativo del sector

Sector R combina arts escèniques (teatre · dansa · música) · museus i patrimoni · biblioteques · esports professionals i recreatius · joc d'atzar. Models molt diversos · des de cooperatives artístiques (subvenció + autofinançament) fins clubs esportius professionals (drets TV · sponsors · taquilla) fins a institucions públiques (museus · biblioteques).

## Patrons de valor típics

- **Cicle entrenador↔jugador/director↔intèrpret** · instrucció ⇄ rendiment ⇄ feedback
- **Reciprocitat club/companyia↔afició/públic** · esforç ⇄ suport econòmic + emocional
- **Pipeline cantera→primer equip→venda/transferència** · multianyal
- **Cicle sponsor↔projecte** · finançament ⇄ visibilitat de marca
- **Patró federació↔competició/circuit** · regla ⇄ calendari ⇄ títols

## Intangibles clau

- Identitat de club/companyia (escut · valors · història)
- Confiança vestuari/elenc (cohesió crítica per resultats)
- Reputació esportiva/artística (Hall of Fame · premis)
- Sentit de pertinença (afició · subscripció vitalícia)
- Cultura formativa (model de joc/style transmès cantera→primer equip)
