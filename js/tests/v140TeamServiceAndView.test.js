// =============================================================================
// TEAMTOWERS SOS V11 — v140 · teamService + TeamView · TDD
// Ruta · /js/tests/v140TeamServiceAndView.test.js
//
// Verifica · teamService (RBAC matcher + members CRUD + invitations + audit
// log) + TeamView (5 tabs + render basics) + topbar antic eliminat de
// ProjectHubV2View.
// =============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    TEAM_VERSION, ROLE_CATALOG, ACTION_CATALOG, can,
    listMembers, addMember, removeMember, setRole,
    listInvitations, createInvitation, cancelInvitation,
    recordAuditEvent, listAuditLog,
} from '../core/teamService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

let pass = 0, fail = 0;
function ok(label, cond) { if (cond) { pass++; console.log('✓', label); } else { fail++; console.log('✗', label); } }

console.log('=== v140 · teamService + TeamView · TDD ===\n');

// ── KB mock minimal ────────────────────────────────────────────────────
function makeKbMock() {
    const store = new Map();
    return {
        store,
        getNode: async (id) => store.get(id) || null,
        upsert:  async (node) => { store.set(node.id, node); return node; },
        query:   async (filter) => Array.from(store.values()).filter(n => !filter?.type || n.type === filter.type),
    };
}

// ═════════════════════════════════════════════════════════════════════
// PART A · teamService API surface
// ═════════════════════════════════════════════════════════════════════
console.log('— A · teamService API');
ok('A · TEAM_VERSION = v140',                       TEAM_VERSION === 'v140');
ok('A · ROLE_CATALOG · 5 rols canonical',           ['founder','ops','contributor','viewer','invited'].every(r => ROLE_CATALOG[r]));
ok('A · ACTION_CATALOG · ≥ 15 accions',             ACTION_CATALOG.length >= 15);
ok('A · ACTION_CATALOG · inclou edit.canvas',       ACTION_CATALOG.includes('edit.canvas'));
ok('A · ACTION_CATALOG · inclou manage.finances',   ACTION_CATALOG.includes('manage.finances'));
ok('A · can() function',                            typeof can === 'function');
ok('A · listMembers/addMember/removeMember/setRole', [listMembers, addMember, removeMember, setRole].every(f => typeof f === 'function'));
ok('A · invitations API · 3 funcions',              [listInvitations, createInvitation, cancelInvitation].every(f => typeof f === 'function'));
ok('A · audit API · recordAuditEvent + listAuditLog', typeof recordAuditEvent === 'function' && typeof listAuditLog === 'function');

// ═════════════════════════════════════════════════════════════════════
// PART B · can() · RBAC matcher
// ═════════════════════════════════════════════════════════════════════
console.log('\n— B · can() · RBAC matcher');
ok('B · founder · "*" wildcard · qualsevol acció',  can({ role: 'founder', action: 'edit.canvas' }) && can({ role: 'founder', action: 'manage.finances' }));
ok('B · ops · read.* wildcard',                     can({ role: 'ops', action: 'read.canvas' }) && can({ role: 'ops', action: 'read.kanban' }));
ok('B · ops · edit.canvas explicit',                can({ role: 'ops', action: 'edit.canvas' }));
ok('B · ops · edit.pact denegat',                  !can({ role: 'ops', action: 'edit.pact' }));
ok('B · ops · approve.wos.own · si actor==owner',  can({ role: 'ops', action: 'approve.wos.own', ownerDid: 'did:x', actorDid: 'did:x' }));
ok('B · ops · approve.wos (genèric · sense .own) DENEGAT',
                                                  !can({ role: 'ops', action: 'approve.wos' }));
ok('B · ops · approve.wos · diferent actor ≠ owner · denegat',
                                                  !can({ role: 'ops', action: 'approve.wos.own', ownerDid: 'did:a', actorDid: 'did:b' }));
ok('B · contributor · sense edit',                 !can({ role: 'contributor', action: 'edit.canvas' }));
ok('B · contributor · claim.wos',                   can({ role: 'contributor', action: 'claim.wos' }));
ok('B · viewer · read.canvas',                      can({ role: 'viewer', action: 'read.canvas' }));
ok('B · viewer · read.wallet denegat',             !can({ role: 'viewer', action: 'read.wallet' }));
ok('B · invited · res',                             !can({ role: 'invited', action: 'read.canvas' }));
ok('B · role inexistent · false',                  !can({ role: 'unknown', action: 'read.canvas' }));
ok('B · sense role · false',                       !can({ action: 'read.canvas' }));
ok('B · sense action · false',                     !can({ role: 'founder' }));

