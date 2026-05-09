// TEAMTOWERS SOS V11 — CRITICAL 108 ROLES (MAT-003 sprint A · Pantheon Work)
//
// Catálogo canónico de la matriz cognitiva fundacional Cohort 0.
// 108 plazas = 96 roles operativos (distribución por dominio) + 12
// guardianes Pantheon Work (consejo arquetípico).
//
// REFERENCIA · Pantheon Work · "Guía del Ejercicio de Reconocimiento
// de Competencias y Habilidades" · Versión 1.0 · 7 sept 2022 · CC BY 4.0
// · autores Toni Mascaró + Sergio Marrero · co-creadores originales del
// ejercicio Íngrid Astiz + Álvaro Solache (cita literal en pág. 16
// de la guía). Web · www.pantheon.work
//
// Las palabras clave de los 12 guardianes son las del cuestionario
// oficial del framework. 8/12 capturadas literalmente del PDF (figuras
// 5-6 y diapositiva ejemplo Hermes en pág. 21). 4/12 (Hefesto · Hera
// · Poseidón · Zeus) están en cuestionarios separados pendientes de
// llegar de @alvaro · marcadas con `pendingFromPantheonWork: true`.
//
// LICENCIA · Reconocimiento Pantheon Work como fuente original (CC BY 4.0).

// ─── Constantes Cohort 0 ────────────────────────────────────────────

export const COHORT_0_TOTAL    = 108;
export const OPERATIVE_SEATS   = 96;
export const GUARDIAN_SEATS    = 12;

// ─── Lógica trivalente (Pantheon Work · figura 3 de la guía) ────────
// Tres orientaciones dinámicas que estructuran el sistema simbólico
// de los guardianes. Una organización equilibra fuerzas opuestas
// asegurando que cada lógica tenga su trono.

export const PANTHEON_TRIVALENT_LOGIC = Object.freeze({
    distinguir: Object.freeze({
        id:    'distinguir',
        label: 'Distinguir y separar',
        body:  'Vela por las fronteras claras · individuación · análisis · separación entre lo propio y lo ajeno · jerarquías necesarias.',
    }),
    fusionar: Object.freeze({
        id:    'fusionar',
        label: 'Mezclar y confundir',
        body:  'Vela por la fusión · transformación · pérdida del límite · cohesión emocional profunda · matriz que lo contiene todo.',
    }),
    relacionar: Object.freeze({
        id:    'relacionar',
        label: 'Relacionar y sintetizar',
        body:  'Vela por el puente · conexión sin pérdida de identidad · síntesis · circulación · bricolaje creativo entre dominios.',
    }),
});

// ─── 10 prácticas nativas digitales (Pantheon Work · figura 2) ──────
// Tabla de prácticas que el framework propone. Útil para saber qué
// práctica vehicula cada guardián cuando trabaja en una organización.

export const PANTHEON_NATIVE_PRACTICES = Object.freeze([
    Object.freeze({ id: 'flujo-valor',          label: 'Ver todo como un flujo de valor' }),
    Object.freeze({ id: 'redes-nodos',          label: 'Ver todo como redes y nodos' }),
    Object.freeze({ id: 'gestion-conocimiento', label: 'Sistematizar la gestión de conocimiento' }),
    Object.freeze({ id: 'voz-alta',             label: 'Trabajar en voz alta' }),
    Object.freeze({ id: 'ecosistema',           label: 'Devolver al ecosistema' }),
    Object.freeze({ id: 'reconocer-competencias', label: 'Reconocer competencias y contribuciones' }),
    Object.freeze({ id: 'empoderar-mutuamente', label: 'Empoderar mutuamente' }),
    Object.freeze({ id: 'beta',                 label: 'Producir en beta' }),
    Object.freeze({ id: 'netiqueta-estricta',   label: 'Cumplir netiqueta estricta' }),
    Object.freeze({ id: 'memes-campanas',       label: 'Crear memes y campañas' }),
]);

// ─── 12 Guardianes Pantheon Work ───────────────────────────────────
// 8/12 con palabras clave literales del PDF · 4/12 pendientes de
// cuestionario oficial (Hefesto · Hera · Poseidón · Zeus).

