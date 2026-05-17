// =============================================================================
// TEAMTOWERS SOS V11 — SECTOR QUALITY RUBRIC (v131c)
// Ruta · /js/core/sectorQualityRubric.js
//
// Valida si un projecte cobreix els SOPs canonical esperats del seu sector.
// "Una clínica Q canonical té certs SOPs esperables" · si el projecte no els té ·
// score baixa i mostrem què falta.
//
// API ·
//   evaluateProjectAgainstSector({ projectId, sectorId, projectSops[] }) →
//     { score 0-100, coverage, missingSops[], unexpectedSops[], recommendations[] }
//   getCanonicalSopsForSector(sectorId) → array de SOPs canonical declarats al .md
//
// Filosofia · KISS · pure async · zero deps · safe en Node test env.
// =============================================================================

import { loadSectorAgent } from './sectorAgentLoader.js';

export const SECTOR_RUBRIC_VERSION = 'v131c';

// _parseSopsCanonical · helper · extreu sops_canonical del frontmatter raw
// (el parser actual només captura roles · els SOPs viuen a sops_canonical:)
function _parseSopsCanonical(agentBodyOrFrontmatter) {
    if (!agentBodyOrFrontmatter || typeof agentBodyOrFrontmatter !== 'string') return [];
    const idx = agentBodyOrFrontmatter.indexOf('sops_canonical:');
    if (idx < 0) return [];
    const block = agentBodyOrFrontmatter.slice(idx);
    const sops = [];
    const regex = /(?:^|\n)  - id: (sop-[\w-]+)([\s\S]*?)(?=\n  - id: sop-|\n[a-z_]+:|\n---|$)/g;
    let match;
    while ((match = regex.exec(block)) !== null) {
        const id = match[1];
        const sub = match[2];
        const titleM    = sub.match(/\n    title: "?([^"\n]+)"?/);
        const castellM  = sub.match(/\n    castell_level: (\S+)/);
        const descM     = sub.match(/\n    description: "?([^"\n]+)"?/);
        sops.push({
            id,
            title:        titleM    ? titleM[1].replace(/"/g, '').trim() : id,
            castell_level: castellM ? castellM[1].trim() : null,
            description:  descM     ? descM[1].replace(/"/g, '').trim() : '',
        });
    }
    return sops;
}

// getCanonicalSopsForSector · async · llegeix sops_canonical del sector .md
export async function getCanonicalSopsForSector(sectorId) {
    if (!sectorId) return [];
    try {
        const agent = await loadSectorAgent(sectorId);
        if (!agent) return [];
        // Re-llegim el raw del frontmatter perquè el loader actual no parseja sops_canonical
        const fs = await import('node:fs/promises');
        const path = await import('node:path');
        const file = path.resolve(process.cwd(), 'knowledge/sectors/' + sectorId + '.md');
        const raw = await fs.readFile(file, 'utf8');
        return _parseSopsCanonical(raw);
    } catch (_) { return []; }
}

// evaluateProjectAgainstSector · pure (excepte loadSector async)
// projectSops · array d'objectes { title, description } (els SOPs reals del projecte)
// Retorna · score + coverage + missing + unexpected + recommendations
export async function evaluateProjectAgainstSector({ projectId, sectorId, projectSops = [] } = {}) {
    if (!sectorId) {
        return { score: 0, coverage: 0, missingSops: [], unexpectedSops: [], recommendations: ['Sector no especificat'] };
    }
    const canonical = await getCanonicalSopsForSector(sectorId);
    if (!canonical.length) {
        return {
            score: 50,
            coverage: 0,
            missingSops: [],
            unexpectedSops: projectSops,
            recommendations: ['Sector ' + sectorId + ' no té sops_canonical declarats · revisar knowledge/sectors/' + sectorId + '.md'],
            note: 'no-canonical-defined',
        };
    }
    // Fuzzy match per title · KISS · keyword overlap (intersecció de paraules ≥ 0.5 = match)
    function _normalize(s) {
        return String(s || '').toLowerCase()
            .normalize('NFD').replace(/[̀-ͯ]/g, '')   // strip accents
            .replace(/[^\w\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);
    }
    function _matches(canonTitle, projectTitles) {
        const canWords = new Set(_normalize(canonTitle));
        for (const projTitle of projectTitles) {
            const projWords = _normalize(projTitle);
            const overlap = projWords.filter(w => canWords.has(w)).length;
            const ratio = canWords.size > 0 ? (overlap / canWords.size) : 0;
            if (ratio >= 0.4 || (overlap >= 3 && canWords.size >= 4)) return projTitle;
        }
        return null;
    }
    const projectTitles = projectSops.map(s => s.title || s.label || s.id || '');
    const missing = [];
    const matched = [];
    for (const canon of canonical) {
        const m = _matches(canon.title, projectTitles);
        if (m) matched.push({ canon: canon.title, project: m });
        else missing.push(canon);
    }
    const unexpectedSops = projectSops.filter(p => !matched.some(m => m.project === (p.title || p.label || p.id)));
    const coverage = canonical.length > 0 ? matched.length / canonical.length : 0;
    const coverageScore = Math.round(coverage * 70);              // 70% del score
    const bonusForReasonableCount = (projectSops.length >= 3 && projectSops.length <= 20) ? 20 : 10;
    const noiseDeducation = Math.min(10, unexpectedSops.length);   // penalitza soroll excessiu
    const score = Math.max(0, Math.min(100, coverageScore + bonusForReasonableCount - noiseDeducation));

    const recommendations = [];
    if (missing.length) {
        recommendations.push('Considera afegir aquests SOPs canonical del sector ' + sectorId + ' · ' +
            missing.slice(0, 3).map(s => '"' + s.title + '"').join(' · '));
    }
    if (unexpectedSops.length > 5) {
        recommendations.push('Tens ' + unexpectedSops.length + ' SOPs que no matchen el catàleg canonical · revisa si tots són necessaris (KISS).');
    }
    if (coverage >= 0.8) {
        recommendations.push('Excel·lent cobertura · ' + Math.round(coverage * 100) + '% dels SOPs canonical del sector estan presents.');
    }
    return {
        score,
        coverage: Number(coverage.toFixed(2)),
        canonicalSopsTotal: canonical.length,
        matchedCount: matched.length,
        missingSops: missing,
        unexpectedSops,
        matched,
        recommendations,
        sectorId,
        projectId,
    };
}

// summarizeRubricResult · text curt per a UI / toast
export function summarizeRubricResult(result) {
    if (!result) return 'No evaluació disponible';
    if (result.note === 'no-canonical-defined') {
        return '⚠ Sector sense canonical SOPs declarats · score base 50';
    }
    const pct = Math.round(result.coverage * 100);
    const grade = result.score >= 85 ? '🏆 Excel·lent' :
                  result.score >= 70 ? '✓ Sòlid' :
                  result.score >= 50 ? '👍 Operatiu' :
                                       '🚧 Cal millorar';
    return `${grade} · ${result.score}/100 · ${pct}% cobertura SOPs canonical (${result.matchedCount}/${result.canonicalSopsTotal})`;
}

export const __test_helpers__ = { _parseSopsCanonical };
