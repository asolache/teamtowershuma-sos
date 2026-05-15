// =============================================================================
// TEAMTOWERS SOS V11 — GITHUB BRIDGE SERVICE (SOCIAL-GITHUB-001)
// Ruta · /js/core/githubBridgeService.js
//
// Pont SOS ↔ GitHub · permet ·
//   1. Generar URL de GitHub Issue compose amb dades pre-omplertes (KISS · no
//      cal token · l'usuari clica · GitHub obre amb forma pre-omplerta)
//   2. Generar URL de PR compose (mateix patró)
//   3. Link a perfil GitHub de l'usuari (existing OAuth)
//   4. Future · createIssueViaApi(token) i createPullViaApi(token) quan
//      tinguem el GitHub access token del OAuth flow (requereix scope `repo`).
//
// Aquesta peça resol "donar accés a un usuari · assignar-li WO · que pugui
// fer PR a main des de SOS · seguint GitHub OAuth" sense afegir scopes
// nous · 100% prelaunch-friendly · usuari signs amb el seu compte GitHub
// quan cliquen el link.
//
// Pure · zero DOM · zero KB.
// =============================================================================

// GITHUB_BASE per a override (testing · self-hosted enterprise)
const GITHUB_BASE = 'https://github.com';

function _esc(s) { return encodeURIComponent(String(s || '')); }

