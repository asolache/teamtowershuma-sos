#!/usr/bin/env node
// =============================================================================
// TEAMTOWERS SOS V11 — v145b · enrich-domain-packs · script one-shot
// Ruta · /scripts/enrich-domain-packs-v145b.mjs
//
// Continuació de v145 · enriqueix els 20 packs restants de domainDetector.js
// amb `deliverables_tangible` + `transactions_canonical` específics per a
// cada sector. Idempotent · si el pack ja té els camps · skip.
//
// Ús · node scripts/enrich-domain-packs-v145b.mjs
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FILE = path.join(ROOT, 'js/core/domainDetector.js');

// ── Enrichments · 20 packs · 5-8 deliverables + 5 transactions cada un ───
const ENRICH = {
    'edu-formation': {
        deliverables_tangible: [
            'Pla pedagògic anual', 'Calendari escolar', 'Acta assemblea trimestral',
            'Informe d\'avaluació individual', 'Reglament intern centre',
            'Pressupost cooperativa', 'Quota mensual família', 'Conveni amb administració',
        ],
        transactions_canonical: [
            { from: 'teacher',          to: 'student',         deliverable: 'Sessió pedagògica',          type: 'intangible',frequency: 'daily',    trigger: 'classe diària' },
            { from: 'teacher',          to: 'family',          deliverable: 'Informe avaluació individual',type: 'tangible',  frequency: 'quarterly',trigger: 'final trimestre' },
            { from: 'family',           to: 'admin-staff',     deliverable: 'Quota mensual',              type: 'tangible',  frequency: 'monthly',  trigger: 'factura emesa' },
            { from: 'pedagogical-team', to: 'general-assembly',deliverable: 'Pla pedagògic anual',        type: 'tangible',  frequency: 'yearly',   trigger: 'planificació curs' },
            { from: 'evaluator',        to: 'pedagogical-team',deliverable: 'Validació pedagògica',       type: 'tangible',  frequency: 'yearly',   trigger: 'auditoria externa' },
        ],
    },
    'religious-community': {
        deliverables_tangible: [
            'Programa litúrgic mensual', 'Sermó setmanal', 'Pla pastoral anual',
            'Quota voluntària / donatiu', 'Acta consell pastoral',
            'Memòria pastoral anual', 'Calendari celebracions', 'Activitats caritatives',
        ],
        transactions_canonical: [
            { from: 'spiritual-leader', to: 'community-member', deliverable: 'Sermó setmanal',         type: 'intangible',frequency: 'weekly',    trigger: 'servei religiós' },
            { from: 'community-member', to: 'admin-treasurer',  deliverable: 'Quota / donatiu',        type: 'tangible',  frequency: 'monthly',   trigger: 'captació mensual' },
            { from: 'liturgical-team',  to: 'community-member', deliverable: 'Cerimònia litúrgica',    type: 'intangible',frequency: 'weekly',    trigger: 'culte programat' },
            { from: 'mentor-spiritual', to: 'community-member', deliverable: 'Acompanyament pastoral', type: 'intangible',frequency: 'on-demand', trigger: 'sol·licitud individual' },
            { from: 'pastoral-council', to: 'spiritual-leader', deliverable: 'Pla pastoral anual',     type: 'tangible',  frequency: 'yearly',    trigger: 'planificació' },
        ],
    },
    'political-movement': {
        deliverables_tangible: [
            'Manifest fundacional', 'Pla d\'acció trimestral', 'Comunicat de premsa',
            'Recursos legals · denúncia', 'Conveni amb aliats', 'Aportació militant',
            'Programa electoral', 'Reglament intern',
        ],
        transactions_canonical: [
            { from: 'assembly',          to: 'spokesperson',       deliverable: 'Mandat polític',          type: 'intangible',frequency: 'quarterly', trigger: 'decisió assembleària' },
            { from: 'spokesperson',      to: 'press-team',         deliverable: 'Comunicat premsa',        type: 'tangible',  frequency: 'weekly',    trigger: 'acció pública' },
            { from: 'militant-active',   to: 'assembly',           deliverable: 'Treball militant',        type: 'intangible',frequency: 'weekly',    trigger: 'assemblea ordinària' },
            { from: 'sympathizer',       to: 'militant-active',    deliverable: 'Aportació econòmica',     type: 'tangible',  frequency: 'monthly',   trigger: 'campanya quota' },
            { from: 'legal-support',     to: 'institution-target', deliverable: 'Denúncia / recurs',       type: 'tangible',  frequency: 'on-demand', trigger: 'vulneració detectada' },
        ],
    },
    'art-collective': {
        deliverables_tangible: [
            'Obra original', 'Catàleg exposició', 'Convocatòria oberta',
            'Memòria projecte', 'Conveni amb galeria', 'Subvenció pública',
            'Pla anual col·lectiu', 'Espai-residència',
        ],
        transactions_canonical: [
            { from: 'member-artist',         to: 'artistic-coordinator',deliverable: 'Obra original',       type: 'tangible',  frequency: 'on-demand', trigger: 'final producció' },
            { from: 'artistic-coordinator',  to: 'curator',             deliverable: 'Catàleg exposició',   type: 'tangible',  frequency: 'per-show',  trigger: 'muntatge expo' },
            { from: 'curator',               to: 'gallery-buyer',       deliverable: 'Comissariat venda',   type: 'intangible',frequency: 'per-sale',  trigger: 'transacció col·leccionista' },
            { from: 'institutional-grant',   to: 'artistic-coordinator',deliverable: 'Subvenció pública',   type: 'tangible',  frequency: 'yearly',    trigger: 'resolució convocatòria' },
            { from: 'community-host',        to: 'member-artist',       deliverable: 'Espai-residència',    type: 'tangible',  frequency: 'monthly',   trigger: 'acord residència' },
        ],
    },
    'worker-coop': {
        deliverables_tangible: [
            'Acta assemblea anual', 'Aportació al capital social', 'Pla de viabilitat',
            'Conveni laboral intern', 'Avantatge resultats anual', 'Informe auditoria social',
            'Pla d\'adhesió soci', 'Estatuts cooperatius',
        ],
        transactions_canonical: [
            { from: 'general-assembly',  to: 'governing-board',  deliverable: 'Mandat estratègic',         type: 'intangible',frequency: 'yearly',    trigger: 'assemblea ordinària' },
            { from: 'worker-member',     to: 'general-assembly', deliverable: 'Treball + aportació capital',type:'tangible', frequency: 'monthly',   trigger: 'vincle societari' },
            { from: 'governing-board',   to: 'worker-aspiring',  deliverable: 'Pla d\'adhesió soci',       type: 'tangible',  frequency: 'on-demand', trigger: 'prova vincle' },
            { from: 'client-customer',   to: 'worker-member',    deliverable: 'Compra / contracte servei', type: 'tangible',  frequency: 'daily',     trigger: 'venda' },
            { from: 'auditor-internal',  to: 'general-assembly', deliverable: 'Informe auditoria social',  type: 'tangible',  frequency: 'yearly',    trigger: 'final exercici' },
        ],
    },
    'research-lab': {
        deliverables_tangible: [
            'Paper revisat per parells', 'Pre-print arXiv/bioRxiv', 'Dataset obert',
            'Codi reproduïble (Zenodo)', 'Sol·licitud beca H2020/ERC',
            'Informe progrés trimestral', 'Tesi doctoral', 'Patent / spin-off',
        ],
        transactions_canonical: [
            { from: 'principal-investigator',to: 'phd-student',            deliverable: 'Direcció tesi',           type: 'intangible',frequency: 'weekly',    trigger: 'reunió tutor' },
            { from: 'phd-student',           to: 'principal-investigator', deliverable: 'Resultats experimentals', type: 'tangible',  frequency: 'monthly',   trigger: 'review mensual' },
            { from: 'research-engineer',     to: 'lab-manager',            deliverable: 'Codi reproduïble + dataset',type:'tangible',frequency: 'on-demand', trigger: 'publicació pending' },
            { from: 'principal-investigator',to: 'peer-reviewer',          deliverable: 'Paper submission',        type: 'tangible',  frequency: 'on-demand', trigger: 'revisió cega' },
            { from: 'funding-agency',        to: 'principal-investigator', deliverable: 'Beca finançament',        type: 'tangible',  frequency: 'yearly',    trigger: 'resolució convocatòria' },
        ],
    },
    'food-coop': {
        deliverables_tangible: [
            'Comanda setmanal cistella', 'Albarà entrega', 'Factura producte fresc',
            'Acta assemblea alimentària', 'Pla de cultivars / forn', 'Inspecció sanitària',
            'Conveni distribució', 'Llistat preus de temporada',
        ],
        transactions_canonical: [
            { from: 'producer-farm',     to: 'distribution-coord', deliverable: 'Albarà entrega',         type: 'tangible',  frequency: 'weekly',    trigger: 'collita setmanal' },
            { from: 'distribution-coord',to: 'consumer-member',    deliverable: 'Cistella setmanal',      type: 'tangible',  frequency: 'weekly',    trigger: 'comanda confirmada' },
            { from: 'consumer-member',   to: 'distribution-coord', deliverable: 'Pagament setmanal',      type: 'tangible',  frequency: 'weekly',    trigger: 'entrega rebuda' },
            { from: 'sanitary-inspection',to: 'producer-farm',     deliverable: 'Inspecció + certificat', type: 'tangible',  frequency: 'yearly',    trigger: 'auditoria anual' },
            { from: 'baker-craftsperson',to: 'consumer-member',    deliverable: 'Pa fresc artesà',        type: 'tangible',  frequency: 'daily',     trigger: 'obertura forn' },
        ],
    },
    'health-clinic': {
        deliverables_tangible: [
            'Historial clínic electrònic (HCE)', 'Recepta mèdica', 'Informe d\'alta',
            'Sol·licitud d\'analítica', 'Programació cita',
            'Factura mútua / asseguradora', 'Pla de cures infermeria',
            'Protocol clínic actualitzat',
        ],
        transactions_canonical: [
            { from: 'patient',           to: 'admin-receptionist', deliverable: 'Cita programada',       type: 'tangible',  frequency: 'daily',     trigger: 'sol·licitud usuari' },
            { from: 'physician-primary', to: 'patient',            deliverable: 'Visita + recepta',      type: 'tangible',  frequency: 'per-visit', trigger: 'cita complerta' },
            { from: 'physician-primary', to: 'specialist',         deliverable: 'Derivació + informe',   type: 'tangible',  frequency: 'on-demand', trigger: 'sospita diagnòstica' },
            { from: 'nurse',             to: 'patient',            deliverable: 'Pla de cures',          type: 'intangible',frequency: 'daily',     trigger: 'hospitalització' },
            { from: 'health-insurance',  to: 'admin-receptionist', deliverable: 'Factura cobrada',       type: 'tangible',  frequency: 'monthly',   trigger: 'prestació autoritzada' },
        ],
    },
    'hotel-hospitality': {
        deliverables_tangible: [
            'Reserva confirmada', 'Check-in / check-out registry', 'Comanda F&B',
            'Factura final hoste', 'Pla de neteja diari', 'Informe ocupació mensual',
            'Conveni canal OTA', 'Pla turístic territorial',
        ],
        transactions_canonical: [
            { from: 'ota-channel',  to: 'front-desk',  deliverable: 'Reserva confirmada',   type: 'tangible',  frequency: 'daily',     trigger: 'booking online' },
            { from: 'front-desk',   to: 'guest',       deliverable: 'Check-in + claus',     type: 'tangible',  frequency: 'per-stay',  trigger: 'arribada hoste' },
            { from: 'housekeeping', to: 'guest',       deliverable: 'Habitació neta',       type: 'intangible',frequency: 'daily',     trigger: 'servei diari' },
            { from: 'kitchen-fb',   to: 'guest',       deliverable: 'Servei restauració',   type: 'tangible',  frequency: 'per-meal',  trigger: 'comanda à la carte' },
            { from: 'guest',        to: 'front-desk',  deliverable: 'Pagament factura',     type: 'tangible',  frequency: 'per-stay',  trigger: 'check-out' },
        ],
    },
    'construction': {
        deliverables_tangible: [
            'Projecte d\'execució', 'Llicència d\'obres', 'Pla de seguretat i salut',
            'Certificat fi d\'obra', 'Comanda de materials', 'Acta d\'inspecció',
            'Pressupost partida', 'Factura mensual obra',
        ],
        transactions_canonical: [
            { from: 'architect',          to: 'site-manager', deliverable: 'Projecte d\'execució',    type: 'tangible',  frequency: 'on-demand', trigger: 'inici obra' },
            { from: 'site-manager',       to: 'worker-mason', deliverable: 'Ordre de treball diària', type: 'intangible',frequency: 'daily',     trigger: 'planning matí' },
            { from: 'supplier-materials', to: 'site-manager', deliverable: 'Comanda + albarà',        type: 'tangible',  frequency: 'weekly',    trigger: 'sol·licitud obra' },
            { from: 'safety-officer',     to: 'worker-mason', deliverable: 'Formació prevenció',      type: 'intangible',frequency: 'monthly',   trigger: 'pla anual seguretat' },
            { from: 'client-owner',       to: 'site-manager', deliverable: 'Pagament partida',        type: 'tangible',  frequency: 'monthly',   trigger: 'certificació mensual' },
        ],
    },
    'coworking': {
        deliverables_tangible: [
            'Quota mensual soci', 'Acord d\'ús d\'espai', 'Pla d\'esdeveniments',
            'Factura facility services', 'Memòria activitats anual',
            'Reglament d\'ús', 'Conveni corporate partner', 'Programa d\'activacions comunitat',
        ],
        transactions_canonical: [
            { from: 'member-coworker',    to: 'community-manager',deliverable: 'Quota mensual',              type: 'tangible',  frequency: 'monthly',   trigger: 'subscripció recurrent' },
            { from: 'community-manager',  to: 'member-coworker',  deliverable: 'Pla esdeveniments + xarxa',  type: 'intangible',frequency: 'weekly',    trigger: 'programació setmanal' },
            { from: 'event-host',         to: 'community-manager',deliverable: 'Activació esdeveniment',     type: 'intangible',frequency: 'monthly',   trigger: 'agenda mensual' },
            { from: 'cleaning-services',  to: 'space-founder',    deliverable: 'Servei neteja',              type: 'tangible',  frequency: 'daily',     trigger: 'contracte facility' },
            { from: 'corporate-partner',  to: 'space-founder',    deliverable: 'Conveni partnership',        type: 'tangible',  frequency: 'yearly',    trigger: 'acord anual' },
        ],
    },
    'ecommerce': {
        deliverables_tangible: [
            'Comanda online', 'Albarà transport', 'Devolució autoritzada',
            'Pla de campanyes marketing', 'Catàleg de producte', 'Factura proveïdor',
            'Informe vendes setmanal', 'Tendència de stock',
        ],
        transactions_canonical: [
            { from: 'customer',           to: 'operations-fulfill', deliverable: 'Comanda online',          type: 'tangible',  frequency: 'daily',     trigger: 'checkout' },
            { from: 'operations-fulfill', to: 'customer',           deliverable: 'Albarà + tracking',       type: 'tangible',  frequency: 'per-order', trigger: 'expedició' },
            { from: 'supplier',           to: 'operations-fulfill', deliverable: 'Estocs + factura',        type: 'tangible',  frequency: 'weekly',    trigger: 'reposició inventari' },
            { from: 'customer-support',   to: 'customer',           deliverable: 'Resolució incidència',    type: 'intangible',frequency: 'daily',     trigger: 'ticket obert' },
            { from: 'marketing-growth',   to: 'ceo-founder',        deliverable: 'Pla campanyes',           type: 'tangible',  frequency: 'monthly',   trigger: 'planning mensual' },
        ],
    },
    'community-media': {
        deliverables_tangible: [
            'Programació setmanal', 'Notícia publicada', 'Podcast / programa',
            'Conveni patrocini', 'Resolució subvenció pública', 'Pla editorial trimestral',
            'Acord d\'aparicions', 'Memòria activitats anual',
        ],
        transactions_canonical: [
            { from: 'editor-in-chief',     to: 'reporter-journalist',deliverable: 'Encàrrec editorial',  type: 'tangible',  frequency: 'daily',     trigger: 'planning redacció' },
            { from: 'reporter-journalist', to: 'editor-in-chief',    deliverable: 'Notícia / reportatge',type: 'tangible',  frequency: 'daily',     trigger: 'entrega' },
            { from: 'show-host',           to: 'audience-listener',  deliverable: 'Programa setmanal',   type: 'intangible',frequency: 'weekly',    trigger: 'emissió en directe' },
            { from: 'sponsor-advertiser',  to: 'editor-in-chief',    deliverable: 'Conveni patrocini',   type: 'tangible',  frequency: 'yearly',    trigger: 'renovació contracte' },
            { from: 'public-grant',        to: 'editor-in-chief',    deliverable: 'Resolució subvenció', type: 'tangible',  frequency: 'yearly',    trigger: 'convocatòria pública' },
        ],
    },
    'housing-coop': {
        deliverables_tangible: [
            'Quota mensual ús/cessió', 'Acord d\'adhesió soci', 'Pla de manteniment edifici',
            'Acta assemblea anual', 'Estatuts cooperatius',
            'Préstec / hipoteca col·lectiva', 'Reglament d\'ús', 'Memòria econòmica',
        ],
        transactions_canonical: [
            { from: 'resident-member',      to: 'general-assembly-h', deliverable: 'Aportació + treball',  type: 'tangible',  frequency: 'monthly',   trigger: 'vincle societari' },
            { from: 'general-assembly-h',   to: 'governing-council',  deliverable: 'Mandat anual',         type: 'intangible',frequency: 'yearly',    trigger: 'assemblea ordinària' },
            { from: 'commission-maintenance',to: 'resident-member',   deliverable: 'Manteniment edifici',  type: 'tangible',  frequency: 'weekly',    trigger: 'pla anual' },
            { from: 'architect-tech',       to: 'governing-council',  deliverable: 'Auditoria tècnica',    type: 'tangible',  frequency: 'yearly',    trigger: 'revisió periòdica' },
            { from: 'bank-finance',         to: 'general-assembly-h', deliverable: 'Préstec col·lectiu',   type: 'tangible',  frequency: 'yearly',    trigger: 'contracte hipoteca' },
        ],
    },
    'energy-coop': {
        deliverables_tangible: [
            'Auditoria energètica', 'Instal·lació solar', 'Factura cooperativa',
            'Conveni amb ajuntament', 'Llicència regulatòria',
            'Pla quinquennal energètic', 'Informe d\'emissions CO2', 'Memòria assemblea anual',
        ],
        transactions_canonical: [
            { from: 'tech-installer',       to: 'member-prosumer',  deliverable: 'Instal·lació solar',          type: 'tangible',  frequency: 'on-demand', trigger: 'contracte signat' },
            { from: 'member-prosumer',      to: 'energy-coordinator',deliverable: 'Aportació + factura mensual',type:'tangible', frequency: 'monthly',   trigger: 'vincle societari' },
            { from: 'regulator',            to: 'energy-coordinator',deliverable: 'Llicència regulatòria',      type: 'tangible',  frequency: 'yearly',    trigger: 'renovació anual' },
            { from: 'grid-operator',        to: 'member-prosumer',  deliverable: 'Excedents abocats',            type: 'tangible',  frequency: 'monthly',   trigger: 'producció solar' },
            { from: 'town-hall',            to: 'energy-coordinator',deliverable: 'Conveni municipal',          type: 'tangible',  frequency: 'yearly',    trigger: 'acord polític' },
        ],
    },
    'legal-advisory': {
        deliverables_tangible: [
            'Dictamen jurídic', 'Recurs administratiu', 'Demanda judicial',
            'Memòria d\'assumpte', 'Factura d\'honoraris',
            'Contracte de serveis', 'Pla d\'estratègia processal', 'Informe d\'auditoria legal',
        ],
        transactions_canonical: [
            { from: 'client',         to: 'senior-lawyer',    deliverable: 'Encàrrec d\'assumpte',   type: 'tangible',  frequency: 'on-demand', trigger: 'sol·licitud client' },
            { from: 'senior-lawyer',  to: 'junior-associate', deliverable: 'Tasca delegada',         type: 'intangible',frequency: 'weekly',    trigger: 'planning equip' },
            { from: 'paralegal',      to: 'senior-lawyer',    deliverable: 'Investigació documental',type: 'tangible',  frequency: 'daily',     trigger: 'sol·licitud caso' },
            { from: 'senior-lawyer',  to: 'judge-tribunal',   deliverable: 'Demanda / recurs',       type: 'tangible',  frequency: 'on-demand', trigger: 'litigation' },
            { from: 'client',         to: 'managing-partner', deliverable: 'Pagament honoraris',     type: 'tangible',  frequency: 'monthly',   trigger: 'factura mensual' },
        ],
    },
    'artisan-craft': {
        deliverables_tangible: [
            'Peça artesanal única', 'Encàrrec a mida', 'Conveni amb galeria',
            'Curs / taller obert', 'Catàleg d\'obra', 'Certificat d\'autenticitat',
            'Factura venda directa', 'Memòria taller anual',
        ],
        transactions_canonical: [
            { from: 'master-craftsperson',to: 'apprentice',          deliverable: 'Formació / mentoring',  type: 'intangible',frequency: 'daily',     trigger: 'taller obert' },
            { from: 'craftsperson',       to: 'customer-direct',     deliverable: 'Peça artesanal',        type: 'tangible',  frequency: 'on-demand', trigger: 'encàrrec' },
            { from: 'customer-direct',    to: 'master-craftsperson', deliverable: 'Pagament + agraïment',  type: 'tangible',  frequency: 'per-piece', trigger: 'entrega' },
            { from: 'gallery-shop',       to: 'master-craftsperson', deliverable: 'Comissió venda',        type: 'tangible',  frequency: 'monthly',   trigger: 'liquidació' },
            { from: 'craft-association',  to: 'master-craftsperson', deliverable: 'Certificat autenticitat',type:'tangible',frequency: 'yearly',    trigger: 'revisió anual' },
        ],
    },
    'public-admin': {
        deliverables_tangible: [
            'Ple municipal · acta', 'Pressupost anual aprovat', 'Llicència / permís',
            'Ordenança municipal', 'Resolució d\'expedient', 'Memòria d\'activitats',
            'Conveni amb associacions', 'Informe d\'auditoria pública',
        ],
        transactions_canonical: [
            { from: 'mayor-leader',       to: 'department-head', deliverable: 'Mandat polític',     type: 'intangible',frequency: 'monthly',   trigger: 'prioritats consell' },
            { from: 'civil-servant',      to: 'citizen-resident',deliverable: 'Llicència / permís', type: 'tangible',  frequency: 'on-demand', trigger: 'sol·licitud ciutadana' },
            { from: 'citizen-resident',   to: 'civic-association',deliverable: 'Participació veïnal',type:'intangible',frequency: 'monthly',   trigger: 'assemblea barri' },
            { from: 'opposition-party',   to: 'mayor-leader',    deliverable: 'Control crític',     type: 'intangible',frequency: 'monthly',   trigger: 'ple ordinari' },
            { from: 'state-supervision',  to: 'mayor-leader',    deliverable: 'Informe d\'auditoria',type:'tangible',  frequency: 'yearly',    trigger: 'revisió comptes' },
        ],
    },
    'ngo-humanitarian': {
        deliverables_tangible: [
            'Programa d\'intervenció', 'Pla operatiu anual', 'Informe d\'avaluació programa',
            'Sol·licitud subvenció', 'Memòria d\'impacte', 'Acta junta directiva',
            'Pressupost anual', 'Informe auditoria externa',
        ],
        transactions_canonical: [
            { from: 'executive-director',to: 'program-manager', deliverable: 'Pla operatiu anual',    type: 'tangible',  frequency: 'yearly',    trigger: 'planning estratègic' },
            { from: 'program-manager',   to: 'field-worker',    deliverable: 'Mandat tasca',          type: 'intangible',frequency: 'weekly',    trigger: 'planning operatiu' },
            { from: 'field-worker',      to: 'beneficiary',     deliverable: 'Assistència directa',   type: 'tangible',  frequency: 'daily',     trigger: 'intervenció camp' },
            { from: 'donor-funder',      to: 'executive-director',deliverable: 'Aportació econòmica',  type: 'tangible',  frequency: 'yearly',    trigger: 'subvenció resolta' },
            { from: 'audit-compliance',  to: 'board-trustees',  deliverable: 'Informe auditoria',     type: 'tangible',  frequency: 'yearly',    trigger: 'final exercici' },
        ],
    },
    'maker-space': {
        deliverables_tangible: [
            'Quota mensual fab-lab', 'Acord d\'ús d\'eines', 'Plantilles open-source',
            'Pla d\'esdeveniments', 'Projecte de membres', 'Conveni amb sponsor',
            'Programa de tallers', 'Memòria activitats anual',
        ],
        transactions_canonical: [
            { from: 'member-maker',     to: 'lab-coordinator', deliverable: 'Quota mensual',         type: 'tangible',  frequency: 'monthly',   trigger: 'subscripció' },
            { from: 'lab-coordinator',  to: 'member-maker',    deliverable: 'Accés eines + suport',  type: 'intangible',frequency: 'daily',     trigger: 'reserva taller' },
            { from: 'workshop-host',    to: 'visitor-guest',   deliverable: 'Taller obert',          type: 'intangible',frequency: 'weekly',    trigger: 'esdeveniment programat' },
            { from: 'expert-mentor',    to: 'member-maker',    deliverable: 'Mentoring tècnic',      type: 'intangible',frequency: 'weekly',    trigger: 'sessió programada' },
            { from: 'sponsor-equipment',to: 'lab-coordinator', deliverable: 'Aportació equipament',  type: 'tangible',  frequency: 'yearly',    trigger: 'conveni partnership' },
        ],
    },
};

