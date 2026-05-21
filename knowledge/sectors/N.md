---
sector_id: N
sector_name: "Actividades Administrativas y Servicios Auxiliares"
sector_name_en: "Administrative & Support Service Activities"
cnae: "77-82"
cnae_official: "CNAE-2009 N · Actividades administrativas y servicios auxiliares (alquiler · ETT · agencias de viajes · seguridad · limpieza · servicios administrativos · BPO · call centers)"
version: "v131b"
agent_type: sector-context
roles_status: canonical
canonical_archetypes_source: "knowledge/sectors/N.md v131b · 7 rols per nivell casteller + skill_levels + 5 SOPs canonical · cobreix ETT + seguretat + neteja + BPO"
tags: ["ETT", "trabajo-temporal", "seguridad-privada", "limpieza", "agencias-viajes", "alquiler-equipos", "call-center", "BPO", "outsourcing", "servicios-auxiliares"]

skill_level_taxonomy:
  junior: "0-2 anys · operari/operador supervisat · sense titulació o FP grau mig"
  mid: "3-5 anys · coordinador d'equip · FP grau superior o experiència acreditada"
  senior: "6-10 anys · responsable d'àrea / sector · diplomatura + experiència"
  principal: "10+ anys · director operacions multi-client · grau + MBA executive típic"

roles:
  - id: operations_director
    name: "Director d'Operacions Multi-Compte"
    castell_level: pom_de_dalt
    fmv_usd_h: 130
    typical_actor: "Director ops · ETT/seguretat/neteja amb cartera multi-client"
    description: "Responsable P&L cartera · governança SLA · escalada de crisi · interacció comercial top-tier."
    skill_levels:
      principal: ["P&L > €10M facturació anual", "cartera multi-sector", "innovació tech (RPA · AI ops)"]

  - id: contract_account_manager
    name: "Cap de Compte · Contract Manager"
    castell_level: tronc
    fmv_usd_h: 75
    typical_actor: "Gerent contracte · interface diari amb client · responsable SLA"
    description: "Gestió contracte concret · SLA · facturació · escalat queixes · upsell."
    skill_levels:
      mid: ["contractes < €500k/any", "SLA basic · 4 KPIs", "reporting mensual"]
      senior: ["contractes > €1M/any · multi-site", "renegociació renovació", "cross-sell serveis addicionals"]

  - id: shift_supervisor
    name: "Supervisor de Torn · Cap d'Equip"
    castell_level: tronc
    fmv_usd_h: 38
    typical_actor: "Supervisor operatiu de torn (matí/tarda/nit)"
    description: "Planning torns · cobertura absentisme · qualitat servei · primer escalat incidències."
    skill_levels:
      junior: ["substitució puntual baixa", "rondes inspecció", "checklist diari"]
      mid: ["lidera equip 10-30 operaris", "selecció + onboarding bàsic", "resolució conflictes 1n nivell"]

  - id: operator_specialist
    name: "Operari/a Especialista (vigilant · netejador · operador call-center · administratiu)"
    castell_level: pinya
    fmv_usd_h: 18
    typical_actor: "Treballador de front-line · executa el servei contractat"
    description: "Executa el servei al lloc del client · seguretat · neteja · atenció telefònica · gestió administrativa bàsica."
    skill_levels:
      junior: ["competència bàsica del rol", "EPIs · normativa PRL", "primer atenció client"]
      mid: ["especialització (TIP vigilant · NEU netejador · multi-llengua call-center)", "autonomia tasques"]
      senior: ["referent equip (mentor)", "polivalent múltiples llocs", "feedback supervisor"]

  - id: hr_recruiter
    name: "Tècnic/a RRHH · Recruiter ETT"
    castell_level: laterals
    fmv_usd_h: 50
    typical_actor: "Tècnic selecció massiva (ETT) o gestor laboral"
    description: "Captació candidats · entrevistes · gestió contracta · nòmina · alta SS."
    skill_levels:
      junior: ["sourcing LinkedIn/InfoJobs", "entrevistes telefòniques", "alta contractes estàndard"]
      mid: ["selecció massiva 20-50 perfils/mes", "gestió incidències · baixes", "indicadors fill rate"]
      senior: ["responsable HR per compte gran", "negociació conveni col·lectiu", "auditoria Inspecció Treball"]

  - id: quality_inspector
    name: "Inspector/a Qualitat · Auditor de Servei"
    castell_level: laterals
    fmv_usd_h: 65
    typical_actor: "Auditor intern que verifica SLA al camp"
    description: "Inspeccions in-situ · checklist qualitat · informes al client · pla d'acció correctiva."
    skill_levels:
      mid: ["auditories regulars al camp", "informes a client", "ISO 9001 bàsic"]
      senior: ["lidera sistema qualitat ISO", "interacció client per renewal", "millora contínua Kaizen"]

  - id: client_corporate_buyer
    name: "Comprador Corporate del Client"
    castell_level: baixos
    fmv_usd_h: null
    typical_actor: "Procurement / Facility Manager del client final"
    description: "RFP procurement · negociació preus · validació SLA · facturació · escalat queixes."

