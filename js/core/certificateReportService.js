// =============================================================================
// TEAMTOWERS SOS V11 — CERTIFICATE REPORT SERVICE (CERT-001 pas 3+4)
// Ruta · /js/core/certificateReportService.js
//
// Pure · genera l'informe oficial de la comptabilitat de valor del projecte ·
// markdown estructurat + HTML print-css ready · per a auditors externs i
// imprimir / save as PDF des del navegador.
//
// També · auto-generació de attestation nodes que avalen ledger entries
// (pas 3 · automatitzar el proof attestation-id).
//
// PRINCIPIS · pure · injectable · zero KB · zero DOM (HTML és string).
// =============================================================================

import {
    computeBalanceSheet, computePLForPeriod,
    computeLedgerAuditScore, AUDIT_LEVEL_META, AUDIT_THRESHOLD_EUR,
    computeEntryAuditState,
} from './ledgerService.js';

export const CERT_REPORT_VERSION = '1.0';

// buildLedgerEntryAttestation · pure · construeix un attestation node que
// avala un ledger_entry · per al pas 3 "attestation-id proof".
//
// args ·
//   entry        · ledger_entry node a avalar
//   attesterDid  · DID del signant (project signing key o personal)
//   attesterHandle · @handle visible
//   statement    · text de l'aval ('Confirmo l'autenticitat de l'apunt N')
//   ts (opt)
//
// Retorna · attestation node (sense signature encara · cal signAttestation extern)
export function buildLedgerEntryAttestation({
    entry        = null,
    attesterDid  = null,
    attesterHandle = null,
    statement    = null,
    ts           = null,
} = {}) {
    if (!entry || !entry.id) throw new Error('entry required');
    if (!attesterDid) throw new Error('attesterDid required');
    const now = (typeof ts === 'number') ? ts : Date.now();
    return {
        id: 'att-ledger-' + entry.id.replace(/^le-/, '') + '-' + now.toString(36).slice(-5),
        type: 'attestation',
        projectId: entry.projectId,
        content: {
            attesterDid,
            attesterHandle,
            attestedId:   entry.id,
            attestedType: 'ledger_entry',
            attestationKind: 'endorses-ledger-entry',
            statement: statement || ('Confirmo l\'autenticitat de l\'apunt comptable ' + (entry.content?.description || entry.id)),
            issuedAt: new Date(now).toISOString(),
        },
        createdAt: now,
        updatedAt: now,
    };
}

// buildCoSignRequest · pure · genera attestation 'pending' per a un counter-party
// Es signa quan el coSigner ho accepta (en una altra sessió · amb la seva key).
// Fins llavors · existeix com a attestation node amb content.status='pending'.
//
// args ·
//   entry          · ledger_entry a co-firmar
//   requesterDid   · DID del que sol·licita la contra-signatura
//   requesterHandle · @handle
//   coSignerHandle · @handle del co-signer (sense @ acceptat també)
//   coSignerDid    · opcional · si conegut
//   statement      · text custom · default genèric
//   ts (opt)
//
// Retorna · attestation node sense signature · status='pending'
export function buildCoSignRequest({
    entry            = null,
    requesterDid     = null,
    requesterHandle  = null,
    coSignerHandle   = null,
    coSignerDid      = null,
    statement        = null,
    ts               = null,
} = {}) {
    if (!entry || !entry.id) throw new Error('entry required');
    if (!requesterDid) throw new Error('requesterDid required');
    if (!coSignerHandle && !coSignerDid) throw new Error('coSignerHandle o coSignerDid required');
    const now = (typeof ts === 'number') ? ts : Date.now();
    const cleanHandle = coSignerHandle ? String(coSignerHandle).replace(/^@/, '') : null;
    return {
        id: 'att-cosign-' + entry.id.replace(/^le-/, '') + '-' + (cleanHandle || 'did') + '-' + now.toString(36).slice(-5),
        type: 'attestation',
        projectId: entry.projectId,
        content: {
            // The co-signer és l'attester · però encara no ha signat
            attesterDid:    coSignerDid || null,
            attesterHandle: cleanHandle ? '@' + cleanHandle : null,
            attestedId:     entry.id,
            attestedType:   'ledger_entry',
            attestationKind: 'co-signs-ledger-entry',
            statement:       statement || ('Sol·licitat per ' + (requesterHandle || requesterDid) + ' · cal contra-firma per al cert audit'),
            status:          'pending',     // canviarà a 'signed' quan el cosigner signa amb la seva key
            requestedBy:     requesterDid,
            requestedByHandle: requesterHandle,
            issuedAt:        new Date(now).toISOString(),
        },
        createdAt: now,
        updatedAt: now,
    };
}