// ═════════════════════════════════════════════════════════════════════
// PART C · members CRUD
// ═════════════════════════════════════════════════════════════════════
console.log('\n— C · members CRUD');
{
    const kb = makeKbMock();
    const r0 = await listMembers({ projectId: 'p1', kb });
    ok('C · projecte buit · members [] · ok',        r0.ok === true && r0.members.length === 0);

    const r1 = await addMember({ projectId: 'p1', did: 'did:sos:alvaro', role: 'founder', name: 'Alvaro', kb });
    ok('C · add founder · ok',                       r1.ok === true && r1.member.role === 'founder');

    const r1b = await addMember({ projectId: 'p1', did: 'did:sos:alvaro', kb });
    ok('C · add duplicat · already-member',          r1b.ok === false && r1b.error === 'already-member');

    const r1c = await addMember({ projectId: 'p1', did: 'did:sos:maria', role: 'invalid', kb });
    ok('C · add amb role invàlid · unknown-role',    r1c.ok === false && r1c.error.includes('unknown-role'));

    const r1d = await addMember({ projectId: 'p1', kb });
    ok('C · add sense did · did-required',           r1d.ok === false && r1d.error === 'did-required');

    await addMember({ projectId: 'p1', did: 'did:sos:maria', role: 'ops', kb });

    const r2 = await listMembers({ projectId: 'p1', kb });
    ok('C · listMembers · 2',                        r2.members.length === 2);

    const r3 = await setRole({ projectId: 'p1', did: 'did:sos:maria', role: 'contributor', kb });
    ok('C · setRole ops→contributor · ok',           r3.ok === true && r3.member.role === 'contributor');

    const r3b = await setRole({ projectId: 'p1', did: 'did:unknown', role: 'ops', kb });
    ok('C · setRole did inexistent · not-found',     r3b.ok === false && r3b.error === 'not-found');

    const r4 = await removeMember({ projectId: 'p1', did: 'did:sos:maria', kb });
    ok('C · removeMember · ok',                      r4.ok === true);

    const r5 = await listMembers({ projectId: 'p1', kb });
    ok('C · després remove · 1 membre',              r5.members.length === 1 && r5.members[0].did === 'did:sos:alvaro');
}

// ═════════════════════════════════════════════════════════════════════
// PART D · invitations
// ═════════════════════════════════════════════════════════════════════
console.log('\n— D · invitations');
{
    const kb = makeKbMock();
    const i0 = await createInvitation({ projectId: 'p1', email: 'pau@x.com', role: 'contributor', kb });
    ok('D · createInvitation · ok · token format inv_',
                                                     i0.ok === true && i0.invitation.token.startsWith('inv_'));
    ok('D · invitation default expira en 7 dies',    i0.invitation.expiresAt > Date.now() + 6 * 24 * 60 * 60 * 1000);

    const i1 = await createInvitation({ projectId: 'p1', role: 'ops', kb });
    ok('D · sense email · email-required',           i1.ok === false && i1.error === 'email-required');

    const list = await listInvitations({ projectId: 'p1', kb });
    ok('D · listInvitations · 1 active',             list.invitations.length === 1);

    // Expired filter
    await createInvitation({ projectId: 'p1', email: 'old@x.com', role: 'viewer', expiresAt: Date.now() - 1000, kb });
    const list2 = await listInvitations({ projectId: 'p1', kb });
    ok('D · expirada filtrada · només 1 active',     list2.invitations.length === 1);

    const c0 = await cancelInvitation({ projectId: 'p1', token: i0.invitation.token, kb });
    ok('D · cancelInvitation · ok',                  c0.ok === true);

    const c1 = await cancelInvitation({ projectId: 'p1', token: 'inv_inexistent', kb });
    ok('D · cancel token inexistent · not-found',    c1.ok === false && c1.error === 'not-found');
}

