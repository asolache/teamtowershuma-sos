// =============================================================================
// certificateReport.test.js · CERT-001 pas 3+4 · pure report generator tests
// =============================================================================

import {
    CERT_REPORT_VERSION,
    buildLedgerEntryAttestation,
    computeReportPeriod,
    buildCertificateMarkdown, buildCertificateHtml,
    buildCoSignRequest, listPendingCoSignRequests,
} from '../core/certificateReportService.js';
import { quickEntry } from '../core/ledgerService.js';

let pass = 0, fail = 0;
const t = (cond, msg) => { if (cond) { pass++; console.log('✓ ' + msg); } else { fail++; console.error('✘ ' + msg); } };
const eq = (a, b, msg) => t(a === b, msg + ' (expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a) + ')');

// ─── A · constants ────────────────────────────────────────────────────────
eq(CERT_REPORT_VERSION, '1.0',                                    'A · version');

// ─── B · buildLedgerEntryAttestation ─────────────────────────────────────
const entry = quickEntry({ projectId: 'p1', debitAccount: 'cash', creditAccount: 'revenue', amount: 500, date: '2026-01-01' });
const att = buildLedgerEntryAttestation({ entry, attesterDid: 'did:sos:alvaro', attesterHandle: '@alvaro' });
eq(att.type, 'attestation',                                       'B · type attestation');
eq(att.content.attestedId, entry.id,                              'B · attestedId · entry id');
eq(att.content.attestedType, 'ledger_entry',                      'B · attestedType');
eq(att.content.attestationKind, 'endorses-ledger-entry',          'B · attestationKind');
eq(att.content.attesterDid, 'did:sos:alvaro',                     'B · attesterDid');
eq(att.content.attesterHandle, '@alvaro',                         'B · attesterHandle');
t(typeof att.content.statement === 'string' && att.content.statement.length > 10, 'B · statement auto');
t(typeof att.content.issuedAt === 'string',                       'B · issuedAt ISO');
eq(att.projectId, 'p1',                                           'B · projectId passat');

// Custom statement
const att2 = buildLedgerEntryAttestation({ entry, attesterDid: 'did:sos:x', statement: 'Aval custom' });
eq(att2.content.statement, 'Aval custom',                         'B · custom statement');

// Throws
let threw = false;
try { buildLedgerEntryAttestation({}); } catch (_) { threw = true; }
t(threw,                                                          'B · sense entry throws');
threw = false;
try { buildLedgerEntryAttestation({ entry }); } catch (_) { threw = true; }
t(threw,                                                          'B · sense attesterDid throws');

// ─── C · computeReportPeriod ─────────────────────────────────────────────
const entries = [
    quickEntry({ projectId: 'p1', debitAccount: 'cash', creditAccount: 'equity', amount: 5000, date: '2026-01-01' }),
    quickEntry({ projectId: 'p1', debitAccount: 'expenses', creditAccount: 'cash', amount: 300, date: '2026-03-15' }),
    quickEntry({ projectId: 'p1', debitAccount: 'cash', creditAccount: 'revenue', amount: 1200, date: '2026-02-10' }),
];
const period = computeReportPeriod(entries);
eq(period.from, '2026-01-01',                                     'C · from earliest');
eq(period.to, '2026-03-15',                                       'C · to latest');
t(period.days > 70 && period.days < 80,                           'C · days ~73');
eq(period.count, 3,                                               'C · count 3');

// Empty
eq(computeReportPeriod([]).count, 0,                              'C · empty · count 0');
eq(computeReportPeriod(null).from, null,                          'C · null safe');

// ─── D · buildCertificateMarkdown · happy path ───────────────────────────
const project = { id: 'p1', nombre: 'Test Coop' };
const md = buildCertificateMarkdown({
    project, entries,
    certifierName: 'Alvaro Test',
    certifierDid:  'did:sos:alvaro',
});
t(md.startsWith('# Certificat'),                                  'D · markdown h1');
t(md.includes('Test Coop'),                                       'D · project name');
t(md.includes('did:sos:alvaro'),                                  'D · certifier DID');
t(md.includes('Alvaro Test'),                                     'D · certifier name');
t(md.includes('🥉') || md.includes('🥈') || md.includes('🥇') || md.includes('✏️'),
                                                                  'D · level icon present');
t(md.includes('## Resum'),                                        'D · section resum');
t(md.includes('## Estat patrimonial'),                            'D · section estat patrimonial');
t(md.includes('## P&L'),                                          'D · section P&L');
t(md.includes('| Categoria |'),                                   'D · markdown taula');
t(md.includes('## Metodologia'),                                  'D · methodology');
t(md.includes('## Verificabilitat'),                              'D · verifiability section');
t(md.includes('TeamTowers SOS V11'),                              'D · footer signature');

// Sense reasons
const md2 = buildCertificateMarkdown({ project, entries, includeReasons: false });
t(!md2.includes('## Raons del score'),                            'D · includeReasons:false · sense reasons');

// Sense rows
const md3 = buildCertificateMarkdown({ project, entries, includeRows: false });
t(!md3.includes('## Detall apunts'),                              'D · includeRows:false · sense rows');

// Throws sense project
threw = false;
try { buildCertificateMarkdown({}); } catch (_) { threw = true; }
t(threw,                                                          'D · sense project throws');

