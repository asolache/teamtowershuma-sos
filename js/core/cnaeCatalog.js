// =============================================================================
// TEAMTOWERS SOS V11 — CNAE CATALOG (CNAE-PICKER sprint)
// Ruta · /js/core/cnaeCatalog.js
//
// Catàleg dels 21 codis CNAE (A-T + UV) amb labels descriptius en català.
// Font · Classificació Nacional d'Activitats Econòmiques (INE · estandar EU).
// Pure · zero deps · safe Node + browser.
//
// Per a sub-sectors (CNAE 2 dígits · J62 software vs J63 dades · etc.) ·
// WO pendent `wo-prompts-sector-deeper` al backlog.
// =============================================================================

export const CNAE_CATALOG_VERSION = 'v1.0';

export const CNAE_SECTORS = Object.freeze([
    { code: 'A',  label: 'Agricultura · ramaderia · silvicultura · pesca',          group: 'primari',     subhint: 'cooperatives agrícoles · explotacions · pesca · forest' },
    { code: 'B',  label: 'Indústries extractives',                                   group: 'primari',     subhint: 'mineria · pedreres · extracció energètica' },
    { code: 'C',  label: 'Indústria manufacturera',                                  group: 'secundari',   subhint: 'producció · transformació · maquinària · automoció · alimentació' },
    { code: 'D',  label: 'Energia · subministrament elèctric/gas',                   group: 'secundari',   subhint: 'renovables · distribució energètica · climatització' },
    { code: 'E',  label: 'Aigua · sanejament · gestió residus',                      group: 'secundari',   subhint: 'aigua · residus · medi ambient · reciclatge' },
    { code: 'F',  label: 'Construcció',                                              group: 'secundari',   subhint: 'obra civil · edificació · enginyeria · promoció immobiliària' },
    { code: 'G',  label: 'Comerç engròs i detall',                                   group: 'terciari',    subhint: 'retail · ecommerce · distribució · automoció venda' },
    { code: 'H',  label: 'Transport i emmagatzematge',                               group: 'terciari',    subhint: 'logística · paqueteria · transport persones · magatzem' },
    { code: 'I',  label: 'Hostaleria · restauració · turisme',                       group: 'terciari',    subhint: 'restaurants · hotels · càtering · turisme actiu' },
    { code: 'J',  label: 'Informació i comunicacions · TIC',                         group: 'terciari',    subhint: 'software · SaaS · telecom · media · editorials · audiovisual' },
    { code: 'K',  label: 'Activitats financeres i assegurances',                     group: 'terciari',    subhint: 'banca · fintech · assegurances · fons d\'inversió · cooperatives de crèdit' },
    { code: 'L',  label: 'Activitats immobiliàries',                                 group: 'terciari',    subhint: 'compra-venda · lloguer · gestió patrimonial · cohousing' },
    { code: 'M',  label: 'Professionals · científic · tècnic · consultoria',          group: 'terciari',    subhint: 'consultoria estratègica · I+D · advocats · enginyeria · disseny' },
    { code: 'N',  label: 'Activitats administratives i serveis auxiliars',           group: 'terciari',    subhint: 'lloguer maquinària · agències viatges · seguretat · neteja' },
    { code: 'O',  label: 'Administració pública · defensa',                          group: 'institucional', subhint: 'ajuntaments · diputacions · administració general · defensa' },
    { code: 'P',  label: 'Educació',                                                 group: 'institucional', subhint: 'escoles · universitats · acadèmies · formació professional · edtech' },
    { code: 'Q',  label: 'Sanitat i serveis socials',                                group: 'institucional', subhint: 'hospitals · CAPs · residències · serveis socials · biotech' },
    { code: 'R',  label: 'Arts · oci · entreteniment',                               group: 'creatiu',     subhint: 'arts escèniques · audiovisual · esports · biblioteques · museus' },
    { code: 'S',  label: 'Altres serveis · organitzacions ciutadanes',               group: 'creatiu',     subhint: 'associacions · ONGs · serveis personals · cooperatives ciutadanes' },
    { code: 'T',  label: 'Llars com a empleadores',                                  group: 'institucional', subhint: 'servei domèstic · cura familiar · ocupació domèstica' },
    { code: 'UV', label: 'Organismes internacionals · extraterritorials',            group: 'institucional', subhint: 'ONU · UE · ambaixades · ONGs internacionals' },
]);

// listCnaeGroups · agrupacions per <optgroup>
export const CNAE_GROUPS = Object.freeze([
    { id: 'primari',       label: 'Sector primari' },
    { id: 'secundari',     label: 'Sector secundari · indústria' },
    { id: 'terciari',      label: 'Sector terciari · serveis' },
    { id: 'institucional', label: 'Institucional · públic · educació · salut' },
    { id: 'creatiu',       label: 'Creatiu · cultural · ciutadà' },
]);

export function listCnae() {
    return CNAE_SECTORS.slice();
}

export function listCnaeByGroup() {
    const out = {};
    for (const g of CNAE_GROUPS) out[g.id] = [];
    for (const s of CNAE_SECTORS) {
        if (out[s.group]) out[s.group].push(s);
    }
    return out;
}

export function getCnae(code) {
    if (!code) return null;
    return CNAE_SECTORS.find(s => s.code === String(code).toUpperCase()) || null;
}

// renderCnaeOptionsHtml · genera <option> elements per a un <select> · amb
// optgroups per categoria. Inclou opció buida + "Altres" fallback.
export function renderCnaeOptionsHtml({ selected = '', includeEmpty = true, includeOther = true } = {}) {
    const byGroup = listCnaeByGroup();
    let html = '';
    if (includeEmpty) html += '<option value="">— Selecciona sector (opcional) —</option>';
    for (const g of CNAE_GROUPS) {
        const items = byGroup[g.id] || [];
        if (!items.length) continue;
        html += '<optgroup label="' + g.label + '">';
        for (const s of items) {
            const sel = (selected === s.code) ? ' selected' : '';
            html += '<option value="' + s.code + '"' + sel + '>' + s.code + ' · ' + s.label + '</option>';
        }
        html += '</optgroup>';
    }
    if (includeOther) html += '<option value="other">Altres · escriu al camp llibre →</option>';
    return html;
}
