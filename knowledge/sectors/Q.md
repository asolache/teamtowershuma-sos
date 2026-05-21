---
sector_id: Q
sector_name: "Actividades Sanitarias y de Servicios Sociales"
sector_name_en: "Human Health & Social Work Activities"
cnae: "86-88"
cnae_official: "CNAE-2009 Q · Actividades sanitarias y de servicios sociales (hospitales · medicina general · especialistas · servicios sociales con/sin alojamiento · residencias · atención a domicilio · cures)"
version: "v131b"
agent_type: sector-context
roles_status: canonical
canonical_archetypes_source: "knowledge/sectors/Q.md v131b · 8 rols per nivell casteller + skill_levels + 5 SOPs canonical · cobreix hospital + clínica + residència + SAD"
tags: ["sanidad", "hospital", "clínica", "medicina", "enfermería", "servicios-sociales", "residencia", "SAD", "atencion-domiciliaria", "salud-mental", "cures", "geriatría", "rehabilitación"]

skill_level_taxonomy:
  junior: "0-2 anys post-titulació · residència MIR/EIR · BIR/PIR · supervisat"
  mid: "3-5 anys post-residència · adjunt jove · autònom amb especialitat"
  senior: "6-15 anys · responsable d'unitat · supervisor torn · coordinador àmbit"
  principal: "15+ anys · cap de servei · director mèdic · principal investigador"

roles:
  - id: medical_director
    name: "Director/a Mèdic/a · Cap d'Hospital"
    castell_level: pom_de_dalt
    fmv_usd_h: 220
    typical_actor: "Director hospital/clínica · responsable mèdic global"
    description: "Estratègia clínica · contractació especialistes · qualitat assistencial · interacció administració sanitària."
    skill_levels:
      principal: ["lidera hospital > 200 llits", "interacció ministeri/conselleria salut", "acreditacions JCI/QH"]

  - id: head_of_service
    name: "Cap de Servei (especialitat)"
    castell_level: tronc
    fmv_usd_h: 160
    typical_actor: "MD cap d'una especialitat (cardiologia · UCI · cirurgia · pediatria · etc.)"
    description: "Lidera equip especialistes · sessions clíniques · protocols · interconsultes · ensenyament MIR."
    skill_levels:
      senior: ["lidera 5-15 facultatius · 2-5 residents", "investigació clínica", "publicacions H-index"]
      principal: ["referent estatal de l'especialitat", "guidelines nacionals", "comitè scientific societats"]

  - id: physician_specialist
    name: "Metge/ssa Especialista · Adjunt"
    castell_level: tronc
    fmv_usd_h: 120
    typical_actor: "Especialista després de la residència (MIR)"
    description: "Consulta · planta · guàrdies · interconsultes · sessions clíniques · ensenyament."
    skill_levels:
      junior: ["adjunt jove post-MIR", "consulta supervisada", "primera guàrdia"]
      mid: ["consulta autònoma · 3-5 anys", "subespecialització", "publicacions"]
      senior: ["referent unitat", "lidera línea recerca", "professor associat universitat"]

  - id: nurse_specialist
    name: "Infermer/a · Tècnic/a Cures"
    castell_level: pinya
    fmv_usd_h: 50
    typical_actor: "EIR · infermer/a especialitzat (UCI · quirúrgica · pediàtrica · comunitària)"
    description: "Aplicació pla cures · medicació · monitorització · educació pacient · suport família."
    skill_levels:
      junior: ["cures bàsiques planta", "medicació supervisada", "primeres guàrdies"]
      mid: ["EIR · especialitat · cartera 8-12 pacients", "tècniques específiques", "tutor pràctiques"]
      senior: ["supervisor torn · 15-30 infermeres", "auditoria cures", "implementació protocols"]
      principal: ["director infermeria centre", "gestió plantilla 100+", "innovació practice (telecures · IA)"]

  - id: physiotherapist_rehab
    name: "Fisioterapeuta · Rehabilitador"
    castell_level: pinya
    fmv_usd_h: 55
    typical_actor: "Fisioterapeuta · terapeuta ocupacional · logopeda"
    description: "Avaluació funcional · pla rehabilitació · sessions · seguiment · alta funcional."
    skill_levels:
      junior: ["tècniques bàsiques · supervisat", "cartera 6-10 pacients/dia"]
      mid: ["especialitat (neurològica · esportiva · sòl pelvià)", "cartera autònoma 15-20/dia"]
      senior: ["lidera unitat · 3-8 fisios", "investigació clínica aplicada", "docència universitat"]

  - id: social_worker
    name: "Treballador/a Social Sanitari"
    castell_level: laterals
    fmv_usd_h: 48
    typical_actor: "Trabajador social hospital · CSMA · residència · serveis socials"
    description: "Avaluació social · gestió alta complexa · derivacions · prestacions · acompanyament família."
    skill_levels:
      junior: ["entrevista família", "gestió alta amb suport", "coneixement prestacions bàsiques"]
      mid: ["lidera casos complexos", "interacció serveis socials base", "famílies multi-problemàtiques"]
      senior: ["coordinació pluridisciplinar", "supervisió equip", "tutor pràctiques"]

  - id: caregiver_residence
    name: "Cuidador/a · Auxiliar (residència · SAD)"
    castell_level: mans
    fmv_usd_h: 16
    typical_actor: "Gerocultor/a · auxiliar SAD · cuidador familiar contractat"
    description: "Higiene · alimentació · mobilització · companyia · primer detector de canvis · ratio 6-12 usuaris."
    skill_levels:
      junior: ["FP grau mig atenció persones · ratio supervisat 1:6", "EPIs · PRL", "primer auxili bàsic"]
      mid: ["cartera assignada 8-12 usuaris", "comunicació amb família", "Plan Atenció Individual (PAI)"]
      senior: ["referent torn · 15-25 usuaris", "formadora nouvinguts", "lidera incidències complexes"]

  - id: patient_family
    name: "Pacient / Família · Beneficiari/a"
    castell_level: baixos
    fmv_usd_h: null
    typical_actor: "Persona que rep atenció + entorn proper que decideix i acompanya"
    description: "Receptor servei · drets sanitaris · co-decisió · feedback satisfacció · queixes."