// acceptCoSignRequest · ASYNC · accept i sign the pending attestation amb la
// signing key del coSigner. Marca status='signed' + ancla signedAt + signs.
//
// args ·
//   pendingAttestation · attestation node amb status='pending'
//   accepterDid        · DID real del que accepta (s'ancla a attesterDid)
//   accepterHandle     · handle (s'ancla a attesterHandle)
//   privateJwk         · ECDSA P-256 private key del accepter
//
// Retorna · attestation node signed (status='signed' + content.signature)
export async function acceptCoSignRequest({
    pendingAttestation = null,
    accepterDid        = null,
    accepterHandle     = null,
    privateJwk         = null,
} = {}) {
    if (!pendingAttestation || !pendingAttestation.content) throw new Error('pendingAttestation required');
    if (pendingAttestation.content.attestationKind !== 'co-signs-ledger-entry') {
        throw new Error('not-a-cosign-request');
    }
    if (pendingAttestation.content.status === 'signed') {
        throw new Error('already-signed');
    }
    if (!accepterDid) throw new Error('accepterDid required');
    if (!privateJwk)  throw new Error('privateJwk required');

    const { signNode } = await import('./nodeSigningService.js');
    const cleanHandle = accepterHandle ? '@' + String(accepterHandle).replace(/^@/, '') : null;

    // Pre-update content abans de signar · canonical inclou tot
    const prep = {
        ...pendingAttestation,
        content: {
            ...pendingAttestation.content,
            attesterDid,
            attesterHandle: cleanHandle,
            status:         'signed',
            signedAt:       new Date().toISOString(),
        },
        updatedAt: Date.now(),
    };
    // Fix · usem accepterDid (no attesterDid no definit aquí)
    prep.content.attesterDid = accepterDid;

    return signNode({ node: prep, privateJwk });
}

// listPendingCoSignRequests · pure · llistar attestations on l'usuari (per
// handle o DID) està sol·licitat com a coSigner i encara és pending.
//
// args ·
//   attestations · array de attestation nodes
//   handle       · '@alvaro' o 'alvaro'
//   did          · opcional · 'did:sos:...'
//
// Retorna · array de attestation nodes filtered
export function listPendingCoSignRequests({ attestations = [], handle = null, did = null } = {}) {
    const h = handle ? String(handle).replace(/^@/, '').toLowerCase() : null;
    return (attestations || []).filter(a => {
        if (a?.type !== 'attestation') return false;
        const c = a.content || {};
        if (c.attestationKind !== 'co-signs-ledger-entry') return false;
        if (c.status !== 'pending') return false;
        const aHandle = c.attesterHandle ? String(c.attesterHandle).replace(/^@/, '').toLowerCase() : null;
        if (h && aHandle === h) return true;
        if (did && c.attesterDid === did) return true;
        return false;
    });
}

