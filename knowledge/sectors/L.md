---
sector_id: L
sector_name: "Actividades Inmobiliarias"
sector_name_en: "Real Estate Activities"
cnae: "68"
cnae_official: "CNAE-2009 L · Actividades inmobiliarias (compra-venta, alquiler, gestión, tasación, intermediación)"
version: "v131b"
agent_type: sector-context
roles_status: canonical
canonical_archetypes_source: "knowledge/sectors/L.md v131b · 6 rols per nivell casteller + skill_levels + 5 SOPs canonical"
tags: ["inmobiliario", "real-estate", "promotor", "property-management", "alquiler", "tasacion", "proptech", "REIT", "construcción"]

skill_level_taxonomy:
  junior: "0-2 anys · supervisat · titulació API o arquitectura tècnica · COAPI/COAATB"
  mid: "3-5 anys · autònom · cartera 50-200 actius o 10-30 transaccions/any"
  senior: "6-10 anys · lidera projectes promoció > €5M · cartera HNW"
  principal: "10+ anys · arquitecte estratègia · membre comitè inversió REIT/SOCIMI"

roles:
  - id: promotor_developer
    name: "Promotor Inmobiliari"
    castell_level: pom_de_dalt
    fmv_usd_h: 150
    typical_actor: "Empresari · CEO promotora · SOCIMI"
    description: "Origina projectes · adquisició sòl · financiació · construcció · comercialització · assumeix risc global."
    skill_levels:
      principal: ["estructuració financiera (deute + equity)", "membre consell SOCIMI", "land banking"]

  - id: property_manager
    name: "Property Manager · Gestor Patrimonial"
    castell_level: tronc
    fmv_usd_h: 75
    typical_actor: "Gestor de cartera lloguers · administrador comunitats"
    description: "Gestió actius en lloguer · contractes · manteniment · relació inquilins · optimització yield."
    skill_levels:
      junior: ["administració contractes", "atenció inquilins", "petits desperfectes"]
      mid: ["cartera 80-200 vivendes", "renovació amb pujada IPC", "petites obres"]
      senior: ["cartera build-to-rent > 500 unitats", "optimització yield 0.5-1%", "team lead"]
      principal: ["asset management institucional", "exit strategy", "ESG framework GRESB"]

  - id: real_estate_agent
    name: "Agente Inmobiliari · Comercial"
    castell_level: pinya
    fmv_usd_h: 60
    typical_actor: "API o agent comercial xarxes (Engel & Völkers · Tecnocasa)"
    description: "Captació immobles · valoració · venda i lloguer · publicitat · acompanyament client."
    skill_levels:
      junior: ["captació zona local", "fotografia immoble", "primers tour amb client"]
      mid: ["cartera 30-50 immobles", "tancament 5-15 operacions/any", "MLS exclusivitats"]
      senior: ["luxury > €1M operacions", "international clients", "broker associate"]
      principal: ["partner agència", "expansió zona", "training xarxa franquícies"]

  - id: valuation_expert
    name: "Taxador · Valoración Inmobiliaria"
    castell_level: laterals
    fmv_usd_h: 90
    typical_actor: "Arquitecte tècnic homologat (Tinsa · Sociedad Tasación · Krata)"
    description: "Taxació hipotecària · ECO 805 · valoracions per a comptes anuals · arbitratge."
    skill_levels:
      junior: ["taxació residencial estàndard", "ARGOS/Sigma software", "OAT"]
      mid: ["taxacions terciari (oficines · logística)", "valoracions DCF", "ECO 805 expert"]
      senior: ["RICS · Royal Institution of Chartered Surveyors", "due diligence portfolios > €50M"]
      principal: ["responsable tècnic societat taxació", "validació metodologia (ATASA)", "interacció BdE/CNMV"]

  - id: technical_director
    name: "Director Tècnic · Project Manager d'Obra"
    castell_level: tronc
    fmv_usd_h: 110
    typical_actor: "Arquitecte o enginyer ICCP coordinant promoció"
    description: "Coordinació projecte tècnic · llicències · pressupost obra · qualitat · entrega DTD."
    skill_levels:
      junior: ["seguiment d'obra petita", "actes setmanals", "BIM bàsic"]
      mid: ["coordinació promoció 30-100 vivendes", "control qualitat (CTE)", "PEM/PEC"]
      senior: ["lidera promoció > €10M PEM", "negociació constructora", "valor enginyeria"]
      principal: ["director tècnic empresa · cartera múltiple", "BIM-LOD400 governance", "DfMA"]

  - id: legal_admin
    name: "Servei Jurídic Immobiliari · Gestoria"
    castell_level: mans
    fmv_usd_h: 70
    typical_actor: "Advocat especialista · gestor administratiu"
    description: "Contractes · notaria · registre propietat · llicències · gestió hipotecària."
    skill_levels:
      junior: ["redacció contractes lloguer", "primer registre", "consulta cadastre"]
      mid: ["arres · compraventa · subrogació hipoteca", "LOE/CTE", "comunitats propietat"]
      senior: ["assessoria promocions", "lletjor litigis", "due diligence due"]
      principal: ["soci responsable real-estate", "transaccions M&A · portfolio deals"]

  - id: tenant_owner
    name: "Inquilino · Comprador"
    castell_level: baixos
    fmv_usd_h: null
    typical_actor: "Particular o empresa que lloga o compra immoble"
    description: "Demanda final · paga rent o compra · NPS · churn risk (mobilitat)."