export const PANTHEON_GUARDIANS = Object.freeze([
    Object.freeze({
        id:               'afrodita',
        pantheonNum:      1,
        name:             'Afrodita',
        domain:           'design',
        trivalentLogic:   'relacionar',
        keywords:         Object.freeze(['estética', 'belleza', 'atracción', 'seducción', 'transgresión', 'creatividad']),
        keywordsSource:   'pantheon.work · guía v1.0 · 7 sept 2022 · figura 5',
        exampleQuestions: Object.freeze([
            '¿Cómo podemos seducir estéticamente con el valor que aportamos? ¿Con qué diseño, imagen, palabra, gesto o interfaz?',
        ]),
        nativePractices:  Object.freeze(['memes-campanas', 'beta']),
        bootstrapsAll:    true,
        multiplier:       1.5,
        sopsBootstrap:    Object.freeze(['narrativa-marca', 'producto-mercado-fit', 'identidad-visual']),
    }),
    Object.freeze({
        id:               'apolo',
        pantheonNum:      2,
        name:             'Apolo',
        domain:           'education',
        trivalentLogic:   'distinguir',
        keywords:         Object.freeze(['conocimiento teórico', 'análisis', 'estructuración', 'depuración', 'predicción']),
        keywordsSource:   'pantheon.work · guía v1.0 · 7 sept 2022 · figura 5',
        exampleQuestions: Object.freeze([
            '¿Qué conocimiento hemos generado con nuestra experiencia? ¿Cómo imaginas el futuro?',
        ]),
        nativePractices:  Object.freeze(['gestion-conocimiento', 'voz-alta']),
        bootstrapsAll:    true,
        multiplier:       1.5,
        sopsBootstrap:    Object.freeze(['curriculum-metode-sos', 'analisis-prospectiva', 'documentacio-formativa']),
    }),
    Object.freeze({
        id:               'atenea',
        pantheonNum:      3,
        name:             'Atenea',
        domain:           'governance',
        trivalentLogic:   'distinguir',
        keywords:         Object.freeze(['conocimiento práctico', 'estrategia defensiva y ofensiva', 'destreza', 'civismo']),
        keywordsSource:   'pantheon.work · guía v1.0 · 7 sept 2022 · figura 5',
        exampleQuestions: Object.freeze([
            '¿Cómo pasamos de la teoría a la práctica? ¿Cómo protegemos el flujo de valor?',
        ]),
        nativePractices:  Object.freeze(['netiqueta-estricta', 'flujo-valor']),
        bootstrapsAll:    true,
        multiplier:       1.8, // estrategia + governance · peso extra
        sopsBootstrap:    Object.freeze(['estrategia-projecte', 'protecció-flujo-valor', 'governance-deliberativa']),
    }),
    Object.freeze({
        id:               'demeter',
        pantheonNum:      4,
        name:             'Demeter',
        domain:           'ecology',
        trivalentLogic:   'fusionar',
        keywords:         Object.freeze(['generación', 'regeneración', 'replicación', 'polinización']),
        keywordsSource:   'pantheon.work · guía v1.0 · 7 sept 2022 · figura 5',
        exampleQuestions: Object.freeze([
            '¿Cómo podemos aumentar el valor y su flujo en nuestro ecosistema? ¿Cómo cuidamos a sus integrantes?',
        ]),
        nativePractices:  Object.freeze(['ecosistema', 'flujo-valor']),
        bootstrapsAll:    true,
        multiplier:       1.5,
        sopsBootstrap:    Object.freeze(['regeneració-cicles', 'replicació-projecte', 'pol·linització-network']),
    }),
    Object.freeze({
        id:               'dionisio',
        pantheonNum:      5,
        name:             'Dionisio',
        domain:           'culture',
        trivalentLogic:   'fusionar',
        keywords:         Object.freeze(['socialización', 'celebración', 'juego', 'hedonismo', 'invención', 'conquista']),
        keywordsSource:   'pantheon.work · guía v1.0 · 7 sept 2022 · figura 5',
        exampleQuestions: Object.freeze([
            '¿Cómo favorecemos la empatía y la apertura? ¿Cómo celebrar los éxitos? ¿Cómo impulsar la creatividad?',
        ]),
        nativePractices:  Object.freeze(['empoderar-mutuamente', 'memes-campanas']),
        bootstrapsAll:    true,
        multiplier:       1.5,
        sopsBootstrap:    Object.freeze(['ritual-celebració', 'sessió-creativa', 'cohesió-emocional']),
    }),
    Object.freeze({
        id:               'hebe',
        pantheonNum:      6,
        name:             'Hebe',
        domain:           'operations',
        trivalentLogic:   'distinguir',
        keywords:         Object.freeze(['apoyo logístico', 'aprovisionamiento', 'intendencia', 'rejuvenecimiento']),
        keywordsSource:   'pantheon.work · guía v1.0 · 7 sept 2022 · figura 5',
        exampleQuestions: Object.freeze([
            '¿Cómo resolvemos la intendencia? ¿Cómo renovamos la energía del equipo o proyecto?',
        ]),
        nativePractices:  Object.freeze(['empoderar-mutuamente', 'beta']),
        bootstrapsAll:    true,
        multiplier:       1.3,
        sopsBootstrap:    Object.freeze(['logística-projecte', 'aprovisionament-recursos', 'onboarding-cohort']),
    }),
    Object.freeze({
        id:               'hefesto',
        pantheonNum:      7,
        name:             'Hefesto',
        domain:           'tech',
        trivalentLogic:   'fusionar',
        keywords:         Object.freeze(['forja', 'técnica', 'herramientas', 'ingeniería', 'infraestructura', 'especialización', 'mantenimiento']),
        keywordsSource:   '__draft · interpretación basada en Robert Graves "Los Mitos Griegos" + Stephen Fry "Mythos" (referencias citadas en PDF Pantheon Work pág. 12). Sustituir por oficial cuando llegue cuestionario pantheon.work.',
        keywordsDraft:    true,
        pendingFromPantheonWork: true,
        exampleQuestions: Object.freeze([
            '¿Qué herramientas necesita el equipo? ¿Cómo aseguramos la forja y el mantenimiento técnico del flujo de valor?',
        ]),
        nativePractices:  Object.freeze(['gestion-conocimiento', 'beta']),
        bootstrapsAll:    true,
        multiplier:       1.5,
        sopsBootstrap:    Object.freeze(['arquitectura-sistemes', 'forja-eines', 'manteniment-tecnic']),
    }),
    Object.freeze({
        id:               'hera',
        pantheonNum:      8,
        name:             'Hera',
        domain:           'legal',
        trivalentLogic:   'fusionar',
        keywords:         Object.freeze(['pacto', 'alianza', 'fidelidad', 'institución', 'jerarquía formal', 'ritual', 'contrato']),
        keywordsSource:   '__draft · interpretación basada en Robert Graves "Los Mitos Griegos" + Stephen Fry "Mythos" (referencias citadas en PDF Pantheon Work pág. 12). Sustituir por oficial cuando llegue cuestionario pantheon.work.',
        keywordsDraft:    true,
        pendingFromPantheonWork: true,
        exampleQuestions: Object.freeze([
            '¿Cómo formalizamos los pactos? ¿Cómo se sostiene la fidelidad estructural entre socios?',
        ]),
        nativePractices:  Object.freeze(['netiqueta-estricta', 'reconocer-competencias']),
        bootstrapsAll:    true,
        multiplier:       1.5,
        sopsBootstrap:    Object.freeze(['pacte-socis', 'compliance-cooperatiu', 'fidelitat-estructural']),
    }),
    Object.freeze({
        id:               'hermes',
        pantheonNum:      9,
        name:             'Hermes',
        domain:           'community',
        trivalentLogic:   'relacionar',
        keywords:         Object.freeze(['comunicación', 'intercambio', 'guía', 'invención', 'argucia', 'transgresión']),
        keywordsSource:   'pantheon.work · guía v1.0 · 7 sept 2022 · figura 8 (diapositiva ejemplo)',
        exampleQuestions: Object.freeze([
            '¿Cómo abrimos canales de intercambio? ¿Cómo guiamos a quienes vienen de fuera?',
        ]),
        nativePractices:  Object.freeze(['redes-nodos', 'voz-alta']),
        bootstrapsAll:    true,
        multiplier:       1.5,
        sopsBootstrap:    Object.freeze(['comunicació-externa', 'intercanvi-cooperatives', 'mediació-traducció']),
    }),
    Object.freeze({
        id:               'hestia',
        pantheonNum:      10,
        name:             'Hestia',
        domain:           'community',
        trivalentLogic:   'relacionar',
        keywords:         Object.freeze(['espacios', 'encuentros', 'conversación', 'centro', 'alma']),
        keywordsSource:   'pantheon.work · guía v1.0 · 7 sept 2022 · figura 6',
        exampleQuestions: Object.freeze([
            '¿Cómo mejorar dinámicas y espacios de conversación? ¿Cómo conectamos a las personas? ¿Cómo acogemos a los nuevos?',
        ]),
        nativePractices:  Object.freeze(['empoderar-mutuamente', 'reconocer-competencias']),
        bootstrapsAll:    true,
        multiplier:       1.5,
        sopsBootstrap:    Object.freeze(['acollida-nova-plaça', 'espais-de-conversa', 'rituals-de-llar']),
    }),
    Object.freeze({
        id:               'poseidon',
        pantheonNum:      11,
        name:             'Poseidón',
        domain:           'finance',
        trivalentLogic:   'distinguir',
        keywords:         Object.freeze(['capital', 'riesgo', 'profundidad', 'audacia', 'decisión disruptiva', 'exit', 'oráculo', 'liquidación']),
        keywordsSource:   '__draft · interpretación basada en Robert Graves "Los Mitos Griegos" + Stephen Fry "Mythos" (referencias citadas en PDF Pantheon Work pág. 12). Sustituir por oficial cuando llegue cuestionario pantheon.work.',
        keywordsDraft:    true,
        pendingFromPantheonWork: true,
        exampleQuestions: Object.freeze([
            '¿Cómo gestionamos el capital y el riesgo? ¿Cuándo y cómo se activa el exit del proyecto?',
        ]),
        nativePractices:  Object.freeze(['flujo-valor', 'beta']),
        bootstrapsAll:    true,
        multiplier:       1.5,
        sopsBootstrap:    Object.freeze(['gestió-capital-risc', 'finestres-liquidació', 'oràcle-de-preus']),
    }),
    Object.freeze({
        id:               'zeus',
        pantheonNum:      12,
        name:             'Zeus',
        domain:           'governance',
        trivalentLogic:   'relacionar',
        keywords:         Object.freeze(['soberanía', 'visión', 'autoridad delegada', 'justicia última', 'fundación', 'sponsor estratégico', 'mando']),
        keywordsSource:   '__draft · interpretación basada en Robert Graves "Los Mitos Griegos" + Stephen Fry "Mythos" (referencias citadas en PDF Pantheon Work pág. 12). Sustituir por oficial cuando llegue cuestionario pantheon.work.',
        keywordsDraft:    true,
        pendingFromPantheonWork: true,
        exampleQuestions: Object.freeze([
            '¿Quién tiene la última palabra en la visión estratégica? ¿Cómo delegamos autoridad sin diluir el rumbo?',
        ]),
        nativePractices:  Object.freeze(['flujo-valor', 'reconocer-competencias']),
        bootstrapsAll:    true,
        multiplier:       2.0, // soberanía / visión última · peso máximo
        sopsBootstrap:    Object.freeze(['visió-estratègica-fundacional', 'sponsor-últim-projecte', 'reconeixement-competències']),
    }),
]);