// computeReportPeriod · pure · retorna { from, to, days, count } per al
// rang d'entries · útil per als titles del certificat.
export function computeReportPeriod(entries) {
    if (!Array.isArray(entries) || entries.length === 0) {
        return { from: null, to: null, days: 0, count: 0 };
    }
    let from = null, to = null;
    for (const e of entries) {
        const d = e?.content?.date;
        if (!d) continue;
        if (!from || d < from) from = d;
        if (!to   || d > to)   to = d;
    }
    let days = 0;
    if (from && to) {
        days = Math.round((new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24));
    }
    return { from, to, days, count: entries.length };
}

// buildCertificateMarkdown · pure · genera report en Markdown
// per a imprimir / save as PDF / share. Auto-friendly per a auditors.
//
// args ·
//   project · project node (per titol)
//   entries · ledger_entry[]
//   options · { certifierName, certifierDid, includeReasons, includeRows }
//
// Retorna · string markdown
export function buildCertificateMarkdown({
    project        = null,
    entries        = [],
    certifierName  = null,
    certifierDid   = null,
    includeReasons = true,
    includeRows    = true,
} = {}) {
    if (!project) throw new Error('project required');
    const audit = computeLedgerAuditScore(entries);
    const meta = AUDIT_LEVEL_META[audit.level] || AUDIT_LEVEL_META.draft;
    const period = computeReportPeriod(entries);
    const bs = computeBalanceSheet(entries);
    const pl = computePLForPeriod(entries, {});
    const projectName = project.nombre || project.name || project.id;
    const today = new Date().toISOString().slice(0, 10);

    const lines = [];
    lines.push('# Certificat de comptabilitat de valor');
    lines.push('');
    lines.push('## ' + meta.icon + ' Nivell · ' + meta.label + ' (' + audit.score + '/100)');
    lines.push('');
    lines.push('**Projecte** · ' + projectName + ' (`' + project.id + '`)');
    lines.push('**Data emissió** · ' + today);
    if (certifierName) lines.push('**Certificat per** · ' + certifierName);
    if (certifierDid)  lines.push('**DID** · `' + certifierDid + '`');
    lines.push('**Versió report** · ' + CERT_REPORT_VERSION);
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## Resum');
    lines.push('');
    lines.push('- Entries comptables · **' + audit.counts.total + '**');
    if (period.from && period.to) {
        lines.push('- Període · **' + period.from + '** → **' + period.to + '** (' + period.days + ' dies)');
    }
    lines.push('- Quadrades (Σdebit = Σcredit) · **' + audit.counts.balanced + '/' + audit.counts.total + '**');
    lines.push('- Signades amb ECDSA · **' + audit.counts.signed + '/' + audit.counts.total + '**');
    lines.push('- Auditades (triple-entry · ≥2 proofs) · **' + audit.counts.audited + '/' + audit.counts.total + '**');
    if (audit.counts.needsProofs > 0) {
        lines.push('- Entries > €' + AUDIT_THRESHOLD_EUR + ' · **' + audit.counts.needsProofs + '** (necessiten ≥2 proofs)');
    }
    lines.push('');
    lines.push('## Estat patrimonial');
    lines.push('');
    lines.push('| Categoria | Total € |');
    lines.push('|---|---:|');
    lines.push('| Total actius | ' + bs.totalAssets.toFixed(2) + ' |');
    lines.push('| Total passius | ' + bs.totalLiabilities.toFixed(2) + ' |');
    lines.push('| Total capital (incl. retained) | ' + bs.totalEquity.toFixed(2) + ' |');
    lines.push('| **Verificació · A = P + C** | ' + (bs.balanced ? '✓ Quadrat' : '✗ DESCUADRAT diff ' + (bs.totalAssets - bs.totalLiabilitiesAndEquity).toFixed(2)) + ' |');
    lines.push('');
    lines.push('## P&L (acumulat)');
    lines.push('');
    lines.push('| Categoria | Total € |');
    lines.push('|---|---:|');
    lines.push('| Ingressos | ' + pl.revenue.toFixed(2) + ' |');
    lines.push('| Despeses | ' + pl.expenses.toFixed(2) + ' |');
    lines.push('| **Resultat** | **' + pl.profit.toFixed(2) + '** |');
    lines.push('');

    if (includeReasons && audit.reasons.length > 0) {
        lines.push('## Raons del score · ' + audit.reasons.length);
        lines.push('');
        for (const r of audit.reasons) {
            const icon = r.kind === 'positive' ? '✓' : (r.kind === 'penalty' ? '✗' : '⚠');
            lines.push('- ' + icon + ' ' + r.text);
        }
        lines.push('');
    }

    if (includeRows && entries.length > 0) {
        lines.push('## Detall apunts (' + entries.length + ')');
        lines.push('');
        lines.push('| Data | Descripció | Total € | Cert |');
        lines.push('|---|---|---:|---|');
        const sorted = entries.slice().sort((a, b) => (a.content?.date || '').localeCompare(b.content?.date || ''));
        for (const e of sorted) {
            const c = e.content || {};
            const debit = (c.legs || []).filter(l => l.side === 'debit').reduce((s, l) => s + (l.amount || 0), 0);
            const a = computeEntryAuditState(e);
            const lvlIcon = a.level === 'audited' ? '🛡' : (a.level === 'signed' ? '🔐' : '·');
            const lvlLabel = a.level + (a.proofsCount > 0 ? ' (' + a.proofsCount + 'p)' : '');
            lines.push('| ' + (c.date || '—') + ' | ' + (c.description || '').slice(0, 60).replace(/\|/g, '/') + ' | ' + debit.toFixed(2) + ' ' + (c.currency || 'EUR') + ' | ' + lvlIcon + ' ' + lvlLabel + ' |');
        }
        lines.push('');
    }

    lines.push('---');
    lines.push('');
    lines.push('## Metodologia · score 0-100');
    lines.push('');
    lines.push('- **Balanced** · 30 pts · cada entry té Σdebit = Σcredit (tol 0.01)');
    lines.push('- **Signed** · 30 pts · entries amb signatura ECDSA P-256 (`content.signature`)');
    lines.push('- **Audited** · 30 pts · entries amb total ≥ €' + AUDIT_THRESHOLD_EUR + ' tenen ≥2 proofs (triple-entry)');
    lines.push('- **Coverage** · 10 pts · projecte amb ≥3 entries (sense gaps)');
    lines.push('');
    lines.push('Proof kinds suportats · `arweave-txid` (permaweb anchor) · `polygon-txhash` (ERC-1155 fase 2) · `attestation-id` (counter-party signed) · `invoice-id` · `external-doc`.');
    lines.push('');
    lines.push('## Verificabilitat');
    lines.push('');
    lines.push('Cada entry signat pot ser verificat externament amb la public key ECDSA del DID del signant (`did:sos:...`). Els proofs de tipus `arweave-txid` poden ser consultats al gateway `https://arweave.net/{txid}`. Aquest certificat és lectura · revisar entries individualment per a auditoria forense.');
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('*Generat per **TeamTowers SOS V11** · sosteamtowers.com · certificateReportService v' + CERT_REPORT_VERSION + '*');

    return lines.join('\n');
}

