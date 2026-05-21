// =============================================================================
// TEAMTOWERS SOS V11 — KNOWLEDGE LOADER
// Ruta: /js/core/KnowledgeLoader.js
//
// Responsabilidades:
//   1. Cargar ficheros MD de /knowledge/ via fetch() relativo (Netlify static)
//   2. Parsear YAML frontmatter → objetos JS (roles, transactions, patterns)
//   3. Construir systemPrompt enriquecido para llamadas LLM (Context-First AI)
//   4. Exportar seeds de roles/transacciones para el canvas VNA (ValueMapView)
//
// Principio: el fichero MD tiene doble función — contexto para IA y seed de datos.
// Cualquier IA via API puede consumir este mismo conocimiento.
// =============================================================================

const KNOWLEDGE_BASE    = '/knowledge';
const MAX_CONTEXT_CHARS = 12000; // ~3000 tokens — margen para el prompt de tarea

// ─── Mapa CNAE completo → ruta del sector ────────────────────────────────────
const SECTOR_MAP = {
    'A': 'sectors/A.md', 'B': 'sectors/B.md', 'C': 'sectors/C.md',
    'D': 'sectors/D.md', 'E': 'sectors/E.md', 'F': 'sectors/F.md',
    'G': 'sectors/G.md', 'H': 'sectors/H.md', 'I': 'sectors/I.md',
    'J': 'sectors/J.md', 'K': 'sectors/K.md', 'L': 'sectors/L.md',
    'M': 'sectors/M.md', 'N': 'sectors/N.md', 'O': 'sectors/O.md',
    'P': 'sectors/P.md', 'Q': 'sectors/Q.md', 'R': 'sectors/R.md',
    'S': 'sectors/S.md', 'T': 'sectors/T.md', 'UV': 'sectors/UV.md',
    'construccion':    'sectors/F.md', 'construction':   'sectors/F.md',
    'obra':            'sectors/F.md', 'inmobiliaria':   'sectors/F.md',
    'promotora':       'sectors/F.md',
    'tech':            'sectors/K.md', 'tecnologia':     'sectors/K.md',
    'software':        'sectors/K.md', 'saas':           'sectors/K.md',
    'ia':              'sectors/K.md', 'digital':        'sectors/K.md',
    'startup':         'sectors/K.md', 'ciberseguridad': 'sectors/K.md',
    'educacion':       'sectors/Q.md', 'education':      'sectors/Q.md',
    'formacion':       'sectors/Q.md', 'universidad':    'sectors/Q.md',
    'escuela':         'sectors/Q.md', 'edtech':         'sectors/Q.md',
    'salud':           'sectors/R.md', 'sanidad':        'sectors/R.md',
    'hospital':        'sectors/R.md', 'clinica':        'sectors/R.md',
    'healthtech':      'sectors/R.md', 'biotech':        'sectors/R.md',
    'consultoria':     'sectors/N.md', 'consulting':     'sectors/N.md',
    'diseno':          'sectors/N.md', 'marketing':      'sectors/N.md',
    'arquitectura':    'sectors/N.md', 'legal':          'sectors/N.md',
    'investigacion':   'sectors/N.md',
    'finanzas':        'sectors/L.md', 'fintech':        'sectors/L.md',
    'banca':           'sectors/L.md', 'seguros':        'sectors/L.md',
    'manufactura':     'sectors/C.md', 'industria':      'sectors/C.md',
    'comercio':        'sectors/G.md', 'retail':         'sectors/G.md',
    'ecommerce':       'sectors/G.md',
    'logistica':       'sectors/H.md', 'transporte':     'sectors/H.md',
    'hosteleria':      'sectors/I.md', 'turismo':        'sectors/I.md',
    'media':           'sectors/J.md', 'editorial':      'sectors/J.md',
    'entretenimiento': 'sectors/S.md', 'deporte':        'sectors/S.md',
    'energia':         'sectors/D.md', 'renovables':     'sectors/D.md',
    'agua':            'sectors/E.md', 'medioambiente':  'sectors/E.md',
    'agricultura':     'sectors/A.md', 'agro':           'sectors/A.md',
    'gobierno':        'sectors/P.md', 'publico':        'sectors/P.md',
};

// ─── Reglas de auto-detección de sector desde texto libre ────────────────────
const DETECTION_RULES = [
    { pattern: /construcci|obra\s+civil|promotor|edificaci|contratista|aparejador/i,         sector: 'F' },
    { pattern: /software|saas|startup|cibersegur|devops|cloud|machine\s+learning/i,          sector: 'K' },
    { pattern: /tecnolog|digital|plataforma\s+digital|desarrollo\s+web/i,                    sector: 'K' },
    { pattern: /escuela|universidad|postgrado|formaci[oó]n|e-?learning|edtech|docente/i,     sector: 'Q' },
    { pattern: /hospital|cl[ií]nica|paciente|sanitari|m[eé]dic|enfermer|biotech/i,           sector: 'R' },
    { pattern: /consultora|consultor[ií]a|consultor\b|i\+d\b|dise[nñ]o\s+estrat/i,          sector: 'N' },
    { pattern: /banco|fintech|seguro\s+de|mutua|fondo\s+de\s+inversi/i,                      sector: 'L' },
    { pattern: /f[aá]brica|manufactur|producci[oó]n\s+industrial/i,                          sector: 'C' },
    { pattern: /supermercado|tienda|retail|e-?commerce|distribuc/i,                          sector: 'G' },
    { pattern: /log[ií]stica|transporte\s+de|almac[eé]n|paqueter[ií]a/i,                    sector: 'H' },
    { pattern: /hotel|hostal|restaurante|catering|turismo/i,                                  sector: 'I' },
    { pattern: /medios\s+de\s+comunicaci|editorial|cine|radiodifusi/i,                       sector: 'J' },
    { pattern: /energ[ií]a|planta\s+el[eé]ctrica|renovable|fotovoltaic/i,                    sector: 'D' },
    { pattern: /agric|ganaderi|pesca|cultivo|agro/i,                                          sector: 'A' },
    { pattern: /evento|festival|deporte\s+profesional|cultura\s+y/i,                         sector: 'S' },
    { pattern: /administraci[oó]n\s+p[uú]blica|ayuntamiento|gobierno|ministerio/i,           sector: 'P' },
];

// =============================================================================
export class KnowledgeLoader {

    static _cache  = {};   // path → texto raw del MD
    static _parsed = {};   // path → objeto parseado

