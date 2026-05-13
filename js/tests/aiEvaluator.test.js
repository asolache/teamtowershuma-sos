// IA-ROUTER-001 sprint C · tests stand-alone per aiEvaluatorService
// Ús: node js/tests/aiEvaluator.test.js

import * as svc from '../core/aiEvaluatorService.js';

let pass = 0, fail = 0;
function t(cond, msg) {
    if (cond) { pass++; console.log('✓ ' + msg); }
    else      { fail++; console.error('✘ ' + msg); }
}
function eq(a, b, msg) { t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')'); }

console.log('\n=== IA-ROUTER-001 sprint C · aiEvaluatorService ===\n');

// ─── A · unwrapFenced ──────────────────────────────────────────────────
eq(svc.unwrapFenced('plain text'),               'plain text',        'A · plain · no canvi');
eq(svc.unwrapFenced('```\nfenced\n```'),         'fenced',            'A · fenced sense lang');
eq(svc.unwrapFenced('```json\n{"a":1}\n```'),    '{"a":1}',           'A · fenced json');
eq(svc.unwrapFenced('```markdown\n# Hero\n```'), '# Hero',            'A · fenced markdown');
eq(svc.unwrapFenced(''),                          '',                 'A · empty · empty');
eq(svc.unwrapFenced(null),                        '',                 'A · null · empty');

// ─── B · markdownEvaluator · narrative ─────────────────────────────────
const mdEval = svc.markdownEvaluator({ minWords: 10, requireHeading: true });
const r1 = await mdEval({ text: '# Hero\n\nThis is a markdown text with enough words for the evaluator.' });
t(r1.ok && r1.score > 0,                                              'B · markdown OK · score > 0');

const r2 = await mdEval({ text: 'no heading just text with many words but no h1 at all really.' });
t(!r2.ok && r2.reason.includes('missing-heading'),                    'B · sense heading · denied');

const r3 = await mdEval({ text: '# Heading\nshort' });
t(!r3.ok && r3.reason.includes('too-short'),                          'B · too short · denied');

const r4 = await mdEval({ text: '' });
t(!r4.ok && r4.reason === 'empty-output',                             'B · empty · denied');

const r5 = await mdEval(null);
t(!r5.ok,                                                             'B · null · denied');

// Allow no-heading override
const mdNoHead = svc.markdownEvaluator({ minWords: 5, requireHeading: false });
const r6 = await mdNoHead({ text: 'just some plain text with words here please' });
t(r6.ok,                                                              'B · requireHeading=false · accepta sense heading');

// Fenced unwrap
const r7 = await mdEval({ text: '```markdown\n# Title\n\nA fenced markdown block with enough words and content here.\n```' });
t(r7.ok,                                                              'B · fenced unwrap · accepta');

// ─── C · cohesionEvaluator · value-map ─────────────────────────────────
const cohEval = svc.cohesionEvaluator({ requiredArrays: ['addRoles'], minItems: 1, maxItems: 5 });

const cOk = await cohEval({ text: JSON.stringify({ addRoles: [{ id: 'ai-r1', name: 'X' }] }) });
t(cOk.ok && cOk.parsed,                                               'C · cohesion OK · parsed present');

const cFew = await cohEval({ text: JSON.stringify({ addRoles: [] }) });
t(!cFew.ok && cFew.reason.includes('too-few'),                        'C · empty array · denied');

const cMany = await cohEval({ text: JSON.stringify({ addRoles: Array.from({length:10},(_,i)=>({id:'ai-r'+i})) }) });
t(!cMany.ok && cMany.reason.includes('too-many'),                     'C · over max · denied');

const cMissing = await cohEval({ text: JSON.stringify({ other: [] }) });
t(!cMissing.ok && cMissing.reason.includes('missing-or-not-array'),   'C · missing field · denied');

const cNotJson = await cohEval({ text: 'not json' });
t(!cNotJson.ok && cNotJson.reason.includes('not-json'),               'C · not-json · denied');

// Id prefix warn · score baix però ok=true
const cBadPrefix = await cohEval({ text: JSON.stringify({ addRoles: [{ id: 'wrong-prefix', name: 'X' }] }) });
t(cBadPrefix.ok && cBadPrefix.score < 1.0,                            'C · id prefix mal · warn (ok+score baix)');
t(cBadPrefix.reason && cBadPrefix.reason.includes('id-prefix-warn'),  'C · warn reason');

