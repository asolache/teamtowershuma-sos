// =============================================================================
// TEAMTOWERS SOS V11 — PROJECT HUB SERVICE (UX-001 sprint C + MKT-001 sprint B)
// Ruta: /js/core/projectHubService.js
//
// Helpers puros para el dashboard de proyecto · agregan datos del KB en
// shape consumible por la vista. Sin I/O · testeables sin IndexedDB.
// =============================================================================

// Stats agregados de un proyecto a partir de los nodos del KB.
// Devuelve { sops, workOrders: { backlog, doing, done, ledgered, total },
//            marketItems, ledgerEntries, woRolesAi, woRolesHuman, savingEur }
export function aggregateProjectStats({ projectId, nodes }) {
    if (!projectId || !Array.isArray(nodes)) return _emptyStats();
    const sops    = nodes.filter(n => n.type === 'sop'         && (n.projectId === projectId));
    const workOrders = nodes.filter(n => n.type === 'work_order' && (n.projectId === projectId));
    const marketItems = nodes.filter(n => n.type === 'market_item' && (n.content?.providerProjectId === projectId));
    const ledgerEntries = nodes.filter(n => n.type === 'ledger_entry' && (n.projectId === projectId));

    const woByStatus = { backlog: 0, doing: 0, done: 0, ledgered: 0, cancelled: 0 };
    for (const w of workOrders) {
        const s = w.content?.status || 'backlog';
        if (woByStatus[s] != null) woByStatus[s]++;
    }
    const woRolesAi    = workOrders.filter(w => w.content?.assignee?.kind === 'ai').length;
    const woRolesHuman = workOrders.filter(w => w.content?.assignee?.kind !== 'ai').length;
    const savingEur = ledgerEntries.reduce((acc, l) => acc + (Number(l.content?.savingEur) || 0), 0);

    return {
        sops:        sops.length,
        sopsList:    sops,
        workOrders: { ...woByStatus, total: workOrders.length, list: workOrders },
        marketItems: { count: marketItems.length, list: marketItems },
        ledgerEntries: { count: ledgerEntries.length, list: ledgerEntries },
        woRolesAi,
        woRolesHuman,
        savingEur,
    };
}

function _emptyStats() {
    return {
        sops: 0, sopsList: [],
        workOrders: { backlog: 0, doing: 0, done: 0, ledgered: 0, cancelled: 0, total: 0, list: [] },
        marketItems: { count: 0, list: [] },
        ledgerEntries: { count: 0, list: [] },
        woRolesAi: 0, woRolesHuman: 0, savingEur: 0,
    };
}

// Catálogo cerrado de las 6 herramientas del proyecto · UX-001 sprint C+D.
// Sprint C entrega los slots vacíos con CTA "próximamente". Sprint D los
// implementa progresivamente (algunos delegan a MAT-001 con Pact.sol).
export const PROJECT_TOOLS = Object.freeze([
    { id: 'pact',         icon: '📜', title: 'Pacto de socios',       hint: 'JSON canónico firmado EIP-712 · Pact.sol en Gnosis (MAT-001)', stub: true },
    { id: 'constitution', icon: '📋', title: 'Documento constitución', hint: 'Acta fundacional generada por IA desde plantilla por jurisdicción', stub: true },
    { id: 'tokenomics',   icon: '🪙', title: 'Plan tokenómico',        hint: 'Modelo utility/governance/revenue · supply · vesting · BACK-007', stub: true },
    { id: 'accounting',   icon: '📊', title: 'Contabilidad de valor',  hint: 'Triple-entry ledger · econ + social + ambiental · attestations EAS', stub: false, route: '/kanban?project=' },
    { id: 'liquidity',    icon: '💧', title: 'Pools de liquidez',      hint: 'Mecanismo de exit sin disolver · AMM cooperativo · MAT-001', stub: true },
    { id: 'launchpad',    icon: '🚀', title: 'Llançadora pública',     hint: 'Landing del proyecto + ofertas del Mercado · subdominio matriu.coop', stub: true },
]);

// Catálogo cerrado de las 5 vistas operativas accesibles desde el hub.
// Cada slot tiene una rota dinámica que se compone con el projectId.
export const PROJECT_VIEWS = Object.freeze([
    { id: 'map',     icon: '🗺',  title: 'Mapa de valor',     route: '/map?project=',     hint: 'Grafo VNA con roles, transacciones y patrones' },
    { id: 'kanban',  icon: '📋', title: 'Kanban WOs',         route: '/kanban?project=',  hint: 'Work Orders del proyecto · backlog → ledger' },
    { id: 'sops',    icon: '📜', title: 'SOPs del proyecto',  route: '/sops?project=',    hint: 'Procedimientos del cliente generados por rol' },
    { id: 'market',  icon: '🛒', title: 'Mercado del proyecto', route: '/market?project=', hint: 'Ofertas que el proyecto publica' },
    { id: 'tags',    icon: '🏷', title: 'Folksonomía',         route: '/tags?tag=project:', hint: 'Cloud de tags filtrado al proyecto' },
]);

// Helper · construye URLs operativas concretas a partir del projectId.
// Caso `tags`: el route ya incluye 'project:' como parte del query, sólo
// hay que añadir el id (encodeado). Para el resto de vistas el route ya
// trae '?project=' y se concatena el id encodeado.
export function projectViewUrls(projectId) {
    if (!projectId) return [];
    return PROJECT_VIEWS.map(v => ({ ...v, url: v.route + encodeURIComponent(projectId) }));
}
