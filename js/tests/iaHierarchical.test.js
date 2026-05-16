// IA-HIERARCHICAL-PROMPT-001 · tests (pure functions only · no real IA)
import { estimateHierarchicalSavings } from '../core/iaHierarchicalService.js';

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== IA-HIERARCHICAL-PROMPT-001 · estimateHierarchicalSavings ===\n');

// 1 · Default case · 8 items · expand 3 · estalvi clar
const s1 = estimateHierarchicalSavings({});
eq(s1.monolithic, 5000,                                  'A · default monolithic');
eq(s1.hierarchical, 500 + 3 * 600,                      'A · default hierarchical · outline + 3×SOP');
eq(s1.savings, 5000 - 2300,                              'A · savings · 2700');
t(s1.savingsPct >= 0.4 && s1.savingsPct <= 0.7,          `A · savings 40-70% · ${s1.savingsPct}`);

// 2 · Worst case · expand ALL items · estalvi mínim però pot ser positiu
const s2 = estimateHierarchicalSavings({ itemsCount: 8, itemsExpanded: 8 });
eq(s2.hierarchical, 500 + 8 * 600,                       'B · all expanded · 5300');
// 5300 > 5000 monolithic · savings negatiu
t(s2.savings < 0,                                        'B · all expanded · cost lleugerament superior (acceptable per qualitat)');

// 3 · Best case · només expandeix 1
const s3 = estimateHierarchicalSavings({ itemsCount: 8, itemsExpanded: 1 });
eq(s3.hierarchical, 500 + 600,                           'C · 1 expanded · 1100');
t(s3.savingsPct >= 0.7,                                  `C · 1 expanded · estalvi >70% · ${s3.savingsPct}`);

// 4 · Few items
const s4 = estimateHierarchicalSavings({ itemsCount: 3, itemsExpanded: 1, monolithicTokens: 2000 });
eq(s4.monolithic, 2000,                                  'D · custom monolithic');
t(s4.savings >= 0,                                       'D · few items · still positive');

// 5 · Big SOC
const s5 = estimateHierarchicalSavings({ itemsCount: 15, itemsExpanded: 4, monolithicTokens: 8000 });
t(s5.savingsPct >= 0.5,                                  `E · big SOC · estalvi >50% · ${s5.savingsPct}`);

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
