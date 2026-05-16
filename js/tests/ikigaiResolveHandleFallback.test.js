// IKIGAI · 2a regressió · fallback al DID quan identity NO té handle/displayName.
// Aquest era el bug arrel · usuari amb identity DID generada però sense
// editar perfil → _resolveMyHandle retornava null → "Cap identitat" pantalla →
// no es podia editar ikigai.

import { ensureMember } from '../core/profile360Service.js';

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== IKIGAI · 2a regressió · DID fallback ===\n');

// Simulació del helper _resolveMyHandle (extret de Profile360View)
function resolveHandleSim({ members = [], identities = [] } = {}) {
    const norm = (h) => h ? '@' + String(h).trim().replace(/^@/, '').toLowerCase() : null;
    const primary = members.find(m => m?.content?.isPrimary);
    if (primary?.content?.handle) return norm(primary.content.handle);
    const any = members[0];
    if (any?.content?.handle) return norm(any.content.handle);
    const id = identities.find(n => n?.content?.isPrimary) || identities[0];
    const h = id?.content?.handle || id?.content?.displayName;
    if (h) return norm(h);
    if (id?.content?.primaryDid) {
        const didSlug = String(id.content.primaryDid).replace(/^did:sos:/, '').slice(0, 12);
        return norm('user-' + didSlug);
    }
    return null;
}

// ─── A · cas critic original · identity SENSE handle ni displayName ────
{
    const identity = {
        id: 'identity-x',
        type: 'user_identity',
        content: { primaryDid: 'did:sos:abc123xyz789', isPrimary: true, displayName: '', handle: '' },
    };
    const h = resolveHandleSim({ members: [], identities: [identity] });
    t(h !== null,                                            'A · handle NO null amb DID fallback');
    t(h.startsWith('@user-'),                                'A · fallback handle format · @user-{slug}');
    t(h.includes('abc123xyz789'),                            'A · contains DID slug');
}

// ─── B · cas existing handle · té prioritat ────────────────────────────
{
    const identity = {
        id: 'identity-x',
        type: 'user_identity',
        content: { primaryDid: 'did:sos:xxx', displayName: 'Àlvaro', handle: 'alvaro', isPrimary: true },
    };
    const h = resolveHandleSim({ identities: [identity] });
    eq(h, '@alvaro',                                          'B · handle explicit té prioritat sobre DID fallback');
}

// ─── C · cas displayName sense handle ──────────────────────────────────
{
    const identity = {
        id: 'identity-x',
        type: 'user_identity',
        content: { primaryDid: 'did:sos:y', displayName: 'María García', handle: '', isPrimary: true },
    };
    const h = resolveHandleSim({ identities: [identity] });
    t(h.startsWith('@maría'),                                'C · displayName · lowercase preservant accent');
}

// ─── D · ensureMember amb handle del DID fallback ──────────────────────
{
    const identity = {
        id: 'identity-x',
        type: 'user_identity',
        content: { primaryDid: 'did:sos:abc123', isPrimary: true },
    };
    const h = resolveHandleSim({ identities: [identity] });
    const { member, created } = ensureMember({ handle: h, identityNode: identity });
    t(created,                                               'D · ensureMember crea amb DID-fallback handle');
    t(member.id.startsWith('member-user-'),                  'D · member id consistent · member-user-{slug}');
    t(member.content.handle.startsWith('user-'),             'D · content.handle lowercase sense @ ');
}

// ─── E · cap identity · cap fallback possible ──────────────────────────
{
    const h = resolveHandleSim({ identities: [], members: [] });
    eq(h, null,                                              'E · sense identity · null (correcte · trigger noIdentity)');
}

// ─── F · member primary té prioritat absoluta ──────────────────────────
{
    const member = {
        id: 'member-x',
        type: 'matriu_member',
        content: { handle: 'alice', isPrimary: true },
    };
    const identity = {
        id: 'identity-y',
        type: 'user_identity',
        content: { primaryDid: 'did:sos:bob', displayName: 'Bob', isPrimary: true },
    };
    const h = resolveHandleSim({ members: [member], identities: [identity] });
    eq(h, '@alice',                                          'F · member primary > identity displayName');
}

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
