---
sector_id: K
sector_name: "Actividades Financieras y de Seguros"
sector_name_en: "Financial & Insurance Activities"
cnae: "64-66"
cnae_official: "CNAE-2009 K · Actividades financieras y de seguros (servicios financieros · seguros, reaseguros y fondos de pensiones · actividades auxiliares)"
version: "v131b"
agent_type: sector-context
roles_status: canonical
canonical_archetypes_source: "knowledge/sectors/K.md v131b · 6 rols per nivell casteller + skill_levels + 5 SOPs canonical"
tags: ["finanzas", "banca", "seguros", "fintech", "inversion", "riesgo", "credito", "wealth-management", "asset-management"]

skill_level_taxonomy:
  junior: "0-2 anys · supervisat · executa amb guia · certificacions inicials (MiFID II básico, EFA)"
  mid: "3-5 anys · autònom · cartera propia mitjana · pot mentorar juniors"
  senior: "6-10 anys · lidera transaccions complexes · representa el rol al regulador · CFA / FRM / ACT"
  principal: "10+ anys · arquitecte risc · membre comitè inversió · marca direcció estratègica"

roles:
  - id: cio_inversion_director
    name: "CIO · Chief Investment Officer"
    castell_level: pom_de_dalt
    fmv_usd_h: 280
    typical_actor: "Director d'inversions de banc · gestora · família office"
    description: "Defineix asset allocation · marca tolerància al risc institucional · representa al regulador en estratègia."
    skill_levels:
      principal: ["asset allocation multi-classe", "comitè risc estratègic", "gestió € >500M AuM"]

  - id: portfolio_manager
    name: "Portfolio Manager · Gestor de Cartera"
    castell_level: tronc
    fmv_usd_h: 145
    typical_actor: "Gestor d'una estratègia (equity · fixed income · alternatius)"
    description: "Implementa l'asset allocation · selecció securities · monitoring diari · attribution analysis."
    skill_levels:
      junior: ["análisi fonamental bàsic", "Bloomberg/Refinitiv", "compliance MiFID II"]
      mid: ["construcció cartera multi-asset", "risk budgeting", "factor investing"]
      senior: ["lideratge equip 3-5 gestors", "presentacions al CIO", "negociació primary broker"]
      principal: ["disseny mandats institucionals", "rebalançament strategic", "innovation alpha"]

  - id: risk_analyst
    name: "Analista de Riesgos · Risk Manager"
    castell_level: laterals
    fmv_usd_h: 95
    typical_actor: "Risk officer back-office · second-line of defense"
    description: "Models VaR · stress test · límits per cartera · valida exposicions abans d'execució."
    skill_levels:
      junior: ["càlcul VaR paramètric", "extracció dades core banking", "report regulatori bàsic"]
      mid: ["stress test escenaris adversos", "models PD/LGD crèdit", "ALM bàsic"]
      senior: ["aprovació transaccions > €10M", "auditoria interna", "FRM/PRM cert"]
      principal: ["CRO · membre ALCO", "marc apetit risc grup", "interacció ECB/SRB"]

  - id: relationship_manager
    name: "Relationship Manager · Banker de Clients"
    castell_level: pinya
    fmv_usd_h: 110
    typical_actor: "Banker o broker amb cartera de clients HNW o corporate"
    description: "Custòdia cartera clients · venda creuada productes · cobertura proactiva · NPS."
    skill_levels:
      junior: ["onboarding clients · KYC", "venda assegurances bàsiques", "cita objectiva"]
      mid: ["cartera 50-150 clients", "venda fons + estructurats", "anàlisi fiscal patrimonial"]
      senior: ["cartera HNW > €1M AuM/client", "structuring corporate finance", "team lead"]
      principal: ["wealth management UHNW", "family office governance", "complex tax planning internacional"]

  - id: underwriter_actuary
    name: "Suscriptor · Actuari (assegurances)"
    castell_level: tronc
    fmv_usd_h: 120
    typical_actor: "Actuari assegurances vida · no-vida · reasseguradora"
    description: "Pricing pòlisses · tarificació · provisions tècniques · solvency II."
    skill_levels:
      junior: ["pricing pòlisses estàndard", "GLM básic", "report tècnic"]
      mid: ["pricing pòlisses complexes", "modelling reservas", "Solvency II SCR"]
      senior: ["lidera línea producte", "interacció reasseguradores", "FIA · ASA cert"]
      principal: ["chief actuary", "model intern Solvency II", "innovació producte (parametric · cyber)"]

  - id: compliance_officer
    name: "Compliance · Cumplimiento Normatiu"
    castell_level: laterals
    fmv_usd_h: 90
    typical_actor: "Compliance officer · MLRO · advisor regulatori"
    description: "Vigilància AML/CFT · suitability MiFID II · PRIIPs · interacció amb supervisor."
    skill_levels:
      junior: ["screening AML llistes", "training intern compliance", "report SARs"]
      mid: ["lidera revisions periòdiques", "documentació MiFID II", "transaction monitoring"]
      senior: ["MLRO · Money Laundering Reporting Officer", "auditoria SEPBLAC/CNMV", "review productes"]
      principal: ["Chief Compliance Officer", "interacció ECB/BdE/CNMV/DGSFP", "ethics & culture"]

  - id: ops_settlement
    name: "Operacions · Settlement & Custòdia"
    castell_level: mans
    fmv_usd_h: 55
    typical_actor: "Back-office liquidació · custòdia · corporate actions"
    description: "Execució post-trade · matching · settlement T+1/T+2 · reconciliació · corporate actions."
    skill_levels:
      junior: ["matching trades", "settlement T+2", "Bloomberg AIM básic"]
      mid: ["resolució trade breaks", "corporate actions exòtiques", "fail management"]
      senior: ["lidera equip operacions · 5-15 persones", "millora processos", "Murex/Calypso config"]
      principal: ["COO mid-office", "digitalització · DLT (Fnality · ISO 20022)"]

  - id: client_retail
    name: "Client Retail · Estalviador"
    castell_level: baixos
    fmv_usd_h: null
    typical_actor: "Particular o petita empresa amb compte i productes bàsics"
    description: "Receptor de productes · paga comissions · sensibilitat NPS · churn risk."

