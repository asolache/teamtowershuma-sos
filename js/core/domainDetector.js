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