// ─── Distribución de las 96 plazas operativas por dominio ───────────
// Validada con @alvaro 2026-05-08 · suma = 96. Las plazas guardianas
// son adicionales y NO consumen estos cupos.

export const OPERATIVE_DOMAIN_DISTRIBUTION = Object.freeze({
    governance:  8,
    finance:    12,
    tech:       16,
    design:      8,
    operations: 12,
    community:  12,
    legal:       6,
    ecology:     8,
    education:   8,
    culture:     6,
});

// ─── 12 tipos de proyecto cliente (signo dels temps 2026) ──────────
// Validados con @alvaro 2026-05-08. Cada tipo declarará en sprint E
// `requiredRoles ⊂ los 96 operativos` y `requiredGuardians ⊂ los 12`.

export const PROJECT_TYPES = Object.freeze([
    Object.freeze({ id: 'comunitat-autosuficient',   num: '01', label: 'Comunitat autosuficient',                  hint: 'Hortet · ateneu · cura · habitatge col·laboratiu · transició energètica local' }),
    Object.freeze({ id: 'startup-coop-tradicional',  num: '02', label: 'Startup cooperativa o tradicional',        hint: 'Founders que renuncien a VC tradicional · cap-tables obertes' }),
    Object.freeze({ id: 'empresa-en-transicio',      num: '03', label: 'Empresa establerta en transició',          hint: 'Conversió a SCCL · slicing pie aplicat a equips existents' }),
    Object.freeze({ id: 'cooperativa-multi',         num: '04', label: 'Cooperativa multi-stakeholder',            hint: 'Consum · treball · serveis · habitatge (model COCETA)' }),
    Object.freeze({ id: 'fundacio-ong',              num: '05', label: 'Fundació · Associació · ONG',              hint: 'Sense repartiment però amb governance complexa · operativa SOP' }),
    Object.freeze({ id: 'ecosistema-regional',       num: '06', label: 'Ecosistema regional regeneratiu',          hint: 'Comarcal · biorregional · cooperatives federades (model Coopdevs)' }),
    Object.freeze({ id: 'dao-web3',                  num: '07', label: 'DAO · Web3 descentralitzat',               hint: 'RegenDAO · ReFi · DAO amb projectes físics' }),
    Object.freeze({ id: 'plataforma-cooperativa',    num: '08', label: 'Plataforma cooperativa digital',           hint: 'Alternativa a Uber/Airbnb (Smart · Eva · CoopCycle · Loconomics)' }),
    Object.freeze({ id: 'cooperativa-cures',         num: '09', label: 'Cooperativa de cures',                     hint: 'Cura mental · diversitat funcional · majors · acompanyament a final de vida' }),
    Object.freeze({ id: 'espai-autogestionat',       num: '10', label: 'Espai autogestionat / coliving',           hint: 'CSO · ateneu de barri · co-housing · espais culturals' }),
    Object.freeze({ id: 'hub-transicio',             num: '11', label: 'Hub de transició sectorial',               hint: 'Alimentari · energètic · cultural · digital sostenible (Transition Network)' }),
    Object.freeze({ id: 'familiar-relevo',           num: '12', label: 'Empresa familiar en relleu intergeneracional', hint: 'Successió ordenada amb slicing pie · capital paterno-familiar a cooperatiu' }),
]);