    // ══════════════════════════════════════════════════════════════════════════
    //  loadFile — fetch con cache en memoria
    // ══════════════════════════════════════════════════════════════════════════
    static async loadFile(path) {
        if (this._cache[path]) return this._cache[path];
        try {
            const res = await fetch(KNOWLEDGE_BASE + '/' + path);
            if (!res.ok) return null;
            const text = await res.text();
            this._cache[path] = text;
            return text;
        } catch (_) {
            return null;
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  parseFile — carga y parsea un MD con YAML frontmatter
    //  Devuelve: { frontmatter, body, roles, transactions, patterns,
    //              sectorId, sectorName } | null
    // ══════════════════════════════════════════════════════════════════════════
    static async parseFile(path) {
        if (this._parsed[path]) return this._parsed[path];
        const raw = await this.loadFile(path);
        if (!raw) return null;
        const result = this._parseMarkdownWithFrontmatter(raw);
        this._parsed[path] = result;
        return result;
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  getSectorSeed — roles y transacciones de un sector como arrays JS
    //  Uso principal: ValueMapView para precargar el canvas
    // ══════════════════════════════════════════════════════════════════════════
    static async getSectorSeed(sectorId) {
        const path   = this._resolveSectorPath(sectorId);
        if (!path) return null;
        const parsed = await this.parseFile(path);
        if (!parsed) return null;
        var lang2  = (typeof window !== 'undefined' && window.__lang) ? window.__lang : 'en';
        var snEn   = parsed.frontmatter.sector_name_en || parsed.sectorName || '';
        var snEs   = parsed.sectorName || snEn;
        // Opción A: aplicar campos bilingüe a roles y transactions
        var roles = (parsed.roles || []).map(function(r) {
            return Object.assign({}, r, {
                name:        (lang2 === 'en' && r.name_en)        ? r.name_en        : (r.name || r.id),
                description: (lang2 === 'en' && r.description_en) ? r.description_en : (r.description || ''),
            });
        });
        var transactions = (parsed.transactions || []).map(function(t) {
            return Object.assign({}, t, {
                deliverable: (lang2 === 'en' && t.deliverable_en) ? t.deliverable_en : (t.deliverable || ''),
            });
        });
        return {
            sectorId:     parsed.sectorId || sectorId,
            sectorName:   lang2 === 'en' ? snEn : snEs,
            roles:        roles,
            transactions: transactions,
            patterns:     parsed.patterns || [],
        };
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  getClientSeed — carga modelo VNA guardado de un cliente
    //  Uso: replicar mapa para sedes, franquicias o proyectos derivados
    // ══════════════════════════════════════════════════════════════════════════
    static async getClientSeed(clientId) {
        const path   = 'clients/' + clientId + '/vna-model.md';
        const parsed = await this.parseFile(path);
        if (!parsed) return null;
        return {
            clientId,
            projectName:  parsed.frontmatter.project_name || clientId,
            roles:        parsed.roles        || [],
            transactions: parsed.transactions || [],
            patterns:     parsed.patterns     || [],
        };
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  buildContext — construye bloque de contexto para systemPrompt del LLM
    //
    //  options:
    //    sector        string   — id CNAE, nombre o alias
    //    clientId      string   — id del modelo de cliente guardado
    //    existingMap   object   — { roles, transactions } ya en el proyecto
    //    includeVna    boolean  — incluir vna-principles.md (default true)
    //    includeVision boolean  — incluir mind-architecture.md (default false)
    //    freeText      string   — descripción libre para auto-detectar sector
    //    taskContext   string   — descripción de la rutina activa
    //
    //  Devuelve: { systemPrompt, sources, detectedSector }
    // ══════════════════════════════════════════════════════════════════════════
    static async buildContext(options = {}) {
        const {
            sector        = null,
            clientId      = null,
            existingMap   = null,
            includeVna    = true,
            includeVision = false,
            freeText      = '',
            taskContext   = '',
            socs          = null,   // ['slug', ...] | true | null  — inyectar SOCs públicos
            sops          = null,   // ['slug', ...] | true | null  — inyectar SOPs públicos
            projectId     = null,   // proyecto activo → cargar nodos KB Mind-as-Graph
        } = options;

        const parts          = [];
        const sources        = [];
        let   detectedSector = null;

        // ── 0. Principios VNA (base teórica) ─────────────────────────────────
        if (includeVna) {
            const vna = await this.loadFile('vision/vna-principles.md');
            if (vna) {
                parts.push('## PRINCIPIOS VNA (Verna Allee)\n' + this._extractBodyOnly(vna));
                sources.push('vision/vna-principles.md');
            }
        }

        // ── 1. Índice maestro ─────────────────────────────────────────────────
        const index = await this.loadFile('_index.md');
        if (index) {
            parts.push('## KNOWLEDGE BASE DISPONIBLE\n' + index);
            sources.push('_index.md');
        }

        // ── 2. Resolver sector ────────────────────────────────────────────────
        let resolvedSector = sector;
        if (!resolvedSector && freeText) {
            detectedSector = this._detectSector(freeText);
            resolvedSector = detectedSector;
        }

        if (resolvedSector) {
            const sectorPath   = this._resolveSectorPath(resolvedSector);
            const sectorParsed = sectorPath ? await this.parseFile(sectorPath) : null;
            if (sectorParsed) {
                const label = sectorParsed.sectorName || resolvedSector;
                parts.push(
                    '## SECTOR: ' + label.toUpperCase() + '\n' +
                    '### Roles como actividades VNA\n'    + this._rolesToContext(sectorParsed.roles) +
                    '\n### Transacciones frecuentes\n'    + this._transactionsToContext(sectorParsed.transactions) +
                    '\n### Patrones de disfunción\n'      + this._patternsToContext(sectorParsed.patterns) +
                    '\n### Contexto narrativo\n'          + sectorParsed.body
                );
                sources.push(sectorPath);
            }
        }

        // ── 3. Modelo de cliente guardado ─────────────────────────────────────
        if (clientId) {
            const clientSeed = await this.getClientSeed(clientId);
            if (clientSeed) {
                parts.push(
                    '## MODELO DE CLIENTE: ' + clientSeed.projectName.toUpperCase() + '\n' +
                    'Mapa VNA existente. Usar como base para sedes o proyectos derivados.\n' +
                    '### Roles\n'         + this._rolesToContext(clientSeed.roles) +
                    '\n### Transacciones\n' + this._transactionsToContext(clientSeed.transactions)
                );
                sources.push('clients/' + clientId + '/vna-model.md');
            }
        }

        // ── 4. Mapa VNA ya definido en el proyecto (Context-First) ───────────
        if (existingMap) {
            const mapRoles = existingMap.roles        || [];
            const mapTx    = existingMap.transactions || [];
            if (mapRoles.length > 0 || mapTx.length > 0) {
                parts.push(
                    '## ESTADO ACTUAL DEL MAPA VNA\n' +
                    'Roles ya definidos (' + mapRoles.length + '): ' +
                    mapRoles.map(r => r.name || r.id).join(', ') + '\n' +
                    'Transacciones ya definidas (' + mapTx.length + '): ' +
                    mapTx.map(t => t.deliverable || t.id).join(', ')
                );
            }
        }

        // ── 5. Visión Vedanta (solo si se pide) ───────────────────────────────
        if (includeVision) {
            const vision = await this.loadFile('vision/mind-architecture.md');
            if (vision) {
                parts.push('## ARQUITECTURA COGNITIVA\n' + this._extractBodyOnly(vision));
                sources.push('vision/mind-architecture.md');
            }
        }

        // ── 5b. SOCs públicos (knowledge/socs/*.md) ───────────────────────────
        if (socs) {
            const slugs = socs === true
                ? (await this.listSocs()).map(s => s.slug)
                : (Array.isArray(socs) ? socs : []);
            for (const slug of slugs) {
                const soc = await this.getSocSeed(slug);
                if (soc) {
                    parts.push(
                        '## SOC: ' + (soc.id || slug).toUpperCase() + '\n' +
                        (soc.purpose ? 'Propósito: ' + soc.purpose + '\n\n' : '') +
                        soc.body
                    );
                    sources.push(soc.path);
                }
            }
        }

        // ── 5c. SOPs públicos (knowledge/sops/*.md) ───────────────────────────
        if (sops) {
            const slugs = sops === true
                ? (await this.listSops()).map(s => s.slug)
                : (Array.isArray(sops) ? sops : []);
            for (const slug of slugs) {
                const sop = await this.getSopSeed(slug);
                if (sop) {
                    const head = [
                        sop.socRef          ? 'SOC ref: ' + sop.socRef : null,
                        sop.durationMinutes ? 'Duración: ' + sop.durationMinutes + ' min' : null,
                        sop.audience.length ? 'Audiencia: ' + sop.audience.join(', ') : null,
                    ].filter(Boolean).join(' · ');
                    parts.push(
                        '## SOP: ' + (sop.id || slug).toUpperCase() + '\n' +
                        (head ? head + '\n\n' : '') +
                        sop.body
                    );
                    sources.push(sop.path);
                }
            }
        }

        // ── 5d. Contexto KB del proyecto activo (Mind-as-Graph) ──────────────
        // Carga SOPs/SOCs/skill_nodes guardados en KB para este proyecto.
        // Se inyectan SÓLO sus IDs+títulos para no inundar tokens; el modelo
        // puede pedirlos por id si los necesita (futuro: tool-use).
        if (projectId && typeof window !== 'undefined') {
            try {
                const kbModule = await import('./kb.js');
                const KB = kbModule.KB;
                const nodes = await KB.query({ projectId });
                const buckets = { soc: [], sop: [], skill_node: [], deliverable: [], work_order: [] };
                for (const n of nodes) {
                    if (buckets[n.type]) buckets[n.type].push(n);
                }
                const lines = [];
                if (buckets.soc.length)        lines.push('SOCs propios (' + buckets.soc.length + '): '          + buckets.soc.map(n => n.id).join(', '));
                if (buckets.sop.length)        lines.push('SOPs propios (' + buckets.sop.length + '): '          + buckets.sop.map(n => n.id).join(', '));
                if (buckets.skill_node.length) lines.push('Skills personales (' + buckets.skill_node.length + '): ' + buckets.skill_node.map(n => n.id).join(', '));
                if (buckets.deliverable.length)lines.push('Deliverables (' + buckets.deliverable.length + '): '  + buckets.deliverable.map(n => n.id).join(', '));
                if (buckets.work_order.length) lines.push('Work orders (' + buckets.work_order.length + '): '    + buckets.work_order.map(n => n.id).join(', '));
                if (lines.length > 0) {
                    parts.push('## CONTEXTO PROYECTO (KB Mind-as-Graph · proj=' + projectId + ')\n' + lines.join('\n'));
                    sources.push('kb://project/' + projectId);
                }
            } catch (e) {
                console.warn('[KnowledgeLoader] KB scope skipped:', e.message);
            }
        }

        // ── 6. Contexto de la tarea activa ────────────────────────────────────
        if (taskContext) {
            parts.push('## TAREA ACTIVA\n' + taskContext);
        }

        // ── 7. Ensamblar y truncar ─────────────────────────────────────────────
        let systemPrompt = parts.join('\n\n---\n\n');
        if (systemPrompt.length > MAX_CONTEXT_CHARS) {
            systemPrompt = systemPrompt.substring(0, MAX_CONTEXT_CHARS) +
                '\n\n[contexto truncado — ' + MAX_CONTEXT_CHARS + ' chars max]';
        }

        return { systemPrompt, sources, detectedSector };
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  enrichPrompt — añade contexto KB a un systemPrompt existente
    // ══════════════════════════════════════════════════════════════════════════
    static async enrichPrompt(basePrompt, options = {}) {
        const { systemPrompt, sources, detectedSector } = await this.buildContext(options);
        if (!systemPrompt) return { prompt: basePrompt, sources: [] };
        return {
            prompt: basePrompt + '\n\n' + systemPrompt,
            sources,
            detectedSector,
        };
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  getEmptyMapSeed — estructura vacía para canvas desde cero
    // ══════════════════════════════════════════════════════════════════════════
    static getEmptyMapSeed() {
        return {
            sectorId:     null,
            sectorName:   null,
            roles:        [],
            transactions: [],
            patterns:     [],
            ia_assist:    false,
        };
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  listSectors — sectores disponibles, nombres bilingüe según window.__lang
    //  + readiness calculado dinámicamente desde el frontmatter de cada .md
    //
    //  H1.8 fix · readiness:
    //    'ready'  · ≥10 roles, ≥14 transactions, ≥4 patterns, bilingüe completo
    //    'solid'  · ≥6 roles,  ≥10 transactions, ≥2 patterns
    //    'tier 2' · por debajo del mínimo o fichero ausente
    //
    //  Antes (hardcoded en DashboardView): un Set fijo de 5 IDs marcaba "ready"
    //  independientemente del contenido real → falso negativo en sectores
    //  bien poblados.
    // ══════════════════════════════════════════════════════════════════════════
    static async listSectors() {
        // Diccionario bilingüe completo — fuente de verdad para nombres en UI
        var NAMES = {
            en: { A:'Agriculture, Forestry & Fishing', B:'Mining & Quarrying',
                  C:'Manufacturing', D:'Electricity, Gas & Steam Supply',
                  E:'Water, Sewerage & Waste Management', F:'Construction',
                  G:'Wholesale & Retail Trade', H:'Transport & Storage',
                  I:'Accommodation & Food Services', J:'Information & Communication',
                  K:'Tech / Software / AI', L:'Financial & Insurance Activities',
                  M:'Real Estate Activities', N:'Consulting / Professional Services',
                  O:'Public Administration & Defence', P:'Formal Education (K-12)',
                  Q:'Higher Education & Training', R:'Health & Social Services',
                  S:'Arts, Sport, Culture & Personal Services',
                  T:'Households as Employers', UV:'Extraterritorial Organisations' },
            es: { A:'Agricultura, Ganadería, Silvicultura y Pesca',
                  B:'Industrias Extractivas', C:'Industria Manufacturera',
                  D:'Suministro de Energía Eléctrica, Gas y Vapor',
                  E:'Suministro de Agua, Saneamiento y Gestión de Residuos',
                  F:'Construcción', G:'Comercio al por Mayor y Menor',
                  H:'Transporte y Almacenamiento', I:'Hostelería y Turismo',
                  J:'Información y Comunicaciones', K:'Tech / Software / IA',
                  L:'Actividades Financieras y de Seguros',
                  M:'Actividades Inmobiliarias',
                  N:'Consultoría / Actividades Profesionales',
                  O:'Administración Pública y Defensa',
                  P:'Educación Reglada (K-12)', Q:'Educación Superior y Formación',
                  R:'Salud y Servicios Sociales',
                  S:'Arte, Deporte, Cultura y Servicios Personales',
                  T:'Actividades de los Hogares como Empleadores',
                  UV:'Organismos Extraterritoriales e Internacionales' }
        };
        var lang  = (typeof window !== 'undefined' && window.__lang) ? window.__lang : 'en';
        var names = NAMES[lang] || NAMES['en'];
        var ALL_IDS = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','UV'];

        // Intentar leer _index.md para obtener la lista ordenada de IDs disponibles
        var ids = null;
        var index = await this.loadFile('_index.md');
        if (index) {
            var match = index.match(/##\s*[Ss]ectores([\s\S]*?)(?=##|$)/);
            if (match) {
                ids = [];
                var lines = match[1].split('\n');
                for (var i = 0; i < lines.length; i++) {
                    var m = lines[i].match(/\|\s*`([A-Z]{1,2})`\s*\|\s*`[^`]+`\s*\|\s*`([^`]+)`/);
                    if (m) ids.push(m[1]);
                }
                if (ids.length === 0) ids = null;
            }
        }
        if (!ids) ids = ALL_IDS.slice();

        // Para cada ID, parsea el .md y calcula readiness real
        var result = [];
        for (var k = 0; k < ids.length; k++) {
            var id = ids[k];
            var file = 'sectors/' + id + '.md';
            var parsed = await this.parseFile(file);
            var roles = parsed && Array.isArray(parsed.roles) ? parsed.roles.length : 0;
            var txs   = parsed && Array.isArray(parsed.transactions) ? parsed.transactions.length : 0;
            var pats  = parsed && Array.isArray(parsed.patterns) ? parsed.patterns.length : 0;
            var hasEn = !!(parsed && parsed.frontmatter && parsed.frontmatter.sector_name_en);
            var bilingualRoles = parsed && Array.isArray(parsed.roles) &&
                parsed.roles.some(function(r) { return r && (r.name_en || r.description_en); });
            var readiness = this._computeSectorReadiness({
                roles: roles, txs: txs, patterns: pats,
                hasEn: hasEn, bilingualRoles: bilingualRoles,
            });
            result.push({
                id: id,
                file: file,
                name: names[id] || id,
                roles: roles,
                transactions: txs,
                patterns: pats,
                hasEn: hasEn,
                readiness: readiness,
            });
        }
        return result;
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  _computeSectorReadiness — criterio TDD del modelo de gestión del KB
    //  H1.8 · auditoría 2026 · ver docs/backlog.md sección "Knowledge Base"
    //
    //  H1.8.1 fix · relajado el criterio: bilingualRoles pasa a ser opcional
    //  (bonus para una futura categoría 'ready+'). Razón: K, N históricos
    //  Tier 1 tienen sector_name_en pero NO name_en/description_en por
    //  rol. El criterio antes los degradaba injustamente a 'solid' pese
    //  a tener contenido cuantitativo completo (10r/17tx/4-5p).
    // ══════════════════════════════════════════════════════════════════════════
    static _computeSectorReadiness(s) {
        if (s.roles >= 10 && s.txs >= 14 && s.patterns >= 4 && s.hasEn) return 'ready';
        if (s.roles >= 6  && s.txs >= 10 && s.patterns >= 2) return 'solid';
        return 'tier 2';
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  serializeMapToMd — serializa un mapa VNA a formato MD con frontmatter
    //  Uso: guardar modelo de cliente, exportar mapa para replicar
    //  No hace IO — el llamador persiste en KB o descarga
    // ══════════════════════════════════════════════════════════════════════════
    static serializeMapToMd(map, meta = {}) {
        const roles    = map.roles        || [];
        const txs      = map.transactions || [];
        const patterns = map.patterns     || [];

        const rolesYaml = roles.map(r => [
            '  - id: '            + (r.id || ''),
            '    name: "'         + (r.name || '') + '"',
            '    description: "'  + (r.description || '').replace(/"/g, "'") + '"',
            '    castell_level: ' + (r.castell_level || 'tronc'),
            '    fmv_usd_h: '     + (r.fmv_usd_h != null ? r.fmv_usd_h : 'null'),
            '    typical_actor: "'+ (r.typical_actor || '') + '"',
            '    tags: ['         + (r.tags || []).map(t => '"' + t + '"').join(', ') + ']',
        ].join('\n')).join('\n\n');

        const txsYaml = txs.map(t => [
            '  - id: '            + (t.id || ''),
            '    from: '          + (t.from || ''),
            '    to: '            + (t.to || ''),
            '    deliverable: "'  + (t.deliverable || '').replace(/"/g, "'") + '"',
            '    type: '          + (t.type || 'tangible'),
            '    is_must: '       + (t.is_must ? 'true' : 'false'),
            '    frequency: '     + (t.frequency || 'media'),
            '    health_hint: "'  + (t.health_hint || '').replace(/"/g, "'") + '"',
        ].join('\n')).join('\n\n');

        const patternsYaml = patterns.map(p => [
            '  - name: "'         + (p.name || '') + '"',
            '    description: "'  + (p.description || '').replace(/"/g, "'") + '"',
            '    signal: "'       + (p.signal || '') + '"',
        ].join('\n')).join('\n\n');

        return [
            '---',
            'project_name: "' + (meta.projectName || 'Mapa VNA') + '"',
            'client_id: "'    + (meta.clientId    || '') + '"',
            'sector_id: '     + (meta.sectorId    || 'null'),
            'version: "v11.1"',
            'created_at: "'   + new Date().toISOString() + '"',
            '',
            'roles:',
            rolesYaml    || '  []',
            '',
            'transactions:',
            txsYaml      || '  []',
            '',
            'patterns:',
            patternsYaml || '  []',
            '---',
            '',
            '## Notas del proyecto',
            '',
            meta.notes || 'Mapa VNA generado con SOS V11 · TeamTowers.',
        ].join('\n');
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  getSocSeed — carga SOC desde knowledge/socs/{slug}.md
    //  Devuelve { slug, id, purpose, outcomes, keywords, body, path } | null
    // ══════════════════════════════════════════════════════════════════════════
    static async getSocSeed(slug) {
        if (!slug) return null;
        const path   = 'socs/' + slug + '.md';
        const parsed = await this.parseFile(path);
        if (!parsed) return null;
        const fm = parsed.frontmatter || {};
        return {
            slug,
            id:       fm.id       || ('soc-' + slug),
            purpose:  fm.purpose  || '',
            outcomes: Array.isArray(fm.outcomes) ? fm.outcomes : [],
            keywords: Array.isArray(fm.keywords) ? fm.keywords : [],
            body:     parsed.body || '',
            path,
        };
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  getSopSeed — carga SOP desde knowledge/sops/{slug}.md
    //  Devuelve { slug, id, socRef, durationMinutes, audience, materials,
    //             deliverables, keywords, body, path } | null
    // ══════════════════════════════════════════════════════════════════════════
    static async getSopSeed(slug) {
        if (!slug) return null;
        const path   = 'sops/' + slug + '.md';
        const parsed = await this.parseFile(path);
        if (!parsed) return null;
        const fm = parsed.frontmatter || {};
        return {
            slug,
            id:               fm.id      || ('sop-' + slug),
            socRef:           fm.soc_ref || null,
            durationMinutes:  fm.duration_minutes || null,
            audience:         Array.isArray(fm.audience)     ? fm.audience     : [],
            materials:        Array.isArray(fm.materials)    ? fm.materials    : [],
            deliverables:     Array.isArray(fm.deliverables) ? fm.deliverables : [],
            keywords:         Array.isArray(fm.keywords)     ? fm.keywords     : [],
            body:             parsed.body || '',
            path,
        };
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  getSopSteps — extrae el array `steps` del frontmatter de un SOP.
    //  Devuelve [] si el SOP no tiene steps estructurados.
    //  H7.3 · base para auto-generación de Work Orders desde un SOP.
    // ══════════════════════════════════════════════════════════════════════════
    static async getSopSteps(slug) {
        if (!slug) return [];
        const path   = 'sops/' + slug + '.md';
        const parsed = await this.parseFile(path);
        if (!parsed) return [];
        const fm = parsed.frontmatter || {};
        return Array.isArray(fm.steps) ? fm.steps : [];
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  listSocs — lista SOCs públicos extraídos de _index.md
    // ══════════════════════════════════════════════════════════════════════════
    static async listSocs() {
        const index = await this.loadFile('_index.md');
        if (!index) return [];
        const section = index.match(/##\s*SOCs[\s\S]*?(?=\n##\s|$)/);
        if (!section) return [];
        const list = [];
        const re = /\|\s*`socs\/([\w-]+)\.md`\s*\|\s*([^|]+?)\s*\|/g;
        let m;
        while ((m = re.exec(section[0])) !== null) {
            list.push({
                slug:        m[1],
                file:        'socs/' + m[1] + '.md',
                description: m[2].trim(),
            });
        }
        return list;
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  listSops — lista SOPs públicos extraídos de _index.md (incluye soc_ref)
    // ══════════════════════════════════════════════════════════════════════════
    static async listSops() {
        const index = await this.loadFile('_index.md');
        if (!index) return [];
        const section = index.match(/##\s*SOPs[\s\S]*?(?=\n##\s|$)/);
        if (!section) return [];
        const list = [];
        const re = /\|\s*`sops\/([\w-]+)\.md`\s*\|\s*([^|]+?)\s*\|\s*`([^`]+)`/g;
        let m;
        while ((m = re.exec(section[0])) !== null) {
            list.push({
                slug:        m[1],
                file:        'sops/' + m[1] + '.md',
                description: m[2].trim(),
                socRef:      m[3].trim(),
            });
        }
        return list;
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  clearCache
    // ══════════════════════════════════════════════════════════════════════════
    static clearCache() {
        this._cache  = {};
        this._parsed = {};
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  PRIVADOS
    // ──────────────────────────────────────────────────────────────────────────

    static _parseMarkdownWithFrontmatter(raw) {
        const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
        if (!fmMatch) {
            return { frontmatter: {}, body: raw, roles: [], transactions: [], patterns: [], sectorId: null, sectorName: null };
        }
        const fm   = this._parseYaml(fmMatch[1]);
        const body = fmMatch[2].trim();
        return {
            frontmatter:  fm,
            body,
            roles:        Array.isArray(fm.roles)        ? fm.roles        : [],
            transactions: Array.isArray(fm.transactions) ? fm.transactions : [],
            patterns:     Array.isArray(fm.patterns)     ? fm.patterns     : [],
            sectorId:     fm.sector_id   || null,
            sectorName:   fm.sector_name || null,
        };
    }

    // Parser YAML minimalista — soporta el subconjunto de los sector.md
    // strings, numbers, booleans, null, arrays inline, arrays de objetos indent-2/4
    static _parseYaml(yamlStr) {
        const result = {};
        const lines  = yamlStr.split('\n');
        let   i      = 0;

        while (i < lines.length) {
            const line      = lines[i];
            const rootMatch = line.match(/^(\w[\w_-]*):\s*(.*)/);
            if (!rootMatch) { i++; continue; }

            const key = rootMatch[1];
            const val = rootMatch[2].trim();

            if (val !== '' && val.charAt(0) !== '[') {
                result[key] = this._parseScalar(val);
                i++;
                continue;
            }
            if (val.charAt(0) === '[') {
                result[key] = val.replace(/^\[/, '').replace(/\]$/, '')
                    .split(',')
                    .map(s => s.trim().replace(/^["']|["']$/g, ''))
                    .filter(s => s.length > 0);
                i++;
                continue;
            }

            // Array de objetos
            const items = [];
            i++;
            while (i < lines.length) {
                if (/^\w[\w_-]*:/.test(lines[i])) break;
                const itemStart = lines[i].match(/^  - (\w[\w_-]*):\s*(.*)/);
                if (itemStart) {
                    const obj = {};
                    obj[itemStart[1]] = this._parseScalar(itemStart[2].trim());
                    i++;
                    while (i < lines.length) {
                        const fieldMatch = lines[i].match(/^    (\w[\w_-]*):\s*(.*)/);
                        if (!fieldMatch) break;
                        const fVal = fieldMatch[2].trim();
                        obj[fieldMatch[1]] = fVal.charAt(0) === '['
                            ? fVal.replace(/^\[/, '').replace(/\]$/, '')
                                  .split(',')
                                  .map(s => s.trim().replace(/^["']|["']$/g, ''))
                                  .filter(s => s.length > 0)
                            : this._parseScalar(fVal);
                        i++;
                    }
                    items.push(obj);
                } else {
                    i++;
                }
            }
            result[key] = items;
        }
        return result;
    }

    static _parseScalar(val) {
        if (val === 'true')  return true;
        if (val === 'false') return false;
        if (val === 'null' || val === '~' || val === '') return null;
        if (/^["'].*["']$/.test(val)) return val.slice(1, -1);
        const num = Number(val);
        return (!isNaN(num) && val !== '') ? num : val;
    }

    static _extractBodyOnly(raw) {
        const match = raw.match(/^---[\s\S]*?---\r?\n([\s\S]*)$/);
        return match ? match[1].trim() : raw.trim();
    }

    static _resolveSectorPath(sectorId) {
        if (!sectorId) return null;
        const key   = String(sectorId).trim();
        if (SECTOR_MAP[key]) return SECTOR_MAP[key];
        const lower = key.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '');
        return SECTOR_MAP[lower] || 'sectors/' + key.toUpperCase() + '.md';
    }

    static _detectSector(text) {
        for (const rule of DETECTION_RULES) {
            if (rule.pattern.test(text)) return rule.sector;
        }
        return null;
    }

    static _rolesToContext(roles) {
        if (!roles || roles.length === 0) return '(sin roles definidos)\n';
        var lang = (typeof window !== 'undefined' && window.__lang) ? window.__lang : 'en';
        return roles.map(function(r) {
            var displayName = (lang === 'en' && r.name_en) ? r.name_en : (r.name || r.id);
            var displayDesc = (lang === 'en' && r.description_en) ? r.description_en : (r.description || '');
            var actor       = r.typical_actor_en && lang === 'en' ? r.typical_actor_en : (r.typical_actor || '');
            return '- **' + displayName + '** [' + (r.castell_level || '?') + '] — ' +
                displayDesc + (actor ? ' (típic.: ' + actor + ')' : '');
        }).join('\n') + '\n';
    }

    static _transactionsToContext(transactions) {
        if (!transactions || transactions.length === 0) return '(sin transacciones)\n';
        var lang = (typeof window !== 'undefined' && window.__lang) ? window.__lang : 'en';
        return transactions.map(function(t) {
            var type        = t.type === 'intangible' ? '- - -' : '———';
            var must        = t.is_must ? '[MUST]' : '[EXTRA]';
            var deliverable = (lang === 'en' && t.deliverable_en) ? t.deliverable_en : (t.deliverable || '');
            var hint        = t.health_hint ? ' ⚠ ' + t.health_hint : '';
            return type + ' ' + must + ' ' + (t.from || '?') + ' → ' + (t.to || '?') +
                ': "' + deliverable + '"' + hint;
        }).join('\n') + '\n';
    }

    static _patternsToContext(patterns) {
        if (!patterns || patterns.length === 0) return '(sin patrones)\n';
        return patterns.map(p =>
            '- **' + (p.name || '') + '**: ' + (p.description || '') +
            (p.signal ? ' — Señal: ' + p.signal : '')
        ).join('\n') + '\n';
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  v163 · MATRIU CURRICULUM (additive · teamtowers-matriu submodule)
    //  Lectura purament read-only del currículum pedagògic (11 dominis · 15+
    //  competències · skill-seeds · SOPs). Reutilitza parseFile/_parseYaml
    //  existents · NO modifica els mètodes legacy.
    //  Submodule a /knowledge/matriu/ · pinned via .gitmodules.
    // ══════════════════════════════════════════════════════════════════════════
    static MATRIU_DOMAINS = Object.freeze([
        'd00-inner-work', 'd01-project-definition', 'd02-value-mapping',
        'd03-team-structure', 'd04-value-accounting', 'd05-ai-agent-operations',
        'd06-contracts-payments', 'd07-project-communication',
        'd08-products-market', 'd09-communities-of-practice', 'd10-metanoia',
    ]);

    // loadMatriuFile · wrapper sobre loadFile · prefix matriu/
    static async loadMatriuFile(relpath) {
        if (!relpath) return null;
        return this.loadFile('matriu/' + relpath);
    }

    // parseMatriuFile · wrapper sobre parseFile · mateix parser frontmatter
    // + post-processing additiu per a llistes string plain (`key:\n  - str`)
    // que el _parseYaml legacy no captura. Idempotent · si la key ja és array
    // no buit, no la sobreescriu. v163.2 · guard reservoir.
    static async parseMatriuFile(relpath) {
        if (!relpath) return null;
        this._assertReservoirOnly(relpath, 'parseMatriuFile');
        const fullPath = 'matriu/' + relpath;
        const parsed = await this.parseFile(fullPath);
        if (!parsed) return null;
        const raw = await this.loadFile(fullPath);
        if (raw) {
            const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
            if (fmMatch) {
                const stringLists = this._extractMatriuStringLists(fmMatch[1]);
                for (const [k, v] of Object.entries(stringLists)) {
                    const cur = parsed.frontmatter[k];
                    if (!Array.isArray(cur) || cur.length === 0) {
                        parsed.frontmatter[k] = v;
                    }
                }
            }
        }
        return parsed;
    }

    // _extractMatriuStringLists · helper privat · captura el patró
    //   key:
    //     - string1
    //     - string2
    // (no objectes · es para si troba una entrada amb `:`). Mai cridat des de
    // mètodes legacy · només des de parseMatriuFile.
    static _extractMatriuStringLists(rawFrontmatter) {
        const out = {};
        const lines = rawFrontmatter.split('\n');
        let i = 0;
        while (i < lines.length) {
            const keyMatch = lines[i].match(/^(\w[\w_-]*):\s*$/);
            if (!keyMatch) { i++; continue; }
            const key = keyMatch[1];
            const items = [];
            i++;
            while (i < lines.length) {
                const itemMatch = lines[i].match(/^  -\s+(.+?)\s*$/);
                if (!itemMatch) break;
                const itemStr = itemMatch[1];
                if (itemStr.includes(':')) break; // object item · stop
                items.push(itemStr.replace(/^["']|["']$/g, '').trim());
                i++;
            }
            if (items.length > 0) out[key] = items;
        }
        return out;
    }

    // listMatriuDomains · retorna metadades dels 11 dominis · sense body
    // Útil per a navegació · taula d'índex · filtres per sos_module.
    static async listMatriuDomains() {
        const items = [];
        for (const id of this.MATRIU_DOMAINS) {
            const p = await this.parseMatriuFile('domains/' + id + '.md');
            if (!p) {
                items.push({ id, name: id, status: 'missing', sos_module: null, competencies: [] });
                continue;
            }
            const fm = p.frontmatter || {};
            items.push({
                id:           fm.id          || id,
                slug:         id,                          // v163.2 · alias del slug
                name:         fm.name        || id,
                status:       fm.status      || 'unknown',
                mode:         fm.mode        || null,
                sos_module:   fm.sos_module  || null,
                sosModule:    fm.sos_module  || null,      // v163.2 · camelCase per patch test
                cop_ref:      fm.cop_ref     || null,
                copRef:       fm.cop_ref     || null,      // v163.2 · camelCase per patch test
                sos_context:  fm.sos_context || null,
                competencies: Array.isArray(fm.competencies) ? fm.competencies : [],
            });
        }
        return items;
    }

    // getMatriuDomain · domini complet (frontmatter + body markdown) per id
    // v163.2 · guard contra path traversal (test integració del patch)
    static async getMatriuDomain(domainId) {
        if (!domainId) return null;
        this._assertReservoirOnly(domainId, 'getMatriuDomain');
        const p = await this.parseMatriuFile('domains/' + domainId + '.md');
        if (!p) return null;
        return {
            id:          domainId,
            frontmatter: p.frontmatter || {},
            body:        p.body        || '',
        };
    }

    // getMatriuCompetency · competència per id (ex · c-02.1-identify-vna-roles)
    // v163.2 · guard contra path traversal
    static async getMatriuCompetency(competencyId) {
        if (!competencyId) return null;
        this._assertReservoirOnly(competencyId, 'getMatriuCompetency');
        const p = await this.parseMatriuFile('competencies/' + competencyId + '.md');
        if (!p) return null;
        return {
            id:          competencyId,
            frontmatter: p.frontmatter || {},
            body:        p.body        || '',
        };
    }

    // getMatriuBySosModule · filtra dominis matriu per nom de mòdul SOS
    // (ex · "VNA Mapper", "Pitch & Landing Studio"). Útil per cross-link
    // SOS view ↔ currículum (mostrar competències pedagògiques rellevants).
    static async getMatriuBySosModule(sosModule) {
        if (!sosModule) return [];
        const all = await this.listMatriuDomains();
        return all.filter(d => d.sos_module === sosModule);
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  v163.2 · MATRIU PATCH v0.1 (additiu sobre v163.1)
    //  Afegeix · skill-seeds & sops accessors · per-domain comps · LLM context
    //  builder · privacy guard reservoir/biography · permission system.
    //  Zero mètodes legacy modificats.
    // ══════════════════════════════════════════════════════════════════════════

    // _assertReservoirOnly · guard contra accés accidental a biography
    // Llançar al principi de tots els mètodes que carreguen fitxers Matriu.
    static _assertReservoirOnly(path, callerName = '') {
        if (!path) return;
        const normalized = String(path).replace(/\\/g, '/');
        if (normalized.includes('private/') || normalized.includes('/private')) {
            const msg = '[KnowledgeLoader] BLOCKED reservoir-only call from "' +
                callerName + '" attempted to access biography path: ' + path;
            console.error(msg);
            throw new Error(msg);
        }
    }

    // getMatriuSkillSeed · carrega skill-seed pedagògica per id
    static async getMatriuSkillSeed(skillId) {
        if (!skillId) return null;
        this._assertReservoirOnly('matriu/skill-seeds/' + skillId, 'getMatriuSkillSeed');
        return this.parseMatriuFile('skill-seeds/' + skillId + '.md');
    }

    // getMatriuSop · carrega SOP del currículum (matriu/sops/ · diferent de
    // knowledge/sops/ legacy)
    static async getMatriuSop(sopId) {
        if (!sopId) return null;
        this._assertReservoirOnly('matriu/sops/' + sopId, 'getMatriuSop');
        return this.parseMatriuFile('sops/' + sopId + '.md');
    }

    // listMatriuCompetenciesByDomain · totes les competències d'un domini
    static async listMatriuCompetenciesByDomain(domainId) {
        const d = await this.getMatriuDomain(domainId);
        if (!d || !d.frontmatter) return [];
        const compIds = Array.isArray(d.frontmatter.competencies) ? d.frontmatter.competencies : [];
        const out = [];
        for (const cId of compIds) {
            const c = await this.getMatriuCompetency(cId);
            if (c) out.push(c);
        }
        return out;
    }

    // buildMatriuContext · construeix bloc de context LLM enriquit amb material
    // del currículum (paral·lel a buildContext() · standalone o combinable).
    static async buildMatriuContext(options = {}) {
        const {
            domain        = null,
            competency    = null,
            skillSeed     = null,
            mode          = null,
            includeSkills = true,
            includeSops   = false,
            maxChars      = MAX_CONTEXT_CHARS,
        } = options;

        const parts   = [];
        const sources = [];

        if (mode) {
            const all = await this.listMatriuDomains();
            const filtered = all.filter(d => d.mode === mode);
            if (filtered.length > 0) {
                parts.push(
                    '## MATRIU · Dominis ' + mode.toUpperCase() + '\n' +
                    filtered.map(d =>
                        '- **' + d.id + '** · ' + d.name +
                        (d.sos_module ? ' [SOS: ' + d.sos_module + ']' : '')
                    ).join('\n')
                );
                sources.push('matriu/[mode=' + mode + ']');
            }
        }

        if (domain) {
            const d = await this.getMatriuDomain(domain);
            if (d && d.frontmatter) {
                parts.push(
                    '## MATRIU · ' + (d.frontmatter.name || domain).toUpperCase() + '\n' +
                    'Objectiu: ' + (d.frontmatter.objective || '') + '\n\n' +
                    (d.body || '').substring(0, 3000)
                );
                sources.push('matriu/domains/' + domain + '.md');

                const comps = await this.listMatriuCompetenciesByDomain(domain);
                if (comps.length > 0) {
                    parts.push(
                        '### Competències d\'aquest domini\n' +
                        comps.map(c =>
                            '- **' + (c.frontmatter.id || '?') + '** · ' + (c.frontmatter.name || '') +
                            '\n  ' + (c.frontmatter.objective || '')
                        ).join('\n')
                    );
                }

                if (includeSkills) {
                    const seedIds = new Set();
                    comps.forEach(c => (c.frontmatter.skill_seeds || []).forEach(s => seedIds.add(s)));
                    if (seedIds.size > 0) {
                        const seeds = [];
                        for (const sId of seedIds) {
                            const s = await this.getMatriuSkillSeed(sId);
                            if (s) seeds.push(s);
                        }
                        parts.push(
                            '### Skill-seeds disponibles\n' +
                            seeds.map(s =>
                                '- **' + (s.frontmatter.id || '?') + '** (agent: ' +
                                (s.frontmatter.agent_ref || '?') + ')\n  ' +
                                String(s.frontmatter.purpose || '').substring(0, 200)
                            ).join('\n')
                        );
                    }
                }

                if (includeSops) {
                    const sopIds = new Set();
                    comps.forEach(c => (c.frontmatter.sops || []).forEach(s => sopIds.add(s)));
                    if (sopIds.size > 0) {
                        parts.push(
                            '### SOPs d\'aquest domini\n' +
                            Array.from(sopIds).map(id => '- ' + id).join('\n')
                        );
                    }
                }
            }
        }

        if (competency) {
            const c = await this.getMatriuCompetency(competency);
            if (c) {
                parts.push(
                    '## MATRIU · Competència ' + (c.frontmatter.id || competency) + '\n' +
                    'Nom: ' + (c.frontmatter.name || '') + '\n' +
                    'Objectiu: ' + (c.frontmatter.objective || '') + '\n\n' +
                    (c.body || '').substring(0, 3000)
                );
                sources.push('matriu/competencies/' + competency + '.md');
            }
        }

        if (skillSeed) {
            const s = await this.getMatriuSkillSeed(skillSeed);
            if (s) {
                parts.push(
                    '## MATRIU · Skill-seed ' + (s.frontmatter.id || skillSeed) + '\n' +
                    (s.body || '')
                );
                sources.push('matriu/skill-seeds/' + skillSeed + '.md');
            }
        }

        let systemPrompt = parts.join('\n\n---\n\n');
        if (systemPrompt.length > maxChars) {
            systemPrompt = systemPrompt.substring(0, maxChars) +
                '\n\n[contexto Matriu truncado — ' + maxChars + ' chars max]';
        }
        return { systemPrompt, sources };
    }

    // ──────────────────────────────────────────────────────────────────────
    //  PERMISSIONS · taula per agent · agentPermissions.yaml
    // ──────────────────────────────────────────────────────────────────────
    static _permissionsCache = null;

    static async loadAgentPermissions() {
        if (this._permissionsCache) return this._permissionsCache;
        try {
            const res = await fetch('/config/agentPermissions.yaml');
            if (!res.ok) {
                this._permissionsCache = { agents: {} };
                return this._permissionsCache;
            }
            const text = await res.text();
            this._permissionsCache = this._parseAgentPermissionsYaml(text);
            return this._permissionsCache;
        } catch (e) {
            this._permissionsCache = { agents: {} };
            return this._permissionsCache;
        }
    }

    // Mini-parser ad-hoc nested · estructura coneguda agents:>id:>{description,allowed[],forbidden_explicit[],requires_explicit_user_consent[]}
    // El _parseYaml legacy només suporta 1 nivell · aquest n'aguanta 2 (agent → camps).
    static _parseAgentPermissionsYaml(text) {
        const result = { agents: {} };
        const lines = String(text || '').split('\n');
        let i = 0;
        // Avança fins a "agents:"
        while (i < lines.length && !/^agents:\s*$/.test(lines[i])) i++;
        if (i >= lines.length) return result;
        i++;
        let currentAgent = null;
        let currentList  = null;
        let currentListIndent = 0;
        while (i < lines.length) {
            const line = lines[i];
            if (/^\s*#/.test(line) || /^\s*$/.test(line)) { i++; continue; }
            // Agent header · 2 espais indent · "  agent_xxx:"
            const agentMatch = line.match(/^  ([a-zA-Z_][\w-]*):\s*$/);
            if (agentMatch) {
                currentAgent = agentMatch[1];
                result.agents[currentAgent] = { allowed: [], forbidden_explicit: [], requires_explicit_user_consent: [] };
                currentList = null;
                i++;
                continue;
            }
            if (!currentAgent) { i++; continue; }
            // Camp scalar · "    description: ..."
            const scalarMatch = line.match(/^    ([a-zA-Z_][\w-]*):\s*"?([^"\n]*?)"?\s*$/);
            if (scalarMatch && scalarMatch[2] !== '') {
                result.agents[currentAgent][scalarMatch[1]] = scalarMatch[2];
                currentList = null;
                i++;
                continue;
            }
            // Camp llista · "    allowed:"
            const listHeader = line.match(/^    ([a-zA-Z_][\w-]*):\s*$/);
            if (listHeader) {
                currentList = listHeader[1];
                result.agents[currentAgent][currentList] = [];
                i++;
                continue;
            }
            // Item de llista · "      - "knowledge/matriu/...""
            const itemMatch = line.match(/^      -\s+"?([^"\n]+?)"?\s*$/);
            if (itemMatch && currentList) {
                result.agents[currentAgent][currentList].push(itemMatch[1].replace(/\s+#.*$/, '').trim());
                i++;
                continue;
            }
            // Block scalar pipe/folded (descripció multi-línia) · saltem
            if (/^\s+[|>]/.test(line)) { i++; continue; }
            i++;
        }
        return result;
    }

    // canAgentRead · verifica permisos d'un agent per a un path.
    // Regla férrea · `private/` denegat sempre · zero excepcions.
    static async canAgentRead(agentId, path) {
        if (!path) return false;
        const normalized = String(path).replace(/\\/g, '/');
        if (normalized.includes('private/') || normalized.includes('/private')) return false;
        if (!agentId) return true;
        const perms = await this.loadAgentPermissions();
        const rules = perms.agents && perms.agents[agentId];
        if (!rules) return true;
        if (Array.isArray(rules.forbidden_explicit)) {
            for (const p of rules.forbidden_explicit) {
                if (this._matchPattern(p, normalized)) return false;
            }
        }
        if (Array.isArray(rules.allowed) && rules.allowed.length > 0) {
            for (const p of rules.allowed) {
                if (this._matchPattern(p, normalized)) return true;
            }
            return false;
        }
        return true;
    }

    // _matchPattern · glob simple · * = [^/]* · ** = .*
    // v163.2 · sufix `/**` també matcheja el pare directe (semàntica natural:
    // "aquest path o qualsevol descendent"). Necessari perquè els dominis Matriu
    // són fitxers `.md` directes i el YAML usa `domains/d02-*/**`.
    static _matchPattern(pattern, path) {
        if (this._patternToRegex(pattern).test(path)) return true;
        if (pattern.endsWith('/**')) {
            const trimmed = pattern.slice(0, -3);
            if (this._patternToRegex(trimmed).test(path))           return true;
            if (this._patternToRegex(trimmed + '.md').test(path))   return true;
        }
        return false;
    }

    static _patternToRegex(pattern) {
        return new RegExp(
            '^' +
            pattern
                .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
                .replace(/\*\*/g, '@@DOUBLE@@')
                .replace(/\*/g, '[^/]*')
                .replace(/@@DOUBLE@@/g, '.*')
            + '$'
        );
    }

    // getBiographyFile · API explícita amb userConsent obligatori.
    // Mai accessible per agents · stack-trace check defensiu.
    static async getBiographyFile(filename, opts = {}) {
        const { userConsent = false } = opts;
        if (!userConsent) {
            throw new Error('[KnowledgeLoader] getBiographyFile requires userConsent=true. Biography is private.');
        }
        const stack = (new Error()).stack || '';
        if (/agent_|swarm_|orchestrat/i.test(stack)) {
            console.error('[KnowledgeLoader] BLOCKED · biography access from agent-like caller');
            throw new Error('Biography access denied for agent callers');
        }
        try {
            const res = await fetch('/private/biography/' + filename);
            if (!res.ok) return null;
            return await res.text();
        } catch (_) {
            return null;
        }
    }
}
