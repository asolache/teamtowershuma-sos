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