// ─── Helpers puros · queries del catálogo ──────────────────────────

export function getGuardianById(id) {
    if (typeof id !== 'string' || !id) return null;
    return PANTHEON_GUARDIANS.find(g => g.id === id) || null;
}

export function getGuardiansByDomain(domain) {
    if (typeof domain !== 'string' || !domain) return [];
    return PANTHEON_GUARDIANS.filter(g => g.domain === domain);
}

export function getGuardiansByTrivalentLogic(logicId) {
    if (typeof logicId !== 'string' || !logicId) return [];
    return PANTHEON_GUARDIANS.filter(g => g.trivalentLogic === logicId);
}

export function getProjectTypeById(id) {
    if (typeof id !== 'string' || !id) return null;
    return PROJECT_TYPES.find(t => t.id === id) || null;
}

// guardiansPendingKeywords() → guardianes con cuestionario oficial pendiente
// (las palabras clave actuales pueden estar en `__draft` interpretativo).
export function guardiansPendingKeywords() {
    return PANTHEON_GUARDIANS.filter(g => g.pendingFromPantheonWork === true);
}

export function guardiansWithKeywords() {
    return PANTHEON_GUARDIANS.filter(g => Array.isArray(g.keywords) && g.keywords.length > 0);
}

// guardiansWithDraftKeywords() → palabras clave borrador interpretativo
// (basado en Graves + Fry · sustituir cuando llegue oficial pantheon.work).
export function guardiansWithDraftKeywords() {
    return PANTHEON_GUARDIANS.filter(g => g.keywordsDraft === true);
}

