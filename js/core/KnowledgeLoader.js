// =============================================================================
// TEAMTOWERS SOS V11 — KNOWLEDGE LOADER
// Carga archivos MD de /knowledge/ e inyecta contexto rico en callLLM()
// Netlify sirve los MD como assets estáticos — fetch() relativo
// =============================================================================

const KNOWLEDGE_BASE = '/knowledge';
const MAX_CONTEXT_CHARS = 12000; // ~3000 tokens — deja margen para el prompt

// ─── Índice de sectores conocidos ────────────────────────────────
const SECTOR_MAP = {
    construction:   'sectors/construction.md',
    inmobiliaria:   'sectors/construction.md',
    education:      'sectors/education.md',
    educacion:      'sectors/education.md',
    tech:           'sectors/tech.md',
    tecnologia:     'sectors/tech.md',
    software:       'sectors/tech.md',
};

export class KnowledgeLoader {

    // ── Cache en memoria (vive mientras dura la sesión) ───────────
    static _cache = {};

    // ══════════════════════════════════════════════════════════════
    //  loadFile — carga un .md del /knowledge/ con cache
    // ══════════════════════════════════════════════════════════════
    static async loadFile(path) {
        if (this._cache[path]) return this._cache[path];
        try {
            const res = await fetch(`${KNOWLEDGE_BASE}/${path}?v=${Date.now()}`);
            if (!res.ok) return null;
            const text = await res.text();
            this._cache[path] = text;
            return text;
        } catch (_) {
            return null;
        }
    }

    // ══════════════════════════════════════════════════════════════
    //  buildContext — construye el systemPrompt enriquecido
    //
    //  options:
    //    sector:              string  — nombre del sector (ej: 'construction')
    //    roles:               string[] — roles específicos a cargar
    //    includeTransactions: boolean
    //    includeVision:       boolean — incluir mind-architecture.md
    //    freeText:            string  — descripción libre del proyecto
    //
    //  Devuelve: { systemPrompt: string, sources: string[] }
    // ══════════════════════════════════════════════════════════════
    static async buildContext(options = {}) {
        const { sector, roles = [], includeTransactions = false, includeVision = false, freeText = '' } = options;
        const parts   = [];
        const sources = [];

        // ── 1. Índice maestro (siempre) ───────────────────────────
        const index = await this.loadFile('_index.md');
        if (index) {
            parts.push('## BASE DE CONOCIMIENTO DISPONIBLE\n' + index);
            sources.push('_index.md');
        }

        // ── 2. Sector ─────────────────────────────────────────────
        if (sector) {
            const sectorKey  = sector.toLowerCase().replace(/\s/g, '_');
            const sectorFile = SECTOR_MAP[sectorKey] || `sectors/${sectorKey}.md`;
            const content    = await this.loadFile(sectorFile);
            if (content) {
                parts.push(`## CONTEXTO DE SECTOR: ${sector.toUpperCase()}\n${content}`);
                sources.push(sectorFile);
            }
        }

        // ── 3. Auto-detectar sector desde texto libre ─────────────
        if (!sector && freeText) {
            const detected = this._detectSector(freeText);
            if (detected) {
                const content = await this.loadFile(SECTOR_MAP[detected] || `sectors/${detected}.md`);
                if (content) {
                    parts.push(`## CONTEXTO DE SECTOR DETECTADO: ${detected.toUpperCase()}\n${content}`);
                    sources.push(`sectors/${detected}.md`);
                }
            }
        }

        // ── 4. Roles específicos ──────────────────────────────────
        for (const role of roles) {
            const slug    = role.toLowerCase().replace(/[^a-z0-9]/g, '-');
            const content = await this.loadFile(`roles/${slug}.md`);
            if (content) {
                parts.push(`## ROL: ${role.toUpperCase()}\n${content}`);
                sources.push(`roles/${slug}.md`);
            }
        }

        // ── 5. Visión (Vedanta — solo si se pide) ─────────────────
        if (includeVision) {
            const vision = await this.loadFile('vision/mind-architecture.md');
            if (vision) {
                parts.push('## ARQUITECTURA COGNITIVA\n' + vision);
                sources.push('vision/mind-architecture.md');
            }
        }

        // ── 6. Ensamblar y truncar ────────────────────────────────
        let systemPrompt = parts.join('\n\n---\n\n');

        if (systemPrompt.length > MAX_CONTEXT_CHARS) {
            systemPrompt = systemPrompt.substring(0, MAX_CONTEXT_CHARS) + '\n\n[...contexto truncado para no saturar la ventana]';
        }

        return { systemPrompt, sources };
    }

    // ══════════════════════════════════════════════════════════════
    //  enrichPrompt — añade contexto KB a un systemPrompt existente
    //  Uso: const enriched = await KnowledgeLoader.enrichPrompt(basePrompt, { sector: 'tech' })
    // ══════════════════════════════════════════════════════════════
    static async enrichPrompt(basePrompt, options = {}) {
        const { systemPrompt: contextBlock, sources } = await this.buildContext(options);
        if (!contextBlock) return { prompt: basePrompt, sources: [] };

        const enriched = `${basePrompt}\n\n${contextBlock}`;
        return { prompt: enriched, sources };
    }

    // ══════════════════════════════════════════════════════════════
    //  listAvailable — devuelve qué archivos MD existen en /knowledge/
    //  Usa el _index.md como fuente de verdad
    // ══════════════════════════════════════════════════════════════
    static async listAvailable() {
        const index = await this.loadFile('_index.md');
        if (!index) return { sectors: [], roles: [], transactions: [], deliverables: [] };

        const extract = (section) => {
            const regex = new RegExp(`## ${section}([\\s\\S]*?)(?=##|$)`, 'i');
            const match = index.match(regex);
            if (!match) return [];
            return match[1].match(/`[^`]+\.md`/g)?.map(s => s.replace(/`/g, '')) || [];
        };

        return {
            sectors:      extract('Sectores'),
            roles:        extract('Roles'),
            transactions: extract('Transacciones'),
            deliverables: extract('Entregables'),
        };
    }

    // ── Utilidades privadas ───────────────────────────────────────

    static _detectSector(text) {
        const lower = text.toLowerCase();
        if (/construcci|inmobiliar|obra|promotor|arquitecto/.test(lower)) return 'construction';
        if (/educaci|formaci|aprendiz|curso|escuela/.test(lower))          return 'education';
        if (/software|saas|app|tech|digital|ia|startup/.test(lower))       return 'tech';
        return null;
    }

    static clearCache() {
        this._cache = {};
    }
}
