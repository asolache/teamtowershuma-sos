#!/usr/bin/env node
// =============================================================================
// scripts/backlog-yaml-to-json.js · AGENT-BRIDGE-001 sprint B
//
// Converteix docs/backlog.yaml → docs/backlog.json amb un parser YAML mínim
// adaptat al nostre schema. Pure (zero deps externes). Ús · node aquest fitxer.
// =============================================================================

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const IN_PATH  = join(__dirname, '..', 'docs', 'backlog.yaml');
const OUT_PATH = join(__dirname, '..', 'docs', 'backlog.json');

// ── Minimal YAML parser per al nostre schema ──────────────────────────────
// Suporta · scalars (string · number · bool · null) · arrays simples ·
// objects · multi-line strings amb `|`. NO suporta anchors · aliases ·
// flow style {} · YAML complet. Sufficient per al nostre fitxer.

function parseYaml(text) {
    const lines = text.split('\n');
    let idx = 0;

    const parseValue = (raw) => {
        const s = raw.trim();
        if (s === '' || s === '~' || s === 'null') return null;
        if (s === 'true')  return true;
        if (s === 'false') return false;
        if (/^-?\d+$/.test(s)) return parseInt(s, 10);
        if (/^-?\d+\.\d+$/.test(s)) return parseFloat(s);
        // Quoted strings
        if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
            return s.slice(1, -1);
        }
        // Flow-style array · ["a", "b"]
        if (s.startsWith('[') && s.endsWith(']')) {
            const inner = s.slice(1, -1).trim();
            if (inner === '') return [];
            return inner.split(',').map(part => parseValue(part.trim()));
        }
        return s;
    };

    const getIndent = (line) => {
        let i = 0;
        while (i < line.length && line[i] === ' ') i++;
        return i;
    };

    // stripInlineComment · treu ' # ...' del final de línia
    const stripInlineComment = (line) => {
        const hashIdx = line.indexOf(' #');
        return hashIdx >= 0 ? line.slice(0, hashIdx) : line;
    };

    // parseBlock · recursiu · respecta indentació
    function parseBlock(baseIndent) {
        const result = {};
        const arr = [];
        let isArray = null;
        while (idx < lines.length) {
            const rawLine = lines[idx];
            // Skip empty + pure comment lines
            if (rawLine.trim() === '' || rawLine.trim().startsWith('#')) { idx++; continue; }
            const indent = getIndent(rawLine);
            if (indent < baseIndent) break;
            if (indent > baseIndent) break;  // sub-block · gestionat per crida pare

            // Treu comments inline (després de ` #`)
            const line = stripInlineComment(rawLine);
            const content = line.slice(indent);

            // List item · "- ..."
            if (content.startsWith('- ')) {
                if (isArray === false) throw new Error('parseYaml · barrejat objecte+array a indent ' + baseIndent);
                isArray = true;
                const rest = content.slice(2);
                if (rest === '' || rest.startsWith('#')) {
                    // Item compost · objecte amb claus a indent+2
                    idx++;
                    arr.push(parseBlock(baseIndent + 2));
                } else if (rest.includes(':')) {
                    // Item amb primera clau inline · primer pair · després més claus al mateix nivell
                    const [k, vRaw] = splitKeyValue(rest);
                    const obj = {};
                    // Si v té contingut · escalar; si no · sub-block
                    if (vRaw.trim() === '' || vRaw.trim().startsWith('#')) {
                        idx++;
                        const sub = parseBlock(baseIndent + 4);
                        obj[k] = sub;
                    } else if (vRaw.trim() === '|') {
                        idx++;
                        obj[k] = parseMultiLine(baseIndent + 4);
                    } else {
                        obj[k] = parseValue(vRaw);
                        idx++;
                    }
                    // Llegir claus addicionals a indent+2 (dins del mateix item)
                    while (idx < lines.length) {
                        const rawNext = lines[idx];
                        if (rawNext.trim() === '' || rawNext.trim().startsWith('#')) { idx++; continue; }
                        const ni = getIndent(rawNext);
                        if (ni !== baseIndent + 2) break;
                        const nextLine = stripInlineComment(rawNext);
                        // Si comença amb '- ' és nou item de la llista superior · paramos
                        const nc = nextLine.slice(ni);
                        if (nc.startsWith('- ')) break;
                        // Parse com a key:value
                        const [k2, v2Raw] = splitKeyValue(nc);
                        if (v2Raw.trim() === '' || v2Raw.trim().startsWith('#')) {
                            idx++;
                            obj[k2] = parseBlock(baseIndent + 4);
                        } else if (v2Raw.trim() === '|') {
                            idx++;
                            obj[k2] = parseMultiLine(baseIndent + 4);
                        } else {
                            obj[k2] = parseValue(v2Raw);
                            idx++;
                        }
                    }
                    arr.push(obj);
                } else {
                    // Scalar list item
                    arr.push(parseValue(rest));
                    idx++;
                }
                continue;
            }

            // Key: value
            if (isArray === true) throw new Error('parseYaml · barrejat array+obj a indent ' + baseIndent);
            isArray = false;
            const [k, vRaw] = splitKeyValue(content);
            const v = vRaw.trim();
            if (v === '' || v.startsWith('#')) {
                // Sub-block
                idx++;
                result[k] = parseBlock(baseIndent + 2);
            } else if (v === '|') {
                idx++;
                result[k] = parseMultiLine(baseIndent + 2);
            } else {
                result[k] = parseValue(v);
                idx++;
            }
        }
        return isArray === true ? arr : result;
    }

    function parseMultiLine(baseIndent) {
        const collected = [];
        while (idx < lines.length) {
            const line = lines[idx];
            if (line.trim() === '') { collected.push(''); idx++; continue; }
            const indent = getIndent(line);
            if (indent < baseIndent) break;
            collected.push(line.slice(baseIndent));
            idx++;
        }
        return collected.join('\n').replace(/\n+$/, '');
    }

    function splitKeyValue(s) {
        const colonIdx = s.indexOf(':');
        if (colonIdx < 0) throw new Error('parseYaml · expected key:value · ' + s);
        return [s.slice(0, colonIdx).trim(), s.slice(colonIdx + 1)];
    }

    return parseBlock(0);
}

// ── Run ────────────────────────────────────────────────────────────────────

try {
    const yamlText = readFileSync(IN_PATH, 'utf8');
    const parsed = parseYaml(yamlText);
    const jsonText = JSON.stringify(parsed, null, 2) + '\n';
    writeFileSync(OUT_PATH, jsonText, 'utf8');
    console.log('✓ Generated ' + OUT_PATH);
    console.log('  · agents: ' + (parsed.agents?.length || 0));
    console.log('  · work_orders: ' + (parsed.work_orders?.length || 0));
} catch (err) {
    console.error('✗ Failed: ' + (err.message || err));
    process.exit(1);
}