sops_canonical:
  - id: sop-admission-discharge
    title: "Ingrés i alta hospitalària planificada"
    castell_level: pinya
    description: "Admissió · valoració inicial · pla cures · evolució diària · alta amb informe · seguiment AP."
    steps_summary: "1-15 dies · 5-8 stakeholders · procés core"
  - id: sop-clinical-pathway
    title: "Cicle assistencial complet (patologia X)"
    castell_level: tronc
    description: "Diagnòstic · estadiatge · tractament · seguiment · alta funcional · revisió periòdica."
    steps_summary: "mesos-anys · 4-6 stakeholders · variant per patologia"
  - id: sop-pai-residencia
    title: "Pla Atenció Individual (PAI) en residència"
    castell_level: laterals
    description: "Valoració geriàtrica · objectius PAI · pla cures · revisions trimestrals · ajustos."
    steps_summary: "trimestral revisió · 4 stakeholders · core residencial"
  - id: sop-emergency-triage
    title: "Triatge urgències"
    castell_level: tronc
    description: "Rebuda · classificació Manchester · derivació circuit · primeres proves · destí (alta · ingrés · trasllat)."
    steps_summary: "30 min-4h · 5-7 stakeholders · alta freqüència"
  - id: sop-sad-home-visit
    title: "Visita SAD diària/setmanal"
    castell_level: mans
    description: "Ruta · check inicial · cures · acompanyament · registre · escalat si canvi."
    steps_summary: "1h per usuari · 1-2 stakeholders · rutes diàries"
---

## Contexto narrativo del sector

Sector Q integra atenció sanitària (hospital · clínica · CAP) i serveis socials (residència · SAD · CRAE · CSMA · CRD). Alta regulació (Ministeri Salut · Conselleries · Inspecció · acreditacions JCI). Models públic · concertat · privat · cooperatiu. Diferenciació crítica entre **agut** (hospital) · **crònic** (atenció primària) · **dependència** (residència · SAD).

## Patrons de valor típics

- **Cicle pacient↔equip clínic** · síntoma ⇄ diagnòstic ⇄ tractament ⇄ seguiment
- **Reciprocitat sanitari↔cuidador familiar** · informació ⇄ co-cures domiciliàries
- **Pipeline MIR/EIR→adjunt→cap servei** · 6-15 anys · piràmide formativa
- **Cicle SAD/residència↔administració** · servei ⇄ prestació econòmica ⇄ supervisió

## Intangibles clau

- Confiança pacient↔professional (compliance terapèutic)
- Continuïtat assistencial (mateix metge/infermera al llarg del temps)
- Confidencialitat (LOPD sanitària · histori clínica)
- Cultura de seguretat (incidents reportables · M&M · errors no censurats)
- Compassió + tècnica (no només eficiència · also dignitat)
