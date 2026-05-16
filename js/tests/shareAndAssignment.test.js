// SOCIAL-SHARE/WO/GITHUB · 3 services tests
import {
    buildShareConfig, inviteUser, uninviteUser, setPublic, setPrivate,
    rotatePublicToken, canView, canEdit, buildShareUrl, summarizeShareConfig,
    ACCESS_LEVELS,
} from '../core/projectShareService.js';
import {
    buildAssignment, canClaim, claim, complete, unclaim, describeAssignment,
} from '../core/woAssignmentService.js';
import {
    buildIssueComposeUrl, buildPrComposeUrl, woToIssueMarkdown,
    buildIssueFromWo, buildPrFromWo, linkToGitHubProfile,
    detectGitHubLogin, describePrCapability,
} from '../core/githubBridgeService.js';

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== SOCIAL-SHARE + WO-ASSIGN + GITHUB-BRIDGE ===\n');

// ─── PROJECT SHARE ───────────────────────────────────────────────────────

t(Array.isArray(ACCESS_LEVELS) && ACCESS_LEVELS.length === 3, 'A · 3 access levels');

// Build
const cfg = buildShareConfig({ creatorHandle: 'alvaro', ts: 1000 });
eq(cfg.accessLevel, 'private',                           'A · default private');
eq(cfg.creatorHandle, '@alvaro',                         'A · normalized @ prefix');
eq(cfg.invitedHandles.length, 0,                         'A · no invited');

try { buildShareConfig({}); t(false, 'A · no creator · throws'); }
catch (_) { t(true, 'A · no creator · throws'); }

// invite
const cfg2 = inviteUser(cfg, 'maria');
eq(cfg2.invitedHandles.length, 1,                        'B · 1 invited');
eq(cfg2.invitedHandles[0], '@maria',                     'B · normalitzat');
eq(cfg2.accessLevel, 'shared',                           'B · auto-shared on first invite');

// Idempotent invite
const cfg2b = inviteUser(cfg2, 'maria');
eq(cfg2b.invitedHandles.length, 1,                       'B · invite idempotent');

// Self-invite throws
try { inviteUser(cfg, 'alvaro'); t(false, 'B · self-invite · throws'); }
catch (_) { t(true, 'B · self-invite · throws'); }

// Uninvite · back to private
const cfg3 = uninviteUser(cfg2, 'maria');
eq(cfg3.invitedHandles.length, 0,                        'B · uninvited · 0');
eq(cfg3.accessLevel, 'private',                          'B · auto-private quan cap invited');

// Public + token
const cfg4 = setPublic(cfg);
eq(cfg4.accessLevel, 'public',                           'C · public');
t(typeof cfg4.publicShareToken === 'string',             'C · token generated');
t(cfg4.publicShareToken.length >= 10,                    'C · token sufficient length');

// Rotate
const cfg5 = rotatePublicToken(cfg4);
t(cfg5.publicShareToken !== cfg4.publicShareToken,       'C · rotate genera nou token');

// setPrivate · revoca token
const cfg6 = setPrivate(cfg4);
eq(cfg6.publicShareToken, null,                          'C · setPrivate · token null');

// canView · matriu
eq(canView({ config: cfg, viewerHandle: 'alvaro' }), true,   'D · private · creator can view');
eq(canView({ config: cfg, viewerHandle: 'maria' }),  false,  'D · private · stranger no');
eq(canView({ config: cfg, viewerHandle: null }),     false,  'D · private · anonymous no');
eq(canView({ config: cfg4, viewerHandle: null }),    true,   'D · public · anonymous ok');
eq(canView({ config: cfg2, viewerHandle: 'maria' }), true,   'D · shared · invited ok');
eq(canView({ config: cfg2, viewerHandle: 'bob' }),   false,  'D · shared · uninvited no');
eq(canView({ config: cfg2, viewerHandle: 'bob', providedToken: cfg2.publicShareToken }), false,
                                                          'D · shared sense token · no fora invited');

// canEdit · més restrictiu
eq(canEdit({ config: cfg, viewerHandle: 'alvaro' }), true,   'E · creator can edit');
eq(canEdit({ config: cfg2, viewerHandle: 'maria' }), true,   'E · invited can edit');
eq(canEdit({ config: cfg, viewerHandle: null }),    false,   'E · anonymous no edit');
eq(canEdit({ config: cfg4, viewerHandle: 'random' }), false, 'E · public no edit (read-only)');