// _normalizeRepo · pure · valida format owner/repo
function _normalizeRepo(repo) {
    if (!repo || typeof repo !== 'string') return null;
    const m = repo.trim().replace(/^https?:\/\/github\.com\//i, '').match(/^([^\/\s]+)\/([^\/\s]+)/);
    if (!m) return null;
    return m[1] + '/' + m[2].replace(/\.git$/, '');
}

// buildIssueComposeUrl · pure · URL pre-omplerta per crear Issue
//
// args ·
//   repo · "owner/name"
//   title · text del títol (auto-trimmed 100)
//   body  · markdown body (5000 chars max recomanat)
//   labels · array de strings (els labels han d'existir al repo)
//   assignees · array de logins GitHub (han de ser collaborators)
//
// Retorna · URL string · click obre nova tab amb form pre-omplert
export function buildIssueComposeUrl({
    repo,
    title = '',
    body = '',
    labels = [],
    assignees = [],
} = {}) {
    const r = _normalizeRepo(repo);
    if (!r) throw new Error('buildIssueComposeUrl · repo invalid · ' + repo);
    const params = [];
    if (title) params.push('title=' + _esc(title.slice(0, 200)));
    if (body)  params.push('body='  + _esc(body.slice(0, 5000)));
    if (labels && labels.length) params.push('labels=' + _esc(labels.join(',')));
    if (assignees && assignees.length) params.push('assignees=' + _esc(assignees.join(',')));
    return GITHUB_BASE + '/' + r + '/issues/new' + (params.length ? '?' + params.join('&') : '');
}

// buildPrComposeUrl · pure · URL pre-omplerta per crear PR · request comparing
// branches
//
// args ·
//   repo · "owner/name"
//   base · branch destí (typically "main")
//   head · branch font · pot ser "owner:branch" si fork
//   title · pre-fill
//   body · pre-fill
export function buildPrComposeUrl({
    repo,
    base = 'main',
    head = null,
    title = '',
    body = '',
} = {}) {
    const r = _normalizeRepo(repo);
    if (!r) throw new Error('buildPrComposeUrl · repo invalid · ' + repo);
    if (!head) throw new Error('buildPrComposeUrl · head branch required');
    const params = [];
    params.push('quick_pull=1');
    if (title) params.push('title=' + _esc(title.slice(0, 200)));
    if (body)  params.push('body='  + _esc(body.slice(0, 5000)));
    return GITHUB_BASE + '/' + r + '/compare/' + _esc(base) + '...' + _esc(head) + '?' + params.join('&');
}

// woToIssueMarkdown · pure · serialitza un WO al format markdown estàndard
// per a GitHub Issue · llegible per humans i pels altres agents IA.
export function woToIssueMarkdown(wo, { includeMetadata = true } = {}) {
    if (!wo) return '';
    const c = wo.content || wo;
    const lines = [];
    if (c.description || c.body) {
        lines.push(c.description || c.body);
        lines.push('');
    }
    if (includeMetadata) {
        lines.push('---');
        lines.push('## SOS metadata');
        lines.push('');
        if (c.priority)    lines.push('- **Priority** · ' + c.priority);
        if (c.complexity)  lines.push('- **Complexity** · ' + c.complexity);
        if (c.estimatedHours) lines.push('- **Estimated hours** · ' + c.estimatedHours);
        if (c.assignee?.kind) lines.push('- **Assignee kind** · ' + c.assignee.kind + (c.assignee?.targetHandle ? ' · ' + c.assignee.targetHandle : ''));
        if (c.deliverable_test?.command) lines.push('- **DTD test** · `' + c.deliverable_test.command + '`');
        if (c.deliverableTest?.command) lines.push('- **DTD test** · `' + c.deliverableTest.command + '`');
        if (c.processId)   lines.push('- **Process** · `' + c.processId + '`');
        if (c.projectId)   lines.push('- **Project** · `' + c.projectId + '`');
        if (wo.id)         lines.push('- **SOS WO ID** · `' + wo.id + '`');
        lines.push('');
        lines.push('_Generat des de SOS V11 · TeamTowers · ' + new Date().toISOString().slice(0, 10) + '_');
    }
    return lines.join('\n');
}

// buildIssueFromWo · pure · combina · genera URL completa per a Issue compose
// des d'un WO node + repo target.
export function buildIssueFromWo({
    wo, repo, extraLabels = [], assignees = [],
} = {}) {
    if (!wo) throw new Error('buildIssueFromWo · wo required');
    const c = wo.content || wo;
    const title = (c.title || wo.id || 'SOS work order').slice(0, 200);
    const body = woToIssueMarkdown(wo);
    const labels = ['sos-wo', c.priority || 'medium'].concat(extraLabels);
    if (c.assignee?.kind === 'ai-claude' || c.assignee?.kind === 'ai-any') labels.push('ai-eligible');
    return buildIssueComposeUrl({ repo, title, body, labels, assignees });
}

// buildPrFromWo · pure · si l'usuari té branch local · genera PR URL
// (assume la branch ja existeix · això sols genera l'URL)
export function buildPrFromWo({
    wo, repo, base = 'main', head, additionalBody = '',
} = {}) {
    if (!wo) throw new Error('buildPrFromWo · wo required');
    if (!head) throw new Error('buildPrFromWo · head branch required');
    const c = wo.content || wo;
    const title = (c.title || 'SOS · ' + (wo.id || 'wo')).slice(0, 200);
    const body = [
        c.description || c.body || '',
        '',
        additionalBody,
        '',
        '---',
        '_Closes SOS WO `' + wo.id + '`_',
    ].filter(Boolean).join('\n');
    return buildPrComposeUrl({ repo, base, head, title, body });
}

// linkToGitHubProfile · pure · perfil GitHub d'un usuari per a /u/{handle}
export function linkToGitHubProfile(githubLogin) {
    if (!githubLogin) return null;
    return GITHUB_BASE + '/' + encodeURIComponent(githubLogin.replace(/^@/, ''));
}

// detectGitHubLogin · pure · busca github login al user_identity / matriu_member
// que té el OAuth provider linked (segons oauthService.linkProviderToIdentity).
export function detectGitHubLogin(identityOrMember) {
    if (!identityOrMember) return null;
    const c = identityOrMember.content || identityOrMember;
    // Format A · content.oauthProviders.github.login
    if (c.oauthProviders?.github?.login) return c.oauthProviders.github.login;
    // Format B · content.githubLogin
    if (c.githubLogin) return c.githubLogin;
    // Format C · content.providers (array · search by name)
    if (Array.isArray(c.providers)) {
        const gh = c.providers.find(p => p.provider === 'github' && p.login);
        if (gh) return gh.login;
    }
    return null;
}

// describePrCapability · pure · explica què es pot fer ara · futur
export function describePrCapability({ hasGithubToken = false } = {}) {
    if (hasGithubToken) {
        return {
            canCreateIssueDirectly: true,
            canCreatePrDirectly: true,
            mode: 'api',
            note: 'Token GitHub linked · l\'app pot crear Issue/PR directament via API · scopes: repo, write:discussion',
        };
    }
    return {
        canCreateIssueDirectly: false,
        canCreatePrDirectly: false,
        mode: 'compose-url',
        note: 'Sense token addicional · l\'usuari clica el botó · GitHub obre pre-omplert · usuari valida i envia',
    };
}
