// IKIGAI-PERSISTENCE-FIX · regressió del bug post-merge PR #123
// Veure feedback usuari · "el ikigai sigue sin persistencia" · case-sensitivity.
//
// Bug · si `user_identity.content.handle = 'Alvaro'` (capital) i el
// `matriu_member.content.handle = 'alvaro'` (lowercase com fa `ensureMember`)
// · el find del Profile360View no troba el member · es desa ikigai a un
// member nou que després no es llegeix.

import { buildProfile360, ensureMember } from '../core/profile360Service.js';

let pass = 0, fail = 0;
const t  = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

console.log('\n=== IKIGAI-PERSISTENCE-FIX · regressió case-sensitivity ===\n');

// ─── A · ensureMember sempre lowercase ──────────────────────────────────
const identity = { id: 'id-1', type: 'user_identity', content: { primaryDid: 'did:sos:x', displayName: 'Àlvaro', handle: 'ALVARO', isPrimary: true } };
const { member: m1, created } = ensureMember({ handle: '@ALVARO', identityNode: identity });
t(created,                                               'A · ensureMember crea quan no existeix');
eq(m1.content.handle, 'alvaro',                          'A · handle desat lowercase');
eq(m1.id, 'member-alvaro',                               'A · id lowercase');

// ─── B · buildProfile360 troba member existent · idempotent ─────────────
// Cas real · l'usuari ja té matriu_member previ amb handle lowercase ·
// i a la nova sessió Profile360View pot tenir this._handle mixed case
const existing = {
    id: 'member-alvaro',
    type: 'matriu_member',
    content: {
        handle: 'alvaro',           // saved lowercase
        primaryDid: 'did:sos:x',
        ikigai: {
            dimensions: {
                loves: { items: ['cooperatives'] },
                goodAt: { items: ['arquitectura'] },
                worldNeeds: { items: ['x'] },
                paidFor: { items: ['y'] },
            },
        },
    },
};

// Si Profile360View passa handle='@Alvaro' (capital · com pot venir del URL)
// l'ikigai HA DE SER VISIBLE.
const profile = buildProfile360({
    handle: '@Alvaro',               // mixed case · risc real
    identityNode: identity,
    member: existing,
    mode: 'me',
});
t(profile.zones.ikigai && profile.zones.ikigai.present,  'B · ikigai visible amb handle mixed case · NO regression');
eq(profile.zones.ikigai.filledDims, 4,                   'B · 4 dimensions preservades');

// ─── C · ensureMember idempotent · si existing té diff case · retorna existing ──
// Aquesta és la nova garantia · cap creació duplicada
const { member: m2, created: c2 } = ensureMember({
    handle: '@Alvaro',
    identityNode: identity,
    existingMember: existing,
});
t(!c2,                                                   'C · existing present · no recrea');
eq(m2.id, existing.id,                                   'C · retorna mateix existing');

// ─── D · escenari complet · save→reload cicle simulat ───────────────────
// Step 1 · usuari obre /me · query KB · troba member 'alvaro' (lowercase)
// Step 2 · edit ikigai · save · member updated amb ikigai
// Step 3 · re-render · query KB · ha de trobar el mateix member amb ikigai
const KB_FAKE = new Map();
KB_FAKE.set(existing.id, { ...existing, content: { ...existing.content, ikigai: null } });

// Simulació · find logic amb case-insensitive (com al fix)
const findMember = (handle) => {
    const lc = handle.toLowerCase();
    return [...KB_FAKE.values()].find(m =>
        ('@' + (m.content?.handle || '').replace(/^@/, '').toLowerCase()) === lc
    ) || null;
};

let memberFound = findMember('@Alvaro');
t(memberFound !== null,                                  'D · find amb @Alvaro troba member lowercase');

// Simulate save
const updated = {
    ...memberFound,
    content: {
        ...memberFound.content,
        ikigai: {
            dimensions: {
                loves: { items: ['descentralització'] },
                goodAt: { items: ['VSM'] },
                worldNeeds: { items: ['xarxes coop'] },
                paidFor: { items: ['SOS dev'] },
            },
        },
    },
};
KB_FAKE.set(updated.id, updated);

// Re-render · find again
memberFound = findMember('@Alvaro');
t(memberFound && memberFound.content.ikigai,             'D · després del save · ikigai persisteix al member');
eq(memberFound.content.ikigai.dimensions.loves.items[0], 'descentralització', 'D · contingut correcte');

// ─── E · no es crea member duplicat post-save ───────────────────────────
const memberCount = [...KB_FAKE.values()].filter(n => n.type === 'matriu_member').length;
eq(memberCount, 1,                                       'E · només 1 matriu_member (cap duplicat)');

console.log(`\n${pass} pass · ${fail} fail\n`);
if (fail > 0) process.exit(1);