sops_canonical:
  - id: sop-onboarding-kyc
    title: "Onboarding KYC client nou"
    castell_level: pinya
    description: "Recollida documentació · screening AML · classificació MiFID · activació compte."
    steps_summary: "5-8 dies · 4 stakeholders · regulatori"
  - id: sop-portfolio-rebalance
    title: "Rebalançament trimestral cartera"
    castell_level: tronc
    description: "Revisió drift vs target · proposta ajustos · validació risk · execució · attribution."
    steps_summary: "1-2 dies · 3 stakeholders · 1 cop/trim"
  - id: sop-claim-assegurances
    title: "Gestió siniestre · pagament a l'assegurat"
    castell_level: pinya
    description: "Notificació siniestre · perit · valoració · validació compliance · pagament o rebuig."
    steps_summary: "10-30 dies · 4 stakeholders · varies x línia producte"
  - id: sop-risk-stress-test
    title: "Stress test trimestral cartera"
    castell_level: laterals
    description: "Definició escenaris adversos · simulació · informe CRO · presentació ALCO."
    steps_summary: "1 setmana · 3 stakeholders · trimestral"
  - id: sop-aml-screening
    title: "Screening AML/CFT continu"
    castell_level: laterals
    description: "Llistes sanctions · transaction monitoring · alertes · escalat MLRO · report SARs."
    steps_summary: "diari + onboarding · automatitzable amb regla compliance"
---

## Contexto narrativo del sector

El sector K (Activitats Financeres i d'Assegurances) integra banca · gestió d'actius · assegurances i serveis auxiliars. És altament regulat (ECB · CNMV · DGSFP a Espanya · ESMA · EIOPA a EU) · amb forta divisió entre front-office (RM · PM · underwriter) · middle-office (risk · compliance) i back-office (ops · settlement).

## Patrons de valor típics

- **Cicle RM↔client** · cobertura proactiva ⇄ NPS + venda creuada ⇄ AuM growth
- **Cicle PM↔risc** · proposta inversió ⇄ validació límits ⇄ execució ⇄ attribution
- **Reciprocitat banca↔regulador** · compliance proactiu ⇄ llicència operativa ⇄ pressió capital
- **Pipeline junior→senior** · 6-10 anys + certificacions (CFA · FRM · EFA · ACT)

## Intangibles clau

- Confiança del client (informació sensible · diners)
- Reputació amb regulador (zero multes · interacció proactiva)
- Cultura de risc (no només compliance · also-prevenció)
- Capital humà certificat (CFA · FRM · EFA · ACT · FIA)