// ═════════════════════════════════════════════════════════════════════
// PART E · audit log
// ═════════════════════════════════════════════════════════════════════
console.log('\n— E · audit log');
{
    const kb = makeKbMock();
    // Trigger events via addMember + setRole + createInvitation
    await addMember({ projectId: 'p1', did: 'did:x', role: 'ops', kb });
    await setRole({ projectId: 'p1', did: 'did:x', role: 'contributor', kb });
    await createInvitation({ projectId: 'p1', email: 'a@b.com', role: 'viewer', kb });

    const log = await listAuditLog({ projectId: 'p1', kb });
    ok('E · ≥ 3 events registrats',                  log.ok === true && log.events.length >= 3);
    ok('E · sort desc per ts (més recents primer)',  log.events.every((e, i) => i === 0 || (log.events[i-1].ts || 0) >= (e.ts || 0)));

    const filtered = await listAuditLog({ projectId: 'p1', actor: 'system', kb });
    ok('E · filter actor=system · funciona',         filtered.events.length >= 3);

    const empty = await listAuditLog({ projectId: 'inexistent', kb });
    ok('E · projectId inexistent · 0 events',        empty.events.length === 0);

    const r = await recordAuditEvent({ kb });
    ok('E · sense actor/action · actor-action-required',
                                                     r.ok === false && r.error === 'actor-action-required');
}

// ═════════════════════════════════════════════════════════════════════
// PART F · TeamView + route + nav entry
// ═════════════════════════════════════════════════════════════════════
console.log('\n— F · TeamView + route + nav entry');
const viewPath = path.join(ROOT, 'js/views/TeamView.js');
ok('F · TeamView existeix',                         fs.existsSync(viewPath));
const tv = fs.readFileSync(viewPath, 'utf8');
ok('F · imports teamService',                       tv.includes("from '../core/teamService.js'"));
ok('F · imports SubmenuTabs',                       tv.includes("from '../ui/SubmenuTabs.js'"));
ok('F · 5 tabs · overview/projects/roles/permissions/audit',
                                                    tv.includes("id: 'overview'") && tv.includes("id: 'projects'") &&
                                                    tv.includes("id: 'roles'") && tv.includes("id: 'permissions'") && tv.includes("id: 'audit'"));
ok('F · _renderOverview · agrega per did',          tv.includes('_renderOverview()') && tv.includes('byDid'));
ok('F · _renderPerProject · loop projects + listMembers',
                                                    tv.includes('_renderPerProject') && tv.includes('listMembers'));
ok('F · _renderRoles · ROLE_CATALOG',                tv.includes('_renderRoles') && tv.includes('ROLE_CATALOG'));
ok('F · _renderPermissionsMatrix · ACTION_CATALOG.map',
                                                    tv.includes('_renderPermissionsMatrix') && tv.includes('ACTION_CATALOG.map'));
ok('F · _renderAuditLog · listAuditLog crida',      tv.includes('_renderAuditLog') && tv.includes('listAuditLog'));
ok('F · destroy cleanup',                           tv.includes('destroy()') && tv.includes('this._cleanup'));

const router = fs.readFileSync(path.join(ROOT, 'js/router.js'), 'utf8');
ok('F · ruta /team registrada',                    router.includes("'/team'") && router.includes('TeamView.js'));

const nav = fs.readFileSync(path.join(ROOT, 'js/core/navService.js'), 'utf8');
ok('F · nav entry team · href /team · icon 👥',    nav.includes("id: 'team'") && nav.includes("href: '/team'") && nav.includes("icon: '👥'"));

// ═════════════════════════════════════════════════════════════════════
// PART G · ProjectHubV2View · topbar antic ELIMINAT
// ═════════════════════════════════════════════════════════════════════
console.log('\n— G · ProjectHubV2View · topbar inutil eliminada');
const v2 = fs.readFileSync(path.join(ROOT, 'js/views/ProjectHubV2View.js'), 'utf8');
ok('G · NO renderitza fila "🗼 Team..."',           !v2.includes('🗼 Team<span>Towers</span>'));
ok('G · NO renderitza "Project Hub v2 · 5-click rule"',
                                                    !v2.includes('Project Hub v2 · 5-click rule'));
ok('G · NO botó "Hub clàssic" al header sticky',    !v2.includes('class="hub-back"'));

console.log('\n' + pass + ' pass · ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