// guardiansWithOfficialKeywords() → palabras clave literales del PDF oficial.
export function guardiansWithOfficialKeywords() {
    return PANTHEON_GUARDIANS.filter(g => Array.isArray(g.keywords) && g.keywords.length > 0 && g.keywordsDraft !== true);
}

// coverageReport() → resumen para verificar la integridad de la matriz.
export function coverageReport() {
    const domainCoverage = {};
    Object.keys(OPERATIVE_DOMAIN_DISTRIBUTION).forEach(d => {
        domainCoverage[d] = {
            operativeSeats: OPERATIVE_DOMAIN_DISTRIBUTION[d],
            guardians:      getGuardiansByDomain(d).map(g => g.id),
        };
    });
    const trivalent = {
        distinguir: getGuardiansByTrivalentLogic('distinguir').map(g => g.id),
        fusionar:   getGuardiansByTrivalentLogic('fusionar').map(g => g.id),
        relacionar: getGuardiansByTrivalentLogic('relacionar').map(g => g.id),
    };
    return {
        cohort0Total:     COHORT_0_TOTAL,
        operativeSeats:   OPERATIVE_SEATS,
        guardianSeats:    GUARDIAN_SEATS,
        operativeDomainSum: Object.values(OPERATIVE_DOMAIN_DISTRIBUTION).reduce((a, b) => a + b, 0),
        domainCoverage,
        trivalent,
        guardiansPending: guardiansPendingKeywords().map(g => g.id),
        guardiansReady:   guardiansWithKeywords().map(g => g.id),
        guardiansOfficial: guardiansWithOfficialKeywords().map(g => g.id),
        guardiansDraft:    guardiansWithDraftKeywords().map(g => g.id),
        projectTypes:     PROJECT_TYPES.length,
    };
}
