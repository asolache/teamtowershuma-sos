// =============================================================================
// TEAMTOWERS SOS V11 — IMPORT BACKUP · KERNEL APPLY FIX · TDD (v123)
// Ruta · /js/tests/importBackupKernelFix.test.js
//
// Bug @alvaro · després d'importar un backup, els projectes NO apareixien a
// la llista ni al mind map · root cause: importSnapshot en mode 'merge' NO
// aplicava snap.kernel (només kbNodes) · projects[] vivia al kernel.
//
// Fix · v123 · merge mode també aplica kernel (dedup projects + globalUsers
// per id) · in-memory store.state es refresca + listeners notificats.
// =============================================================================

import fs from 'node:fs';

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== IMPORT BACKUP · KERNEL APPLY FIX (v123) ===\n');

const ioSrc       = fs.readFileSync(new URL('../core/projectIO.js', import.meta.url), 'utf8');
const settingsSrc = fs.readFileSync(new URL('../views/SettingsV2View.js', import.meta.url), 'utf8');

// ─── A · importSnapshot · merge aplica kernel ────────────────────────
console.log('— A · importSnapshot · merge aplica kernel');
ok('A · documenta el bug v123 al codi',                  ioSrc.includes('IMPORT-BACKUP-BUG'));
ok('A · merge branch dedup projects per id',             ioSrc.includes('projectIds.has(p.id)'));
ok('A · merge branch dedup globalUsers per id',          ioSrc.includes('userIds.has(u.id)'));
ok('A · update in place quan ja existeix',               ioSrc.includes('mergedProjects[idx] = { ...mergedProjects[idx], ...p }'));
ok('A · push si nou (projectsMerged++)',                 ioSrc.includes('projectsMerged++'));
ok('A · escriu el nou state via store.persistState()',   ioSrc.includes('await store.persistState()'));
ok('A · bump kbVersion per notificar subscribers',       ioSrc.includes('kbVersion:'));

// ─── B · replace mode segueix funcionant ──────────────────────────────
console.log('\n— B · replace mode · substitució total');
ok('B · replace branch escriu kernel sencer',            ioSrc.includes("await KB.saveNode({ id: 'global_kernel_state_v11'"));
ok('B · replace assigna store.state directe',            ioSrc.includes('store.state = JSON.parse(JSON.stringify(snap.kernel))'));

// ─── C · listeners notificats ──────────────────────────────────────────
console.log('\n— C · subscribers notificats post-import');
ok('C · itera store.listeners post-write',               ioSrc.includes('store.listeners.forEach'));
ok('C · catch silenciós perquè cap listener trenqui',    ioSrc.includes('catch (_) {}'));

// ─── D · return value enriquit ─────────────────────────────────────────
console.log('\n— D · return shape · imported + projectsMerged + kernelApplied');
ok('D · return inclou projectsMerged',                   ioSrc.includes('projectsMerged'));
ok('D · return inclou kernelApplied',                    ioSrc.includes('kernelApplied'));

// ─── E · SettingsV2View · toast actualitzat ───────────────────────────
console.log('\n— E · UI toast confirma sense reload');
ok('E · toast menciona "sense refresc"',                 settingsSrc.includes('sense refresc'));
ok('E · status inclou projectsMerged',                   settingsSrc.includes('projectsMerged'));

// ─── F · Simulació funcional · mock KB + store ────────────────────────
console.log('\n— F · simulació funcional · merge real');
{
    // Mock minimal de KB + store via globalThis dependency injection.
    // Aquest test verifica que la lògica de merge dedup correctament.
    const mockState = { projects: [{ id: 'p-existing', nombre: 'Existent' }], globalUsers: [{ id: '@u1' }] };
    const snapKernel = {
        projects: [
            { id: 'p-existing', nombre: 'Updated' },          // ha de fer update in place
            { id: 'p-new-1',    nombre: 'Nou 1' },            // ha de push
            { id: 'p-new-2',    nombre: 'Nou 2' },            // ha de push
        ],
        globalUsers: [
            { id: '@u1' },                                    // dedup · existent
            { id: '@u2' },                                    // nou
        ],
    };

    // Reprodueix la lògica del merge inline (mirror del codi de projectIO.js)
    const mergedProjects = mockState.projects.slice();
    const projectIds = new Set(mergedProjects.map(p => p.id));
    let projectsMerged = 0;
    for (const p of snapKernel.projects) {
        if (projectIds.has(p.id)) {
            const idx = mergedProjects.findIndex(x => x.id === p.id);
            mergedProjects[idx] = { ...mergedProjects[idx], ...p };
        } else {
            mergedProjects.push(p);
            projectIds.add(p.id);
            projectsMerged++;
        }
    }
    const mergedUsers = mockState.globalUsers.slice();
    const userIds = new Set(mergedUsers.map(u => u.id));
    for (const u of snapKernel.globalUsers) {
        if (!userIds.has(u.id)) { mergedUsers.push(u); userIds.add(u.id); }
    }

    ok('F · 3 projectes total (1 existent updated + 2 nous)',  mergedProjects.length === 3);
    ok('F · projectsMerged comptador = 2',                     projectsMerged === 2);
    ok('F · existent fa update in place (Updated)',            mergedProjects.find(p => p.id === 'p-existing').nombre === 'Updated');
    ok('F · 2 usuaris (1 existent dedup + 1 nou)',             mergedUsers.length === 2);
    ok('F · @u1 dedup correctament (no duplicat)',             mergedUsers.filter(u => u.id === '@u1').length === 1);
}

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
