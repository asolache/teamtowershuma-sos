---
sector_id: M
sector_name: "Actividades Profesionales, Científicas y Técnicas"
sector_name_en: "Professional, Scientific & Technical Activities"
cnae: "69-75"
cnae_official: "CNAE-2009 M · Actividades profesionales, científicas y técnicas (consultoría · abogados · arquitectos · ingenieros · I+D · publicidad · veterinaria)"
version: "v131b"
agent_type: sector-context
roles_status: canonical
canonical_archetypes_source: "knowledge/sectors/M.md v131b · 8 rols per nivell casteller + skill_levels + 5 SOPs canonical · cobreix consultoria + legal + arquitectura + I+D"
tags: ["consultoría", "abogados", "arquitectos", "ingenieros", "I+D", "publicidad", "veterinaria", "professional-services"]

skill_level_taxonomy:
  junior: "0-2 anys · supervisat · associate / consultant 1 / analista · titulació superior"
  mid: "3-5 anys · autònom · senior consultant / asociado / project manager · post-grau / MBA"
  senior: "6-10 anys · lidera projectes · principal / counsel / project director · referent extern"
  principal: "10+ anys · partner / socio / managing director · construir el negoci · client lead"

roles:
  - id: managing_partner
    name: "Managing Partner · Socio Director"
    castell_level: pom_de_dalt
    fmv_usd_h: 300
    typical_actor: "Soci de despatx · firma · estudi (consultoria · legal · arquitectura)"
    description: "Visió firma · captació clients clau · contractació partners · governança · representació externa."
    skill_levels:
      principal: ["construcció firma · M&A entre firmes", "key client lead > €1M facturació/any", "board governance"]

  - id: senior_partner_specialist
    name: "Partner Especialista (área pràctica)"
    castell_level: tronc
    fmv_usd_h: 220
    typical_actor: "Partner d'una vertical (tax · M&A · litigation · digital strategy · urbanism)"
    description: "Lidera vertical · captació projectes complexos · qualitat tècnica · mentoring senior team."
    skill_levels:
      senior: ["lidera projectes > €500k", "publicacions sectorials", "speaker conferences"]
      principal: ["recognised expert (Chambers · Legal500)", "marca personal", "industry advisor"]

  - id: senior_consultant_associate
    name: "Senior Consultant · Asociado · Senior Engineer"
    castell_level: tronc
    fmv_usd_h: 130
    typical_actor: "Senior 5-10 anys experiència · lidera workstreams"
    description: "Lidera workstreams de projecte · mentora juniors · interface diari amb client mid-management."
    skill_levels:
      mid: ["lidera workstream 1-3 persones", "presentació al client final", "scope management"]
      senior: ["lidera projecte multi-workstream", "negocia change requests", "P&L del projecte"]

  - id: consultant_associate
    name: "Consultant · Associate · Engineer"
    castell_level: pinya
    fmv_usd_h: 85
    typical_actor: "Mid 2-5 anys · executa anàlisis i deliverables sota supervisió"
    description: "Recerca · anàlisi quantitativa · model financer · drafts · execució amb supervisió mid-senior."
    skill_levels:
      junior: ["execució tasques amb molta supervisió", "Excel / SQL / Python bàsic", "drafts revisats x100%"]
      mid: ["execució autònoma de workstreams petits", "presentació interna", "tools sectorials (Tableau · PowerBI · AutoCAD · Revit)"]
      senior: ["mentora junior", "owns subworkstream", "primer contact amb mid-management client"]

  - id: analyst_junior
    name: "Analyst · Junior · Trainee"
    castell_level: pinya
    fmv_usd_h: 55
    typical_actor: "0-2 anys · acabat de graduar · supervisió intensa"
    description: "Recopila dades · suport recerca · format material · anàlisis bàsiques amb supervisió mid+."
    skill_levels:
      junior: ["Excel modeling", "fact gathering", "format slides", "supervisió ~80%"]

  - id: practice_qa_reviewer
    name: "QA Reviewer · Practice Lead / Quality Officer"
    castell_level: laterals
    fmv_usd_h: 175
    typical_actor: "Senior independent que revisa deliverables abans entrega client"
    description: "Quality assurance final · cleanup risk · validació metodologia · second opinion."
    skill_levels:
      senior: ["practice lead area especialitzada", "mentora 10+ professionals", "publicacions internes (intellectual capital)"]
      principal: ["chief knowledge officer", "quality framework firma", "interacció regulador"]

  - id: business_development
    name: "Business Development · Account Manager"
    castell_level: mans
    fmv_usd_h: 95
    typical_actor: "BD professional o partner amb forta orientació comercial"
    description: "Pipeline comercial · proposals · networking sectorial · relació compte clau · CRM."
    skill_levels:
      mid: ["proposals · RFPs", "qualifying leads", "CRM management"]
      senior: ["key account ownership", "C-level relationships", "thought leadership"]
      principal: ["chief revenue officer", "marketing strategy", "rebranding firma"]

  - id: client_corporate
    name: "Client Corporate · Stakeholder Final"
    castell_level: baixos
    fmv_usd_h: null
    typical_actor: "C-level · director · GM del client que rep el servei"
    description: "Paga honoraris · valida deliverables · pot recomanar o churn · NPS clau."

