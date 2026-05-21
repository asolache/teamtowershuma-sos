// =============================================================================
// TEAMTOWERS SOS V11 — DOMAIN DETECTOR (v126 · sub-sector inference)
// Ruta · /js/core/domainDetector.js
//
// Bug @alvaro · demanant "equip de futbol" amb sector R · el VNA generava
// rols de Sector R = Arts (director artístic · productor · intèrpret) en
// comptes de rols esportius reals (entrenador · director esportiu · jugador
// · ojeador · patrocinador · afició · federació).
//
// Root cause · sectorRoleCatalog té 5 rols GENERICS per sector · prompt no
// infereix el sub-domini (sports vs arts vs gambling dins R). Aquest mòdul
// fa keyword matching simple per a passar més context i archetype set al
// prompt design-value-map-rich.
//
// API ·
//   detectDomain({ name, description, sector }) → { domain, confidence,
//     subSector, archetypes[], intangibles[], patterns[] }
//   listDomains() → llista de dominis suportats
//   getDomainPack(domainId) → arquetip set complet
// =============================================================================

export const DOMAIN_DETECTOR_VERSION = 'v1.0';

// ─── Domain packs · arquetip per sub-domini ─────────────────────────────
// Cada pack té ·
//   keywords[] · paraules detectores al name + description (case-insensitive)
//   sectorHints[] · si el sector CNAE matcha · prioritza aquest pack
//   archetypes[] · 8-15 rols arquetip · noms + descripció domini
//   intangibles[] · 3-5 deliverables intangibles típics
//   patterns[] · 2-3 patterns recíprocs específics del domini
//   castellMap · suggerit per cada arquetip
export const DOMAIN_PACKS = Object.freeze({

    // ── SPORTS-TEAM (futbol · bàsquet · handbol · waterpolo · ...) ──────
    'sports-team': {
        label: 'Equip esportiu professional/semiprofessional',
        keywords: [
            'futbol', 'football', 'soccer', 'equipo', 'club', 'team',
            'basquet', 'basket', 'baloncesto', 'handbol', 'handball',
            'rugbi', 'rugby', 'waterpolo', 'hoquei', 'hockey', 'voleibol', 'volleyball',
            'jugador', 'jugadora', 'player', 'entrenador', 'coach',
            'lliga', 'liga', 'league', 'competicio', 'campionat', 'championship',
            'temporada', 'season', 'partit', 'partido', 'match',
            'derbi', 'derby', 'aficio', 'aficion', 'fan',
        ],
        sectorHints: ['R', 'S'],
        archetypes: [
            { id: 'sporting-director', kind: 'founder',      name: 'Director Esportiu',           castell: 'pom_de_dalt', desc: 'Estratègia esportiva · contractacions · planificació plurianual' },
            { id: 'head-coach',        kind: 'pm',           name: 'Primer Entrenador',           castell: 'tronc',       desc: 'Sistema de joc · alineacions · gestió vestuari · entrenaments setmanals' },
            { id: 'assistant-coach',   kind: 'pm',           name: 'Segon Entrenador · Staff',    castell: 'tronc',       desc: 'Anàlisi tàctica · vídeo · suport sessions · scouting rivals' },
            { id: 'player-first-team',  kind: 'coder',        name: 'Jugador/a Primera Plantilla', castell: 'pinya',       desc: 'Entrenaments · partits · rehabilitació · projecció pública' },
            { id: 'player-academy',    kind: 'coder',        name: 'Jugador/a Cantera',           castell: 'pinya',       desc: 'Formació esportiva + acadèmica · progressió cap a primer equip' },
            { id: 'physio-medical',    kind: 'reviewer',     name: 'Servei Mèdic · Fisioterapeuta', castell: 'laterals',   desc: 'Prevenció lesions · readaptació · seguiment ATP' },
            { id: 'scout',             kind: 'reviewer',     name: 'Ojeador · Scouting',          castell: 'laterals',     desc: 'Detecció talent · informes rival · base de dades fitxatges' },
            { id: 'manager',           kind: 'pm',           name: 'Gerent · CEO Club',           castell: 'tronc',       desc: 'Operativa diària · pressupost · staff · relació institucional' },
            { id: 'sponsor',           kind: 'founder',      name: 'Patrocinador Principal',      castell: 'baixos',       desc: 'Aportació econòmica · drets d\'imatge · activacions de marca' },
            { id: 'fan-base',          kind: 'facilitator',  name: 'Afició · Penyes',             castell: 'baixos',       desc: 'Suport emocional · ingressos taquilla i botiga · identitat de club' },
            { id: 'federation',        kind: 'reviewer',     name: 'Federació · Lliga',           castell: 'laterals',     desc: 'Reglament · llicències · calendari · disciplinari' },
            { id: 'referee',           kind: 'reviewer',     name: 'Arbitre · VAR',               castell: 'laterals',     desc: 'Compliment regles · decisions partit · informe' },
            { id: 'media-comms',       kind: 'facilitator',  name: 'Comunicació · Premsa',        castell: 'mans',         desc: 'Rodes premsa · xarxes socials · gestió de crisi · relat' },
            { id: 'agent',             kind: 'facilitator',  name: 'Agent / Representant',        castell: 'mans',         desc: 'Intermediari jugador↔club · contractes · drets imatge' },
        ],
        intangibles: [
            'Confiança vestuari (cohesió grup · clau per resultats)',
            'Identitat de club (escut · valors · història)',
            'Reputació esportiva (prestigi competitiu)',
            'Connexió aficio↔jugadors (sentiment de pertinença)',
            'Cultura formativa (model de joc transmès cantera→primer equip)',
        ],
        patterns: [
            'Cicle entrenador↔jugador (instrucció ⇄ rendiment · setmanal)',
            'Reciprocitat club↔afició (esforç esportiu ⇄ suport econòmic-emocional)',
            'Pipeline cantera→primer equip→venda (formació ⇄ revaloració · multianyal)',
        ],
        // v145 · anchoring específic per a evitar deliverables/transactions genèrics
        deliverables_tangible: [
            'Acta entrenament setmanal',
            'Alineació partit jornada N',
            'Informe scouting rival',
            'Contracte renovació / fitxatge',
            'Llicència federativa anual',
            'Pla de pretemporada',
            'Pressupost esportiu temporada',
            'Informe mèdic lesió + readaptació',
        ],
        transactions_canonical: [
            { from: 'head-coach',         to: 'player-first-team', deliverable: 'Acta entrenament setmanal',     type: 'tangible',  frequency: 'weekly',    trigger: 'sessió entrenament' },
            { from: 'player-first-team',  to: 'head-coach',        deliverable: 'Rendiment al camp · feedback',  type: 'intangible',frequency: 'per-match', trigger: 'final de partit' },
            { from: 'scout',              to: 'sporting-director', deliverable: 'Informe scouting rival',        type: 'tangible',  frequency: 'weekly',    trigger: 'partit pròxim rival' },
            { from: 'sporting-director',  to: 'head-coach',        deliverable: 'Pla pretemporada',              type: 'tangible',  frequency: 'monthly',   trigger: 'inici cicle preparatori' },
            { from: 'sponsor',            to: 'manager',           deliverable: 'Aportació econòmica + drets imatge', type: 'tangible', frequency: 'monthly', trigger: 'contracte vigent' },
            { from: 'fan-base',           to: 'manager',           deliverable: 'Ingressos taquilla + botiga',   type: 'tangible',  frequency: 'per-match', trigger: 'partit a casa' },
            { from: 'manager',            to: 'fan-base',          deliverable: 'Identitat de club · relat',     type: 'intangible',frequency: 'continu',   trigger: 'comunicació + resultats' },
            { from: 'physio-medical',     to: 'player-first-team', deliverable: 'Informe mèdic + readaptació',   type: 'tangible',  frequency: 'on-demand', trigger: 'lesió detectada' },
        ],
    },

    // ── ARTS-PERFORMANCE (teatre · companyia · festival · òpera · ...) ──
    'arts-performance': {
        label: 'Companyia / festival / producció artística',
        keywords: [
            'teatre', 'teatro', 'theatre', 'opera', 'dansa', 'danza', 'dance',
            'festival', 'companyia', 'compañia', 'company', 'musica', 'music',
            'concert', 'show', 'gira', 'tour', 'temporada artistica',
            'artista', 'actor', 'actriz', 'director artistic', 'productor',
        ],
        sectorHints: ['R'],
        archetypes: [
            { id: 'artistic-director', kind: 'founder',     name: 'Director Artístic',          castell: 'pom_de_dalt', desc: 'Visió · línia editorial · contractació artística' },
            { id: 'producer',          kind: 'pm',          name: 'Producció Executiva',         castell: 'tronc',       desc: 'Pressupost · calendari · drets · contractació' },
            { id: 'performer',         kind: 'coder',       name: 'Intèrpret · Artista',         castell: 'pinya',       desc: 'Creació · assaig · funció · postproducció' },
            { id: 'dramaturg',         kind: 'reviewer',    name: 'Dramatúrgia · Crítica',       castell: 'laterals',    desc: 'Lectura · revisió artística · adequació al públic' },
            { id: 'booking',           kind: 'facilitator', name: 'Booking · Comercial',         castell: 'mans',        desc: 'Captació esdeveniments · gires · contractes sales' },
            { id: 'press',             kind: 'facilitator', name: 'Premsa · Comms',              castell: 'mans',        desc: 'Difusió · entrevistes · rodes de premsa' },
            { id: 'audience',          kind: 'facilitator', name: 'Públic · Subscriptors',       castell: 'baixos',      desc: 'Assistència · subscripcions · feedback emocional' },
            { id: 'sponsor-cultural',  kind: 'founder',     name: 'Mecenes · Sponsor cultural',  castell: 'baixos',      desc: 'Aportació · patronatge · activacions corporatives' },
        ],
        intangibles: [
            'Reconeixement crític (premsa · premis)',
            'Lleialtat de subscriptors (renovació anual)',
            'Reputació artística (qualitat percebuda)',
        ],
        patterns: [
            'Cicle artista↔dramaturgia (creació ⇄ revisió · per producció)',
            'Reciprocitat companyia↔públic (espectacle ⇄ assistència+feedback)',
        ],
        // v145 · anchoring entregables tangibles + transactions canòniques
        deliverables_tangible: [
            'Guió producció',
            'Cartell + dossier premsa',
            'Bunches d\'assaig setmanal',
            'Contracte gira (theater venue)',
            'Liquidació taquilla',
            'Programa de mà',
            'Rider tècnic so/llum',
            'Subvenció pública (BOE/DOGC)',
        ],
        transactions_canonical: [
            { from: 'dramaturg',         to: 'artistic-director', deliverable: 'Guió producció',          type: 'tangible',  frequency: 'on-demand', trigger: 'nou projecte' },
            { from: 'artistic-director', to: 'performer',         deliverable: 'Indicacions assaig',     type: 'intangible',frequency: 'daily',     trigger: 'sessió assaig' },
            { from: 'performer',         to: 'audience',          deliverable: 'Espectacle',              type: 'intangible',frequency: 'per-show',  trigger: 'representació' },
            { from: 'audience',          to: 'producer',          deliverable: 'Ingressos taquilla',     type: 'tangible',  frequency: 'per-show',  trigger: 'venda entrades' },
            { from: 'producer',          to: 'venue',             deliverable: 'Contracte gira',         type: 'tangible',  frequency: 'on-demand', trigger: 'tour planificat' },
            { from: 'tech-collaborator', to: 'venue',             deliverable: 'Rider tècnic so/llum',   type: 'tangible',  frequency: 'per-show',  trigger: 'muntatge sala' },
        ],
    },

    // ── COOP-CARES (cooperativa cures · SAD · residència · ...) ─────────
    'coop-cares': {
        label: 'Cooperativa de cures · residència · SAD',
        keywords: [
            'cura', 'cuidad', 'care', 'sad', 'residencia', 'cooperativa cures',
            'dependencia', 'gerontologia', 'pal·liatiu', 'pal·liativo', 'palliative',
            'cuidador', 'cuidadora', 'cuidadores', 'familia empleadora',
        ],
        sectorHints: ['Q', 'T'],
        archetypes: [
            { id: 'caregiver',         kind: 'coder',       name: 'Cuidadora · Sòcia',           castell: 'pinya',       desc: 'Atenció directa · ratio amb usuaris · pla de cures' },
            { id: 'coordinator',       kind: 'pm',          name: 'Coordinadora de Cures',       castell: 'tronc',       desc: 'Rutes · torns · pla de cura individual · relació serveis socials' },
            { id: 'family',            kind: 'facilitator', name: 'Família / Tutor',             castell: 'baixos',      desc: 'Decisions · copagament · supervisió afectiva' },
            { id: 'service-user',      kind: 'facilitator', name: 'Persona Atesa',               castell: 'baixos',      desc: 'Persona usuària · drets · expressió de necessitats' },
            { id: 'social-worker',     kind: 'reviewer',    name: 'Treballadora Social',         castell: 'laterals',    desc: 'Valoració · derivacions · prestacions públiques' },
            { id: 'health-pro',        kind: 'reviewer',    name: 'Sanitari/a · Geriatra',       castell: 'laterals',    desc: 'Salut · medicació · paliatius si escau' },
            { id: 'general-assembly',  kind: 'founder',     name: 'Assemblea de Sòcies',         castell: 'pom_de_dalt', desc: 'Decisions estratègiques · salaris · admissió noves sòcies' },
            { id: 'admin-staff',       kind: 'pm',          name: 'Administració · Facturació',  castell: 'mans',        desc: 'Pressupost · facturació · relació amb administracions' },
        ],
        intangibles: [
            'Confiança família↔cuidadora (continuïtat afectiva)',
            'Dignitat de la persona atesa (centre del servei)',
            'Cohesió cooperativa (auto-organització · no jeràrquica)',
        ],
        patterns: [
            'Cicle cuidadora↔persona atesa (atenció ⇄ feedback emocional · diari)',
            'Reciprocitat cooperativa↔administració (servei ⇄ finançament + control)',
        ],
        // v145 · anchoring tangibles + transactions canòniques
        deliverables_tangible: [
            'Pla d\'atenció individual (PAI)',
            'Full d\'incidència diària',
            'Acta assemblea cooperativa',
            'Factura mensual servei',
            'Informe trimestral seguiment',
            'Concert / conveni amb administració',
            'Reglament intern de règim',
            'Pla de formació anual',
        ],
        transactions_canonical: [
            { from: 'caregiver',     to: 'service-user',  deliverable: 'Atenció diària · pla cures',           type: 'tangible',  frequency: 'daily',     trigger: 'visita programada' },
            { from: 'service-user',  to: 'caregiver',     deliverable: 'Feedback emocional · agraïment',       type: 'intangible',frequency: 'daily',     trigger: 'durant servei' },
            { from: 'caregiver',     to: 'coordinator',   deliverable: 'Full d\'incidència diària',            type: 'tangible',  frequency: 'daily',     trigger: 'final de torn' },
            { from: 'coordinator',   to: 'social-worker', deliverable: 'PAI · revisió trimestral',             type: 'tangible',  frequency: 'monthly',   trigger: 'revisió periòdica' },
            { from: 'family',        to: 'coordinator',   deliverable: 'Copagament mensual',                   type: 'tangible',  frequency: 'monthly',   trigger: 'factura emesa' },
            { from: 'coordinator',   to: 'family',        deliverable: 'Informe seguiment',                    type: 'tangible',  frequency: 'monthly',   trigger: 'fi de mes' },
            { from: 'social-worker', to: 'coordinator',   deliverable: 'Valoració dependència + derivació',    type: 'tangible',  frequency: 'on-demand', trigger: 'nova alta usuari' },
        ],
    },

    // ── EDU-FORMATION (cooperativa educativa · escola lliure · ...) ────
    'edu-formation': {
        label: 'Escola · cooperativa educativa · formació',
        keywords: [
            'escola', 'escuela', 'school', 'classroom', 'aula', 'cole',
            'maestro', 'mestra', 'profesor', 'teacher', 'alumno', 'alumna', 'student',
            'cooperativa educativa', 'escola lliure', 'pedagog',
            'curs', 'curso', 'formacio', 'training', 'bootcamp',
        ],
        sectorHints: ['P'],
        archetypes: [
            { id: 'pedagogical-team',  kind: 'founder',     name: 'Equip Pedagògic',             castell: 'pom_de_dalt', desc: 'Projecte educatiu · metodologia · seguiment' },
            { id: 'teacher',           kind: 'coder',       name: 'Mestra / Acompanyant',        castell: 'pinya',       desc: 'Aula · planificació · seguiment individual' },
            { id: 'student',           kind: 'coder',       name: 'Alumnat',                     castell: 'pinya',       desc: 'Procés aprenentatge · participació · projecte propi' },
            { id: 'family',            kind: 'facilitator', name: 'Família · Tutors',            castell: 'baixos',      desc: 'Implicació · suport · pagament quota' },
            { id: 'evaluator',         kind: 'reviewer',    name: 'Avaluació · Inspecció',       castell: 'laterals',    desc: 'Compliment currículum · revisió pedagògica' },
            { id: 'community',         kind: 'facilitator', name: 'Comunitat Local',             castell: 'baixos',      desc: 'Voluntariat · sortides · vincle territorial' },
            { id: 'admin',             kind: 'pm',          name: 'Administració · Gerència',    castell: 'tronc',       desc: 'Pressupost · relació amb administracions · staff' },
        ],
        intangibles: [
            'Confiança família↔equip pedagògic (projecte compartit)',
            'Cultura d\'escola (valors transmesos any rere any)',
            'Autonomia de l\'alumnat (procés vs producte)',
        ],
        patterns: [
            'Cicle mestra↔alumnat (acompanyament ⇄ aprenentatge · diari)',
            'Reciprocitat escola↔família (educació ⇄ implicació + pagament)',
        ],

        // v145b · anchoring específic (deliverables + transactions canòniques)
        deliverables_tangible: [
            'Pla pedagògic anual',
            'Calendari escolar',
            'Acta assemblea trimestral',
            'Informe d\'avaluació individual',
            'Reglament intern centre',
            'Pressupost cooperativa',
            'Quota mensual família',
            'Conveni amb administració',
        ],
        transactions_canonical: [
            { from: 'teacher', to: 'student', deliverable: 'Sessió pedagògica', type: 'intangible', frequency: 'daily', trigger: 'classe diària' },
            { from: 'teacher', to: 'family', deliverable: 'Informe avaluació individual', type: 'tangible', frequency: 'quarterly', trigger: 'final trimestre' },
            { from: 'family', to: 'admin-staff', deliverable: 'Quota mensual', type: 'tangible', frequency: 'monthly', trigger: 'factura emesa' },
            { from: 'pedagogical-team', to: 'general-assembly', deliverable: 'Pla pedagògic anual', type: 'tangible', frequency: 'yearly', trigger: 'planificació curs' },
            { from: 'evaluator', to: 'pedagogical-team', deliverable: 'Validació pedagògica', type: 'tangible', frequency: 'yearly', trigger: 'auditoria externa' },
        ],
    },
    // ── RELIGIOUS-COMMUNITY (parròquia · vipassana · sufí · zen · cristiana de base) ──
    'religious-community': {
        label: 'Comunitat religiosa / espiritual',
        keywords: [
            'parroquia', 'parròquia', 'iglesia', 'esglesia', 'church',
            'mezquita', 'mosque', 'sinagoga', 'synagogue', 'temple', 'templo',
            'vipassana', 'sufí', 'sufi', 'zen', 'sangha', 'monestir', 'monastery',
            'religios', 'religious', 'espiritual', 'spiritual',
            'fidels', 'feligresos', 'congregation', 'comunitat de fe',
            'pastor', 'rector', 'imam', 'rabbi', 'lama', 'monjo', 'monja',
        ],
        sectorHints: ['R', 'S'],
        archetypes: [
            { id: 'spiritual-leader',   kind: 'founder',     name: 'Líder Espiritual',           castell: 'pom_de_dalt', desc: 'Visió teològica/filosòfica · ritus principals · transmissió tradició' },
            { id: 'pastoral-council',   kind: 'founder',     name: 'Consell Pastoral',           castell: 'pom_de_dalt', desc: 'Òrgan col·legiat · decisions estratègiques · representació comunitat' },
            { id: 'liturgical-team',    kind: 'pm',          name: 'Equip Litúrgic',             castell: 'tronc',       desc: 'Calendari celebracions · cant · preparació ritus' },
            { id: 'community-member',   kind: 'coder',       name: 'Membre de la Comunitat',     castell: 'pinya',       desc: 'Participació activa · donacions · vida comunitària' },
            { id: 'volunteer',          kind: 'facilitator', name: 'Voluntariat',                castell: 'mans',        desc: 'Tasques caritatives · catequesi · acompanyament' },
            { id: 'mentor-spiritual',   kind: 'reviewer',    name: 'Mestre / Director Espiritual', castell: 'laterals',  desc: 'Acompanyament personal · discerniment · formació espiritual' },
            { id: 'admin-treasurer',    kind: 'pm',          name: 'Administració · Tresoreria', castell: 'tronc',       desc: 'Comptabilitat · manteniment espai · relacions civils' },
            { id: 'wider-public',       kind: 'facilitator', name: 'Públic ampliat · Cercadors', castell: 'baixos',      desc: 'No-membres receptors d\'esdeveniments oberts · catequesi inicial' },
        ],
        intangibles: [
            'Fe / sentit de pertinença espiritual',
            'Tradició viva transmesa entre generacions',
            'Sentit de servei / amor incondicional',
            'Autoritat espiritual del líder (no només institucional)',
        ],
        patterns: [
            'Cicle líder↔fidels (predicació ⇄ adhesió + donació · setmanal)',
            'Reciprocitat comunitat↔voluntariat (acollida ⇄ servei)',
            'Pipeline mentor↔nou cercador (acompanyament ⇄ creixement espiritual)',
        ],

        // v145b · anchoring específic (deliverables + transactions canòniques)
        deliverables_tangible: [
            'Programa litúrgic mensual',
            'Sermó setmanal',
            'Pla pastoral anual',
            'Quota voluntària / donatiu',
            'Acta consell pastoral',
            'Memòria pastoral anual',
            'Calendari celebracions',
            'Activitats caritatives',
        ],
        transactions_canonical: [
            { from: 'spiritual-leader', to: 'community-member', deliverable: 'Sermó setmanal', type: 'intangible', frequency: 'weekly', trigger: 'servei religiós' },
            { from: 'community-member', to: 'admin-treasurer', deliverable: 'Quota / donatiu', type: 'tangible', frequency: 'monthly', trigger: 'captació mensual' },
            { from: 'liturgical-team', to: 'community-member', deliverable: 'Cerimònia litúrgica', type: 'intangible', frequency: 'weekly', trigger: 'culte programat' },
            { from: 'mentor-spiritual', to: 'community-member', deliverable: 'Acompanyament pastoral', type: 'intangible', frequency: 'on-demand', trigger: 'sol·licitud individual' },
            { from: 'pastoral-council', to: 'spiritual-leader', deliverable: 'Pla pastoral anual', type: 'tangible', frequency: 'yearly', trigger: 'planificació' },
        ],
    },

    // ── POLITICAL-MOVEMENT (PAH · sindicat · partit base · ecologista) ───
    'political-movement': {
        label: 'Moviment polític / sindical / activista',
        keywords: [
            'moviment', 'movimiento', 'movement', 'sindicat', 'sindicato', 'union',
            'partit', 'partido', 'party', 'plataforma ciutadana',
            'pah', 'feminista', 'feminist', 'ecologista', 'ecologist', 'lgbt',
            'antifeixista', 'antifascista', 'antiracista', 'antimilitarista',
            'assemblea', 'asamblea', 'assembly', 'comitè', 'comissio',
            'manifestacio', 'manifestación', 'protest', 'mobilitzacio',
            'activisme', 'activist', 'militant', 'militancia',
        ],
        sectorHints: ['S'],
        archetypes: [
            { id: 'assembly',           kind: 'founder',     name: 'Assemblea',                  castell: 'pom_de_dalt', desc: 'Òrgan sobirà · decisions estratègiques · consens / votació' },
            { id: 'spokesperson',       kind: 'pm',          name: 'Portaveu',                   castell: 'tronc',       desc: 'Comunicació pública · mitjans · negociació institucional · rotatori' },
            { id: 'commission-thematic',kind: 'pm',          name: 'Comissió Temàtica',          castell: 'tronc',       desc: 'Treball especialitzat · proposta a l\'assemblea · execució' },
            { id: 'militant-active',    kind: 'coder',       name: 'Militant Actiu/va',          castell: 'pinya',       desc: 'Acció directa · campanyes · enganxa-cartells · piquets · accions' },
            { id: 'sympathizer',        kind: 'facilitator', name: 'Simpatitzant',               castell: 'baixos',       desc: 'Suport puntual · difusió · assistència a actes oberts' },
            { id: 'press-team',         kind: 'facilitator', name: 'Comissió Premsa',            castell: 'mans',         desc: 'Comunicats · contacte mitjans · xarxes socials · narrativa' },
            { id: 'legal-support',      kind: 'reviewer',    name: 'Suport Jurídic',             castell: 'laterals',     desc: 'Acompanyament detencions · denúncies · defensa col·lectiva' },
            { id: 'institution-target', kind: 'reviewer',    name: 'Institució Diana',           castell: 'laterals',     desc: 'Govern · banc · empresa · objectiu de pressió · NO membre' },
            { id: 'allied-orgs',        kind: 'facilitator', name: 'Organitzacions Aliades',     castell: 'baixos',       desc: 'Sindicats · ONGs · altres moviments · suport mutu · NO membre' },
        ],
        intangibles: [
            'Legitimitat moral (raó política viscuda)',
            'Cohesió interna (confiança vs traïdors / infiltrats)',
            'Capacitat de mobilització (massa al carrer)',
            'Visibilitat mediàtica (capital simbòlic)',
        ],
        patterns: [
            'Cicle assemblea↔comissions (proposta ⇄ execució ⇄ rendició)',
            'Reciprocitat moviment↔afectats (acció ⇄ acompanyament real)',
            'Cicle premsa↔mitjans (comunicat ⇄ cobertura ⇄ pressió institucional)',
        ],

        // v145b · anchoring específic (deliverables + transactions canòniques)
        deliverables_tangible: [
            'Manifest fundacional',
            'Pla d\'acció trimestral',
            'Comunicat de premsa',
            'Recursos legals · denúncia',
            'Conveni amb aliats',
            'Aportació militant',
            'Programa electoral',
            'Reglament intern',
        ],
        transactions_canonical: [
            { from: 'assembly', to: 'spokesperson', deliverable: 'Mandat polític', type: 'intangible', frequency: 'quarterly', trigger: 'decisió assembleària' },
            { from: 'spokesperson', to: 'press-team', deliverable: 'Comunicat premsa', type: 'tangible', frequency: 'weekly', trigger: 'acció pública' },
            { from: 'militant-active', to: 'assembly', deliverable: 'Treball militant', type: 'intangible', frequency: 'weekly', trigger: 'assemblea ordinària' },
            { from: 'sympathizer', to: 'militant-active', deliverable: 'Aportació econòmica', type: 'tangible', frequency: 'monthly', trigger: 'campanya quota' },
            { from: 'legal-support', to: 'institution-target', deliverable: 'Denúncia / recurs', type: 'tangible', frequency: 'on-demand', trigger: 'vulneració detectada' },
        ],
    },

    // ── ART-COLLECTIVE (col·lectiu artístic · co-working d\'artistes) ───
    'art-collective': {
        label: 'Col·lectiu artístic / festival cooperatiu',
        keywords: [
            'col·lectiu', 'colectivo', 'collective', 'cooperativa artistica', 'art collective',
            'fanzine', 'zine', 'autoeditat', 'autoedición', 'self-published',
            'arts visuals', 'arts plàstiques', 'pintor', 'pintora', 'painter',
            'escultor', 'escultora', 'fotograf', 'photographer',
            'graffiti', 'mural', 'street art',
            'taller compartit', 'shared studio', 'atelier',
            'biennal', 'biennale', 'mostra', 'open studios',
        ],
        sectorHints: ['R', 'S'],
        archetypes: [
            { id: 'artistic-coordinator', kind: 'pm',         name: 'Coordinador/a Artístic/a',   castell: 'tronc',       desc: 'Calendari · convocatòries · logística d\'exposicions' },
            { id: 'member-artist',       kind: 'coder',       name: 'Artista Membre',             castell: 'pinya',       desc: 'Producció pròpia · participació mostres · contribució taller' },
            { id: 'curator',             kind: 'reviewer',    name: 'Comissariat / Curaduria',    castell: 'laterals',    desc: 'Selecció obra · narrativa exposició · diàleg amb sales' },
            { id: 'community-host',      kind: 'facilitator', name: 'Comunitat Veïnal',           castell: 'baixos',      desc: 'Públic local · suport · pressió per gentrificació · diàleg' },
            { id: 'gallery-buyer',       kind: 'facilitator', name: 'Galeria · Comprador',        castell: 'baixos',      desc: 'Venda obra · representació comercial · mercat secundari' },
            { id: 'institutional-grant', kind: 'reviewer',    name: 'Institució Pública',         castell: 'laterals',    desc: 'Subvencions · convenis · espai cedit · supervisió' },
            { id: 'tech-collaborator',   kind: 'coder',       name: 'Col·laborador/a Tècnic/a',   castell: 'mans',        desc: 'Muntatge · so · llum · digital · documentació' },
        ],
        intangibles: [
            'Identitat col·lectiva (estil · manifest · marca compartida)',
            'Crítica i conversa interna (feedback creatiu)',
            'Capital simbòlic (presència en circuit reconegut)',
        ],
        patterns: [
            'Cicle artista↔col·lectiu (producció ⇄ exposició ⇄ feedback)',
            'Reciprocitat col·lectiu↔veïnat (obertura ⇄ suport contra desallotjament)',
        ],

        // v145b · anchoring específic (deliverables + transactions canòniques)
        deliverables_tangible: [
            'Obra original',
            'Catàleg exposició',
            'Convocatòria oberta',
            'Memòria projecte',
            'Conveni amb galeria',
            'Subvenció pública',
            'Pla anual col·lectiu',
            'Espai-residència',
        ],
        transactions_canonical: [
            { from: 'member-artist', to: 'artistic-coordinator', deliverable: 'Obra original', type: 'tangible', frequency: 'on-demand', trigger: 'final producció' },
            { from: 'artistic-coordinator', to: 'curator', deliverable: 'Catàleg exposició', type: 'tangible', frequency: 'per-show', trigger: 'muntatge expo' },
            { from: 'curator', to: 'gallery-buyer', deliverable: 'Comissariat venda', type: 'intangible', frequency: 'per-sale', trigger: 'transacció col·leccionista' },
            { from: 'institutional-grant', to: 'artistic-coordinator', deliverable: 'Subvenció pública', type: 'tangible', frequency: 'yearly', trigger: 'resolució convocatòria' },
            { from: 'community-host', to: 'member-artist', deliverable: 'Espai-residència', type: 'tangible', frequency: 'monthly', trigger: 'acord residència' },
        ],
    },

    // ── WORKER-COOP (cooperativa de treball) ─────────────────────────────
    'worker-coop': {
        label: 'Cooperativa de treball associat',
        keywords: [
            'cooperativa', 'cooperative', 'coop', 'sccl', 'sclp',
            'treball associat', 'trabajo asociado', 'worker coop',
            'autogestió', 'autogestion', 'self-managed',
            'sòcia treballadora', 'sòcies treballadores', 'socio trabajador',
            'mondragon', 'coceta',
            'assemblea de sòcies', 'consell rector', 'consejo rector',
            'salari únic', 'salario único',
        ],
        sectorHints: ['M', 'N', 'C', 'F', 'I', 'J'],
        archetypes: [
            { id: 'general-assembly',   kind: 'founder',     name: 'Assemblea General de Sòcies', castell: 'pom_de_dalt', desc: 'Òrgan sobirà · admissió noves sòcies · salaris · estratègia anual' },
            { id: 'governing-board',    kind: 'pm',          name: 'Consell Rector',              castell: 'tronc',       desc: 'Òrgan executiu rotatori · representació legal · 2-3 anys mandat' },
            { id: 'worker-member',      kind: 'coder',       name: 'Sòcia Treballadora',          castell: 'pinya',       desc: 'Treball productiu + participació democràtica + propietat compartida' },
            { id: 'worker-aspiring',    kind: 'coder',       name: 'Treballadora en Període de Prova', castell: 'pinya',  desc: '6-24 mesos cap a sòcia · contribueix sense vot ple encara' },
            { id: 'auditor-internal',   kind: 'reviewer',    name: 'Comissió Auditoria',          castell: 'laterals',    desc: 'Control comptable · compliment estatuts · denúncia desviacions' },
            { id: 'federation',         kind: 'reviewer',    name: 'Federació Cooperativa',       castell: 'laterals',    desc: 'COCETA · federació territorial · suport jurídic · formació · intercoop' },
            { id: 'client-customer',    kind: 'facilitator', name: 'Client/a',                    castell: 'baixos',      desc: 'Receptor producte/servei · NO sòcia · paga · feedback' },
            { id: 'supplier-allied',    kind: 'facilitator', name: 'Proveïdor Aliat',             castell: 'baixos',      desc: 'Preferentment altra coop (intercooperació) · cadena solidària' },
        ],
        intangibles: [
            'Cohesió cooperativa (decisions consensuades · NO majoria estricta)',
            'Compromís intergeneracional (transmissió a noves sòcies)',
            'Identitat cooperativa (diferencial vs empresa capital)',
            'Capital relacional (xarxa amb altres coops · intercoop)',
        ],
        patterns: [
            'Cicle assemblea↔consell rector (decisió ⇄ execució ⇄ rendició)',
            'Pipeline aspirant→sòcia (prova ⇄ admissió formal · ritu de pas)',
            'Reciprocitat coop↔federació (quota ⇄ formació + intercoop)',
        ],

        // v145b · anchoring específic (deliverables + transactions canòniques)
        deliverables_tangible: [
            'Acta assemblea anual',
            'Aportació al capital social',
            'Pla de viabilitat',
            'Conveni laboral intern',
            'Avantatge resultats anual',
            'Informe auditoria social',
            'Pla d\'adhesió soci',
            'Estatuts cooperatius',
        ],
        transactions_canonical: [
            { from: 'general-assembly', to: 'governing-board', deliverable: 'Mandat estratègic', type: 'intangible', frequency: 'yearly', trigger: 'assemblea ordinària' },
            { from: 'worker-member', to: 'general-assembly', deliverable: 'Treball + aportació capital', type: 'tangible', frequency: 'monthly', trigger: 'vincle societari' },
            { from: 'governing-board', to: 'worker-aspiring', deliverable: 'Pla d\'adhesió soci', type: 'tangible', frequency: 'on-demand', trigger: 'prova vincle' },
            { from: 'client-customer', to: 'worker-member', deliverable: 'Compra / contracte servei', type: 'tangible', frequency: 'daily', trigger: 'venda' },
            { from: 'auditor-internal', to: 'general-assembly', deliverable: 'Informe auditoria social', type: 'tangible', frequency: 'yearly', trigger: 'final exercici' },
        ],
    },

    // ── RESEARCH-LAB (grup recerca · centre R+D · spin-off acadèmic) ────
    'research-lab': {
        label: 'Laboratori de recerca / grup R+D',
        keywords: [
            'recerca', 'investigacion', 'research', 'r+d', 'r&d', 'rdi',
            'laboratori', 'laboratorio', 'laboratory', 'lab',
            'tesi', 'tesis', 'phd', 'doctorat', 'doctorate',
            'investigador', 'investigadora', 'researcher',
            'paper', 'publicacio', 'publication', 'peer review',
            'icrea', 'csic', 'icmab', 'irbb', 'isglobal',
            'grant', 'erc', 'horizon europe', 'subvenció recerca',
        ],
        sectorHints: ['M', 'P'],
        archetypes: [
            { id: 'principal-investigator', kind: 'founder',  name: 'Investigador/a Principal (PI)', castell: 'pom_de_dalt', desc: 'Líder científic · grants · línia de recerca · representació' },
            { id: 'postdoc',                kind: 'pm',       name: 'Postdoc',                     castell: 'tronc',       desc: 'Recerca semi-autònoma · supervisió PhDs · papers primer autor' },
            { id: 'phd-student',            kind: 'coder',    name: 'Doctorand/a',                 castell: 'pinya',       desc: 'Tesi · publicacions co-autoria · 3-5 anys · formació intensiva' },
            { id: 'research-engineer',      kind: 'coder',    name: 'Enginyer/a de Recerca',       castell: 'pinya',       desc: 'Infraestructura tècnica · software · dispositius · suport experiments' },
            { id: 'lab-manager',            kind: 'pm',       name: 'Lab Manager · Tècnic/a',      castell: 'mans',        desc: 'Compres reactius · manteniment equips · seguretat · suport general' },
            { id: 'collaborator-external',  kind: 'reviewer', name: 'Col·laborador Extern',        castell: 'laterals',    desc: 'Altres labs · indústria · co-publicació · accés a recursos compartits' },
            { id: 'peer-reviewer',          kind: 'reviewer', name: 'Peer Reviewer (revista)',     castell: 'laterals',    desc: 'Avaluació paper sotmès · acceptació/rebuig · validació científica' },
            { id: 'funding-agency',         kind: 'reviewer', name: 'Agència Finançament',         castell: 'laterals',    desc: 'ERC · ministeris · fundacions · grant award + report' },
            { id: 'public-citizen-science', kind: 'facilitator', name: 'Ciutadania (Citizen Science)', castell: 'baixos', desc: 'Participació en recollida dades · validació · transfer' },
        ],
        intangibles: [
            'Reputació científica (h-index · cites)',
            'Cultura crítica (peer review honest)',
            'Mentoria intergeneracional (PI→PhD)',
            'Capital relacional acadèmic (network internacional)',
        ],
        patterns: [
            'Cicle PI↔PhD (direcció ⇄ resultats experimentals)',
            'Reciprocitat lab↔agència finançament (paper + report ⇄ grant següent)',
            'Cicle paper↔peer-review (sotmissió ⇄ feedback ⇄ revisió)',
        ],

        // v145b · anchoring específic (deliverables + transactions canòniques)
        deliverables_tangible: [
            'Paper revisat per parells',
            'Pre-print arXiv/bioRxiv',
            'Dataset obert',
            'Codi reproduïble (Zenodo)',
            'Sol·licitud beca H2020/ERC',
            'Informe progrés trimestral',
            'Tesi doctoral',
            'Patent / spin-off',
        ],
        transactions_canonical: [
            { from: 'principal-investigator', to: 'phd-student', deliverable: 'Direcció tesi', type: 'intangible', frequency: 'weekly', trigger: 'reunió tutor' },
            { from: 'phd-student', to: 'principal-investigator', deliverable: 'Resultats experimentals', type: 'tangible', frequency: 'monthly', trigger: 'review mensual' },
            { from: 'research-engineer', to: 'lab-manager', deliverable: 'Codi reproduïble + dataset', type: 'tangible', frequency: 'on-demand', trigger: 'publicació pending' },
            { from: 'principal-investigator', to: 'peer-reviewer', deliverable: 'Paper submission', type: 'tangible', frequency: 'on-demand', trigger: 'revisió cega' },
            { from: 'funding-agency', to: 'principal-investigator', deliverable: 'Beca finançament', type: 'tangible', frequency: 'yearly', trigger: 'resolució convocatòria' },
        ],
    },

    // ── FOOD-COOP (cooperativa alimentària · grup de consum · forn artesà) ─
    'food-coop': {
        label: 'Cooperativa alimentària / forn / grup de consum',
        keywords: [
            'forn', 'horno', 'bakery', 'pa', 'pan', 'bread',
            'agroecologia', 'agroecologic', 'agroecological',
            'grup de consum', 'grupo consumo', 'food coop',
            'productor local', 'productores locales', 'local producer',
            'ramaderia', 'ganadería', 'farming', 'pagès', 'pagesa', 'farmer',
            'restaurant cooperatiu', 'restauración cooperativa',
            'cervesa artesana', 'craft beer', 'celler', 'bodega',
        ],
        sectorHints: ['A', 'C', 'G', 'I'],
        archetypes: [
            { id: 'producer-farm',      kind: 'coder',       name: 'Productor/a Pagès/a',         castell: 'pinya',       desc: 'Cultiu/criança · cicle estacional · directa al grup de consum' },
            { id: 'baker-craftsperson', kind: 'coder',       name: 'Forner/a · Artesà/na',         castell: 'pinya',       desc: 'Producció diària · masses mare · qualitat artesanal' },
            { id: 'distribution-coord', kind: 'pm',          name: 'Coordinador/a Distribució',    castell: 'tronc',       desc: 'Rutes · cestes · logística · planificació setmanal' },
            { id: 'consumer-member',    kind: 'facilitator', name: 'Soci/a Consumidor/a',         castell: 'baixos',      desc: 'Quota mensual · recollida cesta · vot a l\'assemblea' },
            { id: 'sanitary-inspection',kind: 'reviewer',    name: 'Sanitat · Inspecció',          castell: 'laterals',    desc: 'Compliment normatiu · traçabilitat · etiquetatge' },
            { id: 'food-assembly',      kind: 'founder',     name: 'Assemblea de Sòcies',          castell: 'pom_de_dalt', desc: 'Decisions sobre productors · preus · admissions' },
            { id: 'restaurant-client',  kind: 'facilitator', name: 'Restaurant/Empresa Client',    castell: 'baixos',      desc: 'B2B · comanda regular · canal d\'ingressos directe' },
        ],
        intangibles: [
            'Confiança productor↔consumidor (sense intermediari)',
            'Identitat ètica (km0 · sense químics · respecte animal)',
            'Sobirania alimentària com a valor compartit',
        ],
        patterns: [
            'Cicle productor↔grup de consum (collita setmanal ⇄ comandes anticipades)',
            'Reciprocitat coop↔restaurant (qualitat ⇄ preu estable)',
        ],

        // v145b · anchoring específic (deliverables + transactions canòniques)
        deliverables_tangible: [
            'Comanda setmanal cistella',
            'Albarà entrega',
            'Factura producte fresc',
            'Acta assemblea alimentària',
            'Pla de cultivars / forn',
            'Inspecció sanitària',
            'Conveni distribució',
            'Llistat preus de temporada',
        ],
        transactions_canonical: [
            { from: 'producer-farm', to: 'distribution-coord', deliverable: 'Albarà entrega', type: 'tangible', frequency: 'weekly', trigger: 'collita setmanal' },
            { from: 'distribution-coord', to: 'consumer-member', deliverable: 'Cistella setmanal', type: 'tangible', frequency: 'weekly', trigger: 'comanda confirmada' },
            { from: 'consumer-member', to: 'distribution-coord', deliverable: 'Pagament setmanal', type: 'tangible', frequency: 'weekly', trigger: 'entrega rebuda' },
            { from: 'sanitary-inspection', to: 'producer-farm', deliverable: 'Inspecció + certificat', type: 'tangible', frequency: 'yearly', trigger: 'auditoria anual' },
            { from: 'baker-craftsperson', to: 'consumer-member', deliverable: 'Pa fresc artesà', type: 'tangible', frequency: 'daily', trigger: 'obertura forn' },
        ],
    },

    // ── HEALTH-CLINIC (centre salut · consulta privada · CSMA · ASSIR) ──
    'health-clinic': {
        label: 'Centre de salut / consulta clínica',
        keywords: [
            'centre de salut', 'centro salud', 'cap ', 'csma', 'assir',
            'consulta', 'consultorio', 'consultori privat',
            'metge', 'metgessa', 'médico', 'médica', 'doctor', 'physician',
            'infermer', 'infermera', 'enfermero', 'enfermera', 'nurse',
            'fisioterapeuta', 'physiotherapist', 'psicoleg', 'psicóloga', 'psychologist',
            'odontolog', 'odontólogo', 'dentista', 'dentist',
            'farmacia', 'farmàcia', 'pharmacy',
        ],
        sectorHints: ['Q'],
        archetypes: [
            { id: 'physician-primary',  kind: 'coder',       name: 'Metge/ssa de Familia',        castell: 'pinya',       desc: 'Consulta diària · triatge · derivacions especialistes' },
            { id: 'specialist',         kind: 'coder',       name: 'Especialista',                 castell: 'pinya',       desc: 'Cardiologia/neumologia/etc · consultes derivades' },
            { id: 'nurse',              kind: 'coder',       name: 'Infermer/a',                   castell: 'pinya',       desc: 'Pre-consulta · proves · administració medicació · cures' },
            { id: 'admin-receptionist', kind: 'facilitator', name: 'Recepció/Administració',       castell: 'mans',        desc: 'Cites · facturació · interacció amb pacients' },
            { id: 'medical-director',   kind: 'founder',     name: 'Director/a Mèdic/a',           castell: 'pom_de_dalt', desc: 'Protocols clínics · admissió de personal · qualitat' },
            { id: 'patient',            kind: 'facilitator', name: 'Pacient',                      castell: 'baixos',      desc: 'Receptor del servei · seguiment · drets sanitaris' },
            { id: 'health-insurance',   kind: 'reviewer',    name: 'Mútua · Asseguradora',         castell: 'laterals',    desc: 'Facturació · autoritzacions · auditoria' },
            { id: 'lab-imaging',        kind: 'reviewer',    name: 'Laboratori/Radiologia',        castell: 'laterals',    desc: 'Proves externes · resultats · interpretació' },
        ],
        intangibles: [
            'Confiança metge↔pacient (clau per a compliance)',
            'Continuïtat assistencial (mateix professional al llarg del temps)',
            'Confidencialitat de dades clíniques',
        ],
        patterns: [
            'Cicle pacient↔metge (visita ⇄ tractament ⇄ seguiment)',
            'Reciprocitat clínica↔asseguradora (servei ⇄ pagament + control)',
        ],

        // v145b · anchoring específic (deliverables + transactions canòniques)
        deliverables_tangible: [
            'Historial clínic electrònic (HCE)',
            'Recepta mèdica',
            'Informe d\'alta',
            'Sol·licitud d\'analítica',
            'Programació cita',
            'Factura mútua / asseguradora',
            'Pla de cures infermeria',
            'Protocol clínic actualitzat',
        ],
        transactions_canonical: [
            { from: 'patient', to: 'admin-receptionist', deliverable: 'Cita programada', type: 'tangible', frequency: 'daily', trigger: 'sol·licitud usuari' },
            { from: 'physician-primary', to: 'patient', deliverable: 'Visita + recepta', type: 'tangible', frequency: 'per-visit', trigger: 'cita complerta' },
            { from: 'physician-primary', to: 'specialist', deliverable: 'Derivació + informe', type: 'tangible', frequency: 'on-demand', trigger: 'sospita diagnòstica' },
            { from: 'nurse', to: 'patient', deliverable: 'Pla de cures', type: 'intangible', frequency: 'daily', trigger: 'hospitalització' },
            { from: 'health-insurance', to: 'admin-receptionist', deliverable: 'Factura cobrada', type: 'tangible', frequency: 'monthly', trigger: 'prestació autoritzada' },
        ],
    },

    // ── HOTEL-HOSPITALITY (hotel · alberg · turisme rural · BnB) ────────
    'hotel-hospitality': {
        label: 'Hotel / alberg / turisme rural / BnB',
        keywords: [
            'hotel', 'hotels', 'alberg', 'albergue', 'hostel',
            'turisme rural', 'agroturisme', 'masia', 'casa rural',
            'bnb', 'bed and breakfast', 'pension', 'pensió',
            'recepcionista', 'concierge', 'cambrera', 'camarera de pisos',
            'reserva', 'booking', 'check-in', 'check-out',
            'restaurant hoteler', 'spa hotel',
        ],
        sectorHints: ['I'],
        archetypes: [
            { id: 'director-general',   kind: 'founder',     name: 'Director/a General',           castell: 'pom_de_dalt', desc: 'Estratègia · ocupació · revenue management · marca' },
            { id: 'front-desk',         kind: 'facilitator', name: 'Recepció · Front Office',      castell: 'mans',        desc: 'Check-in/out · reserves · primer contacte client' },
            { id: 'housekeeping',       kind: 'coder',       name: 'Cambrer/a de pisos',           castell: 'pinya',       desc: 'Habitacions · neteja · manteniment · turn-over diari' },
            { id: 'kitchen-fb',         kind: 'coder',       name: 'Cuina · F&B',                  castell: 'pinya',       desc: 'Esmorzar · restaurant · room service · banquets' },
            { id: 'maintenance',        kind: 'reviewer',    name: 'Manteniment',                  castell: 'laterals',    desc: 'Reparacions · piscina · climatització · jardí' },
            { id: 'guest',              kind: 'facilitator', name: 'Hoste',                        castell: 'baixos',      desc: 'Receptor servei · valoracions · paga' },
            { id: 'ota-channel',        kind: 'facilitator', name: 'OTA (Booking/Airbnb)',         castell: 'baixos',      desc: 'Distribució online · comissions · ranking algorithm' },
            { id: 'local-tourism',      kind: 'facilitator', name: 'Patronat Turisme · DMO',       castell: 'baixos',      desc: 'Promoció destinació · cooperació local' },
        ],
        intangibles: [
            'Hospitalitat (com es fa sentir l\'hoste)',
            'Reputació online (estrelles · reviews · TripAdvisor)',
            'Esperit de lloc (autèntic vs estandarditzat)',
        ],
        patterns: [
            'Cicle hoste↔staff (necessitat ⇄ servei ⇄ valoració)',
            'Reciprocitat hotel↔OTA (visibilitat ⇄ comissió)',
        ],

        // v145b · anchoring específic (deliverables + transactions canòniques)
        deliverables_tangible: [
            'Reserva confirmada',
            'Check-in / check-out registry',
            'Comanda F&B',
            'Factura final hoste',
            'Pla de neteja diari',
            'Informe ocupació mensual',
            'Conveni canal OTA',
            'Pla turístic territorial',
        ],
        transactions_canonical: [
            { from: 'ota-channel', to: 'front-desk', deliverable: 'Reserva confirmada', type: 'tangible', frequency: 'daily', trigger: 'booking online' },
            { from: 'front-desk', to: 'guest', deliverable: 'Check-in + claus', type: 'tangible', frequency: 'per-stay', trigger: 'arribada hoste' },
            { from: 'housekeeping', to: 'guest', deliverable: 'Habitació neta', type: 'intangible', frequency: 'daily', trigger: 'servei diari' },
            { from: 'kitchen-fb', to: 'guest', deliverable: 'Servei restauració', type: 'tangible', frequency: 'per-meal', trigger: 'comanda à la carte' },
            { from: 'guest', to: 'front-desk', deliverable: 'Pagament factura', type: 'tangible', frequency: 'per-stay', trigger: 'check-out' },
        ],
    },

    // ── CONSTRUCTION (cooperativa obres · paletes · rehabilitació) ──────
    'construction': {
        label: 'Construcció / rehabilitació / paletes',
        keywords: [
            'construcció', 'construcción', 'construction',
            'paleta', 'paletas', 'mason', 'bricklayer',
            'fuster', 'fuster', 'carpenter',
            'rehabilitació', 'rehabilitación', 'rehabilitation',
            'arquitecte', 'arquitectura', 'arquitect',
            'obra', 'project obra', 'building site',
            'autoconstrucció', 'autoconstrucción',
        ],
        sectorHints: ['F'],
        archetypes: [
            { id: 'site-manager',       kind: 'pm',          name: 'Cap d\'Obra',                   castell: 'tronc',       desc: 'Planificació · pressupost · coordinació subcontractes' },
            { id: 'architect',          kind: 'founder',     name: 'Arquitecte/a',                 castell: 'pom_de_dalt', desc: 'Projecte · llicències · supervisió tècnica' },
            { id: 'worker-mason',       kind: 'coder',       name: 'Paleta · Treballador/a',       castell: 'pinya',       desc: 'Execució material · maçoneria · acabats' },
            { id: 'worker-specialist',  kind: 'coder',       name: 'Especialista · Fuster/lampista',castell: 'pinya',       desc: 'Treball especialitzat · fusta · aigua · llum · gas' },
            { id: 'safety-officer',     kind: 'reviewer',    name: 'Tècnic Seguretat',             castell: 'laterals',    desc: 'EPIs · prevenció riscos · auditoria' },
            { id: 'client-owner',       kind: 'facilitator', name: 'Client/Promotor',              castell: 'baixos',      desc: 'Encàrrec · pagaments per fases · canvis durant obra' },
            { id: 'supplier-materials', kind: 'facilitator', name: 'Proveïdor de materials',       castell: 'baixos',      desc: 'Subministraments · timing crític · descomptes per volum' },
            { id: 'municipal-permits',  kind: 'reviewer',    name: 'Ajuntament · Llicències',      castell: 'laterals',    desc: 'Permisos d\'obra · revisió · final d\'obra' },
        ],
        intangibles: [
            'Confiança client↔cap d\'obra (gestió de canvis i sobrecosts)',
            'Reputació · obres ben acabades atreuen recomanacions',
            'Cultura de seguretat (zero accidents)',
        ],
        patterns: [
            'Cicle arquitecte↔obra (plànol ⇄ execució ⇄ modificacions)',
            'Reciprocitat client↔contractista (pagament per fase ⇄ entrega DTD)',
        ],

        // v145b · anchoring específic (deliverables + transactions canòniques)
        deliverables_tangible: [
            'Projecte d\'execució',
            'Llicència d\'obres',
            'Pla de seguretat i salut',
            'Certificat fi d\'obra',
            'Comanda de materials',
            'Acta d\'inspecció',
            'Pressupost partida',
            'Factura mensual obra',
        ],
        transactions_canonical: [
            { from: 'architect', to: 'site-manager', deliverable: 'Projecte d\'execució', type: 'tangible', frequency: 'on-demand', trigger: 'inici obra' },
            { from: 'site-manager', to: 'worker-mason', deliverable: 'Ordre de treball diària', type: 'intangible', frequency: 'daily', trigger: 'planning matí' },
            { from: 'supplier-materials', to: 'site-manager', deliverable: 'Comanda + albarà', type: 'tangible', frequency: 'weekly', trigger: 'sol·licitud obra' },
            { from: 'safety-officer', to: 'worker-mason', deliverable: 'Formació prevenció', type: 'intangible', frequency: 'monthly', trigger: 'pla anual seguretat' },
            { from: 'client-owner', to: 'site-manager', deliverable: 'Pagament partida', type: 'tangible', frequency: 'monthly', trigger: 'certificació mensual' },
        ],
    },

    // ── SOFTWARE-AGENCY (consultora IT · agència web · startup SaaS) ────
    'software-agency': {
        label: 'Agència software / startup SaaS / consultora IT',
        keywords: [
            'software', 'saas', 'startup tecnologica', 'tech startup',
            'desenvolupament', 'desarrollo', 'development',
            'developer', 'programador', 'programadora', 'enginyer software',
            'devops', 'sysadmin', 'cloud',
            'agencia web', 'agència digital', 'digital agency',
            'consultora it', 'consultoría tecnológica',
            'react', 'node', 'python', 'rails',
        ],
        sectorHints: ['J', 'M'],
        archetypes: [
            { id: 'cto-founder',        kind: 'founder',     name: 'CTO · Founder Tècnic/a',       castell: 'pom_de_dalt', desc: 'Visió tècnica · arquitectura · roadmap · cultura eng' },
            { id: 'product-manager',    kind: 'pm',          name: 'Product Manager',              castell: 'tronc',       desc: 'Roadmap · backlog · prioritzaciñ · interfície amb client' },
            { id: 'engineer-senior',    kind: 'coder',       name: 'Senior Engineer',              castell: 'pinya',       desc: 'Arquitectura solucions · mentoring · code review' },
            { id: 'engineer-junior',    kind: 'coder',       name: 'Junior Engineer',              castell: 'pinya',       desc: 'Implementació guiada · creixement · features mitjanes' },
            { id: 'designer-ux',        kind: 'coder',       name: 'Designer (UX/UI)',             castell: 'pinya',       desc: 'Wireframes · prototips · sistema de disseny · tests usabilitat' },
            { id: 'qa-tester',          kind: 'reviewer',    name: 'QA · Tester',                  castell: 'laterals',    desc: 'Test plans · regressions · accessibility audits' },
            { id: 'devops-sre',         kind: 'reviewer',    name: 'DevOps · SRE',                 castell: 'laterals',    desc: 'CI/CD · infraestructura · observabilitat · cost · seguretat' },
            { id: 'client-customer',    kind: 'facilitator', name: 'Client/Customer',              castell: 'baixos',      desc: 'Receptor producte · feedback · paga · churn risk' },
            { id: 'investor-vc',        kind: 'facilitator', name: 'Inversor · VC',                castell: 'baixos',      desc: 'Capital · expectatives creixement · board' },
        ],
        intangibles: [
            'Cultura d\'enginyeria (DRY · KISS · DTD · code review)',
            'Velocity i reliability (ship rapid · sense break)',
            'Confiança tècnica del client',
        ],
        patterns: [
            'Cicle PM↔eng (spec ⇄ implementació ⇄ feedback usuari)',
            'Reciprocitat client↔agència (pagament ⇄ DTD test booleà)',
            'Pipeline junior→senior (mentoring ⇄ growth · multianyal)',
        ],
        // v145 · anchoring tangibles + transactions canòniques
        deliverables_tangible: [
            'User story · acceptance criteria',
            'Pull request · code review',
            'Sprint demo · vídeo + notes',
            'SaaS subscription invoice (MRR)',
            'Incident post-mortem · 5 whys',
            'Roadmap trimestre',
            'OKRs Q · objectius + key results',
            'Release notes · canvis prod',
        ],
        transactions_canonical: [
            { from: 'product-manager',  to: 'engineer-senior',  deliverable: 'User story + acceptance criteria',  type: 'tangible',  frequency: 'weekly',     trigger: 'planning sprint' },
            { from: 'engineer-senior',  to: 'qa-tester',        deliverable: 'Pull request',                       type: 'tangible',  frequency: 'daily',      trigger: 'feature complete' },
            { from: 'engineer-junior',  to: 'engineer-senior',  deliverable: 'Code review request',                type: 'tangible',  frequency: 'daily',      trigger: 'commit pushed' },
            { from: 'engineer-senior',  to: 'engineer-junior',  deliverable: 'Mentoring · code feedback',          type: 'intangible',frequency: 'daily',      trigger: 'PR review' },
            { from: 'qa-tester',        to: 'devops-sre',       deliverable: 'Test green · ready to deploy',       type: 'tangible',  frequency: 'on-demand',  trigger: 'PR approved' },
            { from: 'devops-sre',       to: 'client-customer',  deliverable: 'Release notes · canvis prod',        type: 'tangible',  frequency: 'biweekly',   trigger: 'deploy a producció' },
            { from: 'client-customer',  to: 'product-manager',  deliverable: 'SaaS subscription invoice (MRR)',    type: 'tangible',  frequency: 'monthly',    trigger: 'cobrament mensual' },
            { from: 'investor-vc',      to: 'cto-founder',      deliverable: 'Capital ronda · expectatives growth',type: 'tangible',  frequency: 'on-demand',  trigger: 'fundraising round' },
        ],
    },

    // ── COWORKING (espai compartit · maker hub · co-living) ─────────────
    'coworking': {
        label: 'Coworking / espai compartit / co-living',
        keywords: [
            'coworking', 'co-working', 'co-work', 'coliving', 'co-living',
            'espai compartit', 'shared workspace', 'shared space',
            'membership coworking', 'hot desk', 'meeting room',
            'comunitat treballadora', 'community manager coworking',
        ],
        sectorHints: ['L', 'N'],
        archetypes: [
            { id: 'space-founder',      kind: 'founder',     name: 'Fundador/a · Owner Espai',     castell: 'pom_de_dalt', desc: 'Visió · contracte espai · model membership' },
            { id: 'community-manager',  kind: 'pm',          name: 'Community Manager',            castell: 'tronc',       desc: 'Onboarding · esdeveniments · cohesió · retenció' },
            { id: 'member-coworker',    kind: 'coder',       name: 'Membre Coworker',              castell: 'pinya',       desc: 'Lloga lloc · networking · projectes propis' },
            { id: 'event-host',         kind: 'facilitator', name: 'Tallerista · Event Host',      castell: 'mans',        desc: 'Imparteix esdeveniments · ompla calendari · capta nous membres' },
            { id: 'cleaning-services',  kind: 'reviewer',    name: 'Manteniment · Neteja',         castell: 'laterals',    desc: 'Higiene · café · WiFi · climatització' },
            { id: 'corporate-partner',  kind: 'facilitator', name: 'Partner Corporatiu',           castell: 'baixos',      desc: 'Sponsors · marca al espai · access events' },
        ],
        intangibles: [
            'Cohesió de la comunitat (no és només WiFi i café)',
            'Cultura de l\'espai (creatiu · estudiós · familiar · etc.)',
        ],
        patterns: [
            'Cicle community manager↔membres (programa ⇄ assistència ⇄ recomanació)',
            'Reciprocitat espai↔esdeveniments (sala ⇄ tràfic nou)',
        ],

        // v145b · anchoring específic (deliverables + transactions canòniques)
        deliverables_tangible: [
            'Quota mensual soci',
            'Acord d\'ús d\'espai',
            'Pla d\'esdeveniments',
            'Factura facility services',
            'Memòria activitats anual',
            'Reglament d\'ús',
            'Conveni corporate partner',
            'Programa d\'activacions comunitat',
        ],
        transactions_canonical: [
            { from: 'member-coworker', to: 'community-manager', deliverable: 'Quota mensual', type: 'tangible', frequency: 'monthly', trigger: 'subscripció recurrent' },
            { from: 'community-manager', to: 'member-coworker', deliverable: 'Pla esdeveniments + xarxa', type: 'intangible', frequency: 'weekly', trigger: 'programació setmanal' },
            { from: 'event-host', to: 'community-manager', deliverable: 'Activació esdeveniment', type: 'intangible', frequency: 'monthly', trigger: 'agenda mensual' },
            { from: 'cleaning-services', to: 'space-founder', deliverable: 'Servei neteja', type: 'tangible', frequency: 'daily', trigger: 'contracte facility' },
            { from: 'corporate-partner', to: 'space-founder', deliverable: 'Conveni partnership', type: 'tangible', frequency: 'yearly', trigger: 'acord anual' },
        ],
    },

    // ── E-COMMERCE (botiga online · marketplace · D2C brand) ────────────
    'ecommerce': {
        label: 'E-commerce · botiga online · D2C',
        keywords: [
            'ecommerce', 'e-commerce', 'tienda online', 'botiga online',
            'd2c', 'direct to consumer', 'dtc',
            'shopify', 'woocommerce', 'magento',
            'marketplace', 'amazon seller', 'etsy', 'ebay',
            'producte fisic online', 'físic online', 'dropshipping',
        ],
        sectorHints: ['G'],
        archetypes: [
            { id: 'ceo-founder',        kind: 'founder',     name: 'Founder/a · CEO',              castell: 'pom_de_dalt', desc: 'Visió marca · creixement · estratègia' },
            { id: 'marketing-growth',   kind: 'pm',          name: 'Growth Marketing',             castell: 'tronc',       desc: 'Adquisició · funnel · CAC/LTV · creatives' },
            { id: 'product-merchandiser',kind: 'pm',         name: 'Product/Merchandiser',         castell: 'tronc',       desc: 'Catàleg · pricing · llançaments estacionals' },
            { id: 'operations-fulfill', kind: 'coder',       name: 'Operacions · Fulfillment',     castell: 'pinya',       desc: 'Stock · packaging · shipping · devolucions' },
            { id: 'customer-support',   kind: 'facilitator', name: 'Customer Support',             castell: 'mans',        desc: 'Tickets · whatsapp · gestió queixes · reviews' },
            { id: 'customer',           kind: 'facilitator', name: 'Client/a · End consumer',      castell: 'baixos',      desc: 'Compra · review · churn · referral' },
            { id: 'supplier',           kind: 'facilitator', name: 'Proveïdor/a',                  castell: 'baixos',      desc: 'MOQs · timing · qualitat constant · contractes' },
            { id: 'logistics-3pl',      kind: 'reviewer',    name: 'Logística · 3PL',              castell: 'laterals',    desc: 'Magatzem · enviament · returns · KPIs entregabilitat' },
        ],
        intangibles: [
            'Marca (storytelling · estètica · valors)',
            'Confiança en compra primera (reviews · garanties · suport)',
            'Loyalty / repetició (clau per a LTV)',
        ],
        patterns: [
            'Cicle marketing↔producte (campanya ⇄ vendes ⇄ stock-out)',
            'Reciprocitat customer↔suport (problema ⇄ resolució ⇄ review positiva)',
        ],

        // v145b · anchoring específic (deliverables + transactions canòniques)
        deliverables_tangible: [
            'Comanda online',
            'Albarà transport',
            'Devolució autoritzada',
            'Pla de campanyes marketing',
            'Catàleg de producte',
            'Factura proveïdor',
            'Informe vendes setmanal',
            'Tendència de stock',
        ],
        transactions_canonical: [
            { from: 'customer', to: 'operations-fulfill', deliverable: 'Comanda online', type: 'tangible', frequency: 'daily', trigger: 'checkout' },
            { from: 'operations-fulfill', to: 'customer', deliverable: 'Albarà + tracking', type: 'tangible', frequency: 'per-order', trigger: 'expedició' },
            { from: 'supplier', to: 'operations-fulfill', deliverable: 'Estocs + factura', type: 'tangible', frequency: 'weekly', trigger: 'reposició inventari' },
            { from: 'customer-support', to: 'customer', deliverable: 'Resolució incidència', type: 'intangible', frequency: 'daily', trigger: 'ticket obert' },
            { from: 'marketing-growth', to: 'ceo-founder', deliverable: 'Pla campanyes', type: 'tangible', frequency: 'monthly', trigger: 'planning mensual' },
        ],
    },

    // ── COMMUNITY-MEDIA (ràdio comunitària · revista · diari local) ─────
    'community-media': {
        label: 'Ràdio comunitària · diari local · mitjà cooperatiu',
        keywords: [
            'radio', 'ràdio', 'ràdio comunitària', 'community radio',
            'tv comunitaria', 'tv local', 'community tv',
            'diari local', 'periódico local', 'local newspaper',
            'revista', 'magazine', 'fanzine',
            'mitja cooperatiu', 'mitjà cooperatiu', 'mèdia cooperatiu',
            'periodista', 'journalist', 'redactor', 'redactora',
        ],
        sectorHints: ['J', 'R'],
        archetypes: [
            { id: 'editor-in-chief',    kind: 'founder',     name: 'Director/a · Editor in Chief', castell: 'pom_de_dalt', desc: 'Línia editorial · agenda · prioritats redacció' },
            { id: 'reporter-journalist',kind: 'coder',       name: 'Periodista · Redactor/a',      castell: 'pinya',       desc: 'Articles · entrevistes · investigació local' },
            { id: 'show-host',          kind: 'coder',       name: 'Conductor/a Programa',         castell: 'pinya',       desc: 'Programa setmanal · convidats · realització en directe' },
            { id: 'technician',         kind: 'coder',       name: 'Tècnic/a So/Imatge',           castell: 'pinya',       desc: 'Streaming · edició · arxiu · infraestructura' },
            { id: 'volunteer-contributor', kind: 'facilitator', name: 'Voluntari/a · Col·laborador',castell: 'mans',        desc: 'Aportacions puntuals · cobertura events · sense salari' },
            { id: 'audience-listener',  kind: 'facilitator', name: 'Audiència · Oient',            castell: 'baixos',      desc: 'Receptora · interacció via xarxes · participació enquestes' },
            { id: 'sponsor-advertiser', kind: 'facilitator', name: 'Sponsor · Anunciant',          castell: 'baixos',      desc: 'Anuncis · patrocini programa · cap influència editorial' },
            { id: 'public-grant',       kind: 'reviewer',    name: 'Administració Pública',        castell: 'laterals',    desc: 'Subvenció ràdios lliures · llicències emissió' },
        ],
        intangibles: [
            'Independència editorial (separació anuncis ↔ contingut)',
            'Veu local autèntica (cap notícia que cap altre fa)',
            'Comunitat d\'oients lleial',
        ],
        patterns: [
            'Cicle editor↔periodista (encàrrec ⇄ article ⇄ publicació)',
            'Reciprocitat ràdio↔oients (programa ⇄ feedback ⇄ donatius/sponsorship)',
        ],

        // v145b · anchoring específic (deliverables + transactions canòniques)
        deliverables_tangible: [
            'Programació setmanal',
            'Notícia publicada',
            'Podcast / programa',
            'Conveni patrocini',
            'Resolució subvenció pública',
            'Pla editorial trimestral',
            'Acord d\'aparicions',
            'Memòria activitats anual',
        ],
        transactions_canonical: [
            { from: 'editor-in-chief', to: 'reporter-journalist', deliverable: 'Encàrrec editorial', type: 'tangible', frequency: 'daily', trigger: 'planning redacció' },
            { from: 'reporter-journalist', to: 'editor-in-chief', deliverable: 'Notícia / reportatge', type: 'tangible', frequency: 'daily', trigger: 'entrega' },
            { from: 'show-host', to: 'audience-listener', deliverable: 'Programa setmanal', type: 'intangible', frequency: 'weekly', trigger: 'emissió en directe' },
            { from: 'sponsor-advertiser', to: 'editor-in-chief', deliverable: 'Conveni patrocini', type: 'tangible', frequency: 'yearly', trigger: 'renovació contracte' },
            { from: 'public-grant', to: 'editor-in-chief', deliverable: 'Resolució subvenció', type: 'tangible', frequency: 'yearly', trigger: 'convocatòria pública' },
        ],
    },

    // ── HOUSING-COOP (cooperativa habitatge · cohabitatge · masoveria) ──
    'housing-coop': {
        label: 'Cooperativa d\'habitatge · cohabitatge · masoveria',
        keywords: [
            'habitatge', 'vivienda', 'housing',
            'cooperativa habitatge', 'cooperativa vivienda',
            'cohabitatge', 'cohabitación', 'cohousing', 'co-housing',
            'masoveria', 'cesión de uso', 'cessió d\'us',
            'andel', 'la borda', 'sostre civic',
            'inquilinos cooperativos', 'inquilines cooperatives',
        ],
        sectorHints: ['L'],
        archetypes: [
            { id: 'general-assembly-h', kind: 'founder',     name: 'Assemblea General',            castell: 'pom_de_dalt', desc: 'Òrgan sobirà · decisions sobre habitatge · admissions' },
            { id: 'resident-member',    kind: 'coder',       name: 'Resident/Sòcia',               castell: 'pinya',       desc: 'Habita · paga quota d\'ús · participa governança' },
            { id: 'waiting-list-member',kind: 'facilitator', name: 'Llista d\'Espera',             castell: 'baixos',      desc: 'Esperant entrada · formació · contribució al projecte' },
            { id: 'governing-council',  kind: 'pm',          name: 'Consell Rector',               castell: 'tronc',       desc: 'Executiu rotatori · representació · gestió diària' },
            { id: 'commission-maintenance', kind: 'pm',      name: 'Comissió Manteniment',         castell: 'tronc',       desc: 'Comú · reparacions · zones comunes · pressupost' },
            { id: 'architect-tech',     kind: 'reviewer',    name: 'Arquitecte/Tècnic',            castell: 'laterals',    desc: 'Projecte construcció · obres · llicències · final obra' },
            { id: 'bank-finance',       kind: 'reviewer',    name: 'Banca/Finançament Ètic',       castell: 'laterals',    desc: 'Hipoteca col·lectiva · COOP57 · Triodos · Fiare' },
            { id: 'neighborhood',       kind: 'facilitator', name: 'Veïnat · Districte',           castell: 'baixos',      desc: 'Relació territorial · barri · serveis municipals' },
        ],
        intangibles: [
            'Confiança veïnal (saber qui hi viu i com decideix)',
            'Sentit de comunitat (no només "veïns" sinó "sòcies")',
            'Anti-especulació (habitatge com a dret · NO mercaderia)',
        ],
        patterns: [
            'Cicle assemblea↔consell rector (mandat ⇄ execució ⇄ rendició)',
            'Pipeline llista d\'espera↔resident (formació ⇄ admissió formal)',
            'Reciprocitat coop↔banca ètica (préstec ⇄ retorn social)',
        ],

        // v145b · anchoring específic (deliverables + transactions canòniques)
        deliverables_tangible: [
            'Quota mensual ús/cessió',
            'Acord d\'adhesió soci',
            'Pla de manteniment edifici',
            'Acta assemblea anual',
            'Estatuts cooperatius',
            'Préstec / hipoteca col·lectiva',
            'Reglament d\'ús',
            'Memòria econòmica',
        ],
        transactions_canonical: [
            { from: 'resident-member', to: 'general-assembly-h', deliverable: 'Aportació + treball', type: 'tangible', frequency: 'monthly', trigger: 'vincle societari' },
            { from: 'general-assembly-h', to: 'governing-council', deliverable: 'Mandat anual', type: 'intangible', frequency: 'yearly', trigger: 'assemblea ordinària' },
            { from: 'commission-maintenance', to: 'resident-member', deliverable: 'Manteniment edifici', type: 'tangible', frequency: 'weekly', trigger: 'pla anual' },
            { from: 'architect-tech', to: 'governing-council', deliverable: 'Auditoria tècnica', type: 'tangible', frequency: 'yearly', trigger: 'revisió periòdica' },
            { from: 'bank-finance', to: 'general-assembly-h', deliverable: 'Préstec col·lectiu', type: 'tangible', frequency: 'yearly', trigger: 'contracte hipoteca' },
        ],
    },

    // ── ENERGY-COOP (cooperativa energètica · solar comunitari) ─────────
    'energy-coop': {
        label: 'Cooperativa energètica · solar comunitari',
        keywords: [
            'energia', 'energía', 'energy',
            'som energia', 'goiener', 'zencer', 'cooperativa energètica',
            'solar', 'fotovoltaic', 'photovoltaic',
            'comunitat energética', 'comunitat energètica', 'energy community',
            'renovable', 'renewable',
            'comercialitzadora', 'comercializadora',
        ],
        sectorHints: ['D'],
        archetypes: [
            { id: 'member-prosumer',    kind: 'coder',       name: 'Soci/a · Prosumidor/a',        castell: 'pinya',       desc: 'Consumeix + produeix energia · vot a assemblea' },
            { id: 'tech-installer',     kind: 'coder',       name: 'Tècnic/a Instal·lador/a',      castell: 'pinya',       desc: 'Instal·lació plaques · manteniment · auditories energètiques' },
            { id: 'energy-coordinator', kind: 'pm',          name: 'Coordinador/a Energètic',      castell: 'tronc',       desc: 'Gestió comercialitzadora · contractes · facturació' },
            { id: 'general-assembly-e', kind: 'founder',     name: 'Assemblea',                    castell: 'pom_de_dalt', desc: 'Decisions estratègiques · admissions · preus' },
            { id: 'regulator',          kind: 'reviewer',    name: 'CNMC · Regulador',             castell: 'laterals',    desc: 'Marc legal · permisos · auditories' },
            { id: 'grid-operator',      kind: 'reviewer',    name: 'Distribuïdora elèctrica',      castell: 'laterals',    desc: 'Xarxa · contractes accés · facturació peatges' },
            { id: 'town-hall',          kind: 'facilitator', name: 'Ajuntament · Municipi',        castell: 'baixos',      desc: 'Convenis comunitats energètiques · espai · ciutadania' },
        ],
        intangibles: [
            'Sobirania energètica (no depèn d\'oligopoli)',
            'Educació energètica dels socis (consum conscient)',
            'Transició ecològica viscuda · no només discurs',
        ],
        patterns: [
            'Cicle producció↔consum (excedent ⇄ xarxa ⇄ compensació)',
            'Reciprocitat coop↔ajuntament (espai cedit ⇄ servei a ciutadania)',
        ],

        // v145b · anchoring específic (deliverables + transactions canòniques)
        deliverables_tangible: [
            'Auditoria energètica',
            'Instal·lació solar',
            'Factura cooperativa',
            'Conveni amb ajuntament',
            'Llicència regulatòria',
            'Pla quinquennal energètic',
            'Informe d\'emissions CO2',
            'Memòria assemblea anual',
        ],
        transactions_canonical: [
            { from: 'tech-installer', to: 'member-prosumer', deliverable: 'Instal·lació solar', type: 'tangible', frequency: 'on-demand', trigger: 'contracte signat' },
            { from: 'member-prosumer', to: 'energy-coordinator', deliverable: 'Aportació + factura mensual', type: 'tangible', frequency: 'monthly', trigger: 'vincle societari' },
            { from: 'regulator', to: 'energy-coordinator', deliverable: 'Llicència regulatòria', type: 'tangible', frequency: 'yearly', trigger: 'renovació anual' },
            { from: 'grid-operator', to: 'member-prosumer', deliverable: 'Excedents abocats', type: 'tangible', frequency: 'monthly', trigger: 'producció solar' },
            { from: 'town-hall', to: 'energy-coordinator', deliverable: 'Conveni municipal', type: 'tangible', frequency: 'yearly', trigger: 'acord polític' },
        ],
    },

    // ── LEGAL-ADVISORY (despatx advocats · gestoria · notaria) ──────────
    'legal-advisory': {
        label: 'Despatx d\'advocats · gestoria · notaria',
        keywords: [
            'advocat', 'advocada', 'abogado', 'abogada', 'lawyer',
            'despatx', 'despacho', 'law firm',
            'gestoria', 'gestor', 'gestora', 'gestoría',
            'notari', 'notaria', 'notario', 'notaría',
            'procurador', 'procuradora', 'procurador legal',
            'assessor fiscal', 'asesor fiscal', 'tax advisor',
        ],
        sectorHints: ['M'],
        archetypes: [
            { id: 'managing-partner',   kind: 'founder',     name: 'Managing Partner',             castell: 'pom_de_dalt', desc: 'Visió · client key · contractació · model negoci' },
            { id: 'senior-lawyer',      kind: 'coder',       name: 'Senior Lawyer',                castell: 'pinya',       desc: 'Casos complexos · mentoring · cartera clients' },
            { id: 'junior-associate',   kind: 'coder',       name: 'Junior Associate',             castell: 'pinya',       desc: 'Recerca · drafts · acompanyament casos' },
            { id: 'paralegal',          kind: 'facilitator', name: 'Paralegal · Administratiu',    castell: 'mans',        desc: 'Suport documental · arxiu · planificació audiencies' },
            { id: 'client',             kind: 'facilitator', name: 'Client/a',                     castell: 'baixos',      desc: 'Particular o empresa · paga per hora o flat fee' },
            { id: 'opposing-counsel',   kind: 'reviewer',    name: 'Advocat/da contrari/a',        castell: 'laterals',    desc: 'Diàleg processal · negociació · risc procés' },
            { id: 'judge-tribunal',     kind: 'reviewer',    name: 'Jutge · Tribunal',             castell: 'laterals',    desc: 'Decisió final · jurisdicció · pressió a temps' },
            { id: 'bar-association',    kind: 'reviewer',    name: 'Col·legi d\'Advocats',         castell: 'laterals',    desc: 'Ètica professional · formació · representació' },
        ],
        intangibles: [
            'Confiança del client (informació molt sensible)',
            'Reputació al col·legi (mèrits · ètica · victòries)',
            'Network jurisdiccional (jutges · companys · vies)',
        ],
        patterns: [
            'Cicle client↔senior (briefing ⇄ estratègia ⇄ defensa)',
            'Reciprocitat despatx↔jutjat (escrits ⇄ resolucions)',
        ],

        // v145b · anchoring específic (deliverables + transactions canòniques)
        deliverables_tangible: [
            'Dictamen jurídic',
            'Recurs administratiu',
            'Demanda judicial',
            'Memòria d\'assumpte',
            'Factura d\'honoraris',
            'Contracte de serveis',
            'Pla d\'estratègia processal',
            'Informe d\'auditoria legal',
        ],
        transactions_canonical: [
            { from: 'client', to: 'senior-lawyer', deliverable: 'Encàrrec d\'assumpte', type: 'tangible', frequency: 'on-demand', trigger: 'sol·licitud client' },
            { from: 'senior-lawyer', to: 'junior-associate', deliverable: 'Tasca delegada', type: 'intangible', frequency: 'weekly', trigger: 'planning equip' },
            { from: 'paralegal', to: 'senior-lawyer', deliverable: 'Investigació documental', type: 'tangible', frequency: 'daily', trigger: 'sol·licitud caso' },
            { from: 'senior-lawyer', to: 'judge-tribunal', deliverable: 'Demanda / recurs', type: 'tangible', frequency: 'on-demand', trigger: 'litigation' },
            { from: 'client', to: 'managing-partner', deliverable: 'Pagament honoraris', type: 'tangible', frequency: 'monthly', trigger: 'factura mensual' },
        ],
    },

    // ── ARTISAN-CRAFT (cooperativa oficis · ceramista · luthier) ────────
    'artisan-craft': {
        label: 'Cooperativa d\'oficis · artesans · luthiers',
        keywords: [
            'artesa', 'artesà', 'artesana', 'artesano', 'artisan',
            'ceramica', 'cerámica', 'pottery', 'ceramist',
            'fuster', 'carpenter', 'carpintero',
            'luthier', 'instrument maker',
            'cuir', 'cuero', 'leather',
            'taller propi', 'studio own',
            'cooperativa oficis',
        ],
        sectorHints: ['C', 'R', 'S'],
        archetypes: [
            { id: 'master-craftsperson',kind: 'founder',     name: 'Mestre/a Artesà/na',           castell: 'pom_de_dalt', desc: 'Tradició · estil propi · mentora aprenents' },
            { id: 'craftsperson',       kind: 'coder',       name: 'Artesà/na · Sòcia',            castell: 'pinya',       desc: 'Producció diària · gamma propia + encàrrecs' },
            { id: 'apprentice',         kind: 'coder',       name: 'Aprenent/a',                   castell: 'pinya',       desc: '1-3 anys formació · pràctica amb mestre/a' },
            { id: 'customer-direct',    kind: 'facilitator', name: 'Client/a directe/a',           castell: 'baixos',      desc: 'Mercat · botiga al taller · online' },
            { id: 'gallery-shop',       kind: 'facilitator', name: 'Galeria · Botiga revenedora',  castell: 'baixos',      desc: 'Distribució · marge · visibilitat' },
            { id: 'tourism-visitor',    kind: 'facilitator', name: 'Turista · Visitant taller',    castell: 'baixos',      desc: 'Open studios · venda spot · word-of-mouth' },
            { id: 'craft-association',  kind: 'reviewer',    name: 'Gremi · Associació',           castell: 'laterals',    desc: 'Defensa ofici · denominació origen · formació' },
        ],
        intangibles: [
            'Tradició viva (transmissió mestre↔aprenent)',
            'Autenticitat (no industrial · únic)',
            'Sentit del lloc i el material (terre · fusta · pell)',
        ],
        patterns: [
            'Pipeline aprenent→artesà (anys de formació · ritu pas)',
            'Cicle artesà↔galeria (consignació ⇄ venda ⇄ liquidació)',
        ],

        // v145b · anchoring específic (deliverables + transactions canòniques)
        deliverables_tangible: [
            'Peça artesanal única',
            'Encàrrec a mida',
            'Conveni amb galeria',
            'Curs / taller obert',
            'Catàleg d\'obra',
            'Certificat d\'autenticitat',
            'Factura venda directa',
            'Memòria taller anual',
        ],
        transactions_canonical: [
            { from: 'master-craftsperson', to: 'apprentice', deliverable: 'Formació / mentoring', type: 'intangible', frequency: 'daily', trigger: 'taller obert' },
            { from: 'craftsperson', to: 'customer-direct', deliverable: 'Peça artesanal', type: 'tangible', frequency: 'on-demand', trigger: 'encàrrec' },
            { from: 'customer-direct', to: 'master-craftsperson', deliverable: 'Pagament + agraïment', type: 'tangible', frequency: 'per-piece', trigger: 'entrega' },
            { from: 'gallery-shop', to: 'master-craftsperson', deliverable: 'Comissió venda', type: 'tangible', frequency: 'monthly', trigger: 'liquidació' },
            { from: 'craft-association', to: 'master-craftsperson', deliverable: 'Certificat autenticitat', type: 'tangible', frequency: 'yearly', trigger: 'revisió anual' },
        ],
    },

    // ── PUBLIC-ADMIN (ajuntament · districte · entitat pública local) ───
    'public-admin': {
        label: 'Administració pública · ajuntament · districte',
        keywords: [
            'ajuntament', 'ayuntamiento', 'town hall', 'municipality',
            'consell comarcal', 'consejo comarcal',
            'diputació', 'diputación', 'provincial council',
            'generalitat', 'comunidad autónoma',
            'ministeri', 'ministerio', 'ministry',
            'funcionari', 'funcionaria', 'funcionario', 'civil servant',
            'regidor', 'regidora', 'concejal', 'concejala',
            'pressupost participatiu', 'presupuesto participativo',
        ],
        sectorHints: ['O'],
        archetypes: [
            { id: 'mayor-leader',       kind: 'founder',     name: 'Alcalde/Alcaldessa · Cap polític', castell: 'pom_de_dalt', desc: 'Visió política · representació · veto pressupost' },
            { id: 'councilor-area',     kind: 'pm',          name: 'Regidor/a d\'àrea',            castell: 'tronc',       desc: 'Cultura/educació/urbanisme/... · plans i pressupost' },
            { id: 'department-head',    kind: 'pm',          name: 'Cap de Departament Tècnic',    castell: 'tronc',       desc: 'Coordinació funcionaris · execució plans · informes' },
            { id: 'civil-servant',      kind: 'coder',       name: 'Funcionari/a',                 castell: 'pinya',       desc: 'Atenció pública · expedients · compliment normatiu' },
            { id: 'citizen-resident',   kind: 'facilitator', name: 'Ciutadania · Veïnatge',        castell: 'baixos',      desc: 'Receptora serveis · vot · participació · queixes' },
            { id: 'civic-association',  kind: 'facilitator', name: 'Entitat Cívica',               castell: 'baixos',      desc: 'AMPAs · veïns · cooperatives · diàleg estructurat' },
            { id: 'opposition-party',   kind: 'reviewer',    name: 'Oposició · Grup polític',      castell: 'laterals',    desc: 'Control · esmenes · auditories · escrutini públic' },
            { id: 'state-supervision',  kind: 'reviewer',    name: 'Tribunal Comptes · Auditoria', castell: 'laterals',    desc: 'Legalitat · transparència · execució pressupost' },
        ],
        intangibles: [
            'Legitimitat democràtica (vot · transparència)',
            'Confiança institucional (gestió justa · no clientelisme)',
            'Cultura del servei públic (vocació · no només feina)',
        ],
        patterns: [
            'Cicle ciutadania↔ajuntament (impostos ⇄ serveis ⇄ vot)',
            'Reciprocitat regidoria↔entitats cíviques (subvenció ⇄ activitat al territori)',
        ],

        // v145b · anchoring específic (deliverables + transactions canòniques)
        deliverables_tangible: [
            'Ple municipal · acta',
            'Pressupost anual aprovat',
            'Llicència / permís',
            'Ordenança municipal',
            'Resolució d\'expedient',
            'Memòria d\'activitats',
            'Conveni amb associacions',
            'Informe d\'auditoria pública',
        ],
        transactions_canonical: [
            { from: 'mayor-leader', to: 'department-head', deliverable: 'Mandat polític', type: 'intangible', frequency: 'monthly', trigger: 'prioritats consell' },
            { from: 'civil-servant', to: 'citizen-resident', deliverable: 'Llicència / permís', type: 'tangible', frequency: 'on-demand', trigger: 'sol·licitud ciutadana' },
            { from: 'citizen-resident', to: 'civic-association', deliverable: 'Participació veïnal', type: 'intangible', frequency: 'monthly', trigger: 'assemblea barri' },
            { from: 'opposition-party', to: 'mayor-leader', deliverable: 'Control crític', type: 'intangible', frequency: 'monthly', trigger: 'ple ordinari' },
            { from: 'state-supervision', to: 'mayor-leader', deliverable: 'Informe d\'auditoria', type: 'tangible', frequency: 'yearly', trigger: 'revisió comptes' },
        ],
    },

    // ── NGO (ONG internacional · associació humanitària) ────────────────
    'ngo-humanitarian': {
        label: 'ONG · associació humanitària · entitat social',
        keywords: [
            'ong', 'ngo', 'organització no governamental',
            'cooperació internacional', 'international cooperation',
            'humanitari', 'humanitario', 'humanitarian',
            'refugiat', 'refugiado', 'refugee',
            'desenvolupament', 'desarrollo', 'development cooperation',
            'fundació', 'fundación', 'foundation',
            'associació sense afany de lucre', 'asociación sin fines de lucro',
        ],
        sectorHints: ['S', 'Q'],
        archetypes: [
            { id: 'executive-director', kind: 'founder',     name: 'Director/a Executiu/va',       castell: 'pom_de_dalt', desc: 'Estratègia · representació · captació fons · board' },
            { id: 'program-manager',    kind: 'pm',          name: 'Coordinador/a Programa',       castell: 'tronc',       desc: 'Projectes terreny · M&E · reporting donants' },
            { id: 'field-worker',       kind: 'coder',       name: 'Cooperant · Treballador/a terreny', castell: 'pinya',  desc: 'Impacte directe · contacte beneficiaris · informes' },
            { id: 'volunteer',          kind: 'facilitator', name: 'Voluntari/a',                  castell: 'mans',        desc: 'Aportació puntual · campanyes · suport oficines' },
            { id: 'beneficiary',        kind: 'facilitator', name: 'Beneficiari/a',                castell: 'baixos',      desc: 'Receptor/a programa · drets · participació pròpia' },
            { id: 'donor-funder',       kind: 'facilitator', name: 'Donant · Finançador',          castell: 'baixos',      desc: 'Govern · fundació · particulars · empreses · expectatives reporting' },
            { id: 'board-trustees',     kind: 'reviewer',    name: 'Junta · Patronat',             castell: 'laterals',    desc: 'Governança · auditoria · estratègia llarg termini' },
            { id: 'audit-compliance',   kind: 'reviewer',    name: 'Auditoria · Compliance',       castell: 'laterals',    desc: 'Transparència · ús fons · accountability donants' },
        ],
        intangibles: [
            'Llegitimitat moral (causa coherent · NO white savior)',
            'Confiança donants (rendició clara)',
            'Apoderament beneficiaris (NO dependència)',
        ],
        patterns: [
            'Cicle donant↔programa (fons ⇄ resultats ⇄ report)',
            'Reciprocitat ONG↔comunitat (suport ⇄ legitimitat local)',
        ],

        // v145b · anchoring específic (deliverables + transactions canòniques)
        deliverables_tangible: [
            'Programa d\'intervenció',
            'Pla operatiu anual',
            'Informe d\'avaluació programa',
            'Sol·licitud subvenció',
            'Memòria d\'impacte',
            'Acta junta directiva',
            'Pressupost anual',
            'Informe auditoria externa',
        ],
        transactions_canonical: [
            { from: 'executive-director', to: 'program-manager', deliverable: 'Pla operatiu anual', type: 'tangible', frequency: 'yearly', trigger: 'planning estratègic' },
            { from: 'program-manager', to: 'field-worker', deliverable: 'Mandat tasca', type: 'intangible', frequency: 'weekly', trigger: 'planning operatiu' },
            { from: 'field-worker', to: 'beneficiary', deliverable: 'Assistència directa', type: 'tangible', frequency: 'daily', trigger: 'intervenció camp' },
            { from: 'donor-funder', to: 'executive-director', deliverable: 'Aportació econòmica', type: 'tangible', frequency: 'yearly', trigger: 'subvenció resolta' },
            { from: 'audit-compliance', to: 'board-trustees', deliverable: 'Informe auditoria', type: 'tangible', frequency: 'yearly', trigger: 'final exercici' },
        ],
    },

    // ── MAKER-SPACE (fab-lab · hackerspace · maker collective) ──────────
    'maker-space': {
        label: 'Maker space / Fab Lab / hackerspace',
        keywords: [
            'maker', 'makers', 'fab lab', 'fablab', 'hackerspace', 'hacker space',
            'taller obert', 'open workshop', 'taller comunitari',
            'impressora 3d', '3d printer', 'cnc', 'laser cutter',
            'arduino', 'raspberry pi', 'electronics workshop',
            'diy', 'do it yourself', 'bricolatge col·lectiu',
            'membership taller', 'quota mensual taller',
        ],
        sectorHints: ['C', 'J', 'P', 'R', 'S'],
        archetypes: [
            { id: 'lab-coordinator',    kind: 'pm',          name: 'Coordinador/a del Lab',      castell: 'tronc',       desc: 'Operativa · calendari · manteniment màquines · seguretat' },
            { id: 'member-maker',       kind: 'coder',       name: 'Membre Maker',                castell: 'pinya',       desc: 'Quota mensual · accés taller · projectes propis + col·laboratius' },
            { id: 'workshop-host',      kind: 'coder',       name: 'Tallerista (sessió)',         castell: 'pinya',       desc: 'Imparteix tallers · pagat o trueque per ús extra del lab' },
            { id: 'visitor-guest',      kind: 'facilitator', name: 'Visitant / Estudiant Puntual', castell: 'baixos',      desc: 'Sessió puntual · prova · sense membership · pot esdevenir membre' },
            { id: 'expert-mentor',      kind: 'reviewer',    name: 'Mentor/a Expert/a',           castell: 'laterals',    desc: 'Veterà · ajuda complexa · transmissió cultura tècnica' },
            { id: 'sponsor-equipment',  kind: 'facilitator', name: 'Sponsor d\'Equipament',       castell: 'baixos',      desc: 'Empresa o particular dona màquines · drets reduïts · visibilitat' },
            { id: 'community-online',   kind: 'facilitator', name: 'Comunitat Online',            castell: 'mans',        desc: 'Discord · wiki · documentació projectes · projecció pública' },
        ],
        intangibles: [
            'Cultura DIY · "fes-ho tu mateix" amb suport del col·lectiu',
            'Coneixement tàcit (transmès amb la pràctica · no manuals)',
            'Confiança per a compartir eines cares',
        ],
        patterns: [
            'Cicle membre↔lab (quota ⇄ accés + suport)',
            'Pipeline visitant→membre→mentor (rite of passage tècnic)',
            'Reciprocitat sponsor↔lab (equip ⇄ visibilitat + drets reduïts)',
        ],

        // v145b · anchoring específic (deliverables + transactions canòniques)
        deliverables_tangible: [
            'Quota mensual fab-lab',
            'Acord d\'ús d\'eines',
            'Plantilles open-source',
            'Pla d\'esdeveniments',
            'Projecte de membres',
            'Conveni amb sponsor',
            'Programa de tallers',
            'Memòria activitats anual',
        ],
        transactions_canonical: [
            { from: 'member-maker', to: 'lab-coordinator', deliverable: 'Quota mensual', type: 'tangible', frequency: 'monthly', trigger: 'subscripció' },
            { from: 'lab-coordinator', to: 'member-maker', deliverable: 'Accés eines + suport', type: 'intangible', frequency: 'daily', trigger: 'reserva taller' },
            { from: 'workshop-host', to: 'visitor-guest', deliverable: 'Taller obert', type: 'intangible', frequency: 'weekly', trigger: 'esdeveniment programat' },
            { from: 'expert-mentor', to: 'member-maker', deliverable: 'Mentoring tècnic', type: 'intangible', frequency: 'weekly', trigger: 'sessió programada' },
            { from: 'sponsor-equipment', to: 'lab-coordinator', deliverable: 'Aportació equipament', type: 'tangible', frequency: 'yearly', trigger: 'conveni partnership' },
        ],
    },

});

