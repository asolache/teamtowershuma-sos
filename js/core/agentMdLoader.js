// =============================================================================
// TEAMTOWERS SOS V11 — AGENT.md LOADER (PR-R · wo-agent-md-pattern · v122)
// Ruta · /js/core/agentMdLoader.js
//
// Parser minimalista per a fitxers `agents/*.md` (convenció AGENT.md
// Anthropic + MCP-ready). Cada agent és un fitxer .md amb frontmatter
// YAML (subset · `key: value`, `key: [a, b]`) i body Markdown.
//
// API ·
//   parseAgentSource(rawText) → { frontmatter, body }
//   loadAgent(id, opts) → { id, frontmatter, body }   [node fs · node tests]
//   listAgents(opts) → string[]                         [node fs]
//
// Disseny KISS · sense YAML lib · suport subset suficient pels nostres .md.
// El runtime web NO usa aquest loader directament (encara) · es manté pur i
// testable. Vegeu agents/AGENTS.md per a la convenció completa.
// =============================================================================

export const AGENT_MD_VERSION = 'v1.0';

// _parseScalar · suport per a string · number · boolean · array curt
function _parseScalar(v) {
    if (v == null) return null;
    const s = String(v).trim();
    if (s === '') return '';
    if (s === 'true') return true;
    if (s === 'false') return false;
    if (s === 'null') return null;
    // array curt [a, b, c]
    if (s.startsWith('[') && s.endsWith(']')) {
        const inner = s.slice(1, -1).trim();
        if (!inner) return [];
        return inner.split(',').map(x => _parseScalar(x.trim()));
    }
    // quoted string
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
        return s.slice(1, -1);
    }
    // numeric
    if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
    return s;
}

// parseAgentSource · pure · accepta un string raw del fitxer .md.
// Retorna · { frontmatter:Object, body:string }
// Errors · throws Error si el frontmatter no és balancejat.
export function parseAgentSource(raw) {
    if (typeof raw !== 'string') throw new Error('parseAgentSource · raw must be string');
    const trimmed = raw.replace(/^﻿/, '');   // strip BOM
    if (!trimmed.startsWith('---')) {
        // sense frontmatter · tot és body
        return { frontmatter: {}, body: trimmed };
    }
    const endIdx = trimmed.indexOf('\n---', 3);
    if (endIdx < 0) throw new Error('parseAgentSource · frontmatter not closed');
    const fmRaw = trimmed.slice(4, endIdx);
    const body = trimmed.slice(endIdx + 4).replace(/^\n/, '');

    const frontmatter = {};
    for (const lineRaw of fmRaw.split('\n')) {
        const line = lineRaw.replace(/\r$/, '');
        if (!line.trim() || line.trim().startsWith('#')) continue;
        const colonIdx = line.indexOf(':');
        if (colonIdx < 0) continue;
        const key = line.slice(0, colonIdx).trim();
        const valRaw = line.slice(colonIdx + 1);
        // strip inline comment (after a space + #)
        const commentIdx = valRaw.indexOf(' #');
        const val = commentIdx >= 0 ? valRaw.slice(0, commentIdx) : valRaw;
        frontmatter[key] = _parseScalar(val);
    }
    return { frontmatter, body };
}

// loadAgent · node fs · llegeix agents/<id>.md i el parseja
export async function loadAgent(id, { agentsDir = null } = {}) {
    if (!id || !/^[a-z0-9-]+$/.test(id)) throw new Error('loadAgent · invalid id · ' + id);
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const dir = agentsDir || path.resolve(process.cwd(), 'agents');
    const file = path.join(dir, id + '.md');
    const raw = await fs.readFile(file, 'utf8');
    const { frontmatter, body } = parseAgentSource(raw);
    if (frontmatter.id && frontmatter.id !== id) {
        throw new Error(`loadAgent · id mismatch · file=${id} frontmatter=${frontmatter.id}`);
    }
    return { id, frontmatter, body };
}

// listAgents · node fs · enumera agents/*.md (sense AGENTS.md)
export async function listAgents({ agentsDir = null } = {}) {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const dir = agentsDir || path.resolve(process.cwd(), 'agents');
    const files = await fs.readdir(dir);
    return files
        .filter(f => f.endsWith('.md') && f !== 'AGENTS.md')
        .map(f => f.slice(0, -3))
        .sort();
}

// validateAgent · check mínim del frontmatter · retorna { ok, errors[] }
const REQUIRED_FM = ['id', 'version', 'model_tier', 'routing', 'expected_output'];
const VALID_TIERS = ['reasoner', 'mid', 'small'];
const VALID_ROUTING = ['quality-audit', 'sop-structured', 'creative-narrative'];

export function validateAgent({ frontmatter, body } = {}) {
    const errors = [];
    if (!frontmatter || typeof frontmatter !== 'object') {
        return { ok: false, errors: ['frontmatter missing'] };
    }
    for (const k of REQUIRED_FM) {
        if (frontmatter[k] == null || frontmatter[k] === '') errors.push('missing ' + k);
    }
    if (frontmatter.model_tier && !VALID_TIERS.includes(frontmatter.model_tier)) {
        errors.push('invalid model_tier · ' + frontmatter.model_tier);
    }
    if (frontmatter.routing && !VALID_ROUTING.includes(frontmatter.routing)) {
        errors.push('invalid routing · ' + frontmatter.routing);
    }
    if (!body || body.trim().length < 50) {
        errors.push('body too short (<50 chars)');
    }
    return { ok: errors.length === 0, errors };
}

// __test_helpers__ · expose internals for unit tests
export const __test_helpers__ = { _parseScalar };