// ── Helper · format JS object literal amb indentació consistent ────────
function indent(s, n) {
    const pad = ' '.repeat(n);
    return s.split('\n').map(l => pad + l).join('\n');
}

function formatDeliverables(arr) {
    return arr.map(s => `            '${s.replace(/'/g, "\\'")}',`).join('\n');
}

function formatTransactions(arr) {
    return arr.map(t => {
        const f = (k, v) => `${k}: '${String(v).replace(/'/g, "\\'")}'`;
        return `            { ${f('from', t.from)}, ${f('to', t.to)}, ${f('deliverable', t.deliverable)}, ${f('type', t.type)}, ${f('frequency', t.frequency)}, ${f('trigger', t.trigger)} },`;
    }).join('\n');
}

function buildEnrichBlock(pack) {
    return [
        '',
        '        // v145b · anchoring específic (deliverables + transactions canòniques)',
        '        deliverables_tangible: [',
        formatDeliverables(pack.deliverables_tangible),
        '        ],',
        '        transactions_canonical: [',
        formatTransactions(pack.transactions_canonical),
        '        ],',
    ].join('\n');
}

// ── Patching · troba `patterns: [...]` + injecta abans del `    },` ────
function patchFile() {
    let src = fs.readFileSync(FILE, 'utf8');
    const lines = src.split('\n');
    const patchedIds = [];
    const skipped = [];

    // Cerca per cada pack
    for (const [id, enrichment] of Object.entries(ENRICH)) {
        // Localitza línia inici · `    'id': {`
        const startRe = new RegExp(`^    '${id}':\\s*\\{`);
        let startIdx = -1;
        for (let i = 0; i < lines.length; i++) {
            if (startRe.test(lines[i])) { startIdx = i; break; }
        }
        if (startIdx < 0) { skipped.push(id + ' · NOT_FOUND'); continue; }

        // Skip si ja té deliverables_tangible
        let endIdx = -1;
        let hasField = false;
        for (let j = startIdx + 1; j < lines.length; j++) {
            if (/^    \},/.test(lines[j])) { endIdx = j; break; }
            if (/deliverables_tangible:/.test(lines[j])) hasField = true;
        }
        if (hasField) { skipped.push(id + ' · already enriched'); continue; }
        if (endIdx < 0) { skipped.push(id + ' · end-not-found'); continue; }

        // Inject before endIdx
        const enrichLines = buildEnrichBlock(enrichment).split('\n');
        lines.splice(endIdx, 0, ...enrichLines);
        patchedIds.push(id);
    }

    fs.writeFileSync(FILE, lines.join('\n'), 'utf8');
    return { patchedIds, skipped };
}

const result = patchFile();
console.log('Patched · ' + result.patchedIds.length + ' packs');
result.patchedIds.forEach(id => console.log('  ✓ ' + id));
if (result.skipped.length) {
    console.log('Skipped · ' + result.skipped.length);
    result.skipped.forEach(s => console.log('  · ' + s));
}