export const DOMAIN_IDS = Object.freeze(Object.keys(DOMAIN_PACKS));

// detectDomain · pure · retorna { domain, confidence, sub_sector, ... }
// Si confidence < 0.4 → retorna null per a forçar el fallback al catàleg estàndard.
export function detectDomain({ name = '', description = '', sector = null } = {}) {
    const haystack = ((name || '') + ' ' + (description || '')).toLowerCase();
    if (!haystack.trim()) return null;

    let best = { id: null, score: 0, pack: null };
    for (const [id, pack] of Object.entries(DOMAIN_PACKS)) {
        let score = 0;
        let matches = 0;
        for (const kw of pack.keywords) {
            if (haystack.includes(kw)) {
                matches++;
                // Pes · keywords amb longitud > 5 valuen més (menys ambigües)
                score += kw.length > 5 ? 2 : 1;
            }
        }
        // Bonus si el sector matcha
        if (sector && pack.sectorHints.includes(sector)) {
            score += 3;
        }
        // Penalitza si zero matches (només sector)
        if (matches === 0) score = 0;
        if (score > best.score) {
            best = { id, score, pack, matches };
        }
    }
    // Threshold · cal almenys 1 match keyword + score ≥ 2
    if (!best.id || best.score < 2) return null;
    const confidence = Math.min(1.0, best.score / 10);
    return {
        domain:      best.id,
        confidence:  Number(confidence.toFixed(2)),
        matchCount:  best.matches,
        scoreRaw:    best.score,
        archetypes:  best.pack.archetypes,
        intangibles: best.pack.intangibles,
        patterns:    best.pack.patterns,
        label:       best.pack.label,
        sectorHints: best.pack.sectorHints,
    };
}

