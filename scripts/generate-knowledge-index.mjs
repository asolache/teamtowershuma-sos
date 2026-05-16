#!/usr/bin/env node
// Genera knowledge/_search-index.json amb tots els fitxers .md del knowledge/
// Pure · Node native · llegeix frontmatter YAML simple + body excerpt.
// Pensat per executar manualment o post-commit · NO runtime al navegador.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const KNOWLEDGE_DIR = path.join(REPO_ROOT, 'knowledge');
const OUTPUT = path.join(KNOWLEDGE_DIR, '_search-index.json');

// Skip patterns · no indexable
const SKIP_NAMES = new Set(['_README.md', '_LOG.md', '_index.md']);
const SKIP_DIRS  = new Set(['.git', 'node_modules']);

// _parseFrontmatter · pure · YAML-like simple parser (no nesting profund)
// Suporta strings · arrays inline · keywords · multi-line values amb |
function parseFrontmatter(content) {
    const m = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!m) return { frontmatter: {}, body: content };
    const yaml = m[1];
    const body = m[2];
    const fm = {};
    const lines = yaml.split('\n');
    let currentKey = null;
    let multiline = null;
    for (const line of lines) {
        if (line.trim() === '' || line.trim().startsWith('#')) continue;
        // Multi-line block continuation
        if (multiline) {
            if (line.startsWith('  ') || line.startsWith('\t')) {
                multiline.value += '\n' + line.trim();
                continue;
            } else {
                fm[multiline.key] = multiline.value.trim();
                multiline = null;
            }
        }
        // Key: value
        const kv = line.match(/^(\w[\w-]*):\s*(.*)$/);
        if (!kv) continue;
        const key = kv[1];
        let val = kv[2].trim();
        if (val === '|' || val === '>') {
            multiline = { key, value: '' };
            continue;
        }
        // Array inline · [a, b, c]
        if (val.startsWith('[') && val.endsWith(']')) {
            fm[key] = val.slice(1, -1).split(',').map(x => x.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
            continue;
        }
        // String · strip quotes
        val = val.replace(/^["']|["']$/g, '');
        fm[key] = val;
    }
    if (multiline) fm[multiline.key] = multiline.value.trim();
    return { frontmatter: fm, body };
}

function excerpt(body, max = 250) {
    const stripped = body
        .replace(/^#+\s+/gm, '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/\n+/g, ' ')
        .trim();
    return stripped.length <= max ? stripped : stripped.slice(0, max) + '…';
}

function walkDir(dir, list = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (SKIP_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walkDir(full, list);
        else if (entry.isFile() && entry.name.endsWith('.md') && !SKIP_NAMES.has(entry.name)) {
            list.push(full);
        }
    }
    return list;
}

const files = walkDir(KNOWLEDGE_DIR);
const items = files.map(full => {
    const rel = path.relative(REPO_ROOT, full);
    const knowledgeRel = path.relative(KNOWLEDGE_DIR, full);
    const content = fs.readFileSync(full, 'utf8');
    const { frontmatter, body } = parseFrontmatter(content);
    // Derive type from path or frontmatter
    const folder = knowledgeRel.split(path.sep)[0];
    const type = frontmatter.type || folder.replace(/s$/, '') || 'unknown';
    const title = frontmatter.id || path.basename(knowledgeRel, '.md');
    return {
        id:    frontmatter.id || knowledgeRel.replace(/[\/\\.]/g, '-').replace(/-md$/, ''),
        path:  rel,
        relpath: knowledgeRel.replace(/\\/g, '/'),
        folder,
        type,
        title,
        version: frontmatter.version || 'v1',
        status:  frontmatter.status || 'live',
        purpose: frontmatter.purpose || '',
        keywords: Array.isArray(frontmatter.keywords)
            ? frontmatter.keywords
            : (frontmatter.keywords ? String(frontmatter.keywords).split(',').map(s => s.trim()) : []),
        excerpt: excerpt(body),
        size:    body.length,
        // Extra fields used by roadmaps/search
        phase:           frontmatter.phase || null,
        sector_cnae:     frontmatter.sector_cnae || null,
        sos_context:     frontmatter.sos_context || null,
        sector_id:       frontmatter.sector_id || null,
        sector_name:     frontmatter.sector_name || null,
        scope:           frontmatter.scope || null,
        brand_owner:     frontmatter.brand_owner || null,
    };
}).sort((a, b) => a.relpath.localeCompare(b.relpath));

const out = {
    version:    'v1.0',
    generated:  new Date().toISOString(),
    totalFiles: items.length,
    items,
};

fs.writeFileSync(OUTPUT, JSON.stringify(out, null, 2));
console.log('✓ Generated', OUTPUT);
console.log('  · Files indexed ·', items.length);
console.log('  · Types ·', [...new Set(items.map(i => i.type))].join(', '));
console.log('  · Folders ·', [...new Set(items.map(i => i.folder))].join(', '));