// ─── D · tagsEvaluator ─────────────────────────────────────────────────
const tagsEval = svc.tagsEvaluator({ minTags: 2, maxTags: 5 });

const tOk = await tagsEval({ text: JSON.stringify(['vision', 'strategy', 'cohort']) });
t(tOk.ok && tOk.parsed.length === 3,                                  'D · array tags · OK');

// {tags: [...]} variant
const tFromField = await tagsEval({ text: JSON.stringify({ tags: ['a', 'b', 'c'] }) });
t(tFromField.ok && tFromField.parsed.length === 3,                    'D · tags field · OK');

// Plain comma-separated · acceptat
const tPlain = await tagsEval({ text: 'vision, strategy, cohort, network' });
t(tPlain.ok && tPlain.parsed.length === 4,                            'D · plain comma · OK');

// Too few
const tFew = await tagsEval({ text: JSON.stringify(['onlyone']) });
t(!tFew.ok && tFew.reason.includes('too-few'),                        'D · too few · denied');

// Too many
const tMany = await tagsEval({ text: JSON.stringify(['a','b','c','d','e','f','g','h']) });
t(!tMany.ok && tMany.reason.includes('too-many'),                     'D · too many · denied');

// Invalid item (length > maxLength=30 default)
const tBig = await tagsEval({ text: JSON.stringify(['a', 'b', 'c'.repeat(100)]) });
t(!tBig.ok && tBig.reason.includes('invalid-tag'),                    'D · tag massa llarg · denied');

// ─── E · jsonShape ─────────────────────────────────────────────────────
const jsEval = svc.jsonShape(['description', 'productSuggestions']);
const jOk = await jsEval({ text: JSON.stringify({ description: 'd', productSuggestions: [] }) });
t(jOk.ok,                                                             'E · jsonShape · OK');

const jMissing = await jsEval({ text: JSON.stringify({ description: 'd' }) });
t(!jMissing.ok && jMissing.reason.includes('missing-field'),          'E · jsonShape · missing field denied');

// ─── F · auditEvaluator · word count + keywords ────────────────────────
const auditEval = svc.auditEvaluator({ minWords: 5, requiredKeywords: ['security', 'audit'] });

const aOk = await auditEval({ text: 'This is a security audit of the codebase analysis full report.' });
t(aOk.ok,                                                             'F · audit OK · keywords present');

const aMissing = await auditEval({ text: 'This is just an unrelated text without the keywords.' });
t(!aMissing.ok && aMissing.reason.includes('missing-keyword'),        'F · keyword missing · denied');

const aShort = await auditEval({ text: 'tiny' });
t(!aShort.ok && aShort.reason.includes('too-short'),                  'F · too short · denied');

// ─── G · defaultEvaluator ──────────────────────────────────────────────
const defEval = svc.defaultEvaluator();
const dOk = await defEval({ text: 'any text counts' });
t(dOk.ok && dOk.score === 0.8,                                        'G · default · accept · score 0.8');

const dEmpty = await defEval({ text: '   ' });
t(!dEmpty.ok,                                                         'G · whitespace · denied');

// ─── H · catàleg + getEvaluatorForTask ─────────────────────────────────
t(typeof svc.EVALUATORS_BY_TASK === 'object',                         'H · EVALUATORS_BY_TASK exportat');
t(svc.TASK_KINDS_WITH_EVALUATORS.length >= 10,                        'H · TASK_KINDS_WITH_EVALUATORS · ≥10');

// Cada task kind retorna un evaluator funcional
for (const kind of svc.TASK_KINDS_WITH_EVALUATORS) {
    const ev = svc.getEvaluatorForTask(kind);
    t(typeof ev === 'function',                                       'H · ' + kind + ' · evaluator és funció');
}

// Task kind invàlid · default evaluator
const unknownEv = svc.getEvaluatorForTask('unknown-task');
t(typeof unknownEv === 'function',                                    'H · unknown · default evaluator');
const rDef = await unknownEv({ text: 'something' });
t(rDef.ok,                                                            'H · unknown evaluator · accepta no-buit');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