// buildShareUrl
const url = buildShareUrl({ projectId: 'proj-x', config: cfg4, baseOrigin: 'https://sos.test' });
t(url.includes('/project/proj-x'),                       'F · url path');
t(url.includes('token='),                                'F · public · té token');

const urlPrivate = buildShareUrl({ projectId: 'proj-y', config: cfg, baseOrigin: 'https://sos.test' });
t(!urlPrivate.includes('token='),                        'F · private · sense token');

// summarize
const sum = summarizeShareConfig(cfg2);
eq(sum.invitedCount, 1,                                  'F · stats invited count');
eq(sum.hasPublicLink, false,                             'F · stats no public link');

// ─── WO ASSIGNMENT ──────────────────────────────────────────────────────

const a1 = buildAssignment({ kind: 'open' });
eq(a1.kind, 'open',                                      'G · open assignment');
eq(a1.status, 'pending',                                 'G · default pending');

const a2 = buildAssignment({ kind: 'human', targetHandle: 'maria' });
eq(a2.targetHandle, '@maria',                            'G · human target normalitzat');

try { buildAssignment({ kind: 'inventat' }); t(false, 'G · bad kind throws'); }
catch (_) { t(true, 'G · bad kind throws'); }

// canClaim · open
eq(canClaim({ assignment: a1, claimerHandle: 'anyone' }).ok, true,  'H · open · anyone ok');

// canClaim · human-specific
eq(canClaim({ assignment: a2, claimerHandle: 'maria' }).ok, true,   'H · human-specific match');
eq(canClaim({ assignment: a2, claimerHandle: 'bob' }).ok, false,    'H · wrong human · no');

// canClaim · ai-claude
const a3 = buildAssignment({ kind: 'ai-claude' });
eq(canClaim({ assignment: a3, claimerAgentId: 'agent-claude-code' }).ok, true, 'H · ai-claude match');
eq(canClaim({ assignment: a3, claimerAgentId: 'agent-gpt-coder' }).ok, false, 'H · ai-claude · gpt no');

// canClaim · ai-with-cap
const a4 = buildAssignment({ kind: 'ai-with-cap', requiredCapabilities: ['code-write', 'test-run'] });
eq(canClaim({ assignment: a4, claimerAgentId: 'a1', claimerCapabilities: ['code-write', 'test-run', 'extra'] }).ok, true,
                                                          'H · cap match');
eq(canClaim({ assignment: a4, claimerAgentId: 'a1', claimerCapabilities: ['code-write'] }).ok, false,
                                                          'H · cap missing · no');

// claim · lifecycle
const claimed = claim({ assignment: a1, claimerHandle: 'maria', ts: 5000 });
eq(claimed.status, 'claimed',                            'I · claimed status');
eq(claimed.claimedBy, '@maria',                          'I · claimedBy');

// Re-claim (different) · fails
eq(canClaim({ assignment: claimed, claimerHandle: 'bob' }).ok, false, 'I · re-claim by other · no');
eq(canClaim({ assignment: claimed, claimerHandle: 'maria' }).ok, true, 'I · re-claim by self · ok');

// complete · unclaim
const done = complete({ assignment: claimed });
eq(done.status, 'completed',                             'I · complete');

eq(canClaim({ assignment: done, claimerHandle: 'anyone' }).ok, false, 'I · completed · no claim');

const unclaimed = unclaim({ assignment: claimed });
eq(unclaimed.status, 'pending',                          'I · unclaim · back to pending');
eq(unclaimed.claimedBy, null,                            'I · claimedBy null');

// describeAssignment
t(describeAssignment(a1).includes('Obert'),              'J · describe open');
t(describeAssignment(a2).includes('@maria'),             'J · describe human');
t(describeAssignment(a3).includes('Claude'),             'J · describe Claude');

// ─── GITHUB BRIDGE ──────────────────────────────────────────────────────