sops_canonical:
  - id: sop-rfp-bidding
    title: "Procurement RFP · participació concurs"
    castell_level: pom_de_dalt
    description: "Anàlisi RFP · workload estimation · pricing · proposta tècnica · presentació · adjudicació."
    steps_summary: "3-8 setmanes · 5 stakeholders · gate comercial vital"
  - id: sop-shift-planning
    title: "Planificació torns mensual"
    castell_level: tronc
    description: "Càlcul cobertura SLA · vacances · baixes · publicació calendari · acceptació · ajustos."
    steps_summary: "mensual recurrent · 2-3 stakeholders · gestió massiva torns"
  - id: sop-incident-escalation
    title: "Escalat incident operatiu al client"
    castell_level: pinya
    description: "Detecció · primera resposta operari · escalat supervisor · contracte manager · client · resolució."
    steps_summary: "minuts-hores · 3-5 stakeholders · automatable amb alarmes"
  - id: sop-quality-audit
    title: "Auditoria qualitat in-situ"
    castell_level: laterals
    description: "Calendari auditories · check-list · visita · puntuació · informe client · pla acció."
    steps_summary: "mensual o trimestral · 2 stakeholders · base per renewal"
  - id: sop-mass-hiring-ett
    title: "Selecció massiva ETT (campanya)"
    castell_level: laterals
    description: "Requeriment client · publicació anuncis · cribbing · entrevistes · alta SS · onboarding."
    steps_summary: "1-3 setmanes · 4 stakeholders · KPI fill rate"
---

## Contexto narrativo del sector

Sector N agrupa serveis B2B operatius · ETT i selecció · seguretat privada · neteja industrial · agencies de viatge · BPO/call-center · administració auxiliar. Model intensiu en mà d'obra · marges baixos (5-15%) · escala = avantatge competitiu · convenis col·lectius determinants (sectorial · ETT · seguretat · neteja).

## Patrons de valor típics

- **Cicle compte gran↔contract manager** · SLA ⇄ qualitat ⇄ renovació anual
- **Pipeline RFP→adjudicació→delivery** · concurs ⇄ pricing tight ⇄ operació
- **Reciprocitat operari↔supervisor** · feedback ⇄ formació ⇄ promoció · ratio 10-30:1
- **Cicle inspecció qualitat↔client** · auditoria ⇄ informe ⇄ correctiva ⇄ confiança SLA

## Intangibles clau

- Fiabilitat operativa (zero failure = no notícia)
- Rotació personal baixa (cost contractació alt)
- Compliance laboral (Inspecció Treball · convenis vigents)
- Reputació · una incidència mediàtica pot eliminar contractes grans