sops_canonical:
  - id: sop-due-diligence-acquisition
    title: "Due diligence adquisició immoble"
    castell_level: laterals
    description: "Verificació jurídica · tècnica · urbanística · ambiental · pressupost · negociació final."
    steps_summary: "3-6 setmanes · 5 stakeholders · key gate de la inversió"
  - id: sop-rental-cycle
    title: "Cicle complet lloguer · captació a entrega claus"
    castell_level: pinya
    description: "Captació · publicitat · visites · selecció inquilí · contracte · entrega · garantia."
    steps_summary: "2-8 setmanes · 3 stakeholders · recurrent"
  - id: sop-promotion-full-cycle
    title: "Promoció completa · sòl a entrega claus"
    castell_level: pom_de_dalt
    description: "Compra sòl · projecte · llicències · construcció · comercialització · entrega · postventa."
    steps_summary: "24-48 mesos · 8-12 stakeholders · projecte major"
  - id: sop-valuation-eco-805
    title: "Taxació hipotecària ECO 805"
    castell_level: laterals
    description: "Visita · estudi mercat · comparables · informe · validació interna · entrega banc."
    steps_summary: "3-7 dies · 2 stakeholders · regulat ECO 805/2003"
  - id: sop-property-mgmt-monthly
    title: "Gestió mensual cartera lloguers"
    castell_level: tronc
    description: "Cobraments · incidències · revisions IPC · reportes propietari · accions impagament."
    steps_summary: "mensual recurrent · 2-3 stakeholders · escalable"
---

## Contexto narrativo del sector

El sector L integra promoció · gestió patrimonial · intermediació i tasació. A Espanya és altament regulat (BdE per a tasacions ECO 805 · Llei d'Habitatge · IBI municipal). Diferenciació clara entre **residencial** · **terciari** (oficines/logística/retail) · **REIT/SOCIMI** institucional.

## Patrons de valor típics

- **Cicle promotor↔constructor** · projecte ⇄ execució DTD ⇄ pagament per fases
- **Reciprocitat property mgr↔inquilí** · servei ⇄ rent ⇄ NPS ⇄ renovació
- **Pipeline agent→tancament** · captació ⇄ visita ⇄ negociació ⇄ escriptura
- **Cicle taxador↔banca** · valoració ⇄ hipoteca ⇄ regulació BdE

## Intangibles clau

- Confiança comprador/inquilí (transacció gran · sensible)
- Reputació promotora (qualitat entregada vs promesa)
- Network local (sòl off-market · pre-vendes)
- Certificacions ESG (GRESB · BREEAM · LEED · clau institucional)