// Issue compose URL
const issueUrl = buildIssueComposeUrl({
    repo: 'asolache/teamtowershuma-sos',
    title: 'Fix nav bug',
    body: 'Detalls del bug...',
    labels: ['bug', 'mobile'],
    assignees: ['alvaro'],
});
t(issueUrl.startsWith('https://github.com/asolache/teamtowershuma-sos/issues/new'), 'K · issue URL path');
t(issueUrl.includes('title=Fix%20nav%20bug'),            'K · title encoded');
t(issueUrl.includes('labels=bug%2Cmobile'),              'K · labels encoded');
t(issueUrl.includes('assignees=alvaro'),                 'K · assignees');

// Repo normalization · https + .git stripped
const url2 = buildIssueComposeUrl({ repo: 'https://github.com/foo/bar.git', title: 't' });
t(url2.includes('/foo/bar/issues/new'),                  'K · https + .git normalitzats');

try { buildIssueComposeUrl({ repo: 'invalid-no-slash' }); t(false, 'K · invalid repo throws'); }
catch (_) { t(true, 'K · invalid repo throws'); }

// PR compose URL
const prUrl = buildPrComposeUrl({
    repo: 'asolache/teamtowershuma-sos',
    base: 'main',
    head: 'feature/x',
    title: 'feat · x',
    body: 'PR body',
});
t(prUrl.includes('/compare/main...feature%2Fx'),         'L · PR compare URL');
t(prUrl.includes('quick_pull=1'),                        'L · quick_pull flag');
t(prUrl.includes('title=feat%20%C2%B7%20x'),             'L · title encoded');

try { buildPrComposeUrl({ repo: 'a/b' }); t(false, 'L · no head throws'); }
catch (_) { t(true, 'L · no head throws'); }

// woToIssueMarkdown
const wo = {
    id: 'wo-001',
    type: 'work_order',
    content: {
        title: 'Fix something',
        description: 'Long description...',
        priority: 'high',
        complexity: 'M',
        estimatedHours: 4,
        assignee: { kind: 'ai-any' },
        deliverable_test: { kind: 'test-suite', command: 'npm test' },
        projectId: 'proj-x',
    },
};
const md = woToIssueMarkdown(wo);
t(md.includes('Long description'),                       'M · description in md');
t(md.includes('**Priority** · high'),                    'M · priority metadata');
t(md.includes('SOS WO ID'),                              'M · wo id reference');

// buildIssueFromWo · convenience
const fullUrl = buildIssueFromWo({ wo, repo: 'a/b' });
t(fullUrl.includes('/a/b/issues/new'),                   'M · issue from wo · path');
t(fullUrl.includes('title=Fix%20something'),             'M · issue from wo · title');
t(fullUrl.includes('labels=sos-wo'),                     'M · auto labels sos-wo');
t(fullUrl.includes('ai-eligible'),                       'M · auto label ai-eligible');

// buildPrFromWo
const prFromWo = buildPrFromWo({ wo, repo: 'a/b', head: 'fix/wo-001' });
t(prFromWo.includes('/compare/main...fix%2Fwo-001'),     'N · PR from WO · branches');
t(prFromWo.includes('SOS%20WO'),                         'N · PR body references WO');

// linkToGitHubProfile
eq(linkToGitHubProfile('alvaro'), 'https://github.com/alvaro', 'O · profile URL');
eq(linkToGitHubProfile('@alvaro'), 'https://github.com/alvaro','O · strip @');
eq(linkToGitHubProfile(null), null,                      'O · null · null');

// detectGitHubLogin · diverses formes
eq(detectGitHubLogin({ content: { oauthProviders: { github: { login: 'gh1' } } } }), 'gh1', 'P · format A');
eq(detectGitHubLogin({ content: { githubLogin: 'gh2' } }), 'gh2',                      'P · format B');
eq(detectGitHubLogin({ content: { providers: [{ provider: 'github', login: 'gh3' }] } }), 'gh3', 'P · format C');
eq(detectGitHubLogin({}), null,                          'P · empty · null');
eq(detectGitHubLogin(null), null,                        'P · null safe');

// describePrCapability
const capNo = describePrCapability({ hasGithubToken: false });
eq(capNo.mode, 'compose-url',                            'Q · sense token · compose-url mode');
eq(capNo.canCreatePrDirectly, false,                     'Q · no direct PR');

const capYes = describePrCapability({ hasGithubToken: true });
eq(capYes.mode, 'api',                                   'Q · amb token · api mode');
eq(capYes.canCreatePrDirectly, true,                     'Q · direct PR ok');

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