// Sense entries · igualment genera (empty audit)
const mdEmpty = buildCertificateMarkdown({ project, entries: [] });
t(mdEmpty.includes('# Certificat'),                               'D · empty entries · igualment genera');
t(mdEmpty.includes('Test Coop'),                                  'D · empty · project name');

// ─── E · buildCertificateHtml ────────────────────────────────────────────
const html = buildCertificateHtml({ project, entries });
t(html.startsWith('<!doctype html>'),                             'E · html doctype');
t(html.includes('<title>Test Coop · Certificat</title>'),         'E · html title');
t(html.includes('@page { size: A4'),                              'E · print css A4');
t(html.includes('Test Coop'),                                     'E · project name al body');
t(html.includes('<h1>Certificat de comptabilitat'),               'E · h1 text');
t(html.includes('<table>'),                                       'E · tables generated');
t(html.includes('window.print()'),                                'E · print button');
t(html.includes('@media print'),                                  'E · print media query');
t(html.includes('<code>'),                                        'E · inline code rendered');
t(html.includes('<strong>'),                                      'E · bold rendered');

// Throws sense project
threw = false;
try { buildCertificateHtml({}); } catch (_) { threw = true; }
t(threw,                                                          'E · sense project throws');

// ─── F · HTML escape safety ─────────────────────────────────────────────
const evilProject = { id: 'p1', nombre: '<script>alert(1)</script>' };
const htmlEvil = buildCertificateHtml({ project: evilProject, entries });
t(!htmlEvil.includes('<script>alert(1)</script>'),                'F · script tag escaped');
t(htmlEvil.includes('&lt;script&gt;'),                            'F · entities');

// ─── G · buildCoSignRequest (pas 5 · counter-party) ──────────────────────
const coReq = buildCoSignRequest({
    entry, requesterDid: 'did:sos:alvaro', requesterHandle: '@alvaro',
    coSignerHandle: '@bob',
});
eq(coReq.type, 'attestation',                                     'G · type attestation');
eq(coReq.content.attestationKind, 'co-signs-ledger-entry',        'G · kind co-signs-ledger-entry');
eq(coReq.content.attestedId, entry.id,                            'G · attestedId match');
eq(coReq.content.attesterHandle, '@bob',                          'G · attesterHandle prefixed @');
eq(coReq.content.status, 'pending',                               'G · status pending');
eq(coReq.content.requestedBy, 'did:sos:alvaro',                   'G · requestedBy DID');
eq(coReq.content.requestedByHandle, '@alvaro',                    'G · requestedByHandle');
t(coReq.content.statement.includes('alvaro') || coReq.content.statement.includes('contra-firma'),
                                                                  'G · statement informatiu');

// Acceptem handle sense @ inicial
const coReq2 = buildCoSignRequest({
    entry, requesterDid: 'did:sos:x', coSignerHandle: 'bob',
});
eq(coReq2.content.attesterHandle, '@bob',                         'G · handle sense @ → afegit');

// coSignerDid sense handle
const coReq3 = buildCoSignRequest({
    entry, requesterDid: 'did:sos:x', coSignerDid: 'did:sos:bob',
});
eq(coReq3.content.attesterDid, 'did:sos:bob',                     'G · coSignerDid preserved');
eq(coReq3.content.attesterHandle, null,                           'G · sense handle si sols DID');

// Throws
threw = false;
try { buildCoSignRequest({}); } catch (_) { threw = true; }
t(threw,                                                          'G · sense entry throws');
threw = false;
try { buildCoSignRequest({ entry }); } catch (_) { threw = true; }
t(threw,                                                          'G · sense requesterDid throws');
threw = false;
try { buildCoSignRequest({ entry, requesterDid: 'x' }); } catch (_) { threw = true; }
t(threw,                                                          'G · sense coSigner throws');

// ─── H · listPendingCoSignRequests ────────────────────────────────────────
const allAtts = [
    coReq,    // pending bob
    coReq2,   // pending bob (segon)
    coReq3,   // pending did:sos:bob
    buildLedgerEntryAttestation({ entry, attesterDid: 'did:sos:alvaro' }),   // not co-sign kind
    { type: 'attestation', content: { attestationKind: 'co-signs-ledger-entry', status: 'signed', attesterHandle: '@bob' } },   // already signed
    { type: 'other', content: {} },     // wrong type
];

const pendBob = listPendingCoSignRequests({ attestations: allAtts, handle: '@bob' });
eq(pendBob.length, 2,                                             'H · bob · 2 pending');

const pendBobNoAt = listPendingCoSignRequests({ attestations: allAtts, handle: 'bob' });
eq(pendBobNoAt.length, 2,                                         'H · bob sense @ · same result');

const pendByDid = listPendingCoSignRequests({ attestations: allAtts, did: 'did:sos:bob' });
eq(pendByDid.length, 1,                                           'H · per DID · 1 pending');

const pendOther = listPendingCoSignRequests({ attestations: allAtts, handle: 'nobody' });
eq(pendOther.length, 0,                                           'H · unknown · 0');

// Empty safe
eq(listPendingCoSignRequests({}).length, 0,                       'H · empty · 0');
eq(listPendingCoSignRequests({ attestations: [] }).length, 0,     'H · empty array · 0');

console.log('\n---\n' + pass + ' pass · ' + fail + ' fail\n');
if (fail > 0) process.exit(1);