sops_canonical:
  - id: sop-rfp-proposal
    title: "RFP · Proposta comercial professional"
    castell_level: mans
    description: "Recepció RFP · qualifying · scoping intern · pricing · proposal · presentació · negociació SOW."
    steps_summary: "2-4 setmanes · 4-6 stakeholders · gate comercial"
  - id: sop-engagement-kickoff
    title: "Kickoff projecte professional · primeres 2 setmanes"
    castell_level: tronc
    description: "Mobilització equip · onboarding client · stakeholder map · workplan · baseline."
    steps_summary: "5-10 dies · 5-8 stakeholders · clau per success"
  - id: sop-deliverable-review
    title: "Cicle revisió i validació de deliverable"
    castell_level: laterals
    description: "Draft · revisió interna senior · QA reviewer · sanitisation · entrega · feedback client."
    steps_summary: "2-5 dies cada deliverable · 3 stakeholders · iteratiu"
  - id: sop-billing-monthly
    title: "Facturació mensual hours-based o fixed-fee"
    castell_level: mans
    description: "Tracking hores · validation partner · invoice · ageing · cobrament · IVA + IRPF."
    steps_summary: "mensual recurrent · 2 stakeholders + finance"
  - id: sop-engagement-closure
    title: "Tancament projecte · lessons learned + cross-sell"
    castell_level: pom_de_dalt
    description: "Final deliverable · NPS survey · debrief intern · proposta seguiment · retencií knowledge."
    steps_summary: "1-2 setmanes · 4 stakeholders · base per a recurrence"
---

## Contexto narrativo del sector

El sector M agrupa serveis intel·lectuals d'alt valor afegit · consultoria estratègica i operativa (Big 4 · MBB · boutiques) · serveis legals (despatxos · notari) · arquitectura i enginyeria · I+D · publicitat · veterinària. Model de negoci dominat per **billable hours · fixed-fee · success fee** · alta dependència del talent senior i de la reputació.

## Patrons de valor típics

- **Cicle partner↔client** · captació ⇄ proposal ⇄ engagement ⇄ delivery ⇄ recurrence
- **Pipeline analyst→associate→senior→partner** · 8-12 anys · up-or-out tradicional
- **Reciprocitat firma↔mercat** · publicacions/thought leadership ⇄ brand ⇄ pipeline
- **Cicle QA↔delivery** · draft ⇄ revisió ⇄ sanitisation ⇄ entrega
- **Mecanisme cross-sell** · 1 servei ⇄ relació ⇄ 2-N serveis sobre el mateix compte

## Intangibles clau

- Reputació firma (Chambers · Legal500 · MBB · Best Lawyers)
- Network senior partners (relacions C-level)
- Cultura · "client first · firm always" · "no surprises"
- Capital intel·lectual (metodologia pròpia · publicacions · IP)