// buildCertificateHtml · pure · transforma markdown en HTML simple
// print-css ready (sense dependencies externes · MD parser bàsic).
//
// args · iguals que buildCertificateMarkdown + opcional opts.title
// Retorna · string HTML complet (amb <html>...) per a window.open + print
export function buildCertificateHtml(args = {}) {
    const md = buildCertificateMarkdown(args);
    const title = (args.project?.nombre || args.project?.name || args.project?.id || 'SOS') + ' · Certificat';
    return _markdownToHtmlPrintable(md, title);
}

// _markdownToHtmlPrintable · interna · MD minimal parser per a render printable
function _markdownToHtmlPrintable(md, title = 'Certificat SOS') {
    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const lines = md.split('\n');
    const out = [];
    let inTable = false;
    let inList = false;
    for (const line of lines) {
        if (line.startsWith('# ')) {
            if (inList) { out.push('</ul>'); inList = false; }
            out.push('<h1>' + _inline(line.slice(2), esc) + '</h1>');
        } else if (line.startsWith('## ')) {
            if (inList) { out.push('</ul>'); inList = false; }
            out.push('<h2>' + _inline(line.slice(3), esc) + '</h2>');
        } else if (line.startsWith('---')) {
            if (inList) { out.push('</ul>'); inList = false; }
            out.push('<hr>');
        } else if (line.startsWith('- ')) {
            if (!inList) { out.push('<ul>'); inList = true; }
            out.push('<li>' + _inline(line.slice(2), esc) + '</li>');
        } else if (line.startsWith('|')) {
            if (inList) { out.push('</ul>'); inList = false; }
            // Skip separator lines
            if (/^\|[\s\-:|]+\|$/.test(line)) {
                if (!inTable) { out.push('<table>'); inTable = true; }
                continue;
            }
            const cells = line.split('|').slice(1, -1).map(c => c.trim());
            if (!inTable) { out.push('<table>'); inTable = true; }
            // Heuristic · primera fila és th si la següent és sep
            const isHeader = (lines[lines.indexOf(line) + 1] || '').startsWith('|---');
            const tag = isHeader ? 'th' : 'td';
            out.push('<tr>' + cells.map(c => '<' + tag + '>' + _inline(c, esc) + '</' + tag + '>').join('') + '</tr>');
        } else if (line.trim() === '') {
            if (inList) { out.push('</ul>'); inList = false; }
            if (inTable) { out.push('</table>'); inTable = false; }
            out.push('');
        } else {
            if (inList) { out.push('</ul>'); inList = false; }
            if (inTable) { out.push('</table>'); inTable = false; }
            out.push('<p>' + _inline(line, esc) + '</p>');
        }
    }
    if (inList) out.push('</ul>');
    if (inTable) out.push('</table>');

    const body = out.join('\n');

    return `<!doctype html>
<html lang="ca">
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<style>
    @page { size: A4; margin: 1.6cm 1.4cm; }
    body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.55; color: #1a1a2a; max-width: 760px; margin: 0 auto; padding: 1rem; }
    h1 { color: #1a1a2a; border-bottom: 3px solid #6366f1; padding-bottom: 0.4rem; }
    h2 { color: #6366f1; margin-top: 1.6rem; border-bottom: 1px solid #e5e5ea; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 0.8rem 0; }
    th { background: #f3f3f7; padding: 8px; text-align: left; font-size: 0.9rem; }
    td { padding: 6px 8px; border-bottom: 1px solid #e5e5ea; font-size: 0.9rem; }
    tr:last-child td { border-bottom: none; }
    code { background: #f3f3f7; padding: 1px 5px; border-radius: 3px; font-size: 0.85em; }
    ul { padding-left: 1.4rem; }
    li { margin: 4px 0; }
    hr { border: none; border-top: 1px solid #e5e5ea; margin: 1.4rem 0; }
    strong { color: #1a1a2a; }
    @media print {
        body { max-width: none; padding: 0; }
        h2 { page-break-after: avoid; }
        table { page-break-inside: avoid; }
    }
    .print-actions { position: fixed; top: 10px; right: 10px; }
    @media print { .print-actions { display: none; } }
    .print-btn { padding: 8px 14px; background: #6366f1; color: #fff; border: 0; border-radius: 4px; cursor: pointer; font-weight: 600; }
</style>
</head>
<body>
<div class="print-actions">
    <button class="print-btn" onclick="window.print()">🖨 Imprimir / PDF</button>
</div>
${body}
</body>
</html>`;
}

function _inline(text, esc) {
    // Bold + inline code
    return esc(text)
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}