export function listDomains() {
    return DOMAIN_IDS.map(id => ({
        id, label: DOMAIN_PACKS[id].label,
        archetypeCount: DOMAIN_PACKS[id].archetypes.length,
        sectorHints: DOMAIN_PACKS[id].sectorHints,
    }));
}

export function getDomainPack(domainId) {
    const p = DOMAIN_PACKS[domainId];
    return p ? { id: domainId, ...p } : null;
}

// formatArchetypesForPrompt · pure · serialitza per al prompt VNA
// Output curt + dens · llest per a injectar al body del task
export function formatArchetypesForPrompt(detection) {
    if (!detection || !detection.archetypes) return '';
    const lines = detection.archetypes.map(a =>
        `  · ${a.name} [${a.castell}] — ${a.desc}`
    );
    return lines.join('\n');
}

// detectDomainsMulti · v127 · retorna top N matches (no només el millor) ·
// útil per a projectes híbrids ("comunitat religiosa que gestiona una escola"
// = religious-community + edu-formation). Combina arquetip de les top 2 sense
// duplicar (per id). Threshold individual ≥ 2 (mateix que detectDomain).
export function detectDomainsMulti({ name = '', description = '', sector = null, topN = 2 } = {}) {
    const haystack = ((name || '') + ' ' + (description || '')).toLowerCase();
    if (!haystack.trim()) return [];
    const scored = [];
    for (const [id, pack] of Object.entries(DOMAIN_PACKS)) {
        let score = 0, matches = 0;
        for (const kw of pack.keywords) {
            if (haystack.includes(kw)) { matches++; score += kw.length > 5 ? 2 : 1; }
        }
        if (sector && pack.sectorHints.includes(sector)) score += 3;
        if (matches === 0) score = 0;
        if (score >= 2) {
            scored.push({
                domain: id, scoreRaw: score, matchCount: matches,
                confidence: Number(Math.min(1.0, score / 10).toFixed(2)),
                label: pack.label, archetypes: pack.archetypes,
                intangibles: pack.intangibles, patterns: pack.patterns,
                sectorHints: pack.sectorHints,
            });
        }
    }
    scored.sort((a, b) => b.scoreRaw - a.scoreRaw);
    return scored.slice(0, topN);
}

