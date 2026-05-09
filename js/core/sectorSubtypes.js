// TEAMTOWERS SOS V11 — SECTOR SUBTYPES (UX-AUDIT-001 sprint B)
//
// Dataset compacte amb 4-6 subtipus comuns per cada sector A-S del
// KnowledgeLoader. La idea és que l'usuari, després d'escollir sector, pugui
// preseleccionar un subtipus que enriqueix la petició a la IA i la base
// de plantilla. Els subtipus són pures hipòtesis del domini · l'usuari
// pot escriure el seu propi descriptor a la descripció del client.
//
// Selecció dels 19 sectors basada en KnowledgeLoader.listSectors() · els
// IDs aquí han de coincidir amb els sectors disponibles a knowledge/.
// Si un sector no té entrada aquí, el wizard mostra només el camp
// descripció lliure.
//
// Cada entrada · {id, label, hint, iaContextHint} on:
//   - id ·  slug per anar al CREATE_PROJECT (subtype_id)
//   - label · text humà per al select
//   - hint · descripció curta per al hint del wizard
//   - iaContextHint · text que injectem al system prompt de la IA per a
//                     afinar la generació de roles / textos. Només si
//                     aplica IA (camí 3 · sector + descripció).
//
// Pure data. Zero side effects.

export const SECTOR_SUBTYPES = Object.freeze({
    // A · Salut + Cures
    A: [
        { id: 'A-residencia',    label: 'Residència de majors',         hint: 'Centres assistits · sociosanitari · grups petits/mitjans', iaContextHint: 'Operativa típica de residència: equips per torns 24/7, ratio cuidadors/usuaris, protocols d\'higiene i medicació, activitat ocupacional, comunicació amb famílies, cuina interna o externa.' },
        { id: 'A-ad',            label: 'Atenció domiciliària',         hint: 'SAD · cura a casa · acompanyament puntual',                 iaContextHint: 'Operativa de SAD: rutes diàries de cuidadors, planificació per zones, interlocució amb serveis socials, fitxa de cada usuari amb plan de cures, copagament o públic.' },
        { id: 'A-salut-mental',  label: 'Salut mental + diversitat',    hint: 'Acompanyament psicosocial · centres de dia · CSMA',          iaContextHint: 'Operativa de salut mental comunitària: equips multidisciplinaris (psiquiatra, treballador social, peer support), protocols de crisis, derivacions, articulació amb la xarxa pública.' },
        { id: 'A-fin-vida',      label: 'Cures al final de vida',       hint: 'Pal·liatiu · acompanyament a la mort digna',                 iaContextHint: 'Operativa de pal·liatius: equip 24/7, control simptomàtic, suport familiar, articulació amb hospital + AP, eutanàsia regulada quan correspongui.' },
        { id: 'A-coop-cures',    label: 'Cooperativa de cures',         hint: 'Auto-organització de treballadores · model COCETA',          iaContextHint: 'Cooperativa de treball amb mèntor: assemblees de sòcies-cuidadores, salaris consensuats, formació interna, mutualisme, contractació de famílies tipus copagament o autogestionada.' },
    ],
    // B · Habitatge + Coliving
    B: [
        { id: 'B-cohousing',     label: 'Co-housing intergeneracional', hint: 'Promoció col·lectiva · cessió ús · gestió comunitària',     iaContextHint: 'Cooperativa d\'habitatge cessió d\'ús: 20-50 unitats, espais comuns (cuina, bugaderia, jardí), gestió econòmica oberta, comissions (jurídica, finances, comunicació, cures).' },
        { id: 'B-CSO',           label: 'Espai autogestionat (CSO)',    hint: 'Centre Social Okupat o cedit · barri',                       iaContextHint: 'Espai autogestionat: assemblees obertes, programació cultural setmanal, autogestió econòmica per quotes/donacions, relació amb l\'administració municipal.' },
        { id: 'B-coliving',      label: 'Coliving nòmada',              hint: 'Pisos compartits + comunitat itinerant',                     iaContextHint: 'Coliving urbà o rural: rotació mensual/trimestral, hub de coworking integrat, programació social, web de reserves, plans flexibles, criteris d\'admissió.' },
        { id: 'B-masoveria',     label: 'Masoveria urbana / rural',     hint: 'Lloguer per rehabilitació · pacte amb propietat',           iaContextHint: 'Masoveria: contracte 5-15 anys amb propietat a canvi de rehabilitació, sense pagament en metàl·lic, supervisió tècnica de les obres, viure-hi durant el procés.' },
    ],
    // C · Alimentació
    C: [
        { id: 'C-grup-consum',   label: 'Grup de consum agroecològic',  hint: 'Cistelles · pagesia local · sense intermediaris',           iaContextHint: 'Grup de consum: 40-150 famílies, comandes setmanals, repartiment col·lectiu, relació directa amb pagesos, assemblees mensuals, voluntariat per torns.' },
        { id: 'C-coop-pagesia',  label: 'Cooperativa de pagesia',        hint: 'Producció · transformació · venda directa',                  iaContextHint: 'Cooperativa de productors: terreny propi o llogat, comercialització conjunta, transformats (formatge, conserva, mel), botiga pròpia o presència a mercats.' },
        { id: 'C-restauracio',   label: 'Restauració cooperativa',       hint: 'Bar · menjador · espai social',                              iaContextHint: 'Bar/restaurant cooperatiu: 5-12 sòcies-treballadores, gastronomia de proximitat, programació cultural, rendibilitat moderada, atracció veïnat.' },
        { id: 'C-rebost-comu',   label: 'Rebost / banc d\'aliments',     hint: 'Donació · sobres · xarxa solidària',                          iaContextHint: 'Rebost solidari: recollida d\'excedents (mercat, supermercats), distribució a famílies, voluntariat, articulació amb serveis socials, donacions econòmiques.' },
    ],
    // D · Energia
    D: [
        { id: 'D-comunitat-en',  label: 'Comunitat energètica',          hint: 'Som Energia · cooperativa o associació',                     iaContextHint: 'Comunitat energètica: instal·lació fotovoltaica compartida, autoconsum col·lectiu, gestió a través d\'una cooperativa, subvencions IDAE, col·laboració amb municipi.' },
        { id: 'D-eolic-ciu',     label: 'Eòlic ciutadà / mini-hidràulic', hint: 'Generació local · producció comunitària',                  iaContextHint: 'Generació renovable comunitària: estudi de viabilitat, finançament participatiu, gestió d\'autoritzacions, manteniment, repartiment de beneficis o quilowatts.' },
        { id: 'D-rehab-en',      label: 'Rehabilitació energètica',      hint: 'Aïllament · canvi calderes · auditoria',                     iaContextHint: 'Rehabilitació energètica: auditoria inicial, projecte tècnic, gestió de subvencions Next Gen, executar obres, monitoratge consum.' },
    ],
    // E · Educació + Aprenentatge
    E: [
        { id: 'E-escola-coop',   label: 'Escola cooperativa',            hint: 'Lliure · pública subvencionada · pares-mares cooperativa',   iaContextHint: 'Escola cooperativa: comissions de famílies, claustre amb veu, projecte pedagògic propi (Waldorf, Montessori, comunitat d\'aprenentatge), articulació amb administració.' },
        { id: 'E-ateneu',        label: 'Ateneu popular / cultural',     hint: 'Cursos · cinefòrum · biblioteca de barri',                   iaContextHint: 'Ateneu de barri: programació anual de cursos i activitats, voluntariat, relació amb teixit cultural local, infraestructura compartida.' },
        { id: 'E-mooc',          label: 'Plataforma MOOC + workshops',   hint: 'Format híbrid · subscripció + presencial',                   iaContextHint: 'Plataforma educativa: catàleg de cursos online, sessions presencials, certificació, model freemium, comunitat alumni.' },
        { id: 'E-comunitat-apr', label: 'Comunitat d\'aprenentatge',     hint: 'Hubs locals · peer-learning · sense docent fix',             iaContextHint: 'Comunitat d\'aprenentatge: cercles peer-to-peer, mentoria horitzontal, recursos compartits, sense quotes obligatòries, articulació amb Open Source learning.' },
    ],
    // F · Cultura + Audiovisual
    F: [
        { id: 'F-prod-coop',     label: 'Productora cooperativa',        hint: 'Cinema · ràdio · podcast · cooperativa de mitjans',          iaContextHint: 'Productora cultural cooperativa: 5-15 sòcies, projectes diversos, model finançament mixt (subvencions, encàrrec, autofinançament), distribució federada.' },
        { id: 'F-festival',      label: 'Festival cultural',             hint: 'Anual · gestió comunitària · open call',                     iaContextHint: 'Festival cultural: convocatòria oberta, comissions de programació, voluntariat estiu, relació amb administració, sponsors ètics.' },
        { id: 'F-radio-comu',    label: 'Ràdio comunitària',             hint: 'Lliure · 24/7 · graella oberta',                             iaContextHint: 'Ràdio comunitària: graella oberta de programes, formació tècnica, infraestructura compartida, llicència del municipi, fiable streaming.' },
    ],
    // G · Tecnologia + Web
    G: [
        { id: 'G-coop-tech',     label: 'Cooperativa tecnològica',       hint: 'Desenvolupament programari · serveis a tercers',             iaContextHint: 'Cooperativa de desenvolupament: 5-20 sòcies-treballadores, projectes a clients (sovint públics o socials), salaris consensuats, formació contínua, governança horitzontal.' },
        { id: 'G-platform-coop', label: 'Plataforma cooperativa',        hint: 'Alternativa Uber/Airbnb · model Smart o Loconomics',         iaContextHint: 'Plataforma cooperativa digital: aplicació web/mòbil, governança dels treballadors, comissió reduïda, transparència de dades, articulació entre usuaris i prestadors.' },
        { id: 'G-foss',          label: 'FOSS · projecte sostenible',    hint: 'Mantenidors · sponsors · comunitat',                         iaContextHint: 'Projecte de programari lliure: nucli de mantenidors, sponsors corporatius (Open Collective, GitHub Sponsors), governança meritocràtica + cooperativa, full-time mantainers.' },
        { id: 'G-startup-tech',  label: 'Startup tech (slicing pie)',    hint: 'Founders · cap-table oberta · sense VC tradicional',         iaContextHint: 'Startup amb slicing pie: founders apliquen multipliers, cap-table dinàmica, ronda lliure, relació amb VC ètics si cal, model d\'ingrés en cerca-mercat.' },
    ],
    // H · Finances + Economia social
    H: [
        { id: 'H-coop-credit',   label: 'Cooperativa de crèdit',         hint: 'Caixa popular · estalvi ètic · model JAK / Fiare',           iaContextHint: 'Cooperativa de crèdit ètic: dipòsits dels socis, préstecs a projectes amb impacte, criteris d\'inversió ètics, governança democràtica, capitalització mínima.' },
        { id: 'H-mutua-segurs',  label: 'Mútua / assegurances',          hint: 'Risc compartit · model SCAM / mutualisme',                  iaContextHint: 'Mútua: 100-2000 socis, prima per servei, fons de garantia, comissió de risc, articulació amb administració.' },
        { id: 'H-divisa-local',  label: 'Divisa local / mutual credit',  hint: 'Ecu · rec · CES · LETS',                                     iaContextHint: 'Divisa local: emissió controlada, comerços adherits, model de mutual credit (CES) o backing fiat, gestió de la xarxa.' },
        { id: 'H-financ-part',   label: 'Finançament participatiu',      hint: 'Goteo · Verkami · model crowd-equity',                       iaContextHint: 'Plataforma de crowdfunding o crowdequity: campanyes de projectes, comissió plataforma, certificació de retorn, comunitat backers, governança plataforma.' },
    ],
    // I · Indústria + Manufactura
    I: [
        { id: 'I-coop-ind',      label: 'Cooperativa industrial',        hint: 'Mondragón-style · sòcies-treballadores · escala mitjana',     iaContextHint: 'Cooperativa industrial: 30-300 sòcies, planta pròpia, mercats regionals/internacionals, salaris cooperatius (ratio 1:5), formació interna.' },
        { id: 'I-makerspace',    label: 'Makerspace / Fab Lab',          hint: 'Fabricació digital · membre per quota · open source',         iaContextHint: 'Makerspace: 50-500 membres amb quota mensual, equipament compartit (làser, 3D, CNC), tallers regulars, projectes col·laboratius, articulació amb universitat.' },
        { id: 'I-coop-construcc',label: 'Cooperativa de construcció',     hint: 'Bioconstrucció · paller · obres comunitàries',               iaContextHint: 'Cooperativa de construcció ecològica: 5-20 sòcies, projectes paller/CLT/bioconstrucció, formació en obra, relació amb arquitectes ètics.' },
    ],
    // J · Joventut + Activisme
    J: [
        { id: 'J-casal-jove',    label: 'Casal jove / agrupament',       hint: 'Activitats lliures · 12-25 anys · activisme local',           iaContextHint: 'Casal jove: programació setmanal, activisme local, relació amb consistori (subvencions), formació monitors, participació assembleària.' },
        { id: 'J-mov-social',    label: 'Moviment social',                hint: 'PAH · feminista · ecologista · descentralitzat',             iaContextHint: 'Moviment social descentralitzat: assemblees obertes, comissions temàtiques, mobilització coordinada, relació amb mitjans, no jeràrquic.' },
    ],
    // K · KIB · Coneixement intensiu (legal, financer, consultoria)
    K: [
        { id: 'K-startup',       label: 'Startup KIB tradicional',       hint: 'Capital risc · escalabilitat',                                iaContextHint: 'Startup intensiva en coneixement: 4-15 founders/early team, ronda seed/serie A, ARR creixent, sales B2B o B2C, KPIs SaaS.' },
        { id: 'K-platform',      label: 'Plataforma multi-stakeholder',  hint: 'Marketplace · 2 sided · escala xarxa',                       iaContextHint: 'Plataforma marketplace: oferta + demanda, comissió o subscripció, network effect, governança plataforma, retenció proveïdors.' },
        { id: 'K-DAO',           label: 'DAO Web3',                       hint: 'Token · governança onchain · Snapshot/Aragon',                iaContextHint: 'DAO Web3: token de governança, proposals/votacions onchain, treasury multisig, contributors a través de gitcoin/coordinape, programa de bounties.' },
        { id: 'K-consultora',    label: 'Consultora cooperativa',         hint: 'Serveis professionals · estratègia · auditoria',             iaContextHint: 'Consultora cooperativa: 5-20 sòcies-consultores, projectes a sector públic + tercer sector, model dia-consultor, reputació professional.' },
        { id: 'K-bufet-juridic', label: 'Bufet jurídic cooperatiu',       hint: 'Advocades · drets civils · model assistencial',              iaContextHint: 'Bufet jurídic: 3-15 advocades, especialització (drets humans, mercantil, treball), client mix (privat + torn d\'ofici), model honoraris fix o iguala.' },
    ],
    // L · Logística + Mobilitat
    L: [
        { id: 'L-coopcycle',     label: 'CoopCycle / repartiment',       hint: 'Bicimissatgers · cooperativa de repartiment',                iaContextHint: 'Plataforma de repartiment cooperativa: ciclistes assalariats o autònoms-cooperativistes, app pròpia (CoopCycle), clients (restauradors), comissió reduïda.' },
        { id: 'L-carsharing',    label: 'Carsharing / cotxe compartit',   hint: 'Som Mobilitat · flotes elèctriques · barri',                iaContextHint: 'Carsharing comunitari: flota de 5-50 vehicles compartits, app de reserva, manteniment, partner amb municipi, electrificació progressiva.' },
        { id: 'L-distrib-coop',  label: 'Distribuïdora cooperativa',      hint: 'Magatzem · ruta · entrega a comerç de barri',                iaContextHint: 'Distribuïdora cooperativa: magatzem propi, vehicles, rutes diàries, clients (comerç de proximitat), gestió logística.' },
    ],
    // M · Mitjans de comunicació
    M: [
        { id: 'M-mitja-coop',    label: 'Mitjà de comunicació coop',     hint: 'Crític · subscriptors · independent',                        iaContextHint: 'Mitjà cooperatiu: 5-30 sòcies-redactores, model subscriptors (Mediapart-style), independència editorial, comunitat lectora activa.' },
        { id: 'M-podcast',       label: 'Podcast independent',           hint: 'Sponsor + Patreon · escala mitjana',                         iaContextHint: 'Podcast independent: 1-5 hosts, model Patreon + sponsors, regularitat setmanal, comunitat de listeners.' },
        { id: 'M-radio-lliure',  label: 'Ràdio lliure',                  hint: 'No comercial · graella oberta · 100% voluntari',             iaContextHint: 'Ràdio lliure: graella autogestionada, voluntariat 100%, llicència municipal, donacions, infraestructura modesta.' },
    ],
    // N · Natura + Regeneratiu
    N: [
        { id: 'N-permacult',     label: 'Finca permacultural',           hint: 'Cooperativa rural · diseny ecològic · CSA',                  iaContextHint: 'Finca permacultural: 1-5 ha amb diseny permacultural, integració de cultius/animals, CSA local, formació, agroturisme.' },
        { id: 'N-rewilding',     label: 'Rewilding / restauració',       hint: 'ONG · projectes a llarg termini · biodiversitat',            iaContextHint: 'Projecte de restauració ecològica: 50-5000 ha, equip científic, comunitat local, finançament a llarg (10-30 anys), monitoratge biodiversitat.' },
        { id: 'N-ecoturisme',    label: 'Ecoturisme cooperatiu',         hint: 'Allotjaments · rutes · pagesos guies',                       iaContextHint: 'Cooperativa d\'ecoturisme: pagesos i artesans com a guies, allotjaments rurals, paquets multi-dia, marca col·lectiva, certificació EU Ecolabel.' },
    ],
    // O · Oficis + Artesania
    O: [
        { id: 'O-coop-artes',    label: 'Cooperativa d\'oficis',         hint: 'Fusters · paletes · cera artesana',                          iaContextHint: 'Cooperativa d\'oficis: 3-12 sòcies, taller compartit, encàrrecs i gamma pròpia, formació d\'aprenents, marca col·lectiva.' },
        { id: 'O-mercat-arts',   label: 'Mercat d\'artesans',            hint: 'Cap setmana · municipal · etiquetatge ètic',                 iaContextHint: 'Mercat d\'artesans: organització cooperativa entre venedors, criteri admissió ètic, freqüència mensual o setmanal, articulació amb administració.' },
    ],
    // P · Plataformes públiques + Govern
    P: [
        { id: 'P-municipalisme', label: 'Municipalisme transformador',   hint: 'Confluencies · candidatures veïnals',                         iaContextHint: 'Municipalisme: confluència política veïnal, programa transversal, mecanismes de democràcia directa, conveni amb tercer sector, gestió pública remunicipalitzada.' },
        { id: 'P-coop-publica',  label: 'Cooperativa público-comunitària',hint: 'Servei públic delegat · gestió ciutadana',                  iaContextHint: 'Cooperativa público-comunitària: servei públic gestionat per cooperativa (escoles bressol, neteja, serveis socials), conveni amb administració, ratis qualitat.' },
    ],
    // Q · Salut + Esports
    Q: [
        { id: 'Q-club-esp',      label: 'Club esportiu sense ànim',      hint: 'Veïnal · juvenil · programa social',                          iaContextHint: 'Club esportiu sense ànim de lucre: 100-1500 socis, equips d\'edats, voluntariat entrenadors, instal·lacions municipals, model quotes assequibles.' },
        { id: 'Q-coop-esp',      label: 'Cooperativa esportiva',         hint: 'Gimnàs comunitari · piscina cooperativa',                     iaContextHint: 'Cooperativa esportiva: 200-2000 sòcies-usuàries, gestió compartida, monitors-cooperativistes, model d\'ingressos per quotes mensuals.' },
    ],
    // R · Religió · Espiritual · Sentit
    R: [
        { id: 'R-comunitat-espiritual', label: 'Comunitat espiritual',  hint: 'Vipassana · sufí · zen · cristiana de base',                  iaContextHint: 'Comunitat espiritual: retir setmanal/anual, mestre/guia, donacions o quotes, voluntariat, espai dedicat (centre rural).' },
        { id: 'R-rituals-laics',  label: 'Rituals laics / mort digna',   hint: 'Acompanyament a transicions vitals',                          iaContextHint: 'Cooperativa de ritualistes laics: matrimonis, naixements, dols, formació pròpia, model honoraris flexibles.' },
    ],
    // S · Solidaritat + Desigualtat
    S: [
        { id: 'S-acollida-mig',  label: 'Acollida de migrants',          hint: 'Mentories · habitatge · feina · papers',                      iaContextHint: 'Cooperativa o ONG d\'acollida: mentors voluntaris per persona acollida, articulació amb serveis socials, mediació intercultural, formació professional.' },
        { id: 'S-pah-habitat',   label: 'PAH · Sindicat habitatge',      hint: 'Stop desnonaments · negociació amb bancs',                    iaContextHint: 'PAH/Sindicat d\'habitatge: assemblees obertes setmanals, acompanyament a famílies, negociació col·lectiva amb bancs, mobilització.' },
        { id: 'S-banc-aliments', label: 'Banc d\'aliments / xarxa',      hint: 'Recollida · distribució · solidaritat',                       iaContextHint: 'Banc d\'aliments: recollida d\'excedents (mercats, supermercats, productors), distribució a entitats socials, voluntariat logístic.' },
    ],
});

export function getSubtypesForSector(sectorId) {
    if (!sectorId || typeof sectorId !== 'string') return [];
    const key = sectorId.toUpperCase();
    return SECTOR_SUBTYPES[key] || [];
}

export function getSubtypeById(sectorId, subtypeId) {
    const subs = getSubtypesForSector(sectorId);
    return subs.find(s => s.id === subtypeId) || null;
}

// Helper · genera el bloc de context per al system prompt de la IA quan
// l'usuari ha seleccionat sector + subtipus. Pure string.
export function buildIaContextHint({ sectorId, subtypeId, projectType, clientDescription }) {
    const parts = [];
    if (sectorId) parts.push('Sector base: ' + sectorId);
    const sub = subtypeId ? getSubtypeById(sectorId, subtypeId) : null;
    if (sub) {
        parts.push('Subtipus: ' + sub.label + ' · ' + sub.hint);
        if (sub.iaContextHint) parts.push('Operativa típica: ' + sub.iaContextHint);
    }
    if (projectType) parts.push('Tipus de projecte (Matriu): ' + projectType);
    if (clientDescription) parts.push('Descripció client: ' + clientDescription);
    return parts.join('\n');
}
