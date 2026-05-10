// TEAMTOWERS SOS V11 — PROJECT FILTER (UX-AUDIT-001 sprint H+)
//
// Helpers purs per separar projectes "reals" (creats per l'usuari)
// dels projectes test (creats per la suite tests.js i no rellevants
// per a l'experiència UI).
//
// Detecció:
//   - flag explícit `isTest: true`
//   - id que conté "test" (case-insensitive) · cobreix els patrons
//     dels tests: `proj-test`, `proj-test-h71-{ts}`, `proj-h13-test`
//
// `proj-colla-demo-v11` NO es filtra · és el demo project del
// catàleg SOC "La Colla" amb dades llegítimes.

export function isTestProject(p) {
    if (!p || typeof p.id !== 'string') return false;
    if (p.isTest === true) return true;
    return /test/i.test(p.id);
}

export function visibleProjects(projects) {
    return (projects || []).filter(p => p && !p.isArchived && !isTestProject(p));
}

export function archivedProjects(projects) {
    return (projects || []).filter(p => p && p.isArchived && !isTestProject(p));
}