// combineDetections · v127 · si l'usuari té 2 dominis · combina arquetip
// (dedup per id + name) preservant top per a primary. Útil per quan la UX
// confirma híbrid o l'IA fallback diu "ambdós".
export function combineDetections(detections = []) {
    if (!Array.isArray(detections) || detections.length === 0) return null;
    if (detections.length === 1) return detections[0];
    const seen = new Set();
    const archetypes = [];
    const intangibles = new Set();
    const patterns = new Set();
    for (const d of detections) {
        for (const a of (d.archetypes || [])) {
            const k = a.id + '|' + a.name;
            if (seen.has(k)) continue;
            seen.add(k);
            archetypes.push(a);
        }
        (d.intangibles || []).forEach(s => intangibles.add(s));
        (d.patterns    || []).forEach(s => patterns.add(s));
    }
    return {
        domain:      detections.map(d => d.domain).join('+'),
        label:       detections.map(d => d.label).join(' + '),
        confidence:  Number((detections.reduce((s, d) => s + d.confidence, 0) / detections.length).toFixed(2)),
        matchCount:  detections.reduce((s, d) => s + (d.matchCount || 0), 0),
        scoreRaw:    detections.reduce((s, d) => s + (d.scoreRaw || 0), 0),
        archetypes,
        intangibles: Array.from(intangibles),
        patterns:    Array.from(patterns),
        composite:   true,
        components:  detections.map(d => d.domain),
    };
}
