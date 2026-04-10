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
        const lang2  = (typeof window !== 'undefined' && window.__lang) ? window.__lang : 'en';
        const snEn   = parsed.frontmatter.sector_name_en || parsed.sectorName || '';
        const snEs   = parsed.sectorName || snEn;
        return {
            sectorId:     parsed.sectorId || sectorId,
            sectorName:   lang2 === 'en' ? snEn : snEs,
            roles:        parsed.roles        || [],
            transactions: parsed.transactions || [],
            patterns:     parsed.patterns     || [],
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
    //  listSectors — sectores disponibles. Tier 1 garantizados, resto on demand.
    // ══════════════════════════════════════════════════════════════════════════
    static async listSectors() {
        const index = await this.loadFile('_index.md');
        if (index) {
            const match = index.match(/##\s*[Ss]ectores([\s\S]*?)(?=##|$)/);
            if (match) {
                const sectors = [];
                for (const line of match[1].split('\n')) {
                    const m = line.match(/`([A-Z]{1,2})\.md`[^`]*`([^`]+)`/);
                    if (m) sectors.push({ id: m[1], file: 'sectors/' + m[1] + '.md', name: m[2] });
                }
                if (sectors.length > 0) return sectors;
            }
        }
        // Fallback Tier 1 — bilingual names
        const lang = (typeof window !== 'undefined' && window.__lang) ? window.__lang : 'en';
        const names = {
            en: { N: 'Consulting / Professional Services', K: 'Tech / Software / AI', Q: 'Education', F: 'Construction', R: 'Health & Social Services' },
            es: { N: 'Consultoría / Actividades Profesionales', K: 'Tech / Software / IA', Q: 'Educación', F: 'Construcción', R: 'Salud y Servicios Sociales' },
        };
        const n = names[lang] || names['en'];
        return [
            { id: 'N', file: 'sectors/N.md', name: n.N },
            { id: 'K', file: 'sectors/K.md', name: n.K },
            { id: 'Q', file: 'sectors/Q.md', name: n.Q },
            { id: 'F', file: 'sectors/F.md', name: n.F },
            { id: 'R', file: 'sectors/R.md', name: n.R },
        ];
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
        return roles.map(r =>
            '- **' + (r.name || r.id) + '** [' + (r.castell_level || '?') + '] — ' +
            (r.description || '') +
            (r.typical_actor ? ' (típic.: ' + r.typical_actor + ')' : '')
        ).join('\n') + '\n';
    }

    static _transactionsToContext(transactions) {
        if (!transactions || transactions.length === 0) return '(sin transacciones)\n';
        return transactions.map(t => {
            const type = t.type === 'intangible' ? '- - -' : '———';
            const must = t.is_must ? '[MUST]' : '[EXTRA]';
            const hint = t.health_hint ? ' ⚠ ' + t.health_hint : '';
            return type + ' ' + must + ' ' + (t.from || '?') + ' → ' + (t.to || '?') +
                ': "' + (t.deliverable || '') + '"' + hint;
        }).join('\n') + '\n';
    }

    static _patternsToContext(patterns) {
        if (!patterns || patterns.length === 0) return '(sin patrones)\n';
        return patterns.map(p =>
            '- **' + (p.name || '') + '**: ' + (p.description || '') +
            (p.signal ? ' — Señal: ' + p.signal : '')
        ).join('\n') + '\n';
    }
}
